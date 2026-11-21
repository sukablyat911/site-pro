const net = require('node:net');
const AdminSecurityEvent = require('../models/AdminSecurityEvent');
const AdminSecuritySettings = require('../models/AdminSecuritySettings');
const AdminTrafficCounter = require('../models/AdminTrafficCounter');

const requestWindowMs = 60 * 1000;
const burstLimitPerMinute = 120;
const counterRetentionDays = 90;
let cachedSettings = null;
let cacheExpiresAt = 0;
const burstCounters = new Map();
const eventDedupe = new Map();

function getClientIp(value) {
  const ip = String(value || '').trim().toLowerCase();
  const normalized = ip.startsWith('::ffff:') ? ip.slice(7) : ip;
  return net.isIP(normalized) ? normalized : 'unknown';
}

async function getSecuritySettings() {
  if (cachedSettings && cacheExpiresAt > Date.now()) return cachedSettings;
  const saved = await AdminSecuritySettings.findById('global').lean();
  cachedSettings = saved || new AdminSecuritySettings().toObject();
  cacheExpiresAt = Date.now() + 5000;
  return cachedSettings;
}

function invalidateSecuritySettingsCache() {
  cachedSettings = null;
  cacheExpiresAt = 0;
}

function utcDay() {
  return new Date().toISOString().slice(0, 10);
}

async function incrementCounter(key, increments) {
  const day = utcDay();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + counterRetentionDays * 24 * 60 * 60 * 1000);
  const update = {
    $inc: increments,
    $setOnInsert: { expiresAt },
  };
  try {
    return await AdminTrafficCounter.findOneAndUpdate(
      { day, key },
      update,
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
  } catch (error) {
    if (error.code !== 11000) throw error;
    return AdminTrafficCounter.findOneAndUpdate({ day, key }, { $inc: increments }, { new: true });
  }
}

async function logSecurityEvent(type, ipAddress, details, actorId = null) {
  if (['ip_blocked', 'ip_throttled', 'traffic_limit_reached'].includes(type)) {
    const minute = Math.floor(Date.now() / requestWindowMs);
    const dedupeKey = `${type}:${ipAddress}:${minute}`;
    if (eventDedupe.has(dedupeKey)) return;
    eventDedupe.set(dedupeKey, Date.now());
    if (eventDedupe.size > 10000) {
      const cutoff = Date.now() - requestWindowMs * 2;
      for (const [key, timestamp] of eventDedupe) {
        if (timestamp < cutoff) eventDedupe.delete(key);
      }
    }
  }
  await AdminSecurityEvent.create({ type, ipAddress, details, actorId });
}

function incrementBurst(ipAddress) {
  const now = Date.now();
  const current = burstCounters.get(ipAddress);
  if (!current || now - current.startedAt >= requestWindowMs) {
    burstCounters.set(ipAddress, { startedAt: now, requests: 1 });
    return 1;
  }
  current.requests += 1;
  if (burstCounters.size > 20000) {
    for (const [ip, counter] of burstCounters) {
      if (now - counter.startedAt >= requestWindowMs) burstCounters.delete(ip);
    }
  }
  return current.requests;
}

function isSecurityControlRequest(req) {
  return req.path === '/api/admin/security'
    || req.path.startsWith('/api/admin/security/');
}

async function adminTrafficGuard(req, res, next) {
  if (isSecurityControlRequest(req)) return next();

  const ipAddress = getClientIp(req.ip);
  try {
    const settings = await getSecuritySettings();
    const now = new Date();
    const rule = (settings.ipRules || []).find((entry) => (
      entry.address === ipAddress
      && (!entry.expiresAt || new Date(entry.expiresAt) > now)
    ));

    if (rule?.mode === 'block') {
      const status = rule.action === 'throttle' ? 429 : 404;
      await logSecurityEvent(
        rule.action === 'throttle' ? 'ip_throttled' : 'ip_blocked',
        ipAddress,
        'Richiesta limitata da una regola IP amministrativa.',
      );
      return res.status(status).json({ error: status === 404 ? 'Not Found' : 'Troppe richieste.' });
    }

    const allowlisted = rule?.mode === 'allow';
    if (settings.ddosProtectionEnabled && !allowlisted
        && incrementBurst(ipAddress) > burstLimitPerMinute) {
      await logSecurityEvent('ip_throttled', ipAddress, 'Soglia applicativa di richieste al minuto superata.');
      return res.status(429).json({ error: 'Troppe richieste. Riprova tra poco.' });
    }

    let ipCounter;
    let globalCounter;
    if (settings.trafficLimitsEnabled) {
      const inputBytes = Number(req.headers['content-length']) || 0;
      globalCounter = await incrementCounter('global', { requests: 1, bytes: inputBytes });
      if (!allowlisted) {
        ipCounter = await incrementCounter(`ip:${ipAddress}`, { requests: 1, bytes: inputBytes });
      }

      const globalLimitReached = globalCounter.requests > settings.globalRequestsPerDay
        || globalCounter.bytes > settings.globalBytesPerDay;
      const ipLimitReached = !allowlisted && ipCounter && (
        ipCounter.requests > settings.perIpRequestsPerDay
        || ipCounter.bytes > settings.perIpBytesPerDay
      );
      if (globalLimitReached || ipLimitReached) {
        await logSecurityEvent('traffic_limit_reached', ipAddress, 'Soglia giornaliera di traffico superata.');
        return res.status(429).json({ error: 'Limite giornaliero di traffico raggiunto.' });
      }

      res.once('finish', () => {
        const outputBytes = Number(res.getHeader('content-length')) || 0;
        if (!outputBytes) return;
        Promise.all([
          incrementCounter('global', { bytes: outputBytes }),
          allowlisted ? Promise.resolve(null) : incrementCounter(`ip:${ipAddress}`, { bytes: outputBytes }),
        ]).catch((error) => console.error('Could not record admin traffic counters:', error));
      });
    }

    return next();
  } catch (error) {
    console.error('Admin traffic protection failed:', error);
    if (req.path.startsWith('/api/')) {
      return res.status(503).json({ error: 'Le protezioni del server non sono disponibili. Riprova più tardi.' });
    }
    return next(error);
  }
}

module.exports = { adminTrafficGuard, invalidateSecuritySettingsCache, logSecurityEvent };
