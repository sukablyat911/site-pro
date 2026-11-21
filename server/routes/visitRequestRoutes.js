const express = require('express');
const mongoose = require('mongoose');
const { requireAdmin } = require('../middleware/auth');
const AdminSettings = require('../models/AdminSettings');
const { isContactEmailConfigured, sendContactEmail, sendNotificationEmail } = require('../services/contactEmail');

const router = express.Router();
const requests = () => mongoose.connection.collection('dealer_visit_requests');
const emailPattern = /^(?!\.)(?!.*\.\.)[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?(?:\.[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?)+$/i;
const isoDateTimePattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

function requestView(request, includeCustomer = false) {
  return {
    id: request._id.toString(),
    vehicle: request.vehicle,
    visitAt: request.visitAt,
    customer: includeCustomer ? request.customer : undefined,
    message: request.message,
    status: request.status,
    decisionReason: request.decisionReason || '',
    createdAt: request.createdAt,
    updatedAt: request.updatedAt,
    decidedAt: request.decidedAt || null,
    termsAccepted: request.termsAccepted === true,
    termsAcceptedAt: request.termsAcceptedAt || null,
    adminNotificationStatus: request.adminNotificationStatus || 'unknown',
    customerNotificationStatus: request.customerNotificationStatus || 'not_sent',
  };
}

function formatVisitTime(visitAt, timeZone) {
  return new Date(visitAt).toLocaleString('it-IT', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone,
  });
}

async function ensureVisitRequestIndexes() {
  await requests().createIndex({ createdAt: -1 });
  await requests().createIndex({ status: 1, createdAt: -1 });
  await requests().createIndex({ vehicleId: 1, visitAt: 1 });
}

router.post('/', async (req, res) => {
  const vehicleId = typeof req.body?.vehicleId === 'string' ? req.body.vehicleId.trim() : '';
  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const phone = typeof req.body?.phone === 'string' ? req.body.phone.trim() : '';
  const message = typeof req.body?.message === 'string' ? req.body.message.trim() : '';
  const termsAccepted = req.body?.termsAccepted === true;
  const visitAtValue = typeof req.body?.visitAt === 'string' ? req.body.visitAt : '';
  const visitAt = isoDateTimePattern.test(visitAtValue) ? new Date(visitAtValue) : null;

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(vehicleId)) {
    return res.status(400).json({ error: 'Seleziona un’auto valida.' });
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
  if (!termsAccepted) {
    return res.status(400).json({ error: 'Accetta i termini e le condizioni per proseguire.' });
  }
  if (!visitAt || Number.isNaN(visitAt.getTime()) || visitAt.toISOString() !== visitAtValue || visitAt <= new Date()) {
    return res.status(400).json({ error: 'Seleziona una data e un’ora future valide per la visita.' });
  }
  if (message.length > 1000) {
    return res.status(400).json({ error: 'Il messaggio non può superare i 1000 caratteri.' });
  }

  try {
    const vehicle = await mongoose.connection.collection('vehicles').findOne(
      { id: vehicleId },
      { projection: { id: 1, make: 1, model: 1, year: 1, type: 1, image: 1, images: 1 } },
    );
    if (!vehicle) return res.status(404).json({ error: 'Questa auto non è più disponibile.' });

    const businessSettings = await AdminSettings.findById('global').select('timezone');
    const businessTimeZone = businessSettings?.timezone || 'Europe/Rome';
    const now = new Date();
    const request = {
      vehicleId,
      vehicle: {
        id: vehicle.id,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        type: vehicle.type,
        image: vehicle.image || vehicle.images?.[0] || '',
      },
      customer: { name, email, phone },
      visitAt,
      message,
      termsAccepted: true,
      termsAcceptedAt: now,
      status: 'pending',
      decisionReason: '',
      adminNotificationStatus: isContactEmailConfigured() ? 'pending' : 'not_configured',
      customerNotificationStatus: 'not_sent',
      createdAt: now,
      updatedAt: now,
    };
    const result = await requests().insertOne(request);
    request._id = result.insertedId;

    let adminNotificationStatus = request.adminNotificationStatus;
    if (adminNotificationStatus === 'pending') {
      const emailMessage = [
        'Nuova richiesta di visita in concessionaria',
        `Auto: ${vehicle.year} ${vehicle.make} ${vehicle.model}`,
        `Data e ora richieste: ${formatVisitTime(visitAt, businessTimeZone)}`,
        `Cliente: ${name}`,
        `Telefono: ${phone}`,
        `Termini e condizioni accettati: ${now.toLocaleString('it-IT', { timeZone: businessTimeZone })}`,
        message ? `Note: ${message}` : '',
        `Gestisci la richiesta nella sezione amministratore: /admin/visits`,
      ].filter(Boolean).join('\n');

      try {
        await sendContactEmail({ name, email, message: emailMessage });
        adminNotificationStatus = 'sent';
      } catch (error) {
        adminNotificationStatus = 'failed';
        console.error('Visit request saved but admin notification email failed:', error.code || 'SMTP_ERROR');
      }

      try {
        await requests().updateOne(
          { _id: result.insertedId },
          { $set: { adminNotificationStatus, updatedAt: new Date() } },
        );
      } catch (error) {
        adminNotificationStatus = 'unknown';
        console.error('Could not save visit request notification status:', error);
      }
    }

    return res.status(201).json({
      message: adminNotificationStatus === 'sent'
        ? 'Richiesta inviata. Il concessionario ti ricontatterà per confermare la visita.'
        : 'Richiesta registrata. La notifica email al concessionario non è disponibile; la richiesta è comunque visibile nell’area amministratore.',
      adminNotificationStatus,
    });
  } catch (error) {
    console.error('Could not save dealer visit request:', error);
    return res.status(500).json({ error: 'Non è stato possibile inviare la richiesta di visita. Riprova.' });
  }
});

router.get('/admin', requireAdmin, async (_req, res) => {
  res.set('Cache-Control', 'no-store');
  try {
    const list = await requests().find({}).sort({ createdAt: -1 }).toArray();
    return res.json({ requests: list.map((request) => requestView(request, true)) });
  } catch (error) {
    console.error('Could not load dealer visit requests:', error);
    return res.status(500).json({ error: 'Non è stato possibile caricare le richieste di visita.' });
  }
});

router.patch('/:id/decision', requireAdmin, async (req, res) => {
  const status = req.body?.status;
  const reason = typeof req.body?.reason === 'string' ? req.body.reason.trim() : '';
  if (!mongoose.isValidObjectId(req.params.id) || !['accepted', 'declined'].includes(status)) {
    return res.status(400).json({ error: 'Richiesta o decisione non valida.' });
  }
  if (reason.length > 500) {
    return res.status(400).json({ error: 'Il motivo non può superare i 500 caratteri.' });
  }

  try {
    const id = new mongoose.Types.ObjectId(req.params.id);
    const currentRequest = await requests().findOne({ _id: id });
    if (!currentRequest) return res.status(404).json({ error: 'Richiesta di visita non trovata.' });

    const decidedAt = new Date();
    const customerNotificationStatus = isContactEmailConfigured() ? 'pending' : 'not_configured';
    const result = await requests().updateOne(
      { _id: id, status: 'pending' },
      {
        $set: {
          status,
          decisionReason: reason,
          decidedAt,
          decidedBy: req.user._id,
          customerNotificationStatus,
          updatedAt: decidedAt,
        },
      },
    );
    if (result.modifiedCount !== 1) {
      return res.status(409).json({ error: 'La richiesta è già stata gestita. Aggiorna la pagina.' });
    }

    let notificationStatus = customerNotificationStatus;
    if (notificationStatus === 'pending') {
      const decisionLabel = status === 'accepted' ? 'accettata' : 'rifiutata';
      const emailMessage = [
        `La tua richiesta di visita per ${currentRequest.vehicle.year} ${currentRequest.vehicle.make} ${currentRequest.vehicle.model} è stata ${decisionLabel}.`,
        `Data e ora richieste: ${formatVisitTime(currentRequest.visitAt)}`,
        ...(reason ? [`Motivo: ${reason}`] : []),
        status === 'accepted'
          ? 'Il concessionario ti aspetta all’orario concordato. Per modifiche o ulteriori informazioni, contattaci rispondendo a questa email.'
          : 'Per concordare un altro appuntamento, contatta il concessionario.',
      ].join('\n\n');

      try {
        await sendNotificationEmail({
          recipient: currentRequest.customer.email,
          subject: `Aggiornamento richiesta visita - ${currentRequest.vehicle.make} ${currentRequest.vehicle.model}`,
          name: currentRequest.customer.name,
          message: emailMessage,
        });
        notificationStatus = 'sent';
      } catch (error) {
        notificationStatus = 'failed';
        console.error('Visit decision saved but customer notification email failed:', error.code || 'SMTP_ERROR');
      }

      try {
        await requests().updateOne(
          { _id: id },
          { $set: { customerNotificationStatus: notificationStatus, updatedAt: new Date() } },
        );
      } catch (error) {
        notificationStatus = 'unknown';
        console.error('Could not save visit decision notification status:', error);
      }
    }

    const updatedRequest = await requests().findOne({ _id: id });
    return res.json({
      message: status === 'accepted' ? 'Visita accettata.' : 'Visita rifiutata.',
      request: requestView(updatedRequest, true),
      notificationStatus,
    });
  } catch (error) {
    console.error('Could not decide dealer visit request:', error);
    return res.status(500).json({ error: 'Non è stato possibile aggiornare la richiesta di visita.' });
  }
});

module.exports = { router, ensureVisitRequestIndexes };
