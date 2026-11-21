const express = require('express');
const crypto = require('node:crypto');
const mongoose = require('mongoose');
const { getAuthenticatedUser, requireAdmin } = require('../middleware/auth');

const router = express.Router();
const offers = () => mongoose.connection.collection('vehicle_price_offers');
const emailPattern = /^(?!\.)(?!.*\.\.)[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?(?:\.[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?)+$/i;

async function requireCustomer(req, res, next) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return res.status(401).json({ error: 'Accedi per proporre un prezzo.' });
    if (user.role !== 'user') return res.status(403).json({ error: 'Questa funzione è riservata agli account cliente.' });
    req.user = user;
    return next();
  } catch (error) {
    console.error('Vehicle price offer customer authorization failed:', error);
    return res.status(500).json({ error: 'Non è stato possibile verificare il tuo account.' });
  }
}

async function attachOptionalCustomer(req, res, next) {
  try {
    const user = await getAuthenticatedUser(req);
    if (user && user.role !== 'user') {
      return res.status(403).json({ error: 'Gli account amministratore non possono inviare proposte cliente.' });
    }
    req.user = user || null;
    return next();
  } catch (error) {
    console.error('Vehicle price offer customer authorization failed:', error);
    return res.status(500).json({ error: 'Non è stato possibile verificare il tuo account.' });
  }
}

function hashGuestEmail(email) {
  return crypto.createHash('sha256').update(email).digest('hex');
}

function getOfferHistory(offer) {
  if (Array.isArray(offer.history) && offer.history.length > 0) return offer.history;
  const history = [{
    actor: 'customer',
    amount: offer.amount,
    message: offer.message || '',
    createdAt: offer.createdAt,
  }];
  if (offer.counterAmount !== null && offer.counterAmount !== undefined) {
    history.push({
      actor: 'admin',
      amount: offer.counterAmount,
      message: '',
      createdAt: offer.respondedAt || offer.updatedAt || offer.createdAt,
    });
  }
  return history;
}

function offerView(offer, includeCustomer = false) {
  const history = getOfferHistory(offer);
  const latest = history[history.length - 1];
  return {
    id: offer._id.toString(),
    vehicle: offer.vehicle,
    amount: latest?.amount ?? offer.amount,
    message: offer.message || '',
    status: offer.status,
    counterAmount: offer.counterAmount ?? null,
    history,
    currentTurn: offer.status === 'pending' ? 'admin' : offer.status === 'countered' ? 'customer' : null,
    createdAt: offer.createdAt,
    respondedAt: offer.respondedAt || null,
    termsAccepted: offer.termsAccepted === true,
    termsAcceptedAt: offer.termsAcceptedAt || null,
    ...(includeCustomer ? {
      customer: {
        ...(offer.customer || {}),
        id: offer.ownerId?.toString() || null,
      },
    } : {}),
  };
}

async function ensureVehiclePriceOfferIndexes() {
  const collection = offers();
  await collection.createIndex({ createdAt: -1 });
  const indexes = await collection.indexes();
  const ownerVehicleIndex = indexes.find((index) => index.name === 'ownerId_1_vehicleId_1');
  if (ownerVehicleIndex && (
    !ownerVehicleIndex.unique
    || ownerVehicleIndex.partialFilterExpression?.status !== 'pending'
    || ownerVehicleIndex.partialFilterExpression?.ownerId?.$type !== 'objectId'
    || Object.keys(ownerVehicleIndex.partialFilterExpression).length !== 2
  )) {
    await collection.dropIndex(ownerVehicleIndex.name);
  }
  await collection.createIndex(
    { ownerId: 1, vehicleId: 1 },
    { unique: true, partialFilterExpression: { status: 'pending', ownerId: { $type: 'objectId' } } },
  );
  const guestEmailIndex = indexes.find((index) => index.name === 'guestEmailHash_1_vehicleId_1');
  if (guestEmailIndex && (
    !guestEmailIndex.unique
    || guestEmailIndex.partialFilterExpression?.status !== 'pending'
    || guestEmailIndex.partialFilterExpression?.guestEmailHash?.$type !== 'string'
    || Object.keys(guestEmailIndex.partialFilterExpression).length !== 2
  )) {
    await collection.dropIndex(guestEmailIndex.name);
  }
  await collection.createIndex(
    { guestEmailHash: 1, vehicleId: 1 },
    { unique: true, partialFilterExpression: { status: 'pending', guestEmailHash: { $type: 'string' } } },
  );
  await collection.createIndex({ vehicleId: 1, status: 1 });
}

router.post('/', attachOptionalCustomer, async (req, res) => {
  const vehicleId = typeof req.body?.vehicleId === 'string' ? req.body.vehicleId.trim() : '';
  const amount = typeof req.body?.amount === 'number' ? req.body.amount : Number.NaN;
  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const phone = typeof req.body?.phone === 'string' ? req.body.phone.trim() : '';
  const termsAccepted = req.body?.termsAccepted === true;
  const message = typeof req.body?.message === 'string' ? req.body.message.trim() : '';

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(vehicleId)) {
    return res.status(400).json({ error: 'Seleziona un’auto valida.' });
  }
  if (name.length < 2 || name.length > 80) {
    return res.status(400).json({ error: 'Inserisci un nome valido.' });
  }
  if (email.length > 254 || !emailPattern.test(email)) {
    return res.status(400).json({ error: 'Inserisci un indirizzo email valido.' });
  }
  if (phone.length < 6 || phone.length > 30) {
    return res.status(400).json({ error: 'Inserisci un numero di telefono valido.' });
  }
  if (!termsAccepted) {
    return res.status(400).json({ error: 'Accetta i termini e le condizioni per proseguire.' });
  }
  if (!Number.isFinite(amount) || amount <= 0 || Math.round(amount * 100) <= 0 || amount > 100000000) {
    return res.status(400).json({ error: 'Inserisci un importo valido.' });
  }
  if (message.length > 500) {
    return res.status(400).json({ error: 'Il messaggio non può superare 500 caratteri.' });
  }
  const guestEmailHash = req.user ? null : hashGuestEmail(email);
  const duplicateFilter = req.user
    ? { ownerId: req.user._id, vehicleId, status: { $in: ['pending', 'countered'] } }
    : { guestEmailHash, vehicleId, status: { $in: ['pending', 'countered'] } };
  const duplicateMessage = req.user
    ? 'Hai già una trattativa aperta per questa auto. Rispondi alla controfferta nella tua area personale.'
    : 'Hai già una proposta in attesa per questa auto con questo indirizzo email.';

  try {
    const vehicle = await mongoose.connection.collection('vehicles').findOne({ id: vehicleId, type: 'buy' });
    if (!vehicle) return res.status(404).json({ error: 'Questa auto non è più disponibile per la vendita.' });

    const now = new Date();
    const discountEnd = vehicle.discountEndsAt ? new Date(vehicle.discountEndsAt) : null;
    const hasActiveDiscount = Number.isFinite(vehicle.discountPrice)
      && vehicle.discountPrice > 0
      && vehicle.discountPrice < vehicle.price
      && (!discountEnd || discountEnd > now);
    const askingPrice = hasActiveDiscount ? vehicle.discountPrice : vehicle.price;
    const roundedAmount = Math.round(amount * 100) / 100;
    if (!Number.isFinite(askingPrice) || roundedAmount >= askingPrice) {
      return res.status(400).json({ error: 'La proposta deve essere inferiore al prezzo attuale dell’auto.' });
    }

    const existing = await offers().findOne(duplicateFilter);
    if (existing) {
      return res.status(409).json({ error: duplicateMessage });
    }

    const offer = {
      ...(req.user ? { ownerId: req.user._id } : { guestEmailHash }),
      vehicleId,
      vehicle: {
        id: vehicle.id,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        image: vehicle.image || vehicle.images?.[0] || '',
        askingPrice,
      },
      amount: roundedAmount,
      message,
      customer: { name, email, phone },
      termsAccepted: true,
      termsAcceptedAt: now,
      status: 'pending',
      history: [{ actor: 'customer', amount: roundedAmount, message, createdAt: now }],
      createdAt: now,
      updatedAt: now,
    };
    const result = await offers().insertOne(offer);
    return res.status(201).json({
      message: req.user
        ? 'Proposta inviata. Potrai seguirne l’esito nella tua area personale.'
        : 'Proposta inviata. Il concessionario ti ricontatterà usando i recapiti indicati.',
      offer: offerView({ ...offer, _id: result.insertedId }),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: duplicateMessage });
    }
    console.error('Could not create vehicle price offer:', error);
    return res.status(500).json({ error: 'Non è stato possibile inviare la proposta. Riprova.' });
  }
});

router.get('/mine', requireCustomer, async (req, res) => {
  res.set('Cache-Control', 'no-store');
  try {
    const list = await offers().find({ ownerId: req.user._id }).sort({ createdAt: -1 }).toArray();
    return res.json({ offers: list.map((offer) => offerView(offer)) });
  } catch (error) {
    console.error('Could not load customer vehicle price offers:', error);
    return res.status(500).json({ error: 'Non è stato possibile caricare le tue proposte di prezzo.' });
  }
});

router.get('/admin', requireAdmin, async (_req, res) => {
  res.set('Cache-Control', 'no-store');
  try {
    const list = await offers().find({}).sort({ createdAt: -1 }).toArray();
    return res.json({ offers: list.map((offer) => offerView(offer, true)) });
  } catch (error) {
    console.error('Could not load admin vehicle price offers:', error);
    return res.status(500).json({ error: 'Non è stato possibile caricare le proposte di prezzo.' });
  }
});

router.patch('/:id/respond', requireAdmin, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ error: 'Proposta non valida.' });
  }
  const status = req.body?.status;
  if (!['accepted', 'declined', 'countered'].includes(status)) {
    return res.status(400).json({ error: 'Seleziona un esito valido per la proposta.' });
  }

  const counterAmount = typeof req.body?.counterAmount === 'number' ? req.body.counterAmount : Number.NaN;
  const message = typeof req.body?.message === 'string' ? req.body.message.trim() : '';
  if (status === 'countered' && (!Number.isFinite(counterAmount) || counterAmount <= 0 || counterAmount > 100000000)) {
    return res.status(400).json({ error: 'Inserisci un importo valido per la controfferta.' });
  }
  if (message.length > 500) return res.status(400).json({ error: 'Il messaggio non può superare 500 caratteri.' });

  try {
    const offerId = new mongoose.Types.ObjectId(req.params.id);
    const current = await offers().findOne({ _id: offerId });
    if (!current) return res.status(404).json({ error: 'Proposta non trovata.' });
    if (current.status !== 'pending') {
      return res.status(409).json({ error: 'Questa proposta è già stata gestita.' });
    }
    if (status === 'countered' && !current.ownerId) {
      return res.status(409).json({
        error: 'Il cliente non ha un account: contattalo direttamente per telefono o email invece di inviare una controfferta.',
      });
    }

    const currentAmount = getOfferHistory(current).at(-1)?.amount ?? current.amount;
    const roundedCounter = Math.round(counterAmount * 100) / 100;
    if (status === 'countered'
      && (roundedCounter <= currentAmount || roundedCounter > current.vehicle.askingPrice)) {
      return res.status(400).json({ error: 'La controfferta deve superare la proposta e non superare il prezzo dell’auto.' });
    }

    const respondedAt = new Date();
    const history = getOfferHistory(current);
    if (status === 'countered') history.push({ actor: 'admin', amount: roundedCounter, message, createdAt: respondedAt });
    const result = await offers().updateOne(
      { _id: offerId, status: 'pending' },
      {
        $set: {
          status,
          ...(status === 'countered' ? { counterAmount: roundedCounter } : { counterAmount: null }),
          ...(status === 'countered' ? { history } : {}),
          respondedAt,
          updatedAt: respondedAt,
        },
      },
    );
    if (result.modifiedCount !== 1) {
      return res.status(409).json({ error: 'La proposta è stata aggiornata da un altro amministratore. Ricarica e riprova.' });
    }

    const updatedOffer = await offers().findOne({ _id: offerId });
    return res.json({
      message: status === 'accepted' ? 'Proposta accettata.' : status === 'declined' ? 'Proposta rifiutata.' : 'Controfferta inviata: ora attendi la risposta del cliente.',
      offer: offerView(updatedOffer, true),
    });
  } catch (error) {
    console.error('Could not respond to vehicle price offer:', error);
    return res.status(500).json({ error: 'Non è stato possibile aggiornare la proposta.' });
  }
});

router.patch('/:id/customer-response', requireCustomer, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: 'Proposta non valida.' });
  const status = req.body?.status;
  const amount = typeof req.body?.amount === 'number' ? req.body.amount : Number.NaN;
  const message = typeof req.body?.message === 'string' ? req.body.message.trim() : '';
  if (!['accepted', 'declined', 'countered'].includes(status)) return res.status(400).json({ error: 'Seleziona una risposta valida.' });
  if (status === 'countered' && (!Number.isFinite(amount) || amount <= 0 || amount > 100000000)) {
    return res.status(400).json({ error: 'Inserisci un importo valido per la controproposta.' });
  }
  if (message.length > 500) return res.status(400).json({ error: 'Il messaggio non può superare 500 caratteri.' });

  try {
    const offerId = new mongoose.Types.ObjectId(req.params.id);
    const current = await offers().findOne({ _id: offerId, ownerId: req.user._id });
    if (!current) return res.status(404).json({ error: 'Proposta non trovata.' });
    if (current.status !== 'countered') return res.status(409).json({ error: 'Questa trattativa non è in attesa della tua risposta.' });

    const history = getOfferHistory(current);
    const adminAmount = history.at(-1)?.amount ?? current.counterAmount;
    const roundedAmount = Math.round(amount * 100) / 100;
    if (status === 'countered' && (!Number.isFinite(adminAmount) || roundedAmount >= adminAmount || roundedAmount <= 0)) {
      return res.status(400).json({ error: 'La tua controproposta deve essere inferiore all’ultima cifra del concessionario.' });
    }

    const respondedAt = new Date();
    if (status === 'countered') history.push({ actor: 'customer', amount: roundedAmount, message, createdAt: respondedAt });
    const nextStatus = status === 'countered' ? 'pending' : status;
    const result = await offers().updateOne(
      { _id: offerId, ownerId: req.user._id, status: 'countered' },
      {
        $set: {
          status: nextStatus,
          ...(status === 'countered' ? { amount: roundedAmount, message, counterAmount: null, history } : {}),
          respondedAt,
          updatedAt: respondedAt,
        },
      },
    );
    if (result.modifiedCount !== 1) return res.status(409).json({ error: 'La trattativa è stata aggiornata. Ricarica e riprova.' });
    const updatedOffer = await offers().findOne({ _id: offerId });
    return res.json({
      message: status === 'accepted' ? 'Controfferta accettata. Ti contatteremo per i dettagli.' : status === 'declined' ? 'Controfferta rifiutata.' : 'Controproposta inviata: ora attendi la risposta del concessionario.',
      offer: offerView(updatedOffer),
    });
  } catch (error) {
    console.error('Could not respond to vehicle price offer as customer:', error);
    return res.status(500).json({ error: 'Non è stato possibile aggiornare la trattativa.' });
  }
});

module.exports = { router, ensureVehiclePriceOfferIndexes };
