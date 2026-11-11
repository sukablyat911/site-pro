const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const mongoose = require('mongoose');

require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
require('../config/dns');

const sourceDirectory = path.resolve(
  process.env.DEMO_CAR_IMAGES_DIR || path.join(os.homedir(), 'Downloads', 'cars'),
);
const uploadDirectory = path.resolve(__dirname, '../uploads/cars');
const demoDescription = 'Veicolo dimostrativo per test del catalogo. Anno, chilometraggio, prezzo, motorizzazione e dotazioni sono dati fittizi, non verificati e non riferiti a un’offerta reale.';

const demoVehicles = [
  { file: 'alfa-romeo-giulia.jpg', make: 'Alfa Romeo', model: 'Giulia', year: 2019, mileageKm: 77000, price: 24900, bodyType: 'Berlina', color: 'Blu', fuel: 'Diesel', transmission: 'Automatico', powerCv: 160, engineDisplacementCc: 2143, cylinders: 4, doors: 4, seats: 5, consumptionCombined: 5.2, torqueNm: 450, accelerationSeconds: 8.2, topSpeedKmh: 220, trunkCapacityLitres: 480, drivetrain: 'Posteriore', features: ['Navigatore', 'Sensori di parcheggio', 'Climatizzatore automatico', 'Cruise control'] },
  { file: 'audi-a1.jpg', make: 'Audi', model: 'A1', year: 2021, mileageKm: 42000, price: 19900, bodyType: 'Compact', color: 'Bianco', fuel: 'Benzina', transmission: 'Automatico', powerCv: 110, engineDisplacementCc: 999, cylinders: 3, doors: 5, seats: 5, consumptionCombined: 5.1, torqueNm: 200, accelerationSeconds: 10.5, topSpeedKmh: 200, trunkCapacityLitres: 335, drivetrain: 'Anteriore', features: ['Apple CarPlay', 'Sensori posteriori', 'Climatizzatore', 'Bluetooth'] },
  { file: 'audi-a3.jpg', make: 'Audi', model: 'A3', year: 2020, mileageKm: 51000, price: 25900, bodyType: 'Berlina', color: 'Grigio', fuel: 'Diesel', transmission: 'Automatico', powerCv: 150, engineDisplacementCc: 1968, cylinders: 4, doors: 5, seats: 5, consumptionCombined: 5, torqueNm: 360, accelerationSeconds: 8.4, topSpeedKmh: 224, trunkCapacityLitres: 380, drivetrain: 'Anteriore', features: ['Virtual cockpit', 'Navigatore', 'Sensori di parcheggio', 'Cruise control'] },
  { file: 'audi-a4-s-line.jpg', make: 'Audi', model: 'A4 S line', year: 2021, mileageKm: 48000, price: 34900, bodyType: 'Berlina', color: 'Blu', fuel: 'Diesel', transmission: 'Automatico', powerCv: 204, engineDisplacementCc: 1968, cylinders: 4, doors: 4, seats: 5, consumptionCombined: 5.2, torqueNm: 400, accelerationSeconds: 7.4, topSpeedKmh: 240, trunkCapacityLitres: 480, drivetrain: 'Anteriore', features: ['Allestimento S line', 'Navigatore', 'Virtual cockpit', 'Fari LED'] },
  { file: 'bmw-m4-convertible.jpg', make: 'BMW', model: 'M4 Cabrio', year: 2020, mileageKm: 29000, price: 180, type: 'rent', bodyType: 'Convertible', color: 'Rosso', fuel: 'Benzina', transmission: 'Automatico', powerCv: 450, engineDisplacementCc: 2979, cylinders: 6, doors: 2, seats: 4, consumptionCombined: 9.2, torqueNm: 550, accelerationSeconds: 4.3, topSpeedKmh: 250, trunkCapacityLitres: 370, drivetrain: 'Posteriore', features: ['Capote elettrica', 'Sedili sportivi', 'Navigatore', 'Sensori di parcheggio'] },
  { file: 'bmw-serie1.jpg', make: 'BMW', model: 'Serie 1', year: 2020, mileageKm: 61000, price: 22900, bodyType: 'Compact', color: 'Nero', fuel: 'Diesel', transmission: 'Automatico', powerCv: 150, engineDisplacementCc: 1995, cylinders: 4, doors: 5, seats: 5, consumptionCombined: 4.7, torqueNm: 350, accelerationSeconds: 8.4, topSpeedKmh: 218, trunkCapacityLitres: 380, drivetrain: 'Anteriore', features: ['Navigatore', 'Sensori posteriori', 'Climatizzatore automatico', 'Bluetooth'] },
  { file: 'bmw-serie2.jpg', make: 'BMW', model: 'Serie 2 Coupé', year: 2021, mileageKm: 43000, price: 29900, bodyType: 'Coupé', color: 'Grigio', fuel: 'Benzina', transmission: 'Automatico', powerCv: 184, engineDisplacementCc: 1998, cylinders: 4, doors: 2, seats: 4, consumptionCombined: 6.2, torqueNm: 300, accelerationSeconds: 7.5, topSpeedKmh: 230, trunkCapacityLitres: 390, drivetrain: 'Posteriore', features: ['Sedili sportivi', 'Navigatore', 'Fari LED', 'Cruise control'] },
  { file: 'bmw-serie3.jpg', make: 'BMW', model: 'Serie 3', year: 2020, mileageKm: 57000, price: 32900, bodyType: 'Berlina', color: 'Blu', fuel: 'Diesel', transmission: 'Automatico', powerCv: 190, engineDisplacementCc: 1995, cylinders: 4, doors: 4, seats: 5, consumptionCombined: 4.9, torqueNm: 400, accelerationSeconds: 7.1, topSpeedKmh: 235, trunkCapacityLitres: 480, drivetrain: 'Posteriore', features: ['Navigatore', 'Cruise control adattivo', 'Sensori di parcheggio', 'Climatizzatore automatico'] },
  { file: 'bmw-serie5.jpg', make: 'BMW', model: 'Serie 5', year: 2019, mileageKm: 81000, price: 31900, bodyType: 'Berlina', color: 'Grigio', fuel: 'Diesel', transmission: 'Automatico', powerCv: 190, engineDisplacementCc: 1995, cylinders: 4, doors: 4, seats: 5, consumptionCombined: 5.1, torqueNm: 400, accelerationSeconds: 7.5, topSpeedKmh: 235, trunkCapacityLitres: 530, drivetrain: 'Posteriore', features: ['Navigatore', 'Head-up display', 'Sensori di parcheggio', 'Climatizzatore automatico'] },
  { file: 'fiat-punto-evo.jpg', make: 'Fiat', model: 'Punto Evo', year: 2011, mileageKm: 118000, price: 6900, bodyType: 'Compact', color: 'Blu', fuel: 'Benzina', transmission: 'Manuale', powerCv: 77, engineDisplacementCc: 1368, cylinders: 4, doors: 5, seats: 5, consumptionCombined: 6.1, torqueNm: 115, accelerationSeconds: 13.2, topSpeedKmh: 165, trunkCapacityLitres: 275, drivetrain: 'Anteriore', features: ['Climatizzatore', 'Radio CD', 'Servosterzo', 'Chiusura centralizzata'] },
  { file: 'ford-ranger-raptor.jpg', make: 'Ford', model: 'Ranger Raptor', year: 2022, mileageKm: 31000, price: 160, type: 'rent', bodyType: 'SUV-pickup', color: 'Arancione', fuel: 'Diesel', transmission: 'Automatico', powerCv: 213, engineDisplacementCc: 1996, cylinders: 4, doors: 4, seats: 5, consumptionCombined: 8.8, torqueNm: 500, accelerationSeconds: 10.5, topSpeedKmh: 170, trunkCapacityLitres: 850, drivetrain: 'Integrale', features: ['Trazione integrale', 'Modalità di guida', 'Telecamera posteriore', 'Navigatore'] },
  { file: 'ford-transit.jpg', make: 'Ford', model: 'Transit', year: 2020, mileageKm: 71000, price: 23900, bodyType: 'Transporter', color: 'Bianco', fuel: 'Diesel', transmission: 'Manuale', powerCv: 130, engineDisplacementCc: 1995, cylinders: 4, doors: 4, seats: 3, consumptionCombined: 7.1, torqueNm: 385, accelerationSeconds: 13, topSpeedKmh: 160, trunkCapacityLitres: 6500, drivetrain: 'Posteriore', features: ['Porta laterale scorrevole', 'Sensori posteriori', 'Bluetooth', 'Climatizzatore'] },
  { file: 'mercedes-classe-a-180d.jpg', make: 'Mercedes-Benz', model: 'Classe A 180 d', year: 2021, mileageKm: 38000, price: 24900, bodyType: 'Compact', color: 'Grigio', fuel: 'Diesel', transmission: 'Automatico', powerCv: 116, engineDisplacementCc: 1461, cylinders: 4, doors: 5, seats: 5, consumptionCombined: 4.4, torqueNm: 260, accelerationSeconds: 10.5, topSpeedKmh: 202, trunkCapacityLitres: 355, drivetrain: 'Anteriore', features: ['MBUX', 'Navigatore', 'Sensori di parcheggio', 'Fari LED'] },
  { file: 'mercedes-classe-a.jpg', make: 'Mercedes-Benz', model: 'Classe A', year: 2022, mileageKm: 25000, price: 28900, bodyType: 'Compact', color: 'Bianco', fuel: 'Benzina', transmission: 'Automatico', powerCv: 136, engineDisplacementCc: 1332, cylinders: 4, doors: 5, seats: 5, consumptionCombined: 5.5, torqueNm: 200, accelerationSeconds: 9.2, topSpeedKmh: 215, trunkCapacityLitres: 370, drivetrain: 'Anteriore', features: ['MBUX', 'Apple CarPlay', 'Telecamera posteriore', 'Cruise control'] },
  { file: 'mercedes-classe-c.jpg', make: 'Mercedes-Benz', model: 'Classe C', year: 2020, mileageKm: 66000, price: 34900, bodyType: 'Berlina', color: 'Nero', fuel: 'Diesel', transmission: 'Automatico', powerCv: 194, engineDisplacementCc: 1950, cylinders: 4, doors: 4, seats: 5, consumptionCombined: 5.2, torqueNm: 400, accelerationSeconds: 7, topSpeedKmh: 240, trunkCapacityLitres: 455, drivetrain: 'Posteriore', features: ['Navigatore', 'Pacchetto comfort', 'Sensori di parcheggio', 'Climatizzatore automatico'] },
  { file: 'mercedes-classe-s.jpg', make: 'Mercedes-Benz', model: 'Classe S', year: 2021, mileageKm: 39000, price: 250, type: 'rent', bodyType: 'Berlina', color: 'Nero', fuel: 'Diesel', transmission: 'Automatico', powerCv: 286, engineDisplacementCc: 2925, cylinders: 6, doors: 4, seats: 5, consumptionCombined: 6.5, torqueNm: 600, accelerationSeconds: 6.4, topSpeedKmh: 250, trunkCapacityLitres: 550, drivetrain: 'Posteriore', features: ['Interni in pelle', 'Navigatore', 'Sedili elettrici', 'Sistemi di assistenza alla guida'] },
  { file: 'opel-corsa.jpg', make: 'Opel', model: 'Corsa', year: 2022, mileageKm: 31000, price: 16900, bodyType: 'Compact', color: 'Rosso', fuel: 'Benzina', transmission: 'Manuale', powerCv: 100, engineDisplacementCc: 1199, cylinders: 3, doors: 5, seats: 5, consumptionCombined: 5.2, torqueNm: 205, accelerationSeconds: 9.9, topSpeedKmh: 188, trunkCapacityLitres: 309, drivetrain: 'Anteriore', features: ['Apple CarPlay', 'Sensori posteriori', 'Cruise control', 'Climatizzatore'] },
  { file: 'volkswagen-polo.jpg', make: 'Volkswagen', model: 'Polo', year: 2021, mileageKm: 41000, price: 17900, bodyType: 'Compact', color: 'Grigio', fuel: 'Benzina', transmission: 'Manuale', powerCv: 95, engineDisplacementCc: 999, cylinders: 3, doors: 5, seats: 5, consumptionCombined: 5, torqueNm: 175, accelerationSeconds: 10.8, topSpeedKmh: 187, trunkCapacityLitres: 351, drivetrain: 'Anteriore', features: ['Apple CarPlay', 'Sensori posteriori', 'Cruise control', 'Bluetooth'] },
  { file: 'volkswagen-tiguan.jpg', make: 'Volkswagen', model: 'Tiguan', year: 2022, mileageKm: 36000, price: 32900, bodyType: 'SUV-pickup', color: 'Bianco', fuel: 'Diesel', transmission: 'Automatico', powerCv: 150, engineDisplacementCc: 1968, cylinders: 4, doors: 5, seats: 5, consumptionCombined: 5.6, torqueNm: 360, accelerationSeconds: 9.2, topSpeedKmh: 202, trunkCapacityLitres: 615, drivetrain: 'Integrale', features: ['Navigatore', 'Sensori anteriori e posteriori', 'Portellone elettrico', 'Cruise control adattivo'] },
];

function slugify(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

async function prepareRecords() {
  const missingFiles = [];
  const sourceFiles = await Promise.all(demoVehicles.map(async (vehicle) => {
    const sourcePath = path.join(sourceDirectory, vehicle.file);
    try {
      const contents = await fs.readFile(sourcePath);
      if (!contents.length) missingFiles.push(vehicle.file);
      return { vehicle, sourcePath, contents };
    } catch {
      missingFiles.push(vehicle.file);
      return null;
    }
  }));

  if (missingFiles.length) {
    throw new Error(`Missing or empty source images: ${missingFiles.join(', ')}`);
  }

  const seededAt = new Date();
  return sourceFiles.map(({ vehicle, contents }, index) => {
    const imageName = `${crypto.createHash('sha256').update(contents).digest('hex').slice(0, 32)}.jpg`;
    const image = `/uploads/cars/${imageName}`;
    const powerKw = Math.round(vehicle.powerCv / 1.35962);
    const id = `demo-${slugify(`${vehicle.make}-${vehicle.model}`)}`;

    return {
      id,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      mileageKm: vehicle.mileageKm,
      price: vehicle.price,
      vatMode: 'inclusive',
      bodyType: vehicle.bodyType,
      type: vehicle.type || 'buy',
      color: vehicle.color,
      label: vehicle.type === 'rent' ? 'DEMO · NOLEGGIO' : 'DEMO · DATI FITTIZI',
      fuel: vehicle.fuel,
      transmission: vehicle.transmission,
      power: `${vehicle.powerCv} CV`,
      powerCv: vehicle.powerCv,
      powerKw,
      emissionsClass: vehicle.year < 2015 ? 'Euro 5' : 'Euro 6',
      inspectionYear: null,
      lastService: 'Dato dimostrativo',
      engine: `${(vehicle.engineDisplacementCc / 1000).toFixed(1)} ${vehicle.fuel.toLowerCase()}`,
      drivetrain: vehicle.drivetrain,
      engineDisplacementCc: vehicle.engineDisplacementCc,
      cylinders: vehicle.cylinders,
      consumptionCombined: vehicle.consumptionCombined,
      consumptionUnit: 'l/100 km',
      co2Emissions: Math.round(vehicle.consumptionCombined * (vehicle.fuel === 'Diesel' ? 26.4 : 23.1)),
      torqueNm: vehicle.torqueNm,
      accelerationSeconds: vehicle.accelerationSeconds,
      topSpeedKmh: vehicle.topSpeedKmh,
      trunkCapacityLitres: vehicle.trunkCapacityLitres,
      firstRegistration: `01/${vehicle.year}`,
      noviceDriverEligible: 'unknown',
      condition: 'Usato · demo',
      previousOwners: (index % 3) + 1,
      warrantyMonths: 12,
      maintenanceHistory: 'Dato dimostrativo, non verificato.',
      doors: vehicle.doors,
      seats: vehicle.seats,
      description: demoDescription,
      installmentPlan: null,
      features: vehicle.features,
      images: [image],
      image,
      demoData: true,
      createdAt: new Date(seededAt.getTime() - index * 1000),
      updatedAt: seededAt,
      viewCount: 0,
      sourcePath: path.join(sourceDirectory, vehicle.file),
      imageName,
    };
  });
}

async function main() {
  if (process.env.NODE_ENV !== 'development') {
    throw new Error('Refusing to seed demo vehicles unless NODE_ENV=development.');
  }
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is not configured in the project .env file.');
  }

  const database = decodeURIComponent(new URL(process.env.MONGO_URI).pathname.slice(1));
  if (database !== 'pelusogroup') {
    throw new Error(`Refusing unexpected database "${database || '(default)'}".`);
  }

  const records = await prepareRecords();
  const applyChanges = process.argv.includes('--apply');
  if (!applyChanges) {
    console.log(`Dry run passed: ${records.length} demo vehicles and all source photos found.`);
    console.log(`Database target: ${database} (${process.env.NODE_ENV}). Run with --apply to import.`);
    return;
  }

  await fs.mkdir(uploadDirectory, { recursive: true });
  const newlyCopiedImages = [];
  try {
    for (const record of records) {
      const destination = path.join(uploadDirectory, record.imageName);
      try {
        await fs.copyFile(record.sourcePath, destination, fs.constants.COPYFILE_EXCL);
        newlyCopiedImages.push(destination);
      } catch (error) {
        if (error.code !== 'EEXIST') throw error;
      }
    }

    await mongoose.connect(process.env.MONGO_URI);
    const collection = mongoose.connection.collection('vehicles');
    const operations = records.map(({ sourcePath, imageName, ...vehicle }) => ({
      updateOne: {
        filter: { id: vehicle.id },
        update: { $set: vehicle },
        upsert: true,
      },
    }));
    const result = await collection.bulkWrite(operations, { ordered: true });
    console.log(`Demo catalog imported: ${records.length} records (${result.upsertedCount} inserted, ${result.modifiedCount} updated).`);
    console.log(`Images stored at: ${uploadDirectory}`);
  } catch (error) {
    await Promise.all(newlyCopiedImages.map((filePath) => fs.rm(filePath, { force: true })));
    throw error;
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});