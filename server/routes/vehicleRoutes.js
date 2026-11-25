const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const { requireAdmin } = require('../middleware/auth');
const { createVehicleReport, renderReport, renderVehiclePdf } = require('../services/reportExport');

const router = express.Router();
const uploadDirectory = path.resolve(__dirname, '../uploads/cars');
const uploadedImagePrefix = '/uploads/cars/';
const imageExtensions = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};
const vehicleFields = [
  'make', 'model', 'year', 'mileageKm', 'price', 'discountPrice', 'discountEndsAt', 'vatMode', 'bodyType', 'type', 'color',
  'label', 'fuel', 'transmission', 'power', 'powerCv', 'powerKw', 'emissionsClass', 'inspectionYear', 'lastService',
  'doors', 'seats', 'description', 'installmentPlan',
  'engine', 'drivetrain', 'engineDisplacementCc', 'cylinders', 'consumptionCombined', 'consumptionUnit',
  'co2Emissions', 'torqueNm', 'accelerationSeconds', 'topSpeedKmh', 'trunkCapacityLitres', 'firstRegistration',
  'noviceDriverEligible', 'condition', 'previousOwners', 'warrantyMonths', 'warrantyCoverage', 'maintenanceHistory',
  'features', 'images',
];
const allowedTypes = new Set(['buy', 'rent']);
const allowedVatModes = new Set(['inclusive', 'exclusive', 'not-applied']);
const allowedWarrantyCoverage = new Set([
  'engine', 'transmission', 'clutch', 'brakes', 'turbo', 'electrical', 'airConditioning', 'labor',
]);
const allowedBodyTypes = new Set([
  'Compact', 'SUV-pickup', 'Transporter', 'Convertible',
  'Berlina', 'Station wagon', 'Coupé',
]);
const legacyDemoVehicleIds = [
  'chrysler-300c-touring',
  'alfa-romeo-giulietta',
  'mercedes-glc',
  'fiat-500',
  'bmw-serie-3',
  'mercedes-classe-a-rent',
];

const imageUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, callback) => {
      fs.mkdir(uploadDirectory, { recursive: true }, (error) => callback(error, uploadDirectory));
    },
    filename: (_req, file, callback) => {
      const extension = imageExtensions[file.mimetype];
      callback(null, `${crypto.randomBytes(16).toString('hex')}.${extension}`);
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

function slugify(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 70);
}

function vehicleBody(req) {
  if (typeof req.body?.vehicle !== 'string') return req.body || {};
  try {
    const body = JSON.parse(req.body.vehicle);
    return body && typeof body === 'object' && !Array.isArray(body) ? body : null;
  } catch {
    return null;
  }
}

function parseExistingImages(body) {
  if (Array.isArray(body.images)) return body.images;
  if (typeof body.images !== 'string') return [];
  try {
    const images = JSON.parse(body.images);
    return Array.isArray(images) ? images : null;
  } catch {
    return null;
  }
}

function parseFeatures(value) {
  const features = Array.isArray(value)
    ? value
    : typeof value === 'string' ? value.split(/\r?\n/) : [];
  return [...new Set(features.map((feature) => typeof feature === 'string' ? feature.trim() : '').filter(Boolean))].slice(0, 30);
}

function validImageAddress(image) {
  if (typeof image !== 'string') return false;
  if (image.startsWith(uploadedImagePrefix)) {
    return /^[a-f0-9]{32}\.(?:jpg|png|webp)$/.test(image.slice(uploadedImagePrefix.length));
  }
  try {
    return new URL(image).protocol === 'https:';
  } catch {
    return false;
  }
}

function validateVehicle(body, currentId, files) {
  const make = typeof body.make === 'string' ? body.make.trim() : '';
  const model = typeof body.model === 'string' ? body.model.trim() : '';
  const type = body.type;
  const vatMode = body.vatMode == null || body.vatMode === '' ? 'inclusive' : body.vatMode;
  const year = Number(body.year);
  const mileageKm = Number(body.mileageKm);
  const price = Number(body.price);
  const discountPrice = body.discountPrice === '' || body.discountPrice == null
    ? null
    : Math.round(Number(body.discountPrice) * 100) / 100;
  const rawDiscountEndsAt = body.discountEndsAt;
  const hasDiscountEnd = rawDiscountEndsAt !== '' && rawDiscountEndsAt != null;
  const isCanonicalDiscountEnd = typeof rawDiscountEndsAt === 'string'
    && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(rawDiscountEndsAt);
  const discountEndTime = hasDiscountEnd && isCanonicalDiscountEnd
    ? Date.parse(rawDiscountEndsAt)
    : NaN;
  const discountEndsAt = Number.isFinite(discountEndTime)
      && new Date(discountEndTime).toISOString() === rawDiscountEndsAt
    ? rawDiscountEndsAt
    : null;
  const doors = Number(body.doors);
  const seats = Number(body.seats);
  const savedImages = parseExistingImages(body);
  const uploadedImages = files.map((file) => `${uploadedImagePrefix}${file.filename}`);
  const images = savedImages && [
    ...new Set([...savedImages, ...uploadedImages].filter((image) => typeof image === 'string').map((image) => image.trim()).filter(Boolean)),
  ];
  const mainImageIndex = Number.isInteger(Number(body.mainImageIndex)) ? Number(body.mainImageIndex) : 0;
  const features = parseFeatures(body.features);
  const bodyType = typeof body.bodyType === 'string' ? body.bodyType.trim() : '';
  const color = typeof body.color === 'string' ? body.color.trim() : '';
  const fuel = typeof body.fuel === 'string' ? body.fuel.trim() : '';
  const transmission = typeof body.transmission === 'string' ? body.transmission.trim() : '';
  const power = typeof body.power === 'string' ? body.power.trim() : '';
  const powerCv = body.powerCv === '' || body.powerCv == null ? null : Number(body.powerCv);
  const powerKw = body.powerKw === '' || body.powerKw == null ? null : Number(body.powerKw);
  const emissionsClass = typeof body.emissionsClass === 'string' ? body.emissionsClass.trim() : '';
  const inspectionYear = body.inspectionYear === '' || body.inspectionYear == null ? null : Number(body.inspectionYear);
  const lastService = typeof body.lastService === 'string' ? body.lastService.trim() : '';
  const engine = typeof body.engine === 'string' ? body.engine.trim() : '';
  const drivetrain = typeof body.drivetrain === 'string' ? body.drivetrain.trim() : '';
  const engineDisplacementCc = body.engineDisplacementCc === '' || body.engineDisplacementCc == null ? null : Number(body.engineDisplacementCc);
  const cylinders = body.cylinders === '' || body.cylinders == null ? null : Number(body.cylinders);
  const consumptionCombined = body.consumptionCombined === '' || body.consumptionCombined == null ? null : Number(body.consumptionCombined);
  const consumptionUnit = body.consumptionUnit === 'kWh/100 km' ? 'kWh/100 km' : 'l/100 km';
  const co2Emissions = body.co2Emissions === '' || body.co2Emissions == null ? null : Number(body.co2Emissions);
  const torqueNm = body.torqueNm === '' || body.torqueNm == null ? null : Number(body.torqueNm);
  const accelerationSeconds = body.accelerationSeconds === '' || body.accelerationSeconds == null ? null : Number(body.accelerationSeconds);
  const topSpeedKmh = body.topSpeedKmh === '' || body.topSpeedKmh == null ? null : Number(body.topSpeedKmh);
  const trunkCapacityLitres = body.trunkCapacityLitres === '' || body.trunkCapacityLitres == null ? null : Number(body.trunkCapacityLitres);
  const firstRegistration = typeof body.firstRegistration === 'string' ? body.firstRegistration.trim() : '';
  const noviceDriverEligible = body.noviceDriverEligible === 'yes' || body.noviceDriverEligible === 'no'
    ? body.noviceDriverEligible
    : 'unknown';
  const condition = typeof body.condition === 'string' ? body.condition.trim() : '';
  const previousOwners = body.previousOwners === '' || body.previousOwners == null ? null : Number(body.previousOwners);
  const warrantyMonths = body.warrantyMonths === '' || body.warrantyMonths == null ? null : Number(body.warrantyMonths);
  const warrantyCoverage = Array.isArray(body.warrantyCoverage)
    ? [...new Set(body.warrantyCoverage.filter((item) => typeof item === 'string' && allowedWarrantyCoverage.has(item)))]
    : [];
  const maintenanceHistory = typeof body.maintenanceHistory === 'string' ? body.maintenanceHistory.trim() : '';
  const description = typeof body.description === 'string' ? body.description.trim() : '';
  const rawMonthlyAmount = body.installmentMonthlyAmount;
  const rawInstallmentMonths = body.installmentMonths;
  const monthlyAmount = rawMonthlyAmount === '' || rawMonthlyAmount == null ? null : Number(rawMonthlyAmount);
  const installmentMonths = rawInstallmentMonths === '' || rawInstallmentMonths == null ? null : Number(rawInstallmentMonths);

  if (make.length < 2 || make.length > 60 || model.length < 1 || model.length > 100) {
    return { error: 'Marca e modello sono obbligatori e non devono superare i limiti consentiti.' };
  }
  if (!Number.isInteger(year) || year < 1950 || year > new Date().getFullYear() + 1) {
    return { error: 'Inserisci un anno valido.' };
  }
  if (!Number.isInteger(mileageKm) || mileageKm < 0 || !Number.isFinite(price) || price <= 0 || price > 100000000) {
    return { error: 'Inserisci chilometraggio e prezzo validi.' };
  }
  if (!allowedTypes.has(type)) {
    return { error: 'Seleziona vendita o noleggio.' };
  }
  if (discountPrice !== null
      && (type !== 'buy' || !Number.isFinite(discountPrice) || discountPrice <= 0 || discountPrice >= price || discountPrice > 100000000)) {
    return { error: 'Il prezzo scontato deve essere positivo e inferiore al prezzo originale delle auto in vendita.' };
  }
  if (hasDiscountEnd && (discountEndsAt === null || discountPrice === null || type !== 'buy')) {
    return { error: 'Imposta una data di scadenza valida solo per un’auto in vendita con prezzo scontato.' };
  }
  if (!allowedVatModes.has(vatMode)) {
    return { error: 'Seleziona una modalità IVA valida.' };
  }
  if (!Number.isInteger(doors) || doors < 1 || doors > 8 || !Number.isInteger(seats) || seats < 1 || seats > 20) {
    return { error: 'Inserisci un numero valido di porte e posti.' };
  }
  if (!allowedBodyTypes.has(bodyType) || !color || color.length > 40
      || !fuel || fuel.length > 40 || !transmission || transmission.length > 40
      || !power || power.length > 30 || !description || description.length > 2000) {
    return { error: 'Seleziona un tipo di veicolo e completa colore, alimentazione, cambio, potenza e descrizione.' };
  }
  if ((body.noviceDriverEligible != null && !['yes', 'no', 'unknown'].includes(body.noviceDriverEligible))
    || (body.warrantyCoverage != null && (!Array.isArray(body.warrantyCoverage)
      || body.warrantyCoverage.length > allowedWarrantyCoverage.size
      || body.warrantyCoverage.some((item) => !allowedWarrantyCoverage.has(item))))
      || (body.consumptionUnit != null && !['l/100 km', 'kWh/100 km'].includes(body.consumptionUnit))
      || engine.length > 100 || drivetrain.length > 60 || condition.length > 40 || maintenanceHistory.length > 1000
      || firstRegistration.length > 20
      || (engineDisplacementCc !== null && (!Number.isInteger(engineDisplacementCc) || engineDisplacementCc < 500 || engineDisplacementCc > 20000))
      || (cylinders !== null && (!Number.isInteger(cylinders) || cylinders < 1 || cylinders > 16))
      || (consumptionCombined !== null && (!Number.isFinite(consumptionCombined) || consumptionCombined <= 0 || consumptionCombined > 100))
      || (co2Emissions !== null && (!Number.isFinite(co2Emissions) || co2Emissions < 0 || co2Emissions > 2000))
      || (torqueNm !== null && (!Number.isInteger(torqueNm) || torqueNm < 1 || torqueNm > 10000))
      || (accelerationSeconds !== null && (!Number.isFinite(accelerationSeconds) || accelerationSeconds <= 0 || accelerationSeconds > 120))
      || (topSpeedKmh !== null && (!Number.isInteger(topSpeedKmh) || topSpeedKmh < 1 || topSpeedKmh > 600))
      || (trunkCapacityLitres !== null && (!Number.isInteger(trunkCapacityLitres) || trunkCapacityLitres < 0 || trunkCapacityLitres > 10000))
      || (previousOwners !== null && (!Number.isInteger(previousOwners) || previousOwners < 0 || previousOwners > 50))
      || (warrantyMonths !== null && (!Number.isInteger(warrantyMonths) || warrantyMonths < 0 || warrantyMonths > 120))) {
    return { error: 'Controlla i valori inseriti per motore, trazione, consumi, emissioni, proprietari e garanzia.' };
  }
  if ((powerCv !== null && (!Number.isInteger(powerCv) || powerCv <= 0 || powerCv > 3000))
      || (powerKw !== null && (!Number.isFinite(powerKw) || powerKw <= 0 || powerKw > 2000))
      || emissionsClass.length > 20
      || lastService.length > 80
      || (inspectionYear !== null && (!Number.isInteger(inspectionYear) || inspectionYear < 1950 || inspectionYear > new Date().getFullYear() + 10))) {
    return { error: 'Inserisci valori validi per CV, kW, classe emissioni, tagliando e anno revisione.' };
  }
  const hasInstallmentPlan = monthlyAmount !== null || installmentMonths !== null;
  if (hasInstallmentPlan
      && (type !== 'buy'
        || !Number.isFinite(monthlyAmount) || monthlyAmount <= 0 || monthlyAmount > 100000000
        || !Number.isInteger(installmentMonths) || installmentMonths < 2 || installmentMonths > 120)) {
    return { error: 'Per le auto in vendita, inserisci importo mensile e durata da 2 a 120 mesi.' };
  }
  if (!images || images.length < 1 || images.length > 20 || images.some((image) => !validImageAddress(image))) {
    return { error: 'Carica da 1 a 20 immagini JPEG, PNG o WebP, oppure usa URL HTTPS.' };
  }
  if (mainImageIndex < 0 || mainImageIndex >= images.length) {
    return { error: 'Seleziona una foto principale valida.' };
  }
  const mainImage = images[mainImageIndex];
  images.splice(mainImageIndex, 1);
  images.unshift(mainImage);

  const id = currentId || slugify(`${make}-${model}-${year}`);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) {
    return { error: 'Identificativo auto non valido.' };
  }
  const vehicle = {
    id,
    make,
    model,
    year,
    mileageKm,
    price,
    discountPrice,
    discountEndsAt,
    vatMode,
    bodyType,
    type,
    color,
    label: typeof body.label === 'string' ? body.label.trim().slice(0, 50) : '',
    fuel,
    transmission,
    power,
    powerCv,
    powerKw,
    emissionsClass,
    inspectionYear,
    lastService,
    engine,
    drivetrain,
    engineDisplacementCc,
    cylinders,
    consumptionCombined,
    consumptionUnit,
    co2Emissions,
    torqueNm,
    accelerationSeconds,
    topSpeedKmh,
    trunkCapacityLitres,
    firstRegistration,
    noviceDriverEligible,
    condition,
    previousOwners,
    warrantyMonths,
    warrantyCoverage,
    maintenanceHistory,
    doors,
    seats,
    description,
    installmentPlan: hasInstallmentPlan ? {
      monthlyAmount: Math.round(monthlyAmount * 100) / 100,
      months: installmentMonths,
    } : null,
    features,
    images,
    image: images[0],
  };
  return { vehicle };
}

async function cleanupUploadedFiles(files = []) {
  for (const file of files) {
    try {
      await fs.promises.rm(file.path, { force: true });
    } catch (error) {
      console.error(`Could not remove uploaded image ${file.filename}:`, error);
    }
  }
}

async function deleteStoredImages(images = []) {
  const storedNames = images
    .filter((image) => typeof image === 'string' && image.startsWith(uploadedImagePrefix))
    .map((image) => image.slice(uploadedImagePrefix.length))
    .filter((name) => /^[a-f0-9]{32}\.(?:jpg|png|webp)$/.test(name));
  await cleanupUploadedFiles(storedNames.map((filename) => ({
    filename,
    path: path.join(uploadDirectory, filename),
  })));
}

async function uploadedFilesAreImages(files) {
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

async function verifyUploadedFiles(files, res) {
  try {
    if (await uploadedFilesAreImages(files)) return true;
    await cleanupUploadedFiles(files);
    res.status(400).json({ error: 'Uno o più file non sono immagini valide.' });
  } catch (error) {
    await cleanupUploadedFiles(files);
    console.error('Could not validate uploaded vehicle images:', error);
    res.status(500).json({ error: 'Non è stato possibile elaborare le immagini.' });
  }
  return false;
}

function receiveVehicleImages(req, res, next) {
  imageUpload.array('images', 20)(req, res, (error) => {
    if (!error) return next();
    cleanupUploadedFiles(req.files).then(() => {
      const message = error instanceof multer.MulterError
        ? error.code === 'LIMIT_FILE_SIZE' ? 'Ogni immagine deve essere inferiore a 8 MB.' : 'Puoi caricare al massimo 20 immagini.'
        : error.message;
      return res.status(400).json({ error: message || 'Caricamento immagini non riuscito.' });
    }).catch((cleanupError) => {
      console.error('Could not clean up rejected image uploads:', cleanupError);
      return res.status(500).json({ error: 'Non è stato possibile elaborare le immagini.' });
    });
  });
}

async function ensureVehicleInventory() {
  await fs.promises.mkdir(uploadDirectory, { recursive: true });
  const collection = mongoose.connection.collection('vehicles');
  const dailyMetrics = mongoose.connection.collection('vehicle_daily_metrics');
  const settings = mongoose.connection.collection('app_settings');
  await collection.createIndex({ id: 1 }, { unique: true });
  await dailyMetrics.createIndex({ vehicleId: 1, day: 1 }, { unique: true });
  await dailyMetrics.createIndex({ day: 1 });

  const cleanupMarker = await settings.findOne({ _id: 'legacy-demo-vehicles-removed-v1' });
  if (cleanupMarker) return;

  const result = await collection.deleteMany({ id: { $in: legacyDemoVehicleIds } });
  await settings.updateOne(
    { _id: 'legacy-demo-vehicles-removed-v1' },
    { $setOnInsert: { createdAt: new Date() } },
    { upsert: true },
  );
  if (result.deletedCount) {
    console.log(`Removed ${result.deletedCount} legacy example vehicles from inventory.`);
  }
}

router.post('/:id/view', async (req, res) => {
  const { id } = req.params;
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) {
    return res.status(400).json({ error: 'Identificativo auto non valido.' });
  }

  const session = await mongoose.startSession();
  let matchedVehicle = false;
  try {
    const day = new Date().toISOString().slice(0, 10);
    await session.withTransaction(async () => {
      const result = await mongoose.connection.collection('vehicles').updateOne(
        { id },
        { $inc: { viewCount: 1 } },
        { session },
      );
      matchedVehicle = result.matchedCount === 1;
      if (!matchedVehicle) return;
      await mongoose.connection.collection('vehicle_daily_metrics').updateOne(
        { vehicleId: id, day },
        { $inc: { views: 1 } },
        { upsert: true, session },
      );
    });
    if (!matchedVehicle) return res.status(404).json({ error: 'Auto non trovata.' });
    return res.json({ recorded: true });
  } catch (error) {
    console.error('Could not record vehicle detail view:', error);
    return res.status(500).json({ error: 'Non è stato possibile registrare la visualizzazione.' });
  } finally {
    await session.endSession();
  }
});

router.get('/admin/timeline', requireAdmin, async (req, res) => {
  res.set('Cache-Control', 'no-store');
  const requestedDays = Number.parseInt(req.query.days, 10);
  const days = Number.isInteger(requestedDays) ? Math.min(Math.max(requestedDays, 1), 366) : 365;
  const today = new Date();
  const endDate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() + 1));
  const startDate = new Date(endDate);
  startDate.setUTCDate(startDate.getUTCDate() - days);
  const startDay = startDate.toISOString().slice(0, 10);
  const endDay = new Date(endDate.getTime() - 1).toISOString().slice(0, 10);

  try {
    const [viewDays, requestDays, vehicles, allDailyViews, sales, salesDays] = await Promise.all([
      mongoose.connection.collection('vehicle_daily_metrics')
        .aggregate([
          { $match: { day: { $gte: startDay, $lte: endDay } } },
          { $group: { _id: '$day', views: { $sum: '$views' } } },
        ])
        .toArray(),
      mongoose.connection.collection('vehicle_purchase_requests')
        .aggregate([
          { $match: { createdAt: { $gte: startDate, $lt: endDate } } },
          {
            $group: {
              _id: {
                $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'UTC' },
              },
              requests: { $sum: 1 },
            },
          },
        ])
        .toArray(),
      mongoose.connection.collection('vehicles')
        .find({}, { projection: { _id: 0, viewCount: 1 } })
        .toArray(),
      mongoose.connection.collection('vehicle_daily_metrics')
        .aggregate([
          { $group: {
            _id: '$vehicleId',
            views: { $sum: '$views' },
            requests: { $sum: '$requests' },
          } },
        ])
        .toArray(),
      mongoose.connection.collection('vehicle_sales')
        .find({}, { projection: { vehicleId: 1, 'engagement.views': 1, 'engagement.requestTimeline': 1 } })
        .toArray(),
      mongoose.connection.collection('vehicle_sales')
        .aggregate([
          { $match: { soldAt: { $gte: startDate, $lt: endDate } } },
          {
            $group: {
              _id: {
                $dateToString: { format: '%Y-%m-%d', date: '$soldAt', timezone: 'UTC' },
              },
              sales: { $sum: 1 },
            },
          },
        ])
        .toArray(),
    ]);
    const activeViews = vehicles.reduce((total, vehicle) => (
      total + Math.max(
        Number.isSafeInteger(vehicle.viewCount) ? vehicle.viewCount : 0,
        allDailyViews.find(({ _id }) => _id === vehicle.id)?.views || 0,
      )
    ), 0);
    const soldViews = sales.reduce((total, sale) => (
      total + Math.max(
        Number.isSafeInteger(sale.engagement?.views) ? sale.engagement.views : 0,
        allDailyViews.find(({ _id }) => _id === sale.vehicleId)?.views || 0,
      )
    ), 0);
    const datedViews = allDailyViews.reduce((total, metric) => total + metric.views, 0);
    const totalViews = activeViews + soldViews;
    const timeline = new Map();
    viewDays.forEach(({ _id, views }) => timeline.set(_id, { day: _id, views, requests: 0, sales: 0 }));
    requestDays.forEach(({ _id, requests }) => {
      const current = timeline.get(_id) || { day: _id, views: 0, requests: 0, sales: 0 };
      current.requests = requests;
      timeline.set(_id, current);
    });
    sales.forEach((sale) => {
      (sale.engagement?.requestTimeline || []).forEach(({ day, requests }) => {
        if (day < startDay || day > endDay) return;
        const current = timeline.get(day) || { day, views: 0, requests: 0, sales: 0 };
        current.requests += Number.isSafeInteger(requests) ? requests : 0;
        timeline.set(day, current);
      });
    });
    salesDays.forEach(({ _id, sales: count }) => {
      const current = timeline.get(_id) || { day: _id, views: 0, requests: 0, sales: 0 };
      current.sales = count;
      timeline.set(_id, current);
    });
    return res.json({
      days,
      undatedViews: Math.max(0, totalViews - datedViews),
      timeline: [...timeline.values()].sort((a, b) => a.day.localeCompare(b.day)),
    });
  } catch (error) {
    console.error('Could not load vehicle engagement timeline:', error);
    return res.status(500).json({ error: 'Non è stato possibile caricare lo storico delle metriche.' });
  }
});

router.get('/admin/metrics', requireAdmin, async (_req, res) => {
  res.set('Cache-Control', 'no-store');
  try {
    const [vehicles, requestCounts, dailyMetrics] = await Promise.all([
      mongoose.connection.collection('vehicles')
        .find({}, { projection: { _id: 0, id: 1, viewCount: 1, purchaseRequestCount: 1 } })
        .toArray(),
      mongoose.connection.collection('vehicle_purchase_requests')
        .aggregate([
          { $group: { _id: '$vehicleId', count: { $sum: 1 } } },
        ])
        .toArray(),
      mongoose.connection.collection('vehicle_daily_metrics')
        .aggregate([
          { $group: {
            _id: '$vehicleId',
            views: { $sum: '$views' },
            requests: { $sum: '$requests' },
          } },
        ])
        .toArray(),
    ]);
    const countsByVehicle = new Map(requestCounts.map(({ _id, count }) => [_id, count]));
    const metricsByVehicle = new Map(dailyMetrics.map(({ _id, views, requests }) => [_id, { views, requests }]));
    return res.json({
      metrics: vehicles.map((vehicle) => ({
        vehicleId: vehicle.id,
        views: Math.max(
          Number.isSafeInteger(vehicle.viewCount) ? vehicle.viewCount : 0,
          metricsByVehicle.get(vehicle.id)?.views || 0,
        ),
        purchaseRequests: Math.max(
          Number.isSafeInteger(vehicle.purchaseRequestCount) ? vehicle.purchaseRequestCount : 0,
          countsByVehicle.get(vehicle.id) || 0,
          metricsByVehicle.get(vehicle.id)?.requests || 0,
        ),
      })),
    });
  } catch (error) {
    console.error('Could not load vehicle engagement metrics:', error);
    return res.status(500).json({ error: 'Non è stato possibile caricare le metriche delle auto.' });
  }
});

router.get('/metrics', async (_req, res) => {
  try {
    const [vehicles, requestCounts, dailyRequests] = await Promise.all([
      mongoose.connection.collection('vehicles')
        .find({}, { projection: { _id: 0, id: 1, purchaseRequestCount: 1 } })
        .toArray(),
      mongoose.connection.collection('vehicle_purchase_requests')
        .aggregate([
          { $group: { _id: '$vehicleId', count: { $sum: 1 } } },
        ])
        .toArray(),
      mongoose.connection.collection('vehicle_daily_metrics')
        .aggregate([
          { $group: { _id: '$vehicleId', requests: { $sum: '$requests' } } },
        ])
        .toArray(),
    ]);
    const countsByVehicle = new Map(requestCounts.map(({ _id, count }) => [_id, count]));
    const dailyRequestsByVehicle = new Map(dailyRequests.map(({ _id, requests }) => [_id, requests]));
    return res.json({
      metrics: vehicles.map((vehicle) => ({
        vehicleId: vehicle.id,
        purchaseRequests: Math.max(
          Number.isSafeInteger(vehicle.purchaseRequestCount) ? vehicle.purchaseRequestCount : 0,
          countsByVehicle.get(vehicle.id) || 0,
          dailyRequestsByVehicle.get(vehicle.id) || 0,
        ),
      })),
    });
  } catch (error) {
    console.error('Could not load public vehicle metrics:', error);
    return res.status(500).json({ error: 'Non è stato possibile caricare le statistiche delle richieste.' });
  }
});

router.get('/export/:id', async (req, res) => {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(req.params.id)) {
    return res.status(400).json({ error: 'Identificativo auto non valido.' });
  }
  const format = typeof req.query.format === 'string' ? req.query.format.toLowerCase() : '';
  if (!['json', 'xlsx', 'pdf'].includes(format)) {
    return res.status(400).json({ error: 'Scegli un formato PDF, Excel o JSON.' });
  }
  try {
    const vehicle = await mongoose.connection.collection('vehicles').findOne(
      { id: req.params.id },
      { projection: { _id: 0, viewCount: 0, purchaseRequestCount: 0, createdAt: 0, updatedAt: 0 } },
    );
    if (!vehicle) return res.status(404).json({ error: 'Auto non trovata.' });
    const report = createVehicleReport(vehicle);
    const title = `Scheda auto - ${report.rows[0].vehicle}`;
    const rendered = format === 'pdf'
      ? renderVehiclePdf(report, title)
      : renderReport(report, format, title);
    res.set('Cache-Control', 'no-store');
    res.set('Content-Type', rendered.contentType);
    res.set('Content-Disposition', `attachment; filename="pelusogroup-auto-${req.params.id}.${rendered.extension}"`);
    return res.send(rendered.body);
  } catch (error) {
    console.error('Could not export vehicle information:', error);
    return res.status(500).json({ error: 'Non è stato possibile scaricare la scheda auto.' });
  }
});

router.get('/', async (_req, res) => {
  res.set('Cache-Control', 'no-store');
  try {
    const vehicles = await mongoose.connection.collection('vehicles')
      .find({}, { projection: { _id: 0 } })
      .sort({ createdAt: -1 })
      .toArray();
    const publicVehicles = vehicles.map((vehicle) => ({
      ...vehicle,
      viewCount: Number.isSafeInteger(vehicle.viewCount) ? vehicle.viewCount : 0,
    }));
    return res.json({ vehicles: publicVehicles });
  } catch (error) {
    console.error('Could not load vehicle inventory:', error);
    return res.status(500).json({ error: 'Non è stato possibile caricare le auto.' });
  }
});

router.post('/', requireAdmin, receiveVehicleImages, async (req, res) => {
  const body = vehicleBody(req);
  if (!body) {
    await cleanupUploadedFiles(req.files);
    return res.status(400).json({ error: 'I dati dell’auto non sono validi.' });
  }
  if (!await verifyUploadedFiles(req.files || [], res)) return;

  const { vehicle, error } = validateVehicle(body, undefined, req.files || []);
  if (error) {
    await cleanupUploadedFiles(req.files);
    return res.status(400).json({ error });
  }

  try {
    const record = {
      ...vehicle,
      viewCount: 0,
      purchaseRequestCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const collection = mongoose.connection.collection('vehicles');
    await collection.insertOne(record);
    const savedVehicle = await collection.findOne({ id: vehicle.id }, { projection: { _id: 0, discountEndsAt: 1 } });
    if (!savedVehicle || savedVehicle.discountEndsAt !== vehicle.discountEndsAt) {
      console.error(`Discount expiration was not persisted for vehicle ${vehicle.id}.`);
      return res.status(500).json({ error: 'Il server non ha salvato correttamente la scadenza dello sconto.' });
    }
    return res.status(201).json({ vehicle });
  } catch (insertError) {
    await cleanupUploadedFiles(req.files);
    if (insertError.code === 11000) return res.status(409).json({ error: 'Esiste già un’auto con questo identificativo.' });
    console.error('Could not create vehicle:', insertError);
    return res.status(500).json({ error: 'Non è stato possibile aggiungere l’auto.' });
  }
});

router.put('/:id', requireAdmin, receiveVehicleImages, async (req, res) => {
  const id = req.params.id;
  const body = vehicleBody(req);
  if (!body) {
    await cleanupUploadedFiles(req.files);
    return res.status(400).json({ error: 'I dati dell’auto non sono validi.' });
  }
  if (!await verifyUploadedFiles(req.files || [], res)) return;

  const { vehicle, error } = validateVehicle(body, id, req.files || []);
  if (error) {
    await cleanupUploadedFiles(req.files);
    return res.status(400).json({ error });
  }
  const updates = Object.fromEntries(vehicleFields.map((field) => [field, vehicle[field]]));
  updates.image = vehicle.images[0];
  updates.updatedAt = new Date();

  try {
    const collection = mongoose.connection.collection('vehicles');
    const current = await collection.findOne({ id });
    if (!current) {
      await cleanupUploadedFiles(req.files);
      return res.status(404).json({ error: 'Auto non trovata.' });
    }
    const result = await collection.updateOne({ id }, { $set: updates });
    if (result.matchedCount !== 1) {
      await cleanupUploadedFiles(req.files);
      return res.status(404).json({ error: 'Auto non trovata.' });
    }
    const savedVehicle = await collection.findOne({ id }, { projection: { _id: 0, discountEndsAt: 1 } });
    if (!savedVehicle || savedVehicle.discountEndsAt !== vehicle.discountEndsAt) {
      console.error(`Discount expiration was not persisted for vehicle ${id}.`);
      return res.status(500).json({ error: 'Il server non ha salvato correttamente la scadenza dello sconto.' });
    }
    const retainedImages = new Set(vehicle.images);
    await deleteStoredImages((current.images || []).filter((image) => !retainedImages.has(image)));
    return res.json({ vehicle });
  } catch (updateError) {
    await cleanupUploadedFiles(req.files);
    console.error('Could not update vehicle:', updateError);
    return res.status(500).json({ error: 'Non è stato possibile modificare l’auto.' });
  }
});

router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const collection = mongoose.connection.collection('vehicles');
    const vehicle = await collection.findOne({ id: req.params.id });
    if (!vehicle) return res.status(404).json({ error: 'Auto non trovata.' });
    await collection.deleteOne({ id: req.params.id });
    await deleteStoredImages(vehicle.images || []);
    return res.json({ message: 'Auto rimossa dall’inventario.' });
  } catch (error) {
    console.error('Could not delete vehicle:', error);
    return res.status(500).json({ error: 'Non è stato possibile rimuovere l’auto.' });
  }
});

module.exports = { router, ensureVehicleInventory };
