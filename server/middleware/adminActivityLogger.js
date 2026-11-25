const AdminActivityLog = require('../models/AdminActivityLog');

const mutationMethods = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const resources = [
  ['/api/admin/legal-documents', 'Documenti legali'],
  ['/api/admin/settings', 'Impostazioni del sito'],
  ['/api/vehicles', 'Veicoli'],
  ['/api/sales', 'Vendite'],
  ['/api/purchase-requests', 'Richieste di acquisto'],
  ['/api/vehicle-price-offers', 'Proposte di prezzo'],
  ['/api/rental-requests', 'Richieste di noleggio'],
  ['/api/visit-requests', 'Visite prenotate'],
  ['/api/sell-submissions', 'Proposte di vendita'],
];
const updateActions = new Set(['accept', 'decline', 'decision', 'reject', 'reply', 'respond', 'response', 'status']);

function matchesPath(pathname, prefix) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

function getResource(pathname) {
  return resources.find(([prefix]) => matchesPath(pathname, prefix))?.[1] || '';
}

function getAction(method, pathname) {
  if (method === 'DELETE') return 'deleted';
  if (method === 'PUT' || method === 'PATCH') return 'updated';
  if (pathname.startsWith('/api/admin/settings')) return 'updated';
  const lastSegment = pathname.split('/').filter(Boolean).pop();
  return updateActions.has(lastSegment) ? 'updated' : 'created';
}

function logAdminActivity(req, res, next) {
  const method = req.method.toUpperCase();
  if (!mutationMethods.has(method)) return next();

  const pathname = req.originalUrl.split('?')[0];
  if (matchesPath(pathname, '/api/admin/security')
      || matchesPath(pathname, '/api/admin/settings/admin-access-path')) return next();

  const resource = getResource(pathname);
  if (!resource) return next();

  res.on('finish', () => {
    if (req.user?.role !== 'admin') return;

    const targetId = pathname.match(/(?:^|\/)([a-f\d]{24})(?:\/|$)/i)?.[1] || '';
    const action = getAction(method, pathname);
    const outcome = res.statusCode >= 200 && res.statusCode < 300 ? 'success' : 'failure';
    const actorName = req.user.username || req.user.name || 'Amministratore';

    AdminActivityLog.create({
      action,
      resource,
      actorId: req.user._id,
      actorName,
      targetId,
      outcome,
      statusCode: res.statusCode,
    }).catch((error) => {
      console.error('Could not record admin activity:', error);
    });
  });

  return next();
}

module.exports = logAdminActivity;
