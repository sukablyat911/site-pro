const crypto = require('node:crypto');
const fs = require('node:fs');
const net = require('node:net');
const path = require('node:path');
const bcrypt = require('bcryptjs');
const express = require('express');
const multer = require('multer');
const mongoose = require('mongoose');
const AdminApiToken = require('../models/AdminApiToken');
const AdminInvitation = require('../models/AdminInvitation');
const AdminSecurityEvent = require('../models/AdminSecurityEvent');
const AdminSecurityAttempt = require('../models/AdminSecurityAttempt');
const AdminSecuritySettings = require('../models/AdminSecuritySettings');
const AdminSettings = require('../models/AdminSettings');
const AdminActivityLog = require('../models/AdminActivityLog');
const LegalDocument = require('../models/LegalDocument');
const AdminTrafficCounter = require('../models/AdminTrafficCounter');
const AuthSession = require('../models/AuthSession');
const User = require('../models/User');
const { getAdminConfig, getAdminPinHash } = require('../config/admin');
const { getAuthenticatedSession, requireAdmin, requireSuperAdmin } = require('../middleware/auth');
const { hashToken, requireAdminApiToken } = require('../middleware/adminApiToken');
const { invalidateSecuritySettingsCache, logSecurityEvent } = require('../middleware/adminTrafficGuard');
const { invalidateSiteAvailabilityCache } = require('../middleware/siteAvailabilityGuard');
const { sendNotificationEmail } = require('../services/contactEmail');
const {
  decryptSecret,
  encodeBase32,
  encryptSecret,
  generateRecoveryCodes,
  generateTotpCode,
  hashRecoveryCode,
  isEncryptionConfigured,
  verifyTotp,
} = require('../services/adminMfa');

const router = express.Router();
const sessionCookieName = '__Host-peluso_session';
const sessionLifetimeMs = 7 * 24 * 60 * 60 * 1000;
const adminFactorLifetimeMs = 60 * 1000;
const securityLockoutMs = 30 * 60 * 1000;
const maxSecurityAttempts = 5;
const allowedTokenScopes = new Set(['vehicles:read', 'analytics:read']);
const allowedTimezones = new Set(['Europe/Rome', 'Europe/Paris', 'Europe/Berlin', 'UTC']);
const allowedVehicleTypes = new Set(['buy', 'rent']);
const allowedVehicleStatuses = new Set(['available', 'draft']);
const allowedEmailPurposes = new Set(['primary', 'notification']);
const allowedIpRuleDurations = new Set([0, 1, 24, 168, 720, 8760]);
const allowedWeekdays = new Set(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']);
const allowedAnnouncementTypes = new Set(['info', 'warning', 'alert']);
const legalDocumentDefinitions = {
  privacy: { title: 'Informativa privacy', file: 'PRIVACY-POLICY.md' },
  'termini-condizioni': { title: 'Termini e condizioni', file: 'TERMINI-CONDIZIONI.md' },
  'cookie-policy': { title: 'Cookie Policy', file: 'COOKIE-POLICY.md' },
  'note-legali': { title: 'Note legali', file: 'NOTE-LEGALI.md' },
};
const siteImageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, callback) => {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
      return callback(new Error('Sono consentite solo immagini JPG, PNG o WebP.'));
    }
    return callback(null, true);
  },
});

async function getAdminSettings() {
  let settings = await AdminSettings.findById('global').select('+adminAccessPathHash');
  if (!settings) settings = await AdminSettings.create({ _id: 'global' });
  return settings;
}

async function getLegalDocumentForAdmin(slug) {
  const definition = legalDocumentDefinitions[slug];
  if (!definition) return null;
  const stored = await LegalDocument.findOne({ slug }).lean();
  if (stored) return stored;
  const content = await fs.promises.readFile(path.join(__dirname, '../../legal', definition.file), 'utf8');
  return { slug, content, updatedAt: null };
}

async function getSiteBusinessName() {
  const settings = await AdminSettings.findById('global').select('businessName');
  return settings?.businessName?.replace(/[\r\n]+/g, ' ').trim() || 'PelusoGroup';
}

function isValidTime(value) {
  return typeof value === 'string' && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function validTimeRange(start, end) {
  return isValidTime(start) && isValidTime(end) && start < end;
}

function normalizeContacts(value) {
  if (!Array.isArray(value) || value.length < 2 || value.length > 20) return null;
  const ids = new Set();
  const contacts = [];
  for (const contact of value) {
    if (!contact || typeof contact !== 'object' || Array.isArray(contact)) return null;
    if (['role', 'email', 'phone', 'whatsapp'].some((field) => contact[field] !== undefined && typeof contact[field] !== 'string')) return null;
    const id = typeof contact.id === 'string' ? contact.id.trim().toLowerCase() : '';
    const name = typeof contact.name === 'string' ? contact.name.trim() : '';
    const role = typeof contact.role === 'string' ? contact.role.trim() : '';
    const email = typeof contact.email === 'string' ? contact.email.trim().toLowerCase() : '';
    const phone = typeof contact.phone === 'string' ? contact.phone.trim() : '';
    const rawWhatsapp = typeof contact.whatsapp === 'string' ? contact.whatsapp.trim() : '';
    const whatsapp = rawWhatsapp.replace(/\D/g, '');
    if (!/^[a-z0-9-]{2,40}$/.test(id) || ids.has(id) || name.length < 2 || name.length > 80
        || role.length > 120 || email.length > 254 || (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
        || phone.length > 40 || (phone && !/^[+()\d.\-\s]+$/.test(phone))
        || (rawWhatsapp && !/^[+()\d.\-\s]+$/.test(rawWhatsapp))
        || (whatsapp && !/^\d{8,15}$/.test(whatsapp))) return null;
    ids.add(id);
    contacts.push({ id, name, role, email, phone, whatsapp });
  }
  if (!ids.has('luigi') || !ids.has('gerardo')) return null;
  return contacts;
}

function normalizeOpeningHours(value) {
  if (!Array.isArray(value) || value.length !== allowedWeekdays.size) return null;
  const days = new Set();
  const hours = [];
  for (const entry of value) {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry) || !allowedWeekdays.has(entry.day)
        || days.has(entry.day) || typeof entry.closed !== 'boolean') return null;
    if (['morningOpen', 'morningClose', 'afternoonOpen', 'afternoonClose']
      .some((field) => entry[field] !== undefined && typeof entry[field] !== 'string')) return null;
    const morningOpen = typeof entry.morningOpen === 'string' ? entry.morningOpen : '';
    const morningClose = typeof entry.morningClose === 'string' ? entry.morningClose : '';
    const afternoonOpen = typeof entry.afternoonOpen === 'string' ? entry.afternoonOpen : '';
    const afternoonClose = typeof entry.afternoonClose === 'string' ? entry.afternoonClose : '';
    if (entry.closed) {
      if ([morningOpen, morningClose, afternoonOpen, afternoonClose].some(Boolean)) return null;
    } else if (!validTimeRange(morningOpen, morningClose)
        || ((afternoonOpen || afternoonClose) && !validTimeRange(afternoonOpen, afternoonClose))
        || (afternoonOpen && afternoonOpen < morningClose)) {
      return null;
    }
    days.add(entry.day);
    hours.push({ day: entry.day, closed: entry.closed, morningOpen, morningClose, afternoonOpen, afternoonClose });
  }
  return hours;
}

function normalizeHolidays(value) {
  if (!Array.isArray(value) || value.length > 50) return null;
  const dates = new Set();
  const holidays = [];
  for (const holiday of value) {
    if (!holiday || typeof holiday !== 'object' || Array.isArray(holiday)) return null;
    const date = typeof holiday.date === 'string' ? holiday.date : '';
    const label = typeof holiday.label === 'string' ? holiday.label.trim() : '';
    const timestamp = Date.parse(`${date}T00:00:00Z`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(timestamp)
        || new Date(timestamp).toISOString().slice(0, 10) !== date || dates.has(date)
        || label.length < 2 || label.length > 100) return null;
    dates.add(date);
    holidays.push({ date, label });
  }
  return holidays.sort((left, right) => left.date.localeCompare(right.date));
}

function normalizedIp(value) {
  const rawIp = typeof value === 'string' ? value.trim().toLowerCase() : '';
  const ip = rawIp.startsWith('::ffff:') ? rawIp.slice(7) : rawIp;
  return net.isIP(ip) ? ip : '';
}

function validateChangedPassword(password) {
  if (password.length < 8) return 'La nuova password deve contenere almeno 8 caratteri.';
  if (Buffer.byteLength(password, 'utf8') > 72) return 'La nuova password non può superare 72 byte.';
  if (!/\p{Ll}/u.test(password)) return 'Aggiungi almeno una lettera minuscola alla password.';
  if (!/\p{Lu}/u.test(password)) return 'Aggiungi almeno una lettera maiuscola alla password.';
  if (!/\p{N}/u.test(password)) return 'Aggiungi almeno un numero alla password.';
  if (!/[^\p{L}\p{N}]/u.test(password)) return 'Aggiungi almeno un simbolo alla password.';
  return '';
}

async function loadAdminCredentialUser(userId) {
  return User.findById(userId).select('+passwordHash +security');
}

async function verifyCurrentAdminFactor(user, factor) {
  if (user.security?.totpEnabled) {
    return /^\d{6}$/.test(factor)
      && verifyTotp(decryptSecret(user.security.totpSecretEncrypted), factor);
  }
  const pinHash = user.security?.adminPinHash || getAdminPinHash();
  return Boolean(pinHash && /^\d{4}$/.test(factor) && await bcrypt.compare(factor, pinHash));
}

async function revokeOtherAdminSessions(userId, currentSessionId) {
  await AuthSession.deleteMany({ userId, _id: { $ne: currentSessionId } });
}

async function getAdminSecuritySettings() {
  let settings = await AdminSecuritySettings.findById('global');
  if (!settings) settings = await AdminSecuritySettings.create({ _id: 'global' });
  return settings;
}

function getSessionToken(req) {
  const cookies = req.headers.cookie?.split(';') ?? [];
  for (const cookie of cookies) {
    const separator = cookie.indexOf('=');
    if (separator !== -1 && cookie.slice(0, separator).trim() === sessionCookieName) {
      return cookie.slice(separator + 1).trim();
    }
  }
  return undefined;
}

function hashSessionToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function publicUser(user) {
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

function authMethodsFor(user) {
  return {
    totp: Boolean(user.security?.totpEnabled),
    pin: !user.security?.totpEnabled,
  };
}

async function getPendingAdminFactor(req) {
  const token = getSessionToken(req);
  if (!token) return null;
  const authenticated = await getAuthenticatedSession(req);
  if (!authenticated || authenticated.user.role !== 'admin') return null;
  const { session, user } = authenticated;
  if (session.adminVerified || !session.pendingPinExpiresAt || session.pendingPinExpiresAt <= new Date()) {
    return null;
  }
  const adminUser = await User.findById(user._id).select('+security');
  if (!adminUser) return null;
  return { token, session, user: adminUser };
}

async function checkSecurityLock(userId) {
  const now = new Date();
  let record = await AdminSecurityAttempt.findOne({ userId });
  if (record?.lockedUntil > now) {
    return { locked: true, retryAfterSeconds: Math.ceil((record.lockedUntil.getTime() - now.getTime()) / 1000) };
  }
  if (record && record.expiresAt <= now) {
    await AdminSecurityAttempt.updateOne(
      { userId, expiresAt: { $lte: now } },
      { $set: { attempts: 0, lockedUntil: null, expiresAt: new Date(now.getTime() + securityLockoutMs) } },
    );
  }
  return { locked: false };
}

async function recordFailedSecurityAttempt(userId) {
  const now = new Date();
  let record;
  try {
    record = await AdminSecurityAttempt.findOneAndUpdate(
      { userId },
      { $inc: { attempts: 1 }, $set: { expiresAt: new Date(now.getTime() + securityLockoutMs) } },
      { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true },
    );
  } catch (error) {
    if (error.code !== 11000) throw error;
    record = await AdminSecurityAttempt.findOneAndUpdate(
      { userId },
      { $inc: { attempts: 1 }, $set: { expiresAt: new Date(now.getTime() + securityLockoutMs) } },
      { new: true, runValidators: true },
    );
  }
  if (record.attempts >= maxSecurityAttempts) {
    const lockedUntil = new Date(now.getTime() + securityLockoutMs);
    await AdminSecurityAttempt.updateOne({ userId }, { $set: { lockedUntil, expiresAt: lockedUntil } });
    return { locked: true };
  }
  return { locked: false, remaining: maxSecurityAttempts - record.attempts };
}

function setAuthenticatedSession(res, session, token) {
  session.adminVerified = true;
  session.pendingPinExpiresAt = undefined;
  session.pendingTotpSecretEncrypted = undefined;
  session.totpSetupExpiresAt = undefined;
  session.expiresAt = new Date(Date.now() + sessionLifetimeMs);
  return session.save().then(() => {
    res.setHeader(
      'Set-Cookie',
      `${sessionCookieName}=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${Math.ceil(sessionLifetimeMs / 1000)}`,
    );
  });
}

function safeTokenScopes(value) {
  if (!Array.isArray(value) || !value.length) return null;
  const scopes = [...new Set(value)];
  return scopes.every((scope) => allowedTokenScopes.has(scope)) ? scopes : null;
}

function normalizeSettingsInput(body) {
  const source = body && typeof body === 'object' && !Array.isArray(body) ? body : {};
  const settings = {};
  const stringFields = {
    businessName: 120,
    siteTitle: 160,
    contactEmail: 254,
    contactPhone: 40,
    address: 240,
    vatNumber: 32,
    maintenanceMessage: 240,
    offlineMessage: 240,
  };

  for (const [field, maxLength] of Object.entries(stringFields)) {
    if (source[field] === undefined) continue;
    if (typeof source[field] !== 'string' || source[field].trim().length > maxLength) {
      return { error: `Il campo ${field} non è valido.` };
    }
    settings[field] = source[field].trim();
  }
  if (settings.businessName !== undefined && settings.businessName.length < 2) {
    return { error: 'Il nome dell’attività deve contenere almeno 2 caratteri.' };
  }
  if (settings.siteTitle !== undefined && settings.siteTitle.length < 2) {
    return { error: 'Il titolo della pagina deve contenere almeno 2 caratteri.' };
  }
  if (settings.address !== undefined && settings.address.length < 5) {
    return { error: 'Inserisci un indirizzo completo per la concessionaria.' };
  }
  for (const field of ['maintenanceMessage', 'offlineMessage']) {
    if (settings[field] !== undefined && settings[field].length < 2) {
      return { error: 'I messaggi di disponibilità devono contenere almeno 2 caratteri.' };
    }
  }
  if (settings.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(settings.contactEmail)) {
    return { error: 'Inserisci un indirizzo email valido.' };
  }
  if (source.timezone !== undefined) {
    if (!allowedTimezones.has(source.timezone)) return { error: 'Il fuso orario selezionato non è valido.' };
    settings.timezone = source.timezone;
  }
  if (source.defaultVehicleType !== undefined) {
    if (!allowedVehicleTypes.has(source.defaultVehicleType)) return { error: 'La tipologia predefinita non è valida.' };
    settings.defaultVehicleType = source.defaultVehicleType;
  }
  if (source.defaultVehicleStatus !== undefined) {
    if (!allowedVehicleStatuses.has(source.defaultVehicleStatus)) return { error: 'Lo stato predefinito non è valido.' };
    settings.defaultVehicleStatus = source.defaultVehicleStatus;
  }
  for (const field of ['maintenanceMode', 'offlineMode']) {
    if (source[field] === undefined) continue;
    if (typeof source[field] !== 'boolean') return { error: 'Le impostazioni di disponibilità non sono valide.' };
    settings[field] = source[field];
  }
  for (const field of ['logoUrl', 'heroImageUrl']) {
    if (source[field] === undefined) continue;
    if (typeof source[field] !== 'string'
        || !(['/images/logo.png', '/images/mercedes-amg-c63-hero.jpg'].includes(source[field])
          || /^\/uploads\/site\/[a-f0-9]{32}\.(?:jpg|png|webp)$/.test(source[field]))) {
      return { error: 'Il percorso dell’immagine non è valido.' };
    }
    settings[field] = source[field];
  }
  if (source.faviconUrl !== undefined) {
    if (typeof source.faviconUrl !== 'string'
        || !(['/favicon.svg'].includes(source.faviconUrl)
          || /^\/uploads\/site\/[a-f0-9]{32}\.(?:jpg|png|webp)$/.test(source.faviconUrl))) {
      return { error: 'Il percorso del favicon non è valido.' };
    }
    settings.faviconUrl = source.faviconUrl;
  }
  if (source.staffContacts !== undefined) {
    settings.staffContacts = normalizeContacts(source.staffContacts);
    if (!settings.staffContacts) return { error: 'Controlla i contatti pubblici inseriti.' };
  }
  if (source.openingHours !== undefined) {
    settings.openingHours = normalizeOpeningHours(source.openingHours);
    if (!settings.openingHours) return { error: 'Controlla gli orari: ogni giorno deve avere intervalli validi.' };
  }
  if (source.holidays !== undefined) {
    settings.holidays = normalizeHolidays(source.holidays);
    if (!settings.holidays) return { error: 'Controlla le date e le descrizioni delle chiusure.' };
  }
  if (source.announcement !== undefined) {
    if (source.announcement === null) {
      settings.announcement = null;
    } else {
      const { message, type, expiresAt } = source.announcement && typeof source.announcement === 'object'
        ? source.announcement
        : {};
      const expiry = typeof expiresAt === 'string' ? new Date(expiresAt) : new Date(NaN);
      if (typeof message !== 'string' || message.trim().length < 2 || message.trim().length > 240
          || !allowedAnnouncementTypes.has(type) || !Number.isFinite(expiry.getTime())
          || expiry.getTime() <= Date.now() || expiry.getTime() > Date.now() + 366 * 24 * 60 * 60 * 1000) {
        return { error: 'Il banner deve avere un messaggio, un tipo e una scadenza futura valida.' };
      }
      settings.announcement = { message: message.trim(), type, expiresAt: expiry };
    }
  }
  return { settings };
}

router.get('/settings', requireAdmin, async (req, res) => {
  try {
    const settings = await getAdminSettings();
    const settingsData = settings.toObject();
    settingsData.adminAccessEnabled = Boolean(settingsData.adminAccessPathHash);
    delete settingsData.adminAccessPathHash;
    return res.json({ settings: settingsData });
  } catch (error) {
    console.error('Could not load admin settings:', error);
    return res.status(500).json({ error: 'Non è stato possibile caricare le impostazioni.' });
  }
});

router.get('/legal-documents', requireAdmin, async (req, res) => {
  try {
    const documents = await Promise.all(Object.entries(legalDocumentDefinitions).map(async ([slug, definition]) => {
      const document = await getLegalDocumentForAdmin(slug);
      return { slug, title: definition.title, content: document.content, updatedAt: document.updatedAt };
    }));
    return res.json({ documents });
  } catch (error) {
    console.error('Could not load legal documents:', error);
    return res.status(500).json({ error: 'Non è stato possibile caricare i documenti legali.' });
  }
});

router.put('/legal-documents/:slug', requireAdmin, async (req, res) => {
  const { slug } = req.params;
  if (!legalDocumentDefinitions[slug]) return res.status(404).json({ error: 'Documento legale non trovato.' });
  const content = typeof req.body?.content === 'string' ? req.body.content.replace(/\r\n/g, '\n').trim() : '';
  if (content.length < 20 || content.length > 100000) {
    return res.status(400).json({ error: 'Il documento deve contenere tra 20 e 100.000 caratteri.' });
  }
  try {
    const document = await LegalDocument.findOneAndUpdate(
      { slug },
      { $set: { content, updatedBy: req.user._id } },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
    ).lean();
    return res.json({
      document: {
        slug,
        title: legalDocumentDefinitions[slug].title,
        content: document.content,
        updatedAt: document.updatedAt,
      },
    });
  } catch (error) {
    console.error('Could not save legal document:', error);
    return res.status(500).json({ error: 'Non è stato possibile salvare il documento legale.' });
  }
});

router.post('/settings/admin-access-path', requireAdmin, async (req, res) => {
  try {
    const settings = await getAdminSettings();
    const path = `/${crypto.randomBytes(24).toString('hex')}`;
    settings.adminAccessPathHash = crypto.createHash('sha256').update(path).digest('hex');
    settings.updatedBy = req.user._id;
    await settings.save();
    return res.json({ path, adminAccessEnabled: true });
  } catch (error) {
    console.error('Could not generate private admin entry:', error);
    return res.status(500).json({ error: 'Non è stato possibile generare il collegamento amministratore.' });
  }
});

router.delete('/settings/admin-access-path', requireAdmin, async (req, res) => {
  try {
    const settings = await getAdminSettings();
    settings.adminAccessPathHash = '';
    settings.updatedBy = req.user._id;
    await settings.save();
    return res.json({ adminAccessEnabled: false });
  } catch (error) {
    console.error('Could not revoke private admin entry:', error);
    return res.status(500).json({ error: 'Non è stato possibile revocare il collegamento amministratore.' });
  }
});

router.put('/settings', requireAdmin, async (req, res) => {
  const input = normalizeSettingsInput(req.body);
  if (input.error) return res.status(400).json({ error: input.error });
  if (!Object.keys(input.settings).length) {
    return res.status(400).json({ error: 'Non sono state ricevute impostazioni da salvare.' });
  }

  try {
    const settings = await getAdminSettings();
    Object.assign(settings, input.settings, { updatedBy: req.user._id });
    await settings.save();
    invalidateSiteAvailabilityCache();
    const settingsData = settings.toObject();
    settingsData.adminAccessEnabled = Boolean(settingsData.adminAccessPathHash);
    delete settingsData.adminAccessPathHash;
    return res.json({ settings: settingsData });
  } catch (error) {
    console.error('Could not save admin settings:', error);
    return res.status(500).json({ error: 'Non è stato possibile salvare le impostazioni.' });
  }
});

router.post('/settings/assets/:kind', requireAdmin, (req, res, next) => {
  siteImageUpload.single('image')(req, res, (error) => {
    if (!error) return next();
    const status = error.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
    return res.status(status).json({ error: error.message || 'Impossibile caricare l’immagine.' });
  });
}, async (req, res) => {
  const { kind } = req.params;
  const file = req.file;
  const isLogo = kind === 'logo';
  const isFavicon = kind === 'favicon';
  if ((!isLogo && !isFavicon && kind !== 'hero') || !file) {
    return res.status(400).json({ error: 'Seleziona un’immagine valida da caricare.' });
  }

  const isJpeg = file.mimetype === 'image/jpeg'
    && file.buffer[0] === 0xff && file.buffer[1] === 0xd8 && file.buffer[2] === 0xff;
  const isPng = file.mimetype === 'image/png'
    && file.buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  const isWebp = file.mimetype === 'image/webp'
    && file.buffer.toString('ascii', 0, 4) === 'RIFF'
    && file.buffer.toString('ascii', 8, 12) === 'WEBP';
  if (!isJpeg && !isPng && !isWebp) {
    return res.status(400).json({ error: 'Il contenuto del file non corrisponde a un’immagine JPG, PNG o WebP.' });
  }

  const extension = isJpeg ? 'jpg' : isPng ? 'png' : 'webp';
  const filename = `${crypto.randomBytes(16).toString('hex')}.${extension}`;
  const imagePath = path.join(__dirname, '../uploads/site', filename);
  const imageUrl = `/uploads/site/${filename}`;
  const field = isLogo ? 'logoUrl' : isFavicon ? 'faviconUrl' : 'heroImageUrl';
  let createdFile = false;
  try {
    await fs.promises.mkdir(path.dirname(imagePath), { recursive: true });
    await fs.promises.writeFile(imagePath, file.buffer, { flag: 'wx' });
    createdFile = true;
    const settings = await getAdminSettings();
    const previousUrl = settings[field];
    settings[field] = imageUrl;
    settings.updatedBy = req.user._id;
    await settings.save();
    invalidateSiteAvailabilityCache();

    if (previousUrl && /^\/uploads\/site\/[a-f0-9]{32}\.(?:jpg|png|webp)$/.test(previousUrl)) {
      try {
        await fs.promises.unlink(path.join(__dirname, '../uploads/site', path.basename(previousUrl)));
      } catch (error) {
        if (error.code !== 'ENOENT') console.error('Could not remove replaced site image:', error);
      }
    }
    return res.json({ url: imageUrl, field });
  } catch (error) {
    if (createdFile) {
      try {
        await fs.promises.unlink(imagePath);
      } catch (cleanupError) {
        if (cleanupError.code !== 'ENOENT') console.error('Could not remove failed site image upload:', cleanupError);
      }
    }
    console.error('Could not save site image:', error);
    return res.status(500).json({ error: 'Non è stato possibile salvare l’immagine.' });
  }
});

router.get('/security', requireAdmin, async (req, res) => {
  try {
    const [user, tokens, admins] = await Promise.all([
      User.findById(req.user._id).select('+security'),
      AdminApiToken.find({ userId: req.user._id, revokedAt: null })
        .select('name tokenPrefix scopes lastUsedAt expiresAt createdAt')
        .sort({ createdAt: -1 })
        .lean(),
      User.find({ role: 'admin' }).select('name username email phone createdAt').sort({ createdAt: 1 }).lean(),
    ]);
    if (!user) return res.status(404).json({ error: 'Account amministratore non trovato.' });
    const adminConfig = getAdminConfig();
    const adminAccounts = admins.map((admin) => ({
      ...admin,
      isBootstrap: Boolean(adminConfig && admin.username === adminConfig.username),
    }));
    return res.json({
      security: {
        totpEnabled: Boolean(user.security?.totpEnabled),
        recoveryCodesRemaining: user.security?.recoveryCodeHashes?.length || 0,
        encryptionConfigured: isEncryptionConfigured(),
        passkeysAvailable: false,
        passkeysNote: 'La registrazione FIDO2 sarà disponibile dopo l’installazione della libreria WebAuthn verificata.',
        pinConfigured: Boolean(user.security?.adminPinHash || getAdminPinHash()),
        accountEmail: user.email,
        isSuperAdmin: user.username === 'luigipeluso',
        notificationEmails: user.security?.notificationEmails || [],
        pendingEmailVerifications: (user.security?.pendingEmailVerifications || []).map((entry) => ({
          email: entry.email,
          purpose: entry.purpose,
          expiresAt: entry.expiresAt,
        })),
        admins: adminAccounts,
        tokens,
      },
    });
  } catch (error) {
    console.error('Could not load admin security settings:', error);
    return res.status(500).json({ error: 'Non è stato possibile caricare le impostazioni di sicurezza.' });
  }
});

router.post('/security/admins/invitations', requireAdmin, requireSuperAdmin, async (req, res) => {
  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
  const username = typeof req.body?.username === 'string' ? req.body.username.trim().toLowerCase() : '';
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const phone = typeof req.body?.phone === 'string' ? req.body.phone.trim() : '';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  const pin = typeof req.body?.pin === 'string' ? req.body.pin : '';
  const currentPassword = typeof req.body?.currentPassword === 'string' ? req.body.currentPassword : '';
  const factor = typeof req.body?.factor === 'string' ? req.body.factor.trim() : '';

  if (name.length < 2 || name.length > 80) return res.status(400).json({ error: 'Il nome deve contenere da 2 a 80 caratteri.' });
  if (!/^[a-z0-9._-]{3,32}$/.test(username)) return res.status(400).json({ error: 'Lo username deve contenere 3–32 caratteri: lettere, numeri, punti, trattini o underscore.' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return res.status(400).json({ error: 'Inserisci un indirizzo email valido.' });
  if (phone.length > 40) return res.status(400).json({ error: 'Il numero di telefono non può superare 40 caratteri.' });
  const passwordError = validateChangedPassword(password);
  if (passwordError) return res.status(400).json({ error: passwordError });
  if (!/^\d{4}$/.test(pin)) return res.status(400).json({ error: 'Il PIN iniziale deve contenere esattamente 4 cifre.' });
  if (!currentPassword || Buffer.byteLength(currentPassword, 'utf8') > 72 || !factor) {
    return res.status(400).json({ error: 'Conferma l’operazione con la tua password e il PIN o codice TOTP attuale.' });
  }

  try {
    const creator = await loadAdminCredentialUser(req.user._id);
    if (!creator || !await bcrypt.compare(currentPassword, creator.passwordHash)
        || !await verifyCurrentAdminFactor(creator, factor)) {
      return res.status(401).json({ error: 'La password o il fattore di verifica attuale non è corretto.' });
    }
    const existingAccount = await User.findOne({ $or: [{ email }, { username }] }).select('_id');
    if (existingAccount) return res.status(409).json({ error: 'Email o username già associato a un account.' });
    const activeInvitation = await AdminInvitation.findOne({
      $or: [{ email }, { username }],
      expiresAt: { $gt: new Date() },
    }).select('_id');
    if (activeInvitation) return res.status(409).json({ error: 'Esiste già un invito in attesa per questa email o username.' });
    const activeInvitationCount = await AdminInvitation.countDocuments({
      createdBy: req.user._id,
      expiresAt: { $gt: new Date() },
    });
    if (activeInvitationCount >= 5) return res.status(429).json({ error: 'Hai già 5 inviti in attesa. Verificali o attendi la scadenza.' });

    const code = String(crypto.randomInt(10000000, 100000000));
    const invitation = await AdminInvitation.create({
      name,
      username,
      email,
      phone,
      passwordHash: await bcrypt.hash(password, 12),
      adminPinHash: await bcrypt.hash(pin, 12),
      codeHash: crypto.createHash('sha256').update(code).digest('hex'),
      createdBy: req.user._id,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });
    try {
      const businessName = await getSiteBusinessName();
      await sendNotificationEmail({
        recipient: email,
        subject: `Verifica l’invito amministratore ${businessName}`,
        name,
        message: `È stato richiesto un account amministratore ${businessName} per questo indirizzo. Codice di verifica: ${code}. Il codice scade tra 10 minuti. Se non ti aspettavi questo messaggio, ignoralo.`,
      });
    } catch (emailError) {
      await AdminInvitation.deleteOne({ _id: invitation._id });
      if (emailError.code === 'EMAIL_NOT_CONFIGURED' || emailError.code === 'EMAIL_CONFIG_INVALID') {
        return res.status(503).json({ error: 'Invio email non configurato. Configura SMTP prima di invitare un amministratore.' });
      }
      console.error('Could not send admin invitation email:', emailError);
      return res.status(502).json({ error: 'Non è stato possibile inviare l’email di verifica.' });
    }
    return res.status(201).json({
      invitationId: invitation.id,
      expiresAt: invitation.expiresAt,
      message: 'Codice di verifica inviato all’indirizzo indicato.',
    });
  } catch (error) {
    console.error('Could not create admin invitation:', error);
    return res.status(500).json({ error: 'Non è stato possibile creare l’invito amministratore.' });
  }
});

router.post('/security/admins/invitations/verify', requireAdmin, requireSuperAdmin, async (req, res) => {
  const invitationId = typeof req.body?.invitationId === 'string' ? req.body.invitationId : '';
  const code = typeof req.body?.code === 'string' ? req.body.code.trim() : '';
  if (!mongoose.isValidObjectId(invitationId) || !/^\d{8}$/.test(code)) {
    return res.status(400).json({ error: 'Inserisci il codice ricevuto via email.' });
  }

  try {
    const invitation = await AdminInvitation.findOne({
      _id: invitationId,
      createdBy: req.user._id,
      expiresAt: { $gt: new Date() },
    }).select('+passwordHash +adminPinHash +codeHash');
    const suppliedHash = crypto.createHash('sha256').update(code).digest();
    const storedHash = invitation ? Buffer.from(invitation.codeHash, 'hex') : Buffer.alloc(suppliedHash.length);
    const codeMatches = storedHash.length === suppliedHash.length
      && crypto.timingSafeEqual(storedHash, suppliedHash);
    if (!invitation || !codeMatches) {
      return res.status(400).json({ error: 'Il codice è errato o l’invito è scaduto.' });
    }

    const existingAccount = await User.findOne({ $or: [{ email: invitation.email }, { username: invitation.username }] }).select('_id');
    if (existingAccount) {
      await AdminInvitation.deleteOne({ _id: invitation._id });
      return res.status(409).json({ error: 'Email o username è stato utilizzato da un account creato nel frattempo.' });
    }
    const admin = await User.create({
      name: invitation.name,
      username: invitation.username,
      email: invitation.email,
      phone: invitation.phone,
      passwordHash: invitation.passwordHash,
      role: 'admin',
      security: { adminPinHash: invitation.adminPinHash },
    });
    const warnings = [];
    try {
      await AdminInvitation.deleteOne({ _id: invitation._id });
    } catch (cleanupError) {
      console.error('Could not remove verified admin invitation:', cleanupError);
      warnings.push('L’invito verificato non è stato eliminato; puoi ignorarlo.');
    }
    try {
      await logSecurityEvent('admin_account_created', normalizedIp(req.ip), 'Nuovo account amministratore verificato via email.', req.user._id);
    } catch (auditError) {
      console.error('Could not record admin account creation event:', auditError);
      warnings.push('L’account è stato creato, ma l’evento non è stato registrato nel log di sicurezza.');
    }
    return res.status(201).json({
      admin: { id: admin.id, name: admin.name, username: admin.username, email: admin.email, phone: admin.phone },
      warning: warnings.join(' '),
    });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ error: 'Email o username già associato a un account.' });
    console.error('Could not verify admin invitation:', error);
    return res.status(500).json({ error: 'Non è stato possibile verificare l’invito.' });
  }
});

router.delete('/security/admins/:adminId', requireAdmin, requireSuperAdmin, async (req, res) => {
  const { adminId } = req.params;
  const currentPassword = typeof req.body?.currentPassword === 'string' ? req.body.currentPassword : '';
  const factor = typeof req.body?.factor === 'string' ? req.body.factor.trim() : '';
  if (!mongoose.isValidObjectId(adminId)) return res.status(400).json({ error: 'Account amministratore non valido.' });
  if (String(req.user._id) === adminId) return res.status(400).json({ error: 'Non puoi rimuovere il tuo account amministratore.' });
  if (!currentPassword || Buffer.byteLength(currentPassword, 'utf8') > 72 || !factor) {
    return res.status(400).json({ error: 'Conferma la rimozione con la tua password e il PIN o codice TOTP attuale.' });
  }

  try {
    const actor = await loadAdminCredentialUser(req.user._id);
    if (!actor || !await bcrypt.compare(currentPassword, actor.passwordHash)
        || !await verifyCurrentAdminFactor(actor, factor)) {
      return res.status(401).json({ error: 'La password o il fattore di verifica attuale non è corretto.' });
    }
    const [target, adminCount] = await Promise.all([
      User.findOne({ _id: adminId, role: 'admin' }),
      User.countDocuments({ role: 'admin' }),
    ]);
    if (!target) return res.status(404).json({ error: 'Account amministratore non trovato.' });
    if (adminCount <= 1) return res.status(409).json({ error: 'Non è possibile rimuovere l’ultimo account amministratore.' });
    if (target.username === 'luigipeluso') return res.status(403).json({ error: 'Il Super Admin non può essere rimosso.' });
    const adminConfig = getAdminConfig();
    if (adminConfig && target.username === adminConfig.username) {
      return res.status(409).json({ error: 'L’account bootstrap non può essere revocato finché resta configurato nel server.' });
    }

    await User.updateOne(
      { _id: target._id, role: 'admin' },
      { $set: { role: 'user' }, $unset: { username: 1, phone: 1 } },
      { runValidators: true },
    );
    const warnings = [];
    try {
      await Promise.all([
        AuthSession.deleteMany({ userId: target._id }),
        AdminApiToken.deleteMany({ userId: target._id }),
      ]);
    } catch (cleanupError) {
      console.error('Could not fully clear revoked admin sessions and tokens:', cleanupError);
      warnings.push('L’account non ha più privilegi admin; non è stato possibile eliminare tutti i token o le sessioni.');
    }
    try {
      await logSecurityEvent('admin_account_removed', normalizedIp(req.ip), 'Accesso amministratore revocato.', req.user._id);
    } catch (auditError) {
      console.error('Could not record admin account removal event:', auditError);
      warnings.push('L’evento non è stato registrato nel log di sicurezza.');
    }
    return res.json({ removed: true, adminId: target.id, warning: warnings.join(' ') });
  } catch (error) {
    console.error('Could not remove admin account:', error);
    return res.status(500).json({ error: 'Non è stato possibile rimuovere l’account amministratore.' });
  }
});

router.post('/security/credentials/password', requireAdmin, async (req, res) => {
  const currentPassword = typeof req.body?.currentPassword === 'string' ? req.body.currentPassword : '';
  const newPassword = typeof req.body?.newPassword === 'string' ? req.body.newPassword : '';
  const factor = typeof req.body?.factor === 'string' ? req.body.factor.trim() : '';
  const passwordError = validateChangedPassword(newPassword);
  if (!currentPassword || Buffer.byteLength(currentPassword, 'utf8') > 72) {
    return res.status(400).json({ error: 'Inserisci la password attuale.' });
  }
  if (passwordError) return res.status(400).json({ error: passwordError });
  if (!factor) return res.status(400).json({ error: 'Conferma anche il PIN attuale o il codice TOTP.' });

  try {
    const user = await loadAdminCredentialUser(req.user._id);
    if (!user || !await bcrypt.compare(currentPassword, user.passwordHash)) {
      return res.status(401).json({ error: 'La password attuale non è corretta.' });
    }
    if (!await verifyCurrentAdminFactor(user, factor)) {
      return res.status(401).json({ error: 'Il fattore di verifica attuale non è corretto.' });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 12);
    await user.save();
    await revokeOtherAdminSessions(user._id, req.authSession?._id);
    await logSecurityEvent('password_changed', normalizedIp(req.ip), 'Password amministratore aggiornata.', user._id);
    return res.json({ changed: true });
  } catch (error) {
    console.error('Could not change admin password:', error);
    return res.status(500).json({ error: 'Non è stato possibile aggiornare la password.' });
  }
});

router.post('/security/credentials/pin', requireAdmin, async (req, res) => {
  const currentPassword = typeof req.body?.currentPassword === 'string' ? req.body.currentPassword : '';
  const factor = typeof req.body?.factor === 'string' ? req.body.factor.trim() : '';
  const newPin = typeof req.body?.newPin === 'string' ? req.body.newPin : '';
  if (!currentPassword || Buffer.byteLength(currentPassword, 'utf8') > 72) {
    return res.status(400).json({ error: 'Inserisci la password attuale.' });
  }
  if (!/^\d{4}$/.test(newPin)) return res.status(400).json({ error: 'Il nuovo PIN deve contenere esattamente 4 cifre.' });
  if (!factor) return res.status(400).json({ error: 'Conferma anche il PIN attuale o il codice TOTP.' });

  try {
    const user = await loadAdminCredentialUser(req.user._id);
    if (!user || !await bcrypt.compare(currentPassword, user.passwordHash)) {
      return res.status(401).json({ error: 'La password attuale non è corretta.' });
    }
    if (!await verifyCurrentAdminFactor(user, factor)) {
      return res.status(401).json({ error: 'Il fattore di verifica attuale non è corretto.' });
    }

    user.security.adminPinHash = await bcrypt.hash(newPin, 12);
    await user.save();
    await AdminPinAttempt.deleteOne({ userId: user._id });
    await revokeOtherAdminSessions(user._id, req.authSession?._id);
    await logSecurityEvent('pin_changed', normalizedIp(req.ip), 'PIN amministratore aggiornato.', user._id);
    return res.json({ changed: true });
  } catch (error) {
    console.error('Could not change admin PIN:', error);
    return res.status(500).json({ error: 'Non è stato possibile aggiornare il PIN.' });
  }
});

router.post('/security/emails/request', requireAdmin, async (req, res) => {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const purpose = typeof req.body?.purpose === 'string' ? req.body.purpose : '';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return res.status(400).json({ error: 'Inserisci un indirizzo email valido.' });
  }
  if (!allowedEmailPurposes.has(purpose)) return res.status(400).json({ error: 'Tipo di indirizzo non valido.' });
  if (!password || Buffer.byteLength(password, 'utf8') > 72) {
    return res.status(400).json({ error: 'Conferma la password amministratore.' });
  }

  try {
    const user = await loadAdminCredentialUser(req.user._id);
    if (!user || !await bcrypt.compare(password, user.passwordHash)) {
      return res.status(401).json({ error: 'La password amministratore non è corretta.' });
    }
    if (purpose === 'primary') {
      const owner = await User.findOne({ email, _id: { $ne: user._id } }).select('_id');
      if (owner) return res.status(409).json({ error: 'Questo indirizzo email è già associato a un account.' });
      if (email === user.email) return res.status(409).json({ error: 'È già l’indirizzo email principale.' });
    } else {
      if (email === user.email || user.security.notificationEmails.some((entry) => entry.email === email)) {
        return res.status(409).json({ error: 'Questo indirizzo è già presente nell’account.' });
      }
    }

    const now = new Date();
    const existingRequest = user.security.pendingEmailVerifications.find((entry) => (
      entry.purpose === purpose && entry.expiresAt > now
    ));
    if (existingRequest) {
      return res.status(429).json({ error: 'Hai già una verifica email in corso. Usa il codice inviato o attendi la scadenza.' });
    }

    const code = String(crypto.randomInt(100000, 1000000));
    const businessName = await getSiteBusinessName();
    await sendNotificationEmail({
      recipient: email,
      subject: `Verifica email amministratore ${businessName}`,
      name: user.name,
      message: `Il tuo codice di verifica è ${code}. Scade tra 10 minuti. Se non hai richiesto questa modifica, ignora questa email.`,
    });
    user.security.pendingEmailVerifications.push({
      email,
      purpose,
      codeHash: await bcrypt.hash(code, 10),
      expiresAt: new Date(now.getTime() + 10 * 60 * 1000),
    });
    await user.save();
    await logSecurityEvent('email_verification_requested', normalizedIp(req.ip), `Verifica richiesta per ${purpose}.`, user._id);
    return res.json({ requested: true, expiresInMs: 10 * 60 * 1000 });
  } catch (error) {
    if (error.code === 'EMAIL_NOT_CONFIGURED' || error.code === 'EMAIL_CONFIG_INVALID') {
      return res.status(503).json({ error: 'La verifica email non è disponibile: configura il servizio SMTP del server.' });
    }
    console.error('Could not request admin email verification:', error);
    return res.status(502).json({ error: 'Non è stato possibile inviare il codice di verifica.' });
  }
});

router.post('/security/emails/verify', requireAdmin, async (req, res) => {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const purpose = typeof req.body?.purpose === 'string' ? req.body.purpose : '';
  const code = typeof req.body?.code === 'string' ? req.body.code.trim() : '';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254
      || !allowedEmailPurposes.has(purpose) || !/^\d{6}$/.test(code)) {
    return res.status(400).json({ error: 'Indirizzo, tipo o codice di verifica non valido.' });
  }

  try {
    const user = await loadAdminCredentialUser(req.user._id);
    if (!user) return res.status(404).json({ error: 'Account amministratore non trovato.' });
    const lock = await checkSecurityLock(user._id);
    if (lock.locked) {
      res.setHeader('Retry-After', String(lock.retryAfterSeconds));
      return res.status(429).json({ error: 'Troppe verifiche errate. Riprova più tardi.' });
    }
    const pending = user.security.pendingEmailVerifications.find((entry) => (
      entry.email === email && entry.purpose === purpose && entry.expiresAt > new Date()
    ));
    if (!pending || !await bcrypt.compare(code, pending.codeHash)) {
      const failure = await recordFailedSecurityAttempt(user._id);
      if (failure.locked) {
        res.setHeader('Retry-After', String(securityLockoutMs / 1000));
        return res.status(429).json({ error: 'Troppe verifiche errate. Blocco temporaneo per 30 minuti.' });
      }
      return res.status(401).json({ error: `Codice non corretto. Tentativi rimasti: ${failure.remaining}.` });
    }

    if (purpose === 'primary') {
      const owner = await User.findOne({ email, _id: { $ne: user._id } }).select('_id');
      if (owner) return res.status(409).json({ error: 'Questo indirizzo email è già associato a un account.' });
      user.email = email;
    } else {
      if (email === user.email || user.security.notificationEmails.some((entry) => entry.email === email)) {
        return res.status(409).json({ error: 'Questo indirizzo è già presente nell’account.' });
      }
      user.security.notificationEmails.push({ email, verifiedAt: new Date() });
    }
    user.security.pendingEmailVerifications = user.security.pendingEmailVerifications.filter((entry) => (
      entry.purpose !== purpose
    ));
    await user.save();
    if (purpose === 'primary') await revokeOtherAdminSessions(user._id, req.authSession?._id);
    await AdminSecurityAttempt.deleteOne({ userId: user._id });
    await logSecurityEvent(
      purpose === 'primary' ? 'email_updated' : 'notification_email_added',
      normalizedIp(req.ip),
      `Indirizzo ${purpose} verificato e aggiornato.`,
      user._id,
    );
    return res.json({ verified: true, user: publicUser(user), security: { notificationEmails: user.security.notificationEmails } });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: 'Questo indirizzo email è già associato a un account.' });
    }
    console.error('Could not verify admin email:', error);
    return res.status(500).json({ error: 'Non è stato possibile verificare l’indirizzo email.' });
  }
});

router.delete('/security/emails/notification/:email', requireAdmin, async (req, res) => {
  const email = typeof req.params.email === 'string' ? req.params.email.trim().toLowerCase() : '';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !password || Buffer.byteLength(password, 'utf8') > 72) {
    return res.status(400).json({ error: 'Indirizzo email o password non valido.' });
  }
  try {
    const user = await loadAdminCredentialUser(req.user._id);
    if (!user || !await bcrypt.compare(password, user.passwordHash)) {
      return res.status(401).json({ error: 'La password amministratore non è corretta.' });
    }
    const existingCount = user.security.notificationEmails.length;
    user.security.notificationEmails = user.security.notificationEmails.filter((entry) => entry.email !== email);
    if (user.security.notificationEmails.length === existingCount) {
      return res.status(404).json({ error: 'Email aggiuntiva non trovata.' });
    }
    await user.save();
    await logSecurityEvent('notification_email_removed', normalizedIp(req.ip), 'Email aggiuntiva rimossa.', user._id);
    return res.json({ removed: true, notificationEmails: user.security.notificationEmails });
  } catch (error) {
    console.error('Could not remove admin notification email:', error);
    return res.status(500).json({ error: 'Non è stato possibile rimuovere l’indirizzo email.' });
  }
});

router.post('/security/emergency-reset', async (req, res) => {
  if (process.env.NODE_ENV === 'production') return res.status(404).json({ error: 'Not Found' });
  const clientIp = normalizedIp(req.ip);
  if (clientIp !== '127.0.0.1' && clientIp !== '::1') {
    return res.status(403).json({ error: 'Reset disponibile solo dalla sessione locale.' });
  }

  try {
    const settings = await getAdminSecuritySettings();
    settings.trafficLimitsEnabled = false;
    settings.ddosProtectionEnabled = false;
    settings.ipRules = (settings.ipRules || []).filter((rule) => rule.address !== clientIp);
    await settings.save();
    invalidateSecuritySettingsCache();

    const day = new Date().toISOString().slice(0, 10);
    const deletedCounters = await AdminTrafficCounter.deleteMany({ day });

    return res.json({
      reset: true,
      trafficLimitsEnabled: false,
      ddosProtectionEnabled: false,
      deletedCounters: deletedCounters.deletedCount,
      day,
    });
  } catch (error) {
    console.error('Could not reset admin traffic protection:', error);
    return res.status(500).json({ error: 'Non è stato possibile ripristinare i limiti di traffico.' });
  }
});

router.get('/activity-logs', requireAdmin, async (_req, res) => {
  res.set('Cache-Control', 'no-store');
  try {
    const logs = await AdminActivityLog.find({})
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();
    return res.json({
      logs: logs.map((log) => ({
        id: log._id.toString(),
        action: log.action,
        resource: log.resource,
        actorName: log.actorName,
        targetId: log.targetId,
        outcome: log.outcome,
        statusCode: log.statusCode,
        createdAt: log.createdAt,
      })),
    });
  } catch (error) {
    console.error('Could not load admin activity logs:', error);
    return res.status(500).json({ error: 'Non è stato possibile caricare le attività amministrative.' });
  }
});

router.get('/security/controls', requireAdmin, async (req, res) => {
  try {
    const settings = await getAdminSecuritySettings();
    const day = new Date().toISOString().slice(0, 10);
    const clientIp = normalizedIp(req.ip);
    const [globalCounter, ipCounter, events] = await Promise.all([
      AdminTrafficCounter.findOne({ day, key: 'global' }).lean(),
      clientIp ? AdminTrafficCounter.findOne({ day, key: `ip:${clientIp}` }).lean() : null,
      AdminSecurityEvent.find().sort({ createdAt: -1 }).limit(30).lean(),
    ]);
    return res.json({
      controls: {
        ddosProtectionEnabled: settings.ddosProtectionEnabled,
        trafficLimitsEnabled: settings.trafficLimitsEnabled,
        perIpRequestsPerDay: settings.perIpRequestsPerDay,
        perIpBytesPerDay: settings.perIpBytesPerDay,
        globalRequestsPerDay: settings.globalRequestsPerDay,
        globalBytesPerDay: settings.globalBytesPerDay,
        currentIp: clientIp,
        ipRules: settings.ipRules.map((rule) => ({
          id: rule._id.toString(),
          address: rule.address,
          mode: rule.mode,
          action: rule.action,
          reason: rule.reason,
          expiresAt: rule.expiresAt,
          createdAt: rule.createdAt,
        })),
        traffic: {
          day,
          globalRequests: globalCounter?.requests || 0,
          globalBytes: globalCounter?.bytes || 0,
          currentIpRequests: ipCounter?.requests || 0,
          currentIpBytes: ipCounter?.bytes || 0,
        },
        events: events.map((event) => ({
          id: event._id.toString(),
          type: event.type,
          ipAddress: event.ipAddress,
          details: event.details,
          createdAt: event.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error('Could not load admin security controls:', error);
    return res.status(500).json({ error: 'Non è stato possibile caricare i controlli di sicurezza.' });
  }
});

router.put('/security/controls', requireAdmin, async (req, res) => {
  const body = req.body && typeof req.body === 'object' && !Array.isArray(req.body) ? req.body : {};
  const booleanFields = ['ddosProtectionEnabled', 'trafficLimitsEnabled'];
  const numberFields = [
    'perIpRequestsPerDay',
    'perIpBytesPerDay',
    'globalRequestsPerDay',
    'globalBytesPerDay',
  ];
  if (booleanFields.some((field) => typeof body[field] !== 'boolean')) {
    return res.status(400).json({ error: 'Seleziona lo stato dei controlli di protezione.' });
  }
  if (numberFields.some((field) => !Number.isSafeInteger(body[field]))) {
    return res.status(400).json({ error: 'I limiti di traffico devono essere numeri interi validi.' });
  }
  const ranges = {
    perIpRequestsPerDay: [60, 1000000],
    perIpBytesPerDay: [1048576, 5368709120],
    globalRequestsPerDay: [1000, 10000000],
    globalBytesPerDay: [10485760, 10995116277760],
  };
  if (numberFields.some((field) => body[field] < ranges[field][0] || body[field] > ranges[field][1])) {
    return res.status(400).json({ error: 'Uno o più limiti sono fuori dall’intervallo consentito.' });
  }

  try {
    const settings = await getAdminSecuritySettings();
    for (const field of [...booleanFields, ...numberFields]) settings[field] = body[field];
    settings.updatedBy = req.user._id;
    await settings.save();
    invalidateSecuritySettingsCache();
    await logSecurityEvent(
      'traffic_limits_updated',
      normalizedIp(req.ip),
      `Protezione applicativa ${settings.ddosProtectionEnabled ? 'attiva' : 'disattivata'}; limiti giornalieri ${settings.trafficLimitsEnabled ? 'attivi' : 'disattivati'}.`,
      req.user._id,
    );
    return res.json({ saved: true });
  } catch (error) {
    console.error('Could not save admin security controls:', error);
    return res.status(500).json({ error: 'Non è stato possibile salvare i controlli di sicurezza.' });
  }
});

router.post('/security/ip-rules', requireAdmin, async (req, res) => {
  const address = normalizedIp(req.body?.address);
  const mode = typeof req.body?.mode === 'string' ? req.body.mode : '';
  const action = typeof req.body?.action === 'string' ? req.body.action : 'deny';
  const reason = typeof req.body?.reason === 'string'
    ? req.body.reason.replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, 160)
    : '';
  const durationHours = Number(req.body?.durationHours);
  if (!address) return res.status(400).json({ error: 'Inserisci un indirizzo IPv4 o IPv6 valido, senza CIDR.' });
  if (!['allow', 'block'].includes(mode)) return res.status(400).json({ error: 'Seleziona autorizza o limita.' });
  if (!['deny', 'throttle'].includes(action)) return res.status(400).json({ error: 'Azione IP non valida.' });
  if (!allowedIpRuleDurations.has(durationHours)) return res.status(400).json({ error: 'Durata della regola non valida.' });
  if (mode === 'block' && address === normalizedIp(req.ip)) {
    return res.status(400).json({ error: 'Non puoi bloccare il tuo IP corrente da questa sessione.' });
  }

  try {
    const settings = await getAdminSecuritySettings();
    if (settings.ipRules.some((rule) => (
      rule.address === address && (!rule.expiresAt || rule.expiresAt > new Date())
    ))) {
      return res.status(409).json({ error: 'Esiste già una regola attiva per questo IP.' });
    }
    const expiresAt = durationHours
      ? new Date(Date.now() + durationHours * 60 * 60 * 1000)
      : null;
    settings.ipRules.push({
      address,
      mode,
      action: mode === 'block' ? action : 'deny',
      reason,
      expiresAt,
      createdBy: req.user._id,
    });
    const rule = settings.ipRules[settings.ipRules.length - 1];
    settings.updatedBy = req.user._id;
    await settings.save();
    invalidateSecuritySettingsCache();
    await logSecurityEvent(
      'ip_rule_added',
      address,
      `${mode === 'allow' ? 'Autorizzazione' : action === 'throttle' ? 'Limitazione' : 'Blocco'} IP aggiunto${reason ? `: ${reason}` : '.'}`,
      req.user._id,
    );
    return res.status(201).json({
      rule: {
        id: rule._id.toString(),
        address: rule.address,
        mode: rule.mode,
        action: rule.action,
        reason: rule.reason,
        expiresAt: rule.expiresAt,
        createdAt: rule.createdAt,
      },
    });
  } catch (error) {
    console.error('Could not create admin IP rule:', error);
    return res.status(500).json({ error: 'Non è stato possibile salvare la regola IP.' });
  }
});

router.delete('/security/ip-rules/:id', requireAdmin, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: 'Identificativo regola non valido.' });
  try {
    const settings = await getAdminSecuritySettings();
    const rule = settings.ipRules.id(req.params.id);
    if (!rule) return res.status(404).json({ error: 'Regola IP non trovata.' });
    const address = rule.address;
    settings.ipRules.pull({ _id: req.params.id });
    settings.updatedBy = req.user._id;
    await settings.save();
    invalidateSecuritySettingsCache();
    await logSecurityEvent('ip_rule_removed', address, 'Regola IP rimossa.', req.user._id);
    return res.json({ removed: true });
  } catch (error) {
    console.error('Could not remove admin IP rule:', error);
    return res.status(500).json({ error: 'Non è stato possibile rimuovere la regola IP.' });
  }
});

router.post('/security/totp/setup', requireAdmin, async (req, res) => {
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  if (!password || Buffer.byteLength(password, 'utf8') > 72) {
    return res.status(400).json({ error: 'Conferma la password amministratore.' });
  }
  if (!isEncryptionConfigured()) {
    return res.status(503).json({
      error: 'Configurazione mancante: imposta ADMIN_MFA_ENCRYPTION_KEY come chiave base64 da 32 byte e riavvia il server.',
    });
  }

  try {
    const user = await User.findById(req.user._id).select('+passwordHash +security');
    if (!user || !await bcrypt.compare(password, user.passwordHash)) {
      return res.status(401).json({ error: 'La password amministratore non è corretta.' });
    }
    if (user.security?.totpEnabled) {
      return res.status(409).json({ error: 'Il TOTP è già attivo. Disattivalo prima di configurarlo di nuovo.' });
    }

    const secret = encodeBase32(crypto.randomBytes(20));
    const encryptedSecret = encryptSecret(secret);
    const authSession = req.authSession;
    if (!authSession) return res.status(401).json({ error: 'La sessione amministratore non è valida.' });
    authSession.pendingTotpSecretEncrypted = encryptedSecret;
    authSession.totpSetupExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await authSession.save();

    const businessName = await getSiteBusinessName();
    const label = encodeURIComponent(`${businessName}:${user.email}`);
    const issuer = encodeURIComponent(businessName);
    return res.json({
      secret,
      otpauthUri: `otpauth://totp/${label}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`,
      expiresInMs: 10 * 60 * 1000,
    });
  } catch (error) {
    console.error('Could not start TOTP setup:', error);
    return res.status(500).json({ error: 'Non è stato possibile avviare la configurazione TOTP.' });
  }
});

router.post('/security/totp/enable', requireAdmin, async (req, res) => {
  const code = typeof req.body?.code === 'string' ? req.body.code.trim() : '';
  if (!/^\d{6}$/.test(code)) return res.status(400).json({ error: 'Inserisci il codice a 6 cifre dell’app.' });

  try {
    const authSession = req.authSession && await AuthSession.findOne({
      _id: req.authSession._id,
      adminVerified: true,
      expiresAt: { $gt: new Date() },
      totpSetupExpiresAt: { $gt: new Date() },
    }).select('+pendingTotpSecretEncrypted');
    if (!authSession?.pendingTotpSecretEncrypted) {
      return res.status(410).json({ error: 'La configurazione è scaduta. Avviala di nuovo.' });
    }

    const lock = await checkSecurityLock(req.user._id);
    if (lock.locked) {
      res.setHeader('Retry-After', String(lock.retryAfterSeconds));
      return res.status(429).json({ error: 'Troppe verifiche errate. Riprova più tardi.' });
    }
    const secret = decryptSecret(authSession.pendingTotpSecretEncrypted);
    if (!verifyTotp(secret, code)) {
      const failure = await recordFailedSecurityAttempt(req.user._id);
      if (failure.locked) {
        res.setHeader('Retry-After', String(securityLockoutMs / 1000));
        return res.status(429).json({ error: 'Troppi codici errati. La verifica è bloccata per 30 minuti.' });
      }
      return res.status(401).json({ error: `Codice non corretto. Tentativi rimasti: ${failure.remaining}.` });
    }

    const recoveryCodes = generateRecoveryCodes();
    const user = await User.findById(req.user._id).select('+security');
    if (!user) return res.status(404).json({ error: 'Account amministratore non trovato.' });
    user.security.totpEnabled = true;
    user.security.totpSecretEncrypted = authSession.pendingTotpSecretEncrypted;
    user.security.recoveryCodeHashes = recoveryCodes.map(hashRecoveryCode);
    await user.save();
    authSession.pendingTotpSecretEncrypted = undefined;
    authSession.totpSetupExpiresAt = undefined;
    await authSession.save();
    await AdminSecurityAttempt.deleteOne({ userId: user._id });
    return res.json({ enabled: true, recoveryCodes });
  } catch (error) {
    console.error('Could not enable TOTP:', error);
    return res.status(500).json({ error: 'Non è stato possibile attivare TOTP.' });
  }
});

router.post('/security/totp/disable', requireAdmin, async (req, res) => {
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  const code = typeof req.body?.code === 'string' ? req.body.code.trim() : '';
  if (!password || Buffer.byteLength(password, 'utf8') > 72 || !/^\d{6}$/.test(code)) {
    return res.status(400).json({ error: 'Inserisci password e codice TOTP corrente.' });
  }

  try {
    const user = await User.findById(req.user._id).select('+passwordHash +security');
    if (!user || !await bcrypt.compare(password, user.passwordHash)) {
      return res.status(401).json({ error: 'La password amministratore non è corretta.' });
    }
    if (!user.security?.totpEnabled || !verifyTotp(decryptSecret(user.security.totpSecretEncrypted), code)) {
      return res.status(401).json({ error: 'Il codice TOTP non è corretto.' });
    }

    user.security.totpEnabled = false;
    user.security.totpSecretEncrypted = '';
    user.security.recoveryCodeHashes = [];
    await user.save();
    await AuthSession.deleteMany({ userId: user._id, _id: { $ne: req.authSession?._id } });
    return res.json({ enabled: false });
  } catch (error) {
    console.error('Could not disable TOTP:', error);
    return res.status(500).json({ error: 'Non è stato possibile disattivare TOTP.' });
  }
});

router.post('/security/tokens', requireAdmin, async (req, res) => {
  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  const scopes = safeTokenScopes(req.body?.scopes);
  const expiresInDays = Number(req.body?.expiresInDays);
  if (name.length < 2 || name.length > 80) return res.status(400).json({ error: 'Assegna un nome da 2 a 80 caratteri al token.' });
  if (!password || Buffer.byteLength(password, 'utf8') > 72) return res.status(400).json({ error: 'Conferma la password amministratore.' });
  if (!scopes) return res.status(400).json({ error: 'Seleziona almeno un’autorizzazione valida.' });
  if (![0, 30, 90, 365].includes(expiresInDays)) return res.status(400).json({ error: 'La scadenza selezionata non è valida.' });

  try {
    const user = await User.findById(req.user._id).select('+passwordHash');
    if (!user || !await bcrypt.compare(password, user.passwordHash)) {
      return res.status(401).json({ error: 'La password amministratore non è corretta.' });
    }
    const secret = `pg_admin_${crypto.randomBytes(32).toString('base64url')}`;
    const token = await AdminApiToken.create({
      userId: user._id,
      name,
      tokenHash: hashToken(secret),
      tokenPrefix: `${secret.slice(0, 18)}…`,
      scopes,
      expiresAt: expiresInDays
        ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
        : null,
    });
    return res.status(201).json({
      token: secret,
      tokenInfo: {
        id: token.id,
        name: token.name,
        tokenPrefix: token.tokenPrefix,
        scopes: token.scopes,
        expiresAt: token.expiresAt,
        createdAt: token.createdAt,
      },
    });
  } catch (error) {
    console.error('Could not create admin API token:', error);
    return res.status(500).json({ error: 'Non è stato possibile creare il token API.' });
  }
});

router.delete('/security/tokens/:id', requireAdmin, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: 'Identificativo token non valido.' });
  try {
    const result = await AdminApiToken.updateOne(
      { _id: req.params.id, userId: req.user._id, revokedAt: null },
      { $set: { revokedAt: new Date() } },
    );
    if (result.matchedCount !== 1) return res.status(404).json({ error: 'Token non trovato o già revocato.' });
    return res.json({ revoked: true });
  } catch (error) {
    console.error('Could not revoke admin API token:', error);
    return res.status(500).json({ error: 'Non è stato possibile revocare il token.' });
  }
});

router.get('/integration/vehicles', requireAdminApiToken('vehicles:read'), async (_req, res) => {
  try {
    const vehicles = await mongoose.connection.collection('vehicles')
      .find({}, { projection: { _id: 0, id: 1, make: 1, model: 1, year: 1, price: 1, type: 1, status: 1 } })
      .sort({ createdAt: -1 })
      .limit(500)
      .toArray();
    return res.json({ vehicles });
  } catch (error) {
    console.error('Admin API vehicle export failed:', error);
    return res.status(500).json({ error: 'Non è stato possibile leggere l’inventario.' });
  }
});

router.get('/integration/analytics', requireAdminApiToken('analytics:read'), async (_req, res) => {
  try {
    const inventory = await mongoose.connection.collection('vehicles').aggregate([
      { $group: { _id: { type: '$type', status: '$status' }, count: { $sum: 1 } } },
      { $sort: { '_id.type': 1, '_id.status': 1 } },
    ]).toArray();
    return res.json({ inventory });
  } catch (error) {
    console.error('Admin API analytics export failed:', error);
    return res.status(500).json({ error: 'Non è stato possibile leggere le statistiche.' });
  }
});

router.post('/mfa/totp', async (req, res) => {
  const code = typeof req.body?.code === 'string' ? req.body.code.trim() : '';
  if (!/^(?:\d{6}|[A-Fa-f0-9-]{11,})$/.test(code)) {
    return res.status(400).json({ error: 'Inserisci il codice TOTP o un codice di recupero.' });
  }

  try {
    const pending = await getPendingAdminFactor(req);
    if (!pending) return res.status(401).json({ error: 'La verifica è scaduta. Accedi di nuovo.' });
    const { token, session, user } = pending;
    if (!user.security?.totpEnabled) return res.status(400).json({ error: 'TOTP non è configurato per questo account.' });

    const lock = await checkSecurityLock(user._id);
    if (lock.locked) {
      res.setHeader('Retry-After', String(lock.retryAfterSeconds));
      return res.status(429).json({ error: 'Troppi codici errati. Riprova più tardi.' });
    }

    const validTotp = /^\d{6}$/.test(code)
      && verifyTotp(decryptSecret(user.security.totpSecretEncrypted), code);
    let recoveryCodeIndex = -1;
    if (!validTotp) {
      const candidateHash = hashRecoveryCode(code);
      recoveryCodeIndex = user.security.recoveryCodeHashes.findIndex((savedHash) => {
        const saved = Buffer.from(savedHash, 'hex');
        const candidate = Buffer.from(candidateHash, 'hex');
        return saved.length === candidate.length && crypto.timingSafeEqual(saved, candidate);
      });
    }

    if (!validTotp && recoveryCodeIndex < 0) {
      const failure = await recordFailedSecurityAttempt(user._id);
      if (failure.locked) {
        res.setHeader('Retry-After', String(securityLockoutMs / 1000));
        return res.status(429).json({ error: 'Troppi codici errati. L’accesso è bloccato per 30 minuti.' });
      }
      return res.status(401).json({ error: `Codice non corretto. Tentativi rimasti: ${failure.remaining}.` });
    }

    if (recoveryCodeIndex >= 0) {
      user.security.recoveryCodeHashes.splice(recoveryCodeIndex, 1);
      await user.save();
    }
    await setAuthenticatedSession(res, session, token);
    await AdminSecurityAttempt.deleteOne({ userId: user._id });
    return res.json({ user: publicUser(user), recoveryCodesRemaining: user.security.recoveryCodeHashes.length });
  } catch (error) {
    console.error('Admin TOTP verification failed:', error);
    return res.status(500).json({ error: 'Non è stato possibile verificare il codice.' });
  }
});

module.exports = router;
