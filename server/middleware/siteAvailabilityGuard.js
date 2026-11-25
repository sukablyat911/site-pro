const AdminSettings = require('../models/AdminSettings');
const { getAuthenticatedSession } = require('./auth');

const publicAuthenticationPaths = new Set([
  '/api/users/login',
  '/api/users/me',
  '/api/users/admin-pin',
  '/api/users/logout',
  '/api/users/account-deletion-request',
  '/api/admin/mfa/totp',
]);
let settingsCache = null;
let settingsCacheExpiresAt = 0;

function invalidateSiteAvailabilityCache() {
  settingsCache = null;
  settingsCacheExpiresAt = 0;
}

async function getAvailabilitySettings() {
  if (settingsCache && settingsCacheExpiresAt > Date.now()) return settingsCache;
  const settings = await AdminSettings.findById('global').select('maintenanceMode offlineMode');
  settingsCache = {
    maintenanceMode: Boolean(settings?.maintenanceMode),
    offlineMode: Boolean(settings?.offlineMode),
  };
  settingsCacheExpiresAt = Date.now() + 2000;
  return settingsCache;
}

async function siteAvailabilityGuard(req, res, next) {
  const isApiRequest = req.path.startsWith('/api/');
  const isCarUpload = req.path.startsWith('/uploads/cars/');
  if (!isApiRequest && !isCarUpload) return next();
  if (req.path === '/api/site/settings'
      || req.path === '/api/site/admin-entry'
      || (req.path.startsWith('/api/users/') && publicAuthenticationPaths.has(req.path))
      || publicAuthenticationPaths.has(req.path)) return next();

  try {
    const settings = await getAvailabilitySettings();
    if (!settings.maintenanceMode && !settings.offlineMode) return next();

    const authenticated = await getAuthenticatedSession(req);
    if (authenticated?.user.role === 'admin' && authenticated.session.adminVerified) return next();

    res.set('Cache-Control', 'no-store');
    res.set('Retry-After', '300');
    return res.status(503).json({
      error: settings.offlineMode
        ? 'Il sito è temporaneamente offline.'
        : 'Il sito è temporaneamente in manutenzione.',
      mode: settings.offlineMode ? 'offline' : 'maintenance',
    });
  } catch (error) {
    console.error('Could not enforce site availability settings:', error);
    return res.status(503).json({ error: 'Il servizio non è momentaneamente disponibile.' });
  }
}

module.exports = { invalidateSiteAvailabilityCache, siteAvailabilityGuard };
