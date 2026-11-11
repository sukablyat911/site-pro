import { Children, isValidElement, useEffect, useId, useMemo, useRef, useState } from 'react';
import { DayPicker } from 'react-day-picker';
import { it } from 'react-day-picker/locale';
import 'react-day-picker/style.css';

const euro = new Intl.NumberFormat('it-IT', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
});
const revenueEuro = new Intl.NumberFormat('it-IT', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 2,
});
const monthlyEuro = new Intl.NumberFormat('it-IT', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 2,
});
const vehiclePowerNumber = new Intl.NumberFormat('it-IT', { maximumFractionDigits: 1 });
const KILOWATTS_PER_CV = 0.73549875;
const kilometer = new Intl.NumberFormat('it-IT');
const CATALOG_PAGE_SIZE = 20;
const VEHICLE_VAT_MODES = ['inclusive', 'exclusive', 'not-applied'];
const COOKIE_CONSENT_STORAGE_KEY = 'pelusogroup-cookie-consent';
const WARRANTY_COVERAGE_OPTIONS = [
  { value: 'engine', label: 'Motore', icon: 'engine' },
  { value: 'transmission', label: 'Cambio', icon: 'transmission' },
  { value: 'clutch', label: 'Frizione', icon: 'clutch' },
  { value: 'brakes', label: 'Freni', icon: 'brakes' },
  { value: 'turbo', label: 'Turbina', icon: 'turbo' },
  { value: 'electrical', label: 'Impianto elettrico', icon: 'electrical' },
  { value: 'airConditioning', label: 'Climatizzatore', icon: 'airConditioning' },
  { value: 'labor', label: 'Manodopera', icon: 'labor' },
];
const WARRANTY_COVERAGE_LABELS = Object.fromEntries(WARRANTY_COVERAGE_OPTIONS.map(({ value, label }) => [value, label]));
const createAnalyticsSessionId = () => window.crypto?.randomUUID?.()
  || 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (character) => {
    const random = Math.floor(Math.random() * 16);
    return (character === 'x' ? random : (random & 0x3) | 0x8).toString(16);
  });
const formatDuration = (totalSeconds) => {
  const seconds = Math.max(0, Math.round(totalSeconds || 0));
  const minutes = Math.floor(seconds / 60);
  return minutes ? `${minutes} min ${seconds % 60} s` : `${seconds} s`;
};
const getVehicleVatMode = (vehicle) => (
  VEHICLE_VAT_MODES.includes(vehicle?.vatMode) ? vehicle.vatMode : 'inclusive'
);
const getVehicleVatLabel = (vehicle) => ({
  inclusive: 'IVA inclusa',
  exclusive: 'IVA esclusa · 22% da aggiungere',
  'not-applied': 'IVA non applicata',
}[getVehicleVatMode(vehicle)]);
const GERARDO_PHONE_NUMBER = '393473368745';
const GERARDO_PHONE_DISPLAY = '+39 347 336 8745';
const GERARDO_WHATSAPP_LINK = `https://wa.me/${GERARDO_PHONE_NUMBER}?text=${encodeURIComponent('Ciao Gerardo, ho visto il sito PelusoGroup e vorrei ricevere informazioni.')}`;
const LUIGI_WHATSAPP_LINK = `https://wa.me/393204569082?text=${encodeURIComponent('Ciao Luigi, ho visto il sito PelusoGroup e vorrei ricevere informazioni.')}`;

function readCookieConsent() {
  try {
    const storedConsent = window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
    if (!storedConsent) return null;
    const consent = JSON.parse(storedConsent);
    if (consent?.version !== 1 || typeof consent.analytics !== 'boolean' || typeof consent.externalMedia !== 'boolean') return null;
    return { necessary: true, analytics: consent.analytics, externalMedia: consent.externalMedia };
  } catch (error) {
    console.error('Impossibile leggere le preferenze cookie:', error);
    return null;
  }
}

function parseLocalDate(value) {
  if (!value) return undefined;
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function formatLocalDate(date) {
  if (!date) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function expandUnavailableDates(periods) {
  const unavailable = new Map();
  periods.forEach(({ startDate, endDate }) => {
    const cursor = parseLocalDate(startDate);
    const end = parseLocalDate(endDate);
    if (!cursor || !end || cursor >= end) return;
    while (cursor < end) {
      unavailable.set(formatLocalDate(cursor), new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
  });
  return [...unavailable.values()];
}

const VEHICLE_BODY_TYPES = [
  'Compact',
  'Coupé',
  'Convertible',
  'Berlina',
  'Station wagon',
  'SUV-pickup',
  'Transporter',
];
const VEHICLE_BODY_TYPE_ICON_PATHS = {
  Compact: '/images/car-categories/compact.png',
  'Coupé': '/images/car-categories/coupe.png',
  Berlina: '/images/car-categories/berlina.png',
  'Station wagon': '/images/car-categories/station-wagon.png',
  Convertible: '/images/car-categories/convertible.png',
  'SUV-pickup': '/images/car-categories/suv-pickup.png',
  Transporter: '/images/car-categories/transporter.png',
};
const POPULAR_MAKE_ORDER = [
  'BMW',
  'Mercedes-Benz',
  'Audi',
  'Volkswagen',
  'Fiat',
  'Ford',
  'Toyota',
  'Peugeot',
  'Renault',
  'Alfa Romeo',
  'Chrysler',
  'Jeep',
  'Tesla',
  'MINI',
  'Opel',
];
const POPULAR_MAKE_LOGO_PATHS = {
  audi: '/images/car-logos/audi.png',
  alfaromeo: '/images/car-logos/alfa-romeo.png',
  bmw: '/images/car-logos/bmw.png',
  chrysler: '/images/car-logos/chrysler.png',
  fiat: '/images/car-logos/fiat.png',
  ford: '/images/car-logos/ford.png',
  mercedesbenz: '/images/car-logos/mercedes.png',
  opel: '/images/car-logos/opel.png',
  peugeot: '/images/car-logos/peugeot.png',
  volkswagen: '/images/car-logos/volkswagen.png',
};
const POPULAR_MAKE_LOGO_BRANDS = [
  'Audi',
  'Alfa Romeo',
  'BMW',
  'Chrysler',
  'Fiat',
  'Ford',
  'Mercedes-Benz',
  'Opel',
  'Peugeot',
  'Volkswagen',
];

function useImageGroupLoaded(sources) {
  const sourceKey = sources.join('|');
  const [loadedGroupKey, setLoadedGroupKey] = useState('');

  useEffect(() => {
    let active = true;
    setLoadedGroupKey('');

    Promise.all(sources.map((source) => new Promise((resolve) => {
      let retries = 0;
      const load = () => {
        const image = new Image();
        image.decoding = 'async';
        image.fetchPriority = 'high';
        image.onload = () => resolve();
        image.onerror = () => {
          if (retries < 2) {
            retries += 1;
            window.setTimeout(load, retries * 350);
          } else {
            resolve();
          }
        };
        image.src = source;
      };
      load();
    }))).then(() => {
      if (active) setLoadedGroupKey(sourceKey);
    });

    return () => { active = false; };
  }, [sourceKey]);

  return loadedGroupKey === sourceKey;
}

function getPopularMakeInfo(make) {
  const normalized = make.toLocaleLowerCase('it').replace(/[^a-z0-9]/g, '');
  if (normalized.startsWith('mercedes')) return { name: 'Mercedes-Benz', query: 'Mercedes' };
  if (normalized.startsWith('fiat')) return { name: 'Fiat', query: 'Fiat' };
  if (normalized.startsWith('alfa')) return { name: 'Alfa Romeo', query: 'Alfa' };
  if (normalized === 'crysler' || normalized === 'chrysler') return { name: 'Chrysler', query: make };
  const popularName = POPULAR_MAKE_ORDER.find(
    (name) => name.toLocaleLowerCase('it').replace(/[^a-z0-9]/g, '') === normalized,
  );
  const displayName = popularName || `${make.trim().charAt(0).toLocaleUpperCase('it')}${make.trim().slice(1)}`;
  return { name: displayName, query: displayName };
}
function normalizeVehicleMake(make) {
  const { name } = getPopularMakeInfo(String(make || ''));
  return name.toLocaleLowerCase('it').replace(/[^a-z0-9]/g, '');
}
const emailPattern = /^(?!\.)(?!.*\.\.)[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?(?:\.[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?)+$/i;

function getVehiclePowerDetails(vehicle) {
  const legacyCv = typeof vehicle?.power === 'string'
    ? vehicle.power.match(/(\d+(?:[.,]\d+)?)\s*(?:CV|C\.V\.|cavalli|hp)\b/i)?.[1]
      || ( /^\d+(?:[.,]\d+)?$/.test(vehicle.power.trim()) ? vehicle.power.trim() : '')
    : '';
  const cvValue = Number(vehicle?.powerCv ?? legacyCv) || (
    Number(vehicle?.powerKw) > 0 ? Number(vehicle.powerKw) / KILOWATTS_PER_CV : null
  );
  const kwValue = Number(vehicle?.powerKw) > 0
    ? Number(vehicle.powerKw)
    : cvValue ? cvValue * KILOWATTS_PER_CV : null;
  return {
    cv: cvValue ? vehiclePowerNumber.format(cvValue) : vehicle?.power || '',
    kw: kwValue ? vehiclePowerNumber.format(kwValue) : '',
    cvValue,
  };
}

function normalizeVehicleBodyType(bodyType) {
  const normalized = String(bodyType || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('it');
  if (normalized.includes('berlin') || normalized.includes('sedan')) return 'Berlina';
  if (normalized.includes('coupe')) return 'Coupé';
  if (normalized.includes('cabrio') || normalized.includes('convertible') || normalized.includes('spider')) return 'Convertible';
  if (normalized.includes('station') || normalized.includes('wagon')) return 'Station wagon';
  if (normalized.includes('pickup') || normalized.includes('pick-up') || normalized.includes('suv')
      || normalized.includes('4x4') || normalized.includes('4wd') || normalized.includes('fuoristrada')) return 'SUV-pickup';
  if (normalized.includes('transporter') || normalized.includes('furgon')) return 'Transporter';
  if (normalized === 'van' || normalized.includes('monovolume') || normalized.includes('minivan')) return 'Transporter';
  if (normalized.includes('compact') || normalized.includes('city') || normalized.includes('utilitaria')) return 'Compact';
  return '';
}

function VehicleBodyTypeIcon({ type }) {
  const iconPath = VEHICLE_BODY_TYPE_ICON_PATHS[type];
  return iconPath
    ? <ProgressiveImage className="vehicle-body-type-icon" src={iconPath} alt="" loading="eager" fetchPriority="high" variant="compact" />
    : null;
}

function MakeLogo({ make }) {
  const normalizedMake = make.toLocaleLowerCase('it').replace(/[^a-z0-9]/g, '');
  const logoPath = POPULAR_MAKE_LOGO_PATHS[normalizedMake];
  return (
    <span className="admin-analytics-make-logo" role="img" aria-label={`Logo ${make}`}>
      {logoPath
        ? <ProgressiveImage className="admin-make-logo-image" src={logoPath} alt="" loading="eager" fetchPriority="high" variant="compact" fallback={<span>{make.slice(0, 2).toLocaleUpperCase('it')}</span>} />
        : <span>{make.slice(0, 2).toLocaleUpperCase('it')}</span>}
    </span>
  );
}

function VehicleBodyTypeOptions({ name = 'bodyType', defaultValue = '', required = true, className = '' }) {
  const selectedType = normalizeVehicleBodyType(defaultValue);
  return (
    <div className={`vehicle-body-type-buttons${className ? ` ${className}` : ''}`}>
      {VEHICLE_BODY_TYPES.map((bodyType) => (
        <label className="vehicle-body-type-option" key={bodyType}>
          <input
            type="radio"
            name={name}
            value={bodyType}
            defaultChecked={selectedType === bodyType}
            required={required}
          />
          <span className="vehicle-body-type-button">
            <VehicleBodyTypeIcon type={bodyType} />
            <span>{bodyType}</span>
          </span>
        </label>
      ))}
    </div>
  );
}

function isValidEmail(value) {
  const email = value.trim();
  const [localPart, ...domainParts] = email.split('@');
  const domain = domainParts.join('@');
  return email.length <= 254
    && localPart.length <= 64
    && domain.length <= 253
    && emailPattern.test(email);
}

function getFeatureIcon(feature) {
  const value = feature.toLocaleLowerCase('it');
  if (/clima|climatizz|condizion|aria/.test(value)) return 'climate';
  if (/abs|airbag|sicurezz|esp|fren/.test(value)) return 'safety';
  if (/radio|audio|bluetooth|navig|multimedia|speaker/.test(value)) return 'media';
  if (/sedil|pelle|intern|comfort/.test(value)) return 'seat';
  if (/tuning|cerchi|assetto|motore|sport/.test(value)) return 'performance';
  return 'feature';
}

function FeatureIcon({ feature }) {
  const kind = getFeatureIcon(feature);
  return (
    <svg className={`feature-icon feature-icon-${kind}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {kind === 'climate' && <><path d="M12 2v20M4 6l16 12M20 6 4 18M9 4l3 2 3-2M9 20l3-2 3 2M3 9l3 1 1-3M17 17l1-3 3 1M21 9l-3 1-1-3M7 17l-1-3-3 1" /></>}
      {kind === 'safety' && <><path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" /><path d="m9 12 2 2 4-4" /></>}
      {kind === 'media' && <><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="8" cy="12" r="3" /><path d="M14 10h4M14 14h4" /></>}
      {kind === 'seat' && <><path d="M7 3v8a3 3 0 0 0 3 3h7v7M7 11h10a3 3 0 0 1 3 3v1H9a5 5 0 0 1-5-5V8" /><path d="M7 3h3" /></>}
      {kind === 'performance' && <><path d="m14.7 6.3 3 3M4 20l8.4-8.4M15 5a5 5 0 0 0 6 6l-4 4-3-3-4 4-3-3 4-4 4-4Z" /><circle cx="5" cy="19" r="1" /></>}
      {kind === 'feature' && <><path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" /><path d="m19 15 .9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15Z" /></>}
    </svg>
  );
}

function SiteIcon({ name, className = '' }) {
  const paths = {
    car: <><path d="m5 11 1.5-4.2A2 2 0 0 1 8.4 5.5h7.2a2 2 0 0 1 1.9 1.3L19 11" /><path d="M3.5 11.5h17v6h-17zM6.5 17.5v2m11-2v2M6 14.5h.01M18 14.5h.01M4 11.5l-1.5-2m17.5 2 1.5-2" /></>,
    key: <><circle cx="8" cy="15" r="4.25" /><path d="m11 12 8.5-8.5M16 7l2 2m-5-1 2 2" /></>,
    sell: <><path d="M4 4h9l7 7-9 9-7-7z" /><circle cx="9" cy="9" r="1.2" /><path d="m11 14 2 2 4-4" /></>,
    truck: <><path d="M3 6h11v12H3zM14 10h4l3 3v5h-7z" /><circle cx="7.5" cy="18" r="2" /><circle cx="17.5" cy="18" r="2" /><path d="M17 10v3h4" /></>,
    delivery: <><path d="M4 7h10v10H4zM14 10h4l3 3v4h-7z" /><path d="M7 4h4m-2-2v4m-2-2h4" /><circle cx="7.5" cy="18" r="2" /><circle cx="17.5" cy="18" r="2" /></>,
    check: <><path d="M20 11.1V12a8 8 0 1 1-4.7-7.3" /><path d="m8.5 11.5 3 3L21 5" /></>,
    pin: <><path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z" /><circle cx="12" cy="10" r="2.2" /></>,
    mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m4 7 8 6 8-6" /></>,
    phone: <><path d="M7.2 3.5h2.6l1.3 4.2-1.8 1.6a15 15 0 0 0 5.4 5.4l1.6-1.8 4.2 1.3v2.6a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 5.2 5.7a2 2 0 0 1 2-2.2Z" /></>,
    engine: <><path d="M4 12h3l1.5-4h7l1.5 4H20v6h-3.2l-1.7 2H9l-1.7-2H4z" /><path d="M7 16h10M9 8V5h6v3M11 12h2M9 12h.01M15 12h.01" /><circle cx="9" cy="18" r="1.5" /><circle cx="15" cy="18" r="1.5" /></>,
    odometer: <><path d="M4.5 18a9 9 0 1 1 15 0" /><path d="m12 13 4-4M7 17h.01M12 16h.01M17 17h.01" /><path d="M8 20h8" /></>,
    price: <><path d="M20 13 13 20l-9-9V4h7l9 9Z" /><circle cx="8" cy="8" r="1.3" /><path d="M13 11c-1.6-.8-3-.1-3 1s3 1 3 2-1.4 1.8-3 1m1.5-5v6" /></>,
    payment: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 10h18m-13 5h4" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18m-13 4h3m-3 3h3" /></>,
    drivetrain: <><circle cx="12" cy="12" r="3" /><circle cx="5" cy="6" r="2" /><circle cx="19" cy="6" r="2" /><circle cx="5" cy="18" r="2" /><circle cx="19" cy="18" r="2" /><path d="m7 7 3 3m7-3-3 3m-7 7 3-3m7 3-3-3" /></>,
    novice: <><circle cx="12" cy="8" r="4" /><path d="M5 21a7 7 0 0 1 14 0m-7-9v5m-2.5-2.5h5" /></>,
    fuel: <><path d="M5 21V4h10v17M3 21h14M8 8h4" /><path d="M15 8h2l3 3v7a2 2 0 0 1-4 0v-4h3" /></>,
    transmission: <><circle cx="12" cy="12" r="7" /><path d="M12 5v3M12 16v3M5 12h3M16 12h3M7.5 7.5l2.1 2.1M14.4 14.4l2.1 2.1M7.5 16.5l2.1-2.1M14.4 9.6l2.1-2.1" /></>,
    emissions: <><path d="M4 20h16M6 17c0-6 4-10 12-10-1 7-5 11-12 10Z" /><path d="M6 17c2-3 5-5 9-7" /></>,
    consumption: <><path d="M12 3v10m0 0 4-4m-4 4-4-4" /><path d="M5 15v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4" /><path d="M8 6a6 6 0 0 1 8 0" /></>,
    owner: <><circle cx="9" cy="8" r="4" /><path d="M2.5 21a6.5 6.5 0 0 1 13 0m2-13a3.5 3.5 0 0 1 0 7m1 2a5 5 0 0 1 3 4" /></>,
    warranty: <><path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" /><path d="m9 12 2 2 4-4" /></>,
    condition: <><path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z" /></>,
    displacement: <><path d="M4 8h16M4 16h16M8 4v16m8-16v16" /><circle cx="12" cy="12" r="8" /></>,
    co2: <><circle cx="9" cy="12" r="6" /><path d="M15 8h4m-4 4h4m-4 4h4" /><path d="M7 10a2.5 2.5 0 1 1 0 4" /></>,
    color: <><path d="M12 3a9 9 0 1 0 0 18h1.5a2 2 0 0 0 1.2-3.6 1.5 1.5 0 0 1 .9-2.7H18a3 3 0 0 0 3-3c0-4.8-4-8.7-9-8.7Z" /><circle cx="7.5" cy="11" r="1" /><circle cx="10" cy="7.5" r="1" /><circle cx="15" cy="8" r="1" /></>,
    doors: <><path d="M4 21V5h13l3 3v13M7 21V8h10v13M13 14h.01" /></>,
    seats: <><path d="M7 3v8a3 3 0 0 0 3 3h7v7M7 11h10a3 3 0 0 1 3 3v1H9a5 5 0 0 1-5-5V8" /></>,
    power: <><path d="m13 2-3 8h7l-6 12 2-9H6l7-11Z" /></>,
    torque: <><path d="M12 3v3m0 12v3M3 12h3m12 0h3M5.6 5.6l2.1 2.1m8.6 8.6 2.1 2.1m0-12.8-2.1 2.1m-8.6 8.6-2.1 2.1" /><circle cx="12" cy="12" r="6" /><path d="m10 13 2-4 2 4h-4Z" /></>,
    speed: <><path d="M4 18a9 9 0 1 1 16 0M12 13l4-4" /><circle cx="12" cy="13" r="1" /><path d="M7 17h.01M17 17h.01M12 5v1" /></>,
    clutch: <><circle cx="12" cy="12" r="7" /><circle cx="12" cy="12" r="3" /><path d="M12 3v4M12 17v4M3 12h4M17 12h4" /></>,
    brakes: <><circle cx="12" cy="12" r="7" /><circle cx="12" cy="12" r="3" /><path d="M7 7l10 10M17 7 7 17" /></>,
    turbo: <><path d="M8 16c-2-1.5-3-4-3-6a7 7 0 0 1 14 0c0 2-1 4.5-3 6" /><path d="M9 16h6M12 10v6m-3-3h6" /><circle cx="12" cy="12" r="2" /></>,
    electrical: <><path d="M12 2v6M9 5h6M7 11h10l-2 7H9l-2-7Z" /><path d="M10 16h4" /></>,
    airConditioning: <><path d="M12 3v4m-4.5 2.5 2.8 2.8M16.5 9.5l-2.8 2.8M12 18v3m-4.5-2.5 2.8-2.8M16.5 14.5l-2.8-2.8" /><circle cx="12" cy="12" r="3.5" /></>,
    labor: <><path d="M9 5h6l1 3h3v4h-2l-1 6H9l-1-6H6V8h3l1-3Z" /><path d="M10 12h4" /></>,
    trunk: <><path d="M3 11h18v9H3zM5 11l2-6h10l2 6" /><path d="M8 15h8m-7 3h6" /></>,
    whatsapp: <><path d="M20.2 11.7a8.2 8.2 0 0 1-12.1 7.2L4 20l1.2-3.8a8.2 8.2 0 1 1 15-4.5Z" /><path d="M8.2 8.3c.2-.5.4-.5.7-.5h.5c.2 0 .4.1.5.4l.7 1.6c.1.3.1.5-.1.7l-.5.6c-.2.2-.2.4 0 .6.4.7 1 1.3 1.7 1.7.2.1.4.1.6-.1l.7-.8c.2-.2.4-.2.7-.1l1.5.7c.3.1.4.3.4.5 0 .3-.2 1-.7 1.3-.5.4-1.1.6-1.8.4-1-.2-2.2-.8-3.4-1.9-1-.9-1.7-2.1-1.9-3-.2-.9.1-1.7.6-2.1Z" /></>,
    facebook: <><path d="M14 21v-8h2.7l.4-3H14V8.1c0-.9.3-1.5 1.5-1.5h1.7V3.9c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3V10H8v3h2.5v8" /></>,
    chevronLeft: <><path d="m15 18-6-6 6-6" /></>,
    chevronRight: <><path d="m9 18 6-6-6-6" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.5 2" /></>,
    registration: <><path d="M6 3h8l4 4v14H6z" /><path d="M14 3v5h5m-9 3h5m-5 3h7m-7 3h4" /><circle cx="6" cy="17" r="3" /><path d="m5 17 1 1 2-2" /></>,
    cylinders: <><path d="M4 5h4v14H4zM10 3h4v16h-4zM16 6h4v13h-4z" /><path d="M5 8h2m5-2h2m5 3h2" /></>,
    acceleration: <><path d="M4 17h4l3-5 3 3 6-9" /><path d="M15 6h5v5" /><path d="M4 21h16" /></>,
    service: <><path d="M14 6a5 5 0 0 0-6.7 6.7L3 17l4 4 4.3-4.3A5 5 0 0 0 18 10l-3 3-4-4 3-3Z" /><path d="m5 19 2-2" /></>,
    inspection: <><path d="M4 5h16v15H4zM8 3v4m8-4v4M4 10h16" /><path d="m8 15 2 2 5-5" /></>,
    availability: <><path d="m5 12 4 4L19 6" /><path d="M20 12v7H4V5h11" /></>,
    image: <><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="8.5" cy="9" r="1.5" /><path d="m4 17 5-5 3 3 3-4 5 6" /></>,
    info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5m0-8h.01" /></>,
    eye: <><path d="M2.5 12s3.4-6 9.5-6 9.5 6 9.5 6-3.4 6-9.5 6-9.5-6-9.5-6Z" /><circle cx="12" cy="12" r="2.5" /></>,
    people: <><path d="M16 20v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 18.5V20" /><circle cx="10" cy="8" r="3.5" /><path d="M16 4.7a3.5 3.5 0 0 1 0 6.6M17 15h.5a3.5 3.5 0 0 1 3.5 3.5V20" /></>,
    search: <><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4.5 4.5" /></>,
    sort: <><path d="M4 6h12M4 12h8M4 18h4" /><path d="m16 14 3 3 3-3m-3 2V7" /></>,
  };
  return (
    <svg className={`site-icon${className ? ` ${className}` : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name]}
    </svg>
  );
}

function VehicleInterestGauge({ rate, requests, views, partial = false, partialNote = '', statusNote = '' }) {
  const gaugeMaximum = 100;
  const hasRate = Number.isFinite(rate);
  const normalizedRate = hasRate ? Math.min(Math.max(rate, 0), gaugeMaximum) : 0;
  const needleRotation = -90 + (normalizedRate / gaugeMaximum) * 180;
  const formattedRate = hasRate ? new Intl.NumberFormat('it-IT', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(rate) : '—';
  const ticks = Array.from({ length: 21 }, (_, index) => {
    const angle = ((180 + index * 9) * Math.PI) / 180;
    const major = index % 5 === 0;
    const outerRadius = 119;
    const innerRadius = major ? 101 : 108;
    const labelRadius = 84;
    return {
      index,
      major,
      x1: 160 + Math.cos(angle) * outerRadius,
      y1: 160 + Math.sin(angle) * outerRadius,
      x2: 160 + Math.cos(angle) * innerRadius,
      y2: 160 + Math.sin(angle) * innerRadius,
      labelX: 160 + Math.cos(angle) * labelRadius,
      labelY: 160 + Math.sin(angle) * labelRadius,
      label: String((index / 20) * gaugeMaximum).replace('.', ','),
    };
  });

  return (
    <section className="admin-interest-gauge" aria-labelledby="admin-interest-gauge-title">
      <div className="admin-interest-gauge-heading">
        <div>
          <p className="eyebrow">INDICATORE INVENTARIO</p>
          <h3 id="admin-interest-gauge-title">Indice di interesse</h3>
        </div>
        <span className="admin-interest-gauge-live"><i />{hasRate
          ? partial ? ' PARZIALE' : ' CUMULATIVO'
          : statusNote.startsWith('Non applicabile') ? ' NON APPLICABILE'
            : statusNote.startsWith('Caricamento') ? ' IN CARICAMENTO'
              : statusNote.startsWith('Nessuna') ? ' NON CALCOLABILE' : ' NON DISPONIBILE'}</span>
      </div>
      <svg className="admin-interest-gauge-face" viewBox="0 0 320 190" role="img" aria-label={hasRate ? `Tasso richieste ${formattedRate} per cento, ${requests} richieste su ${views} visualizzazioni` : `Tasso richieste non disponibile. ${statusNote}`}>
        <defs>
          <linearGradient id="interest-gauge-gradient" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity=".45" />
            <stop offset="100%" stopColor="var(--accent)" />
          </linearGradient>
          <filter id="interest-gauge-glow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <path className="admin-interest-gauge-track" d="M 35 160 A 125 125 0 0 1 285 160" pathLength="1000" />
        <path
          className="admin-interest-gauge-progress"
          d="M 35 160 A 125 125 0 0 1 285 160"
          pathLength="1000"
          strokeDasharray={`${normalizedRate / gaugeMaximum * 1000} 1000`}
        />
        {ticks.map((tick) => (
          <g key={tick.index}>
            <line
              className={`admin-interest-gauge-tick${tick.major ? ' is-major' : ''}`}
              x1={tick.x1}
              y1={tick.y1}
              x2={tick.x2}
              y2={tick.y2}
            />
            {tick.major && (
              <text className="admin-interest-gauge-scale" x={tick.labelX} y={tick.labelY} textAnchor="middle">
                {tick.label}
              </text>
            )}
          </g>
        ))}
        <g
          className="admin-interest-gauge-needle"
          style={{ transform: `rotate(${needleRotation}deg)`, opacity: hasRate ? 1 : 0 }}
        >
          <path d="M 160 160 L 156 156 L 158 54 Q 160 46 162 54 L 164 156 Z" />
        </g>
        <circle className="admin-interest-gauge-hub-outer" cx="160" cy="160" r="13" />
        <circle className="admin-interest-gauge-hub" cx="160" cy="160" r="6" />
      </svg>
      <div className="admin-interest-gauge-readout" aria-live="polite">
        <strong>{formattedRate}{hasRate && <span>%</span>}</strong>
        <span>{statusNote || 'richieste ogni 100 visualizzazioni delle auto in vendita'}</span>
      </div>
      <div className="admin-interest-gauge-odometer">
        <div>
          <span>RICHIESTE</span>
          <strong>{Number.isSafeInteger(requests) ? String(requests).padStart(5, '0') : '—'}</strong>
        </div>
        <div>
          <span>VISUALIZZAZIONI</span>
          <strong>{Number.isSafeInteger(views) ? String(views).padStart(5, '0') : '—'}</strong>
        </div>
      </div>
      <p className="admin-interest-gauge-note">
        Scala 0–100% · {hasRate && rate > gaugeMaximum ? 'valore oltre scala; dato reale mostrato sopra' : 'rapporto richieste/visite delle auto in vendita'}
        {partial && ` · ${partialNote}`}
      </p>
    </section>
  );
}

function VisibilityToggle({ visible, onToggle }) {
  return (
    <button className="password-visibility-toggle" type="button" aria-label={visible ? 'Nascondi password' : 'Mostra password'} aria-pressed={visible} onClick={onToggle}>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M2.5 12s3.4-6 9.5-6 9.5 6 9.5 6-3.4 6-9.5 6-9.5-6-9.5-6Z" />
        <circle cx="12" cy="12" r="2.7" />
        {!visible && <path d="m4 4 16 16" />}
      </svg>
    </button>
  );
}

function WarrantyCoverageField({ editingVehicle }) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedItems = WARRANTY_COVERAGE_OPTIONS.filter(({ value }) => editingVehicle?.warrantyCoverage?.includes(value));

  return (
    <fieldset className="admin-warranty-coverage admin-wide-field">
      <legend>
        <span className="admin-spec-label"><SiteIcon name="warranty" /> Componenti inclusi nella garanzia</span>
      </legend>
      <button
        type="button"
        className={`admin-warranty-trigger${isOpen ? ' is-open' : ''}`}
        aria-expanded={isOpen}
        aria-controls="admin-warranty-options-panel"
        onClick={() => setIsOpen((open) => !open)}
      >
        <span className="admin-warranty-trigger-copy">
          <span className="admin-warranty-trigger-label">Elementi coperti</span>
          <strong>{selectedItems.length ? `${selectedItems.length} selezionati` : 'Nessun componente selezionato'}</strong>
        </span>
        <SiteIcon name="chevronRight" className="admin-warranty-trigger-icon" />
      </button>
      <div id="admin-warranty-options-panel" className={`admin-warranty-menu${isOpen ? ' is-open' : ''}`}>
        <div className="admin-warranty-options">
          {WARRANTY_COVERAGE_OPTIONS.map(({ value, label, icon }) => (
            <label key={value} htmlFor={`warranty-${value}`}>
              <input id={`warranty-${value}`} type="checkbox" name="warrantyCoverage" value={value} defaultChecked={editingVehicle?.warrantyCoverage?.includes(value)} />
              <span className="admin-warranty-checkbox" aria-hidden="true" />
              <span className="admin-warranty-icon"><SiteIcon name={icon} /></span>
              <span>{label}</span>
            </label>
          ))}
        </div>
      </div>
    </fieldset>
  );
}

function SelectField({ name, value, defaultValue, onChange, children, disabled = false, required = false, className = '' }) {
  const id = useId();
  const rootRef = useRef(null);
  const optionRefs = useRef([]);
  const controlled = value !== undefined;
  const [selectedValue, setSelectedValue] = useState(String(value ?? defaultValue ?? ''));
  const [open, setOpen] = useState(false);
  const options = Children.toArray(children)
    .filter((child) => isValidElement(child) && child.type === 'option')
    .map((option) => ({
      value: String(option.props.value ?? ''),
      label: option.props.children,
      disabled: Boolean(option.props.disabled),
    }));
  const selectedOption = options.find((option) => option.value === selectedValue);

  useEffect(() => {
    if (controlled) setSelectedValue(String(value ?? ''));
  }, [controlled, value]);

  useEffect(() => {
    if (!open) return undefined;
    function closeOnOutsideClick(event) {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    }
    document.addEventListener('pointerdown', closeOnOutsideClick);
    return () => document.removeEventListener('pointerdown', closeOnOutsideClick);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const selectedIndex = options.findIndex((option) => option.value === selectedValue && !option.disabled);
    const firstEnabled = options.findIndex((option) => !option.disabled);
    optionRefs.current[selectedIndex >= 0 ? selectedIndex : firstEnabled]?.focus();
  }, [open]);

  function chooseOption(option) {
    if (option.disabled) return;
    if (!controlled) setSelectedValue(option.value);
    onChange?.({ target: { value: option.value } });
    setOpen(false);
  }

  function handleTriggerKeyDown(event) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      setOpen(true);
    }
  }

  function handleOptionKeyDown(event, index) {
    if (event.key === 'Escape' || event.key === 'Tab') {
      setOpen(false);
      rootRef.current?.querySelector('.custom-select-trigger')?.focus();
      return;
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      const direction = event.key === 'ArrowUp' || event.key === 'End' ? -1 : 1;
      let nextIndex = event.key === 'Home' ? 0 : event.key === 'End' ? options.length - 1 : index + direction;
      while (nextIndex >= 0 && nextIndex < options.length && options[nextIndex].disabled) nextIndex += direction;
      if (nextIndex >= 0 && nextIndex < options.length) optionRefs.current[nextIndex]?.focus();
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      chooseOption(options[index]);
      rootRef.current?.querySelector('.custom-select-trigger')?.focus();
    }
  }

  return (
    <div ref={rootRef} className={`custom-select${open ? ' is-open' : ''}${className ? ` ${className}` : ''}`}>
      {name && <input type="hidden" name={name} value={selectedValue} />}
      <button
        id={id}
        className="custom-select-trigger"
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}-listbox`}
        aria-required={required || undefined}
        disabled={disabled}
        onClick={() => setOpen((isOpen) => !isOpen)}
        onKeyDown={handleTriggerKeyDown}
      >
        <span className={!selectedOption ? 'custom-select-placeholder' : ''}>{selectedOption?.label ?? options[0]?.label ?? 'Seleziona un’opzione'}</span>
        <svg className="custom-select-chevron" viewBox="0 0 16 16" aria-hidden="true"><path d="m3 6 5 5 5-5" /></svg>
      </button>
      {open && (
        <div className="custom-select-popover" id={`${id}-listbox`} role="listbox" aria-labelledby={id}>
          {options.map((option, index) => (
            <button
              key={`${option.value}-${index}`}
              ref={(element) => { optionRefs.current[index] = element; }}
              className={`custom-select-option${option.value === selectedValue ? ' is-selected' : ''}`}
              type="button"
              role="option"
              aria-selected={option.value === selectedValue}
              aria-disabled={option.disabled || undefined}
              disabled={option.disabled}
              onClick={() => chooseOption(option)}
              onKeyDown={(event) => handleOptionKeyDown(event, index)}
            >
              <span>{option.label}</span>
              {option.value === selectedValue && <svg viewBox="0 0 16 16" aria-hidden="true"><path d="m3 8 3.2 3.2L13 4.5" /></svg>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

async function requestJson(url, options = {}) {
  let response;
  const isFormData = options.body instanceof FormData;
  try {
    response = await fetch(url, {
      ...options,
      credentials: 'include',
      headers: {
        ...(options.body && !isFormData ? { 'Content-Type': 'application/json' } : {}),
        ...options.headers,
      },
    });
  } catch {
    throw new Error('Connessione al server non riuscita. Verifica la connessione e riprova.');
  }

  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error('Il server ha restituito una risposta non valida. Riprova più tardi.');
  }
  if (!response.ok) {
    throw new Error(data.error || 'Si è verificato un problema. Riprova.');
  }
  return data;
}

function ContentErrorState({ title, message, onRetry }) {
  return (
    <div className="content-error-state" role="alert">
      <span className="content-error-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 8v4m0 4h.01" />
          <circle cx="12" cy="12" r="9" />
        </svg>
      </span>
      <div className="content-error-copy">
        <h3>{title}</h3>
        <p>{message}</p>
      </div>
      <button className="content-error-retry" type="button" onClick={onRetry}>
        Riprova <span aria-hidden="true">↻</span>
      </button>
    </div>
  );
}

function InventorySkeletonCards() {
  return Array.from({ length: 6 }, (_, index) => (
    <article className="vehicle-card-skeleton" aria-hidden="true" key={index}>
      <div className="skeleton-shimmer vehicle-skeleton-image" />
      <div className="vehicle-skeleton-content">
        <div className="skeleton-shimmer skeleton-line skeleton-line-short" />
        <div className="skeleton-shimmer skeleton-line skeleton-line-title" />
        <div className="skeleton-shimmer skeleton-line skeleton-line-medium" />
        <div className="vehicle-skeleton-footer">
          <div className="skeleton-shimmer skeleton-line skeleton-line-price" />
          <div className="skeleton-shimmer skeleton-button" />
        </div>
      </div>
    </article>
  ));
}

function SoldCarsSkeletonCards() {
  return Array.from({ length: 3 }, (_, index) => (
    <article className="sold-car-skeleton" aria-hidden="true" key={index}>
      <div className="skeleton-shimmer sold-skeleton-image" />
      <div className="sold-skeleton-content">
        <div className="skeleton-shimmer skeleton-line skeleton-line-short" />
        <div className="skeleton-shimmer skeleton-line skeleton-line-title" />
      </div>
    </article>
  ));
}

function ReviewsSkeletonCards() {
  return Array.from({ length: 3 }, (_, index) => (
    <article className="review-skeleton" aria-hidden="true" key={index}>
      <div className="skeleton-shimmer skeleton-line skeleton-line-rating" />
      <div className="skeleton-shimmer skeleton-line skeleton-line-review" />
      <div className="skeleton-shimmer skeleton-line skeleton-line-review" />
      <div className="skeleton-shimmer skeleton-line skeleton-line-review-short" />
      <div className="skeleton-shimmer skeleton-line skeleton-line-author" />
    </article>
  ));
}

function ProgressiveImage({ src, alt, className = '', loading = 'lazy', fetchPriority = 'auto', variant = 'photo', fallback = null }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const imageRef = useRef(null);
  const previousSrcRef = useRef(src);
  const unavailable = failed || !src;

  useEffect(() => {
    if (previousSrcRef.current !== src) {
      previousSrcRef.current = src;
      setLoaded(false);
      setFailed(false);
      setAttempt(0);
    }

    const image = imageRef.current;
    if (image?.complete) {
      if (image.naturalWidth > 0) setLoaded(true);
      else if (src) setFailed(true);
    }
  }, [attempt, src]);

  useEffect(() => {
    if (!failed || !src || attempt >= 2) return undefined;
    const retryTimer = window.setTimeout(() => {
      setFailed(false);
      setAttempt((value) => value + 1);
    }, 350 * (attempt + 1));
    return () => window.clearTimeout(retryTimer);
  }, [attempt, failed, src]);

  return (
    <span className={`progressive-image${loaded ? ' is-loaded' : ''}${failed ? ' is-failed' : ''}${className ? ` ${className}` : ''}`} aria-busy={!loaded && !failed}>
      {!failed && src && (
        <img
          ref={imageRef}
          key={`${src}-${attempt}`}
          src={src}
          alt={alt}
          loading={loading}
          decoding="async"
          fetchpriority={fetchPriority}
          onLoad={() => setLoaded(true)}
          onError={() => { setLoaded(false); setFailed(true); }}
        />
      )}
      {!loaded && failed && fallback ? (
        <span className="progressive-image-fallback">{fallback}</span>
      ) : !loaded && (
        <span className={`progressive-image-placeholder${variant === 'compact' ? ' is-compact' : ''}`} aria-hidden={!(unavailable && Boolean(src))}>
          <span className={`progressive-image-mark${unavailable ? ' is-static' : ''}`}><SiteIcon name="image" /></span>
          {variant !== 'compact' && <span>{unavailable ? 'Immagine non disponibile' : 'Caricamento immagine'}</span>}
          {unavailable && Boolean(src) && attempt >= 2 && (
            <button type="button" aria-label="Riprova a caricare l’immagine" onClick={() => { setFailed(false); setLoaded(false); setAttempt(0); }}>
              Riprova
            </button>
          )}
        </span>
      )}
    </span>
  );
}

function RentalRequestStatusControl({ request, actionBusy, onUpdateStatus }) {
  const [selectedStatus, setSelectedStatus] = useState(request.status);

  useEffect(() => {
    setSelectedStatus(request.status);
  }, [request.status]);

  return (
    <form className="rental-admin-status" onSubmit={(event) => { event.preventDefault(); onUpdateStatus(request, selectedStatus); }}>
      <label>Stato richiesta
        <SelectField name="status" value={selectedStatus} onChange={(event) => setSelectedStatus(event.target.value)}>
          <option value="pending">Da gestire</option>
          <option value="contacted">Contattato</option>
          <option value="confirmed">Confermato</option>
          <option value="declined">Non disponibile</option>
        </SelectField>
      </label>
      {request.status === 'pending' && <button className="rental-mark-contacted" type="button" disabled={actionBusy === request.id} onClick={() => onUpdateStatus(request, 'contacted')}>
        <SiteIcon name="phone" />{actionBusy === request.id ? 'Aggiornamento…' : 'Segna come contattato'}
      </button>}
      <button className="button button-outline button-small" type="submit" disabled={actionBusy === request.id}>
        {actionBusy === request.id ? 'Aggiornamento…' : 'Aggiorna stato'}
      </button>
    </form>
  );
}

function AdminRentalManager({ vehicles, requests, loading, error, actionBusy, actionStatus, onUpdateStatus }) {
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [requestVehicleFilter, setRequestVehicleFilter] = useState('all');
  const [sortMode, setSortMode] = useState('newest');
  const rentalVehicles = vehicles.filter((vehicle) => vehicle.type === 'rent');
  const activeVehicleId = rentalVehicles.some((vehicle) => vehicle.id === selectedVehicleId)
    ? selectedVehicleId
    : rentalVehicles[0]?.id || '';
  const vehicleRequests = requests.filter((request) => request.vehicle.id === activeVehicleId);
  const confirmedRequests = vehicleRequests
    .filter((request) => request.status === 'confirmed')
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
  const visibleRequests = useMemo(() => {
    const query = searchTerm.trim().toLocaleLowerCase('it-IT');
    return requests
      .filter((request) => statusFilter === 'all' || request.status === statusFilter)
      .filter((request) => requestVehicleFilter === 'all' || request.vehicle.id === requestVehicleFilter)
      .filter((request) => !query || [
        request.customer.name,
        request.customer.email,
        request.customer.phone,
        request.vehicle.make,
        request.vehicle.model,
        request.vehicle.year,
      ].some((value) => String(value || '').toLocaleLowerCase('it-IT').includes(query)))
      .sort((a, b) => sortMode === 'pickup'
        ? a.startDate.localeCompare(b.startDate) || a.createdAt.localeCompare(b.createdAt)
        : b.createdAt.localeCompare(a.createdAt));
  }, [requests, searchTerm, statusFilter, requestVehicleFilter, sortMode]);
  const unavailableDates = useMemo(() => expandUnavailableDates(
    confirmedRequests.map((request) => ({ startDate: request.startDate, endDate: request.endDate })),
  ), [confirmedRequests]);
  const pendingCount = requests.filter((request) => request.status === 'pending').length;
  const confirmedCount = requests.filter((request) => request.status === 'confirmed').length;
  const contactedCount = requests.filter((request) => request.status === 'contacted').length;

  return (
    <div className="admin-rental-workspace">
      <section className="admin-rental-overview" aria-label="Riepilogo noleggi">
        <div><span>Da gestire</span><strong>{pendingCount}</strong></div>
        <div><span>Contattati</span><strong>{contactedCount}</strong></div>
        <div><span>Confermati</span><strong>{confirmedCount}</strong></div>
        <div><span>Richieste totali</span><strong>{requests.length}</strong></div>
      </section>

      <section className="admin-submissions admin-rental-calendar-panel" aria-labelledby="admin-rental-calendar-title">
        <div className="admin-submissions-heading">
          <div>
            <p className="eyebrow">PIANIFICAZIONE · DISPONIBILITÀ CONFERMATE</p>
            <h2 id="admin-rental-calendar-title">Calendario noleggi</h2>
          </div>
          {rentalVehicles.length > 0 && <span className="rental-calendar-total">{unavailableDates.length} {unavailableDates.length === 1 ? 'giorno occupato' : 'giorni occupati'}</span>}
        </div>
        {rentalVehicles.length > 0 ? (
          <div className="admin-rental-calendar-layout">
            <div>
              <label className="admin-rental-vehicle-select">Auto a noleggio
                <SelectField value={activeVehicleId} onChange={(event) => setSelectedVehicleId(event.target.value)}>
                  {rentalVehicles.map((vehicle) => <option value={vehicle.id} key={vehicle.id}>{vehicle.make} {vehicle.model} · {vehicle.year}</option>)}
                </SelectField>
              </label>
              <DayPicker
                className="admin-rental-calendar"
                mode="default"
                modifiers={{ unavailable: unavailableDates }}
                modifiersClassNames={{ unavailable: 'rental-calendar-unavailable' }}
                locale={it}
                weekStartsOn={1}
                showOutsideDays
                footer="In rosso: periodi confermati. Le richieste in attesa non bloccano le date."
                aria-label="Calendario delle disponibilità noleggio"
                lang="it-IT"
              />
            </div>
            <div className="admin-rental-confirmed-list">
              <h3>Periodi confermati</h3>
              {confirmedRequests.length ? confirmedRequests.map((request) => (
                <article key={request.id}>
                    <div>
                      <span>{new Date(`${request.startDate}T00:00:00`).toLocaleDateString('it-IT')} – {new Date(`${request.endDate}T00:00:00`).toLocaleDateString('it-IT')}</span>
                      <strong>{request.customer.name}</strong>
                    </div>
                    <div>
                      <strong>{request.rentalDays} {request.rentalDays === 1 ? 'notte' : 'notti'}</strong>
                      <a href={`tel:${request.customer.phone.replace(/[^\d+]/g, '')}`}>{request.customer.phone}</a>
                    </div>
                </article>
              )) : <p>Nessun periodo confermato per questa auto.</p>}
            </div>
          </div>
        ) : <p className="admin-submissions-empty">Aggiungi un’auto a noleggio per gestire qui il calendario.</p>}
      </section>

      <section className="admin-submissions" aria-labelledby="admin-rental-requests-title">
        <div className="admin-submissions-heading">
          <div>
            <p className="eyebrow">RICHIESTE · PREVENTIVI · CONFERME</p>
            <h2 id="admin-rental-requests-title">Richieste di noleggio <span>{requests.length}</span></h2>
          </div>
        </div>
        <p className="rental-admin-note">Conferma una richiesta solo dopo aver verificato date e tariffa. Il calendario si aggiorna automaticamente.</p>
        {error && <p className="form-error" role="alert">{error}</p>}
        {loading && <p className="admin-submissions-empty" role="status">Caricamento richieste…</p>}
        {!loading && !error && requests.length === 0 && <p className="admin-submissions-empty">Non ci sono ancora richieste di noleggio.</p>}
        {requests.length > 0 && <div className="rental-request-filters" aria-label="Filtri richieste noleggio">
          <label className="rental-request-search">Cerca cliente o auto
            <input type="search" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Nome, email, telefono, modello" />
          </label>
          <label>Stato
            <SelectField value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="all">Tutti gli stati</option>
              <option value="pending">Da gestire</option>
              <option value="contacted">Contattato</option>
              <option value="confirmed">Confermato</option>
              <option value="declined">Non disponibile</option>
            </SelectField>
          </label>
          <label>Auto
            <SelectField value={requestVehicleFilter} onChange={(event) => setRequestVehicleFilter(event.target.value)}>
              <option value="all">Tutte le auto</option>
              {rentalVehicles.map((vehicle) => <option value={vehicle.id} key={vehicle.id}>{vehicle.year} {vehicle.make} {vehicle.model}</option>)}
            </SelectField>
          </label>
          <label>Ordina per
            <SelectField value={sortMode} onChange={(event) => setSortMode(event.target.value)}>
              <option value="newest">Richieste più recenti</option>
              <option value="pickup">Ritiro più vicino</option>
            </SelectField>
          </label>
          <span className="rental-request-result-count" role="status">{visibleRequests.length} {visibleRequests.length === 1 ? 'richiesta' : 'richieste'}</span>
        </div>}
        {!loading && !error && requests.length > 0 && visibleRequests.length === 0 && <p className="admin-submissions-empty">Nessuna richiesta corrisponde ai filtri selezionati.</p>}
        <div className="customer-requests-list">
          {visibleRequests.map((request) => (
            <article className="customer-request rental-request-card" key={request.id}>
              <div className="customer-request-header rental-request-card-header">
                <div>
                  <span className={`admin-submission-status ${request.status === 'confirmed' ? 'status-accepted' : request.status === 'declined' ? 'status-rejected' : request.status === 'contacted' ? 'status-contacted' : 'status-reviewing'}`}>
                    {{ pending: 'Da gestire', contacted: 'Contattato', confirmed: 'Confermato', declined: 'Non disponibile' }[request.status] || request.status}
                  </span>
                  <h3>{request.vehicle.year} {request.vehicle.make} {request.vehicle.model}</h3>
                </div>
                <time dateTime={request.createdAt}>{new Date(request.createdAt).toLocaleString('it-IT')}</time>
              </div>
              <div className="rental-request-body">
                <ProgressiveImage className="admin-purchase-image" src={request.vehicle.image} alt={`${request.vehicle.make} ${request.vehicle.model}`} />
                <div className="rental-request-info">
                  <div className="rental-request-customer">
                    <span className="rental-request-kicker">RICHIEDENTE</span>
                    <strong>{request.customer.name}</strong>
                  </div>
                  <div className="rental-request-contacts">
                    <a href={`mailto:${encodeURIComponent(request.customer.email)}`}><SiteIcon name="mail" />{request.customer.email}</a>
                    <a href={`tel:${request.customer.phone.replace(/[^\d+]/g, '')}`}><SiteIcon name="phone" />{request.customer.phone}</a>
                  </div>
                  <div className="rental-request-facts">
                    <div className="rental-request-period">
                      <span className="rental-request-kicker">PERIODO</span>
                      <strong><time dateTime={request.startDate}>{new Date(`${request.startDate}T00:00:00`).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })}</time><span aria-hidden="true">→</span><time dateTime={request.endDate}>{new Date(`${request.endDate}T00:00:00`).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })}</time></strong>
                      <small><SiteIcon name="calendar" />{request.rentalDays} {request.rentalDays === 1 ? 'notte' : 'notti'}</small>
                    </div>
                    <div className="rental-request-estimate">
                      <span className="rental-request-kicker">STIMA TOTALE</span>
                      <strong>{euro.format(request.estimatedTotal)}</strong>
                      <small>{euro.format(request.vehicle.dailyRate)} / giorno</small>
                    </div>
                    <div className="rental-request-notification">
                      <span className="rental-request-kicker">NOTIFICA EMAIL</span>
                      <strong className={`rental-email-status is-${request.emailStatus || 'unknown'}`}>
                        {request.emailStatus === 'sent' ? 'Inviata' : request.emailStatus === 'not_configured' ? 'Non configurata' : request.emailStatus === 'failed' ? 'Invio non riuscito' : 'In attesa'}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>
              {request.message && <p className="rental-request-customer-message">{request.message}</p>}
              <RentalRequestStatusControl request={request} actionBusy={actionBusy} onUpdateStatus={onUpdateStatus} />
              {actionStatus.requestId === request.id && actionStatus.error && <p className="form-error" role="alert">{actionStatus.error}</p>}
              {actionStatus.requestId === request.id && actionStatus.message && <p className="form-success" role="status">{actionStatus.message}</p>}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function AdminSectionNavigation({ active, pendingPurchases, pendingRentals, onNavigate }) {
  const sections = [
    { id: 'inventory', label: 'Inventario', path: '/admin' },
    { id: 'purchases', label: 'Richieste d’acquisto', path: '/admin/purchases', count: pendingPurchases },
    { id: 'rentals', label: 'Noleggi', path: '/admin/rentals', count: pendingRentals },
    { id: 'analytics', label: 'Statistiche', path: '/admin/analytics' },
    { id: 'messages', label: 'Messaggi e vendite', path: '/admin/messages' },
  ];

  return (
    <nav className="account-page-nav admin-rentals-page-nav admin-section-navigation" aria-label="Sezioni amministratore">
      {sections.map((section) => (
        <button
          className={`header-glossy-accent${active === section.id ? ' is-active' : ''}${section.id === 'rentals' ? ' admin-rentals-nav-button' : ''}`}
          type="button"
          key={section.id}
          aria-current={active === section.id ? 'page' : undefined}
          onClick={() => onNavigate(section.path)}
        >
          {section.label}
          {Number.isInteger(section.count) && <span>{section.count}</span>}
        </button>
      ))}
    </nav>
  );
}

function AdminPurchaseRequestsPanel({ requests, error, actionBusy, actionStatus, onAccept }) {
  return (
    <section className="admin-submissions" aria-labelledby="admin-purchase-requests-title">
      <div className="admin-submissions-heading">
        <div>
          <p className="eyebrow">CONTATTI · AUTO IN VENDITA</p>
          <h2 id="admin-purchase-requests-title">Richieste di acquisto <span>{requests.length}</span></h2>
        </div>
      </div>
      {error && <p className="form-error" role="alert">{error}</p>}
      {!error && requests.length === 0 && <p className="admin-submissions-empty">Non ci sono richieste d’acquisto da gestire.</p>}
      <div className="customer-requests-list">
        {requests.map((request) => (
          <article className="customer-request admin-purchase-request" key={request.id}>
            <div className="customer-request-header">
              <div>
                <span className={`admin-submission-status ${request.status === 'accepted' ? 'status-accepted' : request.status === 'contacted' ? 'status-contacted' : 'status-reviewing'}`}>
                  {request.status === 'accepted' ? 'Accettata' : request.status === 'contacted' ? 'Contattato' : 'Da contattare'}
                </span>
                <h3>{request.vehicle.year} {request.vehicle.make} {request.vehicle.model}</h3>
              </div>
              <time dateTime={request.createdAt}>{new Date(request.createdAt).toLocaleDateString('it-IT')}</time>
            </div>
            <div className="admin-purchase-summary">
              <ProgressiveImage className="admin-purchase-image" src={request.vehicle.image || request.vehicle.images?.[0]} alt={`${request.vehicle.make} ${request.vehicle.model}`} />
              <div className="admin-purchase-details">
                <div className="admin-purchase-customer">
                  <span className="admin-purchase-detail-label">CLIENTE</span>
                  <strong>{request.customer.name}</strong>
                </div>
                <div className="admin-purchase-contacts">
                  <a href={`mailto:${encodeURIComponent(request.customer.email)}`}><SiteIcon name="mail" />{request.customer.email}</a>
                  {request.customer.phone && <a className="admin-purchase-phone" href={`tel:${request.customer.phone.replace(/[^\d+]/g, '')}`}><SiteIcon name="phone" /> <span>{request.customer.phone}</span></a>}
                </div>
                <div className="admin-purchase-terms">
                  <span className="admin-purchase-price"><SiteIcon name="price" /><span>Prezzo auto <b>{euro.format(request.vehicle.price)}</b></span></span>
                  <span className="admin-purchase-vat">{getVehicleVatLabel(request.vehicle)}</span>
                  {request.vehicle.installmentPlan && <span className="admin-purchase-installment"><SiteIcon name="payment" /><span>{monthlyEuro.format(request.vehicle.installmentPlan.monthlyAmount)} × {request.vehicle.installmentPlan.months} mesi</span></span>}
                </div>
              </div>
            </div>
            {request.status !== 'accepted' ? (
              <button
                className="admin-purchase-accept"
                type="button"
                disabled={actionBusy === request.id}
                onClick={() => onAccept(request)}
              >
                <svg viewBox="0 0 16 16" aria-hidden="true"><path d="m3.5 8.2 2.8 2.8 6.2-6.2" /></svg>
                {actionBusy === request.id ? 'Accettazione…' : 'Accetta richiesta'}
              </button>
            ) : (
              <p className="form-success" role="status">Richiesta accettata{request.acceptedAt ? ` il ${new Date(request.acceptedAt).toLocaleDateString('it-IT')}` : ''}.</p>
            )}
            {actionStatus.requestId === request.id && actionStatus.error && <p className="form-error" role="alert">{actionStatus.error}</p>}
          </article>
        ))}
      </div>
    </section>
  );
}

function AdminAnalyticsWorkspace({
  analyticsData,
  vehicleType,
  setVehicleType,
  metric,
  setMetric,
  activityCalendar,
  activityMetric,
  setActivityMetric,
  vehicleMetricsError,
  salesError,
  vehicleMetricsLoaded,
  salesLoaded,
  interestGaugeDataReady,
  interestGaugeStatus,
  timelineError,
  siteTraffic,
  siteTrafficError,
}) {
  const metricLabel = metric === 'views' ? 'Auto più visualizzate' : metric === 'requests' ? 'Richieste per auto' : 'Vendite per marca';
  const activityPeakDay = activityCalendar.days.reduce(
    (peak, day) => !peak || day[activityMetric] > peak[activityMetric] ? day : peak,
    null,
  );
  const activityPeakValue = activityPeakDay?.[activityMetric] ?? 0;
  const activityMetricLabel = activityMetric === 'interest'
    ? (activityPeakValue === 1 ? 'interazione' : 'interazioni')
    : activityMetric === 'views'
      ? (activityPeakValue === 1 ? 'visualizzazione' : 'visualizzazioni')
      : activityMetric === 'requests'
        ? (activityPeakValue === 1 ? 'richiesta' : 'richieste')
        : (activityPeakValue === 1 ? 'auto venduta' : 'auto vendute');

  return (
    <>
      <section className="admin-analytics admin-analytics-dedicated" aria-labelledby="admin-analytics-title">
        <div className="admin-analytics-heading">
          <div>
            <p className="eyebrow">DATI DEL PARCO AUTO</p>
            <h2 id="admin-analytics-title">Statistiche <em>e performance.</em></h2>
            <p>Confronta interesse, richieste e vendite. I valori sono cumulativi salvo lo storico giornaliero.</p>
          </div>
          <label className="admin-analytics-filter">
            <span>Categoria auto</span>
            <SelectField value={vehicleType} onChange={(event) => setVehicleType(event.target.value)}>
              <option value="all">Tutte le auto</option>
              <option value="buy">In vendita</option>
              <option value="rent">A noleggio</option>
            </SelectField>
          </label>
        </div>
        {vehicleMetricsError && <p className="form-error" role="alert">{vehicleMetricsError}</p>}
        {salesError && <p className="form-error" role="alert">Storico vendite non caricato: {salesError}</p>}
        <div className="admin-analytics-kpis">
          <article className="admin-analytics-kpi"><span className="admin-analytics-icon"><SiteIcon name="car" /></span><span className="admin-analytics-kpi-label">Auto pubblicate</span><strong>{kilometer.format(analyticsData.totalVehicles)}</strong><small>{vehicleType === 'all' ? 'nell’inventario' : vehicleType === 'buy' ? 'in vendita' : 'a noleggio'}</small></article>
          <article className="admin-analytics-kpi"><span className="admin-analytics-icon"><SiteIcon name="eye" /></span><span className="admin-analytics-kpi-label">Visualizzazioni</span><strong>{vehicleMetricsError || !vehicleMetricsLoaded ? '—' : kilometer.format(analyticsData.totalViews)}</strong><small>visite alle schede auto</small></article>
          <article className="admin-analytics-kpi"><span className="admin-analytics-icon"><SiteIcon name="people" /></span><span className="admin-analytics-kpi-label">Richieste</span><strong>{vehicleType === 'rent' || vehicleMetricsError || !vehicleMetricsLoaded || salesError || !salesLoaded ? '—' : kilometer.format(analyticsData.totalRequests)}</strong><small>{vehicleType === 'rent' ? 'solo acquisto' : 'acquisto, storico disponibile'}</small></article>
          <article className="admin-analytics-kpi"><span className="admin-analytics-icon"><SiteIcon name="check" /></span><span className="admin-analytics-kpi-label">Vendite</span><strong>{vehicleType === 'rent' || salesError || !salesLoaded ? '—' : kilometer.format(analyticsData.totalSales)}</strong><small>{vehicleType === 'rent' ? 'non applicabile' : 'nello storico'}</small></article>
          <article className="admin-analytics-kpi admin-analytics-kpi-featured"><span className="admin-analytics-icon"><SiteIcon name="price" /></span><span className="admin-analytics-kpi-label">Fatturato registrato</span><strong>{salesError || !salesLoaded ? '—' : vehicleType === 'rent' ? '—' : revenueEuro.format(analyticsData.totalRevenue)}</strong><small>{vehicleType === 'rent' ? 'vendite escluse' : analyticsData.estimatedRevenueSales ? `${analyticsData.estimatedRevenueSales} prezzi stimati` : 'prezzi finali registrati'}</small></article>
        </div>
        {analyticsData.incompleteHistoricalSales > 0 && vehicleType !== 'rent' && <p className="admin-analytics-insights-note">Dati storici parziali: {analyticsData.incompleteHistoricalSales} vendite senza metriche complete sono escluse dal tasso d’interesse.</p>}
        <div className="admin-analytics-panels">
          <VehicleInterestGauge
            rate={interestGaugeDataReady && analyticsData.interestViews > 0 ? analyticsData.interestRate : null}
            requests={interestGaugeDataReady ? analyticsData.interestRequests : null}
            views={interestGaugeDataReady ? analyticsData.interestViews : null}
            partial={interestGaugeDataReady && analyticsData.incompleteHistoricalSales > 0}
            partialNote={`${analyticsData.incompleteHistoricalSales} vendite storiche senza metriche complete`}
            statusNote={interestGaugeStatus}
          />
          <div className="admin-analytics-chart">
            <div className="admin-analytics-chart-heading">
              <div><h3>{metricLabel}</h3><p>Le prime cinque voci per indicatore selezionato.</p></div>
              <div className="admin-analytics-tabs" role="group" aria-label="Metrica del grafico">
                <button type="button" className={metric === 'views' ? 'is-active' : ''} aria-pressed={metric === 'views'} onClick={() => setMetric('views')}><SiteIcon name="eye" /> Visite</button>
                <button type="button" className={metric === 'requests' ? 'is-active' : ''} aria-pressed={metric === 'requests'} onClick={() => setMetric('requests')}><SiteIcon name="people" /> Richieste</button>
                <button type="button" className={metric === 'sales' ? 'is-active' : ''} aria-pressed={metric === 'sales'} onClick={() => setMetric('sales')}><SiteIcon name="check" /> Vendite</button>
              </div>
            </div>
            {analyticsData.chartRows.length ? (
              <ol className="admin-analytics-bars">
                {analyticsData.chartRows.map((row, index) => {
                  const value = row[metric];
                  const width = value ? Math.max(3, (value / analyticsData.chartMaximum) * 100) : 0;
                  return (
                    <li className="admin-analytics-bar-row" key={row.vehicle.id}>
                      <span className="admin-analytics-rank">{String(index + 1).padStart(2, '0')}</span>
                      <span className="admin-analytics-vehicle">{metric === 'sales' ? <strong>{row.vehicle.make}</strong> : <>{row.vehicle.make} <strong>{row.vehicle.model}</strong></>}<small>{row.soldAt ? `Venduta il ${new Date(row.soldAt).toLocaleDateString('it-IT')}` : `${row.vehicle.year} · ${row.vehicle.type === 'rent' ? 'Noleggio' : 'In vendita'}`}</small></span>
                      <span className="admin-analytics-bar-track" aria-hidden="true"><span style={{ width: `${width}%` }} /></span>
                      <strong className="admin-analytics-bar-value">{kilometer.format(value)}</strong>
                    </li>
                  );
                })}
              </ol>
            ) : <p className="admin-analytics-empty">{metric !== 'views' && vehicleType === 'rent' ? 'Richieste e vendite riguardano solo le auto in vendita.' : 'Non ci sono ancora dati da visualizzare.'}</p>}
            <p className="admin-analytics-footnote">I conteggi sono cumulativi e non rappresentano un intervallo temporale.</p>
          </div>
        </div>
      </section>
      <section className="admin-activity-chart admin-activity-chart-dedicated" aria-labelledby="admin-activity-title">
        <div className="admin-activity-heading">
          <div><p className="eyebrow">ULTIMI 30 GIORNI</p><h3 id="admin-activity-title">Andamento nel tempo</h3><p>{kilometer.format(activityCalendar.total)} {activityMetric === 'interest' ? 'interazioni' : activityMetric === 'views' ? 'visualizzazioni' : activityMetric === 'requests' ? 'richieste' : 'auto vendute'}</p></div>
          <div className="admin-analytics-tabs" role="group" aria-label="Tipo di attività">
            <button type="button" className={activityMetric === 'interest' ? 'is-active' : ''} aria-pressed={activityMetric === 'interest'} onClick={() => setActivityMetric('interest')}>Interesse</button>
            <button type="button" className={activityMetric === 'views' ? 'is-active' : ''} aria-pressed={activityMetric === 'views'} onClick={() => setActivityMetric('views')}>Visite</button>
            <button type="button" className={activityMetric === 'requests' ? 'is-active' : ''} aria-pressed={activityMetric === 'requests'} onClick={() => setActivityMetric('requests')}>Richieste</button>
            <button type="button" className={activityMetric === 'sales' ? 'is-active' : ''} aria-pressed={activityMetric === 'sales'} onClick={() => setActivityMetric('sales')}>Vendite</button>
          </div>
        </div>
        <p className="admin-activity-summary">
          {activityPeakValue > 0
            ? <><strong>Giornata di picco:</strong> {activityPeakDay.date.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', timeZone: 'UTC' })} · {kilometer.format(activityPeakValue)} {activityMetricLabel}</>
            : 'Nessuna attività registrata negli ultimi 30 giorni.'}
        </p>
        {timelineError ? <p className="form-error" role="alert">{timelineError}</p> : (
          <div className="admin-activity-bars-scroll" role="region" aria-label="Grafico attività giornaliera ultimi 30 giorni" tabIndex={0}>
            <div className="admin-activity-bars">
              {activityCalendar.days.map((day) => {
                const value = day[activityMetric];
                const height = activityCalendar.maximum ? Math.max(value > 0 ? 5 : 0, (value / activityCalendar.maximum) * 100) : 0;
                return <div className={`admin-activity-day${day.day === new Date().toISOString().slice(0, 10) ? ' is-today' : ''}`} key={day.day}><span className="admin-activity-day-value">{kilometer.format(value)}</span><div className="admin-activity-bar-area"><span className={`admin-activity-bar is-${activityMetric}`} style={{ height: `${height}%` }} /></div><span className="admin-activity-day-label">{day.date.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', timeZone: 'UTC' })}</span></div>;
              })}
            </div>
          </div>
        )}
      </section>
      <section className="admin-site-traffic admin-site-traffic-dedicated" aria-labelledby="admin-site-traffic-title">
        <div className="admin-site-traffic-heading">
          <div>
            <p className="eyebrow">TRAFFICO · ULTIMI 30 GIORNI</p>
            <h2 id="admin-site-traffic-title">Visite e pagine viste.</h2>
            <p>Sessioni anonime e tempo attivo sulle pagine pubbliche.</p>
          </div>
        </div>
        {siteTrafficError && <p className="form-error" role="alert">{siteTrafficError}</p>}
        <div className="admin-site-traffic-kpis">
          <article className="admin-analytics-kpi"><span className="admin-analytics-icon"><SiteIcon name="eye" /></span><span className="admin-analytics-kpi-label">Visite</span><strong>{siteTraffic ? kilometer.format(siteTraffic.visits) : '—'}</strong><small>sessioni anonime</small></article>
          <article className="admin-analytics-kpi"><span className="admin-analytics-icon"><SiteIcon name="registration" /></span><span className="admin-analytics-kpi-label">Pagine viste</span><strong>{siteTraffic ? kilometer.format(siteTraffic.pageViews) : '—'}</strong><small>pagine pubbliche</small></article>
          <article className="admin-analytics-kpi"><span className="admin-analytics-icon"><SiteIcon name="clock" /></span><span className="admin-analytics-kpi-label">Permanenza media</span><strong>{siteTraffic ? formatDuration(siteTraffic.averageSessionSeconds) : '—'}</strong><small>per sessione</small></article>
        </div>
        <div className="admin-site-traffic-heatmap-panel">
          <div className="admin-site-traffic-heatmap-header">
            <h3>Distribuzione giornaliera</h3>
            <span>{siteTraffic ? `${siteTraffic.dailyTraffic.length} giorni` : '0 giorni'}</span>
          </div>
          {siteTraffic?.dailyTraffic?.length ? (() => {
            const maxValue = Math.max(...siteTraffic.dailyTraffic.map((day) => day.pageViews), 1);
            return (
              <div className="admin-site-traffic-heatmap-scroll" role="region" aria-label="Heatmap traffico giornaliero ultimi 30 giorni" tabIndex={0}>
                <div className="admin-site-traffic-heatmap">
                  {siteTraffic.dailyTraffic.map((day) => {
                    const opacity = day.pageViews === 0 ? 0.12 : 0.18 + (day.pageViews / maxValue) * 0.82;
                    const date = new Date(`${day.day}T12:00:00Z`);
                    return (
                      <div className="admin-site-traffic-day" key={day.day} title={`${date.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', timeZone: 'UTC' })} · ${kilometer.format(day.pageViews)} pagine viste`}>
                        <span className="admin-site-traffic-day-value">{kilometer.format(day.pageViews)}</span>
                        <span className="admin-site-traffic-heat" style={{ opacity, height: '100%', background: 'linear-gradient(180deg, rgba(122,208,184,0.9), rgba(122,208,184,0.28))' }} />
                        <span className="admin-site-traffic-day-label">{date.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', timeZone: 'UTC' })}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })() : <p className="admin-activity-empty">Nessun dato registrato nel periodo.</p>}
        </div>
        <div className="admin-site-traffic-lists">
          <article className="admin-site-traffic-list">
            <h3>Pagine più viste</h3>
            {siteTraffic?.topPagesByViews.length ? (
              <ol>{siteTraffic.topPagesByViews.map((page) => <li key={page.path}><span title={page.path}>{page.path === '/' ? 'Home' : page.path}</span><strong>{kilometer.format(page.views)} visite</strong></li>)}</ol>
            ) : <p>Nessun dato nel periodo selezionato.</p>}
          </article>
          <article className="admin-site-traffic-list">
            <h3>Maggior permanenza media</h3>
            {siteTraffic?.topPagesByDuration.length ? (
              <ol>{siteTraffic.topPagesByDuration.map((page) => <li key={page.path}><span title={page.path}>{page.path === '/' ? 'Home' : page.path}</span><strong>{formatDuration(page.averageSeconds)}</strong></li>)}</ol>
            ) : <p>Nessun dato nel periodo selezionato.</p>}
          </article>
        </div>
        <p className="admin-site-traffic-privacy">Nessun account o indirizzo IP viene salvato. I dettagli vengono eliminati automaticamente entro 45 giorni.</p>
      </section>
    </>
  );
}

function AdminAccessPanel({ titleId = 'admin-access-title', area, title, description, accountNote, onLogin, onBack }) {
  return (
    <div className="admin-access-denied">
      <div className="admin-access-card">
        <div className="admin-access-icon" aria-hidden="true"><SiteIcon name="key" /></div>
        <p className="admin-access-status"><span aria-hidden="true" /> ACCESSO RISERVATO</p>
        <p className="eyebrow">{area}</p>
        <h1 id={titleId}>{title}</h1>
        <p className="admin-access-description">{description}</p>
        {accountNote && <p className="admin-access-account-note" role="status">{accountNote}</p>}
        <div className="admin-access-actions">
          <button className="button button-accent" type="button" onClick={onLogin}>Accedi come amministratore <span aria-hidden="true">↗</span></button>
          <button className="button button-outline" type="button" onClick={onBack}>Torna al sito</button>
        </div>
        <p className="admin-access-footnote">Le informazioni sono visibili solo agli account autorizzati.</p>
      </div>
    </div>
  );
}

function App() {
  const [vehicles, setVehicles] = useState([]);
  const [cookieConsent, setCookieConsent] = useState(readCookieConsent);
  const [cookieSettingsOpen, setCookieSettingsOpen] = useState(false);
  const [cookieAnalyticsDraft, setCookieAnalyticsDraft] = useState(false);
  const [cookieExternalMediaDraft, setCookieExternalMediaDraft] = useState(false);
  const [cookieConsentError, setCookieConsentError] = useState('');
  const [user, setUser] = useState(null);
  const [newlyRegisteredUser, setNewlyRegisteredUser] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [authMode, setAuthMode] = useState('');
  const [authError, setAuthError] = useState('');
  const [authBusy, setAuthBusy] = useState(false);
  const [adminPinRequired, setAdminPinRequired] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [logoutNotice, setLogoutNotice] = useState('');
  const authRequestIdRef = useRef(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [confirmDialogBusy, setConfirmDialogBusy] = useState(false);
  const [confirmDialogError, setConfirmDialogError] = useState('');
  const [cart, setCart] = useState(() => {
    try {
      const savedCart = JSON.parse(window.localStorage.getItem('pelusogroup-selezione') || '[]');
      return Array.isArray(savedCart)
        ? savedCart.filter((id) => typeof id === 'string')
        : [];
    } catch (error) {
      console.error('Impossibile caricare la selezione auto salvata:', error);
      return [];
    }
  });

  const menuToggleRef = useRef(null);
  const menuCloseRef = useRef(null);
  const menuDrawerRef = useRef(null);
  const mostViewedDialogRef = useRef(null);
  const mostViewedCloseRef = useRef(null);
  const cartToggleRef = useRef(null);
  const cartCloseRef = useRef(null);
  const cartDrawerRef = useRef(null);
  const [filter, setFilter] = useState('all');
  const [catalogPage, setCatalogPage] = useState(1);
  const [search, setSearch] = useState('');
  const [makeFilter, setMakeFilter] = useState('all');
  const [bodyTypeFilter, setBodyTypeFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState('all');
  const [maxKm, setMaxKm] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState('recommended');
  const [contactMessage, setContactMessage] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactStatus, setContactStatus] = useState('');
  const [contactError, setContactError] = useState('');
  const [contactBusy, setContactBusy] = useState(false);
  const [contactFormKey, setContactFormKey] = useState(0);
  const [pathname, setPathname] = useState(() => window.location.pathname);
  const [mostViewedOpen, setMostViewedOpen] = useState(() => window.location.pathname === '/');
  const [emailError, setEmailError] = useState('');
  const [inventoryError, setInventoryError] = useState('');
  const [inventoryLoading, setInventoryLoading] = useState(true);
  const [inventoryReloadKey, setInventoryReloadKey] = useState(0);
  const [inventoryReady, setInventoryReady] = useState(false);
  const [publicVehicleMetrics, setPublicVehicleMetrics] = useState([]);
  const [publicVehicleMetricsError, setPublicVehicleMetricsError] = useState('');
  const [detailImageIndex, setDetailImageIndex] = useState(0);
  const [purchaseRequestPhone, setPurchaseRequestPhone] = useState('');
  const [purchaseRequestStatus, setPurchaseRequestStatus] = useState({ vehicleId: '', error: '', message: '' });
  const [purchaseRequestBusy, setPurchaseRequestBusy] = useState('');
  const [rentalDates, setRentalDates] = useState({ startDate: '', endDate: '' });
  const [rentalAvailability, setRentalAvailability] = useState([]);
  const [rentalAvailabilityLoading, setRentalAvailabilityLoading] = useState(false);
  const [rentalAvailabilityError, setRentalAvailabilityError] = useState('');
  const [rentalAvailabilityReloadKey, setRentalAvailabilityReloadKey] = useState(0);
  const [rentalRequestStatus, setRentalRequestStatus] = useState({ vehicleId: '', error: '', message: '' });
  const [rentalRequestBusy, setRentalRequestBusy] = useState('');
  const [purchaseRequestDeleteError, setPurchaseRequestDeleteError] = useState({ requestId: '', error: '' });
  const [adminMessage, setAdminMessage] = useState('');
  const [adminError, setAdminError] = useState('');
  const [adminBusy, setAdminBusy] = useState(false);
  const [sellSubmissions, setSellSubmissions] = useState([]);
  const [sellSubmissionError, setSellSubmissionError] = useState('');
  const [mySellSubmissions, setMySellSubmissions] = useState([]);
  const [mySellSubmissionError, setMySellSubmissionError] = useState('');
  const [mySellSubmissionLoading, setMySellSubmissionLoading] = useState(false);
  const [submissionMessageStatus, setSubmissionMessageStatus] = useState({ submissionId: '', error: '', message: '' });
  const [submissionResponseStatus, setSubmissionResponseStatus] = useState({ submissionId: '', error: '', message: '' });
  const [submissionActionBusy, setSubmissionActionBusy] = useState('');
  const [sellFormImages, setSellFormImages] = useState([]);
  const [sellFormPreviews, setSellFormPreviews] = useState([]);
  const [sellFormError, setSellFormError] = useState('');
  const [sellFormMessage, setSellFormMessage] = useState('');
  const [sellFormBusy, setSellFormBusy] = useState(false);
  const [sellFormKey, setSellFormKey] = useState(0);
  const [sales, setSales] = useState([]);
  const [salesError, setSalesError] = useState('');
  const [salesLoading, setSalesLoading] = useState(true);
  const [salesReloadKey, setSalesReloadKey] = useState(0);
  const [customerReviews, setCustomerReviews] = useState([]);
  const [customerReviewsError, setCustomerReviewsError] = useState('');
  const [customerReviewsLoading, setCustomerReviewsLoading] = useState(true);
  const [customerReviewsReloadKey, setCustomerReviewsReloadKey] = useState(0);
  const [myPurchases, setMyPurchases] = useState([]);
  const [myPurchasesError, setMyPurchasesError] = useState('');
  const [myPurchaseRequests, setMyPurchaseRequests] = useState([]);
  const [myPurchaseRequestsError, setMyPurchaseRequestsError] = useState('');
  const [adminPurchaseRequests, setAdminPurchaseRequests] = useState([]);
  const [adminPurchaseRequestsError, setAdminPurchaseRequestsError] = useState('');
  const [adminRentalRequests, setAdminRentalRequests] = useState([]);
  const [adminRentalRequestsError, setAdminRentalRequestsError] = useState('');
  const [adminRentalRequestsLoading, setAdminRentalRequestsLoading] = useState(true);
  const [rentalRequestActionStatus, setRentalRequestActionStatus] = useState({ requestId: '', error: '', message: '' });
  const [rentalRequestActionBusy, setRentalRequestActionBusy] = useState('');
  const [purchaseRequestActionBusy, setPurchaseRequestActionBusy] = useState('');
  const [purchaseRequestActionStatus, setPurchaseRequestActionStatus] = useState({ requestId: '', error: '' });
  const [adminVehicleMetrics, setAdminVehicleMetrics] = useState([]);
  const [adminVehicleMetricsError, setAdminVehicleMetricsError] = useState('');
  const [adminVehicleMetricsLoaded, setAdminVehicleMetricsLoaded] = useState(false);
  const [adminVehicleTimeline, setAdminVehicleTimeline] = useState([]);
  const [adminVehicleTimelineError, setAdminVehicleTimelineError] = useState('');
  const [siteTraffic, setSiteTraffic] = useState(null);
  const [siteTrafficError, setSiteTrafficError] = useState('');
  const [adminActivityMetric, setAdminActivityMetric] = useState('interest');
  const [adminAnalyticsMetric, setAdminAnalyticsMetric] = useState('views');
  const [adminAnalyticsVehicleType, setAdminAnalyticsVehicleType] = useState('all');
  const [adminSales, setAdminSales] = useState([]);
  const [adminSalesError, setAdminSalesError] = useState('');
  const [adminSalesLoaded, setAdminSalesLoaded] = useState(false);
  const [adminVehicleFormSubmitted, setAdminVehicleFormSubmitted] = useState(false);
  const [adminVehiclePrice, setAdminVehiclePrice] = useState('');
  const [adminVehicleType, setAdminVehicleType] = useState('buy');
  const [adminVehicleVatMode, setAdminVehicleVatMode] = useState('inclusive');
  const [markingSoldVehicleId, setMarkingSoldVehicleId] = useState('');
  const [soldBuyerId, setSoldBuyerId] = useState('');
  const [soldFinalPrice, setSoldFinalPrice] = useState('');
  const [saleAdminError, setSaleAdminError] = useState('');
  const [saleAdminMessage, setSaleAdminMessage] = useState('');
  const [reviewStatus, setReviewStatus] = useState({ saleId: '', error: '', message: '' });
  const [reviewBusy, setReviewBusy] = useState(false);
  const lastCountedVehicleRef = useRef('');
  const analyticsSessionIdRef = useRef('');
  const lastTrackedPublicPathRef = useRef('');
  const analyticsConsentRef = useRef(Boolean(cookieConsent?.analytics));
  analyticsConsentRef.current = Boolean(cookieConsent?.analytics);
  if (!analyticsSessionIdRef.current) analyticsSessionIdRef.current = createAnalyticsSessionId();
  const saveCookieConsent = (preferences) => {
    const nextConsent = {
      necessary: true,
      analytics: Boolean(preferences.analytics),
      externalMedia: Boolean(preferences.externalMedia),
    };
    try {
      window.localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, JSON.stringify({ version: 1, ...nextConsent }));
      setCookieConsent(nextConsent);
      setCookieSettingsOpen(false);
      setCookieConsentError('');
      return true;
    } catch (error) {
      console.error('Impossibile salvare le preferenze cookie:', error);
      setCookieConsentError('Non è stato possibile salvare la scelta. Controlla le impostazioni del browser e riprova.');
      return false;
    }
  };
  const openCookieSettings = () => {
    setCookieAnalyticsDraft(Boolean(cookieConsent?.analytics));
    setCookieExternalMediaDraft(Boolean(cookieConsent?.externalMedia));
    setCookieConsentError('');
    setCookieSettingsOpen(true);
  };
  const [editingVehicle, setEditingVehicle] = useState(null);
  const adminVehicleFormRef = useRef(null);
  const soldCarsTrackRef = useRef(null);
  const customerReviewsTrackRef = useRef(null);
  const [focusedSoldCarIndex, setFocusedSoldCarIndex] = useState(0);
  const [focusedReviewIndex, setFocusedReviewIndex] = useState(0);
  const [adminImageFiles, setAdminImageFiles] = useState([]);
  const [adminImagePreviews, setAdminImagePreviews] = useState([]);
  const [mainImageIndex, setMainImageIndex] = useState(-1);
  const adminImageInputRef = useRef(null);
  const sellImageInputRef = useRef(null);
  const activeVehicle = useMemo(
    () => vehicles.find((vehicle) => pathname.replace(/\/+$/, '') === `/auto/${vehicle.id}`) || null,
    [pathname, vehicles],
  );
  const rentalLocalToday = new Date();
  rentalLocalToday.setMinutes(rentalLocalToday.getMinutes() - rentalLocalToday.getTimezoneOffset());
  const rentalMinimumDate = rentalLocalToday.toISOString().slice(0, 10);
  const unavailableRentalDates = useMemo(() => expandUnavailableDates(rentalAvailability), [rentalAvailability]);
  const selectedRentalRange = {
    from: parseLocalDate(rentalDates.startDate),
    to: parseLocalDate(rentalDates.endDate),
  };
  const rentalDays = rentalDates.startDate && rentalDates.endDate
    ? (Date.parse(`${rentalDates.endDate}T00:00:00.000Z`) - Date.parse(`${rentalDates.startDate}T00:00:00.000Z`)) / 86400000
    : 0;
  const rentalEstimatedTotal = activeVehicle?.type === 'rent' && rentalDays > 0
    ? rentalDays * activeVehicle.price
    : 0;
  const detailImages = activeVehicle?.images?.length
    ? activeVehicle.images
    : activeVehicle?.image ? [activeVehicle.image] : [];
  const currentDetailImageIndex = Math.min(detailImageIndex, Math.max(0, detailImages.length - 1));
  const activeVehiclePower = getVehiclePowerDetails(activeVehicle);
  const adminVehicleMetricsById = useMemo(
    () => new Map(adminVehicleMetrics.map((metric) => [metric.vehicleId, metric])),
    [adminVehicleMetrics],
  );
  const rentalVehicles = useMemo(() => vehicles.filter((vehicle) => vehicle.type === 'rent'), [vehicles]);
  const adminActivityCalendar = useMemo(() => {
    const metricsByDay = new Map(adminVehicleTimeline.map((metric) => [metric.day, metric]));
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const days = [];

    for (let offset = 29; offset >= 0; offset -= 1) {
      const cursor = new Date(today);
      cursor.setUTCDate(cursor.getUTCDate() - offset);
      const date = new Date(cursor);
      const day = date.toISOString().slice(0, 10);
      const metric = metricsByDay.get(day);
      const views = metric?.views || 0;
      const requests = metric?.requests || 0;
      days.push({
        day,
        date,
        views,
        requests,
        sales: metric?.sales || 0,
        interest: views + requests,
      });
    }

    const maximum = Math.max(0, ...days.map((entry) => entry[adminActivityMetric]));
    return {
      days,
      maximum,
      total: days.reduce((sum, entry) => sum + entry[adminActivityMetric], 0),
    };
  }, [adminVehicleTimeline, adminActivityMetric]);
  const adminAnalyticsData = useMemo(() => {
    const inventoryRows = vehicles
      .filter((vehicle) => adminAnalyticsVehicleType === 'all' || vehicle.type === adminAnalyticsVehicleType)
      .map((vehicle) => {
        const metrics = adminVehicleMetricsById.get(vehicle.id);
        return {
          vehicle,
          views: metrics?.views ?? vehicle.viewCount ?? 0,
          requests: vehicle.type === 'buy' ? metrics?.purchaseRequests ?? 0 : 0,
          sales: 0,
          metricsComplete: Number.isSafeInteger(metrics?.views)
            && Number.isSafeInteger(metrics?.purchaseRequests),
        };
      });
    const soldRows = adminAnalyticsVehicleType === 'rent' ? [] : adminSales.map((sale) => ({
      vehicle: {
        id: `sold-${sale.id}`,
        make: sale.make,
        model: sale.model,
        year: sale.year,
        bodyType: sale.bodyType,
        type: 'buy',
      },
      views: Number.isSafeInteger(sale.views) ? sale.views : null,
      requests: Number.isSafeInteger(sale.purchaseRequests) ? sale.purchaseRequests : null,
      metricsComplete: sale.metricsComplete === true
        || (Number.isSafeInteger(sale.views) && Number.isSafeInteger(sale.purchaseRequests)),
      sales: 1,
      price: Number.isFinite(sale.finalPrice) ? sale.finalPrice : Number.isFinite(sale.price) ? sale.price : 0,
      estimatedPrice: !Number.isFinite(sale.finalPrice),
      soldAt: sale.soldAt,
    }));
    const rows = [...inventoryRows, ...soldRows];
    const saleRows = rows.filter(({ vehicle }) => vehicle.type === 'buy');
    const salesByMake = new Map();
    soldRows.forEach((row) => {
      const key = row.vehicle.make.trim().toLocaleLowerCase('it');
      if (!key) return;
      const existing = salesByMake.get(key) || { ...row, sales: 0, requests: 0, views: 0 };
      existing.sales += 1;
      existing.requests += row.requests || 0;
      existing.views += row.views || 0;
      salesByMake.set(key, existing);
    });
    const chartRows = (adminAnalyticsMetric === 'sales'
      ? [...salesByMake.values()]
      : adminAnalyticsMetric === 'views' ? rows : saleRows)
      .filter((row) => Number.isSafeInteger(row[adminAnalyticsMetric]))
      .slice()
      .sort((a, b) => b[adminAnalyticsMetric] - a[adminAnalyticsMetric]
        || a.vehicle.make.localeCompare(b.vehicle.make, 'it')
        || a.vehicle.model.localeCompare(b.vehicle.model, 'it'))
      .slice(0, 5);
    const totalViews = rows.reduce((total, row) => total + (Number.isSafeInteger(row.views) ? row.views : 0), 0);
    const totalRequests = saleRows.reduce((total, row) => total + (Number.isSafeInteger(row.requests) ? row.requests : 0), 0);
    const interestRows = saleRows.filter((row) => row.metricsComplete);
    const interestViews = interestRows.reduce((total, row) => total + (Number.isSafeInteger(row.views) ? row.views : 0), 0);
    const interestRequests = interestRows.reduce((total, row) => total + (Number.isSafeInteger(row.requests) ? row.requests : 0), 0);
    const incompleteHistoricalSales = soldRows.filter((row) => !row.metricsComplete).length;
    const totalRevenue = soldRows.reduce((total, row) => (
      total + (Number.isFinite(row.price) && row.price > 0 ? row.price : 0)
    ), 0);
    const estimatedRevenueSales = soldRows.filter((row) => row.estimatedPrice).length;
    const interestRate = interestViews ? (interestRequests / interestViews) * 100 : null;
    const mostViewed = rows.filter((row) => row.metricsComplete && Number.isSafeInteger(row.views) && row.views > 0).sort((a, b) => b.views - a.views)[0] || null;
    const aggregateInterest = (getGroup) => {
      const groups = new Map();
      rows.forEach((row) => {
        if (!row.metricsComplete) return;
        const { key, label } = getGroup(row.vehicle);
        if (!key) return;
        const group = groups.get(key) || { label, views: 0, requests: 0 };
        group.views += row.views || 0;
        group.requests += row.requests || 0;
        groups.set(key, group);
      });
      return [...groups.values()]
        .map((group) => ({ ...group, interest: group.views + group.requests }))
        .filter((group) => group.interest > 0)
        .sort((a, b) => b.interest - a.interest || b.views - a.views || a.label.localeCompare(b.label, 'it'))[0] || null;
    };
    return {
      totalVehicles: inventoryRows.length,
      totalViews,
      totalRequests,
      interestViews,
      interestRequests,
      incompleteHistoricalSales,
      totalRevenue,
      estimatedRevenueSales,
      totalSales: soldRows.length,
      interestRate,
      mostViewed,
      mostInterestedMake: aggregateInterest((vehicle) => ({
        key: vehicle.make.trim().toLocaleLowerCase('it'),
        label: vehicle.make,
      })),
      mostInterestedBodyType: aggregateInterest((vehicle) => {
        const label = normalizeVehicleBodyType(vehicle.bodyType);
        return { key: label.toLocaleLowerCase('it'), label };
      }),
      chartRows,
      chartMaximum: Math.max(1, ...chartRows.map((row) => row[adminAnalyticsMetric])),
    };
  }, [vehicles, adminVehicleMetricsById, adminSales, adminAnalyticsVehicleType, adminAnalyticsMetric]);
  const interestGaugeStatus = adminAnalyticsVehicleType === 'rent'
    ? 'Non applicabile alle auto a noleggio.'
    : adminVehicleMetricsError
      ? 'Metriche delle auto non disponibili.'
      : adminSalesError
        ? 'Storico vendite non disponibile.'
        : !adminVehicleMetricsLoaded || !adminSalesLoaded
          ? 'Caricamento delle statistiche.'
          : adminAnalyticsData.interestViews === 0
            ? 'Nessuna visualizzazione registrata per le auto in vendita.'
            : '';
  const interestGaugeDataReady = adminAnalyticsVehicleType !== 'rent'
    && !adminVehicleMetricsError
    && !adminSalesError
    && adminVehicleMetricsLoaded
    && adminSalesLoaded;
  const publicVehicleMetricsById = useMemo(
    () => new Map(publicVehicleMetrics.map((metric) => [metric.vehicleId, metric])),
    [publicVehicleMetrics],
  );
  const isUnknownVehiclePage = pathname.startsWith('/auto/') && !activeVehicle;
  const isHomePage = pathname === '/';
  const isCatalogPage = pathname === '/catalogo';
  const isSellPage = pathname === '/vendi-auto';
  const isContactPage = pathname === '/contatti';
  const isAdminPage = pathname === '/admin';
  const isAdminPurchaseRequestsPage = pathname === '/admin/purchases';
  const isAdminAnalyticsPage = pathname === '/admin/analytics';
  const isAdminMessagesPage = pathname === '/admin/messages';
  const isAdminRentalsPage = pathname === '/admin/rentals';
  const isAdminArea = isAdminPage || isAdminPurchaseRequestsPage || isAdminAnalyticsPage || isAdminMessagesPage || isAdminRentalsPage;
  const isAccountPage = pathname === '/account';

  const makes = useMemo(() => [...new Set(vehicles.map((vehicle) => vehicle.make))].sort(), [vehicles]);
  const popularMakes = useMemo(() => {
    const normalizeMake = (make) => make.toLocaleLowerCase('it').replace(/[^a-z0-9]/g, '');
    const priority = POPULAR_MAKE_ORDER.map(normalizeMake);
    const groups = new Map();
    POPULAR_MAKE_LOGO_BRANDS.forEach((make) => {
      const { name, query } = getPopularMakeInfo(make);
      groups.set(normalizeMake(name), { make: name, query, count: 0 });
    });
    vehicles.forEach((vehicle) => {
      const { name, query } = getPopularMakeInfo(vehicle.make);
      const key = normalizeMake(name);
      const group = groups.get(key) || { make: name, query, count: 0 };
      group.count += 1;
      groups.set(key, group);
    });
    return [...groups.values()]
      .sort((a, b) => {
        const aPriority = priority.indexOf(normalizeMake(a.make));
        const bPriority = priority.indexOf(normalizeMake(b.make));
        const aRank = aPriority === -1 ? priority.length : aPriority;
        const bRank = bPriority === -1 ? priority.length : bPriority;
        return aRank - bRank || b.count - a.count || a.make.localeCompare(b.make, 'it');
      });
  }, [makes, vehicles]);
  const availablePopularMakes = popularMakes.filter(({ count }) => count > 0);
  const popularBrandLogoSources = availablePopularMakes
    .map(({ make }) => POPULAR_MAKE_LOGO_PATHS[make.toLocaleLowerCase('it').replace(/[^a-z0-9]/g, '')])
    .filter(Boolean);
  const popularBrandLogosLoaded = useImageGroupLoaded(popularBrandLogoSources);
  const bodyTypeIconsLoaded = useImageGroupLoaded(
    VEHICLE_BODY_TYPES.map((type) => VEHICLE_BODY_TYPE_ICON_PATHS[type]),
  );
  const years = useMemo(() => [...new Set(vehicles.map((vehicle) => vehicle.year))].sort((a, b) => b - a), [vehicles]);
  const filteredVehicles = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('it');
    const results = vehicles.filter((vehicle) => (
      (filter === 'all' || vehicle.type === filter)
      && (makeFilter === 'all' || normalizeVehicleMake(vehicle.make) === normalizeVehicleMake(makeFilter))
      && (bodyTypeFilter === 'all' || normalizeVehicleBodyType(vehicle.bodyType) === bodyTypeFilter)
      && (yearFilter === 'all' || vehicle.year === Number(yearFilter))
      && (!maxKm || vehicle.mileageKm <= Number(maxKm))
      && (!maxPrice || vehicle.price <= Number(maxPrice))
      && (!query || `${vehicle.make} ${vehicle.model} ${vehicle.year} ${vehicle.color} ${vehicle.bodyType}`.toLocaleLowerCase('it').includes(query))
    ));

    return results.sort((a, b) => {
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      if (sortBy === 'year-desc') return b.year - a.year;
      if (sortBy === 'km-asc') return a.mileageKm - b.mileageKm;
      return vehicles.indexOf(a) - vehicles.indexOf(b);
    });
  }, [vehicles, filter, makeFilter, bodyTypeFilter, yearFilter, maxKm, maxPrice, search, sortBy]);

  const topViewedVehicles = useMemo(
    () => [...vehicles]
      .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
      .slice(0, 3),
    [vehicles],
  );
  const showMostViewedOverlay = isHomePage
    && mostViewedOpen
    && inventoryReady
    && !inventoryError
    && topViewedVehicles.length > 0;

  const catalogPageCount = Math.ceil(filteredVehicles.length / CATALOG_PAGE_SIZE);
  const catalogPageVehicles = useMemo(
    () => filteredVehicles.slice((catalogPage - 1) * CATALOG_PAGE_SIZE, catalogPage * CATALOG_PAGE_SIZE),
    [filteredVehicles, catalogPage],
  );
  const recommendedCatalogVehicles = useMemo(() => {
    const referenceVehicle = catalogPageVehicles[0];
    if (!referenceVehicle) return [];

    const currentPageIds = new Set(catalogPageVehicles.map((vehicle) => vehicle.id));
    return vehicles
      .filter((vehicle) => vehicle.id !== referenceVehicle.id && !currentPageIds.has(vehicle.id))
      .map((vehicle, index) => {
        const priceDifference = Math.abs(vehicle.price - referenceVehicle.price) / Math.max(referenceVehicle.price, 1);
        const score = (vehicle.type === referenceVehicle.type ? 4 : 0)
          + (normalizeVehicleMake(vehicle.make) === normalizeVehicleMake(referenceVehicle.make) ? 3 : 0)
          + (normalizeVehicleBodyType(vehicle.bodyType) === normalizeVehicleBodyType(referenceVehicle.bodyType) ? 2 : 0)
          + (priceDifference <= .2 ? 2 : priceDifference <= .4 ? 1 : 0);
        return { vehicle, score, index };
      })
      .sort((a, b) => b.score - a.score || a.index - b.index)
      .slice(0, 3)
      .map(({ vehicle }) => vehicle);
  }, [catalogPageVehicles, vehicles]);

  useEffect(() => {
    setCatalogPage(1);
  }, [filteredVehicles]);

  const selectedVehicles = useMemo(
    () => cart.map((id) => vehicles.find((vehicle) => vehicle.id === id)).filter(Boolean),
    [cart, vehicles],
  );
  const existingAdminImages = editingVehicle?.images || [];
  const adminImageItems = [
    ...existingAdminImages.map((src, index) => ({ src, name: `Foto attuale ${index + 1}`, index, existing: true })),
    ...adminImageFiles.map((file, index) => ({
      src: adminImagePreviews[index] || '',
      name: file.name,
      index: existingAdminImages.length + index,
      fileIndex: index,
      existing: false,
    })),
  ];

  useEffect(() => {
    if (!showMostViewedOverlay) return undefined;

    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement;
    document.body.style.overflow = 'hidden';
    mostViewedCloseRef.current?.focus();

    const handleDialogKeys = (event) => {
      if (event.key === 'Escape') {
        setMostViewedOpen(false);
        return;
      }

      if (event.key !== 'Tab') return;
      const focusable = mostViewedDialogRef.current?.querySelectorAll('button:not([disabled]), a[href]');
      if (!focusable?.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!mostViewedDialogRef.current?.contains(document.activeElement)) {
        event.preventDefault();
        first.focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleDialogKeys);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleDialogKeys);
      if (previousFocus instanceof HTMLElement && previousFocus !== document.body && previousFocus.isConnected) {
        previousFocus.focus({ preventScroll: true });
      }
    };
  }, [showMostViewedOverlay]);

  useEffect(() => {
    const requestId = ++authRequestIdRef.current;
    requestJson('/api/users/me')
      .then(({ user: currentUser, requiresAdminPin }) => {
        if (authRequestIdRef.current !== requestId) return;
        setUser(currentUser);
        if (requiresAdminPin) {
          setAdminPinRequired(true);
          setAuthMode('admin-pin');
        }
        if (!currentUser) {
          setCart([]);
          try {
            window.localStorage.removeItem('pelusogroup-selezione');
          } catch (error) {
            console.error('Impossibile cancellare la selezione auto salvata:', error);
          }
        }
      })
      .catch(() => {
        if (authRequestIdRef.current !== requestId) return;
        setUser(null);
        setCart([]);
        try {
          window.localStorage.removeItem('pelusogroup-selezione');
        } catch (error) {
          console.error('Impossibile cancellare la selezione auto salvata:', error);
        }
      })
      .finally(() => {
        if (authRequestIdRef.current === requestId) setAuthReady(true);
      });
    return () => {
      if (authRequestIdRef.current === requestId) authRequestIdRef.current += 1;
    };
  }, []);

  useEffect(() => {
    let active = true;
    setInventoryLoading(true);
    requestJson('/api/vehicles')
      .then(({ vehicles: currentVehicles }) => {
        if (!Array.isArray(currentVehicles)) throw new Error('Il server ha restituito un inventario non valido.');
        if (active) {
          setVehicles(currentVehicles.map((vehicle) => ({
            ...vehicle,
            images: Array.isArray(vehicle.images) && vehicle.images.length ? vehicle.images : [vehicle.image].filter(Boolean),
          })));
          setInventoryError('');
          setInventoryReady(true);
        }
      })
      .catch((error) => {
        if (active) setInventoryError(error.message);
      })
      .finally(() => {
        if (active) setInventoryLoading(false);
      });
    return () => { active = false; };
  }, [inventoryReloadKey]);

  useEffect(() => {
    let active = true;
    setRentalDates({ startDate: '', endDate: '' });
    setRentalAvailability([]);
    setRentalAvailabilityError('');
    if (activeVehicle?.type !== 'rent') {
      setRentalAvailabilityLoading(false);
      return () => { active = false; };
    }

    setRentalAvailabilityLoading(true);
    requestJson(`/api/rental-requests/availability/${encodeURIComponent(activeVehicle.id)}`)
      .then(({ confirmedPeriods }) => {
        if (!Array.isArray(confirmedPeriods)) throw new Error('Il calendario ha restituito date non valide.');
        if (active) setRentalAvailability(confirmedPeriods);
      })
      .catch((error) => {
        if (active) setRentalAvailabilityError(error.message);
      })
      .finally(() => {
        if (active) setRentalAvailabilityLoading(false);
      });
    return () => { active = false; };
  }, [activeVehicle?.id, activeVehicle?.type, rentalAvailabilityReloadKey]);

  useEffect(() => {
    let active = true;
    requestJson('/api/vehicles/metrics')
      .then(({ metrics }) => {
        if (!Array.isArray(metrics)) throw new Error('Il server ha restituito statistiche non valide.');
        if (active) {
          setPublicVehicleMetrics(metrics);
          setPublicVehicleMetricsError('');
        }
      })
      .catch((error) => {
        if (active) setPublicVehicleMetricsError(error.message);
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    setSalesLoading(true);
    requestJson('/api/sales')
      .then(({ sales: currentSales }) => {
        if (!Array.isArray(currentSales)) throw new Error('Il server ha restituito uno storico non valido.');
        if (active) {
          setSales(currentSales);
          setSalesError('');
        }
      })
      .catch((error) => {
        if (active) setSalesError(error.message);
      })
      .finally(() => {
        if (active) setSalesLoading(false);
      });
    return () => { active = false; };
  }, [salesReloadKey]);

  useEffect(() => {
    let active = true;
    setCustomerReviewsLoading(true);
    requestJson('/api/sales/reviews')
      .then(({ reviews }) => {
        if (!Array.isArray(reviews)) throw new Error('Il server ha restituito recensioni non valide.');
        if (active) {
          setCustomerReviews(reviews);
          setCustomerReviewsError('');
        }
      })
      .catch((error) => {
        if (active) setCustomerReviewsError(error.message);
      })
      .finally(() => {
        if (active) setCustomerReviewsLoading(false);
      });
    return () => { active = false; };
  }, [customerReviewsReloadKey]);

  useEffect(() => {
    if (salesLoading || sales.length < 2) return;
    const frame = window.requestAnimationFrame(() => updateCarouselFocus(soldCarsTrackRef, setFocusedSoldCarIndex));
    return () => window.cancelAnimationFrame(frame);
  }, [salesLoading, sales.length]);

  useEffect(() => {
    if (customerReviewsLoading || customerReviews.length < 2) return;
    const frame = window.requestAnimationFrame(() => updateCarouselFocus(customerReviewsTrackRef, setFocusedReviewIndex));
    return () => window.cancelAnimationFrame(frame);
  }, [customerReviewsLoading, customerReviews.length]);

  useEffect(() => {
    if (user?.role !== 'user') {
      setMySellSubmissions([]);
      setMySellSubmissionError('');
      setMyPurchases([]);
      setMyPurchasesError('');
      setMyPurchaseRequests([]);
      setMyPurchaseRequestsError('');
      return undefined;
    }
    let active = true;
    setMySellSubmissionLoading(true);
    const loadSubmissions = () => {
      requestJson('/api/sell-submissions/mine')
        .then(({ submissions }) => {
          if (!Array.isArray(submissions)) throw new Error('Il server ha restituito un elenco di proposte non valido.');
          if (active) {
            setMySellSubmissions(submissions);
            setMySellSubmissionError('');
          }
        })
        .catch((error) => {
          if (active) setMySellSubmissionError(error.message);
        })
        .finally(() => {
          if (active) setMySellSubmissionLoading(false);
        });
    };
    const loadPurchaseRequests = () => {
      requestJson('/api/purchase-requests/mine')
        .then(({ requests }) => {
          if (!Array.isArray(requests)) throw new Error('Il server ha restituito un elenco richieste non valido.');
          if (active) {
            setMyPurchaseRequests(requests);
            setMyPurchaseRequestsError('');
          }
        })
        .catch((error) => {
          if (active) setMyPurchaseRequestsError(error.message);
        });
    };
    loadSubmissions();
    const refresh = window.setInterval(loadSubmissions, 20000);
    loadPurchaseRequests();
    const purchaseRequestRefresh = window.setInterval(loadPurchaseRequests, 20000);
    requestJson('/api/sales/mine')
      .then(({ sales: purchases }) => {
        if (!Array.isArray(purchases)) throw new Error('Il server ha restituito un elenco acquisti non valido.');
        if (active) {
          setMyPurchases(purchases);
          setMyPurchasesError('');
        }
      })
      .catch((error) => {
        if (active) setMyPurchasesError(error.message);
      });
    return () => {
      active = false;
      window.clearInterval(refresh);
      window.clearInterval(purchaseRequestRefresh);
    };
  }, [isAccountPage, user?.id, user?.role]);

  useEffect(() => {
    if (window.location.pathname === '/account/offers') {
      window.history.replaceState({}, '', '/account');
      setPathname('/account');
    }
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      setPathname(window.location.pathname);
      window.scrollTo({ top: 0 });
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    if (!authReady) return undefined;
    if (isAdminArea || isAccountPage || user?.role === 'admin') {
      lastTrackedPublicPathRef.current = '';
      return undefined;
    }
    if (!cookieConsent?.analytics) {
      lastTrackedPublicPathRef.current = '';
      return undefined;
    }

    const trackingPath = pathname.replace(/\/+$/, '') || '/';
    let firstPageView = lastTrackedPublicPathRef.current !== trackingPath;
    lastTrackedPublicPathRef.current = trackingPath;
    let active = document.visibilityState === 'visible';
    let lastTick = performance.now();
    let accumulatedSeconds = 0;

    const flushActivity = () => {
      if (!analyticsConsentRef.current) return;
      const now = performance.now();
      if (active) accumulatedSeconds += Math.floor((now - lastTick) / 1000);
      lastTick = now;
      if (!firstPageView && accumulatedSeconds === 0) return;
      const pageView = firstPageView;
      firstPageView = false;
      const activeSeconds = Math.min(accumulatedSeconds, 30);
      accumulatedSeconds = 0;
      fetch('/api/analytics/activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: analyticsSessionIdRef.current,
          path: trackingPath,
          pageView,
          activeSeconds,
        }),
        keepalive: true,
      }).catch(() => {});
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        flushActivity();
        active = false;
      } else {
        active = true;
        lastTick = performance.now();
      }
    };

    const interval = window.setInterval(flushActivity, 15000);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    flushActivity();
    return () => {
      flushActivity();
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [authReady, cookieConsent?.analytics, isAdminArea, isAccountPage, pathname, user?.role]);

  useEffect(() => {
    if (!isAdminAnalyticsPage || user?.role !== 'admin') return undefined;
    let active = true;
    const loadSiteTraffic = () => requestJson('/api/analytics/summary?days=30')
      .then((summary) => {
        if (!Number.isFinite(summary.visits) || !Number.isFinite(summary.pageViews)
            || !Number.isFinite(summary.averageSessionSeconds)
            || !Array.isArray(summary.topPagesByViews) || !Array.isArray(summary.topPagesByDuration)) {
          throw new Error('Il server ha restituito dati di traffico non validi.');
        }
        if (active) {
          setSiteTraffic(summary);
          setSiteTrafficError('');
        }
      })
      .catch((error) => {
        if (active) setSiteTrafficError(error.message);
      });
    loadSiteTraffic();
    const interval = window.setInterval(loadSiteTraffic, 60000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [isAdminAnalyticsPage, user?.role]);

  useEffect(() => {
    setDetailImageIndex(0);
  }, [pathname]);

  useEffect(() => {
    if (!confirmDialog) return undefined;
    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !confirmDialogBusy) setConfirmDialog(null);
    };
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [confirmDialog, confirmDialogBusy]);

  useEffect(() => {
    try {
      window.localStorage.setItem('pelusogroup-selezione', JSON.stringify(cart));
    } catch (error) {
      console.error('Impossibile salvare la selezione auto:', error);
    }
  }, [cart]);

  useEffect(() => {
    if (!inventoryReady) return;
    setCart((saved) => saved.filter((id) => vehicles.some((vehicle) => vehicle.id === id)));
  }, [vehicles, inventoryReady]);

  useEffect(() => {
    if (!activeVehicle) {
      lastCountedVehicleRef.current = '';
      return undefined;
    }
    if (!cookieConsent?.analytics) {
      lastCountedVehicleRef.current = '';
      return undefined;
    }
    if (!authReady || lastCountedVehicleRef.current === activeVehicle.id) return undefined;
    recordVehicleView(activeVehicle.id);
    return undefined;
  }, [activeVehicle?.id, authReady, cookieConsent?.analytics, user?.role]);

  useEffect(() => {
    if (!isAdminArea || user?.role !== 'admin') return undefined;
    let active = true;
    requestJson('/api/sell-submissions')
      .then(({ submissions: currentSubmissions }) => {
        if (!Array.isArray(currentSubmissions)) throw new Error('Il server ha restituito un elenco non valido.');
        if (active) {
          setSellSubmissions(currentSubmissions);
          setSellSubmissionError('');
        }
      })
      .catch((error) => {
        if (active) setSellSubmissionError(error.message);
      });
    return () => { active = false; };
  }, [isAdminArea, user?.role]);

  useEffect(() => {
    if (!isAdminArea || user?.role !== 'admin') return undefined;
    let active = true;
    setAdminSalesLoaded(false);
    setAdminVehicleMetricsLoaded(false);
    setAdminSalesError('');
    setAdminVehicleMetricsError('');
    requestJson('/api/sales/admin')
      .then(({ sales: currentSales }) => {
        if (!Array.isArray(currentSales)) throw new Error('Il server ha restituito uno storico non valido.');
        if (active) {
          setAdminSales(currentSales);
          setAdminSalesError('');
          setAdminSalesLoaded(true);
        }
      })
      .catch((error) => {
        if (active) {
          setAdminSalesError(error.message);
          setAdminSalesLoaded(true);
        }
      });
    requestJson('/api/purchase-requests/admin')
      .then(({ requests }) => {
        if (!Array.isArray(requests)) throw new Error('Il server ha restituito un elenco richieste non valido.');
        if (active) {
          setAdminPurchaseRequests(requests);
          setAdminPurchaseRequestsError('');
        }
      })
      .catch((error) => {
        if (active) setAdminPurchaseRequestsError(error.message);
      });
    requestJson('/api/rental-requests/admin')
      .then(({ requests }) => {
        if (!Array.isArray(requests)) throw new Error('Il server ha restituito un elenco noleggi non valido.');
        if (active) {
          setAdminRentalRequests(requests);
          setAdminRentalRequestsError('');
        }
      })
      .catch((error) => {
        if (active) setAdminRentalRequestsError(error.message);
      })
      .finally(() => {
        if (active) setAdminRentalRequestsLoading(false);
      });
    requestJson('/api/vehicles/admin/metrics')
      .then(({ metrics }) => {
        if (!Array.isArray(metrics)) throw new Error('Il server ha restituito metriche non valide.');
        if (active) {
          setAdminVehicleMetrics(metrics);
          setAdminVehicleMetricsError('');
          setAdminVehicleMetricsLoaded(true);
        }
      })
      .catch((error) => {
        if (active) {
          setAdminVehicleMetricsError(error.message);
          setAdminVehicleMetricsLoaded(true);
        }
      });
    const loadTimeline = () => requestJson('/api/vehicles/admin/timeline?days=365')
      .then(({ timeline }) => {
        if (!Array.isArray(timeline) || timeline.some((entry) => (
          typeof entry.day !== 'string'
          || !Number.isFinite(entry.views)
          || !Number.isFinite(entry.requests)
        ))) {
          throw new Error('Il server ha restituito uno storico non valido.');
        }
        if (active) {
          setAdminVehicleTimeline(timeline);
          setAdminVehicleTimelineError('');
        }
      })
      .catch((error) => {
        if (active) setAdminVehicleTimelineError(error.message);
      });
    loadTimeline();
    const timelineRefresh = window.setInterval(loadTimeline, 60000);
    return () => {
      active = false;
      window.clearInterval(timelineRefresh);
    };
  }, [isAdminArea, user?.role]);

  useEffect(() => {
    const previews = sellFormImages.map((file) => URL.createObjectURL(file));
    setSellFormPreviews(previews);
    return () => previews.forEach((preview) => URL.revokeObjectURL(preview));
  }, [sellFormImages]);

  useEffect(() => {
    const previews = adminImageFiles.map((file) => URL.createObjectURL(file));
    setAdminImagePreviews(previews);
    return () => previews.forEach((preview) => URL.revokeObjectURL(preview));
  }, [adminImageFiles]);

  useEffect(() => {
    setDetailImageIndex(0);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    menuCloseRef.current?.focus();
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
        menuToggleRef.current?.focus({ preventScroll: true });
        return;
      }

      if (event.key === 'Tab') {
        const focusable = menuDrawerRef.current?.querySelectorAll(
          'a[href], button:not([disabled])',
        );
        if (!focusable?.length) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (!menuDrawerRef.current.contains(document.activeElement)) {
          event.preventDefault();
          first.focus();
        } else if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    const closeOnOutsidePointer = (event) => {
      if (menuDrawerRef.current && !menuDrawerRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener('keydown', closeOnEscape);
    document.addEventListener('pointerdown', closeOnOutsidePointer);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', closeOnEscape);
      document.removeEventListener('pointerdown', closeOnOutsidePointer);
    };
  }, [menuOpen]);

  useEffect(() => {
    if (!cartOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    cartCloseRef.current?.focus();
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') {
        setCartOpen(false);
        cartToggleRef.current?.focus();
        return;
      }

      if (event.key === 'Tab') {
        const focusable = cartDrawerRef.current?.querySelectorAll('button:not([disabled])');
        if (!focusable?.length) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (!cartDrawerRef.current.contains(document.activeElement)) {
          event.preventDefault();
          first.focus();
        } else if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [cartOpen]);

  function closeMenu(restoreFocus = true) {
    setMenuOpen(false);
    if (restoreFocus) menuToggleRef.current?.focus({ preventScroll: true });
  }

  function closeCart() {
    setCartOpen(false);
    cartToggleRef.current?.focus();
  }

  function navigateToPath(path, replace = false) {
    if (replace) window.history.replaceState({}, '', path);
    else window.history.pushState({}, '', path);
    setPathname(window.location.pathname);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function navigateAfterAuthentication(signedInUser) {
    const destination = signedInUser.role === 'admin'
      ? window.location.pathname.startsWith('/admin') ? window.location.pathname : '/admin'
      : '/account';
    navigateToPath(destination);
  }

  function navigateToHome(section = 'home') {
    if (section === 'contact') {
      navigateToPath('/contatti');
      return;
    }
    if (section === 'sell' || section === 'sell-form') {
      navigateToPath('/vendi-auto');
      return;
    }
    if (section === 'inventory') {
      navigateToPath('/catalogo');
      return;
    }
    if (section === 'home') setMostViewedOpen(true);
    window.history.pushState({}, '', `/#${section}`);
    setPathname('/');
    window.setTimeout(() => {
      document.getElementById(section)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 0);
  }

  function navigateToSection(section) {
    if (section === 'contact') {
      navigateToPath('/contatti');
      return;
    }
    if (section === 'sell' || section === 'sell-form') {
      navigateToPath('/vendi-auto');
      return;
    }
    if (section === 'inventory') {
      resetFilters();
      setFilter('all');
      navigateToPath('/catalogo');
      return;
    }
    if (pathname !== '/') {
      navigateToHome(section);
      return;
    }
    window.history.pushState({}, '', `/#${section}`);
    document.getElementById(section)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function recordVehicleView(vehicleId, force = false) {
    if (!authReady || !cookieConsent?.analytics || (!force && lastCountedVehicleRef.current === vehicleId)) return;
    lastCountedVehicleRef.current = vehicleId;
    if (user?.role === 'admin') return;

    requestJson(`/api/vehicles/${encodeURIComponent(vehicleId)}/view`, { method: 'POST' })
      .then(() => {
        setVehicles((currentVehicles) => currentVehicles.map((vehicle) => (
          vehicle.id === vehicleId
            ? { ...vehicle, viewCount: (vehicle.viewCount || 0) + 1 }
            : vehicle
        )));
      })
      .catch((error) => {
        console.error('Impossibile registrare la visualizzazione dell’auto:', error);
      });
  }

  function openVehicle(vehicleId) {
    recordVehicleView(vehicleId, true);
    navigateToPath(`/auto/${vehicleId}`);
  }

  function openAdmin(vehicle = null) {
    setEditingVehicle(vehicle);
    setAdminVehiclePrice(vehicle ? String(vehicle.price) : '');
    setAdminVehicleType(vehicle?.type || 'buy');
    setAdminVehicleVatMode(getVehicleVatMode(vehicle));
    setAdminVehicleFormSubmitted(false);
    setAdminImageFiles([]);
    setAdminImagePreviews([]);
    setMainImageIndex(vehicle ? Math.max(0, (vehicle.images || []).indexOf(vehicle.image)) : -1);
    setAdminError('');
    setAdminMessage('');
    closeMenu(false);
    navigateToPath('/admin');
  }

  async function handleAdminVehicleSubmit(event) {
    event.preventDefault();
    setAdminError('');
    setAdminMessage('');
    const form = event.currentTarget;
    const formData = new FormData(form);
    const imageCount = existingAdminImages.length + adminImageFiles.length;
    if (imageCount > 20 || mainImageIndex < 0 || mainImageIndex >= imageCount) {
      setAdminVehicleFormSubmitted(true);
      setAdminError('Aggiungi almeno una foto e seleziona quella principale. Puoi associare al massimo 20 foto per auto.');
      return;
    }
    const payload = {
      make: formData.get('make'),
      model: formData.get('model'),
      year: Number(formData.get('year')),
      mileageKm: Number(formData.get('mileageKm')),
      price: Number(formData.get('price')),
      vatMode: formData.get('vatMode') || 'inclusive',
      type: formData.get('type'),
      bodyType: formData.get('bodyType'),
      color: formData.get('color'),
      label: formData.get('label'),
      fuel: formData.get('fuel'),
      transmission: formData.get('transmission'),
      power: `${formData.get('powerCv')} CV`,
      powerCv: Number(formData.get('powerCv')),
      powerKw: formData.get('powerKw') || null,
      emissionsClass: formData.get('emissionsClass'),
      inspectionYear: formData.get('inspectionYear') || null,
      lastService: formData.get('lastService'),
      engine: formData.get('engine'),
      drivetrain: formData.get('drivetrain'),
      engineDisplacementCc: formData.get('engineDisplacementCc') || null,
      cylinders: formData.get('cylinders') || null,
      consumptionCombined: formData.get('consumptionCombined') || null,
      consumptionUnit: formData.get('consumptionUnit'),
      co2Emissions: formData.get('co2Emissions') || null,
      torqueNm: formData.get('torqueNm') || null,
      accelerationSeconds: formData.get('accelerationSeconds') || null,
      topSpeedKmh: formData.get('topSpeedKmh') || null,
      trunkCapacityLitres: formData.get('trunkCapacityLitres') || null,
      firstRegistration: formData.get('firstRegistration'),
      noviceDriverEligible: formData.get('noviceDriverEligible'),
      condition: formData.get('condition'),
      previousOwners: formData.get('previousOwners') || null,
      warrantyMonths: formData.get('warrantyMonths') || null,
      warrantyCoverage: formData.getAll('warrantyCoverage'),
      maintenanceHistory: formData.get('maintenanceHistory'),
      doors: Number(formData.get('doors')),
      seats: Number(formData.get('seats')),
      description: formData.get('description'),
      installmentMonthlyAmount: formData.get('installmentMonthlyAmount') || null,
      installmentMonths: formData.get('installmentMonths') || null,
      images: editingVehicle?.images || [],
      mainImageIndex: Number(formData.get('mainImageIndex')),
      features: String(formData.get('features') || '').split(/\r?\n/).map((feature) => feature.trim()).filter(Boolean),
    };
    const requestBody = new FormData();
    requestBody.append('vehicle', JSON.stringify(payload));
    adminImageFiles.forEach((image) => requestBody.append('images', image));

    setAdminBusy(true);
    try {
      const editing = editingVehicle;
      const response = await requestJson(
        editing ? `/api/vehicles/${encodeURIComponent(editing.id)}` : '/api/vehicles',
        { method: editing ? 'PUT' : 'POST', body: requestBody },
      );
      if (editing) {
        setVehicles((current) => current.map((vehicle) => vehicle.id === editing.id ? response.vehicle : vehicle));
        setAdminMessage('Auto aggiornata correttamente.');
      } else {
        setVehicles((current) => [response.vehicle, ...current]);
        setAdminMessage('Nuova auto aggiunta all’inventario.');
      }
      setEditingVehicle(null);
      setAdminVehiclePrice('');
      setAdminVehicleType('buy');
      setAdminVehicleVatMode('inclusive');
      setAdminImageFiles([]);
      setAdminImagePreviews([]);
      setMainImageIndex(-1);
      setAdminVehicleFormSubmitted(false);
      form.reset();
    } catch (error) {
      setAdminError(error.message);
    } finally {
      setAdminBusy(false);
    }
  }

  function editAdminVehicle(vehicle) {
    setEditingVehicle(vehicle);
    setAdminVehiclePrice(String(vehicle.price));
    setAdminVehicleType(vehicle.type || 'buy');
    setAdminVehicleVatMode(getVehicleVatMode(vehicle));
    setAdminVehicleFormSubmitted(false);
    setAdminImageFiles([]);
    setAdminImagePreviews([]);
    setMainImageIndex(Math.max(0, (vehicle.images || []).indexOf(vehicle.image)));
    setAdminError('');
    setAdminMessage('');
    window.requestAnimationFrame(() => {
      adminVehicleFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      adminVehicleFormRef.current?.querySelector('input[name="make"]')?.focus({ preventScroll: true });
    });
  }

  function addAdminImage(event) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = '';
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setAdminError('Carica un’immagine JPEG, PNG o WebP.');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setAdminError('Ogni immagine deve essere inferiore a 8 MB.');
      return;
    }
    const currentCount = existingAdminImages.length + adminImageFiles.length;
    if (currentCount >= 20) {
      setAdminError('Hai raggiunto il limite massimo di 20 foto per auto.');
      return;
    }
    setAdminError('');
    setAdminImageFiles((current) => [...current, file]);
    if (mainImageIndex < 0) setMainImageIndex(currentCount);
  }

  function removeAdminImage(fileIndex) {
    const imageIndex = existingAdminImages.length + fileIndex;
    setAdminImageFiles((current) => current.filter((_, index) => index !== fileIndex));
    if (mainImageIndex === imageIndex) {
      setMainImageIndex(existingAdminImages.length || adminImageFiles.length > 1 ? 0 : -1);
    } else if (mainImageIndex > imageIndex) {
      setMainImageIndex((current) => current - 1);
    }
  }

  async function deleteAdminVehicle(vehicle) {
    openConfirmDialog({
      title: 'Rimuovere l’auto dall’inventario?',
      message: `${vehicle.make} ${vehicle.model} non sarà più visibile sul sito.`,
      confirmLabel: 'Rimuovi auto',
      onConfirm: async () => {
        setAdminError('');
        setAdminMessage('');
        setAdminBusy(true);
        try {
          await requestJson(`/api/vehicles/${encodeURIComponent(vehicle.id)}`, { method: 'DELETE' });
          setVehicles((current) => current.filter((entry) => entry.id !== vehicle.id));
          setCart((current) => current.filter((id) => id !== vehicle.id));
          if (editingVehicle?.id === vehicle.id) setEditingVehicle(null);
          setAdminMessage(`${vehicle.make} ${vehicle.model} è stata rimossa.`);
          return true;
        } catch (error) {
          setAdminError(error.message);
          return false;
        } finally {
          setAdminBusy(false);
        }
      },
    });
  }

  function openConfirmDialog({ title, message, confirmLabel, onConfirm }) {
    setConfirmDialog({ title, message, confirmLabel, onConfirm });
    setConfirmDialogError('');
  }

  async function runConfirmDialog() {
    if (!confirmDialog?.onConfirm) return;
    setConfirmDialogBusy(true);
    try {
      if (await confirmDialog.onConfirm()) setConfirmDialog(null);
      else setConfirmDialogError('Non è stato possibile completare l’azione. Controlla il messaggio nella pagina e riprova.');
    } finally {
      setConfirmDialogBusy(false);
    }
  }

  function goToInventory(type) {
    resetFilters();
    setFilter(type);
    closeMenu(false);
    navigateToPath('/catalogo');
  }

  function goToMake(make) {
    resetFilters();
    const matchingMake = vehicles.find((vehicle) => normalizeVehicleMake(vehicle.make) === normalizeVehicleMake(make))?.make;
    setMakeFilter(matchingMake || make);
    closeMenu(false);
    navigateToPath('/catalogo');
  }

  function addToCart(vehicle) {
    if (!user || !authReady) {
      setAuthError('Accedi o crea un account per salvare le auto nella tua selezione.');
      setAuthMode('login');
      return;
    }

    setCart((currentCart) => (
      currentCart.includes(vehicle.id) ? currentCart : [...currentCart, vehicle.id]
    ));
  }

  async function submitPurchaseRequest(vehicle) {
    if (user?.role !== 'user') {
      setAuthError('');
      setAuthMode('login');
      return;
    }
    if (vehicle.type !== 'buy') return;
    if (purchaseRequestPhone.trim().length < 6) {
      setPurchaseRequestStatus({
        vehicleId: vehicle.id,
        error: 'Inserisci un numero di telefono valido per poter inviare la richiesta.',
        message: '',
      });
      return;
    }
    setPurchaseRequestStatus({ vehicleId: vehicle.id, error: '', message: '' });
    setPurchaseRequestBusy(vehicle.id);
    try {
      const { request, message } = await requestJson('/api/purchase-requests', {
        method: 'POST',
        body: JSON.stringify({ vehicleId: vehicle.id, phone: purchaseRequestPhone }),
      });
      setMyPurchaseRequests((current) => [request, ...current.filter((item) => item.id !== request.id)]);
      setPurchaseRequestStatus({ vehicleId: vehicle.id, error: '', message });
    } catch (error) {
      setPurchaseRequestStatus({ vehicleId: vehicle.id, error: error.message, message: '' });
    } finally {
      setPurchaseRequestBusy('');
    }
  }

  async function submitRentalRequest(event, vehicle) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    setRentalRequestStatus({ vehicleId: vehicle.id, error: '', message: '' });
    setRentalRequestBusy(vehicle.id);
    try {
      const { message } = await requestJson('/api/rental-requests', {
        method: 'POST',
        body: JSON.stringify({
          vehicleId: vehicle.id,
          name: formData.get('name'),
          email: formData.get('email'),
          phone: formData.get('phone'),
          startDate: formData.get('startDate'),
          endDate: formData.get('endDate'),
          message: formData.get('message'),
        }),
      });
      setRentalRequestStatus({ vehicleId: vehicle.id, error: '', message });
      form.reset();
      setRentalDates({ startDate: '', endDate: '' });
    } catch (error) {
      setRentalRequestStatus({ vehicleId: vehicle.id, error: error.message, message: '' });
    } finally {
      setRentalRequestBusy('');
    }
  }

  function deletePurchaseRequest(request) {
    openConfirmDialog({
      title: 'Rimuovere la richiesta d’acquisto?',
      message: `La richiesta per ${request.vehicle.make} ${request.vehicle.model} verrà rimossa dal tuo account e non sarà più visibile al concessionario. Potrai inviarla di nuovo dalla pagina dell’auto.`,
      confirmLabel: 'Rimuovi richiesta',
      onConfirm: async () => {
        setPurchaseRequestDeleteError({ requestId: request.id, error: '' });
        try {
          await requestJson(`/api/purchase-requests/${encodeURIComponent(request.id)}`, { method: 'DELETE' });
          setMyPurchaseRequests((current) => current.filter((item) => item.id !== request.id));
          return true;
        } catch (error) {
          setPurchaseRequestDeleteError({ requestId: request.id, error: error.message });
          return false;
        }
      },
    });
  }

  function openCart() {
    if (!user || !authReady) {
      setAuthError('Accedi o crea un account per visualizzare la tua selezione.');
      setAuthMode('login');
      return;
    }
    setCartOpen(true);
  }

  function removeFromCart(vehicleId) {
    setCart((currentCart) => currentCart.filter((id) => id !== vehicleId));
  }

  function clearCart() {
    setCart([]);
    setCartOpen(false);
    try {
      window.localStorage.removeItem('pelusogroup-selezione');
    } catch (error) {
      console.error('Impossibile cancellare la selezione auto salvata:', error);
    }
  }

  function startCartInquiry() {
    const details = selectedVehicles
      .map((vehicle) => `• ${vehicle.year} ${vehicle.make} ${vehicle.model} (${euro.format(vehicle.price)}${vehicle.type === 'rent' ? ' al giorno' : ` · ${getVehicleVatLabel(vehicle)}`})`)
      .join('\n');
    setContactMessage(`Buongiorno, vorrei ricevere informazioni su queste auto:\n${details}`);
    closeCart();
    navigateToHome('contact');
    window.setTimeout(() => document.querySelector('#contact-message')?.focus({ preventScroll: true }), 100);
  }

  function addSellFormImages(event) {
    const files = Array.from(event.currentTarget.files || []);
    event.currentTarget.value = '';
    const remaining = Math.max(0, 20 - sellFormImages.length);
    const accepted = [];
    let validationError = '';
    for (const file of files) {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        validationError = 'Carica solo immagini JPEG, PNG o WebP.';
        continue;
      }
      if (file.size > 8 * 1024 * 1024) {
        validationError = 'Ogni immagine deve essere inferiore a 8 MB.';
        continue;
      }
      if (accepted.length < remaining) accepted.push(file);
      else validationError = 'Puoi aggiungere al massimo 20 foto.';
    }
    if (!files.length) return;
    setSellFormError(validationError);
    setSellFormImages((current) => [...current, ...accepted]);
  }

  function removeSellFormImage(index) {
    setSellFormImages((current) => current.filter((_, fileIndex) => fileIndex !== index));
  }

  async function handleSellFormSubmit(event) {
    event.preventDefault();
    setSellFormError('');
    setSellFormMessage('');
    if (user?.role !== 'user') {
      setSellFormError('Accedi al tuo account per inviare la proposta e seguirne gli aggiornamenti.');
      setAuthError('');
      setAuthMode('login');
      return;
    }
    if (!sellFormImages.length) {
      setSellFormError('Aggiungi almeno una foto della tua auto.');
      return;
    }
    const form = event.currentTarget;
    const requestBody = new FormData(form);
    sellFormImages.forEach((file) => requestBody.append('images', file));
    setSellFormBusy(true);
    try {
      const response = await requestJson('/api/sell-submissions', { method: 'POST', body: requestBody });
      setSellFormMessage(response.message);
      setSellFormImages([]);
      setSellFormKey((key) => key + 1);
      try {
        const { submissions } = await requestJson('/api/sell-submissions/mine');
        if (!Array.isArray(submissions)) throw new Error('Il server ha restituito un elenco non valido.');
        setMySellSubmissions(submissions);
        setMySellSubmissionError('');
      } catch (error) {
        setMySellSubmissionError(error.message);
      }
    } catch (error) {
      setSellFormError(error.message);
    } finally {
      setSellFormBusy(false);
    }
  }

  async function updateSellSubmissionResponse(event, submission) {
    event.preventDefault();
    setSellSubmissionError('');
    setSubmissionResponseStatus({ submissionId: submission.id, error: '', message: '' });
    const form = event.currentTarget;
    const formData = new FormData(form);
    const status = String(formData.get('status') || '');
    const message = String(formData.get('message') || '').trim();
    if (status === 'message') {
      await sendSubmissionMessage(event, submission, 'admin');
      return;
    }
    const responsePrice = ['countered', 'accepted'].includes(status) ? Number(formData.get('responsePrice')) : null;
    if ((status === 'countered' || status === 'accepted')
        && (!Number.isFinite(responsePrice) || responsePrice <= 0 || responsePrice > 100000000
          || (status === 'countered' && !message))) {
      setSubmissionResponseStatus({
        submissionId: submission.id,
        error: status === 'accepted'
          ? 'Inserisci il prezzo concordato prima di accettare la proposta.'
          : 'Per inviare una controfferta, inserisci un importo valido e un messaggio per il cliente.',
        message: '',
      });
      return;
    }
    setSubmissionActionBusy(submission.id);
    try {
      const result = await requestJson(`/api/sell-submissions/${encodeURIComponent(submission.id)}/response`, {
        method: 'PATCH',
        body: JSON.stringify({
          status,
          counterPrice: status === 'countered' ? responsePrice : null,
          acceptedPrice: status === 'accepted' ? responsePrice : null,
          message,
        }),
      });
      setSellSubmissions((current) => current.map((item) => item.id === submission.id ? {
        ...item,
        status: result.status,
        counterPrice: result.counterPrice,
        acceptedPrice: result.acceptedPrice,
        messages: status === 'accepted' ? [] : result.responseMessage ? [...(item.messages || []), result.responseMessage] : item.messages || [],
        updatedAt: new Date().toISOString(),
      } : item));
      setSubmissionResponseStatus({ submissionId: submission.id, error: '', message: 'Aggiornamento inviato al cliente.' });
    } catch (error) {
      setSubmissionResponseStatus({ submissionId: submission.id, error: error.message, message: '' });
    } finally {
      setSubmissionActionBusy('');
    }
  }

  async function sendSubmissionMessage(event, submission, audience) {
    event.preventDefault();
    const form = event.currentTarget;
    const messageData = new FormData(form);
    const text = String(messageData.get('text') || messageData.get('message') || '').trim();
    setSubmissionMessageStatus({ submissionId: submission.id, error: '', message: '' });
    setSubmissionActionBusy(submission.id);
    try {
      const { message } = await requestJson(`/api/sell-submissions/${encodeURIComponent(submission.id)}/messages`, {
        method: 'POST',
        body: JSON.stringify({ text }),
      });
      const update = (current) => current.map((item) => item.id === submission.id
        ? { ...item, messages: [...(item.messages || []), message], updatedAt: message.createdAt }
        : item);
      if (audience === 'admin') setSellSubmissions(update);
      else setMySellSubmissions(update);
      const messageField = form.elements.message || form.elements.text;
      if (messageField) messageField.value = '';
      setSubmissionMessageStatus({ submissionId: submission.id, error: '', message: 'Messaggio inviato.' });
    } catch (error) {
      setSubmissionMessageStatus({ submissionId: submission.id, error: error.message, message: '' });
    } finally {
      setSubmissionActionBusy('');
    }
  }

  async function deleteSellSubmission(submission) {
    openConfirmDialog({
      title: 'Rimuovere la proposta?',
      message: `La proposta per ${submission.make} ${submission.model} e i relativi messaggi verranno eliminati.`,
      confirmLabel: 'Rimuovi proposta',
      onConfirm: async () => {
        setSellSubmissionError('');
        try {
          await requestJson(`/api/sell-submissions/${encodeURIComponent(submission.id)}`, { method: 'DELETE' });
          setSellSubmissions((current) => current.filter((item) => item.id !== submission.id));
          return true;
        } catch (error) {
          setSellSubmissionError(error.message);
          return false;
        }
      },
    });
  }

  function confirmVehicleSold(vehicle) {
    setSaleAdminError('');
    setSaleAdminMessage('');
    const finalPrice = Number(soldFinalPrice);
    if (!Number.isFinite(finalPrice) || finalPrice <= 0 || finalPrice > 100000000) {
      setSaleAdminError('Inserisci un prezzo finale di vendita valido.');
      return;
    }
    const buyer = adminPurchaseRequests
      .find((request) => request.vehicle.id === vehicle.id && request.customer?.id === soldBuyerId)
      ?.customer;
    if (!buyer) {
      setSaleAdminError('Seleziona un cliente che ha richiesto l’acquisto di quest’auto.');
      return;
    }

    openConfirmDialog({
      title: 'Confermare la vendita?',
      message: `Stai per segnare come venduta la ${vehicle.make} ${vehicle.model} (${vehicle.year}) a ${buyer.name} (${buyer.email}) per ${euro.format(finalPrice)}. L’auto verrà rimossa dall’inventario e la vendita sarà registrata nello storico.`,
      confirmLabel: 'Conferma vendita',
      onConfirm: async () => {
        setSaleAdminError('');
        setSaleAdminMessage('');
        setAdminBusy(true);
        try {
          const { sale } = await requestJson('/api/sales', {
            method: 'POST',
            body: JSON.stringify({ vehicleId: vehicle.id, buyerId: soldBuyerId, finalPrice }),
          });
          setVehicles((current) => current.filter((entry) => entry.id !== vehicle.id));
          setCart((current) => current.filter((id) => id !== vehicle.id));
          setAdminPurchaseRequests((current) => current.filter((request) => request.vehicle.id !== vehicle.id));
          setSales((current) => [sale, ...current]);
          setAdminSales((current) => [sale, ...current]);
          setSaleAdminMessage(`${vehicle.make} ${vehicle.model} segnata come venduta a ${sale.buyer.name}.`);
          setMarkingSoldVehicleId('');
          setSoldBuyerId('');
          setSoldFinalPrice('');
          if (editingVehicle?.id === vehicle.id) {
            setEditingVehicle(null);
            setAdminImageFiles([]);
            setMainImageIndex(-1);
          }
          return true;
        } catch (error) {
          setSaleAdminError(error.message);
          return false;
        } finally {
          setAdminBusy(false);
        }
      },
    });
  }

  async function acceptPurchaseRequest(request) {
    setPurchaseRequestActionBusy(request.id);
    setPurchaseRequestActionStatus({ requestId: request.id, error: '' });
    try {
      const { request: acceptedRequest } = await requestJson(
        `/api/purchase-requests/${encodeURIComponent(request.id)}/accept`,
        { method: 'PATCH' },
      );
      if (!acceptedRequest || acceptedRequest.id !== request.id || acceptedRequest.status !== 'accepted') {
        throw new Error('Il server non ha confermato l’accettazione della richiesta.');
      }
      setAdminPurchaseRequests((current) => current.map((item) => (
        item.id === request.id ? acceptedRequest : item
      )));
      setPurchaseRequestActionStatus({ requestId: request.id, error: '' });
    } catch (error) {
      setPurchaseRequestActionStatus({ requestId: request.id, error: error.message });
    } finally {
      setPurchaseRequestActionBusy('');
    }
  }

  async function updateRentalRequestStatus(request, status) {
    setRentalRequestActionBusy(request.id);
    setRentalRequestActionStatus({ requestId: request.id, error: '', message: '' });
    try {
      const { request: updatedRequest } = await requestJson(
        `/api/rental-requests/${encodeURIComponent(request.id)}/status`,
        { method: 'PATCH', body: JSON.stringify({ status }) },
      );
      if (!updatedRequest || updatedRequest.id !== request.id || updatedRequest.status !== status) {
        throw new Error('Il server non ha confermato l’aggiornamento della richiesta.');
      }
      setAdminRentalRequests((current) => current.map((item) => (
        item.id === request.id ? { ...item, ...updatedRequest } : item
      )));
      setRentalRequestActionStatus({ requestId: request.id, error: '', message: 'Stato aggiornato.' });
    } catch (error) {
      setRentalRequestActionStatus({ requestId: request.id, error: error.message, message: '' });
    } finally {
      setRentalRequestActionBusy('');
    }
  }

  async function handleCustomerReviewSubmit(event, purchase) {
    event.preventDefault();
    setReviewStatus({ saleId: purchase.id, error: '', message: '' });
    const form = event.currentTarget;
    const formData = new FormData(form);
    setReviewBusy(true);
    try {
      const { review } = await requestJson(`/api/sales/${encodeURIComponent(purchase.id)}/review`, {
        method: 'POST',
        body: JSON.stringify({
          rating: Number(formData.get('rating')),
          text: formData.get('text'),
          publishName: formData.get('publishName') === 'on',
        }),
      });
      setMyPurchases((current) => current.map((item) => item.id === purchase.id ? { ...item, review } : item));
      setCustomerReviews((current) => [{
        id: purchase.id,
        make: purchase.make,
        model: purchase.model,
        year: purchase.year,
        ...review,
      }, ...current]);
      setReviewStatus({ saleId: purchase.id, error: '', message: 'Grazie! La tua recensione è stata pubblicata.' });
      form.reset();
    } catch (error) {
      setReviewStatus({ saleId: purchase.id, error: error.message, message: '' });
    } finally {
      setReviewBusy(false);
    }
  }

  function resetFilters() {
    setFilter('all');
    setMakeFilter('all');
    setBodyTypeFilter('all');
    setYearFilter('all');
    setMaxKm('');
    setMaxPrice('');
    setSearch('');
    setSortBy('recommended');
  }

  function scrollCarousel(trackRef, direction) {
    const track = trackRef.current;
    const firstCard = track?.firstElementChild;
    if (!track || !firstCard) return;
    const gap = Number.parseFloat(window.getComputedStyle(track).columnGap) || 0;
    track.scrollBy({
      left: direction * (firstCard.getBoundingClientRect().width + gap),
      behavior: 'smooth',
    });
  }

  function updateCarouselFocus(trackRef, setFocusedIndex) {
    const track = trackRef.current;
    if (!track) return;
    const trackCenter = track.getBoundingClientRect().left + track.clientWidth / 2;
    let closestIndex = 0;
    let closestDistance = Number.POSITIVE_INFINITY;
    Array.from(track.children).forEach((card, index) => {
      const cardCenter = card.getBoundingClientRect().left + card.getBoundingClientRect().width / 2;
      const distance = Math.abs(trackCenter - cardCenter);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });
    setFocusedIndex((current) => current === closestIndex ? current : closestIndex);
  }

  async function handleAuthSubmit(event) {
    event.preventDefault();
    setAuthBusy(true);
    setAuthError('');
    setLogoutNotice('');
    const form = event.currentTarget;
    const formData = new FormData(form);
    const requestId = ++authRequestIdRef.current;

    if (authMode === 'admin-pin') {
      try {
        const { user: verifiedUser } = await requestJson('/api/users/admin-pin', {
          method: 'POST',
          body: JSON.stringify({ pin: formData.get('pin') }),
        });
        if (authRequestIdRef.current !== requestId) return;
        setUser(verifiedUser);
        setNewlyRegisteredUser(false);
        setAdminPinRequired(false);
        setAuthMode('');
        setAuthReady(true);
        navigateAfterAuthentication(verifiedUser);
      } catch (error) {
        if (authRequestIdRef.current === requestId) {
          form.reset();
          setAuthError(error.message);
        }
      } finally {
        setAuthBusy(false);
      }
      return;
    }

    const payload = authMode === 'signup'
      ? { email: formData.get('email'), name: formData.get('name'), password: formData.get('password') }
      : { identifier: formData.get('email'), password: formData.get('password') };

    try {
      const { user: signedInUser, requiresAdminPin } = await requestJson(`/api/users/${authMode}`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      if (authRequestIdRef.current !== requestId) return;
      if (requiresAdminPin) {
        setAdminPinRequired(true);
        setAuthMode('admin-pin');
        setPasswordVisible(false);
        setAuthError('');
        return;
      }
      setUser(signedInUser);
      setNewlyRegisteredUser(authMode === 'signup');
      setAuthMode('');
      setAuthReady(true);
      setPasswordVisible(false);
      navigateAfterAuthentication(signedInUser);
    } catch (error) {
      if (authRequestIdRef.current === requestId) setAuthError(error.message);
    } finally {
      setAuthBusy(false);
      setAuthReady(true);
    }
  }

  async function handleLogout() {
    authRequestIdRef.current += 1;
    setUser(null);
    setNewlyRegisteredUser(false);
    setAdminPinRequired(false);
    setAuthMode('');
    setAuthError('');
    setPasswordVisible(false);
    setLogoutNotice('');
    clearCart();
    navigateToPath('/', true);
    try {
      await requestJson('/api/users/logout', { method: 'POST' });
    } catch (error) {
      setLogoutNotice(`Disconnessione locale completata, ma il server non ha confermato la revoca della sessione: ${error.message}`);
    }
  }

  async function handleContactSubmit(event) {
    event.preventDefault();
    setContactStatus('');
    setContactError('');
    const form = event.currentTarget;
    const formData = new FormData(form);
    const name = String(formData.get('name') || '').trim();
    const email = String(formData.get('email') || '').trim();
    const message = String(formData.get('message') || '').trim();
    if (name.length < 2 || name.length > 80) {
      setContactError('Il nome deve contenere da 2 a 80 caratteri.');
      form.elements.name.focus();
      return;
    }
    if (!isValidEmail(email)) {
      setEmailError('Inserisci un indirizzo email valido, ad esempio nome@dominio.it.');
      form.elements.email.focus();
      return;
    }
    if (message.length < 10 || message.length > 3000) {
      setContactError('Il messaggio deve contenere da 10 a 3000 caratteri.');
      form.elements.message.focus();
      return;
    }
    setEmailError('');
    setContactBusy(true);

    try {
      const result = await requestJson('/api/contact', {
        method: 'POST',
        body: JSON.stringify({
          name,
          email,
          message,
        }),
      });
      setContactStatus(result.message);
      setContactMessage('');
      setContactEmail('');
      setEmailError('');
      setContactError('');
      form.reset();
      setContactFormKey((key) => key + 1);
    } catch (error) {
      setContactError(error.message);
    } finally {
      setContactBusy(false);
    }
  }

  function startInquiry(vehicle, intent = vehicle.type) {
    const request = intent === 'rent' ? 'noleggiare' : 'acquistare';
    setContactMessage(`Buongiorno, sono interessato/a a ${request} la ${vehicle.year} ${vehicle.make} ${vehicle.model}. Vorrei ricevere maggiori informazioni e conferma della disponibilità.`);
    navigateToPath('/contatti');
    window.setTimeout(() => document.querySelector('#contact-message')?.focus({ preventScroll: true }), 100);
  }

  function closeAuth() {
    if (adminPinRequired) return;
    setAuthMode('');
    setAuthError('');
    setPasswordVisible(false);
  }

  const sellPageContent = (
    <>
      <section className="vehicle-sale-process section-wrap" aria-labelledby="vehicle-sale-process-title">
        <div className="vehicle-sale-process-heading">
          <p className="eyebrow">VUOI VENDERE LA TUA AUTO?</p>
          <h1 id="vehicle-sale-process-title">Tre passi,<br /><em>senza complicazioni.</em></h1>
          <p>Proponi la tua auto: al ritiro, se concordato, pensiamo noi.</p>
        </div>
        <ol className="vehicle-sale-steps">
          <li className="vehicle-sale-step">
            <span className="vehicle-sale-step-number">01</span>
            <div><h3>Proponi</h3><p>Inviaci i dati e le foto dell’auto.</p></div>
            <span className="vehicle-sale-connector" aria-hidden="true">→</span>
          </li>
          <li className="vehicle-sale-step">
            <span className="vehicle-sale-step-number">02</span>
            <div><h3>Valutiamo</h3><p>La esaminiamo e ti ricontattiamo.</p></div>
            <span className="vehicle-sale-connector" aria-hidden="true">→</span>
          </li>
          <li className="vehicle-sale-step">
            <span className="vehicle-sale-step-number">03</span>
            <div><h3>La ritiriamo</h3><p>Se troviamo l’accordo, concordiamo il ritiro.</p></div>
          </li>
        </ol>
        <div className="vehicle-sale-process-footer">
          <p><SiteIcon name="info" /> Possiamo concordare il ritiro dell’auto che vendi o la consegna di quella acquistata: zona, tempi, disponibilità ed eventuali costi dipendono dal veicolo.</p>
          <button type="button" onClick={() => goToInventory('buy')}>Scopri le auto in vendita <span aria-hidden="true">↗</span></button>
        </div>
      </section>
      <section className="sell-section section-wrap" id="sell">
        <div className="sell-section-heading">
          <p className="eyebrow">ACQUISTIAMO AUTO USATE</p>
          <h2>Valutiamo la tua auto<br />con la <em>giusta attenzione.</em></h2>
          <p>Compila i dati e aggiungi le foto per richiedere una valutazione. La proposta resta riservata al concessionario, che ti ricontatterà per discuterne.</p>
        </div>
        <form className="sell-form" id="sell-form" key={sellFormKey} onSubmit={handleSellFormSubmit}>
          <div className="sell-form-heading">
            <div>
              <span>LA TUA PROPOSTA</span>
              <h3>Parlaci della tua auto</h3>
              {user?.role === 'user' && <small>Richiesta collegata all’account {user.email}</small>}
            </div>
            <span className="sell-form-private">Visibile solo all’amministratore</span>
          </div>
          <p className="sell-required-note"><SiteIcon name="info" /><span><span className="required-marker" aria-hidden="true">*</span> Campi obbligatori · Prezzo desiderato facoltativo</span></p>
          <div className="sell-form-grid">
            <label><span className="sell-field-label">Nome e cognome <span className="required-marker" aria-hidden="true">*</span></span><input name="name" autoComplete="name" minLength="2" maxLength="80" placeholder="Mario Rossi" required /></label>
            <label><span className="sell-field-label">Email <span className="required-marker" aria-hidden="true">*</span></span><input name="email" type="email" autoComplete="email" maxLength="254" placeholder="nome@esempio.it" required /></label>
            <label><span className="sell-field-label">Telefono <span className="required-marker" aria-hidden="true">*</span></span><input name="phone" type="tel" autoComplete="tel" minLength="6" maxLength="30" placeholder="+39 ..." required /></label>
            <label><span className="sell-field-label">Marca <span className="required-marker" aria-hidden="true">*</span></span><input name="make" maxLength="60" placeholder="Es. Alfa Romeo" required /></label>
            <label><span className="sell-field-label">Modello <span className="required-marker" aria-hidden="true">*</span></span><input name="model" maxLength="100" placeholder="Es. Giulietta" required /></label>
            <label><span className="sell-field-label">Anno <span className="required-marker" aria-hidden="true">*</span></span><input name="year" type="number" min="1950" max={new Date().getFullYear() + 1} placeholder="2020" required /></label>
            <label><span className="sell-field-label">Chilometraggio <span className="required-marker" aria-hidden="true">*</span></span><input name="mileageKm" type="number" min="0" max="3000000" placeholder="65000" required /></label>
            <label><span className="sell-field-label">Prezzo desiderato (€) <span className="optional-marker">Facoltativo</span></span><input name="price" type="number" min="1" max="100000000" step="1" placeholder="Es. 12.500" /></label>
          </div>
          <fieldset className="sell-vehicle-body-types">
            <legend>Tipo di veicolo <span className="required-marker" aria-hidden="true">*</span></legend>
            <VehicleBodyTypeOptions className="sell-body-type-options" />
          </fieldset>
          <label className="sell-form-description"><span className="sell-field-label">Condizioni e dettagli <span className="required-marker" aria-hidden="true">*</span></span><textarea name="description" rows="4" minLength="10" maxLength="2000" placeholder="Descrivi le condizioni, gli interventi recenti e ogni dettaglio utile..." required /></label>
          <div className="sell-upload">
            <div className="sell-upload-heading">
              <div>
                <strong>Foto dell’auto <span className="required-marker" aria-hidden="true">*</span></strong>
                <span>Carica da 1 a 20 immagini, massimo 8 MB ciascuna.</span>
              </div>
              <button className="button button-outline button-small" type="button" onClick={() => sellImageInputRef.current?.click()} disabled={sellFormImages.length >= 20}>
                <SiteIcon name="image" /> Aggiungi foto ({sellFormImages.length}/20)
              </button>
            </div>
            <input ref={sellImageInputRef} className="visually-hidden" type="file" accept="image/jpeg,image/png,image/webp" multiple aria-label="Seleziona le foto dell’auto" onChange={addSellFormImages} />
            {sellFormImages.length > 0 ? (
              <div className="sell-photo-grid">
                {sellFormPreviews.map((preview, index) => (
                  <div className="sell-photo-preview" key={`${sellFormImages[index].name}-${index}`}>
                    <ProgressiveImage className="sell-photo-preview-image" src={preview} alt={`Anteprima foto ${index + 1}: ${sellFormImages[index].name}`} loading="eager" />
                    <button type="button" aria-label={`Rimuovi foto ${index + 1}`} onClick={() => removeSellFormImage(index)}>×</button>
                  </div>
                ))}
              </div>
            ) : (
              <button className="sell-upload-drop" type="button" onClick={() => sellImageInputRef.current?.click()}>
                <SiteIcon name="image" />
                <strong>Aggiungi le foto della tua auto</strong>
                <small>JPG, PNG o WebP · puoi selezionarne più di una</small>
              </button>
            )}
          </div>
          {sellFormError && <p className="form-error" role="alert">{sellFormError}</p>}
          {sellFormMessage && <p className="form-success" role="status">{sellFormMessage}</p>}
          {!user && <p className="sell-account-note">Accedi al tuo account prima di inviare la proposta: potrai seguire lo stato e parlare con il concessionario dalla tua area personale.</p>}
          <div className="sell-form-submit">
            <p>Inviando la proposta, i tuoi dati saranno usati per ricontattarti in merito alla vendita.</p>
            <button className="button button-accent" type="submit" disabled={sellFormBusy}>
              {sellFormBusy ? 'Invio in corso…' : 'Invia la proposta'} <span aria-hidden="true">↗</span>
            </button>
          </div>
        </form>
      </section>
    </>
  );

  const contactPageContent = (
    <>
      {user?.role !== 'admin' && <section className="contact-section section-wrap contact-page-section" id="contact">
        <div className="contact-copy">
          <p className="eyebrow">PARLIAMO DI AUTO</p>
          <h1>La tua prossima auto<br />inizia con un <em>ciao.</em></h1>
          <p>Hai una domanda, vuoi vendere la tua auto o cerchi un modello in particolare? Scrivici.</p>
          <div className="contact-detail">
            <span className="contact-detail-icon"><SiteIcon name="pin" /></span>
            <div>
              <small>VIENI A TROVARCI</small>
              <a href="https://maps.google.com/?q=Via+delle+Monache+17,+81030+Cellole+CE" target="_blank" rel="noreferrer">Via delle Monache, 17, 81030 Cellole CE</a>
            </div>
          </div>
          <div className="contact-detail">
            <span className="contact-detail-icon"><SiteIcon name="mail" /></span>
            <div>
              <small>SCRIVICI</small>
              <a href="mailto:luigi_peluso26@proton.me">luigi_peluso26@proton.me</a>
            </div>
          </div>
        </div>
        <form className="contact-form" key={contactFormKey} onSubmit={handleContactSubmit} noValidate>
          <label>
            Nome e cognome
            <input name="name" type="text" autoComplete="name" placeholder="Come ti chiami?" minLength="2" maxLength="80" required />
          </label>
          <label>
            Indirizzo email
            <input
              name="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              placeholder="nome@esempio.it"
              maxLength="254"
              value={contactEmail}
              aria-invalid={Boolean(emailError)}
              aria-describedby={emailError ? 'contact-email-error' : undefined}
              onChange={(event) => {
                const value = event.target.value;
                setContactEmail(value);
                setEmailError(value && !isValidEmail(value)
                  ? 'Inserisci un indirizzo email valido, ad esempio nome@dominio.it.'
                  : '');
              }}
              onBlur={() => {
                if (contactEmail && !isValidEmail(contactEmail)) setEmailError('Inserisci un indirizzo email valido, ad esempio nome@dominio.it.');
              }}
              required
            />
            {emailError && <span className="form-error" id="contact-email-error" role="alert">{emailError}</span>}
          </label>
          <label>
            Come possiamo aiutarti?
            <textarea
              id="contact-message"
              name="message"
              rows="4"
              placeholder="Sto cercando..."
              minLength="10"
              maxLength="3000"
              value={contactMessage}
              onChange={(event) => setContactMessage(event.target.value)}
              required
            />
          </label>
          {contactStatus && <p className="form-success" role="status">{contactStatus}</p>}
          {contactError && <p className="form-error" role="alert">{contactError}</p>}
          <button className="button button-accent form-submit" type="submit" disabled={contactBusy}>
            {contactBusy ? 'Invio in corso…' : 'Invia il messaggio'} <span aria-hidden="true">↗</span>
          </button>
          <p className="form-note">Useremo i tuoi dati solo per ricontattarti.</p>
        </form>
      </section>}
      <section className="location-section section-wrap" aria-labelledby="location-title">
        <div className="location-heading">
          <div>
            <p className="eyebrow">DOVE SIAMO</p>
            <h2 id="location-title">Ti aspettiamo a <em>Cellole.</em></h2>
          </div>
          <a className="text-link" href="https://maps.google.com/?q=Via+delle+Monache+17,+81030+Cellole+CE" target="_blank" rel="noreferrer">
            Apri in Google Maps <span aria-hidden="true">↗</span>
          </a>
        </div>
        <div className="location-map">
          {cookieConsent?.externalMedia ? (
            <iframe
              title="Mappa della sede PelusoGroup in Via delle Monache 17, Cellole"
              src="https://maps.google.com/maps?q=Via%20delle%20Monache%2017%2C%2081030%20Cellole%20CE&t=&z=16&ie=UTF8&iwloc=&output=embed"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          ) : (
            <div className="cookie-map-placeholder">
              <p>La mappa è fornita da Google Maps e viene caricata solo con il tuo consenso ai contenuti esterni.</p>
              <button
                type="button"
                onClick={() => saveCookieConsent({ analytics: cookieConsent?.analytics, externalMedia: true })}
              >
                Consenti Google Maps
              </button>
              {cookieConsentError && <p className="cookie-consent-error" role="alert">{cookieConsentError}</p>}
            </div>
          )}
        </div>
      </section>
    </>
  );

  return (
    <div className="site-shell" data-theme="public">
      {cookieConsent && !cookieSettingsOpen && (
        <button className="cookie-settings-trigger" type="button" onClick={openCookieSettings}>
          Preferenze cookie
        </button>
      )}
      {(!cookieConsent || cookieSettingsOpen) && (
        <section className="cookie-consent-banner" aria-labelledby="cookie-consent-title">
          <div className="cookie-consent-copy">
            <p className="eyebrow">LA TUA PRIVACY</p>
            <h2 id="cookie-consent-title">{cookieConsent ? 'Preferenze cookie' : 'Scegli come usare i cookie'}</h2>
            <p>
              I cookie e gli strumenti necessari mantengono attive le funzioni essenziali. Con il tuo consenso possiamo
              misurare la navigazione per le statistiche interne e caricare Google Maps.
            </p>
          </div>
          {cookieSettingsOpen && (
            <form
              className="cookie-preference-options"
              onSubmit={(event) => {
                event.preventDefault();
                saveCookieConsent({ analytics: cookieAnalyticsDraft, externalMedia: cookieExternalMediaDraft });
              }}
            >
              <label className="cookie-preference-option">
                <input type="checkbox" checked disabled />
                <span><strong>Necessari</strong><small>Sempre attivi: sicurezza e funzioni essenziali del sito.</small></span>
                <span className="cookie-preference-required">Sempre attivi</span>
              </label>
              <label className="cookie-preference-option">
                <input
                  type="checkbox"
                  checked={cookieAnalyticsDraft}
                  onChange={(event) => setCookieAnalyticsDraft(event.target.checked)}
                />
                <span><strong>Statistiche</strong><small>Misurazione delle pagine visitate e del tempo di navigazione per le statistiche interne.</small></span>
              </label>
              <label className="cookie-preference-option">
                <input
                  type="checkbox"
                  checked={cookieExternalMediaDraft}
                  onChange={(event) => setCookieExternalMediaDraft(event.target.checked)}
                />
                <span><strong>Contenuti esterni</strong><small>Consente il caricamento della mappa incorporata di Google Maps.</small></span>
              </label>
              {cookieConsentError && <p className="cookie-consent-error" role="alert">{cookieConsentError}</p>}
              <button className="cookie-consent-save" type="submit">Salva le preferenze</button>
            </form>
          )}
          <div className="cookie-consent-actions">
            {!cookieSettingsOpen && (
              <button className="cookie-consent-secondary" type="button" onClick={openCookieSettings}>Personalizza</button>
            )}
            <button
              className="cookie-consent-secondary"
              type="button"
              onClick={() => saveCookieConsent({ analytics: false, externalMedia: false })}
            >
              Solo necessari
            </button>
            <button
              className="cookie-consent-primary"
              type="button"
              onClick={() => saveCookieConsent({ analytics: true, externalMedia: true })}
            >
              Accetta tutti
            </button>
          </div>
          {!cookieConsent && cookieConsentError && <p className="cookie-consent-error" role="alert">{cookieConsentError}</p>}
        </section>
      )}
      {showMostViewedOverlay && (
        <div className="most-viewed-overlay">
          <button
            className="most-viewed-backdrop"
            type="button"
            aria-label="Chiudi le auto più visualizzate"
            onClick={() => setMostViewedOpen(false)}
          />
          <section
            className="most-viewed-dialog"
            ref={mostViewedDialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="most-viewed-eyebrow"
            aria-describedby="most-viewed-description"
          >
            <header className="most-viewed-heading">
              <div className="most-viewed-intro">
                <img className="most-viewed-trophy" src="/images/trophy-car.png" alt="" />
                <div className="most-viewed-copy">
                  <p className="eyebrow most-viewed-eyebrow" id="most-viewed-eyebrow">IL PODIO DELLE VISUALIZZAZIONI</p>
                  <p id="most-viewed-description">Le protagoniste del momento, scelte dalle visualizzazioni dei nostri visitatori.</p>
                </div>
              </div>
              <button
                className="most-viewed-close"
                ref={mostViewedCloseRef}
                type="button"
                aria-label="Chiudi e continua sul sito"
                onClick={() => setMostViewedOpen(false)}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>
              </button>
            </header>
            <div className="most-viewed-grid">
              {topViewedVehicles.map((vehicle) => (
                <article className="vehicle-card most-viewed-card" key={vehicle.id}>
                  <a
                    className="vehicle-detail-link"
                    href={`/auto/${vehicle.id}`}
                    aria-label={`Scopri ${vehicle.year} ${vehicle.make} ${vehicle.model}, ${kilometer.format(vehicle.viewCount || 0)} visualizzazioni`}
                    onClick={(event) => {
                      event.preventDefault();
                      setMostViewedOpen(false);
                      openVehicle(vehicle.id);
                    }}
                  >
                    <div className="vehicle-image-wrap">
                      <ProgressiveImage
                        src={vehicle.image}
                        alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                        className="vehicle-card-image"
                        loading="eager"
                        fetchPriority="high"
                      />
                      <span className="vehicle-type">{vehicle.type === 'rent' ? 'NOLEGGIO' : 'IN VENDITA'}</span>
                      <div className="vehicle-engagement" aria-label={`Statistiche ${vehicle.make} ${vehicle.model}`}>
                        <span><SiteIcon name="eye" /> {kilometer.format(vehicle.viewCount || 0)} visualizzazioni</span>
                      </div>
                    </div>
                  </a>
                  <div className="vehicle-info most-viewed-info">
                    <div className="most-viewed-title">
                      <div>
                        <p className="vehicle-make">{vehicle.make} · {vehicle.year} · {vehicle.color}</p>
                        <h3>
                          <a
                            href={`/auto/${vehicle.id}`}
                            onClick={(event) => {
                              event.preventDefault();
                              setMostViewedOpen(false);
                              openVehicle(vehicle.id);
                            }}
                          >
                            {vehicle.model}
                          </a>
                        </h3>
                      </div>
                    </div>
                    <div className="most-viewed-details">
                      <span>{kilometer.format(vehicle.mileageKm)} km</span>
                      <span>{vehicle.type === 'rent' ? 'Tariffa giornaliera' : 'Disponibile subito'}</span>
                    </div>
                    <div className="most-viewed-card-footer">
                      <span className="vehicle-price-value">
                        <strong>{euro.format(vehicle.price)}{vehicle.type === 'rent' ? ' / giorno' : ''}</strong>
                        {vehicle.type === 'buy' && <small className="vehicle-vat-note">{getVehicleVatLabel(vehicle)}</small>}
                      </span>
                      <button
                        className="most-viewed-view-button header-glossy-accent"
                        type="button"
                        onClick={() => {
                          setMostViewedOpen(false);
                          openVehicle(vehicle.id);
                        }}
                      >
                        Informazioni <span aria-hidden="true">↗</span>
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
            <footer className="most-viewed-footer">
              <span>Classifica basata sulle visualizzazioni registrate.</span>
              <button
                type="button"
                onClick={() => {
                  setMostViewedOpen(false);
                  navigateToPath('/catalogo');
                }}
              >
                Vai al catalogo <span aria-hidden="true">→</span>
              </button>
            </footer>
          </section>
        </div>
      )}
      {logoutNotice && (
        <div className="logout-notice" role="status">
          <span>{logoutNotice}</span>
          <button type="button" aria-label="Chiudi avviso" onClick={() => setLogoutNotice('')}>×</button>
        </div>
      )}
      <header className="site-header">
        <a
          className="brand brand-main"
          href="/"
          aria-label="PelusoGroup, pagina iniziale"
          onClick={(event) => { event.preventDefault(); navigateToHome(); }}
        >
          <img className="brand-logo" src="/images/logo.png" alt="PelusoGroup" />
        </a>
        {!activeVehicle && !isUnknownVehiclePage && !isAdminArea && !isAccountPage && (
          <nav className="header-nav" aria-label="Navigazione principale">
            <button type="button" onClick={() => goToInventory('all')}>Auto disponibili</button>
            <button type="button" onClick={() => navigateToSection('services')}>Servizi</button>
            <button type="button" onClick={() => navigateToSection('about')}>Chi siamo</button>
          </nav>
        )}
        <div className="header-actions">
          {user?.role === 'admin' ? (
            <button className="admin-header-link header-glossy-accent" type="button" onClick={() => navigateToPath('/admin')} aria-label="Apri l’area amministratore">
              <span className="admin-status-label">ADMIN</span>
              AREA AMMINISTRATORE <span aria-hidden="true">→</span>
            </button>
          ) : (
            <button ref={cartToggleRef} className={user ? 'cart-toggle' : 'cart-toggle is-login-required header-glossy-accent'} type="button" aria-label={user ? `Apri la selezione auto, ${cart.length} veicoli` : 'Accedi per aprire la selezione auto'} onClick={openCart}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 4h2l2.2 10.1a2 2 0 0 0 2 1.6h8.5a2 2 0 0 0 1.9-1.4L21 8H6" /><circle cx="10" cy="20" r="1.2" /><circle cx="18" cy="20" r="1.2" /></svg>
              <span className="cart-toggle-label">{user ? 'LA MIA SELEZIONE' : 'ACCEDI'}</span>
              <span className="cart-count">{user ? cart.length : 0}</span>
            </button>
          )}
          <span className="italian-flag" role="img" aria-label="Bandiera italiana"><i /><i /><i /></span>
          <button
            className="menu-toggle"
            ref={menuToggleRef}
            type="button"
            aria-label="Apri il menu di navigazione"
            aria-expanded={menuOpen}
            aria-controls="site-menu"
            onClick={() => setMenuOpen(true)}
          >
            <span className="menu-toggle-icon" aria-hidden="true"><i /><i /><i /></span>
            <span className="menu-toggle-label">MENU</span>
          </button>
        </div>
        {menuOpen && (
          <>
            <button className="menu-backdrop" type="button" aria-label="Chiudi il menu di navigazione" onClick={closeMenu} />
            <aside className="menu-drawer" id="site-menu" ref={menuDrawerRef} role="dialog" aria-modal="true" aria-labelledby="menu-title">
              <div className="drawer-topline">
                <a className="brand" href="/" onClick={(event) => { event.preventDefault(); closeMenu(); navigateToHome(); }}>
                  <img className="brand-logo" src="/images/logo.png" alt="PelusoGroup" />
                </a>
                <button className="drawer-close" ref={menuCloseRef} type="button" onClick={closeMenu} aria-label="Chiudi il menu">
                  <svg className="close-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>
                </button>
              </div>
              <div className="drawer-intro">
                <p className="eyebrow">IL TUO PROSSIMO VIAGGIO</p>
                <h2 id="menu-title">Da dove<br /><em>vuoi partire?</em></h2>
              </div>
              <nav className="drawer-links" aria-label="Scopri PelusoGroup">
                <p className="drawer-label">SCOPRI</p>
                <button type="button" onClick={() => goToInventory('all')}>
                  <span>01</span> Tutte le auto <span className="drawer-arrow" aria-hidden="true">↗</span>
                </button>
                <button type="button" onClick={() => goToInventory('buy')}>
                  <span>02</span> Auto in vendita <span className="drawer-arrow" aria-hidden="true">↗</span>
                </button>
                <button type="button" onClick={() => goToInventory('rent')}>
                  <span>03</span> Auto a noleggio <span className="drawer-arrow" aria-hidden="true">↗</span>
                </button>
                {user?.role !== 'admin' && <a href="/vendi-auto" onClick={(event) => { event.preventDefault(); closeMenu(false); navigateToPath('/vendi-auto'); }}><span>04</span> Vendi la tua auto <span className="drawer-arrow" aria-hidden="true">↗</span></a>}
                {user?.role === 'user' && (
                  <>
                    <a href="/account" onClick={(event) => { event.preventDefault(); closeMenu(false); navigateToPath('/account'); }}><span>05</span> Messaggi e acquisti <span className="drawer-arrow" aria-hidden="true">↗</span></a>
                  </>
                )}
                {user?.role === 'admin' && (
                  <>
                    <a href="/admin" onClick={(event) => { event.preventDefault(); closeMenu(false); navigateToPath('/admin'); }}><span>04</span> Gestione inventario <span className="drawer-arrow" aria-hidden="true">↗</span></a>
                    <a href="/admin/messages" onClick={(event) => { event.preventDefault(); closeMenu(false); navigateToPath('/admin/messages'); }}><span>05</span> Messaggi e vendite <span className="drawer-arrow" aria-hidden="true">↗</span></a>
                  </>
                )}
              </nav>
              <nav className="drawer-secondary" aria-label="Altre informazioni">
                <a href="/#services" onClick={(event) => { event.preventDefault(); closeMenu(false); navigateToHome('services'); }}>I nostri servizi</a>
                <a href="/#about" onClick={(event) => { event.preventDefault(); closeMenu(false); navigateToHome('about'); }}>Chi siamo</a>
                {user?.role !== 'admin' && <a href="/contatti" onClick={(event) => { event.preventDefault(); closeMenu(false); navigateToPath('/contatti'); }}>Contatta il team</a>}
                {user?.role !== 'admin' && <a href="mailto:luigi_peluso26@proton.me">Scrivici via email</a>}
              </nav>
              <div className="drawer-account">
                {user ? (
                  <>
                    <span className="user-greeting">Hai effettuato l’accesso come <strong>{user.name}</strong></span>
                    <button className="button button-outline button-small header-glossy-accent" type="button" onClick={() => { closeMenu(); handleLogout(); }}>
                      Esci
                    </button>
                  </>
                ) : (
                  <>
                    <button className="button button-outline" type="button" onClick={() => { closeMenu(); setAuthMode('login'); }}>
                      Accedi
                    </button>
                    <button className="button button-accent" type="button" onClick={() => { closeMenu(); setAuthMode('signup'); }}>
                      Crea un account <span aria-hidden="true">↗</span>
                    </button>
                  </>
                )}
              </div>
              <p className="drawer-footer">BELLE AUTO. PERSONE AUTENTICHE. NUOVI VIAGGI.</p>
            </aside>
          </>
        )}
      </header>

      {cartOpen && user?.role === 'user' && (
        <>
          <button className="cart-backdrop" type="button" aria-label="Chiudi la selezione auto" onClick={closeCart} />
          <aside ref={cartDrawerRef} className="cart-drawer" role="dialog" aria-modal="true" aria-labelledby="cart-title">
            <div className="cart-drawer-header">
              <div>
                <p className="eyebrow">LE AUTO CHE TI PIACCIONO</p>
                <h2 id="cart-title">La tua selezione <span>({selectedVehicles.length})</span></h2>
              </div>
              <button className="drawer-close" ref={cartCloseRef} type="button" onClick={closeCart} aria-label="Chiudi la selezione"><svg className="close-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg></button>
            </div>
            {selectedVehicles.length === 0 ? (
              <div className="cart-empty">
                <span aria-hidden="true">⌕</span>
                <h3>La tua selezione è vuota</h3>
                <p>Aggiungi le auto che ti interessano e inviaci una richiesta: ti aiuteremo a trovare quella giusta.</p>
                <button className="button button-accent" type="button" onClick={() => { closeCart(); goToInventory('all'); }}>
                  Vai all’inventario <span aria-hidden="true">→</span>
                </button>
              </div>
            ) : (
              <>
                <div className="cart-items">
                  {selectedVehicles.map((vehicle) => (
                    <article className="cart-item" key={vehicle.id}>
                      <a
                        className="cart-item-link"
                        href={`/auto/${vehicle.id}`}
                        onClick={(event) => { event.preventDefault(); closeCart(); openVehicle(vehicle.id); }}
                      >
                        <ProgressiveImage src={vehicle.image} alt="" className="cart-item-image" />
                        <div className="cart-item-info">
                          <small>{vehicle.make} · {vehicle.year}</small>
                          <h3>{vehicle.model}</h3>
                          <strong>{euro.format(vehicle.price)}{vehicle.type === 'rent' ? ' / giorno' : ''}</strong>
                          {vehicle.type === 'buy' && <small className="vehicle-vat-note">{getVehicleVatLabel(vehicle)}</small>}
                        </div>
                      </a>
                      <button className="cart-remove" type="button" aria-label={`Rimuovi ${vehicle.make} ${vehicle.model}`} onClick={() => removeFromCart(vehicle.id)}>×</button>
                    </article>
                  ))}
                </div>
                <div className="cart-actions">
                  <p>I prezzi e la disponibilità sono da confermare con il nostro team.</p>
                  <button className="button button-accent" type="button" onClick={startCartInquiry}>
                    Richiedi informazioni <span aria-hidden="true">↗</span>
                  </button>
                  <button className="clear-cart" type="button" onClick={clearCart}>Svuota selezione</button>
                </div>
              </>
            )}
          </aside>
        </>
      )}

      <main>
        {activeVehicle ? (
          <section className="vehicle-detail section-wrap" aria-labelledby="vehicle-detail-title">
            <button className="button button-outline detail-back header-glossy-accent" type="button" onClick={() => navigateToHome('inventory')}>
              <SiteIcon name="chevronLeft" /> Torna al catalogo
            </button>
            <div className="vehicle-detail-heading">
              <div>
                <p className="eyebrow vehicle-detail-status"><span />{activeVehicle.type === 'rent' ? 'DISPONIBILE A NOLEGGIO' : 'DISPONIBILE PER L’ACQUISTO'}</p>
                <h1 id="vehicle-detail-title">{activeVehicle.make} <em>{activeVehicle.model}</em></h1>
                <p className="vehicle-detail-subtitle">{activeVehicle.year} <span /> {activeVehicle.bodyType} <span /> {activeVehicle.color}</p>
                {activeVehicle.label && <span className="vehicle-detail-label">{activeVehicle.label}</span>}
              </div>
              <div className="vehicle-detail-price-block">
                <span>{activeVehicle.type === 'rent' ? 'TARIFFA GIORNALIERA' : 'PREZZO'}</span>
                <strong className="vehicle-detail-price">
                  {euro.format(activeVehicle.price)}{activeVehicle.type === 'rent' ? <small> / giorno</small> : ''}
                </strong>
                {activeVehicle.type === 'buy' && <small className="vehicle-detail-vat-note">{getVehicleVatLabel(activeVehicle)}</small>}
              </div>
            </div>
            <section className="vehicle-basic-info" aria-labelledby="vehicle-basic-info-title">
              <div className="vehicle-basic-info-heading">
                <h2 id="vehicle-basic-info-title"><SiteIcon name="info" /> Informazioni principali</h2>
                <p>Le informazioni principali per orientarti subito.</p>
              </div>
              <div className="vehicle-detail-highlights" aria-label="Informazioni principali">
              <div><SiteIcon name="calendar" /><span><small>ANNO</small><strong>{activeVehicle.year}</strong></span></div>
              <div><SiteIcon name="odometer" /><span><small>CHILOMETRAGGIO</small><strong>{kilometer.format(activeVehicle.mileageKm)} km</strong></span></div>
              <div><SiteIcon name="fuel" /><span><small>ALIMENTAZIONE</small><strong>{activeVehicle.fuel}</strong></span></div>
              <div><SiteIcon name="transmission" /><span><small>CAMBIO</small><strong>{activeVehicle.transmission}</strong></span></div>
              </div>
            </section>
            <div className="vehicle-detail-layout">
              <div>
                <div className="vehicle-detail-image">
                  <ProgressiveImage
                    key={`${activeVehicle.id}-${currentDetailImageIndex}`}
                    src={detailImages[currentDetailImageIndex]}
                    alt={`${activeVehicle.year} ${activeVehicle.make} ${activeVehicle.model} - foto ${currentDetailImageIndex + 1}`}
                    className="vehicle-detail-main-image"
                    loading="eager"
                    fetchPriority="high"
                  />
                  <span className="vehicle-type">{activeVehicle.type === 'rent' ? 'NOLEGGIO' : 'IN VENDITA'}</span>
                  {detailImages.length > 1 && (
                    <>
                      <button className="vehicle-gallery-arrow is-previous" type="button" aria-label="Mostra la foto precedente" onClick={() => setDetailImageIndex((currentDetailImageIndex - 1 + detailImages.length) % detailImages.length)}>
                        <SiteIcon name="chevronLeft" />
                      </button>
                      <button className="vehicle-gallery-arrow is-next" type="button" aria-label="Mostra la foto successiva" onClick={() => setDetailImageIndex((currentDetailImageIndex + 1) % detailImages.length)}>
                        <SiteIcon name="chevronRight" />
                      </button>
                      <span className="vehicle-gallery-count">{String(currentDetailImageIndex + 1).padStart(2, '0')} <i /> {String(detailImages.length).padStart(2, '0')}</span>
                    </>
                  )}
                  <div className="vehicle-engagement" aria-label={`Statistiche ${activeVehicle.make} ${activeVehicle.model}`}>
                    <span><SiteIcon name="eye" /> {kilometer.format(activeVehicle.viewCount || 0)} visualizzazioni</span>
                    {activeVehicle.type === 'buy' && (
                      <span><SiteIcon name="people" /> {kilometer.format(publicVehicleMetricsById.get(activeVehicle.id)?.purchaseRequests || 0)} richieste</span>
                    )}
                  </div>
                </div>
                {detailImages.length > 1 && (
                  <div className="vehicle-gallery" aria-label="Foto dell’auto">
                    {detailImages.map((image, index) => (
                      <button
                        key={`${image}-${index}`}
                        className={detailImageIndex === index ? 'vehicle-gallery-thumb is-active' : 'vehicle-gallery-thumb'}
                        type="button"
                        aria-label={`Mostra foto ${index + 1} di ${detailImages.length}`}
                        aria-pressed={detailImageIndex === index}
                        onClick={() => setDetailImageIndex(index)}
                      >
                        <ProgressiveImage src={image} alt="" className="vehicle-gallery-thumb-image" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <aside className="vehicle-contact-panel" aria-label="Richieste e contatti">
                <p className="eyebrow">TI INTERESSA QUESTA AUTO?</p>
                <h2>Parliamone <em>insieme.</em></h2>
                {activeVehicle.type === 'buy' ? (
                  <div className="purchase-request-form">
                    {myPurchaseRequests.some((request) => request.vehicle.id === activeVehicle.id) && <p className="form-success" role="status">Hai già inviato una richiesta per questa auto. Puoi seguirla in Messaggi e acquisti.</p>}
                    <label>Telefono per ricontattarti <span className="required-marker" aria-hidden="true">*</span>
                      <input type="tel" autoComplete="tel" minLength="6" maxLength="30" required value={purchaseRequestPhone} onChange={(event) => {
                        setPurchaseRequestPhone(event.target.value);
                        if (purchaseRequestStatus.vehicleId === activeVehicle.id && purchaseRequestStatus.error) {
                          setPurchaseRequestStatus({ vehicleId: activeVehicle.id, error: '', message: '' });
                        }
                      }} placeholder="Il tuo numero di telefono" aria-describedby="purchase-request-phone-hint" />
                    </label>
                    <small id="purchase-request-phone-hint" className="purchase-request-phone-hint">Obbligatorio per poter inviare la richiesta.</small>
                    <button className="button button-accent detail-primary-action" type="button" disabled={purchaseRequestBusy === activeVehicle.id || purchaseRequestPhone.trim().length < 6 || myPurchaseRequests.some((request) => request.vehicle.id === activeVehicle.id)} onClick={() => submitPurchaseRequest(activeVehicle)}>
                      {purchaseRequestBusy === activeVehicle.id ? 'Invio richiesta…' : myPurchaseRequests.some((request) => request.vehicle.id === activeVehicle.id) ? 'Richiesta inviata' : 'Richiedi acquisto'} <span aria-hidden="true">↗</span>
                    </button>
                    {purchaseRequestStatus.vehicleId === activeVehicle.id && purchaseRequestStatus.error && <p className="form-error" role="alert">{purchaseRequestStatus.error}</p>}
                    {purchaseRequestStatus.vehicleId === activeVehicle.id && purchaseRequestStatus.message && <div className="purchase-request-success" role="status"><span>{purchaseRequestStatus.message}</span><button type="button" className="purchase-request-view-requests" onClick={() => navigateToPath('/account')}>Vedi le tue richieste <span aria-hidden="true">↗</span></button></div>}
                  </div>
                ) : (
                  <form className="rental-request-form" key={activeVehicle.id} onSubmit={(event) => submitRentalRequest(event, activeVehicle)}>
                    <p className="rental-request-intro">{!rentalDates.startDate ? '1 · Scegli il giorno di ritiro' : !rentalDates.endDate ? '2 · Scegli il giorno di riconsegna' : '3 · Lascia i tuoi contatti'}</p>
                    {rentalAvailabilityError ? (
                      <div className="rental-calendar-error" role="alert">
                        <span>{rentalAvailabilityError}</span>
                        <button className="button button-outline button-small" type="button" onClick={() => setRentalAvailabilityReloadKey((key) => key + 1)}>Riprova</button>
                      </div>
                    ) : (
                      <div className="rental-calendar-shell" aria-busy={rentalAvailabilityLoading}>
                        <DayPicker
                          className="rental-calendar"
                          mode="range"
                          selected={selectedRentalRange}
                          onSelect={(range) => {
                            setRentalDates({
                              startDate: formatLocalDate(range?.from),
                              endDate: formatLocalDate(range?.to),
                            });
                            setRentalRequestStatus({ vehicleId: activeVehicle.id, error: '', message: '' });
                          }}
                          disabled={rentalAvailabilityLoading ? true : [{ before: rentalLocalToday }, ...unavailableRentalDates]}
                          modifiers={{ unavailable: unavailableRentalDates }}
                          modifiersClassNames={{ unavailable: 'rental-calendar-unavailable' }}
                          excludeDisabled
                          min={1}
                          max={60}
                          startMonth={new Date(rentalLocalToday.getFullYear(), rentalLocalToday.getMonth())}
                          endMonth={new Date(rentalLocalToday.getFullYear() + 2, 11)}
                          locale={it}
                          weekStartsOn={1}
                          showOutsideDays
                          footer={rentalAvailabilityLoading ? 'Verifica disponibilità…' : 'I giorni rossi non sono disponibili · seleziona ritiro e riconsegna'}
                          aria-label="Seleziona il periodo di noleggio"
                          lang="it-IT"
                        />
                        <div className="rental-calendar-steps" aria-live="polite">
                          <span className={rentalDates.startDate ? 'is-complete' : 'is-current'}>01 <b>Ritiro</b>{rentalDates.startDate && <strong>{parseLocalDate(rentalDates.startDate).toLocaleDateString('it-IT')}</strong>}</span>
                          <span className={rentalDates.endDate ? 'is-complete' : rentalDates.startDate ? 'is-current' : ''}>02 <b>Riconsegna</b>{rentalDates.endDate && <strong>{parseLocalDate(rentalDates.endDate).toLocaleDateString('it-IT')}</strong>}</span>
                        </div>
                      </div>
                    )}
                    <input type="hidden" name="startDate" value={rentalDates.startDate} />
                    <input type="hidden" name="endDate" value={rentalDates.endDate} />
                    {rentalDates.startDate && rentalDates.endDate && rentalDays > 0 && !rentalAvailabilityError && !rentalAvailabilityLoading && (
                      <div className="rental-request-details">
                        <div className="rental-estimate" aria-live="polite">
                          <span>{rentalDays} {rentalDays === 1 ? 'giorno' : 'giorni'} × {euro.format(activeVehicle.price)}/giorno · stima</span>
                          <strong>{euro.format(rentalEstimatedTotal)}</strong>
                        </div>
                        <label>Nome e cognome
                          <input name="name" autoComplete="name" minLength="2" maxLength="80" defaultValue={user?.name || ''} required />
                        </label>
                        <label>Email
                          <input name="email" type="email" autoComplete="email" maxLength="254" defaultValue={user?.email || ''} required />
                        </label>
                        <label>Telefono
                          <input name="phone" type="tel" autoComplete="tel" minLength="6" maxLength="30" required />
                        </label>
                        <label>Note per il team <span className="rental-optional-label">facoltative</span>
                          <textarea name="message" rows="2" maxLength="1000" placeholder="Orario di ritiro o altre richieste…" />
                        </label>
                        <button className="button button-accent detail-primary-action" type="submit" disabled={rentalRequestBusy === activeVehicle.id || rentalAvailabilityLoading || Boolean(rentalAvailabilityError)}>
                          {rentalRequestBusy === activeVehicle.id ? 'Invio richiesta…' : 'Richiedi disponibilità'} <span aria-hidden="true">↗</span>
                        </button>
                        <p className="rental-request-disclaimer">La richiesta non blocca l’auto. Il team confermerà disponibilità, tariffa e condizioni.</p>
                      </div>
                    )}
                    {rentalRequestStatus.vehicleId === activeVehicle.id && rentalRequestStatus.error && <p className="form-error" role="alert">{rentalRequestStatus.error}</p>}
                    {rentalRequestStatus.vehicleId === activeVehicle.id && rentalRequestStatus.message && <p className="form-success" role="status">{rentalRequestStatus.message}</p>}
                  </form>
                )}
                <button
                  className={cart.includes(activeVehicle.id) ? 'button button-outline detail-secondary-action is-added' : 'button button-outline detail-secondary-action'}
                  type="button"
                  onClick={() => addToCart(activeVehicle)}
                >
                  {!user ? 'Accedi per aggiungere alla selezione' : cart.includes(activeVehicle.id) ? 'Aggiunta alla selezione ✓' : 'Aggiungi alla selezione'}
                </button>
                <div className="vehicle-direct-contact">
                  <span>Preferisci parlare direttamente?</span>
                  <a href={`tel:+${GERARDO_PHONE_NUMBER}`}><SiteIcon name="phone" /> Chiama Gerardo</a>
                  <a href={`https://wa.me/${GERARDO_PHONE_NUMBER}?text=${encodeURIComponent(`Ciao, vorrei informazioni sulla ${activeVehicle.make} ${activeVehicle.model} ${activeVehicle.year}.`)}`} target="_blank" rel="noopener noreferrer"><SiteIcon name="whatsapp" /> Scrivi su WhatsApp</a>
                </div>
                <p className="detail-disclaimer">Prezzi, immagini e disponibilità sono indicativi e da verificare. Il team ti contatterà per confermare i dettagli.</p>
              </aside>
            </div>
            <section className="vehicle-detail-panel">
                <div className="vehicle-panel-heading">
                  <span className="eyebrow">LA SCHEDA</span>
                  <h2>Dati tecnici e dettagli <em>dell’auto</em></h2>
                </div>
                <div className="vehicle-description-block">
                  <h3><SiteIcon name="info" /> Descrizione</h3>
                  <p className="vehicle-detail-description">{activeVehicle.description}</p>
                </div>
                <div className="vehicle-spec-groups">
                  {[
                    {
                      icon: 'car',
                      title: 'Caratteristiche del veicolo',
                      specs: [
                        { icon: 'registration', label: 'Prima immatricolazione', value: activeVehicle.firstRegistration },
                        { icon: 'bodyType', label: 'Tipo di veicolo', value: activeVehicle.bodyType },
                        { icon: 'color', label: 'Colore', value: activeVehicle.color },
                        { icon: 'doors', label: 'Porte', value: activeVehicle.doors },
                        { icon: 'seats', label: 'Posti', value: activeVehicle.seats },
                        { icon: 'trunk', label: 'Capacità bagagliaio', value: activeVehicle.trunkCapacityLitres != null ? `${kilometer.format(activeVehicle.trunkCapacityLitres)} l` : '' },
                      ],
                    },
                    {
                      icon: 'engine',
                      title: 'Motore e trasmissione',
                      specs: [
                        { icon: 'engine', label: 'Motore', value: activeVehicle.engine },
                        { icon: 'fuel', label: 'Alimentazione', value: activeVehicle.fuel },
                        { icon: 'transmission', label: 'Cambio', value: activeVehicle.transmission },
                        { icon: 'displacement', label: 'Cilindrata', value: activeVehicle.engineDisplacementCc ? `${kilometer.format(activeVehicle.engineDisplacementCc)} cm³` : '' },
                        { icon: 'cylinders', label: 'Cilindri', value: activeVehicle.cylinders },
                        { icon: 'drivetrain', label: 'Trazione', value: activeVehicle.drivetrain },
                        { icon: 'power', label: 'Potenza', value: activeVehiclePower.cv ? `${activeVehiclePower.cv} CV${activeVehiclePower.kw ? ` · ${activeVehiclePower.kw} kW` : ''}` : '' },
                      ],
                    },
                    {
                      icon: 'speed',
                      title: 'Prestazioni',
                      specs: [
                        { icon: 'torque', label: 'Coppia', value: activeVehicle.torqueNm != null ? `${kilometer.format(activeVehicle.torqueNm)} Nm` : '' },
                        { icon: 'acceleration', label: 'Accelerazione 0–100 km/h', value: activeVehicle.accelerationSeconds != null ? `${vehiclePowerNumber.format(activeVehicle.accelerationSeconds)} s` : '' },
                        { icon: 'speed', label: 'Velocità massima', value: activeVehicle.topSpeedKmh != null ? `${kilometer.format(activeVehicle.topSpeedKmh)} km/h` : '' },
                      ],
                    },
                    {
                      icon: 'consumption',
                      title: 'Consumi ed emissioni',
                      specs: [
                        { icon: 'consumption', label: 'Consumo combinato', value: activeVehicle.consumptionCombined != null ? `${vehiclePowerNumber.format(activeVehicle.consumptionCombined)} ${activeVehicle.consumptionUnit || 'l/100 km'}` : '' },
                        { icon: 'emissions', label: 'Classe emissioni', value: activeVehicle.emissionsClass },
                        { icon: 'co2', label: 'Emissioni CO₂', value: activeVehicle.co2Emissions != null ? `${activeVehicle.co2Emissions} g/km` : '' },
                      ],
                    },
                    {
                      icon: 'condition',
                      title: 'Condizioni, manutenzione e documenti',
                      specs: [
                        { icon: 'condition', label: 'Condizioni', value: activeVehicle.condition },
                        { icon: 'owner', label: 'Proprietari precedenti', value: activeVehicle.previousOwners != null ? activeVehicle.previousOwners : '' },
                        {
                          icon: 'warranty',
                          label: 'Garanzia',
                          value: activeVehicle.warrantyMonths != null ? activeVehicle.warrantyMonths === 0 ? 'Non prevista' : `${activeVehicle.warrantyMonths} mesi` : '',
                          chips: activeVehicle.warrantyMonths != null
                            ? [{ label: activeVehicle.warrantyMonths === 0 ? 'Non prevista' : `${activeVehicle.warrantyMonths} mesi`, icon: 'warranty', unavailable: activeVehicle.warrantyMonths === 0 }]
                            : [],
                        },
                        {
                          icon: 'warranty',
                          label: 'Componenti coperti',
                          value: (activeVehicle.warrantyCoverage || []).map((item) => WARRANTY_COVERAGE_LABELS[item] || item).join(', '),
                          chips: (activeVehicle.warrantyCoverage || []).map((item) => ({
                            label: WARRANTY_COVERAGE_LABELS[item] || item,
                            icon: WARRANTY_COVERAGE_OPTIONS.find((option) => option.value === item)?.icon || 'check',
                          })),
                        },
                        { icon: 'service', label: 'Ultimo tagliando', value: activeVehicle.lastService },
                        { icon: 'inspection', label: 'Revisione valida fino al', value: activeVehicle.inspectionYear },
                        { icon: 'novice', label: 'Per neopatentati', value: activeVehicle.noviceDriverEligible === 'yes' ? 'Indicato come idoneo' : activeVehicle.noviceDriverEligible === 'no' ? 'Non indicato come idoneo' : '' },
                      ],
                    },
                    ...(activeVehicle.type === 'buy' ? [{
                      icon: 'payment',
                      title: 'Agevolazioni e altre informazioni',
                      specs: [
                        {
                          icon: 'payment',
                          label: 'Piano rateale',
                          value: activeVehicle.installmentPlan
                            ? `${monthlyEuro.format(activeVehicle.installmentPlan.monthlyAmount)} al mese per ${activeVehicle.installmentPlan.months} mesi`
                            : '',
                        },
                        { icon: 'sell', label: 'Etichetta', value: activeVehicle.label },
                      ],
                    }] : [{
                      icon: 'sell',
                      title: 'Altre informazioni',
                      specs: [{ icon: 'sell', label: 'Etichetta', value: activeVehicle.label }],
                    }]),
                  ].map((group) => (
                    <section className="vehicle-spec-group" key={group.title} aria-label={group.title}>
                      <h4><SiteIcon name={group.icon} />{group.title}</h4>
                      <dl className="vehicle-spec-list">
                        {group.specs.map(({ icon, label, value, chips }) => (
                          <div className={chips ? 'vehicle-warranty-spec' : undefined} key={label}>
                            <dt>{icon === 'bodyType' ? <VehicleBodyTypeIcon type={value} /> : <SiteIcon name={icon} />}{label}</dt>
                            <dd className={chips ? 'vehicle-warranty-value' : value == null || (typeof value === 'string' && !value.trim()) ? 'is-unspecified' : ''}>
                              {chips
                                ? chips.length > 0
                                  ? <span className="vehicle-warranty-chips">{chips.map((chip) => <span className={`vehicle-warranty-chip${chip.unavailable ? ' is-unavailable' : ''}`} key={chip.label}><SiteIcon name={chip.icon} />{chip.label}</span>)}</span>
                                  : <span className="is-unspecified">Non specificato</span>
                                : value === '' || value === null || value === undefined || (typeof value === 'string' && !value.trim())
                                ? 'Non specificato'
                                : value}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    </section>
                  ))}
                </div>
                {activeVehicle.noviceDriverEligible && activeVehicle.noviceDriverEligible !== 'unknown' && (
                  <p className="vehicle-novice-note">
                    L’idoneità per neopatentati è indicativa: verifica sempre i limiti di legge aggiornati e i dati riportati sul libretto prima di guidare.
                  </p>
                )}
                <div className="vehicle-maintenance-history">
                  <h2><SiteIcon name="warranty" /> Storico manutenzione</h2>
                  <p>{activeVehicle.maintenanceHistory || <span className="is-unspecified">Non specificato</span>}</p>
                </div>
                <section className="vehicle-detail-features" aria-labelledby="vehicle-features-title">
                  <h2 id="vehicle-features-title">Dotazioni</h2>
                  {(activeVehicle.features || []).length > 0 ? (
                    <ul>
                      {activeVehicle.features.map((feature) => (
                        <li key={feature}><FeatureIcon feature={feature} /><span>{feature}</span></li>
                      ))}
                    </ul>
                  ) : <p className="is-unspecified">Non specificato</p>}
                </section>
            </section>
          </section>
        ) : isUnknownVehiclePage ? (
          <section className="vehicle-detail section-wrap vehicle-not-found">
            {inventoryLoading || (!inventoryError && availablePopularMakes.length > 0 && !popularBrandLogosLoaded) ? (
              <>
                <p className="eyebrow">INVENTARIO</p>
                <h1>Caricamento <em>dell’auto…</em></h1>
                <p>Stiamo recuperando i dettagli, attendi qualche secondo.</p>
                <div className="detail-loading-skeleton" aria-hidden="true">
                  <div className="skeleton-shimmer detail-skeleton-image" />
                  <div className="detail-skeleton-copy">
                    <div className="skeleton-shimmer skeleton-line skeleton-line-short" />
                    <div className="skeleton-shimmer skeleton-line skeleton-line-title" />
                    <div className="skeleton-shimmer skeleton-line skeleton-line-medium" />
                  </div>
                </div>
              </>
            ) : (
              <>
                {inventoryError ? (
                  <ContentErrorState title="Non riusciamo a caricare l’auto" message={inventoryError} onRetry={() => setInventoryReloadKey((key) => key + 1)} />
                ) : (
                  <>
                    <p className="eyebrow">AUTO NON TROVATA</p>
                    <h1>Questa pagina non è <em>disponibile.</em></h1>
                    <p>L’auto potrebbe non essere più presente nella selezione.</p>
                  </>
                )}
              </>
            )}
            <button className="button button-accent" type="button" onClick={() => navigateToHome('inventory')}>Torna alle auto</button>
          </section>
        ) : isAdminPage ? (
          <section className="admin-page section-wrap" aria-labelledby={user?.role === 'admin' ? 'admin-title' : 'admin-access-title'}>
            {user?.role === 'admin' ? (
              <>
                <div className="admin-heading admin-heading-prominent admin-inventory-heading">
                  <div>
                    <p className="eyebrow">AREA AMMINISTRATORE · ACCESSO RISERVATO</p>
                    <h1 id="admin-title">Pannello <em>amministratore.</em></h1>
                    <p>Gestisci veicoli e tariffe. Richieste, calendario e disponibilità noleggio hanno un’area operativa dedicata.</p>
                  </div>
                </div>
                <AdminSectionNavigation
                  active="inventory"
                  pendingPurchases={adminPurchaseRequests.filter((request) => request.status === 'pending').length}
                  pendingRentals={adminRentalRequests.filter((request) => request.status === 'pending').length}
                  onNavigate={navigateToPath}
                />
                <section className="admin-inventory-overview" aria-labelledby="admin-inventory-overview-title">
                  <div>
                    <p className="eyebrow">PANORAMICA</p>
                    <h2 id="admin-inventory-overview-title">Tieni sotto controllo il parco auto.</h2>
                    <p>Apri la sezione statistiche per consultare visite, richieste, conversioni e andamento giornaliero.</p>
                  </div>
                  <div className="admin-inventory-overview-metrics">
                    <span><strong>{vehicles.length}</strong> auto pubblicate</span>
                    <span><strong>{adminPurchaseRequests.filter((request) => request.status === 'pending').length}</strong> richieste acquisto</span>
                    <span><strong>{adminRentalRequests.filter((request) => request.status === 'pending').length}</strong> richieste noleggio</span>
                  </div>
                  <button className="button header-glossy-accent admin-overview-analytics-button" type="button" onClick={() => navigateToPath('/admin/analytics')}>Apri statistiche <span aria-hidden="true">↗</span></button>
                </section>
                <div className="admin-layout">
                  <form
                    ref={adminVehicleFormRef}
                    className={`admin-vehicle-form${adminVehicleFormSubmitted ? ' was-submitted' : ''}`}
                    key={editingVehicle?.id || 'new-vehicle'}
                    onSubmit={handleAdminVehicleSubmit}
                    onInvalid={() => setAdminVehicleFormSubmitted(true)}
                  >
                    <div className="admin-form-heading">
                      <h2>{editingVehicle ? `Modifica ${editingVehicle.make} ${editingVehicle.model}` : 'Aggiungi una nuova auto'}</h2>
                      {editingVehicle && <button className="clear-cart" type="button" onClick={() => { setEditingVehicle(null); setAdminImageFiles([]); setMainImageIndex(-1); }}>Annulla modifica</button>}
                    </div>
                    <div className="admin-form-section-heading is-required">
                      <span className="admin-form-section-mark">*</span>
                      <div><strong>Informazioni obbligatorie</strong><small>Compila tutti i campi di questa sezione per pubblicare l’auto.</small></div>
                    </div>
                    <div className="admin-form-grid">
                      <label><span className="admin-spec-label"><SiteIcon name="car" /> Marca</span><input name="make" defaultValue={editingVehicle?.make || ''} maxLength="60" placeholder="Es. Alfa Romeo" required /></label>
                      <label><span className="admin-spec-label"><SiteIcon name="car" /> Modello</span><input name="model" defaultValue={editingVehicle?.model || ''} maxLength="100" placeholder="Es. Giulietta" required /></label>
                      <label><span className="admin-spec-label"><SiteIcon name="calendar" /> Anno</span><input name="year" type="number" defaultValue={editingVehicle?.year ?? ''} min="1950" max={new Date().getFullYear() + 1} placeholder="Es. 2018" required /></label>
                      <label><span className="admin-spec-label"><SiteIcon name="key" /> Vendita o noleggio</span><SelectField name="type" value={adminVehicleType} onChange={(event) => setAdminVehicleType(event.target.value)}><option value="buy">In vendita</option><option value="rent">A noleggio</option></SelectField></label>
                      <label className="admin-price-field">
                        <span className="admin-spec-label"><SiteIcon name="price" /> Prezzo (€ o al giorno)</span>
                        <input name="price" type="number" value={adminVehiclePrice} onChange={(event) => setAdminVehiclePrice(event.target.value)} min="1" step="1" placeholder="Es. 12500" required />
                        {adminVehicleType === 'buy' && (
                          <>
                            <SelectField name="vatMode" value={adminVehicleVatMode} onChange={(event) => setAdminVehicleVatMode(event.target.value)}>
                              <option value="inclusive">IVA inclusa nel prezzo</option>
                              <option value="exclusive">IVA separata · da aggiungere</option>
                              <option value="not-applied">IVA non applicata</option>
                            </SelectField>
                            <small className="admin-vat-mode-note">Indica il trattamento IVA verificato per questa vendita.</small>
                            {adminVehicleVatMode !== 'not-applied' && (
                              <div className="admin-vat-calculator" aria-live="polite">
                                <strong><SiteIcon name="price" /> {adminVehicleVatMode === 'inclusive' ? 'Stima IVA ordinaria inclusa (22%)' : 'Stima IVA ordinaria da aggiungere (22%)'}</strong>
                                {Number(adminVehiclePrice) > 0 && Number.isFinite(Number(adminVehiclePrice)) ? (
                                  <dl>
                                    {adminVehicleVatMode === 'inclusive' ? (
                                      <>
                                        <div><dt>Imponibile stimato</dt><dd>{revenueEuro.format(Number(adminVehiclePrice) / 1.22)}</dd></div>
                                        <div><dt>IVA inclusa</dt><dd>{revenueEuro.format(Number(adminVehiclePrice) * 22 / 122)}</dd></div>
                                      </>
                                    ) : (
                                      <>
                                        <div><dt>IVA da aggiungere</dt><dd>{revenueEuro.format(Number(adminVehiclePrice) * 0.22)}</dd></div>
                                        <div><dt>Totale con IVA</dt><dd>{revenueEuro.format(Number(adminVehiclePrice) * 1.22)}</dd></div>
                                      </>
                                    )}
                                  </dl>
                                ) : <p>Inserisci il prezzo richiesto per vedere il calcolo.</p>}
                                <small>Valori indicativi al 22%; verifica il regime fiscale applicabile. Le stime non vengono salvate nell’auto.</small>
                              </div>
                            )}
                          </>
                        )}
                      </label>
                      <label><span className="admin-spec-label"><SiteIcon name="odometer" /> Chilometraggio (km)</span><input name="mileageKm" type="number" defaultValue={editingVehicle?.mileageKm ?? ''} min="0" step="1" placeholder="Es. 85000" required /></label>
                      <fieldset className="admin-vehicle-body-types admin-wide-field" aria-required="true">
                        <legend><span className="admin-spec-label"><SiteIcon name="car" /> Tipo di veicolo</span></legend>
                        <VehicleBodyTypeOptions defaultValue={editingVehicle?.bodyType} />
                      </fieldset>
                      <label><span className="admin-spec-label"><SiteIcon name="color" /> Colore</span><input name="color" defaultValue={editingVehicle?.color || ''} maxLength="40" placeholder="Es. Nero" required /></label>
                      <label><span className="admin-spec-label"><SiteIcon name="fuel" /> Alimentazione</span><input name="fuel" defaultValue={editingVehicle?.fuel || ''} maxLength="40" placeholder="Es. Diesel" required /></label>
                      <label><span className="admin-spec-label"><SiteIcon name="transmission" /> Cambio</span><input name="transmission" defaultValue={editingVehicle?.transmission || ''} maxLength="40" placeholder="Es. Manuale" required /></label>
                      <label><span className="admin-spec-label"><SiteIcon name="power" /> Potenza (CV)</span><input name="powerCv" type="number" defaultValue={getVehiclePowerDetails(editingVehicle).cvValue ?? ''} min="1" max="3000" step="1" placeholder="Es. 120" required /></label>
                      <label><span className="admin-spec-label"><SiteIcon name="doors" /> Porte</span><input name="doors" type="number" defaultValue={editingVehicle?.doors ?? ''} min="1" max="8" placeholder="Es. 5" required /></label>
                      <label><span className="admin-spec-label"><SiteIcon name="seats" /> Posti</span><input name="seats" type="number" defaultValue={editingVehicle?.seats ?? ''} min="1" max="20" placeholder="Es. 5" required /></label>
                    </div>
                    <div className="admin-form-section-heading is-optional">
                      <span className="admin-form-section-mark"><SiteIcon name="info" /></span>
                      <div><strong>Informazioni facoltative</strong><small>Arricchiscono la scheda; lascia vuoti i dati che non hai verificato.</small></div>
                    </div>
                    <div className="admin-form-grid">
                      <label><span className="admin-spec-label"><SiteIcon name="payment" /> Rata mensile (€) · facoltativa</span><input name="installmentMonthlyAmount" type="number" defaultValue={editingVehicle?.installmentPlan?.monthlyAmount ?? ''} min="1" max="100000000" step="0.01" placeholder="Es. 250" /></label>
                      <label><span className="admin-spec-label"><SiteIcon name="calendar" /> Durata rate (mesi) · facoltativa</span><input name="installmentMonths" type="number" defaultValue={editingVehicle?.installmentPlan?.months ?? ''} min="2" max="120" step="1" placeholder="Es. 48 mesi" /></label>
                      <label><span className="admin-spec-label"><SiteIcon name="power" /> Potenza (kW) · facoltativa</span><input name="powerKw" type="number" defaultValue={editingVehicle?.powerKw ?? ''} min="1" max="2000" step="0.1" placeholder="Es. 88,3" /></label>
                      <label><span className="admin-spec-label"><SiteIcon name="emissions" /> Classe emissioni · facoltativa</span><input name="emissionsClass" defaultValue={editingVehicle?.emissionsClass || ''} maxLength="20" placeholder="Es. Euro 6D" /></label>
                      <label><span className="admin-spec-label"><SiteIcon name="inspection" /> Revisione (anno) · facoltativa</span><input name="inspectionYear" type="number" defaultValue={editingVehicle?.inspectionYear ?? ''} min="1950" max={new Date().getFullYear() + 10} step="1" placeholder="Es. 2026" /></label>
                      <label><span className="admin-spec-label"><SiteIcon name="service" /> Ultimo tagliando · facoltativo</span><input name="lastService" defaultValue={editingVehicle?.lastService || ''} maxLength="80" placeholder="Es. 03/2026 · 85.000 km" /></label>
                      <label><span className="admin-spec-label"><SiteIcon name="sell" /> Etichetta · facoltativa</span><input name="label" defaultValue={editingVehicle?.label || ''} maxLength="50" placeholder="Es. Occasione" /></label>
                      <div className="admin-specs-heading admin-wide-field">
                        <SiteIcon name="info" />
                        <span><strong>Specifiche tecniche aggiuntive</strong><small>Facoltative: compila solo i dati verificati per questa vettura.</small></span>
                      </div>
                      <label><span className="admin-spec-label"><SiteIcon name="engine" /> Motore / versione</span><input name="engine" defaultValue={editingVehicle?.engine || ''} maxLength="100" placeholder="Es. 1.5 TSI 4 cilindri" /></label>
                      <label><span className="admin-spec-label"><SiteIcon name="drivetrain" /> Trazione</span><SelectField name="drivetrain" defaultValue={editingVehicle?.drivetrain || ''}><option value="">Non specificata</option><option value="Anteriore">Anteriore</option><option value="Posteriore">Posteriore</option><option value="Integrale">Integrale</option><option value="4x4 inseribile">4x4 inseribile</option></SelectField></label>
                      <label><span className="admin-spec-label"><SiteIcon name="displacement" /> Cilindrata (cm³)</span><input name="engineDisplacementCc" type="number" defaultValue={editingVehicle?.engineDisplacementCc ?? ''} min="500" max="20000" step="1" placeholder="Es. 1498" /></label>
                      <label><span className="admin-spec-label"><SiteIcon name="cylinders" /> Numero cilindri</span><input name="cylinders" type="number" defaultValue={editingVehicle?.cylinders ?? ''} min="1" max="16" step="1" placeholder="Es. 4" /></label>
                      <label><span className="admin-spec-label"><SiteIcon name="consumption" /> Consumo combinato</span><div className="admin-measurement-input"><input name="consumptionCombined" type="number" defaultValue={editingVehicle?.consumptionCombined ?? ''} min="0.1" max="100" step="0.1" placeholder="Es. 5,8" /><SelectField name="consumptionUnit" defaultValue={editingVehicle?.consumptionUnit || 'l/100 km'}><option value="l/100 km">l/100 km</option><option value="kWh/100 km">kWh/100 km</option></SelectField></div></label>
                      <label><span className="admin-spec-label"><SiteIcon name="co2" /> Emissioni CO₂ (g/km)</span><input name="co2Emissions" type="number" defaultValue={editingVehicle?.co2Emissions ?? ''} min="0" max="2000" step="1" placeholder="Es. 132" /></label>
                      <label><span className="admin-spec-label"><SiteIcon name="torque" /> Coppia (Nm)</span><input name="torqueNm" type="number" defaultValue={editingVehicle?.torqueNm ?? ''} min="1" max="10000" step="1" placeholder="Es. 250" /></label>
                      <label><span className="admin-spec-label"><SiteIcon name="acceleration" /> 0–100 km/h (secondi)</span><input name="accelerationSeconds" type="number" defaultValue={editingVehicle?.accelerationSeconds ?? ''} min="0.1" max="120" step="0.1" placeholder="Es. 8,5" /></label>
                      <label><span className="admin-spec-label"><SiteIcon name="speed" /> Velocità massima (km/h)</span><input name="topSpeedKmh" type="number" defaultValue={editingVehicle?.topSpeedKmh ?? ''} min="1" max="600" step="1" placeholder="Es. 210" /></label>
                      <label><span className="admin-spec-label"><SiteIcon name="trunk" /> Capacità bagagliaio (litri)</span><input name="trunkCapacityLitres" type="number" defaultValue={editingVehicle?.trunkCapacityLitres ?? ''} min="0" max="10000" step="1" placeholder="Es. 380" /></label>
                      <label><span className="admin-spec-label"><SiteIcon name="registration" /> Prima immatricolazione</span><input name="firstRegistration" defaultValue={editingVehicle?.firstRegistration || ''} maxLength="20" placeholder="Es. 06/2021" /></label>
                      <label><span className="admin-spec-label"><SiteIcon name="novice" /> Idoneità neopatentati</span><SelectField name="noviceDriverEligible" defaultValue={editingVehicle?.noviceDriverEligible || 'unknown'}><option value="unknown">Non verificata</option><option value="yes">Verificata: sì</option><option value="no">Verificata: no</option></SelectField></label>
                      <label><span className="admin-spec-label"><SiteIcon name="condition" /> Condizioni</span><SelectField name="condition" defaultValue={editingVehicle?.condition || ''}><option value="">Non specificate</option><option value="Usato">Usato</option><option value="Ottime">Ottime</option><option value="Pari al nuovo">Pari al nuovo</option><option value="Nuovo">Nuovo</option></SelectField></label>
                      <label><span className="admin-spec-label"><SiteIcon name="owner" /> Proprietari precedenti</span><input name="previousOwners" type="number" defaultValue={editingVehicle?.previousOwners ?? ''} min="0" max="50" step="1" placeholder="Es. 2" /></label>
                      <label><span className="admin-spec-label"><SiteIcon name="warranty" /> Garanzia (mesi)</span><input name="warrantyMonths" type="number" defaultValue={editingVehicle?.warrantyMonths ?? ''} min="0" max="120" step="1" placeholder="0 = non prevista" /></label>
                      <WarrantyCoverageField editingVehicle={editingVehicle} />
                    </div>
                    <p className="admin-installment-hint">Condizioni rateali facoltative, solo per le auto in vendita. Il sito mostra importo e durata ma non incassa pagamenti.</p>
                    <label className="admin-wide-field"><span className="admin-spec-label"><SiteIcon name="warranty" /> Storico manutenzione</span><textarea name="maintenanceHistory" rows="3" maxLength="1000" defaultValue={editingVehicle?.maintenanceHistory || ''} placeholder="Interventi documentati, cronologia tagliandi o lavori recenti." /></label>
                    <div className="admin-form-section-heading is-required admin-wide-field">
                      <span className="admin-form-section-mark">*</span>
                      <div><strong>Descrizione e foto obbligatorie</strong><small>Servono a presentare l’auto ai clienti e completare la pubblicazione.</small></div>
                    </div>
                    <label className="admin-wide-field"><span className="admin-spec-label"><SiteIcon name="info" /> Descrizione <span className="required-marker" aria-hidden="true">*</span></span><textarea name="description" rows="3" maxLength="2000" defaultValue={editingVehicle?.description || ''} placeholder="Inserisci una descrizione dell’auto, delle sue condizioni e dei suoi optional." required /></label>
                    <div
                      className={`admin-wide-field admin-photo-field${adminVehicleFormSubmitted && (!adminImageItems.length || mainImageIndex < 0 || mainImageIndex >= adminImageItems.length) ? ' is-required-missing' : ''}`}
                      aria-invalid={adminVehicleFormSubmitted && (!adminImageItems.length || mainImageIndex < 0 || mainImageIndex >= adminImageItems.length)}
                    >
                      <span className="admin-photo-label"><SiteIcon name="image" /> Foto dell’auto <span className="required-marker" aria-hidden="true">*</span></span>
                      <p className="admin-photo-hint">Aggiungi una foto alla volta. Seleziona una miniatura per impostarla come foto principale. JPEG, PNG o WebP, massimo 8 MB ciascuna.</p>
                      <div className="admin-photo-grid">
                        {adminImageItems.map((image) => (
                          <div className={`admin-photo-item${mainImageIndex === image.index ? ' is-main-image' : ''}`} key={`${image.existing ? 'existing' : 'new'}-${image.index}`}>
                            <button
                              className="admin-photo-select"
                              type="button"
                              aria-pressed={mainImageIndex === image.index}
                              aria-label={`${mainImageIndex === image.index ? 'Foto principale: ' : 'Imposta come foto principale: '}${image.name}`}
                              onClick={() => setMainImageIndex(image.index)}
                            >
                              {image.src && <ProgressiveImage className="admin-photo-preview-image" src={image.src} alt="" loading="eager" />}
                              <span>{mainImageIndex === image.index ? 'Principale' : image.name}</span>
                            </button>
                            {!image.existing && (
                              <button
                                className="admin-photo-remove"
                                type="button"
                                aria-label={`Rimuovi ${image.name}`}
                                onClick={() => removeAdminImage(image.fileIndex)}
                              >×</button>
                            )}
                          </div>
                        ))}
                      </div>
                      <input
                        ref={adminImageInputRef}
                        className="visually-hidden"
                        name="images"
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        aria-label="Seleziona una foto dell’auto"
                        tabIndex={-1}
                        onChange={addAdminImage}
                      />
                      <button
                        className="button button-outline button-small admin-add-photo"
                        type="button"
                        onClick={() => adminImageInputRef.current?.click()}
                        disabled={existingAdminImages.length + adminImageFiles.length >= 20}
                      >
                        <SiteIcon name="image" /> Aggiungi foto ({existingAdminImages.length + adminImageFiles.length}/20)
                      </button>
                    </div>
                    <label className="admin-wide-field">
                      <span className="admin-spec-label"><SiteIcon name="image" /> Foto principale <span className="required-marker" aria-hidden="true">*</span></span>
                      <SelectField name="mainImageIndex" value={mainImageIndex} onChange={(event) => setMainImageIndex(Number(event.target.value))} required>
                        <option value={-1} disabled>Seleziona la foto principale</option>
                        {adminImageItems.map((image) => (
                          <option key={`${image.existing ? 'existing' : 'new'}-${image.index}`} value={image.index}>
                            {image.name}{image.index === mainImageIndex ? ' (principale)' : ''}
                          </option>
                        ))}
                      </SelectField>
                    </label>
                    <label className="admin-wide-field"><span className="admin-spec-label"><SiteIcon name="check" /> Dotazioni · facoltative (una per riga)</span><textarea name="features" rows="3" maxLength="2000" defaultValue={(editingVehicle?.features || []).join('\n')} /></label>
                    {adminError && <p className="form-error" role="alert">{adminError}</p>}
                    {adminMessage && <p className="form-success" role="status">{adminMessage}</p>}
                    <button className="button button-accent" type="submit" disabled={adminBusy}>{adminBusy ? 'Salvataggio…' : editingVehicle ? 'Salva modifiche' : 'Aggiungi auto'} <span aria-hidden="true">↗</span></button>
                  </form>
                  <section className="admin-inventory" aria-labelledby="admin-inventory-title">
                    <h2 id="admin-inventory-title">Auto pubblicate ({vehicles.length})</h2>
                    <p className="admin-metrics-note">Ogni apertura di una scheda auto registra una visualizzazione. Le richieste contano gli account cliente che hanno inviato una richiesta.</p>
                    {saleAdminMessage && <p className="form-success" role="status">{saleAdminMessage}</p>}
                    {saleAdminError && <p className="form-error" role="alert">{saleAdminError}</p>}
                    {vehicles.map((vehicle) => {
                      const vehicleRequestCustomers = adminPurchaseRequests
                        .filter((request) => request.vehicle.id === vehicle.id && request.customer?.id)
                        .map((request) => request.customer);
                      return (
                      <article className="admin-vehicle-row" key={vehicle.id}>
                        <ProgressiveImage className="admin-vehicle-thumbnail" src={vehicle.image || vehicle.images?.[0]} alt="" />
                        <div className="admin-vehicle-info">
                          <strong>{vehicle.make} {vehicle.model}</strong>
                          <small>{vehicle.year} · {vehicle.type === 'rent' ? 'Noleggio' : `Vendita · ${getVehicleVatLabel(vehicle)}`} · {euro.format(vehicle.price)}{vehicle.type === 'rent' ? ' / giorno' : ''}</small>
                          {adminVehicleMetricsById.has(vehicle.id) && (
                            <div className="admin-vehicle-metrics" aria-label={`Statistiche ${vehicle.make} ${vehicle.model}`}>
                              <span><SiteIcon name="eye" /> {kilometer.format(adminVehicleMetricsById.get(vehicle.id).views)} visualizzazioni</span>
                              {vehicle.type === 'buy' && <span><SiteIcon name="people" /> {kilometer.format(adminVehicleMetricsById.get(vehicle.id).purchaseRequests)} richieste</span>}
                            </div>
                          )}
                          <div className="admin-vehicle-actions">
                            {vehicle.type === 'buy' && (
                              markingSoldVehicleId === vehicle.id ? (
                                <div className="admin-sale-controls">
                                  <label>
                                    Account cliente
                                    <SelectField value={soldBuyerId} onChange={(event) => setSoldBuyerId(event.target.value)} disabled={adminBusy || vehicleRequestCustomers.length === 0} required>
                                      <option value="">Seleziona cliente che ha richiesto l’auto</option>
                                      {vehicleRequestCustomers.map((customer) => (
                                        <option key={customer.id} value={customer.id}>{customer.name} · {customer.email}</option>
                                      ))}
                                    </SelectField>
                                  </label>
                                  <label>
                                    Importo finale incassato (€)
                                    <input
                                      type="number"
                                      min="1"
                                      max="100000000"
                                      step="0.01"
                                      value={soldFinalPrice}
                                      onChange={(event) => setSoldFinalPrice(event.target.value)}
                                      required
                                      aria-label={`Prezzo finale di vendita per ${vehicle.make} ${vehicle.model}`}
                                    />
                                  </label>
                                  <small>Importo precompilato dal listino: per prezzi con IVA separata include una stima del 22%. Inserisci l’importo effettivamente incassato.</small>
                                  <button className="button button-accent button-small" type="button" disabled={adminBusy || !soldBuyerId} onClick={() => confirmVehicleSold(vehicle)}>
                                    Conferma vendita
                                  </button>
                                  <button className="clear-cart" type="button" disabled={adminBusy} onClick={() => { setMarkingSoldVehicleId(''); setSoldBuyerId(''); setSoldFinalPrice(''); }}>Annulla</button>
                                  {vehicleRequestCustomers.length === 0 && <small>Nessun cliente ha richiesto l’acquisto di quest’auto.</small>}
                                </div>
                              ) : (
                                <button className="button button-outline button-small" type="button" disabled={adminBusy} onClick={() => { setSaleAdminError(''); setSaleAdminMessage(''); setSoldBuyerId(''); setSoldFinalPrice(String(getVehicleVatMode(vehicle) === 'exclusive' ? vehicle.price * 1.22 : vehicle.price)); setMarkingSoldVehicleId(vehicle.id); }}>Segna venduta</button>
                              )
                            )}
                            <button className="button button-outline button-small" type="button" disabled={adminBusy} onClick={() => editAdminVehicle(vehicle)}>Modifica</button>
                            <button className="admin-delete" type="button" aria-label={`Rimuovi ${vehicle.make} ${vehicle.model}`} disabled={adminBusy} onClick={() => deleteAdminVehicle(vehicle)}>Rimuovi</button>
                          </div>
                        </div>
                      </article>
                      );
                    })}
                  </section>
                </div>
              </>
            ) : (
              <AdminAccessPanel
                area="AREA AMMINISTRATORE"
                title={<>Uno spazio <em>riservato.</em></>}
                description="Accedi con le credenziali amministratore per gestire veicoli, noleggi e richieste dei clienti."
                accountNote={user ? 'L’account attualmente collegato non dispone dei permessi di amministratore.' : ''}
                onLogin={() => { setAuthMode('login'); setAuthError(''); }}
                onBack={() => navigateToHome('inventory')}
              />
            )}
          </section>
        ) : isAdminMessagesPage ? (
          <section className="admin-page admin-messages-page section-wrap" aria-labelledby={user?.role === 'admin' ? 'admin-messages-title' : 'admin-access-title'}>
            {user?.role === 'admin' ? (
              <>
                <div className="admin-heading admin-heading-prominent">
                  <div>
                    <p className="eyebrow">AREA AMMINISTRATORE · POSTA E VENDITE</p>
                    <h1 id="admin-messages-title">Messaggi <em>e trattative.</em></h1>
                    <p>Gestisci le valutazioni, le richieste di acquisto dei clienti e lo storico delle consegne.</p>
                  </div>
                  <div className="admin-heading-actions">
                    <button className="button button-outline" type="button" onClick={() => navigateToPath('/admin')}>Gestione inventario</button>
                    <button className="button button-outline" type="button" onClick={() => navigateToHome('inventory')}>Torna al sito</button>
                  </div>
                </div>
                <AdminSectionNavigation
                  active="messages"
                  pendingPurchases={adminPurchaseRequests.filter((request) => request.status === 'pending').length}
                  pendingRentals={adminRentalRequests.filter((request) => request.status === 'pending').length}
                  onNavigate={navigateToPath}
                />

                <section className="admin-submissions" aria-labelledby="admin-submissions-title">
                  <div className="admin-submissions-heading">
                    <div>
                      <p className="eyebrow">VALUTAZIONI · AUTO DEI CLIENTI</p>
                      <h2 id="admin-submissions-title">Proposte ricevute <span>{sellSubmissions.length}</span></h2>
                    </div>
                  </div>
                  {sellSubmissionError && <p className="form-error" role="alert">{sellSubmissionError}</p>}
                  {!sellSubmissionError && sellSubmissions.length === 0 && <p className="admin-submissions-empty">Non ci sono proposte da gestire.</p>}
                  <div className="admin-submission-list">
                    {sellSubmissions.map((submission) => (
                      <article className="admin-submission" key={submission.id}>
                        <div className="admin-submission-photos">
                          {submission.images.map((image, index) => (
                            <a href={image} target="_blank" rel="noreferrer" key={image} aria-label={`Apri foto ${index + 1} di ${submission.make} ${submission.model}`}>
                              <ProgressiveImage className="admin-submission-image" src={image} alt={`Foto ${index + 1} ${submission.make} ${submission.model}`} />
                            </a>
                          ))}
                        </div>
                        <div className="admin-submission-main">
                          <div className="admin-submission-title">
                            <div>
                              <span className={`admin-submission-status status-${submission.status}`}>
                                {{ new: 'Nuova', reviewing: 'In valutazione', contacted: 'Contattato', accepted: 'Accettata', countered: 'Controfferta', rejected: 'Non accettata', closed: 'Chiusa' }[submission.status] || 'Nuova'}
                              </span>
                              <h3>{submission.year} {submission.make} {submission.model}</h3>
                            </div>
                            <time dateTime={submission.createdAt}>{new Date(submission.createdAt).toLocaleDateString('it-IT')}</time>
                          </div>
                          <p className="admin-submission-specs">{submission.bodyType ? `${submission.bodyType} · ` : ''}{kilometer.format(submission.mileageKm)} km{submission.askingPrice ? ` · Richiesta ${euro.format(submission.askingPrice)}` : ''}</p>
                          <p className="admin-submission-description">{submission.description}</p>
                          <div className="admin-submission-contact">
                            <strong>{submission.name}</strong>
                            <a href={`mailto:${encodeURIComponent(submission.email)}`}>{submission.email}</a>
                            <a href={`tel:${submission.phone.replace(/[^\d+]/g, '')}`}>{submission.phone}</a>
                          </div>
                          {submission.counterPrice && <p className="admin-submission-counter">Controfferta inviata: <strong>{euro.format(submission.counterPrice)}</strong></p>}
                          {submission.acceptedPrice && <p className="admin-submission-counter">Prezzo accettato: <strong>{euro.format(submission.acceptedPrice)}</strong></p>}
                          {!submission.ownerId && <p className="form-error">Richiesta senza account: gli aggiornamenti non saranno disponibili nell’area personale del cliente.</p>}
                          <div className="submission-conversation" aria-label="Conversazione privata con il cliente">
                            <h4>Conversazione</h4>
                            {(submission.messages || []).length === 0 && <p className="customer-purchases-empty">Nessun messaggio ancora.</p>}
                            {(submission.messages || []).map((message, index) => (
                              <article className={`submission-message${message.senderRole === 'admin' ? ' from-admin' : ''}`} key={`${message.createdAt}-${index}`}>
                                <span>{message.senderRole === 'admin' ? 'PelusoGroup' : submission.name}</span>
                                <p>{message.text}</p>
                                <time dateTime={message.createdAt}>{new Date(message.createdAt).toLocaleString('it-IT')}</time>
                              </article>
                            ))}
                          </div>
                          <form className="admin-submission-response" key={`${submission.id}-${submission.status}`} onSubmit={(event) => updateSellSubmissionResponse(event, submission)}>
                            <label><span>Azione <span className="required-marker" aria-hidden="true">*</span></span>
                              <SelectField name="status" defaultValue={submission.status === 'contacted' ? 'reviewing' : submission.status}>
                                <option value="message">Invia messaggio</option>
                                <option value="new">Nuova</option><option value="reviewing">In valutazione</option><option value="accepted">Accettata</option><option value="countered">Controfferta</option><option value="rejected">Non accettata</option><option value="closed">Chiusa</option>
                              </SelectField>
                            </label>
                            <div className="admin-response-section-divider"><span>Prezzo e messaggio · facoltativi</span></div>
                            <label><span>Prezzo concordato / controfferta (€) <small>Richiesto per accettazione o controfferta</small></span>
                                <input name="responsePrice" type="number" min="1" max="100000000" step="1" defaultValue={submission.acceptedPrice || submission.counterPrice || submission.askingPrice || ''} placeholder="Prezzo concordato" />
                            </label>
                            <label className="admin-response-message"><span>Messaggio <small>Obbligatorio per una controfferta</small></span>
                              <textarea name="message" rows="2" maxLength="1500" placeholder="Facoltativo con accettazione; obbligatorio con una controfferta…" />
                            </label>
                            {submissionResponseStatus.submissionId === submission.id && submissionResponseStatus.error && <p className="form-error" role="alert">{submissionResponseStatus.error}</p>}
                            {submissionResponseStatus.submissionId === submission.id && submissionResponseStatus.message && <p className="form-success" role="status">{submissionResponseStatus.message}</p>}
                            {submissionMessageStatus.submissionId === submission.id && submissionMessageStatus.error && <p className="form-error" role="alert">{submissionMessageStatus.error}</p>}
                            {submissionMessageStatus.submissionId === submission.id && submissionMessageStatus.message && <p className="form-success" role="status">{submissionMessageStatus.message}</p>}
                            <button className="button button-accent button-small" type="submit" disabled={submissionActionBusy === submission.id}>{submissionActionBusy === submission.id ? 'Invio…' : 'Invia'} <span aria-hidden="true">↗</span></button>
                            <button className="admin-delete" type="button" disabled={submissionActionBusy === submission.id} onClick={() => deleteSellSubmission(submission)}>Rimuovi proposta</button>
                          </form>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>

                <section className="admin-sales" aria-labelledby="admin-sales-title">
                  <div className="admin-submissions-heading"><div><p className="eyebrow">ACQUISTI CONFERMATI</p><h2 id="admin-sales-title">Storico vendite <span>{adminSales.length}</span></h2></div></div>
                  {adminSalesError && <p className="form-error" role="alert">{adminSalesError}</p>}
                  <div className="admin-sales-list">
                    {adminSales.map((sale) => (
                      <article key={sale.id}><ProgressiveImage className="admin-sales-image" src={sale.images[0]} alt="" /><div><strong>{sale.year} {sale.make} {sale.model}</strong><small>{new Date(sale.soldAt).toLocaleDateString('it-IT')} · {sale.buyer ? `${sale.buyer.name} (${sale.buyer.email})` : 'Account cliente non disponibile'}</small>{sale.review && <p>{'★'.repeat(sale.review.rating)} · {sale.review.text}</p>}</div></article>
                    ))}
                  </div>
                </section>
              </>
            ) : (
              <AdminAccessPanel
                area="MESSAGGI E VENDITE"
                title={<>Uno spazio <em>riservato.</em></>}
                description="Accedi con un account amministratore per consultare i messaggi, le trattative e lo storico vendite."
                accountNote={user ? 'L’account attualmente collegato non dispone dei permessi di amministratore.' : ''}
                onLogin={() => { setAuthMode('login'); setAuthError(''); }}
                onBack={() => navigateToHome('inventory')}
              />
            )}
          </section>
        ) : isAdminPurchaseRequestsPage ? (
          <section className="admin-page admin-purchase-requests-page section-wrap" aria-labelledby={user?.role === 'admin' ? 'admin-purchases-title' : 'admin-access-title'}>
            {user?.role === 'admin' ? (
              <>
                <div className="admin-heading admin-heading-prominent">
                  <div>
                    <p className="eyebrow">AREA AMMINISTRATORE · CONTATTI AUTO IN VENDITA</p>
                    <h1 id="admin-purchases-title">Richieste <em>d’acquisto.</em></h1>
                    <p>Gestisci i contatti dei clienti interessati alle auto pubblicate e aggiorna le richieste dal loro account.</p>
                  </div>
                  <div className="admin-heading-actions">
                    <button className="button button-outline" type="button" onClick={() => navigateToPath('/admin')}>Inventario</button>
                  </div>
                </div>
                <AdminSectionNavigation
                  active="purchases"
                  pendingPurchases={adminPurchaseRequests.filter((request) => request.status === 'pending').length}
                  pendingRentals={adminRentalRequests.filter((request) => request.status === 'pending').length}
                  onNavigate={navigateToPath}
                />
                <section className="admin-rental-overview admin-purchase-overview" aria-label="Riepilogo richieste d’acquisto">
                  <div><span>Da contattare</span><strong>{adminPurchaseRequests.filter((request) => request.status === 'pending').length}</strong></div>
                  <div><span>Contattati</span><strong>{adminPurchaseRequests.filter((request) => request.status === 'contacted').length}</strong></div>
                  <div><span>Accettate</span><strong>{adminPurchaseRequests.filter((request) => request.status === 'accepted').length}</strong></div>
                  <div><span>Richieste totali</span><strong>{adminPurchaseRequests.length}</strong></div>
                </section>
                <AdminPurchaseRequestsPanel
                  requests={adminPurchaseRequests}
                  error={adminPurchaseRequestsError}
                  actionBusy={purchaseRequestActionBusy}
                  actionStatus={purchaseRequestActionStatus}
                  onAccept={acceptPurchaseRequest}
                />
              </>
            ) : (
              <AdminAccessPanel
                area="RICHIESTE D’ACQUISTO"
                title={<>Accesso <em>riservato.</em></>}
                description="Accedi con un account amministratore per gestire le richieste dei clienti."
                accountNote={user ? 'L’account attualmente collegato non dispone dei permessi di amministratore.' : ''}
                onLogin={() => { setAuthMode('login'); setAuthError(''); }}
                onBack={() => navigateToHome('inventory')}
              />
            )}
          </section>
        ) : isAdminAnalyticsPage ? (
          <section className="admin-page admin-analytics-page section-wrap" aria-labelledby={user?.role === 'admin' ? 'admin-analytics-page-title' : 'admin-access-title'}>
            {user?.role === 'admin' ? (
              <>
                <div className="admin-heading admin-heading-prominent">
                  <div>
                    <p className="eyebrow">AREA AMMINISTRATORE · REPORT OPERATIVI</p>
                    <h1 id="admin-analytics-page-title">Statistiche <em>e grafici.</em></h1>
                    <p>Monitora visite, richieste, conversione e andamento delle vendite.</p>
                  </div>
                  <div className="admin-heading-actions">
                    <button className="button button-outline" type="button" onClick={() => navigateToPath('/admin')}>Inventario</button>
                  </div>
                </div>
                <AdminSectionNavigation
                  active="analytics"
                  pendingPurchases={adminPurchaseRequests.filter((request) => request.status === 'pending').length}
                  pendingRentals={adminRentalRequests.filter((request) => request.status === 'pending').length}
                  onNavigate={navigateToPath}
                />
                <AdminAnalyticsWorkspace
                  analyticsData={adminAnalyticsData}
                  vehicleType={adminAnalyticsVehicleType}
                  setVehicleType={setAdminAnalyticsVehicleType}
                  metric={adminAnalyticsMetric}
                  setMetric={setAdminAnalyticsMetric}
                  activityCalendar={adminActivityCalendar}
                  activityMetric={adminActivityMetric}
                  setActivityMetric={setAdminActivityMetric}
                  vehicleMetricsError={adminVehicleMetricsError}
                  salesError={adminSalesError}
                  vehicleMetricsLoaded={adminVehicleMetricsLoaded}
                  salesLoaded={adminSalesLoaded}
                  interestGaugeDataReady={interestGaugeDataReady}
                  interestGaugeStatus={interestGaugeStatus}
                  timelineError={adminVehicleTimelineError}
                  siteTraffic={siteTraffic}
                  siteTrafficError={siteTrafficError}
                />
              </>
            ) : (
              <AdminAccessPanel
                area="STATISTICHE E GRAFICI"
                title={<>Accesso <em>riservato.</em></>}
                description="Accedi con un account amministratore per consultare i dati operativi e lo storico delle performance."
                accountNote={user ? 'L’account attualmente collegato non dispone dei permessi di amministratore.' : ''}
                onLogin={() => { setAuthMode('login'); setAuthError(''); }}
                onBack={() => navigateToHome('inventory')}
              />
            )}
          </section>
        ) : isAdminRentalsPage ? (
          <section className="admin-page admin-rentals-page section-wrap" aria-labelledby={user?.role === 'admin' ? 'admin-rentals-title' : 'admin-access-title'}>
            {user?.role === 'admin' ? (
              <>
                <div className="admin-heading admin-heading-prominent admin-rentals-heading">
                  <div>
                    <p className="eyebrow">AREA AMMINISTRATORE · GESTIONE OPERATIVA</p>
                    <h1 id="admin-rentals-title">Noleggi <em>e disponibilità.</em></h1>
                    <p>Gestisci le richieste, conferma i periodi e tieni sotto controllo le auto occupate.</p>
                  </div>
                  <div className="admin-heading-actions">
                    <button className="button button-outline" type="button" onClick={() => navigateToPath('/admin')}>Inventario</button>
                    <button className="button button-outline" type="button" onClick={() => navigateToPath('/admin/messages')}>Messaggi e vendite</button>
                  </div>
                </div>
                <AdminSectionNavigation
                  active="rentals"
                  pendingPurchases={adminPurchaseRequests.filter((request) => request.status === 'pending').length}
                  pendingRentals={adminRentalRequests.filter((request) => request.status === 'pending').length}
                  onNavigate={navigateToPath}
                />
                <AdminRentalManager
                  vehicles={vehicles}
                  requests={adminRentalRequests}
                  loading={adminRentalRequestsLoading}
                  error={adminRentalRequestsError}
                  actionBusy={rentalRequestActionBusy}
                  actionStatus={rentalRequestActionStatus}
                  onUpdateStatus={updateRentalRequestStatus}
                />
              </>
            ) : (
              <AdminAccessPanel
                area="GESTIONE NOLEGGI"
                title={<>Accesso <em>riservato.</em></>}
                description="Accedi con un account amministratore per gestire richieste e disponibilità noleggio."
                accountNote={user ? 'L’account attualmente collegato non dispone dei permessi di amministratore.' : ''}
                onLogin={() => { setAuthMode('login'); setAuthError(''); }}
                onBack={() => navigateToHome('inventory')}
              />
            )}
          </section>
        ) : isAccountPage ? (
          <section className="account-page section-wrap" aria-labelledby="account-title">
            {user?.role === 'user' ? (
              <>
                <div className="account-page-heading">
                  <p className="eyebrow">LA TUA AREA PERSONALE</p>
                  <h1 id="account-title">{newlyRegisteredUser ? 'Benvenuto' : 'Bentornato'}, <em>{user.name}.</em></h1>
                  <p>Proposte, conversazioni private e acquisti: tutto raccolto in un unico spazio.</p>
                </div>
                <nav className="account-page-nav" aria-label="Sezioni area personale">
                  <button className="is-active" type="button" aria-current="page">Messaggi e acquisti</button>
                  <button type="button" onClick={() => navigateToHome('inventory')}>Scopri le auto</button>
                </nav>
                <section className="customer-requests" aria-labelledby="customer-requests-title">
                  <div className="section-heading"><div><p className="eyebrow">LE TUE PROPOSTE</p><h2 id="customer-requests-title">Valutazioni <em>e messaggi.</em></h2></div><p className="section-intro">Segui le risposte del concessionario e continua ogni conversazione qui.</p></div>
                  {mySellSubmissionLoading && <p className="reviews-status" role="status">Caricamento delle tue proposte…</p>}
                  {mySellSubmissionError && <p className="form-error" role="alert">{mySellSubmissionError}</p>}
                  {!mySellSubmissionLoading && !mySellSubmissionError && mySellSubmissions.length === 0 && <p className="reviews-status">Non hai ancora inviato proposte per vendere la tua auto.</p>}
                  <div className="customer-requests-list">
                    {mySellSubmissions.map((submission) => (
                      <article className="customer-request" key={submission.id}>
                        <div className="customer-request-header"><div><span className={`admin-submission-status status-${submission.status}`}>{{ new: 'Nuova', reviewing: 'In valutazione', contacted: 'Contattato', accepted: 'Accettata', countered: 'Controfferta ricevuta', rejected: 'Non accettata', closed: 'Chiusa' }[submission.status] || 'Nuova'}</span><h3>{submission.year} {submission.make} {submission.model}</h3>{submission.bodyType && <p className="customer-request-body-type"><VehicleBodyTypeIcon type={normalizeVehicleBodyType(submission.bodyType)} />{submission.bodyType}</p>}</div><time dateTime={submission.updatedAt || submission.createdAt}>{new Date(submission.updatedAt || submission.createdAt).toLocaleDateString('it-IT')}</time></div>
                        <div className="customer-request-gallery">
                          <button type="button" className="customer-request-gallery-control" aria-label="Foto precedenti" onClick={(event) => event.currentTarget.parentElement?.querySelector('.customer-request-images')?.scrollBy({ left: -180, behavior: 'smooth' })}>‹</button>
                          <div className="customer-request-images" role="region" aria-label={`Foto della proposta ${submission.make} ${submission.model}`} tabIndex={0}>{submission.images.map((image, index) => <a href={image} target="_blank" rel="noreferrer" aria-label={`Apri foto ${index + 1} di ${submission.make} ${submission.model}`} key={image}><ProgressiveImage className="customer-request-image" src={image} alt={`Foto ${index + 1} ${submission.make} ${submission.model}`} /></a>)}</div>
                          <button type="button" className="customer-request-gallery-control" aria-label="Foto successive" onClick={(event) => event.currentTarget.parentElement?.querySelector('.customer-request-images')?.scrollBy({ left: 180, behavior: 'smooth' })}>›</button>
                        </div>
                        {submission.status === 'accepted' && <div className="offer-counter-highlight"><span>Proposta accettata · Prezzo concordato</span><strong>{euro.format(submission.acceptedPrice || submission.askingPrice || 0)}</strong></div>}
                        {submission.counterPrice && submission.status !== 'accepted' && <div className="offer-counter-highlight"><span>Prezzo proposto dal concessionario</span><strong>{euro.format(submission.counterPrice)}</strong></div>}
                        <p className="customer-request-status">{submission.status === 'accepted' ? 'Il concessionario ha accettato di acquistare la tua auto al prezzo indicato. Ti contatterà per concludere.' : submission.status === 'countered' ? 'Il concessionario ha proposto un prezzo per la tua auto.' : submission.status === 'rejected' ? 'Il concessionario non può accettare questa proposta.' : submission.status === 'closed' ? 'La conversazione per questa proposta è stata chiusa.' : submission.status === 'reviewing' || submission.status === 'contacted' ? 'Il concessionario sta valutando la tua proposta.' : 'La tua proposta è stata ricevuta ed è in attesa di valutazione.'}</p>
                        {submission.status !== 'accepted' && <div className="submission-conversation">
                          <h4>Conversazione privata</h4>
                          {(submission.messages || []).length === 0 && <p className="customer-purchases-empty">Non ci sono ancora messaggi. Riceverai qui le risposte del concessionario.</p>}
                          {(submission.messages || []).map((message, index) => <article className={`submission-message${message.senderRole === 'user' ? ' from-customer' : ' from-admin'}`} key={`${message.createdAt}-${index}`}><span>{message.senderRole === 'admin' ? 'PelusoGroup' : 'Tu'}</span><p>{message.text}</p><time dateTime={message.createdAt}>{new Date(message.createdAt).toLocaleString('it-IT')}</time></article>)}
                          <form className="submission-message-form" onSubmit={(event) => sendSubmissionMessage(event, submission, 'customer')}>
                            <label className="visually-hidden" htmlFor={`customer-message-${submission.id}`}>Messaggio al concessionario</label><textarea id={`customer-message-${submission.id}`} name="text" rows="2" maxLength="1500" placeholder="Scrivi un messaggio al concessionario…" required />
                            <button className="button button-outline button-small" type="submit" disabled={submissionActionBusy === submission.id}>Invia messaggio</button>
                            {submissionMessageStatus.submissionId === submission.id && submissionMessageStatus.error && <p className="form-error" role="alert">{submissionMessageStatus.error}</p>}
                            {submissionMessageStatus.submissionId === submission.id && submissionMessageStatus.message && <p className="form-success" role="status">{submissionMessageStatus.message}</p>}
                          </form>
                        </div>}
                      </article>
                    ))}
                  </div>
                </section>
                <section className="customer-purchases customer-requested-purchases" aria-labelledby="customer-purchase-requests-title">
                  <div className="customer-purchases-heading"><p className="eyebrow">LE TUE RICHIESTE</p><h2 id="customer-purchase-requests-title">Auto che vuoi acquistare</h2><p>Il concessionario riceverà la richiesta e ti contatterà per verificare disponibilità e dettagli.</p></div>
                  {myPurchaseRequestsError && <p className="form-error" role="alert">{myPurchaseRequestsError}</p>}
                  {!myPurchaseRequestsError && myPurchaseRequests.length === 0 && <p className="customer-purchases-empty">Non hai ancora richiesto l’acquisto di un’auto.</p>}
                  <div className="customer-requests-list">
                    {myPurchaseRequests.map((request) => (
                      <article className="customer-request customer-buy-request" key={request.id}>
                        <ProgressiveImage className="customer-buy-request-image" src={request.vehicle.image || request.vehicle.images?.[0]} alt={`${request.vehicle.make} ${request.vehicle.model}`} />
                        <div>
                          <span className={`admin-submission-status ${request.status === 'accepted' ? 'status-accepted' : request.status === 'contacted' ? 'status-contacted' : 'status-reviewing'}`}>{request.status === 'accepted' ? 'Richiesta accettata' : request.status === 'contacted' ? 'Contattato' : 'Richiesta inviata'}</span>
                          <h3>{request.vehicle.year} {request.vehicle.make} {request.vehicle.model}</h3>
                          <p>Prezzo richiesto: <strong>{euro.format(request.vehicle.price)}</strong> · {getVehicleVatLabel(request.vehicle)}</p>
                          {request.vehicle.installmentPlan && <p>Possibilità rateale: <strong>{monthlyEuro.format(request.vehicle.installmentPlan.monthlyAmount)} al mese per {request.vehicle.installmentPlan.months} mesi</strong></p>}
                          <small>Richiesta del {new Date(request.createdAt).toLocaleDateString('it-IT')}</small>
                          {request.status === 'accepted' && <p>Il concessionario ha accettato la tua richiesta e ti contatterà per completare l’acquisto.</p>}
                          <div className="customer-buy-request-actions">
                            <button className="button button-danger button-small" type="button" onClick={() => deletePurchaseRequest(request)}>Rimuovi richiesta</button>
                            {purchaseRequestDeleteError.requestId === request.id && purchaseRequestDeleteError.error && <p className="form-error" role="alert">{purchaseRequestDeleteError.error}</p>}
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
                <section className="customer-purchases" aria-labelledby="customer-purchases-title">
                  <div className="customer-purchases-heading"><p className="eyebrow">ACQUISTI CONFERMATI</p><h2 id="customer-purchases-title">Le tue auto acquistate</h2><p>Se l’amministratore ha associato una vendita al tuo account, puoi lasciare qui una recensione verificata.</p></div>
                  {myPurchasesError && <p className="form-error" role="alert">{myPurchasesError}</p>}
                  {!myPurchasesError && myPurchases.length === 0 && <p className="customer-purchases-empty">Non risultano acquisti collegati a questo account.</p>}
                  {myPurchases.map((purchase) => <article className="customer-purchase" key={purchase.id}><ProgressiveImage className="customer-purchase-image" src={purchase.images[0]} alt="" /><div className="customer-purchase-info"><h3>{purchase.year} {purchase.make} {purchase.model}</h3><small>Acquistata il {new Date(purchase.soldAt).toLocaleDateString('it-IT')}</small>{purchase.review ? <p className="customer-review-complete">Hai già recensito quest’auto · {'★'.repeat(purchase.review.rating)}</p> : <form className="customer-review-form" onSubmit={(event) => handleCustomerReviewSubmit(event, purchase)}><label>La tua valutazione<SelectField name="rating" defaultValue="5" required><option value="5">★★★★★ · Eccellente</option><option value="4">★★★★☆ · Molto buona</option><option value="3">★★★☆☆ · Buona</option><option value="2">★★☆☆☆ · Da migliorare</option><option value="1">★☆☆☆☆ · Insoddisfacente</option></SelectField></label><label>Racconta la tua esperienza<textarea name="text" rows="3" minLength="10" maxLength="500" placeholder="Com’è stata l’esperienza con PelusoGroup? (massimo 500 caratteri)" required /></label><label className="review-name-consent"><input name="publishName" type="checkbox" required /><span>Acconsento a pubblicare la recensione con il mio nome (solo nome).</span></label>{reviewStatus.saleId === purchase.id && reviewStatus.error && <p className="form-error" role="alert">{reviewStatus.error}</p>}{reviewStatus.saleId === purchase.id && reviewStatus.message && <p className="form-success" role="status">{reviewStatus.message}</p>}<button className="button button-accent button-small" type="submit" disabled={reviewBusy}>{reviewBusy ? 'Pubblicazione…' : 'Pubblica recensione'} <span aria-hidden="true">↗</span></button></form>}</div></article>)}
                </section>
              </>
            ) : (
              <div className="admin-access-denied"><p className="eyebrow">AREA PERSONALE</p><h1>Accedi per continuare.</h1><p>Messaggi e acquisti sono visibili solo dal tuo account cliente.</p><button className="button button-accent" type="button" onClick={() => { setAuthMode('login'); setAuthError(''); }}>Accedi</button></div>
            )}
          </section>
        ) : isSellPage ? (
          <div className="dedicated-page dedicated-sell-page">{sellPageContent}</div>
        ) : isContactPage ? (
          <div className="dedicated-page dedicated-contact-page">{contactPageContent}</div>
        ) : (
          <>
        {!isCatalogPage && (
          <>
        <section className="hero" id="home">
          <div className="hero-image" />
          <div className="hero-content">
            <p className="eyebrow"><span /> PELUSOGROUP · CELLOLE</p>
            <h1>La strada giusta<br />parte da <em>qui.</em></h1>
            <p className="hero-copy">
              Acquistiamo auto usate e ti aiutiamo a trovare la prossima. Scopri le auto disponibili e le nostre soluzioni di noleggio.
            </p>
            <div className="hero-actions">
              <a className="button button-accent header-glossy-accent" href="/catalogo" onClick={(event) => {
                event.preventDefault();
                goToInventory('all');
              }}>
                Scopri le auto <span aria-hidden="true">↗</span>
              </a>
              <a className="text-link" href="#services" onClick={(event) => { event.preventDefault(); navigateToSection('services'); }}>Scopri i servizi <span aria-hidden="true">→</span></a>
            </div>
            <div className="hero-highlights" aria-label="I nostri servizi">
              <span>Compriamo e vendiamo</span><i aria-hidden="true" />
              <span>Noleggio</span><i aria-hidden="true" />
              <span>Valutazione auto</span>
            </div>
          </div>
          <div className="hero-caption"><span>DAL 19 MARZO 2017</span><span>AL TUO FIANCO, A CELLOLE</span></div>
          <a className="scroll-cue" href="/catalogo" onClick={(event) => { event.preventDefault(); goToInventory('all'); }}><span /> Scopri l’inventario</a>
        </section>

        {!isCatalogPage && <section className="popular-brands section-wrap" aria-labelledby="popular-brands-title">
          <div className="popular-brands-heading">
            <div className="popular-brands-copy">
              <p className="eyebrow">I MARCHI DEL NOSTRO CATALOGO</p>
              <h2 id="popular-brands-title">Esplora le auto <em>per marca.</em></h2>
              <p>Scegli un marchio per vedere subito le auto disponibili in catalogo.</p>
            </div>
            <div className="popular-brands-actions">
              {!inventoryLoading && availablePopularMakes.length > 0 && (
                <span className="popular-brands-count">
                  {availablePopularMakes.length} {availablePopularMakes.length === 1 ? 'marca disponibile' : 'marchi disponibili'}
                </span>
              )}
              <button className="popular-brands-all" type="button" onClick={() => goToInventory('all')}>
                Esplora tutto il catalogo <span aria-hidden="true">↗</span>
              </button>
            </div>
          </div>
          {inventoryLoading ? (
            <div className="popular-brands-grid" aria-hidden="true">
              {Array.from({ length: 6 }, (_, index) => (
                <div className="popular-brand-item popular-brand-skeleton" key={index}>
                  <div className="popular-brand-card popular-brand-skeleton-card">
                    <span className="skeleton-shimmer popular-brand-emblem" />
                  </div>
                  <span className="skeleton-shimmer skeleton-line popular-brand-name-skeleton" />
                  <span className="skeleton-shimmer skeleton-line popular-brand-status-skeleton" />
                </div>
              ))}
            </div>
          ) : inventoryError ? (
            <ContentErrorState
              title="Non riusciamo a caricare i marchi"
              message={inventoryError}
              onRetry={() => setInventoryReloadKey((key) => key + 1)}
            />
          ) : availablePopularMakes.length > 0 ? (
            <div className="popular-brands-grid">
              {availablePopularMakes.map(({ make, query, count }) => {
                const normalizedMake = make.toLocaleLowerCase('it').replace(/[^a-z0-9]/g, '');
                const logoPath = POPULAR_MAKE_LOGO_PATHS[normalizedMake];
                return (
                  <div className="popular-brand-item" key={make}>
                    <button
                      className={`popular-brand-card popular-brand-card-${normalizedMake}`}
                      type="button"
                      aria-label={`Mostra ${count} auto del marchio ${make}`}
                      title={`Mostra le auto ${make}`}
                      onClick={() => goToMake(query)}
                    >
                      <span className="popular-brand-emblem" aria-hidden="true">
                        {logoPath
                          ? <ProgressiveImage className="popular-brand-image" src={logoPath} alt="" loading="eager" fetchPriority="high" variant="compact" />
                          : <span className="popular-brand-monogram">{make.slice(0, 2).toLocaleUpperCase('it')}</span>}
                      </span>
                      <span className="popular-brand-arrow" aria-hidden="true">↗</span>
                    </button>
                    <span className="popular-brand-name">{make}</span>
                    <span className="popular-brand-availability">{count} {count === 1 ? 'auto disponibile' : 'auto disponibili'}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="popular-brands-empty">
              <p>Al momento non ci sono auto pubblicate nel catalogo.</p>
              <button type="button" onClick={() => goToInventory('all')}>Visita il catalogo <span aria-hidden="true">↗</span></button>
            </div>
          )}
        </section>}

        <section className="home-start section-wrap" aria-labelledby="home-start-title">
          <div className="home-start-heading">
            <div>
              <p className="eyebrow">SCOPRI I NOSTRI SERVIZI</p>
              <h2 id="home-start-title">Come possiamo <em>aiutarti?</em></h2>
            </div>
            <p>Acquisto, noleggio o vendita: scegli il servizio più adatto alle tue esigenze.</p>
          </div>
          <div className="home-path-grid">
            <article className="home-path-card">
              <span className="home-path-icon"><SiteIcon name="car" /></span>
              <span className="home-path-step">01 · ACQUISTO</span>
              <h3>Cerchi un’auto da acquistare?</h3>
              <p>Consulta le auto disponibili e confronta i dettagli per trovare quella giusta per te.</p>
              <button type="button" onClick={() => goToInventory('buy')}>Guarda le auto in vendita <span aria-hidden="true">↗</span></button>
            </article>
            <article className="home-path-card">
              <span className="home-path-icon"><SiteIcon name="key" /></span>
              <span className="home-path-step">02 · NOLEGGIO</span>
              <h3>Hai bisogno di un’auto a noleggio?</h3>
              <p>Scopri le auto disponibili e scegli quella più adatta al tuo viaggio o alla tua occasione.</p>
              <button type="button" onClick={() => goToInventory('rent')}>Scopri il noleggio <span aria-hidden="true">↗</span></button>
            </article>
            {user?.role !== 'admin' && (
              <article className="home-path-card">
                <span className="home-path-icon"><SiteIcon name="sell" /></span>
                <span className="home-path-step">03 · VALUTAZIONE</span>
                <h3>Vuoi vendere la tua auto?</h3>
                <p>Inviaci i dati e le foto: valuteremo la tua auto e ti ricontatteremo con una proposta riservata.</p>
                <button type="button" onClick={() => navigateToSection('sell-form')}>Richiedi una valutazione <span aria-hidden="true">↗</span></button>
              </article>
            )}
          </div>
          <div className="home-trust-line">
            <span className="home-trust-mark" aria-hidden="true"><SiteIcon name="pin" /></span>
            <p><strong>Dal 19 marzo 2017 siamo al tuo fianco.</strong> Ci trovi a Cellole, in provincia di Caserta.</p>
            <button type="button" onClick={() => navigateToSection('about')}>Scopri chi siamo <span aria-hidden="true">→</span></button>
          </div>
        </section>
          </>
        )}

        {isCatalogPage && (
        <section className="inventory-section section-wrap catalog-page-section" id="inventory">
          <div className="catalog-page-heading">
            <p className="eyebrow">CATALOGO AUTO · CELLOLE</p>
            <h1>Trova la tua prossima <em>auto.</em></h1>
            <p>Confronta le auto disponibili, filtra per le caratteristiche che contano e contattaci per ricevere informazioni su acquisto e noleggio.</p>
            <div className="catalog-benefits" aria-label="I vantaggi del catalogo PelusoGroup">
              <span><SiteIcon name="check" /> Dettagli chiari</span>
              <span><SiteIcon name="car" /> Vendita e noleggio</span>
              <span><SiteIcon name="phone" /> Supporto diretto</span>
            </div>
          </div>
          <div className="vehicle-body-type-filter" role="group" aria-label="Filtra per tipo di veicolo">
            {bodyTypeIconsLoaded ? (
              <div className="vehicle-body-type-buttons">
                {VEHICLE_BODY_TYPES.map((bodyType) => (
                  <button
                    type="button"
                    className={`vehicle-body-type-button${bodyTypeFilter === bodyType ? ' is-active' : ''}`}
                    key={bodyType}
                    aria-pressed={bodyTypeFilter === bodyType}
                    onClick={() => setBodyTypeFilter((currentType) => currentType === bodyType ? 'all' : bodyType)}
                  >
                    <VehicleBodyTypeIcon type={bodyType} />
                    <span>{bodyType}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="vehicle-body-type-loading" aria-hidden="true">
                {VEHICLE_BODY_TYPES.map((type) => <span className="vehicle-body-type-loading-card" key={type} />)}
              </div>
            )}
          </div>

          <div className="inventory-toolbar">
            <div className="filter-tabs" role="group" aria-label="Filtra le auto">
              {[
                ['all', 'Tutte'],
                ['buy', 'In vendita'],
                ['rent', 'A noleggio'],
              ].map(([value, label]) => (
                <button
                  className={filter === value ? 'filter-tab is-active' : 'filter-tab'}
                  key={value}
                  type="button"
                  aria-pressed={filter === value}
                  onClick={() => setFilter(value)}
                >
                  {label}
                </button>
              ))}
            </div>
            <button className="reset-filters" type="button" onClick={resetFilters}>
              {makeFilter !== 'all' ? 'Mostra tutte le auto' : 'Azzera filtri'}
            </button>
          </div>

          {filter === 'rent' && (
            <section className="rental-catalog-panel" aria-labelledby="rental-catalog-title">
              <div>
                <p className="eyebrow">NOLEGGIO AUTO · CELLOLE</p>
                <h2 id="rental-catalog-title">Scegli l’auto, <em>poi le date.</em></h2>
                <p>Apri una vettura, seleziona ritiro e riconsegna nel calendario e inviaci una richiesta. Ti ricontatteremo dopo aver verificato disponibilità e tariffa.</p>
              </div>
              <ol aria-label="Come funziona il noleggio">
                <li><span>01</span><strong>Seleziona un’auto</strong><small>Confronta tariffe giornaliere e dettagli.</small></li>
                <li><span>02</span><strong>Scegli il periodo</strong><small>Il calendario evidenzia i giorni già occupati.</small></li>
                <li><span>03</span><strong>Attendi conferma</strong><small>La richiesta non blocca l’auto.</small></li>
              </ol>
            </section>
          )}

          <div className="advanced-filters">
            <label className="search-field">
              <span className="search-icon" aria-hidden="true"><SiteIcon name="search" /></span>
              <span className="visually-hidden">Cerca marca, modello o colore</span>
              <input
                type="search"
                placeholder="Marca, modello o colore"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
            <label className="filter-control">
              <span><SiteIcon name="car" /> Marca</span>
              <SelectField value={makeFilter} onChange={(event) => setMakeFilter(event.target.value)}>
                <option value="all">Tutte le marche</option>
                {makes.map((make) => <option key={make} value={make}>{make}</option>)}
              </SelectField>
            </label>
            <label className="filter-control">
              <span><SiteIcon name="calendar" /> Anno</span>
              <SelectField value={yearFilter} onChange={(event) => setYearFilter(event.target.value)}>
                <option value="all">Qualsiasi anno</option>
                {years.map((year) => <option key={year} value={year}>{year}</option>)}
              </SelectField>
            </label>
            <label className="filter-control">
              <span><SiteIcon name="odometer" /> Km massimi</span>
              <SelectField value={maxKm} onChange={(event) => setMaxKm(event.target.value)}>
                <option value="">Qualsiasi</option>
                <option value="50000">Fino a 50.000 km</option>
                <option value="100000">Fino a 100.000 km</option>
                <option value="150000">Fino a 150.000 km</option>
              </SelectField>
            </label>
            <label className="filter-control">
              <span><SiteIcon name="price" /> Prezzo massimo (o al giorno)</span>
              <SelectField value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)}>
                <option value="">Qualsiasi prezzo</option>
                <option value="15000">Fino a 15.000 €</option>
                <option value="30000">Fino a 30.000 €</option>
                <option value="40000">Fino a 40.000 €</option>
              </SelectField>
            </label>
            <label className="filter-control">
              <span><SiteIcon name="sort" /> Ordina per</span>
              <SelectField value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
                <option value="recommended">Consigliate</option>
                <option value="price-asc">Prezzo crescente</option>
                <option value="price-desc">Prezzo decrescente</option>
                <option value="year-desc">Anno più recente</option>
                <option value="km-asc">Meno chilometri</option>
              </SelectField>
            </label>
          </div>
          {publicVehicleMetricsError && !inventoryError && <p className="inventory-feedback" role="status">Alcune statistiche potrebbero non essere disponibili al momento.</p>}
          {inventoryLoading && <p className="results-count" role="status">Stiamo preparando la selezione per te…</p>}
          {!inventoryLoading && !inventoryError && (
            <p className="results-count" id="catalog-results" aria-live="polite">
              {filteredVehicles.length === 0
                ? 'Nessuna auto trovata'
                : filteredVehicles.length === 1
                  ? '1 auto trovata'
                  : `Visualizzate ${(catalogPage - 1) * CATALOG_PAGE_SIZE + 1}–${Math.min(catalogPage * CATALOG_PAGE_SIZE, filteredVehicles.length)} di ${filteredVehicles.length} auto`}
            </p>
          )}

          <div className={`vehicle-grid${inventoryLoading || inventoryError ? ' is-loading-or-error' : ''}`}>
            {inventoryLoading ? (
              <InventorySkeletonCards />
            ) : inventoryError ? (
              <ContentErrorState title="Non riusciamo a caricare le auto" message={inventoryError} onRetry={() => setInventoryReloadKey((key) => key + 1)} />
            ) : catalogPageVehicles.map((vehicle) => (
              <article className="vehicle-card" key={vehicle.id}>
                <a className="vehicle-detail-link" href={`/auto/${vehicle.id}`} aria-label={`Dettagli ${vehicle.make} ${vehicle.model}, ${kilometer.format(vehicle.viewCount || 0)} visualizzazioni${vehicle.type === 'buy' ? `, ${kilometer.format(publicVehicleMetricsById.get(vehicle.id)?.purchaseRequests || 0)} richieste d'acquisto` : ''}`} onClick={(event) => { event.preventDefault(); openVehicle(vehicle.id); }}>
                <div className="vehicle-image-wrap">
                  <ProgressiveImage src={vehicle.image} alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`} className="vehicle-card-image" />
                  <span className="vehicle-type">{vehicle.type === 'rent' ? 'NOLEGGIO' : 'IN VENDITA'}</span>
                  <div className="vehicle-engagement" aria-label={`Statistiche ${vehicle.make} ${vehicle.model}`}>
                    <span><SiteIcon name="eye" /> {kilometer.format(vehicle.viewCount || 0)} visualizzazioni</span>
                    {vehicle.type === 'buy' && <span><SiteIcon name="people" /> {kilometer.format(publicVehicleMetricsById.get(vehicle.id)?.purchaseRequests || 0)} richieste</span>}
                  </div>
                </div>
                </a>
                <div className="vehicle-info">
                  <div className="vehicle-title-row">
                    <div>
                      <p className="vehicle-make">{vehicle.make} · {vehicle.year} · {vehicle.color}</p>
                      <h3><a href={`/auto/${vehicle.id}`} onClick={(event) => { event.preventDefault(); openVehicle(vehicle.id); }}>{vehicle.model}</a></h3>
                    </div>
                  </div>
                  <div className="vehicle-meta">
                    <span>{kilometer.format(vehicle.mileageKm)} km</span>
                    <span className="meta-divider" />
                    <span>{vehicle.type === 'rent' ? 'Tariffa giornaliera' : 'Disponibile subito'}</span>
                  </div>
                  <div className="vehicle-price-row">
                    <span className="vehicle-price-value">
                      <strong>{euro.format(vehicle.price)}{vehicle.type === 'rent' ? ' / giorno' : ''}</strong>
                      {vehicle.type === 'buy' && <small className="vehicle-vat-note">{getVehicleVatLabel(vehicle)}</small>}
                    </span>
                    <div className="vehicle-actions">
                      <button className="vehicle-enquire" type="button" onClick={() => openVehicle(vehicle.id)}>
                        Info <span aria-hidden="true">→</span>
                      </button>
                      <button
                        className={!user
                          ? 'vehicle-add is-login-required'
                          : cart.includes(vehicle.id) ? 'vehicle-add is-added' : 'vehicle-add'}
                        type="button"
                        aria-label={!user
                          ? `Accedi per selezionare ${vehicle.model}`
                          : cart.includes(vehicle.id) ? `${vehicle.model} già nella selezione` : `Aggiungi ${vehicle.model} alla selezione`}
                        onClick={() => addToCart(vehicle)}
                      >
                        {!user ? 'Accedi per selezionare' : cart.includes(vehicle.id) ? 'Aggiunta ✓' : '+ Seleziona'}
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
            {!inventoryError && filteredVehicles.length === 0 && !inventoryLoading && (
              <div className="empty-results">
                <strong>{vehicles.length === 0 ? 'Stiamo preparando nuove auto.' : 'Non abbiamo trovato auto con questi filtri.'}</strong>
                <p>{vehicles.length === 0
                  ? 'Torna presto a visitare il catalogo oppure contattaci per parlarci di ciò che cerchi.'
                  : 'Prova a modificare la ricerca o rimuovi alcuni filtri per vedere altri risultati.'}</p>
                <button className="button button-accent button-small" type="button" onClick={resetFilters}>Mostra tutte le auto</button>
              </div>
            )}
          </div>
          {catalogPageCount > 1 && (
            <nav className="catalog-pagination" aria-label="Pagine del catalogo">
              <button
                className="catalog-page-button"
                type="button"
                disabled={catalogPage === 1}
                onClick={() => {
                  setCatalogPage((page) => page - 1);
                  document.getElementById('catalog-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
              >
                <span aria-hidden="true">←</span> Precedente
              </button>
              <span className="catalog-page-indicator">Pagina <strong>{catalogPage}</strong> di {catalogPageCount}</span>
              <button
                className="catalog-page-button"
                type="button"
                disabled={catalogPage === catalogPageCount}
                onClick={() => {
                  setCatalogPage((page) => page + 1);
                  document.getElementById('catalog-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
              >
                Successiva <span aria-hidden="true">→</span>
              </button>
            </nav>
          )}
          {recommendedCatalogVehicles.length > 0 && (
            <section className="catalog-recommendations" aria-labelledby="catalog-recommendations-title">
              <div className="catalog-recommendations-heading">
                <div>
                  <p className="eyebrow">UNA SCELTA IN PIÙ</p>
                  <h2 id="catalog-recommendations-title">Potrebbe <em>interessarti.</em></h2>
                </div>
                <p>Altre auto selezionate in base alla tipologia e alla fascia di prezzo che stai esplorando.</p>
              </div>
              <div className="catalog-recommendations-grid">
                {recommendedCatalogVehicles.map((vehicle) => (
                  <button
                    className="catalog-recommendation-card"
                    key={vehicle.id}
                    type="button"
                    onClick={() => openVehicle(vehicle.id)}
                    aria-label={`Scopri ${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                  >
                    <ProgressiveImage src={vehicle.image} alt="" className="catalog-recommendation-image" />
                    <span className="catalog-recommendation-info">
                      <small>{vehicle.type === 'rent' ? 'A NOLEGGIO' : 'IN VENDITA'} · {vehicle.year}</small>
                      <strong>{vehicle.make} {vehicle.model}</strong>
                      <span>{kilometer.format(vehicle.mileageKm)} km</span>
                      <em>{euro.format(vehicle.price)}{vehicle.type === 'rent' ? ' / giorno' : ''}</em>
                      {vehicle.type === 'buy' && <small className="vehicle-vat-note">{getVehicleVatLabel(vehicle)}</small>}
                    </span>
                    <span className="catalog-recommendation-arrow" aria-hidden="true">↗</span>
                  </button>
                ))}
              </div>
            </section>
          )}
          <p className="inventory-note">Vuoi saperne di più su un’auto? Apri la scheda o contatta il nostro team per disponibilità e dettagli.</p>
        </section>
        )}

        {!isCatalogPage && (
          <>
        <section className="sold-cars-section section-wrap" aria-labelledby="sold-cars-title">
          <div className="section-heading">
            <div>
              <p className="eyebrow">AUTO VENDUTE</p>
              <h2 id="sold-cars-title">Le auto che hanno<br /><em>già trovato casa.</em></h2>
            </div>
            <p className="section-intro">Scopri alcune delle auto consegnate ai nostri clienti.</p>
          </div>
          <ol className="sold-cars-steps" aria-label="Le tre tappe dell’acquisto">
            <li className="sold-cars-step">
              <span className="sold-cars-step-icon"><SiteIcon name="sell" /></span>
              <span className="sold-cars-step-copy"><small>01</small>Richiesta d’acquisto</span>
            </li>
            <li className="sold-cars-step">
              <span className="sold-cars-step-icon"><SiteIcon name="payment" /></span>
              <span className="sold-cars-step-copy"><small>02</small>Pagamento</span>
            </li>
            <li className="sold-cars-step">
              <span className="sold-cars-step-icon"><SiteIcon name="delivery" /></span>
              <span className="sold-cars-step-copy"><small>03</small>Consegna</span>
            </li>
          </ol>
          {salesLoading ? (
            <div className="horizontal-carousel-frame">
              <div ref={soldCarsTrackRef} id="sold-cars-track" className="sold-cars-grid sold-cars-loading" role="status" aria-label="Caricamento delle auto consegnate">
                <SoldCarsSkeletonCards />
              </div>
            </div>
          ) : salesError ? (
            <ContentErrorState title="Le storie di consegna non sono disponibili" message={salesError} onRetry={() => setSalesReloadKey((key) => key + 1)} />
          ) : sales.length ? (
            <div className="horizontal-carousel-frame">
              <div
                ref={soldCarsTrackRef}
                id="sold-cars-track"
                className="sold-cars-grid"
                onScroll={() => updateCarouselFocus(soldCarsTrackRef, setFocusedSoldCarIndex)}
                onKeyDown={(event) => {
                  if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
                    event.preventDefault();
                    scrollCarousel(soldCarsTrackRef, event.key === 'ArrowRight' ? 1 : -1);
                  }
                }}
                tabIndex={0}
                aria-label="Auto consegnate, scorri orizzontalmente"
              >
                {sales.map((sale, index) => (
                  <article className={`sold-car-card${sales.length > 1 && focusedSoldCarIndex === index ? ' is-focused' : ''}`} key={sale.id}>
                    <div className="sold-car-image">
                      <ProgressiveImage src={sale.images[0]} alt={`${sale.year} ${sale.make} ${sale.model}, auto venduta`} className="sold-car-main-image" />
                      <span className="sold-car-status"><i aria-hidden="true" /> CONSEGNATA</span>
                    </div>
                    <div className="sold-car-info">
                      <p>{sale.year} · {new Date(sale.soldAt).toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })}</p>
                      <h3>{sale.make} <em>{sale.model}</em></h3>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ) : (
            <p className="sold-cars-empty">Le auto acquistate dai clienti appariranno qui.</p>
          )}
          {!salesLoading && !salesError && sales.length > 1 && (
            <div className="horizontal-carousel-controls" aria-label="Scorri le auto consegnate">
              <button type="button" aria-label="Auto consegnate precedenti" onClick={() => scrollCarousel(soldCarsTrackRef, -1)}><SiteIcon name="chevronLeft" /></button>
              <button type="button" aria-label="Auto consegnate successive" onClick={() => scrollCarousel(soldCarsTrackRef, 1)}><SiteIcon name="chevronRight" /></button>
            </div>
          )}
          <div className="sold-cars-footer">
            <span>La prossima storia potrebbe essere la tua.</span>
            <button type="button" onClick={() => goToInventory('buy')}>Trova la tua auto <span aria-hidden="true">↗</span></button>
          </div>
        </section>

        <section className="services-section" id="services">
          <div className="section-wrap">
            <div className="section-heading">
              <div>
                <p className="eyebrow">AL TUO FIANCO, IN OGNI SCELTA</p>
                <h2>Un team. <em>Tre modi per aiutarti.</em></h2>
              </div>
                <p className="section-intro">Ti accompagniamo nella scelta della tua prossima auto, nella vendita della tua vettura o nel noleggio.</p>
            </div>
            <div className="service-grid">
              <article className="service-card">
                <span className="service-number">01</span>
                <span className="service-symbol"><SiteIcon name="car" /></span>
                <h3>Acquista un’auto</h3>
                <p>Scopri le auto in vendita, con dettagli chiari e supporto per scegliere quella più adatta a te.</p>
                <a href="/catalogo" onClick={(event) => { event.preventDefault(); navigateToPath('/catalogo'); }}>Vai al catalogo <span aria-hidden="true">→</span></a>
              </article>
              <article className="service-card">
                <span className="service-number">02</span>
                <span className="service-symbol"><SiteIcon name="key" /></span>
                <h3>Vivi l’esperienza</h3>
                <p>Scopri le auto a noleggio per un viaggio, un’occasione speciale o ogni volta che ti serve.</p>
                <button type="button" onClick={() => goToInventory('rent')}>
                  Scopri i noleggi <span aria-hidden="true">→</span>
                </button>
              </article>
              <article className="service-card">
                <span className="service-number">03</span>
                <span className="service-symbol"><SiteIcon name="sell" /></span>
                <h3>Compriamo la tua auto</h3>
                <p>Inviaci i dati e le foto: valuteremo la tua auto e ti ricontatteremo con una proposta riservata.</p>
                <button type="button" onClick={() => navigateToSection('sell-form')}>Richiedi una valutazione <span aria-hidden="true">→</span></button>
              </article>
            </div>
          </div>
        </section>

        <section className="about-section section-wrap" id="about" aria-labelledby="about-title">
          <div className="about-visual">
            <img className="about-section-logo" src="/images/logo.png" alt="PelusoGroup Automobile" />
            <div className="about-image">
              <ProgressiveImage
                src="/images/pelusogroup-luxury-car-handover.png"
                alt="Consegna di un'auto a un cliente davanti al salone PelusoGroup"
                className="about-main-image"
              />
              <div className="about-image-caption">
                <span>PELUSOGROUP · CELLOLE</span>
                <strong>Una storia di famiglia,<br />dal 2017.</strong>
              </div>
              <span className="image-stamp">DAL<br />2017</span>
            </div>
          </div>
          <div className="about-copy">
            <p className="eyebrow">UNA PASSIONE, UN RAPPORTO DIRETTO</p>
            <h2 id="about-title">La tua prossima auto<br />inizia da <em>qui.</em></h2>
            <p>
              PelusoGroup è un’attività di famiglia fondata dai fratelli Gerardo e Luigi Peluso.
              Dal 19 marzo 2017 accogliamo a Cellole chi cerca un’auto da acquistare, una soluzione
              di noleggio o una valutazione per la propria vettura.
            </p>
            <p>
              Ascoltiamo le tue esigenze, condividiamo le informazioni con chiarezza e ti seguiamo
              con un contatto diretto in ogni fase. Ci trovi a Cellole, in provincia di Caserta.
            </p>
            <div className="about-values" aria-label="I nostri valori">
              <article><span>01</span><strong>Esperienza di famiglia</strong><small>Un’attività costruita nel tempo, con attenzione alle persone.</small></article>
              <article><span>02</span><strong>Informazioni chiare</strong><small>Dettagli e risposte utili per scegliere con consapevolezza.</small></article>
              <article><span>03</span><strong>Contatto diretto</strong><small>Parli con Gerardo e Luigi per acquisto, vendita o noleggio.</small></article>
            </div>
            <div className="peluso-team-heading">
              <p className="eyebrow">SIAMO QUI PER TE</p>
              <h3>Parla direttamente con <em>Gerardo e Luigi.</em></h3>
              <p>Chiamaci o scrivici su WhatsApp: ti risponderemo per aiutarti con la tua richiesta.</p>
            </div>
            <div className="peluso-team" aria-label="Contatti dei fratelli Peluso">
              <article className="team-card">
                <span className="team-initials" aria-hidden="true">LP</span>
                <div className="team-card-info">
                  <h3>Luigi Peluso</h3>
                  <span>Vendite e consulenza</span>
                  <a href="mailto:luigi_peluso26@proton.me">luigi_peluso26@proton.me</a>
                  <div className="team-card-actions">
                    <a className="team-contact-button" href="tel:+393204569082"><SiteIcon name="phone" /> Chiama</a>
                    <a className="team-contact-button team-whatsapp-button" href={LUIGI_WHATSAPP_LINK} target="_blank" rel="noopener noreferrer"><SiteIcon name="whatsapp" /> WhatsApp</a>
                  </div>
                  <a className="team-phone-number" href="tel:+393204569082">+39 320 456 9082</a>
                </div>
              </article>
              <article className="team-card">
                <span className="team-initials" aria-hidden="true">GP</span>
                <div className="team-card-info">
                  <h3>Gerardo Peluso</h3>
                  <span>Accoglienza e assistenza</span>
                  <a href="mailto:gerardo_peluso@gmail.com">gerardo_peluso@gmail.com</a>
                  <div className="team-card-actions">
                    <a className="team-contact-button" href={`tel:+${GERARDO_PHONE_NUMBER}`}><SiteIcon name="phone" /> Chiama</a>
                    <a className="team-contact-button team-whatsapp-button" href={GERARDO_WHATSAPP_LINK} target="_blank" rel="noopener noreferrer"><SiteIcon name="whatsapp" /> WhatsApp</a>
                  </div>
                  <a className="team-phone-number" href={`tel:+${GERARDO_PHONE_NUMBER}`}>{GERARDO_PHONE_DISPLAY}</a>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section className="reviews-section section-wrap" aria-labelledby="reviews-title">
          <div className="reviews-heading">
            <div>
              <p className="eyebrow">RECENSIONI VERIFICATE</p>
              <h2 id="reviews-title">Esperienze <em>condivise.</em></h2>
            </div>
            {user?.role !== 'user' && (
              <button className="text-link reviews-login-link" type="button" onClick={() => { setAuthError(''); setAuthMode('login'); }}>
                Accedi per lasciare una recensione dopo l’acquisto <span aria-hidden="true">↗</span>
              </button>
            )}
          </div>
          <p className="reviews-intro">Le recensioni sono disponibili solo per chi ha acquistato un’auto: l’amministratore collega la vendita all’account del cliente.</p>
          {customerReviewsLoading ? (
            <div className="horizontal-carousel-frame">
              <div ref={customerReviewsTrackRef} id="customer-reviews-track" className="customer-reviews-grid reviews-loading" role="status" aria-label="Caricamento delle recensioni">
                <ReviewsSkeletonCards />
              </div>
            </div>
          ) : customerReviewsError ? (
            <ContentErrorState title="Le recensioni non sono al momento disponibili" message={customerReviewsError} onRetry={() => setCustomerReviewsReloadKey((key) => key + 1)} />
          ) : customerReviews.length ? (
            <div className="horizontal-carousel-frame">
              <div
                ref={customerReviewsTrackRef}
                id="customer-reviews-track"
                className="customer-reviews-grid"
                onScroll={() => updateCarouselFocus(customerReviewsTrackRef, setFocusedReviewIndex)}
                onKeyDown={(event) => {
                  if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
                    event.preventDefault();
                    scrollCarousel(customerReviewsTrackRef, event.key === 'ArrowRight' ? 1 : -1);
                  }
                }}
                tabIndex={0}
                aria-label="Recensioni, scorri orizzontalmente"
              >
                {customerReviews.map((review, index) => (
                  <article className={`customer-review-card${customerReviews.length > 1 && focusedReviewIndex === index ? ' is-focused' : ''}`} key={review.id}>
                    <div className="customer-review-rating" aria-label={`${review.rating} stelle su 5`}>
                      {Array.from({ length: 5 }, (_, index) => (
                        <span className={index < review.rating ? 'is-filled' : ''} aria-hidden="true" key={index}>★</span>
                      ))}
                    </div>
                    <p
                      tabIndex={review.text.length > 200 ? 0 : undefined}
                      aria-label={review.text.length > 200 ? 'Testo completo della recensione, scorri per leggerlo' : undefined}
                    >
                      {review.text}
                    </p>
                    <div className="customer-review-author">
                      <span>{review.authorName}</span>
                      <time dateTime={review.createdAt}>{new Date(review.createdAt).toLocaleDateString('it-IT')}</time>
                    </div>
                    <span className="customer-review-vehicle">{review.year} {review.make} {review.model}</span>
                    {review.image && <ProgressiveImage className="customer-review-car-image vehicle-image-glossy" src={review.image} alt={`${review.year} ${review.make} ${review.model} recensita`} />}
                  </article>
                ))}
              </div>
            </div>
          ) : (
            <p className="reviews-status">Non ci sono ancora recensioni. Dopo l’acquisto, il cliente potrà condividere la propria esperienza dal suo account.</p>
          )}
          {!customerReviewsLoading && !customerReviewsError && customerReviews.length > 1 && (
            <div className="horizontal-carousel-controls" aria-label="Scorri le recensioni">
              <button type="button" aria-label="Recensioni precedenti" onClick={() => scrollCarousel(customerReviewsTrackRef, -1)}><SiteIcon name="chevronLeft" /></button>
              <button type="button" aria-label="Recensioni successive" onClick={() => scrollCarousel(customerReviewsTrackRef, 1)}><SiteIcon name="chevronRight" /></button>
            </div>
          )}
        </section>
          </>
        )}
          </>
        )}
      </main>

      {!activeVehicle && !isUnknownVehiclePage && !isAdminArea && !isAccountPage && <footer className="site-footer">
        <div className="footer-main">
          <div className="footer-brand-column">
            <a className="brand brand-footer" href="/" onClick={(event) => { event.preventDefault(); navigateToHome(); }}>
              <img className="brand-logo" src="/images/logo.png" alt="PelusoGroup" />
              <span className="italian-flag" role="img" aria-label="Bandiera italiana"><i /><i /><i /></span>
            </a>
            <p className="footer-tagline">La strada, a modo tuo.</p>
            <p className="footer-history">
              Dal 19 marzo 2017, Gerardo e Luigi Peluso aiutano chi ama l’auto a scegliere con attenzione e un rapporto diretto.
            </p>
            <button className="footer-primary-link" type="button" onClick={() => navigateToSection('inventory')}>
              Trova la tua prossima auto <span aria-hidden="true">↗</span>
            </button>
            <nav className="footer-social-links" aria-label="Social e contatti">
              <a className="footer-social-link footer-social-whatsapp" href={GERARDO_WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" aria-label="Contatta Gerardo su WhatsApp">
                <SiteIcon name="whatsapp" />
                <span>WhatsApp</span>
              </a>
              <a className="footer-social-link" href="https://www.facebook.com/PelusoGroup/" target="_blank" rel="noopener noreferrer" aria-label="Visita la pagina Facebook PelusoGroup">
                <SiteIcon name="facebook" />
                <span>Facebook</span>
              </a>
            </nav>
          </div>
          <div className="footer-column">
            <h2>PelusoGroup</h2>
            <a href="/#about" onClick={(event) => { event.preventDefault(); navigateToHome('about'); }}>Chi siamo</a>
            <a href="/#services" onClick={(event) => { event.preventDefault(); navigateToHome('services'); }}>I nostri servizi</a>
            <a href="/catalogo" onClick={(event) => { event.preventDefault(); navigateToPath('/catalogo'); }}>Auto disponibili</a>
            {user?.role !== 'admin' && <a href="/vendi-auto" onClick={(event) => { event.preventDefault(); navigateToPath('/vendi-auto'); }}>Vendi la tua auto</a>}
            {user?.role !== 'admin' && <a href="/contatti" onClick={(event) => { event.preventDefault(); navigateToPath('/contatti'); }}>Contattaci</a>}
          </div>
          <div className="footer-column">
            <h2>Area personale</h2>
            <button type="button" onClick={() => { if (user) handleLogout(); else setAuthMode('signup'); }}>
              {user ? 'Esci dal tuo account' : 'Crea un account'}
            </button>
            {user?.role === 'admin'
              ? <a href="/admin" onClick={(event) => { event.preventDefault(); navigateToPath('/admin'); }}>Area amministratore</a>
              : <button type="button" onClick={() => { if (!user) { setAuthMode('login'); return; } setCartOpen(true); }}>La mia selezione ({cart.length})</button>}
          </div>
          {user?.role !== 'admin' && <div className="footer-column footer-contact-column">
            <h2>Parla con noi</h2>
            <div className="footer-contact-person">
              <strong>Luigi Peluso <span>Vendite e consulenza</span></strong>
              <a href="tel:+393204569082"><SiteIcon name="phone" /> +39 320 456 9082</a>
              <a href="mailto:luigi_peluso26@proton.me"><SiteIcon name="mail" /> luigi_peluso26@proton.me</a>
            </div>
            <div className="footer-contact-person">
              <strong>Gerardo Peluso <span>Accoglienza e assistenza</span></strong>
              <a href={`tel:+${GERARDO_PHONE_NUMBER}`}><SiteIcon name="phone" /> {GERARDO_PHONE_DISPLAY}</a>
              <a className="footer-whatsapp-contact" href={GERARDO_WHATSAPP_LINK} target="_blank" rel="noopener noreferrer"><SiteIcon name="whatsapp" /> Scrivi su WhatsApp</a>
              <a href="mailto:gerardo_peluso@gmail.com"><SiteIcon name="mail" /> gerardo_peluso@gmail.com</a>
            </div>
            <a className="footer-address" href="https://maps.google.com/?q=Via+delle+Monache+17,+81030+Cellole+CE" target="_blank" rel="noreferrer">
              <SiteIcon name="pin" />
              <span><strong>Vieni a trovarci</strong>Via delle Monache, 17<br />81030 Cellole (CE), Italia</span>
              <span aria-hidden="true">↗</span>
            </a>
          </div>}
        </div>
        <section className="footer-hours" aria-labelledby="footer-hours-title">
          <div className="footer-hours-heading">
            <span className="footer-hours-icon"><SiteIcon name="clock" /></span>
            <div>
              <p className="eyebrow">TI ASPETTIAMO A CELLOLE</p>
              <h2 id="footer-hours-title">Orari di apertura</h2>
            </div>
          </div>
          <div className="footer-hours-grid">
            <div className="footer-hours-day">
              <strong>Lunedì – venerdì</strong>
              <span><time dateTime="09:00">09:00</time> – <time dateTime="13:00">13:00</time></span>
              <span><time dateTime="15:00">15:00</time> – <time dateTime="20:00">20:00</time></span>
            </div>
            <div className="footer-hours-day">
              <strong>Sabato</strong>
              <span><time dateTime="09:00">09:00</time> – <time dateTime="13:00">13:00</time></span>
              <span className="footer-hours-closed">Pomeriggio chiuso</span>
            </div>
            <div className="footer-hours-day is-closed">
              <strong>Domenica e festivi</strong>
              <span>Chiuso</span>
            </div>
          </div>
        </section>
        <section className="footer-purchase-info" aria-labelledby="footer-purchase-info-title">
          <div className="footer-purchase-info-heading">
            <p className="eyebrow">CHIAREZZA, PRIMA DI TUTTO</p>
            <h2 id="footer-purchase-info-title">Informazioni d’acquisto</h2>
            <p>Ogni auto ha caratteristiche e condizioni specifiche: chiedici i dettagli prima di procedere.</p>
          </div>
          <div className="footer-purchase-info-grid">
            <article>
              <strong>Prezzi e IVA</strong>
              <p>Il regime IVA e l’eventuale detraibilità dipendono dal singolo veicolo e dalla situazione dell’acquirente. Verifica la scheda e chiedi conferma al team.</p>
            </article>
            <article>
              <strong>Garanzia</strong>
              <p>Copertura e durata sono indicate per ciascun veicolo e nel relativo contratto, secondo la normativa applicabile.</p>
            </article>
            <article>
              <strong>Passaggio e costi</strong>
              <p>Costi di passaggio di proprietà, eventuali servizi aggiuntivi e condizioni finali vengono comunicati prima dell’acquisto.</p>
            </article>
            <article>
              <strong>Finanziamento</strong>
              <p>Eventuali soluzioni di finanziamento sono soggette a disponibilità e approvazione dell’ente finanziatore. Richiedi un preventivo personalizzato.</p>
            </article>
          </div>
        </section>
        <div className="footer-business-note">
          <div>
            <strong>Peluso Group Auto</strong>
            <span>Via delle Monache, 17 · 81030 Cellole (CE), Italia</span>
            <span>Partita IVA: 04195760618</span>
          </div>
          <p>Prezzi, disponibilità e condizioni possono variare in base al veicolo: contattaci per una conferma aggiornata.</p>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} Peluso Group Auto · Tutti i diritti riservati</span>
          <a href={isCatalogPage ? '/catalogo' : '/#home'} onClick={(event) => { event.preventDefault(); if (isCatalogPage) navigateToPath('/catalogo'); else navigateToHome(); }}>Torna all’inizio ↑</a>
        </div>
      </footer>}

      {!isAdminArea && !isAccountPage && !isUnknownVehiclePage && user?.role !== 'admin' && (
        <a
          className="whatsapp-floating-link"
          href={GERARDO_WHATSAPP_LINK}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Contatta l’amministratore Gerardo su WhatsApp"
        >
          <SiteIcon name="whatsapp" />
        </a>
      )}

      {confirmDialog && (
        <div className="modal-backdrop confirm-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !confirmDialogBusy) setConfirmDialog(null); }}>
          <section className="confirm-modal" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-description">
            <span className="confirm-icon" aria-hidden="true">!</span>
            <p className="eyebrow">CONFERMA AZIONE</p>
            <h2 id="confirm-title">{confirmDialog.title}</h2>
            <p id="confirm-description">{confirmDialog.message}</p>
            {confirmDialogError && <p className="form-error" role="alert">{confirmDialogError}</p>}
            <div className="confirm-actions">
              <button className="button button-outline" type="button" disabled={confirmDialogBusy} onClick={() => setConfirmDialog(null)}>Annulla</button>
              <button className="button button-danger" type="button" autoFocus disabled={confirmDialogBusy} onClick={runConfirmDialog}>{confirmDialogBusy ? 'Attendi…' : confirmDialog.confirmLabel}</button>
            </div>
          </section>
        </div>
      )}

      {authMode && (
        <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !adminPinRequired) closeAuth(); }}>
          <section className="auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-title">
            <button className={`modal-close${adminPinRequired ? ' modal-exit' : ''}`} type="button" aria-label={adminPinRequired ? 'Esci e annulla la verifica' : 'Chiudi la finestra'} onClick={adminPinRequired ? handleLogout : closeAuth}><svg className="close-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg></button>
            <a className="brand modal-brand" href="#home" onClick={(event) => { if (adminPinRequired) event.preventDefault(); else closeAuth(); }}>
              <img className="brand-logo" src="/images/logo.png" alt="PelusoGroup" />
            </a>
            <p className="eyebrow">{adminPinRequired ? 'VERIFICA AMMINISTRATORE' : authMode === 'signup' ? 'IL TUO PROSSIMO VIAGGIO' : 'BENTORNATO'}</p>
            <h2 id="auth-title">{adminPinRequired ? 'Conferma la tua identità.' : authMode === 'signup' ? 'Crea il tuo account.' : 'Che piacere rivederti.'}</h2>
            <p className="auth-intro">
              {adminPinRequired
                ? 'Inserisci il codice amministratore di 4 cifre per completare l’accesso. Dopo 3 tentativi errati l’account viene sospeso per 30 minuti.'
                : authMode === 'signup' ? 'Salva i tuoi dati e preparati alla prossima partenza.' : 'Accedi per continuare da dove eri rimasto.'}
            </p>
            <form className="auth-form" onSubmit={handleAuthSubmit}>
              {adminPinRequired ? (
                <label>
                  Codice di verifica
                  <span className="password-input-wrap">
                    <input name="pin" type={passwordVisible ? 'text' : 'password'} inputMode="numeric" pattern="[0-9]{4}" autoComplete="one-time-code" maxLength="4" placeholder="••••" aria-label="Codice amministratore di 4 cifre" required autoFocus />
                    <VisibilityToggle visible={passwordVisible} onToggle={() => setPasswordVisible((visible) => !visible)} />
                  </span>
                </label>
              ) : authMode === 'signup' && (
                <label>
                  Nome e cognome
                  <input name="name" type="text" autoComplete="name" minLength="2" maxLength="80" required />
                </label>
              )}
              {!adminPinRequired && (
                <>
                  <label>
                    {authMode === 'signup' ? 'Indirizzo email' : 'Nome utente o indirizzo email'}
                    <input
                      name="email"
                      type={authMode === 'signup' ? 'email' : 'text'}
                      autoComplete={authMode === 'signup' ? 'email' : 'username'}
                      maxLength="254"
                      placeholder={authMode === 'signup' ? 'nome@esempio.it' : 'Email'}
                      required
                    />
                  </label>
                  <label>
                    Password
                    <span className="password-input-wrap">
                      <input name="password" type={passwordVisible ? 'text' : 'password'} autoComplete={authMode === 'signup' ? 'new-password' : 'current-password'} minLength="8" maxLength="72" required />
                      <VisibilityToggle visible={passwordVisible} onToggle={() => setPasswordVisible((visible) => !visible)} />
                    </span>
                    {authMode === 'signup' && <small>Inserisci almeno 8 caratteri.</small>}
                  </label>
                </>
              )}
              {authError && <p className="form-error" role="alert">{authError}</p>}
              <button className="button button-accent form-submit header-glossy-accent" type="submit" disabled={authBusy}>
                {authBusy ? 'Attendi…' : adminPinRequired ? 'Verifica codice' : authMode === 'signup' ? 'Crea account' : 'Accedi'} <span aria-hidden="true">↗</span>
              </button>
            </form>
            {!adminPinRequired && <p className="auth-switch">
              {authMode === 'signup' ? 'Hai già un account?' : 'È la tua prima volta su PelusoGroup?'}
              {' '}
              <button
                type="button"
                onClick={() => { setAuthMode(authMode === 'signup' ? 'login' : 'signup'); setAuthError(''); setPasswordVisible(false); }}
              >
                {authMode === 'signup' ? 'Accedi' : 'Crea un account'}
              </button>
            </p>}
          </section>
        </div>
      )}
    </div>
  );
}

export default App;
