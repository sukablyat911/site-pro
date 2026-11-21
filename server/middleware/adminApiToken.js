const crypto = require('node:crypto');
const AdminApiToken = require('../models/AdminApiToken');
const User = require('../models/User');

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function requireAdminApiToken(requiredScope) {
  return async (req, res, next) => {
    const authorization = req.headers.authorization || '';
    const match = authorization.match(/^Bearer (pg_admin_[A-Za-z0-9_-]{43})$/);
    if (!match) {
      return res.status(401).json({ error: 'Token API non valido o mancante.' });
    }

    try {
      const now = new Date();
      const tokenRecord = await AdminApiToken.findOne({
        tokenHash: hashToken(match[1]),
        revokedAt: null,
        $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
      });
      if (!tokenRecord) {
        return res.status(401).json({ error: 'Token API non valido o scaduto.' });
      }
      if (!tokenRecord.scopes.includes(requiredScope)) {
        return res.status(403).json({ error: 'Il token non dispone dell’autorizzazione richiesta.' });
      }
      const owner = await User.findOne({ _id: tokenRecord.userId, role: 'admin' }).select('_id');
      if (!owner) {
        return res.status(401).json({ error: 'Token API non valido o associato a un account non amministratore.' });
      }

      await AdminApiToken.updateOne({ _id: tokenRecord._id }, { $set: { lastUsedAt: now } });
      req.adminApiToken = tokenRecord;
      return next();
    } catch (error) {
      console.error('Admin API token verification failed:', error);
      return res.status(500).json({ error: 'Non è stato possibile verificare il token API.' });
    }
  };
}

module.exports = { hashToken, requireAdminApiToken };
