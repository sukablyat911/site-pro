const express = require('express');
const mongoose = require('mongoose');
const { requireAdmin } = require('../middleware/auth');
const { isContactEmailConfigured, sendContactEmail } = require('../services/contactEmail');

const router = express.Router();
const requests = () => mongoose.connection.collection('rental_requests');
const validStatuses = new Set(['pending', 'contacted', 'confirmed', 'declined']);
const dayMilliseconds = 24 * 60 * 60 * 1000;
const emailPattern = /^(?!\.)(?!.*\.\.)[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?(?:\.[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?)+$/i;

function parseDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value ? null : date;
}

function confirmedRentalOverlapFilter(vehicleId, startDate, endDate, excludedId) {
  return {
    vehicleId,
    status: 'confirmed',
    startDate: { $lt: endDate },
    endDate: { $gt: startDate },
    ...(excludedId ? { _id: { $ne: excludedId } } : {}),
  };
}

async function ensureRentalRequestIndexes() {
  await requests().createIndex({ createdAt: -1 });
  await requests().createIndex({ status: 1, createdAt: -1 });
  await requests().createIndex({ vehicleId: 1, status: 1, startDate: 1, endDate: 1 });
}

router.get('/availability/:vehicleId', async (req, res) => {
  const { vehicleId } = req.params;
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(vehicleId)) {
    return res.status(400).json({ error: 'Identificativo auto non valido.' });
  }

  try {
    const vehicle = await mongoose.connection.collection('vehicles').findOne(
      { id: vehicleId, type: 'rent' },
      { projection: { _id: 1 } },
    );
    if (!vehicle) return res.status(404).json({ error: 'Questa auto non è più disponibile per il noleggio.' });
    const confirmedPeriods = await requests().find(
      { vehicleId, status: 'confirmed' },
      { projection: { _id: 0, startDate: 1, endDate: 1 } },
    ).toArray();
    res.set('Cache-Control', 'no-store');
    return res.json({ confirmedPeriods });
  } catch (error) {
    console.error('Could not load rental availability:', error);
    return res.status(500).json({ error: 'Non è stato possibile caricare il calendario.' });
  }
});

router.post('/', async (req, res) => {
  const vehicleId = typeof req.body?.vehicleId === 'string' ? req.body.vehicleId.trim() : '';
  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const phone = typeof req.body?.phone === 'string' ? req.body.phone.trim() : '';
  const message = typeof req.body?.message === 'string' ? req.body.message.trim() : '';
  const startDate = parseDate(req.body?.startDate);
  const endDate = parseDate(req.body?.endDate);

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(vehicleId)) {
    return res.status(400).json({ error: 'Seleziona un’auto a noleggio valida.' });
  }
  if (name.length < 2 || name.length > 80) {
    return res.status(400).json({ error: 'Il nome deve contenere da 2 a 80 caratteri.' });
  }
  if (email.length > 254 || !emailPattern.test(email)) {
    return res.status(400).json({ error: 'Inserisci un indirizzo email valido.' });
  }
  if (phone.length < 6 || phone.length > 30) {
    return res.status(400).json({ error: 'Inserisci un numero di telefono valido.' });
  }
  if (!startDate || !endDate) {
    return res.status(400).json({ error: 'Seleziona date di inizio e fine valide.' });
  }
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const rentalDays = (endDate.getTime() - startDate.getTime()) / dayMilliseconds;
  if (startDate < today || !Number.isInteger(rentalDays) || rentalDays < 1 || rentalDays > 60) {
    return res.status(400).json({ error: 'Il noleggio deve iniziare da oggi e durare da 1 a 60 giorni.' });
  }
  if (message.length > 1000) {
    return res.status(400).json({ error: 'Il messaggio non può superare i 1000 caratteri.' });
  }

  try {
    const vehicle = await mongoose.connection.collection('vehicles').findOne({ id: vehicleId, type: 'rent' });
    if (!vehicle) return res.status(404).json({ error: 'Questa auto non è più disponibile per il noleggio.' });
    const confirmedOverlap = await requests().findOne(
      confirmedRentalOverlapFilter(vehicleId, req.body.startDate, req.body.endDate),
      { projection: { _id: 1 } },
    );
    if (confirmedOverlap) {
      return res.status(409).json({ error: 'Il periodo selezionato non è più disponibile. Scegli altre date.' });
    }

    const dailyRate = Number(vehicle.price);
    if (!Number.isFinite(dailyRate) || dailyRate <= 0) {
      return res.status(409).json({ error: 'La tariffa di questa auto deve essere verificata dal team.' });
    }

    const now = new Date();
    const request = {
      vehicleId,
      vehicle: {
        id: vehicle.id,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        image: vehicle.image || vehicle.images?.[0] || '',
        dailyRate,
      },
      customer: { name, email, phone },
      startDate: req.body.startDate,
      endDate: req.body.endDate,
      rentalDays,
      estimatedTotal: Math.round(dailyRate * rentalDays * 100) / 100,
      message,
      status: 'pending',
      emailStatus: isContactEmailConfigured() ? 'pending' : 'not_configured',
      createdAt: now,
      updatedAt: now,
    };
    const result = await requests().insertOne(request);
    let emailStatus = request.emailStatus;

    if (emailStatus === 'pending') {
      const emailMessage = [
        'Nuova richiesta di disponibilità noleggio',
        `Auto: ${vehicle.year} ${vehicle.make} ${vehicle.model}`,
        `Date: ${request.startDate} - ${request.endDate} (${rentalDays} giorni)`,
        `Stima: €${request.estimatedTotal.toFixed(2)} (${rentalDays} × €${dailyRate.toFixed(2)}/giorno)`,
        `Telefono: ${phone}`,
        message ? `Note: ${message}` : '',
        'La richiesta non è una prenotazione confermata. Verificare disponibilità e condizioni con il cliente.',
      ].filter(Boolean).join('\n');

      try {
        await sendContactEmail({ name, email, message: emailMessage });
        emailStatus = 'sent';
      } catch (error) {
        emailStatus = 'failed';
        console.error('Rental request saved but notification email failed:', error.code || 'SMTP_ERROR');
      }
      await requests().updateOne({ _id: result.insertedId }, { $set: { emailStatus, updatedAt: new Date() } });
    }

    return res.status(201).json({
      requestId: result.insertedId.toString(),
      message: 'Richiesta ricevuta. Il noleggio non è confermato: il team verificherà disponibilità e tariffa e ti ricontatterà.',
    });
  } catch (error) {
    console.error('Could not save rental request:', error);
    return res.status(500).json({ error: 'Non è stato possibile salvare la richiesta. Riprova.' });
  }
});

router.get('/admin', requireAdmin, async (_req, res) => {
  res.set('Cache-Control', 'no-store');
  try {
    const list = await requests().find({}).sort({ createdAt: -1 }).toArray();
    return res.json({
      requests: list.map((request) => ({
        id: request._id.toString(),
        vehicle: request.vehicle,
        customer: request.customer,
        startDate: request.startDate,
        endDate: request.endDate,
        rentalDays: request.rentalDays,
        estimatedTotal: request.estimatedTotal,
        message: request.message,
        status: request.status,
        emailStatus: request.emailStatus,
        createdAt: request.createdAt,
        updatedAt: request.updatedAt,
      })),
    });
  } catch (error) {
    console.error('Could not load rental requests:', error);
    return res.status(500).json({ error: 'Non è stato possibile caricare le richieste di noleggio.' });
  }
});

router.patch('/:id/status', requireAdmin, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id) || !validStatuses.has(req.body?.status)) {
    return res.status(400).json({ error: 'Richiesta o stato non valido.' });
  }

  try {
    const id = new mongoose.Types.ObjectId(req.params.id);
    const currentRequest = await requests().findOne({ _id: id });
    if (!currentRequest) return res.status(404).json({ error: 'Richiesta di noleggio non trovata.' });
    if (req.body.status === 'confirmed') {
      const confirmedOverlap = await requests().findOne(
        confirmedRentalOverlapFilter(
          currentRequest.vehicleId,
          currentRequest.startDate,
          currentRequest.endDate,
          id,
        ),
        { projection: { _id: 1 } },
      );
      if (confirmedOverlap) {
        return res.status(409).json({ error: 'Il periodo si sovrappone a un noleggio già confermato.' });
      }
    }
    const updatedAt = new Date();
    const result = await requests().findOneAndUpdate(
      { _id: id },
      { $set: { status: req.body.status, updatedAt } },
      { returnDocument: 'after' },
    );
    const request = result?.value || result;
    if (!request) return res.status(404).json({ error: 'Richiesta di noleggio non trovata.' });
    return res.json({
      request: {
        id: request._id.toString(),
        status: request.status,
        updatedAt: request.updatedAt,
      },
    });
  } catch (error) {
    console.error('Could not update rental request status:', error);
    return res.status(500).json({ error: 'Non è stato possibile aggiornare la richiesta di noleggio.' });
  }
});

module.exports = { router, ensureRentalRequestIndexes };