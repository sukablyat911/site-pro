const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const { getAuthenticatedUser, requireAdmin } = require('../middleware/auth');

const router = express.Router();
const uploadDirectory = path.resolve(__dirname, '../uploads/sell-submissions');
const imageExtensions = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};
const allowedVehicleBodyTypes = new Set([
  'Compact', 'SUV-pickup', 'Transporter', 'Convertible',
  'Berlina', 'Station wagon', 'Coupé',
]);
const emailPattern = /^(?!\.)(?!.*\.\.)[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?(?:\.[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?)+$/i;

const imageUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, callback) => {
      fs.mkdir(uploadDirectory, { recursive: true }, (error) => callback(error, uploadDirectory));
    },
    filename: (_req, file, callback) => {
      callback(null, `${crypto.randomBytes(16).toString('hex')}.${imageExtensions[file.mimetype]}`);
    },
  }),
  limits: { fileSize: 8 * 1024 * 1024, files: 20 },
  fileFilter: (_req, file, callback) => {
    if (!imageExtensions[file.mimetype]) {
      callback(new Error('Carica immagini JPEG, PNG o WebP.'));
      return;
    }
    callback(null, true);
  },
});

async function requireCustomer(req, res, next) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return res.status(401).json({ error: 'Accedi al tuo account per inviare e seguire una proposta.' });
    if (user.role !== 'user') return res.status(403).json({ error: 'Le proposte sono riservate agli account cliente.' });
    req.user = user;
    return next();
  } catch (error) {
    console.error('Sell-submission customer authorization failed:', error);
    return res.status(500).json({ error: 'Non è stato possibile verificare il tuo account.' });
  }
}

async function removeUploadedFiles(files = []) {
  for (const file of files) {
    try {
      await fs.promises.rm(file.path, { force: true });
    } catch (error) {
      console.error(`Could not remove sell-submission image ${file.filename}:`, error);
    }
  }
}

async function verifyImages(files) {
  for (const file of files) {
    const content = await fs.promises.readFile(file.path);
    const validJpeg = file.mimetype === 'image/jpeg'
      && content.length >= 3 && content[0] === 0xff && content[1] === 0xd8 && content[2] === 0xff;
    const validPng = file.mimetype === 'image/png'
      && content.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    const validWebp = file.mimetype === 'image/webp'
      && content.toString('ascii', 0, 4) === 'RIFF'
      && content.toString('ascii', 8, 12) === 'WEBP';
    if (!validJpeg && !validPng && !validWebp) return false;
  }
  return true;
}

function receiveImages(req, res, next) {
  imageUpload.array('images', 20)(req, res, (error) => {
    if (!error) return next();
    removeUploadedFiles(req.files).then(() => {
      const message = error instanceof multer.MulterError
        ? error.code === 'LIMIT_FILE_SIZE' ? 'Ogni immagine deve essere inferiore a 8 MB.' : 'Puoi caricare al massimo 20 immagini.'
        : error.message;
      return res.status(400).json({ error: message || 'Caricamento immagini non riuscito.' });
    }).catch((cleanupError) => {
      console.error('Could not clean up rejected sell-submission uploads:', cleanupError);
      return res.status(500).json({ error: 'Non è stato possibile elaborare le immagini.' });
    });
  });
}

function submissionBody(body) {
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
  const make = typeof body.make === 'string' ? body.make.trim() : '';
  const model = typeof body.model === 'string' ? body.model.trim() : '';
  const bodyType = typeof body.bodyType === 'string' ? body.bodyType.trim() : '';
  const year = Number(body.year);
  const mileageKm = Number(body.mileageKm);
  const price = body.price === '' || body.price == null ? null : Number(body.price);
  const description = typeof body.description === 'string' ? body.description.trim() : '';

  if (name.length < 2 || name.length > 80) return { error: 'Inserisci nome e cognome (massimo 80 caratteri).' };
  if (email.length > 254 || !emailPattern.test(email)) return { error: 'Inserisci un indirizzo email valido.' };
  if (phone.length < 6 || phone.length > 30) return { error: 'Inserisci un numero di telefono valido.' };
  if (make.length < 2 || make.length > 60 || model.length < 1 || model.length > 100) {
    return { error: 'Inserisci marca e modello dell’auto.' };
  }
  if (!allowedVehicleBodyTypes.has(bodyType)) return { error: 'Seleziona un tipo di veicolo valido.' };
  if (!Number.isInteger(year) || year < 1950 || year > new Date().getFullYear() + 1) return { error: 'Inserisci un anno valido.' };
  if (!Number.isInteger(mileageKm) || mileageKm < 0 || mileageKm > 3000000) return { error: 'Inserisci un chilometraggio valido.' };
  if (price !== null && (!Number.isFinite(price) || price < 1 || price > 100000000)) return { error: 'Inserisci un prezzo richiesto valido.' };
  if (description.length < 10 || description.length > 2000) return { error: 'Descrivi l’auto in almeno 10 caratteri (massimo 2000).' };
  return { submission: { name, email, phone, make, model, bodyType, year, mileageKm, askingPrice: price, description } };
}

async function ensureSellSubmissionIndexes() {
  await fs.promises.mkdir(uploadDirectory, { recursive: true });
  await mongoose.connection.collection('sell_submissions').createIndex({ createdAt: -1 });
  await mongoose.connection.collection('sell_submissions').createIndex({ status: 1, createdAt: -1 });
  await mongoose.connection.collection('sell_submissions').createIndex({ ownerId: 1, createdAt: -1 });
}

router.post('/', requireCustomer, receiveImages, async (req, res) => {
  const files = req.files || [];
  if (!files.length) return res.status(400).json({ error: 'Aggiungi almeno una foto della tua auto.' });

  let imagesAreValid;
  try {
    imagesAreValid = await verifyImages(files);
  } catch (error) {
    await removeUploadedFiles(files);
    console.error('Could not validate sell-submission images:', error);
    return res.status(500).json({ error: 'Non è stato possibile elaborare le immagini.' });
  }
  if (!imagesAreValid) {
    await removeUploadedFiles(files);
    return res.status(400).json({ error: 'Uno o più file non sono immagini valide.' });
  }

  const { submission, error } = submissionBody(req.body || {});
  if (error) {
    await removeUploadedFiles(files);
    return res.status(400).json({ error });
  }

  try {
    const record = {
      ...submission,
      name: req.user.name,
      email: req.user.email,
      ownerId: req.user._id,
      images: files.map((file) => file.filename),
      status: 'new',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const result = await mongoose.connection.collection('sell_submissions').insertOne(record);
    return res.status(201).json({
      message: 'Richiesta inviata. Il concessionario la esaminerà e ti ricontatterà.',
      submissionId: result.insertedId,
    });
  } catch (insertError) {
    await removeUploadedFiles(files);
    console.error('Could not save sell submission:', insertError);
    return res.status(500).json({ error: 'Non è stato possibile inviare la richiesta. Riprova.' });
  }
});

router.get('/mine', requireCustomer, async (req, res) => {
  res.set('Cache-Control', 'no-store');
  try {
    const submissions = await mongoose.connection.collection('sell_submissions')
      .find({ ownerId: req.user._id }, {
        projection: {
          name: 1, make: 1, model: 1, bodyType: 1, year: 1, mileageKm: 1, askingPrice: 1,
          description: 1, images: 1, status: 1, counterPrice: 1, acceptedPrice: 1, messages: 1,
          createdAt: 1, updatedAt: 1,
        },
      })
      .sort({ createdAt: -1 })
      .toArray();
    return res.json({
      submissions: submissions.map((submission) => ({
        ...submission,
        id: submission._id.toString(),
        images: submission.images.map((filename) => `/api/sell-submissions/mine/${submission._id}/images/${filename}`),
        messages: submission.status === 'accepted' ? [] : submission.messages || [],
      })),
    });
  } catch (error) {
    console.error('Could not load customer sell submissions:', error);
    return res.status(500).json({ error: 'Non è stato possibile caricare le tue proposte.' });
  }
});

router.get('/', requireAdmin, async (_req, res) => {
  res.set('Cache-Control', 'no-store');
  try {
    const submissions = await mongoose.connection.collection('sell_submissions')
      .find({}, { projection: { ownerId: 1, name: 1, email: 1, phone: 1, make: 1, model: 1, bodyType: 1, year: 1, mileageKm: 1, askingPrice: 1, description: 1, images: 1, status: 1, counterPrice: 1, acceptedPrice: 1, messages: 1, createdAt: 1, updatedAt: 1 } })
      .sort({ createdAt: -1 })
      .toArray();
    return res.json({
      submissions: submissions.map((submission) => ({
        ...submission,
        id: submission._id.toString(),
        images: submission.images.map((filename) => `/api/sell-submissions/${submission._id}/images/${filename}`),
        messages: submission.status === 'accepted' ? [] : submission.messages || [],
      })),
    });
  } catch (error) {
    console.error('Could not load sell submissions:', error);
    return res.status(500).json({ error: 'Non è stato possibile caricare i nuovi arrivi.' });
  }
});

router.get('/:id/images/:filename', requireAdmin, async (req, res) => {
  res.set('Cache-Control', 'no-store');
  if (!mongoose.isValidObjectId(req.params.id) || !/^[a-f0-9]{32}\.(?:jpg|png|webp)$/.test(req.params.filename)) {
    return res.status(404).json({ error: 'Immagine non trovata.' });
  }
  try {
    const submission = await mongoose.connection.collection('sell_submissions')
      .findOne({ _id: new mongoose.Types.ObjectId(req.params.id), images: req.params.filename }, { projection: { _id: 1 } });
    if (!submission) return res.status(404).json({ error: 'Immagine non trovata.' });
    return res.sendFile(path.join(uploadDirectory, req.params.filename), (error) => {
      if (error && !res.headersSent) res.status(error.statusCode || 404).json({ error: 'Immagine non trovata.' });
    });
  } catch (error) {
    console.error('Could not load sell-submission image:', error);
    return res.status(500).json({ error: 'Non è stato possibile caricare l’immagine.' });
  }
});

router.get('/mine/:id/images/:filename', requireCustomer, async (req, res) => {
  res.set('Cache-Control', 'no-store');
  if (!mongoose.isValidObjectId(req.params.id) || !/^[a-f0-9]{32}\.(?:jpg|png|webp)$/.test(req.params.filename)) {
    return res.status(404).json({ error: 'Immagine non trovata.' });
  }
  try {
    const submission = await mongoose.connection.collection('sell_submissions').findOne({
      _id: new mongoose.Types.ObjectId(req.params.id),
      ownerId: req.user._id,
      images: req.params.filename,
    }, { projection: { _id: 1 } });
    if (!submission) return res.status(404).json({ error: 'Immagine non trovata.' });
    return res.sendFile(path.join(uploadDirectory, req.params.filename), (error) => {
      if (error && !res.headersSent) res.status(error.statusCode || 404).json({ error: 'Immagine non trovata.' });
    });
  } catch (error) {
    console.error('Could not load customer sell-submission image:', error);
    return res.status(500).json({ error: 'Non è stato possibile caricare l’immagine.' });
  }
});

router.patch('/:id/response', requireAdmin, async (req, res) => {
  const { status, counterPrice, acceptedPrice } = req.body || {};
  const message = typeof req.body?.message === 'string' ? req.body.message.trim() : '';
  const allowedStatuses = ['new', 'reviewing', 'accepted', 'countered', 'rejected', 'closed'];
  const parsedCounterPrice = counterPrice === '' || counterPrice == null ? null : Number(counterPrice);
  const parsedAcceptedPrice = acceptedPrice === '' || acceptedPrice == null ? null : Number(acceptedPrice);
  const validCounterPrice = status !== 'countered'
    || (Number.isFinite(parsedCounterPrice) && parsedCounterPrice > 0 && parsedCounterPrice <= 100000000);
  const validAcceptedPrice = status !== 'accepted'
    || (Number.isFinite(parsedAcceptedPrice) && parsedAcceptedPrice > 0 && parsedAcceptedPrice <= 100000000);
  if (!mongoose.isValidObjectId(req.params.id) || !allowedStatuses.includes(status)
      || !validCounterPrice || !validAcceptedPrice || message.length > 1500
      || (status === 'countered' && !message)) {
    return res.status(400).json({ error: 'Controlla lo stato, il prezzo concordato e l’eventuale messaggio.' });
  }
  try {
    const collection = mongoose.connection.collection('sell_submissions');
    const submission = await collection.findOne({ _id: new mongoose.Types.ObjectId(req.params.id) });
    if (!submission) return res.status(404).json({ error: 'Richiesta non trovata.' });
    const responseMessage = message && status !== 'accepted'
      ? { senderRole: 'admin', text: message, createdAt: new Date() }
      : null;
    const update = {
      status,
      updatedAt: new Date(),
      ...(status === 'countered' ? { counterPrice: parsedCounterPrice } : { counterPrice: null }),
      ...(status === 'accepted' ? { acceptedPrice: parsedAcceptedPrice } : { acceptedPrice: null }),
    };
    await collection.updateOne(
      { _id: submission._id },
      {
        $set: update,
        ...(status === 'accepted' ? { $unset: { messages: '' } } : {}),
        ...(responseMessage ? { $push: { messages: responseMessage } } : {}),
      },
    );
    return res.json({
      message: 'Risposta inviata al cliente.',
      status,
      counterPrice: update.counterPrice,
      acceptedPrice: update.acceptedPrice,
      responseMessage,
    });
  } catch (error) {
    console.error('Could not respond to sell submission:', error);
    return res.status(500).json({ error: 'Non è stato possibile inviare la risposta.' });
  }
});

router.post('/:id/messages', async (req, res) => {
  const text = typeof req.body?.text === 'string' ? req.body.text.trim() : '';
  if (!mongoose.isValidObjectId(req.params.id) || text.length < 1 || text.length > 1500) {
    return res.status(400).json({ error: 'Il messaggio deve contenere da 1 a 1500 caratteri.' });
  }

  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return res.status(401).json({ error: 'Accedi per continuare la conversazione.' });
    const collection = mongoose.connection.collection('sell_submissions');
    const id = new mongoose.Types.ObjectId(req.params.id);
    const filter = user.role === 'admin'
      ? { _id: id }
      : { _id: id, ownerId: user._id };
    const submission = await collection.findOne(filter, { projection: { _id: 1, status: 1 } });
    if (!submission) return res.status(404).json({ error: 'Proposta non trovata.' });
    if (submission.status === 'accepted') {
      return res.status(409).json({ error: 'La proposta è stata accettata e la conversazione è chiusa.' });
    }
    const message = { senderRole: user.role, text, createdAt: new Date() };
    await collection.updateOne({ _id: submission._id }, {
      $push: { messages: message },
      $set: { updatedAt: message.createdAt },
    });
    return res.status(201).json({ message });
  } catch (error) {
    console.error('Could not add sell-submission message:', error);
    return res.status(500).json({ error: 'Non è stato possibile inviare il messaggio.' });
  }
});

router.delete('/:id', requireAdmin, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: 'Richiesta non valida.' });
  try {
    const collection = mongoose.connection.collection('sell_submissions');
    const submission = await collection.findOne({ _id: new mongoose.Types.ObjectId(req.params.id) });
    if (!submission) return res.status(404).json({ error: 'Richiesta non trovata.' });
    await collection.deleteOne({ _id: submission._id });
    await removeUploadedFiles(submission.images.map((filename) => ({
      filename,
      path: path.join(uploadDirectory, filename),
    })));
    return res.json({ message: 'Richiesta rimossa.' });
  } catch (error) {
    console.error('Could not delete sell submission:', error);
    return res.status(500).json({ error: 'Non è stato possibile rimuovere la richiesta.' });
  }
});

module.exports = { router, ensureSellSubmissionIndexes };
