const routeStyleLoaders = {
  account: () => import('virtual:pelusogroup-styles/account.css'),
  admin: () => import('virtual:pelusogroup-styles/admin.css'),
  analytics: () => import('virtual:pelusogroup-styles/analytics.css'),
  catalog: () => import('virtual:pelusogroup-styles/catalog.css'),
  contact: () => import('virtual:pelusogroup-styles/contact.css'),
  home: () => import('virtual:pelusogroup-styles/home.css'),
  rental: () => import('virtual:pelusogroup-styles/rental.css'),
  sell: () => import('virtual:pelusogroup-styles/sell.css'),
  vehicle: () => import('virtual:pelusogroup-styles/vehicle.css'),
  'vehicle-detail': () => import('virtual:pelusogroup-styles/vehicle-detail.css'),
};

const loadedRouteStyles = new Set();
const inFlightRouteStyles = new Map();

const getRouteStyleGroups = (pathname) => {
  const normalizedPath = pathname.replace(/\/+$/, '') || '/';

  if (/^\/[a-f0-9]{48}$/.test(normalizedPath)) return ['admin'];
  if (normalizedPath === '/admin' || normalizedPath.startsWith('/admin/')) {
    return [
      'admin',
      'vehicle',
      ...(normalizedPath === '/admin/analytics' ? ['analytics'] : []),
      ...(normalizedPath === '/admin/rentals' ? ['rental'] : []),
    ];
  }
  if (normalizedPath.startsWith('/auto/')) return ['vehicle', 'vehicle-detail', 'rental'];
  if (normalizedPath === '/catalogo') return ['catalog', 'vehicle'];
  if (normalizedPath === '/vendi-auto') return ['sell', 'vehicle'];
  if (normalizedPath === '/contatti') return ['contact'];
  if (['/privacy', '/termini-condizioni', '/cookie-policy', '/note-legali'].includes(normalizedPath)) return ['home'];
  if (normalizedPath === '/account' || normalizedPath.startsWith('/account/')) return ['account'];
  return ['home', 'catalog', 'vehicle', 'contact'];
};

const loadRouteStyle = (feature) => {
  if (loadedRouteStyles.has(feature)) return Promise.resolve();
  if (inFlightRouteStyles.has(feature)) return inFlightRouteStyles.get(feature);

  const load = routeStyleLoaders[feature];
  if (!load) return Promise.reject(new Error(`Foglio di stile route sconosciuto: ${feature}`));

  const request = load()
    .then(() => {
      loadedRouteStyles.add(feature);
    })
    .finally(() => {
      inFlightRouteStyles.delete(feature);
    });
  inFlightRouteStyles.set(feature, request);
  return request;
};

export const loadRouteStyles = (pathname) => Promise.all(
  getRouteStyleGroups(pathname).map(loadRouteStyle),
);
