const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('node:crypto');
const User = require('../models/User');
const AuthSession = require('../models/AuthSession');
const AdminPinAttempt = require('../models/AdminPinAttempt');
const AdminSecurityAttempt = require('../models/AdminSecurityAttempt');
const { getAdminConfig, getAdminPinHash } = require('../config/admin');
const { getAuthenticatedSession } = require('../middleware/auth');
const { sendNotificationEmail } = require('../services/contactEmail');

const router = express.Router();
const sessionCookieName = '__Host-peluso_session';
const sessionLifetimeMs = 7 * 24 * 60 * 60 * 1000;
const adminPinChallengeLifetimeMs = 60 * 1000;
const pendingAdminSessionRetentionMs = 24 * 60 * 60 * 1000;
const adminPinLockoutMs = 30 * 60 * 1000;
const adminPinMaxAttempts = 3;

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

function setSessionCookie(res, token, lifetimeMs = sessionLifetimeMs) {
  res.setHeader(
    'Set-Cookie',
    `${sessionCookieName}=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${Math.ceil(lifetimeMs / 1000)}`,
  );
}

function clearSessionCookie(res) {
  res.setHeader(
    'Set-Cookie',
    [
      `${sessionCookieName}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`,
      'peluso_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0',
    ],
  );
}

function hashSessionToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function publicUser(user) {
  return { id: user.id, name: user.name, email: user.email, username: user.username || '', role: user.role };
}

function validEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}

function signupPasswordError(password) {
  if (password.length < 8) return 'La password deve contenere almeno 8 caratteri.';
  if (Buffer.byteLength(password, 'utf8') > 72) return 'La password non può superare 72 byte.';
  if (!/\p{Ll}/u.test(password)) return 'Aggiungi almeno una lettera minuscola alla password.';
  if (!/\p{Lu}/u.test(password)) return 'Aggiungi almeno una lettera maiuscola alla password.';
  if (!/\p{N}/u.test(password)) return 'Aggiungi almeno un numero alla password.';
  if (!/[^\p{L}\p{N}]/u.test(password)) return 'Aggiungi almeno un simbolo alla password.';
  return '';
}

async function createSession(user, res) {
  const token = crypto.randomBytes(32).toString('base64url');
  const isAdmin = user.role === 'admin';
  const now = Date.now();
  // Keep the authorization deadline independent of MongoDB's TTL cleanup clock.
  const pendingPinExpiresAt = isAdmin ? new Date(now + adminPinChallengeLifetimeMs) : undefined;
  const expiresAt = new Date(now + (isAdmin ? pendingAdminSessionRetentionMs : sessionLifetimeMs));
  await AuthSession.create({
    userId: user._id,
    tokenHash: hashSessionToken(token),
    adminVerified: !isAdmin,
    ...(isAdmin ? { pendingPinExpiresAt } : {}),
    expiresAt,
  });
  setSessionCookie(res, token, isAdmin ? adminPinChallengeLifetimeMs : sessionLifetimeMs);
  return isAdmin ? Math.max(0, pendingPinExpiresAt.getTime() - Date.now()) : null;
}

router.post('/signup', async (req, res) => {
  const body = req.body && typeof req.body === 'object' ? req.body : {};
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';

  if (name.length < 2 || name.length > 80) {
    return res.status(400).json({ error: 'Il nome deve contenere da 2 a 80 caratteri.' });
  }
  if (!validEmail(email)) {
    return res.status(400).json({ error: 'Inserisci un indirizzo email valido.' });
  }
  const passwordError = signupPasswordError(password);
  if (passwordError) {
    return res.status(400).json({ error: passwordError });
  }

  try {
    const adminConfig = getAdminConfig();
    if (adminConfig && email === adminConfig.email) {
      return res.status(409).json({ error: 'Questo indirizzo è riservato all’account amministratore.' });
    }
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, passwordHash });
    await createSession(user, res);
    return res.status(201).json({ user: publicUser(user) });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: 'Esiste già un account con questo indirizzo email.' });
    }
    console.error('Account signup failed:', error);
    return res.status(500).json({ error: 'Non è stato possibile creare l’account. Riprova.' });
  }
});

router.post('/login', async (req, res) => {
  const body = req.body && typeof req.body === 'object' ? req.body : {};
  const identifier = typeof body.identifier === 'string'
    ? body.identifier.trim().toLowerCase()
    : typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';

  if (!validEmail(identifier) && !/^[a-z0-9._-]{3,32}$/.test(identifier)) {
    const error = /\s/.test(identifier) && !identifier.includes('@')
      ? 'Il nome utente non può contenere spazi.'
      : 'Inserisci un nome utente (3–32 caratteri, senza spazi) o un indirizzo email valido.';
    return res.status(400).json({ error });
  }
  if (!password) {
    return res.status(400).json({ error: 'Inserisci la password per continuare.' });
  }
  if (Buffer.byteLength(password, 'utf8') > 72) {
    return res.status(400).json({ error: 'La password non può superare 72 byte.' });
  }

  try {
    const user = await User.findOne({
      $or: [{ username: identifier }, { email: identifier }],
    }).select('+passwordHash +security');
    const matches = user && await bcrypt.compare(password, user.passwordHash);
    if (!matches) {
      return res.status(401).json({ error: 'Nome utente/email o password non corretti.' });
    }

    const adminPinExpiresInMs = await createSession(user, res);
    if (user.role === 'admin') {
      const requiresAdminTotp = Boolean(user.security?.totpEnabled);
      return res.json({ requiresAdminPin: !requiresAdminTotp, requiresAdminTotp, adminPinExpiresInMs });
    }
    return res.json({ user: publicUser(user) });
  } catch (error) {
    console.error('Account login failed:', error);
    return res.status(500).json({ error: 'Accesso non riuscito. Riprova.' });
  }
});

router.get('/me', async (req, res) => {
  const token = getSessionToken(req);
  if (!token) {
    return res.json({ user: null });
  }

  try {
    const session = await AuthSession.findOne({
      tokenHash: hashSessionToken(token),
      expiresAt: { $gt: new Date() },
    });

    if (!session) {
      return res.json({ user: null });
    }

    const user = await User.findById(session.userId).select('+security');
    if (!user) {
      await AuthSession.deleteOne({ _id: session._id });
      return res.json({ user: null });
    }

    if (user.role === 'admin' && !session.adminVerified) {
      if (!session.pendingPinExpiresAt || session.pendingPinExpiresAt <= new Date()) {
        await AuthSession.deleteOne({ _id: session._id });
        return res.json({ user: null });
      }
      return res.json({
        user: null,
        requiresAdminPin: !user.security?.totpEnabled,
        requiresAdminTotp: Boolean(user.security?.totpEnabled),
        adminPinExpiresInMs: Math.max(0, session.pendingPinExpiresAt.getTime() - Date.now()),
      });
    }

    return res.json({ user: publicUser(user) });
  } catch (error) {
    console.error('Could not load signed-in user:', error);
    return res.status(500).json({ error: 'Non è stato possibile caricare il tuo account.' });
  }
});

router.all('/account-deletion-request', (_req, res) => {
  res.status(410).json({ error: 'La funzione di cancellazione account è temporaneamente non disponibile.' });
});

async function requireCustomerPassword(req, res, next) {
  try {
    const authenticated = await getAuthenticatedSession(req);
    if (!authenticated) return res.status(401).json({ error: 'Accedi per continuare.' });
    if (authenticated.user.role !== 'user') return res.status(403).json({ error: 'Funzione riservata agli account cliente.' });
    const password = typeof req.body?.currentPassword === 'string' ? req.body.currentPassword : '';
    if (!password || Buffer.byteLength(password, 'utf8') > 72) {
      return res.status(400).json({ error: 'Inserisci la password attuale.' });
    }
    const userId = authenticated.user._id;
    const now = new Date();
    const lock = await AdminSecurityAttempt.findOne({ userId });
    if (lock?.lockedUntil > now) {
      res.setHeader('Retry-After', String(Math.ceil((lock.lockedUntil - now) / 1000)));
      return res.status(429).json({ error: 'Troppi tentativi. Riprova più tardi.' });
    }
    if (lock && lock.expiresAt <= now) await AdminSecurityAttempt.deleteOne({ userId, expiresAt: { $lte: now } });
    const user = await User.findById(userId).select('+passwordHash +pendingCustomerEmail');
    if (!user || !await bcrypt.compare(password, user.passwordHash)) {
      let attempt;
      try {
        attempt = await AdminSecurityAttempt.findOneAndUpdate(
          { userId },
          { $inc: { attempts: 1 }, $set: { expiresAt: new Date(now.getTime() + adminPinLockoutMs) } },
          { upsert: true, new: true, setDefaultsOnInsert: true },
        );
      } catch (error) {
        if (error.code !== 11000) throw error;
        attempt = await AdminSecurityAttempt.findOneAndUpdate(
          { userId },
          { $inc: { attempts: 1 }, $set: { expiresAt: new Date(now.getTime() + adminPinLockoutMs) } },
          { new: true },
        );
      }
      if (attempt.attempts >= 5) {
        const lockedUntil = new Date(now.getTime() + adminPinLockoutMs);
        await AdminSecurityAttempt.updateOne({ userId }, { $set: { lockedUntil, expiresAt: lockedUntil } });
        return res.status(429).json({ error: 'Troppi tentativi. Riprova tra 30 minuti.' });
      }
      return res.status(401).json({ error: 'La password attuale non è corretta.' });
    }
    await AdminSecurityAttempt.deleteOne({ userId });
    req.customer = user;
    req.customerSession = authenticated.session;
    return next();
  } catch (error) {
    console.error('Customer security verification failed:', error);
    return res.status(500).json({ error: 'Non è stato possibile verificare l’account.' });
  }
}

router.patch('/account/credentials', requireCustomerPassword, async (req, res) => {
  const { customer: user, customerSession } = req;
  const username = typeof req.body?.username === 'string' ? req.body.username.trim().toLowerCase() : null;
  const newPassword = typeof req.body?.newPassword === 'string' ? req.body.newPassword : null;
  if ((username === null) === (newPassword === null)) return res.status(400).json({ error: 'Seleziona una sola modifica.' });
  if (username !== null && !/^[a-z0-9._-]{3,32}$/.test(username)) {
    return res.status(400).json({ error: 'Il nome utente deve contenere 3–32 lettere, numeri, punti, trattini o underscore.' });
  }
  if (newPassword !== null) {
    const error = signupPasswordError(newPassword);
    if (error) return res.status(400).json({ error });
  }
  try {
    const adminConfig = getAdminConfig();
    if (username !== null && adminConfig?.username === username) {
      return res.status(409).json({ error: 'Questo nome utente è riservato.' });
    }
    if (username !== null) user.username = username;
    if (newPassword !== null) {
      user.passwordHash = await bcrypt.hash(newPassword, 12);
      user.pendingCustomerEmail = undefined;
    }
    await AuthSession.deleteMany({ userId: user._id, _id: { $ne: customerSession._id } });
    await user.save();
    return res.json({ user: publicUser(user) });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ error: 'Questo nome utente è già utilizzato.' });
    console.error('Could not update customer credentials:', error);
    return res.status(500).json({ error: 'Non è stato possibile aggiornare le credenziali.' });
  }
});

router.post('/account/email/request', requireCustomerPassword, async (req, res) => {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  if (!validEmail(email)) return res.status(400).json({ error: 'Inserisci un indirizzo email valido.' });
  try {
    const user = req.customer;
    if (email === user.email) return res.status(409).json({ error: 'È già il tuo indirizzo email.' });
    if (getAdminConfig()?.email === email || await User.exists({ email })) {
      return res.status(409).json({ error: 'Questo indirizzo email non è disponibile.' });
    }
    const token = crypto.randomBytes(24).toString('base64url');
    const tokenHash = hashSessionToken(token);
    const now = new Date();
    const reserved = await User.findOneAndUpdate(
      { _id: user._id, $or: [{ pendingCustomerEmail: { $exists: false } }, { 'pendingCustomerEmail.expiresAt': { $lte: now } }] },
      { $set: { pendingCustomerEmail: { email, tokenHash, expiresAt: new Date(now.getTime() + 10 * 60 * 1000) } } },
      { new: true, runValidators: true },
    );
    if (!reserved) return res.status(429).json({ error: 'Hai già una verifica in corso. Usa il codice ricevuto o attendi 10 minuti.' });
    try {
      await sendNotificationEmail({
        recipient: email,
        subject: 'Verifica il nuovo indirizzo email',
        name: user.name,
        message: `Il tuo codice di verifica è ${token}. Inseriscilo nella pagina account entro 10 minuti. Se non hai richiesto la modifica, ignora questa email.`,
      });
    } catch (error) {
      await User.updateOne({ _id: user._id, 'pendingCustomerEmail.tokenHash': tokenHash }, { $unset: { pendingCustomerEmail: 1 } });
      throw error;
    }
    return res.json({ requested: true });
  } catch (error) {
    console.error('Could not request customer email verification:', error);
    return res.status(503).json({ error: 'Non è stato possibile inviare il codice. Verifica che il servizio email sia disponibile e riprova.' });
  }
});

router.post('/account/email/verify', requireCustomerPassword, async (req, res) => {
  const token = typeof req.body?.token === 'string' ? req.body.token.trim() : '';
  if (!/^[A-Za-z0-9_-]{32}$/.test(token)) return res.status(400).json({ error: 'Inserisci il codice ricevuto via email.' });
  try {
    const pending = req.customer.pendingCustomerEmail;
    if (!pending || pending.expiresAt <= new Date() || pending.tokenHash !== hashSessionToken(token)) {
      return res.status(400).json({ error: 'Codice non valido o scaduto.' });
    }
    if (getAdminConfig()?.email === pending.email) return res.status(409).json({ error: 'Questo indirizzo email non è disponibile.' });
    await AuthSession.deleteMany({ userId: req.customer._id, _id: { $ne: req.customerSession._id } });
    const user = await User.findOneAndUpdate(
      { _id: req.customer._id, 'pendingCustomerEmail.tokenHash': pending.tokenHash, 'pendingCustomerEmail.expiresAt': { $gt: new Date() } },
      { $set: { email: pending.email }, $unset: { pendingCustomerEmail: 1 } },
      { new: true, runValidators: true },
    );
    if (!user) return res.status(409).json({ error: 'La verifica è scaduta o è già stata utilizzata.' });
    return res.json({ user: publicUser(user) });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ error: 'Questo indirizzo email è già utilizzato.' });
    console.error('Could not verify customer email:', error);
    return res.status(500).json({ error: 'Non è stato possibile aggiornare l’indirizzo email.' });
  }
});

router.delete('/account', requireCustomerPassword, async (req, res) => {
  try {
    await AuthSession.deleteMany({ userId: req.customer._id });
    const result = await User.deleteOne({ _id: req.customer._id, role: 'user', passwordHash: req.customer.passwordHash });
    if (!result.deletedCount) return res.status(409).json({ error: 'L’account è cambiato. Accedi di nuovo e riprova.' });
    clearSessionCookie(res);
    return res.json({ deleted: true });
  } catch (error) {
    console.error('Could not delete customer account:', error);
    return res.status(500).json({ error: 'Non è stato possibile eliminare l’account. Riprova.' });
  }
});

router.post('/admin-pin', async (req, res) => {
  const token = getSessionToken(req);
  const pin = typeof req.body?.pin === 'string' ? req.body.pin : '';

  if (!/^\d{4}$/.test(pin)) {
    return res.status(400).json({ error: 'Inserisci il codice di 4 cifre.' });
  }

  try {
    const session = token && await AuthSession.findOne({
      tokenHash: hashSessionToken(token),
      expiresAt: { $gt: new Date() },
    });
    if (!session) {
      clearSessionCookie(res);
      return res.status(401).json({ error: 'La verifica è scaduta. Accedi di nuovo.' });
    }

    const user = await User.findById(session.userId).select('+security');
    if (!user || user.role !== 'admin') {
      clearSessionCookie(res);
      return res.status(403).json({ error: 'Verifica amministratore non disponibile.' });
    }
    if (user.security?.totpEnabled) {
      return res.status(400).json({ error: 'Usa il codice TOTP o un codice di recupero per verificare l’accesso.' });
    }
    if (session.adminVerified) {
      return res.json({ user: publicUser(user) });
    }
    if (!session.pendingPinExpiresAt || session.pendingPinExpiresAt <= new Date()) {
      await AuthSession.deleteOne({ _id: session._id });
      clearSessionCookie(res);
      return res.status(401).json({ error: 'La verifica è scaduta. Accedi di nuovo.' });
    }

    const attemptKey = { userId: user._id };
    const now = new Date();
    let attempts = await AdminPinAttempt.findOne(attemptKey);
    if (attempts?.lockedUntil > now) {
      const retryAfterSeconds = Math.ceil((attempts.lockedUntil.getTime() - now.getTime()) / 1000);
      res.setHeader('Retry-After', String(retryAfterSeconds));
      return res.status(429).json({ error: 'Troppi codici errati. Riprova tra 30 minuti.' });
    }
    if (attempts && attempts.expiresAt <= now) {
      await AdminPinAttempt.updateOne(
        { ...attemptKey, expiresAt: { $lte: now } },
        { $set: { attempts: 0, lockedUntil: null, expiresAt: new Date(now.getTime() + adminPinLockoutMs) } },
      );
    }

    const pinHash = user.security?.adminPinHash || getAdminPinHash();
    if (!pinHash) {
      throw new Error('ADMIN_PIN_HASH is required when verifying admin access.');
    }
    if (!await bcrypt.compare(pin, pinHash)) {
      try {
        attempts = await AdminPinAttempt.findOneAndUpdate(
          attemptKey,
          {
            $inc: { attempts: 1 },
            $set: { expiresAt: new Date(now.getTime() + adminPinLockoutMs) },
          },
          { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true },
        );
      } catch (error) {
        if (error.code !== 11000) throw error;
        attempts = await AdminPinAttempt.findOneAndUpdate(
          attemptKey,
          {
            $inc: { attempts: 1 },
            $set: { expiresAt: new Date(now.getTime() + adminPinLockoutMs) },
          },
          { new: true, runValidators: true },
        );
      }
      if (attempts.attempts >= adminPinMaxAttempts) {
        const lockedUntil = new Date(now.getTime() + adminPinLockoutMs);
        await AdminPinAttempt.updateOne(attemptKey, { $set: { lockedUntil, expiresAt: lockedUntil } });
        res.setHeader('Retry-After', String(adminPinLockoutMs / 1000));
        return res.status(429).json({ error: 'Troppi codici errati. Riprova tra 30 minuti.' });
      }
      return res.status(401).json({ error: `Codice non corretto. Tentativi rimasti: ${adminPinMaxAttempts - attempts.attempts}.` });
    }

    attempts = await AdminPinAttempt.findOne(attemptKey);
    if (attempts?.lockedUntil > new Date()) {
      const retryAfterSeconds = Math.ceil((attempts.lockedUntil.getTime() - Date.now()) / 1000);
      res.setHeader('Retry-After', String(retryAfterSeconds));
      return res.status(429).json({ error: 'Troppi codici errati. Riprova tra 30 minuti.' });
    }

    session.adminVerified = true;
    session.pendingPinExpiresAt = undefined;
    session.expiresAt = new Date(Date.now() + sessionLifetimeMs);
    await session.save();
    await AdminPinAttempt.deleteOne(attemptKey);
    setSessionCookie(res, token);
    return res.json({ user: publicUser(user) });
  } catch (error) {
    console.error('Admin PIN verification failed:', error);
    return res.status(500).json({ error: 'Non è stato possibile verificare il codice. Riprova.' });
  }
});

router.post('/logout', async (req, res) => {
  const token = getSessionToken(req);
  clearSessionCookie(res);
  try {
    if (token) {
      const currentSession = await AuthSession.findOne({ tokenHash: hashSessionToken(token) }).select('userId');
      if (currentSession) {
        await AuthSession.deleteMany({ userId: currentSession.userId });
      }
    }
    return res.json({ message: 'Hai effettuato la disconnessione.' });
  } catch (error) {
    console.error('Account logout failed:', error);
    return res.status(500).json({ error: 'Disconnessione non riuscita. Riprova.' });
  }
});

module.exports = router;
