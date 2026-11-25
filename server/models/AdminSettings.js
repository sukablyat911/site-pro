const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, maxlength: 40 },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    role: { type: String, trim: true, maxlength: 120, default: '' },
    email: { type: String, trim: true, lowercase: true, maxlength: 254, default: '' },
    phone: { type: String, trim: true, maxlength: 40, default: '' },
    whatsapp: { type: String, trim: true, maxlength: 40, default: '' },
  },
  { _id: false },
);

const openingHoursSchema = new mongoose.Schema(
  {
    day: { type: String, enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'], required: true },
    closed: { type: Boolean, default: false },
    morningOpen: { type: String, default: '09:00' },
    morningClose: { type: String, default: '13:00' },
    afternoonOpen: { type: String, default: '15:00' },
    afternoonClose: { type: String, default: '20:00' },
  },
  { _id: false },
);

const holidaySchema = new mongoose.Schema(
  {
    date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    label: { type: String, trim: true, maxlength: 100, default: 'Chiusura straordinaria' },
  },
  { _id: false },
);

const announcementSchema = new mongoose.Schema(
  {
    message: { type: String, trim: true, maxlength: 240, required: true },
    type: { type: String, enum: ['info', 'warning', 'alert'], required: true },
    expiresAt: { type: Date, required: true },
  },
  { _id: false },
);

const defaultContacts = [
  {
    id: 'luigi',
    name: 'Luigi Peluso',
    role: 'Vendite e consulenza',
    email: 'luigi_peluso26@proton.me',
    phone: '+39 320 456 9082',
    whatsapp: '393204569082',
  },
  {
    id: 'gerardo',
    name: 'Gerardo Peluso',
    role: 'Accoglienza e assistenza',
    email: 'gerardo_peluso@gmail.com',
    phone: '+39 347 336 8745',
    whatsapp: '393473368745',
  },
];

const defaultOpeningHours = [
  ...['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].map((day) => ({ day })),
  { day: 'saturday', morningOpen: '09:00', morningClose: '13:00', afternoonOpen: '', afternoonClose: '' },
  { day: 'sunday', closed: true, morningOpen: '', morningClose: '', afternoonOpen: '', afternoonClose: '' },
];

const adminSettingsSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default: 'global',
    },
    businessName: {
      type: String,
      default: 'PelusoGroup',
      trim: true,
      maxlength: 120,
    },
    siteTitle: {
      type: String,
      default: 'PelusoGroup — La tua prossima auto',
      trim: true,
      maxlength: 160,
    },
    contactEmail: {
      type: String,
      default: '',
      trim: true,
      lowercase: true,
      maxlength: 254,
    },
    contactPhone: {
      type: String,
      default: '',
      trim: true,
      maxlength: 40,
    },
    address: {
      type: String,
      default: 'Via delle Monache, 17, 81030 Cellole (CE), Italia',
      trim: true,
      maxlength: 240,
    },
    vatNumber: {
      type: String,
      default: '04195760618',
      trim: true,
      maxlength: 32,
    },
    timezone: {
      type: String,
      default: 'Europe/Rome',
      enum: ['Europe/Rome', 'Europe/Paris', 'Europe/Berlin', 'UTC'],
    },
    defaultVehicleType: {
      type: String,
      default: 'buy',
      enum: ['buy', 'rent'],
    },
    defaultVehicleStatus: {
      type: String,
      default: 'available',
      enum: ['available', 'draft'],
    },
    logoUrl: { type: String, default: '/images/logo.png', maxlength: 300 },
    faviconUrl: { type: String, default: '/favicon.svg', maxlength: 300 },
    heroImageUrl: { type: String, default: '/images/mercedes-amg-c63-hero.jpg', maxlength: 300 },
    staffContacts: { type: [contactSchema], default: defaultContacts },
    openingHours: { type: [openingHoursSchema], default: defaultOpeningHours },
    holidays: { type: [holidaySchema], default: [] },
    announcement: { type: announcementSchema, default: null },
    maintenanceMode: { type: Boolean, default: false },
    maintenanceMessage: {
      type: String,
      trim: true,
      maxlength: 240,
      default: 'Stiamo aggiornando il sito. Torna tra poco.',
    },
    offlineMode: { type: Boolean, default: false },
    offlineMessage: {
      type: String,
      trim: true,
      maxlength: 240,
      default: 'Il sito è temporaneamente offline. Riprova più tardi.',
    },
    adminAccessPathHash: {
      type: String,
      default: '',
      match: /^(?:[a-f0-9]{64})?$/,
      select: false,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model('AdminSettings', adminSettingsSchema);
