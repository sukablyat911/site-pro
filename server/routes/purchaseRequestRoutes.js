const express = require('express');
const crypto = require('node:crypto');
const mongoose = require('mongoose');
const { getAuthenticatedUser, requireAdmin } = require('../middleware/auth');

const router = express.Router();
const requests = () => mongoose.connection.collection('vehicle_purchase_requests');
const emailPattern = /^(?!\.)(?!.*\.\.)[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?(?:\.[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?)+$/i;

async function requireCustomer(req, res, next) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return res.status(401).json({ error: 'Accedi per richiedere l’acquisto.' });
    if (user.role !== 'user') return res.status(403).json({ error: 'Questa funzione è riservata agli account cliente.' });
    req.user = user;
    return next();
  } catch (error) {
    console.error('Purchase-request customer authorization failed:', error);
    return res.status(500).json({ error: 'Non è stato possibile verificare il tuo account.' });
  }
}

async function attachOptionalCustomer(req, res, next) {
  try {
    const user = await getAuthenticatedUser(req);
    if (user && user.role !== 'user') {
      return res.status(403).json({ error: 'Gli account amministratore non possono inviare richieste cliente.' });
    }
    req.user = user || null;
    return next();
  } catch (error) {
    console.error('Purchase-request customer authorization failed:', error);
    return res.status(500).json({ error: 'Non è stato possibile verificare il tuo account.' });
  }
}

function hashGuestEmail(email) {
  return crypto.createHash('sha256').update(email).digest('hex');
}

function requestView(request, includeContact = false) {
  return {
    id: request._id.toString(),
    vehicle: request.vehicle,
    status: request.status,
    createdAt: request.createdAt,
    termsAccepted: request.termsAccepted === true,
    termsAcceptedAt: request.termsAcceptedAt || null,
    ...(request.acceptedAt ? { acceptedAt: request.acceptedAt } : {}),
    ...(includeContact ? {
      customer: {
        id: request.ownerId?.toString() || null,
        ...request.customer,
      },
    } : {}),
  };
}

async function ensurePurchaseRequestIndexes() {
  const collection = requests();
  await collection.createIndex({ createdAt: -1 });
  const indexes = await collection.indexes();
  const ownerVehicleIndex = indexes.find((index) => index.name === 'ownerId_1_vehicleId_1');
  if (ownerVehicleIndex && (
    !ownerVehicleIndex.unique
    || ownerVehicleIndex.partialFilterExpression?.ownerId?.$type !== 'objectId'
    || Object.keys(ownerVehicleIndex.partialFilterExpression).length !== 1
  )) {
    await collection.dropIndex(ownerVehicleIndex.name);
  }
  await collection.createIndex(
    { ownerId: 1, vehicleId: 1 },
    { unique: true, partialFilterExpression: { ownerId: { $type: 'objectId' } } },
  );
  const guestEmailIndex = indexes.find((index) => index.name === 'guestEmailHash_1_vehicleId_1');
  if (guestEmailIndex && (
    !guestEmailIndex.unique
    || guestEmailIndex.partialFilterExpression?.guestEmailHash?.$type !== 'string'
    || Object.keys(guestEmailIndex.partialFilterExpression).length !== 1
  )) {
    await collection.dropIndex(guestEmailIndex.name);
  }
  await collection.createIndex(
    { guestEmailHash: 1, vehicleId: 1 },
    { unique: true, partialFilterExpression: { guestEmailHash: { $type: 'string' } } },
  );
  const settings = mongoose.connection.collection('app_settings');
  const migration = await settings.findOne({ _id: 'vehicle-offers-removed-v1' });
  if (!migration) {
    const oldOffers = await mongoose.connection.db.listCollections(
      { name: 'vehicle_offers' },
      { nameOnly: true },
    ).hasNext();
    if (oldOffers) await mongoose.connection.collection('vehicle_offers').drop();
    await settings.updateOne(
      { _id: 'vehicle-offers-removed-v1' },
      { $setOnInsert: { createdAt: new Date() } },
      { upsert: true },
    );
  }
}

router.post('/', attachOptionalCustomer, async (req, res) => {
  const vehicleId = typeof req.body?.vehicleId === 'string' ? req.body.vehicleId.trim() : '';
  const firstName = typeof req.body?.firstName === 'string' ? req.body.firstName.trim() : '';
  const lastName = typeof req.body?.lastName === 'string' ? req.body.lastName.trim() : '';
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const phone = typeof req.body?.phone === 'string' ? req.body.phone.trim() : '';
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(vehicleId)) {
    return res.status(400).json({ error: 'Seleziona un’auto valida.' });
  }
  if (firstName.length < 1 || firstName.length > 80 || lastName.length < 1 || lastName.length > 80) {
    return res.status(400).json({ error: 'Inserisci nome e cognome validi.' });
  }
  if (email.length > 254 || !emailPattern.test(email)) {
    return res.status(400).json({ error: 'Inserisci un indirizzo email valido.' });
  }
  if (phone.length < 6 || phone.length > 30) {
    return res.status(400).json({ error: 'Inserisci un numero di telefono valido.' });
  }
  if (req.body?.termsAccepted !== true) {
    return res.status(400).json({ error: 'Accetta i termini e le condizioni per proseguire.' });
  }

  const guestEmailHash = req.user ? null : hashGuestEmail(email);
  const duplicateFilter = req.user
    ? { ownerId: req.user._id, vehicleId }
    : { guestEmailHash, vehicleId };
  const duplicateMessage = req.user
    ? 'Hai già richiesto informazioni per questa auto.'
    : 'Hai già inviato una richiesta per questa auto con questo indirizzo email.';
  const session = await mongoose.startSession();
  let request;
  try {
    await session.withTransaction(async () => {
      const vehicle = await mongoose.connection.collection('vehicles').findOne(
        { id: vehicleId, type: 'buy' },
        { session },
      );
      if (!vehicle) {
        const error = new Error('L’auto non è più disponibile per l’acquisto.');
        error.statusCode = 404;
        throw error;
      }

      const existing = await requests().findOne(duplicateFilter, { session });
      if (existing) {
        const error = new Error(duplicateMessage);
        error.statusCode = 409;
        throw error;
      }

      const now = new Date();
      request = {
        ...(req.user ? { ownerId: req.user._id } : { guestEmailHash }),
        vehicleId,
        vehicle: {
          id: vehicle.id,
          make: vehicle.make,
          model: vehicle.model,
          year: vehicle.year,
          type: vehicle.type,
          price: vehicle.price,
          discountPrice: vehicle.discountPrice ?? null,
          discountEndsAt: vehicle.discountEndsAt ?? null,
          vatMode: vehicle.vatMode || 'inclusive',
          image: vehicle.image || vehicle.images?.[0] || '',
          images: vehicle.images || [vehicle.image].filter(Boolean),
          installmentPlan: vehicle.installmentPlan || null,
        },
        customer: {
          name: `${firstName} ${lastName}`,
          firstName,
          lastName,
          email,
          phone,
        },
        termsAccepted: true,
        termsAcceptedAt: now,
        status: 'pending',
        metricsRecorded: true,
        createdAt: now,
        updatedAt: now,
      };
      const result = await requests().insertOne(request, { session });
      request = { ...request, _id: result.insertedId };
      await mongoose.connection.collection('vehicles').updateOne(
        { id: vehicleId, type: 'buy' },
        { $inc: { purchaseRequestCount: 1 } },
        { session },
      );
      await mongoose.connection.collection('vehicle_daily_metrics').updateOne(
        { vehicleId, day: now.toISOString().slice(0, 10) },
        { $inc: { requests: 1 }, $setOnInsert: { views: 0 } },
        { upsert: true, session },
      );
    });
    return res.status(201).json({
      message: 'Richiesta inviata. Il concessionario ti contatterà per completare l’acquisto.',
      request: requestView(request),
    });
  } catch (error) {
    if (error.statusCode === 404 || error.statusCode === 409) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    if (error.code === 11000) return res.status(409).json({ error: duplicateMessage });
    console.error('Could not create vehicle purchase request:', error);
    return res.status(500).json({ error: 'Non è stato possibile inviare la richiesta di acquisto.' });
  } finally {
    await session.endSession();
  }
});

router.get('/mine', requireCustomer, async (req, res) => {
  res.set('Cache-Control', 'no-store');
  try {
    const list = await requests().find({ ownerId: req.user._id }).sort({ createdAt: -1 }).toArray();
    const requestedVehicleIds = list.map((request) => request.vehicleId);
    const soldVehicles = requestedVehicleIds.length
      ? await mongoose.connection.collection('vehicle_sales')
        .find({ vehicleId: { $in: requestedVehicleIds } }, { projection: { vehicleId: 1 } })
        .toArray()
      : [];
    const soldVehicleIds = new Set(soldVehicles.map((sale) => sale.vehicleId));
    const availableRequests = list.filter((request) => !soldVehicleIds.has(request.vehicleId));
    return res.json({ requests: availableRequests.map((request) => requestView(request)) });
  } catch (error) {
    console.error('Could not load customer purchase requests:', error);
    return res.status(500).json({ error: 'Non è stato possibile caricare le tue richieste di acquisto.' });
  }
});

router.get('/admin', requireAdmin, async (_req, res) => {
  res.set('Cache-Control', 'no-store');
  try {
    const list = await requests().find({}).sort({ createdAt: -1 }).toArray();
    return res.json({ requests: list.map((request) => requestView(request, true)) });
  } catch (error) {
    console.error('Could not load admin purchase requests:', error);
    return res.status(500).json({ error: 'Non è stato possibile caricare le richieste di acquisto.' });
  }
});

router.patch('/:id/accept', requireAdmin, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ error: 'Richiesta non valida.' });
  }

  try {
    const requestId = new mongoose.Types.ObjectId(req.params.id);
    const acceptedAt = new Date();
    const result = await requests().updateOne(
      { _id: requestId, status: { $ne: 'accepted' } },
      { $set: { status: 'accepted', acceptedAt, updatedAt: acceptedAt } },
    );
    const request = await requests().findOne({ _id: requestId });
    if (!request) return res.status(404).json({ error: 'Richiesta non trovata.' });
    if (result.modifiedCount === 0 && request.status !== 'accepted') {
      return res.status(409).json({ error: 'Non è stato possibile accettare la richiesta. Aggiorna la pagina e riprova.' });
    }

    return res.json({
      message: 'Richiesta di acquisto accettata.',
      request: requestView(request, true),
    });
  } catch (error) {
    console.error('Could not accept vehicle purchase request:', error);
    return res.status(500).json({ error: 'Non è stato possibile accettare la richiesta di acquisto.' });
  }
});

router.delete('/:id', requireCustomer, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ error: 'Richiesta non valida.' });
  }

  try {
    const result = await requests().deleteOne({
      _id: new mongoose.Types.ObjectId(req.params.id),
      ownerId: req.user._id,
    });
    if (result.deletedCount !== 1) return res.status(404).json({ error: 'Richiesta non trovata.' });
    return res.json({ message: 'Richiesta d’acquisto rimossa.' });
  } catch (error) {
    console.error('Could not delete customer purchase request:', error);
    return res.status(500).json({ error: 'Non è stato possibile rimuovere la richiesta d’acquisto.' });
  }
});

module.exports = { router, ensurePurchaseRequestIndexes };
