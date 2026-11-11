const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('node:crypto');
const User = require('../models/User');
const AuthSession = require('../models/AuthSession');
const AdminPinAttempt = require('../models/AdminPinAttempt');
const { getAdminConfig, getAdminPinHash } = require('../config/admin');

const router = express.Router();
const sessionCookieName = 'peluso_session';
const sessionLifetimeMs = 7 * 24 * 60 * 60 * 1000;
const adminPinChallengeLifetimeMs = 10 * 60 * 1000;
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
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader(
    'Set-Cookie',
    `${sessionCookieName}=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${Math.floor(lifetimeMs / 1000)}${secure}`,
  );
}

function clearSessionCookie(res) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader(
    'Set-Cookie',
    `${sessionCookieName}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${secure}`,
  );
}

function hashSessionToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function publicUser(user) {
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

function validEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}

async function createSession(user, res) {
  const token = crypto.randomBytes(32).toString('base64url');
  const isAdmin = user.role === 'admin';
  const lifetimeMs = isAdmin ? adminPinChallengeLifetimeMs : sessionLifetimeMs;
  await AuthSession.create({
    userId: user._id,
    tokenHash: hashSessionToken(token),
    adminVerified: !isAdmin,
    ...(isAdmin ? { pendingPinExpiresAt: new Date(Date.now() + lifetimeMs) } : {}),
    expiresAt: new Date(Date.now() + lifetimeMs),
  });
  setSessionCookie(res, token, lifetimeMs);
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
  if (password.length < 8 || Buffer.byteLength(password, 'utf8') > 72) {
    return res.status(400).json({ error: 'La password deve contenere almeno 8 caratteri e non superare 72 byte.' });
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

  if ((!validEmail(identifier) && !/^[a-z0-9._-]{3,32}$/.test(identifier))
    || password.length === 0 || Buffer.byteLength(password, 'utf8') > 72) {
    return res.status(400).json({ error: 'Inserisci un nome utente o indirizzo email e una password validi.' });
  }

  try {
    const adminConfig = getAdminConfig();
    const email = adminConfig && identifier === adminConfig.username
      ? adminConfig.email
      : identifier;
    const user = await User.findOne({ email }).select('+passwordHash');
    const matches = user && await bcrypt.compare(password, user.passwordHash);
    if (!matches) {
      return res.status(401).json({ error: 'Nome utente/email o password non corretti.' });
    }

    await createSession(user, res);
    if (user.role === 'admin') {
      return res.json({ requiresAdminPin: true });
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
      clearSessionCookie(res);
      return res.json({ user: null });
    }

    const user = await User.findById(session.userId);
    if (!user) {
      await AuthSession.deleteOne({ _id: session._id });
      clearSessionCookie(res);
      return res.json({ user: null });
    }

    if (user.role === 'admin' && !session.adminVerified) {
      if (!session.pendingPinExpiresAt || session.pendingPinExpiresAt <= new Date()) {
        await AuthSession.deleteOne({ _id: session._id });
        clearSessionCookie(res);
        return res.json({ user: null });
      }
      return res.json({ user: null, requiresAdminPin: true });
    }

    return res.json({ user: publicUser(user) });
  } catch (error) {
    console.error('Could not load signed-in user:', error);
    return res.status(500).json({ error: 'Non è stato possibile caricare il tuo account.' });
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

    const user = await User.findById(session.userId);
    if (!user || user.role !== 'admin') {
      clearSessionCookie(res);
      return res.status(403).json({ error: 'Verifica amministratore non disponibile.' });
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

    const pinHash = getAdminPinHash();
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
