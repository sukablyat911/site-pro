const crypto = require('node:crypto');
const AuthSession = require('../models/AuthSession');
const User = require('../models/User');

const sessionCookieName = '__Host-peluso_session';

function hashSessionToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
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

async function getAuthenticatedSession(req) {
  const token = getSessionToken(req);
  if (!token) return null;

  const session = await AuthSession.findOne({
    tokenHash: hashSessionToken(token),
    expiresAt: { $gt: new Date() },
  });
  if (!session) return null;

  const user = await User.findById(session.userId);
  if (!user) return null;
  if (user.role === 'admin' && !session.adminVerified
      && (!session.pendingPinExpiresAt || session.pendingPinExpiresAt <= new Date())) return null;
  return { session, user };
}

async function getAuthenticatedUser(req) {
  const authenticated = await getAuthenticatedSession(req);
  if (!authenticated) return null;
  if (authenticated.user.role === 'admin' && !authenticated.session.adminVerified) return null;
  return authenticated.user;
}

async function requireAdmin(req, res, next) {
  try {
    const authenticated = await getAuthenticatedSession(req);
    if (!authenticated || (authenticated.user.role === 'admin' && !authenticated.session.adminVerified)) {
      return res.status(401).json({ error: 'Accedi per continuare.' });
    }
    const { session, user } = authenticated;
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Non hai i permessi per gestire le auto.' });
    }
    req.authSession = session;
    req.user = user;
    return next();
  } catch (error) {
    console.error('Admin authorization failed:', error);
    return res.status(500).json({ error: 'Non è stato possibile verificare i permessi.' });
  }
}

function requireSuperAdmin(req, res, next) {
  if (req.user?.username !== 'luigipeluso') {
    return res.status(403).json({ error: 'Solo il Super Admin può gestire gli account amministratori.' });
  }
  return next();
}

module.exports = { getAuthenticatedSession, getAuthenticatedUser, requireAdmin, requireSuperAdmin };
