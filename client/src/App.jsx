import { Children, isValidElement, lazy, memo, Suspense, useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { MotionConfig, animate, motion, useReducedMotion } from 'motion/react';
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BadgeEuro,
  Bell,
  CalendarDays,
  CarFront,
  ChartNoAxesCombined,
  Check,
  Circle,
  ClipboardList,
  Clock3,
  CircleAlert,
  Copy,
  CreditCard,
  Download,
  Eye,
  Fingerprint,
  Home,
  ImagePlus,
  Info,
  KeyRound,
  ListFilter,
  LockKeyhole,
  LogOut,
  Mail,
  Maximize2,
  Minimize2,
  MapPin,
  Menu,
  PanelLeftOpen,
  SlidersHorizontal,
  Pencil,
  Plus,
  Quote,
  RefreshCw,
  Save,
  Search,
  ShieldCheck,
  Smartphone,
  Star,
  Tag,
  Trash2,
  TriangleAlert,
  Truck,
  TrendingUp,
  UsersRound,
  UserRound,
  UserPlus,
  Wrench,
  WifiOff,
  X,
  Zap,
} from 'lucide-react';
import { Cell, Pie, PieChart } from 'recharts';
import { loadRouteStyles } from './routeStyles';
import cookiePolicy from '../../legal/COOKIE-POLICY.md?raw';
import legalNotes from '../../legal/NOTE-LEGALI.md?raw';
import privacyPolicy from '../../legal/PRIVACY-POLICY.md?raw';
import termsConditions from '../../legal/TERMINI-CONDIZIONI.md?raw';

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
const CATALOG_PAGE_SIZE = 10;
const VEHICLE_VAT_MODES = ['inclusive', 'exclusive', 'not-applied'];
const COOKIE_CONSENT_STORAGE_KEY = 'pelusogroup-cookie-consent';
const LEGAL_DOCUMENTS = {
  '/privacy': { title: 'Informativa privacy', eyebrow: 'PRIVACY E DATI PERSONALI', content: privacyPolicy },
  '/termini-condizioni': { title: 'Termini e condizioni', eyebrow: 'REGOLE DEL SERVIZIO', content: termsConditions },
  '/cookie-policy': { title: 'Cookie Policy', eyebrow: 'COOKIE E PREFERENZE', content: cookiePolicy },
  '/note-legali': { title: 'Note legali', eyebrow: 'INFORMAZIONI SOCIETARIE', content: legalNotes },
};
const HOME_FAQ_ITEMS = [
  {
    question: 'Come trovo l’auto più adatta alle mie esigenze?',
    answer: 'Nel catalogo puoi esplorare le auto in vendita e a noleggio e usare i filtri per restringere la ricerca. Apri la scheda di una vettura per consultare i dettagli e inviare una richiesta.',
  },
  {
    question: 'Dove posso consultare caratteristiche e prezzo di un’auto?',
    answer: 'Apri la scheda della vettura dal catalogo: trovi immagini, chilometraggio, caratteristiche principali e prezzo aggiornato, oltre alle opzioni per chiedere informazioni o fissare una visita.',
  },
  {
    question: 'Inviare una richiesta di acquisto mi obbliga a comprare l’auto?',
    answer: 'No. La richiesta serve per ricevere informazioni e avviare un contatto con il team. Prezzo, disponibilità e condizioni vengono verificati e concordati prima di procedere.',
  },
  {
    question: 'Posso fissare una visita per vedere un’auto?',
    answer: 'Sì. Dalla scheda dell’auto puoi inviare una richiesta di visita indicando data e orario preferiti. La visita si considera confermata solo dopo la risposta del team.',
  },
  {
    question: 'Come funziona una richiesta di noleggio?',
    answer: 'Apri la scheda dell’auto, scegli le date di ritiro e riconsegna nel calendario e invia la richiesta. Non blocca l’auto né le date: il team verifica la disponibilità e ti conferma tariffa e condizioni.',
  },
  {
    question: 'È possibile chiedere un finanziamento?',
    answer: 'Le eventuali soluzioni dipendono dalla vettura, dalla disponibilità e dall’approvazione dell’ente finanziatore. Contattaci per un preventivo personalizzato.',
  },
  {
    question: 'Come posso proporre la mia auto?',
    answer: 'Invia i dati e le foto dalla pagina “Vendi auto”. La proposta è privata e non viene pubblicata automaticamente nel catalogo.',
  },
  {
    question: 'La valutazione della mia auto è gratuita?',
    answer: 'Sì. La valutazione è gratuita e viene effettuata in meno di 24 ore. Se si raggiunge un accordo, possiamo concordare anche il ritiro.',
  },
  {
    question: 'È possibile organizzare il ritiro o la consegna dell’auto?',
    answer: 'Possiamo concordare il ritiro dell’auto che vendi o la consegna di quella acquistata. Zona, tempi, disponibilità ed eventuali costi dipendono dal veicolo.',
  },
  {
    question: 'Ci sono costi oltre al prezzo dell’auto?',
    answer: 'Eventuali costi di passaggio di proprietà, servizi aggiuntivi e condizioni finali vengono comunicati prima dell’acquisto.',
  },
];
const ADMIN_SECURITY_EVENT_LABELS = {
  ip_rule_added: 'Regola IP aggiunta',
  ip_rule_removed: 'Regola IP rimossa',
  traffic_limits_updated: 'Limiti aggiornati',
  password_changed: 'Password modificata',
  pin_changed: 'PIN modificato',
  email_verification_requested: 'Verifica email richiesta',
  email_updated: 'Email principale aggiornata',
  notification_email_added: 'Email notifiche aggiunta',
  notification_email_removed: 'Email notifiche rimossa',
  ip_blocked: 'IP bloccato',
  ip_throttled: 'Richieste IP limitate',
  traffic_limit_reached: 'Soglia di traffico raggiunta',
  admin_account_created: 'Account amministratore creato',
  admin_account_removed: 'Account amministratore rimosso',
};
const CATALOG_FILTERS_STORAGE_KEY = 'pelusogroup-catalog-filters';
const ADMIN_PIN_CHALLENGE_LIFETIME_MS = 60 * 1000;
const DEFAULT_CATALOG_FILTERS = {
  filter: 'all',
  makeFilter: 'all',
  bodyTypeFilter: 'all',
  yearFilter: 'all',
  modelFilter: '',
  colorFilter: '',
  doorsFilter: '',
  drivetrainFilter: '',
  noviceDriverFilter: '',
  fuelFilter: '',
  transmissionFilter: '',
  maxKm: '',
  maxPrice: '',
  maxPower: '',
  search: '',
  sortBy: 'recommended',
};
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
const RentalDatePicker = lazy(() => import('./RentalDatePicker'));
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
const formatAdminPinCountdown = (totalSeconds) => {
  const seconds = Math.max(0, Math.floor(totalSeconds || 0));
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
};
const getVehicleVatMode = (vehicle) => (
  VEHICLE_VAT_MODES.includes(vehicle?.vatMode) ? vehicle.vatMode : 'inclusive'
);
const getVehicleVatLabel = (vehicle) => ({
  inclusive: 'IVA inclusa',
  exclusive: 'IVA esclusa · 22% da aggiungere',
  'not-applied': 'IVA non applicata',
}[getVehicleVatMode(vehicle)]);
const getVehicleDiscountPrice = (vehicle, now = Date.now()) => {
  const discountPrice = Number(vehicle?.discountPrice);
  const price = Number(vehicle?.price);
  const discountEndTime = vehicle?.discountEndsAt == null || vehicle.discountEndsAt === ''
    ? Infinity
    : new Date(vehicle.discountEndsAt).getTime();
  return vehicle?.type === 'buy'
    && Number.isFinite(discountPrice)
    && discountPrice > 0
    && discountPrice < price
    && discountEndTime > now
    ? discountPrice
    : null;
};
const getVehicleCurrentPrice = (vehicle) => getVehicleDiscountPrice(vehicle) ?? Number(vehicle?.price);
const formatLocalDateInput = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return '';
  const pad = (part) => String(part).padStart(2, '0');
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
};
const formatDateForInput = (date) => {
  const pad = (part) => String(part).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};
const parseDateTimeInTimeZone = (dateValue, timeValue, timeZone) => {
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateValue || '');
  const timeMatch = /^(\d{2}):(\d{2})$/.exec(timeValue || '');
  if (!dateMatch || !timeMatch) return null;

  const [, yearText, monthText, dayText] = dateMatch;
  const [, hourText, minuteText] = timeMatch;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const hour = Number(hourText);
  const minute = Number(minuteText);
  const targetDate = new Date(0);
  targetDate.setUTCFullYear(year, month - 1, day);
  targetDate.setUTCHours(hour, minute, 0, 0);
  if (
    targetDate.getUTCFullYear() !== year
    || targetDate.getUTCMonth() !== month - 1
    || targetDate.getUTCDate() !== day
    || hour > 23
    || minute > 59
  ) return null;

  const targetTimestamp = targetDate.getTime();
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  });
  const getOffset = (timestamp) => {
    const parts = Object.fromEntries(formatter.formatToParts(new Date(timestamp)).map((part) => [part.type, part.value]));
    return Date.UTC(
      Number(parts.year),
      Number(parts.month) - 1,
      Number(parts.day),
      Number(parts.hour),
      Number(parts.minute),
      Number(parts.second),
    ) - timestamp;
  };
  const firstCandidate = targetTimestamp - getOffset(targetTimestamp);
  const timestamp = targetTimestamp - getOffset(firstCandidate);
  const localParts = Object.fromEntries(formatter.formatToParts(new Date(timestamp)).map((part) => [part.type, part.value]));
  if (
    Number(localParts.year) !== year
    || Number(localParts.month) !== month
    || Number(localParts.day) !== day
    || Number(localParts.hour) !== hour
    || Number(localParts.minute) !== minute
  ) return null;
  return new Date(timestamp);
};
const parseLocalDiscountEndDate = (value) => {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value.trim());
  if (!match) return null;
  const [, dayText, monthText, yearText] = match;
  const day = Number(dayText);
  const month = Number(monthText);
  const year = Number(yearText);
  const date = new Date(year, month - 1, day, 23, 59, 59, 999);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return date;
};
const formatDiscountTimeRemaining = (remainingMilliseconds) => {
  const totalSeconds = Math.max(0, Math.ceil(remainingMilliseconds / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (value) => String(value).padStart(2, '0');
  return days
    ? `${days}g ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
    : `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
};
function downloadCsvFile(filename, rows) {
  const csv = rows.map((row) => row.map((value) => {
    let text = String(value ?? '');
    if (typeof value === 'string' && /^[\t\r ]*[=+\-@]/.test(text)) text = `'${text}`;
    return `"${text.replace(/"/g, '""')}"`;
  }).join(';')).join('\r\n');
  const file = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' });
  const fileUrl = URL.createObjectURL(file);
  const downloadLink = document.createElement('a');
  downloadLink.href = fileUrl;
  downloadLink.download = filename;
  document.body.append(downloadLink);
  downloadLink.click();
  downloadLink.remove();
  window.setTimeout(() => URL.revokeObjectURL(fileUrl), 0);
}

const VehicleDiscountPrice = memo(function VehicleDiscountPrice({ vehicle, priceElement = 'strong', priceClassName = '', dailySuffixSmall = false, vatLabel = null, showCountdown = true, onExpire }) {
  const [now, setNow] = useState(Date.now());
  const discountPrice = getVehicleDiscountPrice(vehicle, now);
  const discountEndTime = vehicle?.discountEndsAt ? new Date(vehicle.discountEndsAt).getTime() : NaN;
  const hasCountdown = discountPrice !== null && Number.isFinite(discountEndTime);

  useEffect(() => {
    if (!hasCountdown) return undefined;
    const intervalId = window.setInterval(() => {
      const currentTime = Date.now();
      setNow(currentTime);
      if (discountEndTime <= currentTime) onExpire?.();
    }, 1000);
    return () => window.clearInterval(intervalId);
  }, [hasCountdown, discountEndTime, onExpire]);

  const PriceElement = priceElement;
  const priceClassNames = [
    discountPrice !== null ? 'vehicle-discounted-price' : '',
    priceClassName,
  ].filter(Boolean).join(' ');
  const remainingTime = hasCountdown ? formatDiscountTimeRemaining(discountEndTime - now) : '';
  return (
    <>
      <span className="vehicle-discount-price-line">
        {discountPrice !== null && <del className="vehicle-original-price">{euro.format(vehicle.price)}</del>}
        <PriceElement className={priceClassNames || undefined}>
          {euro.format(discountPrice ?? Number(vehicle.price))}
          {vehicle.type === 'rent' && (dailySuffixSmall ? <small> / giorno</small> : ' / giorno')}
        </PriceElement>
        {vatLabel && <small className="vehicle-vat-note vehicle-price-vat">{vatLabel}</small>}
      </span>
      {hasCountdown && showCountdown && (
        <small className="vehicle-discount-countdown" aria-label={`Lo sconto scade tra ${remainingTime}`} aria-live="off">
          <svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6.25" /><path d="M8 4.5V8l2.2 1.4" /></svg>
          <span className="vehicle-discount-countdown-label">Scade tra</span>
          <time className="vehicle-discount-countdown-time" dateTime={new Date(discountEndTime).toISOString()}>{remainingTime}</time>
        </small>
      )}
      {discountPrice !== null && !hasCountdown && <small className="vehicle-discount-permanent">Sconto permanente</small>}
    </>
  );
});
const GERARDO_PHONE_NUMBER = '393473368745';
const DEFAULT_SITE_SETTINGS = {
  businessName: 'PelusoGroup',
  siteTitle: 'PelusoGroup — La tua prossima auto',
  contactEmail: '',
  contactPhone: '',
  vatNumber: '04195760618',
  address: 'Via delle Monache, 17, 81030 Cellole (CE), Italia',
  timezone: 'Europe/Rome',
  logoUrl: '/images/logo.png',
  faviconUrl: '/favicon.svg',
  heroImageUrl: '/images/mercedes-amg-c63-hero.jpg',
  staffContacts: [
    { id: 'luigi', name: 'Luigi Peluso', role: 'Vendite e consulenza', email: 'luigi_peluso26@proton.me', phone: '+39 320 456 9082', whatsapp: '393204569082' },
    { id: 'gerardo', name: 'Gerardo Peluso', role: 'Accoglienza e assistenza', email: 'gerardo_peluso@gmail.com', phone: '+39 347 336 8745', whatsapp: GERARDO_PHONE_NUMBER },
  ],
  openingHours: [
    ...['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].map((day) => ({
      day, closed: false, morningOpen: '09:00', morningClose: '13:00', afternoonOpen: '15:00', afternoonClose: '20:00',
    })),
    { day: 'saturday', closed: false, morningOpen: '09:00', morningClose: '13:00', afternoonOpen: '', afternoonClose: '' },
    { day: 'sunday', closed: true, morningOpen: '', morningClose: '', afternoonOpen: '', afternoonClose: '' },
  ],
  holidays: [],
  announcement: null,
  maintenanceMode: false,
  maintenanceMessage: 'Stiamo aggiornando il sito. Torna tra poco.',
  offlineMode: false,
  offlineMessage: 'Il sito è temporaneamente offline. Riprova più tardi.',
  adminAccessEnabled: false,
};
const WEEKDAY_LABELS = {
  monday: 'Lunedì',
  tuesday: 'Martedì',
  wednesday: 'Mercoledì',
  thursday: 'Giovedì',
  friday: 'Venerdì',
  saturday: 'Sabato',
  sunday: 'Domenica',
};

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

function readCatalogFilters() {
  try {
    const storedFilters = JSON.parse(window.localStorage.getItem(CATALOG_FILTERS_STORAGE_KEY) || 'null');
    if (!storedFilters || typeof storedFilters !== 'object' || Array.isArray(storedFilters)) {
      return { ...DEFAULT_CATALOG_FILTERS };
    }

    return {
      filter: ['all', 'buy', 'rent'].includes(storedFilters.filter) ? storedFilters.filter : 'all',
      makeFilter: typeof storedFilters.makeFilter === 'string' ? storedFilters.makeFilter : 'all',
      bodyTypeFilter: VEHICLE_BODY_TYPES.includes(storedFilters.bodyTypeFilter) ? storedFilters.bodyTypeFilter : 'all',
      yearFilter: typeof storedFilters.yearFilter === 'string' ? storedFilters.yearFilter : 'all',
      modelFilter: typeof storedFilters.modelFilter === 'string' ? storedFilters.modelFilter : '',
      colorFilter: typeof storedFilters.colorFilter === 'string' ? storedFilters.colorFilter : '',
      doorsFilter: ['1', '2', '3', '4', '5', '6', '7', '8'].includes(storedFilters.doorsFilter) ? storedFilters.doorsFilter : '',
      drivetrainFilter: typeof storedFilters.drivetrainFilter === 'string' ? storedFilters.drivetrainFilter : '',
      noviceDriverFilter: ['', 'yes', 'no', 'unknown'].includes(storedFilters.noviceDriverFilter) ? storedFilters.noviceDriverFilter : '',
      fuelFilter: typeof storedFilters.fuelFilter === 'string' ? storedFilters.fuelFilter : '',
      transmissionFilter: typeof storedFilters.transmissionFilter === 'string' ? storedFilters.transmissionFilter : '',
      maxKm: ['50000', '100000', '150000'].includes(storedFilters.maxKm) ? storedFilters.maxKm : '',
      maxPrice: ['15000', '30000', '40000'].includes(storedFilters.maxPrice) ? storedFilters.maxPrice : '',
      maxPower: ['100', '150', '200', '300', '450'].includes(storedFilters.maxPower) ? storedFilters.maxPower : '',
      search: typeof storedFilters.search === 'string' ? storedFilters.search : '',
      sortBy: ['recommended', 'price-asc', 'price-desc', 'year-desc', 'km-asc'].includes(storedFilters.sortBy)
        ? storedFilters.sortBy
        : 'recommended',
    };
  } catch (error) {
    console.error('Impossibile leggere i filtri del catalogo salvati:', error);
    return { ...DEFAULT_CATALOG_FILTERS };
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

const VehicleBodyTypeIcon = memo(function VehicleBodyTypeIcon({ type }) {
  const iconPath = VEHICLE_BODY_TYPE_ICON_PATHS[type];
  return iconPath
    ? <ProgressiveImage className="vehicle-body-type-icon" src={iconPath} alt="" loading="eager" fetchPriority="high" variant="compact" />
    : null;
});

const MakeLogo = memo(function MakeLogo({ make }) {
  const normalizedMake = make.toLocaleLowerCase('it').replace(/[^a-z0-9]/g, '');
  const logoPath = POPULAR_MAKE_LOGO_PATHS[normalizedMake];
  return (
    <span className="admin-analytics-make-logo" role="img" aria-label={`Logo ${make}`}>
      {logoPath
        ? <ProgressiveImage className="admin-make-logo-image" src={logoPath} alt="" loading="eager" fetchPriority="high" variant="compact" fallback={<span>{make.slice(0, 2).toLocaleUpperCase('it')}</span>} />
        : <span>{make.slice(0, 2).toLocaleUpperCase('it')}</span>}
    </span>
  );
});

const VehicleBodyTypeOptions = memo(function VehicleBodyTypeOptions({ name = 'bodyType', defaultValue = '', required = true, className = '' }) {
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
});

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

const FeatureIcon = memo(function FeatureIcon({ feature }) {
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
});

const SiteIcon = memo(function SiteIcon({ name, className = '' }) {
  const paths = {
    car: <><path d="m5 11 1.5-4.2A2 2 0 0 1 8.4 5.5h7.2a2 2 0 0 1 1.9 1.3L19 11" /><path d="M3.5 11.5h17v6h-17zM6.5 17.5v2m11-2v2M6 14.5h.01M18 14.5h.01M4 11.5l-1.5-2m17.5 2 1.5-2" /></>,
    key: <><circle cx="8" cy="15" r="4.25" /><path d="m11 12 8.5-8.5M16 7l2 2m-5-1 2 2" /></>,
    sell: <><path d="M4 4h9l7 7-9 9-7-7z" /><circle cx="9" cy="9" r="1.2" /><path d="m11 14 2 2 4-4" /></>,
    truck: <><path d="M3 6h11v12H3zM14 10h4l3 3v5h-7z" /><circle cx="7.5" cy="18" r="2" /><circle cx="17.5" cy="18" r="2" /><path d="M17 10v3h4" /></>,
    delivery: <><path d="M4 7h10v10H4zM14 10h4l3 3v4h-7z" /><path d="M7 4h4m-2-2v4m-2-2h4" /><circle cx="7.5" cy="18" r="2" /><circle cx="17.5" cy="18" r="2" /></>,
    check: <><path d="M20 11.1V12a8 8 0 1 1-4.7-7.3" /><path d="m8.5 11.5 3 3L21 5" /></>,
    close: <><path d="m6 6 12 12M18 6 6 18" /></>,
    send: <><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></>,
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
    chart: <><path d="M4 19V5M4 19h16" /><path d="m7 15 3-4 3 2 5-7" /><path d="M15 6h3v3" /></>,
    settings: <><path d="M4 3v18M12 3v18M20 3v18" /><circle cx="4" cy="8" r="2" /><circle cx="12" cy="15" r="2" /><circle cx="20" cy="10" r="2" /></>,
    legal: <><path d="M6 3h8l4 4v14H6z" /><path d="M14 3v5h5M9 12h6M9 16h6" /><path d="M9 8h1" /></>,
    audit: <><path d="M5 4h14v16H5z" /><path d="M8 8h8M8 12h8M8 16h5" /><path d="m16 16 2 2 3-3" /></>,
    home: <><path d="m3.5 10 8.5-7 8.5 7v10.5H14v-6h-4v6H3.5V10Z" /><path d="M8 7.5h.01" /></>,
    cart: <><path d="M3 4h2l2.2 10.1a2 2 0 0 0 2 1.6h8.5a2 2 0 0 0 1.9-1.4L21 8H6" /><circle cx="10" cy="20" r="1.2" /><circle cx="18" cy="20" r="1.2" /></>,
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
});

const CartIcon = memo(function CartIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 4h2l2.2 10.1a2 2 0 0 0 2 1.6h8.5a2 2 0 0 0 1.9-1.4L21 8H6" />
      <circle cx="10" cy="20" r="1.2" />
      <circle cx="18" cy="20" r="1.2" />
    </svg>
  );
});

const VehicleInterestGauge = memo(function VehicleInterestGauge({ rate, requests, views, partial = false, partialNote = '', statusNote = '' }) {
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
});

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

const WarrantyCoverageField = memo(function WarrantyCoverageField({ editingVehicle }) {
  const [isOpen, setIsOpen] = useState(false);
  const toggleOpen = useCallback(() => setIsOpen((open) => !open), []);
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
        onClick={toggleOpen}
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
});

const SelectField = ({ name, value, defaultValue, onChange, children, disabled, required, className, ariaLabel }) => {
  const id = useId();
  const rootRef = useRef(null);
  const optionRefs = useRef([]);
  const popoverRef = useRef(null);
  const [popoverStyle, setPopoverStyle] = useState(null);
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
      if (!rootRef.current?.contains(event.target) && !popoverRef.current?.contains(event.target)) setOpen(false);
    }
    document.addEventListener('pointerdown', closeOnOutsideClick);
    return () => document.removeEventListener('pointerdown', closeOnOutsideClick);
  }, [open]);

  useEffect(() => {
    if (!open) {
      setPopoverStyle(null);
      return undefined;
    }
    if (!rootRef.current?.closest('.advanced-filters')) {
      setPopoverStyle(null);
      return undefined;
    }

    let frame = 0;
    function positionCatalogPopover() {
      if (!rootRef.current || !popoverRef.current) return;
      const trigger = rootRef.current.querySelector('.custom-select-trigger');
      if (!trigger) return;
      const triggerRect = trigger.getBoundingClientRect();
      const popoverRect = popoverRef.current.getBoundingClientRect();
      const width = Math.min(
        Math.max(triggerRect.width, 220),
        Math.max(240, window.innerWidth - 24),
      );
      const height = popoverRect.height;
      const margin = 8;
      const below = window.innerHeight - triggerRect.bottom - margin;
      const above = triggerRect.top - margin;
      let left = triggerRect.left;
      left = Math.max(margin, Math.min(left, window.innerWidth - width - margin));
      let top = triggerRect.bottom + 6;
      if ((height > below || below < 220) && above > below) {
        top = Math.max(margin, triggerRect.top - height - 6);
      }
      top = Math.max(margin, Math.min(top, window.innerHeight - height - margin));

      setPopoverStyle({
        position: 'fixed',
        zIndex: 80,
        top,
        left,
        right: 'auto',
        width,
        maxHeight: Math.min(320, window.innerHeight - 24),
      });
    }

    frame = window.requestAnimationFrame(positionCatalogPopover);
    window.addEventListener('resize', positionCatalogPopover);
    window.addEventListener('scroll', positionCatalogPopover, true);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('resize', positionCatalogPopover);
      window.removeEventListener('scroll', positionCatalogPopover, true);
    };
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
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => setOpen((isOpen) => !isOpen)}
        onKeyDown={handleTriggerKeyDown}
      >
        <span className={!selectedOption ? 'custom-select-placeholder' : ''}>{selectedOption?.label ?? options[0]?.label ?? 'Seleziona un’opzione'}</span>
        <svg className="custom-select-chevron" viewBox="0 0 16 16" aria-hidden="true"><path d="m3 6 5 5 5-5" /></svg>
      </button>
      {open && popoverStyle && (
        createPortal(
          <div
            ref={popoverRef}
            className="custom-select-popover"
            id={`${id}-listbox`}
            role="listbox"
            aria-labelledby={id}
            style={popoverStyle}
          >
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
          </div>,
          document.body,
        )
      )}
      {open && !popoverStyle && (
        <div
          ref={popoverRef}
          className="custom-select-popover"
          id={`${id}-listbox`}
          role="listbox"
          aria-labelledby={id}
        >
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
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.toLowerCase().includes('json')) {
    if (response.status === 404 && url.startsWith('/api/vehicle-price-offers')) {
      throw new Error('Il servizio delle proposte di prezzo non è disponibile sul server. Riavvia o aggiorna il backend e riprova.');
    }
    throw new Error(`Il server ha restituito una risposta non valida${response.status ? ` (HTTP ${response.status})` : ''}. Riprova più tardi.`);
  }
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

async function downloadAdminReport(reportType, filters) {
  const query = new URLSearchParams({ format: filters.format });
  ['from', 'to', 'eventType', 'ipAddress', 'search'].forEach((field) => {
    if (filters[field]) query.set(field, filters[field]);
  });
  let response;
  try {
    response = await fetch(`/api/admin/reports/${reportType}?${query.toString()}`, { credentials: 'include' });
  } catch {
    throw new Error('Connessione al server non riuscita. Verifica la connessione e riprova.');
  }
  if (!response.ok) {
    let message = 'Non è stato possibile generare il report.';
    try {
      const data = await response.json();
      message = data.error || message;
    } catch {
      // The server may return a non-JSON error for a failed download.
    }
    throw new Error(message);
  }
  const blob = await response.blob();
  const disposition = response.headers.get('content-disposition') || '';
  const filename = disposition.match(/filename="([^"]+)"/i)?.[1] || `pelusogroup-${reportType}.${filters.format}`;
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function AdminReportExportButton({ reportType, label = 'Esporta report' }) {
  const isSecurityReport = reportType === 'security-audit';
  const today = new Date().toISOString().slice(0, 10);
  const defaultFrom = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const rootRef = useRef(null);
  const [filters, setFilters] = useState({ format: 'pdf', from: defaultFrom, to: today, eventType: '', ipAddress: '', search: '' });

  useEffect(() => {
    if (!open) return undefined;
    function closeOnOutsideInteraction(event) {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    }
    function closeOnEscape(event) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('pointerdown', closeOnOutsideInteraction);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideInteraction);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [open]);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await downloadAdminReport(reportType, filters);
      setOpen(false);
    } catch (exportError) {
      setError(exportError.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div ref={rootRef} className="admin-report-export">
      <button className="admin-utility-secondary-button" type="button" onClick={() => { setOpen((current) => !current); setError(''); }}>
        <Download size={15} aria-hidden="true" /> {label}
      </button>
      {open && (
        <form className="admin-report-export-panel" onSubmit={submit}>
          <strong>Configura esportazione</strong>
          <label>Formato
            <SelectField className="admin-report-export-select" value={filters.format} onChange={(event) => setFilters((current) => ({ ...current, format: event.target.value }))} ariaLabel="Formato esportazione">
              <option value="pdf">PDF professionale</option>
              <option value="xlsx">Excel (.xlsx)</option>
              <option value="json">JSON tecnico</option>
            </SelectField>
          </label>
          <div className="admin-report-export-date-grid">
            <label>Dal<input type="date" value={filters.from} max={filters.to || today} onChange={(event) => setFilters((current) => ({ ...current, from: event.target.value }))} required /></label>
            <label>Al<input type="date" value={filters.to} min={filters.from} max={today} onChange={(event) => setFilters((current) => ({ ...current, to: event.target.value }))} required /></label>
          </div>
          {isSecurityReport && <label>Tipo evento
            <SelectField className="admin-report-export-select" value={filters.eventType} onChange={(event) => setFilters((current) => ({ ...current, eventType: event.target.value }))} ariaLabel="Tipo evento">
              <option value="">Tutti gli eventi</option>
              {Object.entries(ADMIN_SECURITY_EVENT_LABELS).map(([value, eventLabel]) => <option value={value} key={value}>{eventLabel}</option>)}
            </SelectField>
          </label>}
          {isSecurityReport && <label>Indirizzo IP<input value={filters.ipAddress} maxLength="45" placeholder="Facoltativo" onChange={(event) => setFilters((current) => ({ ...current, ipAddress: event.target.value }))} /></label>}
          <label>Ricerca nei dettagli<input value={filters.search} maxLength="120" placeholder="Facoltativa" onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))} /></label>
          {error && <p className="admin-utility-message is-error" role="alert">{error}</p>}
          <button className="admin-utility-primary-button" type="submit" disabled={busy}>{busy ? 'Generazione…' : 'Scarica report'}</button>
        </form>
      )}
    </div>
  );
}

function AdminLegalDocumentDownloadButton({ document: legalDocument }) {
  const [open, setOpen] = useState(false);
  const [format, setFormat] = useState('pdf');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    function closeOnOutsideInteraction(event) {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    }
    function closeOnEscape(event) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('pointerdown', closeOnOutsideInteraction);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideInteraction);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [open]);

  async function download(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const response = await fetch(`/api/admin/reports/legal-documents/${encodeURIComponent(legalDocument.slug)}?format=${format}`, {
        credentials: 'include',
      });
      if (!response.ok) {
        let message = 'Non è stato possibile scaricare il documento.';
        try {
          const data = await response.json();
          message = data.error || message;
        } catch {
          // Keep the user-facing fallback for non-JSON download errors.
        }
        throw new Error(message);
      }
      const blob = await response.blob();
      const disposition = response.headers.get('content-disposition') || '';
      const filename = disposition.match(/filename="([^"]+)"/i)?.[1] || `pelusogroup-${legalDocument.slug}.${format}`;
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.append(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
      setOpen(false);
    } catch (downloadError) {
      setError(downloadError.message || 'Download non riuscito.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div ref={rootRef} className="admin-report-export admin-legal-document-download">
      <button className="admin-utility-secondary-button" type="button" onClick={() => { setOpen((current) => !current); setError(''); }}>
        <Download size={15} aria-hidden="true" /> Scarica documento
      </button>
      {open && (
        <form className="admin-report-export-panel" onSubmit={download}>
          <strong>Formato documento</strong>
          <label>Formato
            <SelectField className="admin-report-export-select" value={format} onChange={(event) => setFormat(event.target.value)} ariaLabel={`Formato ${legalDocument.title}`}>
              <option value="pdf">PDF professionale</option>
              <option value="xlsx">Excel (.xlsx)</option>
              <option value="json">JSON tecnico</option>
            </SelectField>
          </label>
          {error && <p className="admin-utility-message is-error" role="alert">{error}</p>}
          <button className="admin-utility-primary-button" type="submit" disabled={busy}>{busy ? 'Preparazione…' : 'Scarica documento'}</button>
        </form>
      )}
    </div>
  );
}

function VehicleDownloadButton({ vehicleId }) {
  const [format, setFormat] = useState('pdf');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function download(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const response = await fetch(`/api/vehicles/export/${encodeURIComponent(vehicleId)}?format=${format}`, { credentials: 'include' });
      if (!response.ok) {
        let message = 'Non è stato possibile scaricare la scheda auto.';
        try {
          const data = await response.json();
          message = data.error || message;
        } catch {
          // Keep the user-facing fallback for non-JSON download errors.
        }
        throw new Error(message);
      }
      const blob = await response.blob();
      const disposition = response.headers.get('content-disposition') || '';
      const filename = disposition.match(/filename="([^"]+)"/i)?.[1] || `scheda-auto.${format}`;
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.append(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (downloadError) {
      setError(downloadError.message || 'Download non riuscito.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="vehicle-detail-download" onSubmit={download}>
      <SelectField className="vehicle-detail-format-select" value={format} ariaLabel="Formato scheda auto" onChange={(event) => setFormat(event.target.value)}>
        <option value="pdf">PDF</option>
        <option value="xlsx">Excel</option>
        <option value="json">JSON</option>
      </SelectField>
      <button className="button button-outline" type="submit" disabled={busy}>
        {busy ? 'Preparazione…' : 'Scarica scheda auto'}
      </button>
      {error && <span className="form-error" role="alert">{error}</span>}
    </form>
  );
}

function getPasswordRequirements(password) {
  return [
    { key: 'length', label: 'Almeno 8 caratteri', valid: password.length >= 8 },
    { key: 'lowercase', label: 'Una lettera minuscola', valid: /\p{Ll}/u.test(password) },
    { key: 'uppercase', label: 'Una lettera maiuscola', valid: /\p{Lu}/u.test(password) },
    { key: 'number', label: 'Un numero', valid: /\p{N}/u.test(password) },
    { key: 'symbol', label: 'Un simbolo', valid: /[^\p{L}\p{N}]/u.test(password) },
    { key: 'bytes', label: 'Massimo 72 byte', valid: new TextEncoder().encode(password).length <= 72 },
  ];
}

function validateAuthValues(mode, values, adminTotpRequired = false) {
  const errors = {};
  const password = typeof values.password === 'string' ? values.password : '';

  if (mode === 'admin-pin') {
    if (adminTotpRequired && !/^(?:\d{6}|[A-Fa-f0-9-]{11,})$/.test(String(values.code ?? '').trim())) {
      errors.code = 'Inserisci un codice TOTP di 6 cifre o un codice di recupero.';
    } else if (!adminTotpRequired && !/^\d{4}$/.test(String(values.pin ?? ''))) {
      errors.pin = 'Inserisci il codice di verifica di 4 cifre.';
    }
    return errors;
  }

  const identifier = typeof values.email === 'string' ? values.email.trim() : '';
  if (mode === 'signup') {
    const name = typeof values.name === 'string' ? values.name.trim() : '';
    if (name.length < 2 || name.length > 80) {
      errors.name = 'Inserisci un nome da 2 a 80 caratteri.';
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier) || identifier.length > 254) {
      errors.email = 'Inserisci un indirizzo email valido.';
    }
    const missingRequirement = getPasswordRequirements(password).some((requirement) => !requirement.valid);
    if (missingRequirement) {
      errors.password = password
        ? 'Completa tutti i requisiti della password qui sotto.'
        : 'Inserisci una password sicura.';
    }
    if (values.confirmPassword !== password) {
      errors.confirmPassword = values.confirmPassword
        ? 'Le password non coincidono.'
        : 'Conferma la password per continuare.';
    }
    return errors;
  }

  const normalizedIdentifier = identifier.toLowerCase();
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedIdentifier)
    && normalizedIdentifier.length <= 254;
  const validUsername = /^[a-z0-9._-]{3,32}$/.test(normalizedIdentifier);
  if (!validEmail && !validUsername) {
    errors.email = /\s/.test(identifier) && !identifier.includes('@')
      ? 'Il nome utente non può contenere spazi.'
      : 'Inserisci un nome utente (3–32 caratteri, senza spazi) o un indirizzo email valido.';
  }
  if (!password) {
    errors.password = 'Inserisci la password per continuare.';
  } else if (new TextEncoder().encode(password).length > 72) {
    errors.password = 'La password non può superare 72 byte.';
  }
  return errors;
}

function readCustomerVehicleHistory(userId) {
  if (!userId) return [];
  try {
    const history = JSON.parse(window.localStorage.getItem(`pelusogroup-viewed-${userId}`) || '[]');
    return Array.isArray(history)
      ? [...new Set(history.filter((id) => typeof id === 'string'))].slice(0, 12)
      : [];
  } catch (error) {
    console.error('Impossibile leggere lo storico delle auto visualizzate:', error);
    return [];
  }
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

const InventorySkeletonCards = memo(function InventorySkeletonCards() {
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
});

const DiscountPodiumSkeletonCards = memo(function DiscountPodiumSkeletonCards() {
  return Array.from({ length: 3 }, (_, index) => (
    <article className="vehicle-card most-viewed-card most-viewed-card-skeleton" aria-hidden="true" key={index}>
      <div className="vehicle-image-wrap">
        <div className="skeleton-shimmer most-viewed-skeleton-image" />
      </div>
      <div className="vehicle-info most-viewed-info">
        <div className="skeleton-shimmer skeleton-line most-viewed-skeleton-make" />
        <div className="skeleton-shimmer skeleton-line most-viewed-skeleton-title" />
        <div className="most-viewed-skeleton-details">
          <div className="skeleton-shimmer most-viewed-skeleton-chip" />
          <div className="skeleton-shimmer most-viewed-skeleton-chip" />
        </div>
        <div className="most-viewed-card-footer">
          <div className="skeleton-shimmer skeleton-line most-viewed-skeleton-price" />
          <div className="skeleton-shimmer most-viewed-skeleton-button" />
        </div>
      </div>
    </article>
  ));
});

const SoldCarsSkeletonCards = memo(function SoldCarsSkeletonCards() {
  return Array.from({ length: 3 }, (_, index) => (
    <article className="sold-car-skeleton" aria-hidden="true" key={index}>
      <div className="skeleton-shimmer sold-skeleton-image" />
      <div className="sold-skeleton-content">
        <div className="skeleton-shimmer skeleton-line skeleton-line-short" />
        <div className="skeleton-shimmer skeleton-line skeleton-line-title" />
      </div>
    </article>
  ));
});

const ReviewsSkeletonCards = memo(function ReviewsSkeletonCards() {
  return Array.from({ length: 3 }, (_, index) => (
    <article className="review-skeleton" aria-hidden="true" key={index}>
      <div className="skeleton-shimmer skeleton-line skeleton-line-rating" />
      <div className="skeleton-shimmer skeleton-line skeleton-line-review" />
      <div className="skeleton-shimmer skeleton-line skeleton-line-review" />
      <div className="skeleton-shimmer skeleton-line skeleton-line-review-short" />
      <div className="skeleton-shimmer skeleton-line skeleton-line-author" />
    </article>
  ));
});

const ProgressiveImage = memo(function ProgressiveImage({ src, alt, className = '', loading = 'lazy', fetchPriority = 'auto', variant = 'photo', fallback = null }) {
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
});

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

function AdminRentalManager({ vehicles, requests, loading, error, actionBusy, actionStatus, onUpdateStatus, globalSearchTerm = '' }) {
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [requestVehicleFilter, setRequestVehicleFilter] = useState('all');
  const [sortMode, setSortMode] = useState('newest');
  useEffect(() => setSearchTerm(globalSearchTerm), [globalSearchTerm]);
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
      <section className="admin-rental-overview" role="group" aria-label="Filtra richieste di noleggio">
        <button type="button" aria-pressed={statusFilter === 'pending'} onClick={() => setStatusFilter('pending')}><span>Da gestire</span><strong>{pendingCount}</strong></button>
        <button type="button" aria-pressed={statusFilter === 'contacted'} onClick={() => setStatusFilter('contacted')}><span>Contattati</span><strong>{contactedCount}</strong></button>
        <button type="button" aria-pressed={statusFilter === 'confirmed'} onClick={() => setStatusFilter('confirmed')}><span>Confermati</span><strong>{confirmedCount}</strong></button>
        <button type="button" aria-pressed={statusFilter === 'all'} onClick={() => setStatusFilter('all')}><span>Richieste totali</span><strong>{requests.length}</strong></button>
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
              <Suspense fallback={<div className="calendar-loading" role="status">Caricamento calendario…</div>}>
                <RentalDatePicker
                  className="admin-rental-calendar"
                  mode="default"
                  modifiers={{ unavailable: unavailableDates }}
                  modifiersClassNames={{ unavailable: 'rental-calendar-unavailable' }}
                  weekStartsOn={1}
                  showOutsideDays
                  footer="In rosso: periodi confermati. Le richieste in attesa non bloccano le date."
                  aria-label="Calendario delle disponibilità noleggio"
                  lang="it-IT"
                />
              </Suspense>
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
              {actionStatus.requestId === request.id && actionStatus.message && (
                <p className={actionStatus.warning ? 'dealer-visit-notice is-warning' : 'form-success'} role="status">
                  {actionStatus.message}
                </p>
              )}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function AdminSectionNavigation({ active, pendingPurchases, pendingPriceOffers = 0, pendingRentals, pendingVisits = 0, user, onNavigate, onLogout }) {
  const sections = [
    { id: 'dashboard', label: 'Dashboard', icon: 'home', path: '/admin' },
    { id: 'inventory', label: 'Inventario', icon: 'car', path: '/admin/inventory' },
    { id: 'purchases', label: 'Richieste acquisto', icon: 'cart', path: '/admin/purchases', count: pendingPurchases },
    { id: 'offers', label: 'Proposte prezzo', icon: 'price', path: '/admin/offers', count: pendingPriceOffers },
    { id: 'rentals', label: 'Noleggi', icon: 'calendar', path: '/admin/rentals', count: pendingRentals },
    { id: 'visits', label: 'Visite prenotate', icon: 'pin', path: '/admin/visits', count: pendingVisits },
    { id: 'analytics', label: 'Statistiche', icon: 'chart', path: '/admin/analytics' },
    { id: 'messages', label: 'Messaggi e vendite', icon: 'mail', path: '/admin/messages' },
    { id: 'settings', label: 'Impostazioni', icon: 'settings', path: '/admin/settings' },
    { id: 'legal', label: 'Documenti legali', icon: 'legal', path: '/admin/legal' },
    { id: 'security', label: 'Sicurezza', icon: 'warranty', path: '/admin/security' },
    { id: 'audit', label: 'Audit sicurezza recente', icon: 'audit', path: '/admin/security/audit' },
    { id: 'admins', label: 'Account amministratori', icon: 'people', path: '/admin/security/admins' },
    { id: 'logs', label: 'Attività amministrative', icon: 'audit', path: '/admin/logs' },
  ];
  return (
    <aside className="admin-sidebar" aria-label="Navigazione amministratore">
      <div className="admin-sidebar-heading">
        <span className="admin-sidebar-mark" aria-hidden="true">
          <svg viewBox="0 0 64 64" fill="none">
            <defs>
              <linearGradient id="admin-shield-face" x1="13" y1="8" x2="53" y2="56" gradientUnits="userSpaceOnUse">
                <stop stopColor="#8af5b0" />
                <stop offset=".38" stopColor="#29c56d" />
                <stop offset="1" stopColor="#07552c" />
              </linearGradient>
              <linearGradient id="admin-shield-inset" x1="22" y1="16" x2="44" y2="49" gradientUnits="userSpaceOnUse">
                <stop stopColor="#183a28" />
                <stop offset="1" stopColor="#07150d" />
              </linearGradient>
              <linearGradient id="admin-shield-glint" x1="19" y1="10" x2="47" y2="43" gradientUnits="userSpaceOnUse">
                <stop stopColor="#e4ffec" />
                <stop offset=".55" stopColor="#62e992" />
                <stop offset="1" stopColor="#139c4d" />
              </linearGradient>
            </defs>
            <path d="M32 4 54 12v16c0 14-8.4 25.2-22 32C18.4 53.2 10 42 10 28V12L32 4Z" fill="#030906" stroke="#08391f" strokeWidth="2" />
            <path d="M32 7 51 14v14c0 12.2-7.2 22-19 28-11.8-6-19-15.8-19-28V14l19-7Z" fill="url(#admin-shield-face)" />
            <path d="M32 12 46 17v11c0 9.2-5.3 16.7-14 21.6C23.3 44.7 18 37.2 18 28V17l14-5Z" fill="url(#admin-shield-inset)" stroke="rgba(220,255,231,.68)" strokeWidth="1.2" />
            <path d="m23.5 29.5 5.7 5.8 12-13" stroke="url(#admin-shield-glint)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M16 15 32 9m16 6-7-2" stroke="rgba(238,255,243,.72)" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        </span>
        <span><strong>Admin Panel</strong><small>AREA AMMINISTRATORE</small></span>
      </div>
      <nav className="admin-section-navigation" aria-label="Sezioni amministratore">
        {sections.map((section) => (
          <button
            className={`${active === section.id ? 'is-active' : ''}${section.id === 'rentals' ? ' admin-rentals-nav-button' : ''}${Number.isInteger(section.count) ? ' has-count' : ''}`}
            type="button"
            key={section.id}
            aria-current={active === section.id ? 'page' : undefined}
            onClick={() => onNavigate(section.path)}
          >
            <span className="admin-section-navigation-icon"><SiteIcon name={section.icon} /></span>
            <span className="admin-section-navigation-label">{section.label}</span>
            {Number.isInteger(section.count) && <span className="admin-section-navigation-count">{section.count}</span>}
          </button>
        ))}
      </nav>
      <div className="admin-sidebar-footer">
        <div className="admin-sidebar-profile">
          <span className="admin-sidebar-user-avatar" aria-hidden="true">
            <svg viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="11" r="6" fill="currentColor" />
              <path d="M4.5 29c.8-6 5.4-10 11.5-10s10.7 4 11.5 10" fill="currentColor" />
            </svg>
          </span>
          <span title={user?.name || 'Amministratore'}><strong>Amministratore</strong><small>Super Admin</small></span>
        </div>
        <button className="admin-sidebar-logout" type="button" onClick={onLogout} aria-label="Esci dall’area amministratore">
          <LogOut size={17} strokeWidth={1.7} aria-hidden="true" />
          <span>Esci</span>
        </button>
      </div>
    </aside>
  );
}

function AdminDashboard({
  vehicles,
  sales,
  purchaseRequests,
  priceOffers,
  rentalRequests,
  visitRequests,
  sellSubmissions,
  salesLoaded,
  requestsLoading,
  dataErrors = [],
  onNavigate,
}) {
  const [chartRange, setChartRange] = useState(30);
  const pendingRequestCount = purchaseRequests.filter((request) => request.status === 'pending').length
    + priceOffers.filter((offer) => offer.status === 'pending').length
    + rentalRequests.filter((request) => request.status === 'pending').length
    + visitRequests.filter((request) => request.status === 'pending').length;
  const activeRentalCount = vehicles.filter((vehicle) => vehicle.type === 'rent').length;

  const chartData = useMemo(() => {
    const today = new Date();
    today.setHours(24, 0, 0, 0);
    const start = new Date(today);
    if (chartRange === 365) {
      start.setDate(1);
      start.setMonth(start.getMonth() - 11);
    } else {
      start.setDate(start.getDate() - chartRange);
    }
    const bucketCount = chartRange === 7 ? 7 : chartRange === 365 ? 12 : 30;
    const buckets = Array.from({ length: bucketCount }, (_, index) => {
      const date = new Date(start);
      const end = new Date(start);
      if (chartRange === 365) {
        date.setMonth(start.getMonth() + index);
        end.setMonth(start.getMonth() + index + 1);
      } else {
        date.setDate(start.getDate() + Math.round((index * chartRange) / bucketCount));
        end.setDate(start.getDate() + Math.round(((index + 1) * chartRange) / bucketCount));
      }
      const label = chartRange === 365
        ? date.toLocaleDateString('it-IT', { month: 'short' })
        : date.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' });
      return { label, start: date.getTime(), end: end.getTime(), sales: 0, requests: 0 };
    });
    const events = [
      ...sales.map((sale) => ({ date: sale.soldAt, kind: 'sales' })),
      ...purchaseRequests.map((request) => ({ date: request.createdAt, kind: 'requests' })),
      ...priceOffers.map((offer) => ({ date: offer.createdAt, kind: 'requests' })),
      ...rentalRequests.map((request) => ({ date: request.createdAt, kind: 'requests' })),
      ...visitRequests.map((request) => ({ date: request.createdAt || request.visitAt, kind: 'requests' })),
      ...sellSubmissions.map((submission) => ({ date: submission.createdAt, kind: 'requests' })),
    ];

    events.forEach((event) => {
      const timestamp = Date.parse(event.date);
      if (!Number.isFinite(timestamp) || timestamp < start.getTime() || timestamp >= today.getTime()) return;
      const bucketIndex = buckets.findIndex((bucket) => timestamp >= bucket.start && timestamp < bucket.end);
      if (bucketIndex >= 0) buckets[bucketIndex][event.kind] += 1;
    });

    const maximum = Math.max(1, ...buckets.flatMap((bucket) => [bucket.sales, bucket.requests]));
    return {
      buckets,
      maximum,
      hasActivity: buckets.some((bucket) => bucket.sales || bucket.requests),
    };
  }, [chartRange, sales, purchaseRequests, priceOffers, rentalRequests, visitRequests, sellSubmissions]);

  const chartStep = Math.max(1, Math.ceil(chartData.maximum / 4));
  const chartScaleMaximum = chartStep * 4;
  const chartTicks = Array.from({ length: 5 }, (_, index) => chartStep * (4 - index));
  const chartSeriesPoints = (key) => chartData.buckets.map((bucket, index) => ({
    x: 42 + (index * (648 / Math.max(1, chartData.buckets.length - 1))),
    y: 220 - ((bucket[key] / chartScaleMaximum) * 196),
  }));
  const pointsToSmoothPath = (points) => {
    if (!points.length) return '';
    if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

    const slopes = points.slice(1).map((point, index) => (
      (point.y - points[index].y) / (point.x - points[index].x)
    ));
    const tangents = points.map((_point, index) => {
      if (index === 0) return slopes[0];
      if (index === points.length - 1) return slopes[slopes.length - 1];

      const previousSlope = slopes[index - 1];
      const nextSlope = slopes[index];
      if (previousSlope === 0 || nextSlope === 0 || Math.sign(previousSlope) !== Math.sign(nextSlope)) return 0;
      return (2 * previousSlope * nextSlope) / (previousSlope + nextSlope);
    });

    const segments = points.slice(1).map((point, index) => {
      const previous = points[index];
      const width = point.x - previous.x;
      const firstControlY = previous.y + (tangents[index] * width) / 3;
      const secondControlY = point.y - (tangents[index + 1] * width) / 3;
      return `C ${previous.x + width / 3} ${firstControlY}, ${point.x - width / 3} ${secondControlY}, ${point.x} ${point.y}`;
    });

    return `M ${points[0].x} ${points[0].y} ${segments.join(' ')}`;
  };
  const seriesAreaPath = (points) => points.length
    ? `${pointsToSmoothPath(points)} L ${points[points.length - 1].x} 220 L ${points[0].x} 220 Z`
    : '';
  const salesPoints = chartSeriesPoints('sales');
  const requestsPoints = chartSeriesPoints('requests');
  const chartPeriodLabel = chartRange === 365 ? 'Ultimi 12 mesi' : `Ultimi ${chartRange} giorni`;

  const typeDistribution = useMemo(() => {
    const circumference = 2 * Math.PI * 38;
    const categories = [
      { label: 'In vendita', value: vehicles.filter((vehicle) => vehicle.type === 'buy').length, color: '#79a883', gradient: 'inventory' },
      { label: 'A noleggio', value: vehicles.filter((vehicle) => vehicle.type === 'rent').length, color: '#7fa7bb', gradient: 'rental' },
      { label: 'Vendute', value: sales.length, color: '#bd9361', gradient: 'sold' },
    ];
    const total = categories.reduce((sum, category) => sum + category.value, 0);
    const rawPercentages = categories.map((category) => (total ? (category.value / total) * 100 : 0));
    const percentages = rawPercentages.map(Math.floor);
    let remainingPercentage = total ? 100 - percentages.reduce((sum, percentage) => sum + percentage, 0) : 0;
    const roundingOrder = rawPercentages
      .map((percentage, index) => ({ index, fraction: percentage - percentages[index] }))
      .sort((left, right) => right.fraction - left.fraction);
    roundingOrder.slice(0, remainingPercentage).forEach(({ index }) => { percentages[index] += 1; });
    let offset = 0;
    const segmentGap = 2.2;
    const segments = categories.map((category, index) => {
      const length = total ? (category.value / total) * circumference : 0;
      const visibleLength = length - Math.min(segmentGap, length * .14);
      const segment = {
        ...category,
        percentage: percentages[index],
        dashArray: `${visibleLength} ${circumference - visibleLength}`,
        dashOffset: -offset,
      };
      offset += length;
      return segment;
    });
    return { total, circumference, segments };
  }, [vehicles, sales]);

  const recentActivities = useMemo(() => {
    const vehicleLabel = (vehicle) => [vehicle?.year, vehicle?.make, vehicle?.model].filter(Boolean).join(' ');
    const records = [
      ...purchaseRequests.map((request) => ({
        key: `purchase-${request.id}`,
        title: 'Nuova richiesta acquisto',
        detail: `${request.vehicle ? vehicleLabel(request.vehicle) : 'Auto'} · ${request.customer?.name || 'Cliente'}`,
        date: request.createdAt,
        path: '/admin/purchases',
        icon: 'car',
      })),
      ...priceOffers.map((offer) => ({
        key: `offer-${offer.id}`,
        title: 'Nuova proposta prezzo',
        detail: `${offer.vehicle ? vehicleLabel(offer.vehicle) : 'Auto'} · ${offer.customer?.name || 'Cliente'}`,
        date: offer.createdAt,
        path: '/admin/offers',
        icon: 'price',
      })),
      ...rentalRequests.map((request) => ({
        key: `rental-${request.id}`,
        title: 'Nuova richiesta noleggio',
        detail: `${request.vehicle ? vehicleLabel(request.vehicle) : 'Auto'} · ${request.customer?.name || 'Cliente'}`,
        date: request.createdAt,
        path: '/admin/rentals',
        icon: 'calendar',
      })),
      ...visitRequests.map((request) => ({
        key: `visit-${request.id}`,
        title: 'Nuova richiesta visita',
        detail: `${request.vehicle ? vehicleLabel(request.vehicle) : 'Auto'} · ${request.customer?.name || request.name || 'Cliente'}`,
        date: request.createdAt || request.visitAt,
        path: '/admin/visits',
        icon: 'pin',
      })),
      ...sellSubmissions.map((submission) => ({
        key: `submission-${submission.id}`,
        title: 'Nuova proposta di vendita',
        detail: `${submission.year || ''} ${submission.make || ''} ${submission.model || ''} · ${submission.name || 'Cliente'}`.trim(),
        date: submission.createdAt,
        path: '/admin/messages',
        icon: 'sell',
      })),
    ];

    return records
      .filter((record) => Number.isFinite(Date.parse(record.date)))
      .sort((left, right) => Date.parse(right.date) - Date.parse(left.date))
      .slice(0, 5);
  }, [purchaseRequests, priceOffers, rentalRequests, visitRequests, sellSubmissions]);

  const formatRelativeTime = (value) => {
    const minutes = Math.max(0, Math.floor((Date.now() - Date.parse(value)) / 60_000));
    if (minutes < 1) return 'Adesso';
    if (minutes < 60) return `${minutes} min fa`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} h fa`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} gg fa`;
    return new Date(value).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' });
  };
  const dashboardLoading = !salesLoaded || requestsLoading;
  const activityIconMap = {
    car: CarFront,
    price: Tag,
    calendar: CalendarDays,
    pin: MapPin,
    sell: BadgeEuro,
  };
  const kpiCards = [
    { label: 'Veicoli totali', value: vehicles.length, trend: '+12%', icon: CarFront, path: '/admin/inventory' },
    { label: 'Vendite totali', value: sales.length, trend: '+8%', icon: BadgeEuro, path: '/admin/messages' },
    { label: 'Auto a noleggio', value: activeRentalCount, trend: '+15%', icon: CalendarDays, path: '/admin/rentals' },
    { label: 'Richieste in attesa', value: pendingRequestCount, trend: '+10%', icon: ClipboardList, path: '/admin/purchases' },
  ];
  const quickActions = [
    { label: 'Gestione veicoli', detail: 'Visualizza e aggiungi', icon: CarFront, path: '/admin/inventory' },
    { label: 'Richieste acquisto', detail: `${purchaseRequests.length} richieste`, icon: UsersRound, path: '/admin/purchases' },
    { label: 'Noleggi', detail: `${rentalRequests.length} richieste`, icon: CalendarDays, path: '/admin/rentals' },
    { label: 'Report e statistiche', detail: 'Analizza i dati', icon: ChartNoAxesCombined, path: '/admin/analytics' },
  ];

  return (
    <MotionConfig reducedMotion="user">
      <motion.section
        className="admin-page admin-dashboard-page section-wrap"
        aria-labelledby="admin-dashboard-title"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
      <div className="admin-dashboard-welcome">
        <div>
          <p className="eyebrow">PANNELLO DI CONTROLLO</p>
          <h1 id="admin-dashboard-title">Benvenuto, <em>Amministratore</em></h1>
          <p>Gestisci la tua concessionaria in modo semplice ed efficiente.</p>
          <span className="admin-dashboard-title-rule" aria-hidden="true" />
        </div>
        <div className="admin-dashboard-system-status">
          <span className="admin-dashboard-online-dot" aria-hidden="true" />
          <span><strong>Sistema online</strong><small>Area amministratore attiva</small></span>
          <svg viewBox="0 0 90 30" aria-hidden="true"><path d="M1 17h17l8-10 8 18 9-14 8 5h9l8-10 8 11 6-5h7" /></svg>
        </div>
      </div>

      {dataErrors.length > 0 && (
        <p className="admin-dashboard-data-error" role="alert">
          Alcuni dati non sono disponibili: {dataErrors.join(' · ')}
        </p>
      )}

      <motion.div
        className="admin-dashboard-kpis"
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.06 } } }}
      >
        {kpiCards.map((item) => {
          const Icon = item.icon;
          return (
            <motion.button
              type="button"
              key={item.path}
              aria-label={`${item.label}: ${kilometer.format(item.value)}, variazione ${item.trend}`}
              onClick={() => onNavigate(item.path)}
              variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}
              transition={{ duration: 0.24, ease: 'easeOut' }}
              whileTap={{ scale: 0.985 }}
            >
              <span className="admin-dashboard-kpi-icon"><Icon size={20} strokeWidth={1.8} aria-hidden="true" /></span>
              <span className="admin-dashboard-kpi-copy"><small>{item.label}</small><strong>{kilometer.format(item.value)}</strong><em><TrendingUp size={11} strokeWidth={2.2} aria-hidden="true" />{item.trend}</em></span>
            </motion.button>
          );
        })}
      </motion.div>

      <div className="admin-dashboard-main-grid">
        <section className="admin-dashboard-panel admin-dashboard-chart-panel" aria-labelledby="admin-dashboard-chart-title">
          <div className="admin-dashboard-panel-heading">
            <div className="admin-dashboard-chart-heading-copy">
              <h2 id="admin-dashboard-chart-title"><span className="admin-dashboard-chart-title-icon"><ChartNoAxesCombined size={22} strokeWidth={1.7} aria-hidden="true" /></span> Andamento Vendite e Richieste</h2>
              <p>{chartPeriodLabel}</p>
            </div>
            <div className="admin-dashboard-chart-ranges" role="group" aria-label="Intervallo del grafico">
              {[7, 30, 90, 365].map((range) => (
                <button
                  type="button"
                  key={range}
                  aria-pressed={chartRange === range}
                  onClick={() => setChartRange(range)}
                >
                  {range === 365 ? '1 Anno' : `${range} Giorni`}
                </button>
              ))}
            </div>
          </div>
          {chartData.hasActivity ? (
            <div className="admin-dashboard-chart">
              <div className="admin-dashboard-chart-legend">
                <span><i className="is-sales" /> Vendite</span><span><i className="is-requests" /> Richieste</span>
              </div>
              <svg className="admin-dashboard-line-chart" viewBox="0 0 720 260" preserveAspectRatio="xMidYMid meet" role="img" aria-label={`Andamento di vendite e richieste · ${chartPeriodLabel}`}>
                <defs>
                  <linearGradient id="admin-dashboard-chart-background" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0" stopColor="#171a18" stopOpacity=".18" />
                    <stop offset="1" stopColor="#070908" stopOpacity=".02" />
                  </linearGradient>
                  <linearGradient id="admin-dashboard-sales-fill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0" stopColor="#f0a264" stopOpacity=".24" />
                    <stop offset="1" stopColor="#f0a264" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="admin-dashboard-requests-fill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0" stopColor="#579cfa" stopOpacity=".17" />
                    <stop offset="1" stopColor="#579cfa" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <rect className="admin-dashboard-chart-plot" x="42" y="24" width="648" height="196" />
                {salesPoints.map((point, index) => (
                  chartRange === 365 || chartRange === 7 || index % 5 === 0 || index === salesPoints.length - 1
                    ? <line className="admin-dashboard-chart-vertical-gridline" x1={point.x} y1="24" x2={point.x} y2="220" key={`grid-${index}`} />
                    : null
                ))}
                {chartTicks.map((tick, index) => {
                  const y = 24 + (index * 49);
                  return (
                    <g className="admin-dashboard-chart-gridline" key={tick}>
                      <line x1="42" y1={y} x2="690" y2={y} />
                      <text x="34" y={y + 3} textAnchor="end">{tick}</text>
                    </g>
                  );
                })}
                <path className="admin-dashboard-chart-area admin-dashboard-chart-area-sales" d={seriesAreaPath(salesPoints)} />
                <path className="admin-dashboard-chart-area admin-dashboard-chart-area-requests" d={seriesAreaPath(requestsPoints)} />
                <motion.path
                  className="admin-dashboard-chart-line admin-dashboard-chart-line-sales"
                  d={pointsToSmoothPath(salesPoints)}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                />
                <motion.path
                  className="admin-dashboard-chart-line admin-dashboard-chart-line-requests"
                  d={pointsToSmoothPath(requestsPoints)}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, ease: 'easeOut', delay: 0.05 }}
                />
                {salesPoints.map((point, index) => <circle className="admin-dashboard-chart-point admin-dashboard-chart-point-sales" cx={point.x} cy={point.y} r="2.8" key={`sales-${index}`} />)}
                {requestsPoints.map((point, index) => <circle className="admin-dashboard-chart-point admin-dashboard-chart-point-requests" cx={point.x} cy={point.y} r="2.8" key={`requests-${index}`} />)}
                {chartData.buckets.map((bucket, index) => (
                  chartRange === 365 || chartRange === 7 || index % 5 === 0 || index === chartData.buckets.length - 1
                    ? <text className="admin-dashboard-chart-date" x={salesPoints[index].x} y="245" textAnchor="middle" key={`${bucket.label}-${index}`}>{bucket.label}</text>
                    : null
                ))}
              </svg>
            </div>
          ) : (
            <p className="admin-dashboard-chart-empty">
              {dashboardLoading ? 'Caricamento andamento…' : `Non ci sono ancora movimenti negli ultimi ${chartRange === 365 ? '12 mesi' : `${chartRange} giorni`}.`}
            </p>
          )}
        </section>

        <section className="admin-dashboard-panel admin-dashboard-activity-panel" aria-labelledby="admin-dashboard-activity-title">
          <div className="admin-dashboard-panel-heading">
            <h2 id="admin-dashboard-activity-title"><span className="admin-dashboard-activity-title-icon"><Bell size={22} strokeWidth={1.7} aria-hidden="true" /></span> Notifiche Recenti</h2>
            <button type="button" onClick={() => onNavigate('/admin/purchases')}>Vedi tutte <ArrowRight size={14} aria-hidden="true" /></button>
          </div>
          {recentActivities.length ? (
            <ul className="admin-dashboard-activity-list">
              {recentActivities.map((activity) => {
                const Icon = activityIconMap[activity.icon] || Activity;
                return (
                  <li key={activity.key}>
                    <button type="button" onClick={() => onNavigate(activity.path)}>
                      <span className="admin-dashboard-activity-icon"><Icon size={17} strokeWidth={1.8} aria-hidden="true" /></span>
                      <span className="admin-dashboard-activity-copy"><strong>{activity.title}</strong><small>{activity.detail}</small></span>
                      <time dateTime={activity.date}>{formatRelativeTime(activity.date)}</time>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : <p className="admin-dashboard-activity-empty">
            {dashboardLoading ? 'Caricamento attività…' : 'Le nuove richieste e attività appariranno qui.'}
          </p>}
        </section>
      </div>

      <div className="admin-dashboard-lower-grid">
      <section className="admin-dashboard-panel admin-dashboard-type-panel" aria-labelledby="admin-dashboard-type-title">
        <div className="admin-dashboard-panel-heading">
          <h2 id="admin-dashboard-type-title"><span className="admin-dashboard-type-title-icon"><SiteIcon name="chart" /></span> Ripartizione per tipologia</h2>
        </div>
        <div className="admin-dashboard-type-content">
          <svg
            className="admin-dashboard-type-donut"
            viewBox="0 0 100 100"
            role="img"
            aria-label={`Ripartizione: ${typeDistribution.segments.map((segment) => `${segment.label} ${segment.percentage}%`).join(', ')}`}
          >
            <defs>
              <linearGradient id="admin-dashboard-type-inventory" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#253c2b" />
                <stop offset=".42" stopColor="#bedbc2" />
                <stop offset=".72" stopColor="#6e9a77" />
                <stop offset="1" stopColor="#223728" />
              </linearGradient>
              <linearGradient id="admin-dashboard-type-rental" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#293943" />
                <stop offset=".42" stopColor="#c2d5dd" />
                <stop offset=".72" stopColor="#7898a8" />
                <stop offset="1" stopColor="#283741" />
              </linearGradient>
              <linearGradient id="admin-dashboard-type-sold" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#493727" />
                <stop offset=".42" stopColor="#e2c29a" />
                <stop offset=".72" stopColor="#b38755" />
                <stop offset="1" stopColor="#403020" />
              </linearGradient>
              <radialGradient id="admin-dashboard-type-center" cx=".35" cy=".2" r=".9">
                <stop offset="0" stopColor="#222424" />
                <stop offset="1" stopColor="#101111" />
              </radialGradient>
            </defs>
            <circle className="admin-dashboard-type-track" cx="50" cy="50" r="38" />
            {typeDistribution.segments.map((segment) => (
              <circle
                className="admin-dashboard-type-segment"
                key={segment.label}
                cx="50"
                cy="50"
                r="38"
                transform="rotate(-90 50 50)"
                stroke={`url(#admin-dashboard-type-${segment.gradient})`}
                strokeDasharray={segment.dashArray}
                strokeDashoffset={segment.dashOffset}
              />
            ))}
            <circle className="admin-dashboard-type-center" cx="50" cy="50" r="30" />
            <text className="admin-dashboard-type-total" x="50" y="48">{typeDistribution.total ? '100%' : '—'}</text>
            <text className="admin-dashboard-type-caption" x="50" y="60">totale</text>
          </svg>
          <ul className="admin-dashboard-type-legend">
            {typeDistribution.segments.map((segment) => (
              <li key={segment.label}>
                <span className="admin-dashboard-type-key"><i style={{ background: segment.color, boxShadow: `0 0 9px ${segment.color}` }} /><strong>{segment.label}</strong></span>
                <span className="admin-dashboard-type-value">{segment.percentage}% <small>({kilometer.format(segment.value)})</small></span>
              </li>
            ))}
          </ul>
        </div>
      </section>
      <section className="admin-dashboard-quick-access" aria-labelledby="admin-dashboard-quick-title">
        <div className="admin-dashboard-panel-heading">
          <h2 id="admin-dashboard-quick-title"><span className="admin-dashboard-quick-title-icon"><Zap size={22} strokeWidth={1.7} aria-hidden="true" /></span> Gestione Rapida</h2>
        </div>
        <div className="admin-dashboard-quick-grid">
          {quickActions.map((item) => {
            const Icon = item.icon;
            return (
              <motion.button
                type="button"
                key={item.path}
                onClick={() => onNavigate(item.path)}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.985 }}
              >
                <Icon size={20} strokeWidth={1.8} aria-hidden="true" />
                <span><strong>{item.label}</strong><small>{item.detail}</small></span>
              </motion.button>
            );
          })}
        </div>
      </section>
      </div>
      </motion.section>
    </MotionConfig>
  );
}

function AdminMotionSection({ className, labelledBy, children }) {
  return (
    <MotionConfig reducedMotion="user">
      <motion.section
        className={className}
        aria-labelledby={labelledBy}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: 'easeOut' }}
      >
        {children}
      </motion.section>
    </MotionConfig>
  );
}

function AdminUtilityPage({ section, user, onNavigate, onLogout, onSettingsSaved, onUserUpdated, businessName }) {
  const isSecurity = section === 'security';
  const title = isSecurity ? 'Sicurezza account' : 'Impostazioni gestionali';
  const description = isSecurity
    ? 'Proteggi l’accesso amministratore e gestisci credenziali API con permessi limitati.'
    : 'Configura i dati dell’attività e i valori iniziali utilizzati nella gestione del catalogo.';

  return (
    <AdminMotionSection className={`admin-page admin-utility-page admin-${section}-page section-wrap`} labelledBy="admin-utility-title">
      <div className="admin-heading admin-heading-prominent">
        <div>
          <p className="eyebrow">AREA AMMINISTRATORE</p>
          <h1 id="admin-utility-title">{title}</h1>
          <p>{description}</p>
        </div>
      </div>
      <div className="admin-utility-grid">
        <section className="admin-dashboard-panel" aria-labelledby="admin-utility-account-title">
          <div className="admin-dashboard-panel-heading">
            <h2 id="admin-utility-account-title"><SiteIcon name={isSecurity ? 'warranty' : 'people'} /> {isSecurity ? 'Sessione amministratore' : 'Account amministratore'}</h2>
          </div>
          <dl className="admin-utility-details">
            <div><dt>Nome</dt><dd>{user?.name || 'Amministratore'}</dd></div>
            <div><dt>Email</dt><dd>{user?.email || 'Non disponibile'}</dd></div>
            <div><dt>Stato</dt><dd><span className="admin-utility-status"><i aria-hidden="true" /> {isSecurity ? 'Sessione attiva' : 'Account collegato'}</span></dd></div>
          </dl>
          {isSecurity && <button className="button button-outline" type="button" onClick={onLogout}>Esci dall’area amministratore</button>}
        </section>
        <section className="admin-dashboard-panel" aria-labelledby="admin-utility-shortcuts-title">
          <div className="admin-dashboard-panel-heading">
            <h2 id="admin-utility-shortcuts-title"><SiteIcon name={isSecurity ? 'key' : 'chart'} /> {isSecurity ? 'Accessi rapidi' : 'Gestione rapida'}</h2>
          </div>
          <div className="admin-utility-actions">
            <button className="button button-outline" type="button" onClick={() => onNavigate('/admin/inventory')}>Inventario</button>
            <button className="button button-outline" type="button" onClick={() => onNavigate('/admin/analytics')}>Statistiche</button>
            <button className="button button-outline" type="button" onClick={() => onNavigate('/admin/messages')}>Messaggi e vendite</button>
          </div>
        </section>
      </div>
      {isSecurity ? <AdminSecurityPanel onUserUpdated={onUserUpdated} businessName={businessName} /> : <AdminSettingsPanel onSettingsSaved={onSettingsSaved} />}
    </AdminMotionSection>
  );
}

function AdminSettingsPanel({ onSettingsSaved }) {
  const [settings, setSettings] = useState(null);
  const savedAvailabilityRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState('');
  const [uploadingAsset, setUploadingAsset] = useState('');
  const [adminAccessBusy, setAdminAccessBusy] = useState(false);
  const [generatedAdminAccessUrl, setGeneratedAdminAccessUrl] = useState('');
  const [holidayDraft, setHolidayDraft] = useState({ date: '', label: '' });
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let active = true;
    requestJson('/api/admin/settings')
      .then(({ settings: loadedSettings }) => {
        if (active) {
          setSettings(loadedSettings);
          savedAvailabilityRef.current = {
            maintenanceMode: Boolean(loadedSettings.maintenanceMode),
            offlineMode: Boolean(loadedSettings.offlineMode),
          };
        }
      })
      .catch((loadError) => {
        if (active) setError(loadError.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  function updateField(event) {
    const { name, value, checked, type } = event.currentTarget;
    setSettings((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
    setError('');
    setNotice('');
  }

  function updateContact(index, field, value) {
    setSettings((current) => ({
      ...current,
      staffContacts: current.staffContacts.map((contact, contactIndex) => (
        contactIndex === index ? { ...contact, [field]: value } : contact
      )),
    }));
    setError('');
    setNotice('');
  }

  function updateOpeningHours(day, field, value) {
    setSettings((current) => ({
      ...current,
      openingHours: current.openingHours.map((entry) => (
        entry.day === day ? { ...entry, [field]: value } : entry
      )),
    }));
    setError('');
    setNotice('');
  }

  function updateAnnouncement(field, value) {
    setSettings((current) => ({
      ...current,
      announcement: {
        ...(current.announcement || { message: '', type: 'info', expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() }),
        [field]: value,
      },
    }));
    setError('');
    setNotice('');
  }

  async function uploadSiteImage(kind, event) {
    const image = event.currentTarget.files?.[0];
    event.currentTarget.value = '';
    if (!image) return;
    setUploadingAsset(kind);
    setError('');
    setNotice('');
    try {
      const body = new FormData();
      body.append('image', image);
      const { url } = await requestJson(`/api/admin/settings/assets/${kind}`, { method: 'POST', body });
      const field = kind === 'logo' ? 'logoUrl' : kind === 'favicon' ? 'faviconUrl' : 'heroImageUrl';
      const next = { ...settings, [field]: url };
      setSettings(next);
      onSettingsSaved({ [field]: url });
      setNotice(kind === 'logo' ? 'Logo aggiornato.' : kind === 'favicon' ? 'Favicon aggiornato.' : 'Immagine hero aggiornata.');
    } catch (uploadError) {
      setError(uploadError.message);
    } finally {
      setUploadingAsset('');
    }
  }

  async function generateAdminAccessPath() {
    setAdminAccessBusy(true);
    setError('');
    setNotice('');
    try {
      const { path } = await requestJson('/api/admin/settings/admin-access-path', { method: 'POST' });
      setGeneratedAdminAccessUrl(new URL(path, window.location.origin).toString());
      setSettings((current) => ({ ...current, adminAccessEnabled: true }));
      setNotice('Link privato generato. Copialo e conservalo in un luogo sicuro.');
    } catch (accessError) {
      setError(accessError.message);
    } finally {
      setAdminAccessBusy(false);
    }
  }

  async function copyAdminAccessPath() {
    try {
      await navigator.clipboard.writeText(generatedAdminAccessUrl);
      setNotice('Link privato copiato.');
      setError('');
    } catch {
      setError('Copia non disponibile: seleziona e copia il collegamento mostrato.');
      setNotice('');
    }
  }

  function addHoliday() {
    if (settings.holidays.length >= 50) {
      setError('Puoi configurare al massimo 50 chiusure straordinarie.');
      return;
    }
    if (!holidayDraft.date || !holidayDraft.label.trim()) {
      setError('Inserisci la data e il nome della chiusura.');
      return;
    }
    if (settings.holidays.some((holiday) => holiday.date === holidayDraft.date)) {
      setError('Questa data è già presente tra le chiusure.');
      return;
    }
    setSettings((current) => ({
      ...current,
      holidays: [...current.holidays, { ...holidayDraft, label: holidayDraft.label.trim() }].sort((a, b) => a.date.localeCompare(b.date)),
    }));
    setHolidayDraft({ date: '', label: '' });
    setError('');
    setNotice('');
  }

  async function saveSettings(event, section, fields) {
    event.preventDefault();
    const sectionForm = event.currentTarget.closest('.admin-utility-section');
    const invalidField = [...sectionForm.querySelectorAll('input, select, textarea')]
      .find((field) => !field.checkValidity());
    if (invalidField) {
      invalidField.reportValidity();
      return;
    }

    setSaving(section);
    setError('');
    setNotice('');
    try {
      const { settings: savedSettings } = await requestJson('/api/admin/settings', {
        method: 'PUT',
        body: JSON.stringify(fields.reduce((payload, field) => {
          payload[field] = settings[field];
          return payload;
        }, {})),
      });
      const availabilityChanged = savedAvailabilityRef.current
        && (savedAvailabilityRef.current.maintenanceMode !== Boolean(savedSettings.maintenanceMode)
          || savedAvailabilityRef.current.offlineMode !== Boolean(savedSettings.offlineMode));
      savedAvailabilityRef.current = {
        maintenanceMode: Boolean(savedSettings.maintenanceMode),
        offlineMode: Boolean(savedSettings.offlineMode),
      };
      setSettings((current) => ({
        ...current,
        ...fields.reduce((savedFields, field) => {
          savedFields[field] = savedSettings[field];
          return savedFields;
        }, {}),
      }));
      onSettingsSaved(savedSettings);
      setNotice('Sezione salvata sul server.');
      if (fields.some((field) => ['maintenanceMode', 'offlineMode'].includes(field)) && availabilityChanged) {
        window.setTimeout(() => window.location.reload(), 0);
      }
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving('');
    }
  }

  if (loading) return <p className="admin-utility-loading" role="status">Caricamento impostazioni…</p>;
  if (!settings) {
    return <p className="admin-utility-message is-error" role="alert">{error || 'Le impostazioni non sono disponibili.'}</p>;
  }

  return (
    <div className="admin-utility-form">
      <section className="admin-dashboard-panel admin-utility-section" aria-labelledby="admin-settings-business-title">
        <div className="admin-dashboard-panel-heading">
          <h2 id="admin-settings-business-title"><SiteIcon name="people" /> Profilo attività</h2>
          <span className="admin-utility-section-note">Dati gestionali</span>
        </div>
        <div className="admin-utility-fields">
          <label>Nome attività
            <input name="businessName" value={settings.businessName || ''} onChange={updateField} maxLength="120" required />
          </label>
          <label className="is-wide">Titolo pagina principale
            <input name="siteTitle" value={settings.siteTitle || ''} onChange={updateField} maxLength="160" required />
          </label>
          <label>Email di contatto
            <input name="contactEmail" type="email" value={settings.contactEmail || ''} onChange={updateField} maxLength="254" />
          </label>
          <label>Telefono
            <input name="contactPhone" type="tel" value={settings.contactPhone || ''} onChange={updateField} maxLength="40" />
          </label>
          <label>Partita IVA
            <input name="vatNumber" value={settings.vatNumber || ''} onChange={updateField} maxLength="32" />
          </label>
          <label className="is-wide">Indirizzo
            <input name="address" value={settings.address || ''} onChange={updateField} maxLength="240" />
          </label>
        </div>
        <p className="admin-utility-help">Email e telefono generali sono visibili nei contatti pubblici e nel footer. L’email riceve i moduli del sito; l’indirizzo configurato nel server viene usato solo se questo campo è vuoto.</p>
        <div className="admin-utility-section-actions">
          <button className="admin-utility-primary-button" type="button" disabled={Boolean(saving)} onClick={(event) => saveSettings(event, 'business', ['businessName', 'siteTitle', 'contactEmail', 'contactPhone', 'vatNumber', 'address'])}>
            <Save size={16} aria-hidden="true" /> {saving === 'business' ? 'Salvataggio…' : 'Salva sezione'}
          </button>
        </div>
      </section>

      <section className="admin-dashboard-panel admin-utility-section" aria-labelledby="admin-settings-preferences-title">
        <div className="admin-dashboard-panel-heading">
          <h2 id="admin-settings-preferences-title"><Clock3 size={18} aria-hidden="true" /> Preferenze operative</h2>
          <span className="admin-utility-section-note">Valori predefiniti</span>
        </div>
        <div className="admin-utility-fields">
          <label>Fuso orario
            <select name="timezone" value={settings.timezone || 'Europe/Rome'} onChange={updateField}>
              <option value="Europe/Rome">Europa/Roma</option>
              <option value="Europe/Paris">Europa/Parigi</option>
              <option value="Europe/Berlin">Europa/Berlino</option>
              <option value="UTC">UTC</option>
            </select>
          </label>
          <label>Tipologia predefinita per nuovi veicoli
            <select name="defaultVehicleType" value={settings.defaultVehicleType || 'buy'} onChange={updateField}>
              <option value="buy">In vendita</option>
              <option value="rent">A noleggio</option>
            </select>
          </label>
        </div>
        <p className="admin-utility-help">La tipologia scelta viene proposta quando avvii la creazione di una nuova scheda inventario; le modifiche a veicoli esistenti non vengono alterate.</p>
        <div className="admin-utility-section-actions">
          <button className="admin-utility-primary-button" type="button" disabled={Boolean(saving)} onClick={(event) => saveSettings(event, 'preferences', ['timezone', 'defaultVehicleType'])}>
            <Save size={16} aria-hidden="true" /> {saving === 'preferences' ? 'Salvataggio…' : 'Salva sezione'}
          </button>
        </div>
      </section>

      <section className="admin-dashboard-panel admin-utility-section" aria-labelledby="admin-settings-branding-title">
        <div className="admin-dashboard-panel-heading">
          <h2 id="admin-settings-branding-title"><SiteIcon name="image" /> Identità del sito</h2>
          <span className="admin-utility-section-note">Logo e immagine home</span>
        </div>
        <div className="admin-site-assets">
          <label className="admin-site-asset">
            <span>Logo</span>
            <img src={settings.logoUrl || DEFAULT_SITE_SETTINGS.logoUrl} alt="Anteprima logo" />
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => uploadSiteImage('logo', event)} />
            <small>{uploadingAsset === 'logo' ? 'Caricamento…' : 'JPG, PNG o WebP · massimo 8 MB'}</small>
          </label>
          <label className="admin-site-asset">
            <span>Favicon</span>
            <img src={settings.faviconUrl || DEFAULT_SITE_SETTINGS.faviconUrl} alt="Anteprima favicon" />
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => uploadSiteImage('favicon', event)} />
            <small>{uploadingAsset === 'favicon' ? 'Caricamento…' : 'Icona JPG, PNG o WebP · massimo 8 MB'}</small>
          </label>
          <label className="admin-site-asset">
            <span>Immagine hero home</span>
            <img src={settings.heroImageUrl || DEFAULT_SITE_SETTINGS.heroImageUrl} alt="Anteprima immagine principale" />
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => uploadSiteImage('hero', event)} />
            <small>{uploadingAsset === 'hero' ? 'Caricamento…' : 'JPG, PNG o WebP · massimo 8 MB'}</small>
          </label>
        </div>
        <p className="admin-utility-help">Le immagini e il favicon vengono salvati appena termina il caricamento. Il titolo della pagina principale si modifica nel profilo attività.</p>
      </section>

      <section className="admin-dashboard-panel admin-utility-section" aria-labelledby="admin-settings-contacts-title">
        <div className="admin-dashboard-panel-heading">
          <h2 id="admin-settings-contacts-title"><SiteIcon name="people" /> Contatti visibili sul sito</h2>
          <button
            className="button button-outline"
            type="button"
            disabled={settings.staffContacts.length >= 20}
            onClick={() => setSettings((current) => ({
              ...current,
              staffContacts: [...current.staffContacts, {
                id: `contatto-${Date.now()}`,
                name: '',
                role: '',
                email: '',
                phone: '',
                whatsapp: '',
              }],
            }))}
          >
            Aggiungi contatto
          </button>
        </div>
        <p className="admin-utility-help">Questi dati aggiornano i contatti pubblici senza modificare le credenziali. Il destinatario dei moduli del sito è l’email di contatto nel profilo attività.</p>
        <div className="admin-site-contact-list">
          {settings.staffContacts.map((contact, index) => (
            <div className="admin-site-contact-card" key={contact.id}>
              <div className="admin-utility-fields">
                <label>Nome
                  <input value={contact.name} onChange={(event) => updateContact(index, 'name', event.target.value)} maxLength="80" required />
                </label>
                <label>Ruolo
                  <input value={contact.role} onChange={(event) => updateContact(index, 'role', event.target.value)} maxLength="120" />
                </label>
                <label>Email
                  <input type="email" value={contact.email} onChange={(event) => updateContact(index, 'email', event.target.value)} maxLength="254" />
                </label>
                <label>Telefono
                  <input type="tel" value={contact.phone} onChange={(event) => updateContact(index, 'phone', event.target.value)} maxLength="40" />
                </label>
                <label>WhatsApp (prefisso internazionale)
                  <input inputMode="numeric" value={contact.whatsapp} onChange={(event) => updateContact(index, 'whatsapp', event.target.value)} maxLength="20" />
                </label>
              </div>
              <button
                className="button button-outline"
                type="button"
                disabled={settings.staffContacts.length <= 2 || ['luigi', 'gerardo'].includes(contact.id)}
                onClick={() => setSettings((current) => ({
                  ...current,
                  staffContacts: current.staffContacts.filter((_, contactIndex) => contactIndex !== index),
                }))}
              >
                Rimuovi contatto
              </button>
            </div>
          ))}
        </div>
        <div className="admin-utility-section-actions">
          <button className="admin-utility-primary-button" type="button" disabled={Boolean(saving)} onClick={(event) => saveSettings(event, 'contacts', ['staffContacts'])}>
            <Save size={16} aria-hidden="true" /> {saving === 'contacts' ? 'Salvataggio…' : 'Salva sezione'}
          </button>
        </div>
      </section>

      <section className="admin-dashboard-panel admin-utility-section" aria-labelledby="admin-settings-hours-title">
        <div className="admin-dashboard-panel-heading">
          <h2 id="admin-settings-hours-title"><Clock3 size={18} aria-hidden="true" /> Orari e chiusure</h2>
          <span className="admin-utility-section-note">Apertura concessionaria</span>
        </div>
        <div className="admin-opening-hours-editor">
          {settings.openingHours.map((entry) => (
            <div className={`admin-opening-hours-row${entry.closed ? ' is-closed' : ''}`} key={entry.day}>
              <strong>{WEEKDAY_LABELS[entry.day]}</strong>
              <label className="admin-opening-closed">
                <input
                  type="checkbox"
                  checked={entry.closed}
                  onChange={(event) => {
                    if (event.target.checked) {
                      updateOpeningHours(entry.day, 'closed', true);
                      ['morningOpen', 'morningClose', 'afternoonOpen', 'afternoonClose'].forEach((field) => updateOpeningHours(entry.day, field, ''));
                    } else {
                      updateOpeningHours(entry.day, 'closed', false);
                      if (!entry.morningOpen || !entry.morningClose) {
                        updateOpeningHours(entry.day, 'morningOpen', '09:00');
                        updateOpeningHours(entry.day, 'morningClose', '13:00');
                      }
                    }
                  }}
                />
                Chiuso
              </label>
              {!entry.closed && (
                <div className="admin-opening-time-fields">
                  <label>Mattina dalle<input type="time" value={entry.morningOpen} onChange={(event) => updateOpeningHours(entry.day, 'morningOpen', event.target.value)} required /></label>
                  <label>alle<input type="time" value={entry.morningClose} onChange={(event) => updateOpeningHours(entry.day, 'morningClose', event.target.value)} required /></label>
                  <label>Pomeriggio dalle<input type="time" value={entry.afternoonOpen} onChange={(event) => updateOpeningHours(entry.day, 'afternoonOpen', event.target.value)} /></label>
                  <label>alle<input type="time" value={entry.afternoonClose} onChange={(event) => updateOpeningHours(entry.day, 'afternoonClose', event.target.value)} /></label>
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="admin-holiday-editor">
          <h3>Giorni festivi e chiusure straordinarie</h3>
          <div className="admin-holiday-add">
            <label>Data<input type="date" value={holidayDraft.date} onChange={(event) => setHolidayDraft((current) => ({ ...current, date: event.target.value }))} /></label>
            <label>Descrizione<input value={holidayDraft.label} onChange={(event) => setHolidayDraft((current) => ({ ...current, label: event.target.value }))} maxLength="100" placeholder="Es. Chiusura per festività" /></label>
            <button className="button button-outline" type="button" onClick={addHoliday}>Aggiungi</button>
          </div>
          {settings.holidays.length > 0 ? (
            <ul className="admin-holiday-list">
              {settings.holidays.map((holiday) => (
                <li key={holiday.date}>
                  <span><strong>{new Date(`${holiday.date}T12:00:00`).toLocaleDateString('it-IT')}</strong> · {holiday.label}</span>
                  <button type="button" aria-label={`Rimuovi ${holiday.label}`} onClick={() => setSettings((current) => ({
                    ...current,
                    holidays: current.holidays.filter((entry) => entry.date !== holiday.date),
                  }))}>Rimuovi</button>
                </li>
              ))}
            </ul>
          ) : <p className="admin-utility-help">Nessuna chiusura straordinaria configurata.</p>}
        </div>
        <div className="admin-utility-section-actions">
          <button className="admin-utility-primary-button" type="button" disabled={Boolean(saving)} onClick={(event) => saveSettings(event, 'hours', ['openingHours', 'holidays'])}>
            <Save size={16} aria-hidden="true" /> {saving === 'hours' ? 'Salvataggio…' : 'Salva sezione'}
          </button>
        </div>
      </section>

      <section className="admin-dashboard-panel admin-utility-section" aria-labelledby="admin-settings-announcement-title">
        <div className="admin-dashboard-panel-heading">
          <h2 id="admin-settings-announcement-title"><SiteIcon name="info" /> Banner informativo</h2>
          <span className="admin-utility-section-note">Messaggio a tempo sul sito</span>
        </div>
        <label className="admin-site-toggle">
          <input
            type="checkbox"
            checked={Boolean(settings.announcement)}
            onChange={(event) => setSettings((current) => ({
              ...current,
              announcement: event.target.checked
                ? { message: '', type: 'info', expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() }
                : null,
            }))}
          />
          Mostra un banner in alto nelle pagine pubbliche
        </label>
        {settings.announcement && (
          <div className="admin-utility-fields">
            <label className="is-wide">Messaggio
              <input value={settings.announcement.message} onChange={(event) => updateAnnouncement('message', event.target.value)} maxLength="240" required />
            </label>
            <label>Tipo
              <select value={settings.announcement.type} onChange={(event) => updateAnnouncement('type', event.target.value)}>
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="alert">Alert</option>
              </select>
            </label>
            <label>Visibile fino al
              <input
                type="datetime-local"
                value={settings.announcement.expiresAt ? (() => {
                  const date = new Date(settings.announcement.expiresAt);
                  return Number.isNaN(date.getTime())
                    ? ''
                    : new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
                })() : ''}
                onChange={(event) => updateAnnouncement('expiresAt', event.target.value ? new Date(event.target.value).toISOString() : '')}
                required
              />
            </label>
          </div>
        )}
        <div className="admin-utility-section-actions">
          <button className="admin-utility-primary-button" type="button" disabled={Boolean(saving)} onClick={(event) => saveSettings(event, 'announcement', ['announcement'])}>
            <Save size={16} aria-hidden="true" /> {saving === 'announcement' ? 'Salvataggio…' : 'Salva sezione'}
          </button>
        </div>
      </section>

      <section className="admin-dashboard-panel admin-utility-section" aria-labelledby="admin-settings-availability-title">
        <div className="admin-dashboard-panel-heading">
          <h2 id="admin-settings-availability-title"><SiteIcon name="warranty" /> Disponibilità del sito</h2>
          <span className="admin-utility-section-note">Controlla cosa vedono i visitatori</span>
        </div>
        <div className="admin-availability-grid">
          <div className="admin-availability-card">
            <div className="admin-availability-card-heading">
              <span className="admin-availability-card-icon"><Wrench size={16} aria-hidden="true" /></span>
              <div>
                <h3>Manutenzione</h3>
                <p>Mostra una schermata temporanea ai visitatori.</p>
              </div>
            </div>
            <label className="admin-site-toggle">
              <input type="checkbox" name="maintenanceMode" checked={Boolean(settings.maintenanceMode)} onChange={updateField} />
              Attiva modalità manutenzione
            </label>
            <label className="admin-availability-message">Messaggio mostrato
              <input name="maintenanceMessage" value={settings.maintenanceMessage || ''} onChange={updateField} maxLength="240" />
            </label>
          </div>
          <div className="admin-availability-card is-offline">
            <div className="admin-availability-card-heading">
              <span className="admin-availability-card-icon"><WifiOff size={16} aria-hidden="true" /></span>
              <div>
                <h3>Modalità offline</h3>
                <p>Nasconde il sito pubblico e blocca le API pubbliche.</p>
              </div>
            </div>
            <label className="admin-site-toggle admin-site-toggle-danger">
              <input type="checkbox" name="offlineMode" checked={Boolean(settings.offlineMode)} onChange={updateField} />
              Metti il sito offline
            </label>
            <label className="admin-availability-message">Messaggio mostrato
              <input name="offlineMessage" value={settings.offlineMessage || ''} onChange={updateField} maxLength="240" />
            </label>
          </div>
        </div>
        <div className="admin-availability-access-note">
          <ShieldCheck size={16} aria-hidden="true" />
          <p>Gli amministratori già autenticati restano operativi. Per un nuovo accesso durante l’indisponibilità, usa il link privato qui sotto.</p>
        </div>
        <div className="admin-private-entry">
          <div className="admin-private-entry-header">
            <span className="admin-private-entry-icon"><KeyRound size={17} aria-hidden="true" /></span>
            <div>
              <h3>Link privato amministratore</h3>
              <p>Apre il login admin anche quando il sito pubblico non è disponibile. Password, PIN e 2FA restano obbligatori.</p>
            </div>
            <span className={`admin-private-entry-status${settings.adminAccessEnabled ? ' is-active' : ''}`}>
              {generatedAdminAccessUrl ? 'Creato · visibile solo ora' : settings.adminAccessEnabled ? 'Attivo · percorso nascosto' : 'Non configurato'}
            </span>
          </div>
          {generatedAdminAccessUrl ? (
            <div className="admin-private-entry-link">
              <label>Link generato (visibile solo ora)
                <input value={generatedAdminAccessUrl} readOnly onFocus={(event) => event.currentTarget.select()} />
              </label>
              <button className="admin-utility-secondary-button" type="button" onClick={copyAdminAccessPath}>
                <Copy size={15} aria-hidden="true" /> Copia link
              </button>
            </div>
          ) : settings.adminAccessEnabled ? (
            <p className="admin-private-entry-configured" role="status">Per sicurezza il percorso attivo non viene mostrato. Ruota il link solo se devi sostituirlo.</p>
          ) : (
            <p className="admin-private-entry-configured">Genera un link per abilitare l’accesso admin quando il sito è offline o in manutenzione.</p>
          )}
          <div className="admin-private-entry-actions">
            <p>Generare o ruotare il link non salva le modalità di disponibilità.</p>
            <button className="admin-utility-secondary-button" type="button" disabled={adminAccessBusy} onClick={generateAdminAccessPath}>
              <KeyRound size={15} aria-hidden="true" />
              {adminAccessBusy ? 'Generazione…' : settings.adminAccessEnabled ? 'Ruota link privato' : 'Genera link privato'}
            </button>
          </div>
        </div>
        <div className="admin-availability-save">
          <div>
            <strong>Salva modalità e messaggi</strong>
            <span>Il link privato viene gestito separatamente.</span>
          </div>
          <button className="admin-utility-primary-button" type="button" disabled={Boolean(saving)} onClick={(event) => saveSettings(event, 'availability', ['maintenanceMode', 'maintenanceMessage', 'offlineMode', 'offlineMessage'])}>
            <Save size={16} aria-hidden="true" /> {saving === 'availability' ? 'Salvataggio…' : 'Salva disponibilità'}
          </button>
        </div>
      </section>

      {(error || notice) && <p className={`admin-utility-message${error ? ' is-error' : ''}`} role={error ? 'alert' : 'status'}>{error || notice}</p>}
    </div>
  );
}

function AdminLegalDocumentsPage() {
  const [legalDocuments, setLegalDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let active = true;
    requestJson('/api/admin/legal-documents')
      .then(({ documents }) => {
        if (active) setLegalDocuments(Array.isArray(documents) ? documents : []);
      })
      .catch((loadError) => {
        if (active) setError(loadError.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  async function saveDocument(document) {
    setSaving(document.slug);
    setError('');
    setNotice('');
    try {
      const { document: savedDocument } = await requestJson(`/api/admin/legal-documents/${document.slug}`, {
        method: 'PUT',
        body: JSON.stringify({ content: document.content }),
      });
      setLegalDocuments((current) => current.map((entry) => (
        entry.slug === savedDocument.slug ? savedDocument : entry
      )));
      setNotice(`${document.title} salvato sul server.`);
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving('');
    }
  }

  return (
    <AdminMotionSection className="admin-page admin-legal-page section-wrap" labelledBy="admin-legal-title">
      <div className="admin-heading admin-heading-prominent">
        <div>
          <p className="eyebrow">AREA AMMINISTRATORE · CONTENUTI PUBBLICI</p>
          <h1 id="admin-legal-title">Documenti <em>legali.</em></h1>
          <p>Modifica Privacy Policy, Termini e condizioni, Cookie Policy e Note legali direttamente dalla dashboard.</p>
        </div>
      </div>
      {loading ? (
        <p className="admin-utility-loading" role="status">Caricamento documenti…</p>
      ) : (
        <section className="admin-dashboard-panel admin-utility-section admin-legal-documents" aria-labelledby="admin-legal-content-title">
          <div className="admin-dashboard-panel-heading">
            <h2 id="admin-legal-content-title"><ShieldCheck size={18} aria-hidden="true" /> Contenuti pubblicati</h2>
            <span className="admin-utility-section-note">Markdown</span>
          </div>
          <p className="admin-utility-help">Le modifiche diventano pubbliche dopo il salvataggio. Il contenuto viene mostrato nelle rispettive pagine legali del sito.</p>
          <div className="admin-legal-document-list">
            {legalDocuments.map((document) => (
              <article className="admin-legal-document-card" key={document.slug}>
                <div className="admin-legal-document-heading">
                  <div>
                    <h3>{document.title}</h3>
                    <span>/{document.slug}</span>
                  </div>
                  {document.updatedAt && <small>Ultimo aggiornamento: {new Date(document.updatedAt).toLocaleString('it-IT')}</small>}
                </div>
                <label className="admin-legal-document-editor">
                  <span>Contenuto Markdown</span>
                  <textarea
                    value={document.content}
                    maxLength="100000"
                    rows="18"
                    onChange={(event) => {
                      const content = event.target.value;
                      setLegalDocuments((current) => current.map((entry) => (
                        entry.slug === document.slug ? { ...entry, content } : entry
                      )));
                      setError('');
                      setNotice('');
                    }}
                  />
                </label>
                <div className="admin-utility-section-actions">
                  <AdminLegalDocumentDownloadButton document={document} />
                  <button className="admin-utility-primary-button" type="button" disabled={Boolean(saving)} onClick={() => saveDocument(document)}>
                    <Save size={16} aria-hidden="true" /> {saving === document.slug ? 'Salvataggio…' : 'Salva documento'}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
      {(error || notice) && <p className={`admin-utility-message${error ? ' is-error' : ''}`} role={error ? 'alert' : 'status'}>{error || notice}</p>}
    </AdminMotionSection>
  );
}

function AdminSecurityPanel({ onUserUpdated, businessName = DEFAULT_SITE_SETTINGS.businessName }) {
  const [security, setSecurity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [totpPassword, setTotpPassword] = useState('');
  const [totpSetup, setTotpSetup] = useState(null);
  const [totpCode, setTotpCode] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState([]);
  const [disablePassword, setDisablePassword] = useState('');
  const [disableCode, setDisableCode] = useState('');
  const [tokenName, setTokenName] = useState('');
  const [tokenPassword, setTokenPassword] = useState('');
  const [tokenScopes, setTokenScopes] = useState(['vehicles:read']);
  const [tokenExpiresInDays, setTokenExpiresInDays] = useState('90');
  const [newApiToken, setNewApiToken] = useState('');
  const [revokeTokenId, setRevokeTokenId] = useState('');
  const [copied, setCopied] = useState('');

  async function refreshSecurity() {
    const { security: loadedSecurity } = await requestJson('/api/admin/security');
    setSecurity(loadedSecurity);
  }

  useEffect(() => {
    let active = true;
    requestJson('/api/admin/security')
      .then(({ security: loadedSecurity }) => {
        if (active) setSecurity(loadedSecurity);
      })
      .catch((loadError) => {
        if (active) setError(loadError.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  async function startTotpSetup(event) {
    event.preventDefault();
    setBusy('totp-setup');
    setError('');
    setNotice('');
    try {
      const setup = await requestJson('/api/admin/security/totp/setup', {
        method: 'POST',
        body: JSON.stringify({ password: totpPassword }),
      });
      setTotpSetup(setup);
      setTotpPassword('');
      setNotice('Aggiungi il segreto nell’app autenticatore e inserisci il codice generato.');
    } catch (actionError) {
      setError(actionError.message);
    } finally {
      setBusy('');
    }
  }

  async function enableTotp(event) {
    event.preventDefault();
    setBusy('totp-enable');
    setError('');
    setNotice('');
    try {
      const result = await requestJson('/api/admin/security/totp/enable', {
        method: 'POST',
        body: JSON.stringify({ code: totpCode }),
      });
      setRecoveryCodes(result.recoveryCodes);
      setTotpSetup(null);
      setTotpCode('');
      setNotice('TOTP attivato. Salva i codici di recupero: non saranno mostrati di nuovo.');
      await refreshSecurity();
    } catch (actionError) {
      setError(actionError.message);
    } finally {
      setBusy('');
    }
  }

  async function disableTotp(event) {
    event.preventDefault();
    setBusy('totp-disable');
    setError('');
    setNotice('');
    try {
      await requestJson('/api/admin/security/totp/disable', {
        method: 'POST',
        body: JSON.stringify({ password: disablePassword, code: disableCode }),
      });
      setDisablePassword('');
      setDisableCode('');
      setNotice('TOTP disattivato. Il prossimo accesso userà il PIN amministratore.');
      await refreshSecurity();
    } catch (actionError) {
      setError(actionError.message);
    } finally {
      setBusy('');
    }
  }

  async function createApiToken(event) {
    event.preventDefault();
    setBusy('token-create');
    setError('');
    setNotice('');
    setNewApiToken('');
    try {
      const result = await requestJson('/api/admin/security/tokens', {
        method: 'POST',
        body: JSON.stringify({
          name: tokenName,
          password: tokenPassword,
          scopes: tokenScopes,
          expiresInDays: Number(tokenExpiresInDays),
        }),
      });
      setNewApiToken(result.token);
      setTokenName('');
      setTokenPassword('');
      setNotice('Token creato. Copialo ora: il valore completo non sarà più visualizzato.');
      await refreshSecurity();
    } catch (actionError) {
      setError(actionError.message);
    } finally {
      setBusy('');
    }
  }

  async function revokeApiToken(tokenId) {
    setBusy(`token-revoke-${tokenId}`);
    setError('');
    setNotice('');
    try {
      await requestJson(`/api/admin/security/tokens/${encodeURIComponent(tokenId)}`, { method: 'DELETE' });
      setRevokeTokenId('');
      setNotice('Token revocato. Non può più essere utilizzato.');
      await refreshSecurity();
    } catch (actionError) {
      setError(actionError.message);
    } finally {
      setBusy('');
    }
  }

  async function copyValue(label, value) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(label);
      window.setTimeout(() => setCopied(''), 1800);
    } catch {
      setError('Copia non disponibile: seleziona e copia il valore manualmente.');
    }
  }

  function downloadRecoveryCodes() {
    const file = new Blob([`${businessName} - codici di recupero amministratore\n\n${recoveryCodes.join('\n')}\n`], { type: 'text/plain' });
    const url = window.URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'pelusogroup-codici-recupero.txt';
    link.click();
    window.URL.revokeObjectURL(url);
  }

  function toggleScope(scope) {
    setTokenScopes((current) => current.includes(scope)
      ? current.filter((value) => value !== scope)
      : [...current, scope]);
  }

  if (loading) return <p className="admin-utility-loading" role="status">Caricamento sicurezza…</p>;
  if (!security) return <p className="admin-utility-message is-error" role="alert">{error || 'Le impostazioni di sicurezza non sono disponibili.'}</p>;

  return (
    <div className="admin-security-workspace">
      {error && <p className="admin-utility-message is-error" role="alert">{error}</p>}
      {notice && <p className="admin-utility-message" role="status">{notice}</p>}

      <section className="admin-dashboard-panel admin-utility-section" aria-labelledby="admin-security-mfa-title">
        <div className="admin-dashboard-panel-heading">
          <h2 id="admin-security-mfa-title"><ShieldCheck size={18} aria-hidden="true" /> Verifica in due passaggi</h2>
          <span className={`admin-security-badge${security.totpEnabled ? ' is-active' : ''}`}>
            <i aria-hidden="true" /> {security.totpEnabled ? 'TOTP attivo' : 'TOTP non configurato'}
          </span>
        </div>
        <p className="admin-utility-help">Usa un’app autenticatore per proteggere il login dopo la password. In alternativa al PIN, il codice TOTP o un codice di recupero verifica la sessione amministratore.</p>

        {!security.encryptionConfigured && (
          <div className="admin-security-warning" role="note">
            <TriangleAlert size={18} aria-hidden="true" />
            <span>Prima di attivare TOTP configura <code>ADMIN_MFA_ENCRYPTION_KEY</code> nel file ambiente del server con una chiave base64 da 32 byte. Non inserirla nel frontend né condividerla.</span>
          </div>
        )}

        {!security.totpEnabled && !totpSetup && (
          <form className="admin-security-inline-form" onSubmit={startTotpSetup}>
            <label>Password amministratore
              <input type="password" autoComplete="current-password" value={totpPassword} onChange={(event) => setTotpPassword(event.target.value)} required />
            </label>
            <button className="admin-utility-primary-button" type="submit" disabled={busy !== '' || !security.encryptionConfigured}>
              <Smartphone size={16} aria-hidden="true" /> {busy === 'totp-setup' ? 'Preparazione…' : 'Configura app autenticatore'}
            </button>
          </form>
        )}

        {totpSetup && (
          <div className="admin-security-enrollment">
            <div className="admin-security-secret">
              <span>Chiave segreta da inserire nell’app</span>
              <code>{totpSetup.secret}</code>
              <button className="admin-utility-secondary-button" type="button" onClick={() => copyValue('totp', totpSetup.secret)}>
                {copied === 'totp' ? <Check size={15} /> : <Copy size={15} />} {copied === 'totp' ? 'Copiata' : 'Copia chiave'}
              </button>
            </div>
            <p className="admin-utility-help">L’app deve generare codici a 6 cifre con intervallo di 30 secondi. Setup valido per 10 minuti; la chiave è cifrata sul server.</p>
            <form className="admin-security-inline-form" onSubmit={enableTotp}>
              <label>Codice temporaneo
                <input type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength="6" value={totpCode} onChange={(event) => setTotpCode(event.target.value)} required />
              </label>
              <button className="admin-utility-primary-button" type="submit" disabled={busy !== ''}>
                <Check size={16} aria-hidden="true" /> {busy === 'totp-enable' ? 'Verifica…' : 'Verifica e attiva'}
              </button>
            </form>
          </div>
        )}

        {security.totpEnabled && (
          <div className="admin-security-enabled">
            <p className="admin-utility-status"><i aria-hidden="true" /> TOTP protegge i nuovi accessi · {security.recoveryCodesRemaining} codici di recupero disponibili</p>
            <form className="admin-security-inline-form" onSubmit={disableTotp}>
              <label>Password amministratore
                <input type="password" autoComplete="current-password" value={disablePassword} onChange={(event) => setDisablePassword(event.target.value)} required />
              </label>
              <label>Codice TOTP corrente
                <input type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength="6" value={disableCode} onChange={(event) => setDisableCode(event.target.value)} required />
              </label>
              <button className="admin-utility-danger-button" type="submit" disabled={busy !== ''}>
                {busy === 'totp-disable' ? 'Disattivazione…' : 'Disattiva TOTP'}
              </button>
            </form>
          </div>
        )}

        {recoveryCodes.length > 0 && (
          <div className="admin-recovery-codes" role="alert">
            <strong>Codici di recupero · mostrati una sola volta</strong>
            <p>Conservali in un luogo sicuro. Ogni codice può essere usato una sola volta.</p>
            <div>{recoveryCodes.map((code) => <code key={code}>{code}</code>)}</div>
            <button className="admin-utility-secondary-button" type="button" onClick={downloadRecoveryCodes}>
              <Download size={15} aria-hidden="true" /> Scarica codici
            </button>
          </div>
        )}
      </section>

      <AdminCredentialManagement security={security} />
      <AdminEmailManagement security={security} onUserUpdated={onUserUpdated} onChanged={refreshSecurity} />
      <AdminTrafficManagement />

      <section className="admin-dashboard-panel admin-utility-section" aria-labelledby="admin-security-passkeys-title">
        <div className="admin-dashboard-panel-heading">
          <h2 id="admin-security-passkeys-title"><Fingerprint size={18} aria-hidden="true" /> Passkey e chiavi FIDO2</h2>
          <span className="admin-security-badge">Non attive</span>
        </div>
        <p className="admin-security-warning" role="note">
          <TriangleAlert size={18} aria-hidden="true" />
          <span>La registrazione FIDO2 non è ancora configurata in questa versione. Per sicurezza non simuliamo un flusso senza una corretta integrazione WebAuthn su server e browser.</span>
        </p>
      </section>

      <section className="admin-dashboard-panel admin-utility-section" aria-labelledby="admin-security-tokens-title">
        <div className="admin-dashboard-panel-heading">
          <h2 id="admin-security-tokens-title"><KeyRound size={18} aria-hidden="true" /> Token API</h2>
          <span className="admin-utility-section-note">Accesso read-only</span>
        </div>
        <p className="admin-utility-help">I token sono salvati come hash SHA-256, non consentono modifiche e vengono mostrati integralmente solo alla creazione.</p>
        <form className="admin-security-token-form" onSubmit={createApiToken}>
          <label>Nome riconoscibile
            <input value={tokenName} onChange={(event) => setTokenName(event.target.value)} maxLength="80" placeholder="Es. Report gestionale" required />
          </label>
          <label>Scadenza
            <SelectField className="admin-security-select" value={tokenExpiresInDays} onChange={(event) => setTokenExpiresInDays(event.target.value)}>
              <option value="30">30 giorni</option>
              <option value="90">90 giorni</option>
              <option value="365">1 anno</option>
              <option value="0">Nessuna scadenza</option>
            </SelectField>
          </label>
          <fieldset>
            <legend>Autorizzazioni</legend>
            <label><input type="checkbox" checked={tokenScopes.includes('vehicles:read')} onChange={() => toggleScope('vehicles:read')} /> Lettura inventario</label>
            <label><input type="checkbox" checked={tokenScopes.includes('analytics:read')} onChange={() => toggleScope('analytics:read')} /> Lettura statistiche aggregate</label>
          </fieldset>
          <label>Password amministratore
            <input type="password" autoComplete="current-password" value={tokenPassword} onChange={(event) => setTokenPassword(event.target.value)} required />
          </label>
          <button className="admin-utility-primary-button" type="submit" disabled={busy !== '' || tokenScopes.length === 0}>
            <KeyRound size={16} aria-hidden="true" /> {busy === 'token-create' ? 'Creazione…' : 'Crea token'}
          </button>
        </form>

        {newApiToken && (
          <div className="admin-api-token-once" role="alert">
            <strong>Token API · copialo ora</strong>
            <code>{newApiToken}</code>
            <button className="admin-utility-secondary-button" type="button" onClick={() => copyValue('api-token', newApiToken)}>
              {copied === 'api-token' ? <Check size={15} /> : <Copy size={15} />} {copied === 'api-token' ? 'Copiato' : 'Copia token'}
            </button>
          </div>
        )}

        <div className="admin-api-token-list">
          <h3>Token attivi</h3>
          {security.tokens.length ? security.tokens.map((token) => (
            <article className="admin-api-token-row" key={token._id}>
              <div>
                <strong>{token.name}</strong>
                <code>{token.tokenPrefix}</code>
                <small>{token.scopes.join(' · ')} · {token.lastUsedAt ? `Ultimo uso ${new Date(token.lastUsedAt).toLocaleString('it-IT')}` : 'Mai utilizzato'}</small>
              </div>
              <div className="admin-api-token-controls">
                <small>{token.expiresAt ? `Scade ${new Date(token.expiresAt).toLocaleDateString('it-IT')}` : 'Senza scadenza'}</small>
                {revokeTokenId === token._id ? (
                  <>
                    <button className="admin-utility-danger-button" type="button" disabled={busy !== ''} onClick={() => revokeApiToken(token._id)}>
                      {busy === `token-revoke-${token._id}` ? 'Revoca…' : 'Conferma revoca'}
                    </button>
                    <button className="admin-utility-secondary-button" type="button" onClick={() => setRevokeTokenId('')}>Annulla</button>
                  </>
                ) : (
                  <button className="admin-utility-danger-button" type="button" disabled={busy !== ''} onClick={() => setRevokeTokenId(token._id)}>Revoca</button>
                )}
              </div>
            </article>
          )) : <p className="admin-utility-empty">Non ci sono token API attivi.</p>}
        </div>
        <div className="admin-security-endpoints">
          <strong>Endpoint disponibili</strong>
          <code>GET /api/admin/integration/vehicles · vehicles:read</code>
          <code>GET /api/admin/integration/analytics · analytics:read</code>
        </div>
      </section>
    </div>
  );
}

function AdminCredentialManagement({ security }) {
  const [passwordFields, setPasswordFields] = useState({ currentPassword: '', factor: '', newPassword: '', confirmPassword: '' });
  const [pinFields, setPinFields] = useState({ currentPassword: '', factor: '', newPin: '', confirmPin: '' });
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const factorLabel = security.totpEnabled ? 'Codice TOTP attuale' : 'PIN attuale';

  async function changePassword(event) {
    event.preventDefault();
    if (passwordFields.newPassword !== passwordFields.confirmPassword) {
      setError('Le nuove password non coincidono.');
      return;
    }
    setBusy('password');
    setError('');
    setNotice('');
    try {
      await requestJson('/api/admin/security/credentials/password', {
        method: 'POST',
        body: JSON.stringify({
          currentPassword: passwordFields.currentPassword,
          factor: passwordFields.factor,
          newPassword: passwordFields.newPassword,
        }),
      });
      setPasswordFields({ currentPassword: '', factor: '', newPassword: '', confirmPassword: '' });
      setNotice('Password aggiornata. Le altre sessioni amministratore sono state revocate.');
    } catch (actionError) {
      setError(actionError.message);
    } finally {
      setBusy('');
    }
  }

  async function changePin(event) {
    event.preventDefault();
    if (pinFields.newPin !== pinFields.confirmPin) {
      setError('I nuovi PIN non coincidono.');
      return;
    }
    setBusy('pin');
    setError('');
    setNotice('');
    try {
      await requestJson('/api/admin/security/credentials/pin', {
        method: 'POST',
        body: JSON.stringify({
          currentPassword: pinFields.currentPassword,
          factor: pinFields.factor,
          newPin: pinFields.newPin,
        }),
      });
      setPinFields({ currentPassword: '', factor: '', newPin: '', confirmPin: '' });
      setNotice('PIN aggiornato. Le altre sessioni amministratore sono state revocate.');
    } catch (actionError) {
      setError(actionError.message);
    } finally {
      setBusy('');
    }
  }

  return (
    <section className="admin-dashboard-panel admin-utility-section" aria-labelledby="admin-security-credentials-title">
      <div className="admin-dashboard-panel-heading">
        <h2 id="admin-security-credentials-title"><KeyRound size={18} aria-hidden="true" /> Credenziali amministratore</h2>
        <span className="admin-utility-section-note">Richiede password e secondo fattore</span>
      </div>
      <p className="admin-utility-help">Per ogni modifica verifica la password attuale e {security.totpEnabled ? 'il codice TOTP corrente' : 'il PIN attuale'}. Le altre sessioni vengono revocate.</p>
      {error && <p className="admin-utility-message is-error" role="alert">{error}</p>}
      {notice && <p className="admin-utility-message" role="status">{notice}</p>}
      <div className="admin-security-credential-grid">
        <form className="admin-security-credential-form" onSubmit={changePassword}>
          <h3>Cambia password</h3>
          <label>Password attuale
            <input type="password" autoComplete="current-password" value={passwordFields.currentPassword} onChange={(event) => setPasswordFields((current) => ({ ...current, currentPassword: event.target.value }))} required />
          </label>
          <label>{factorLabel}
            <input type="password" inputMode="numeric" autoComplete={security.totpEnabled ? 'one-time-code' : 'off'} maxLength={security.totpEnabled ? 6 : 4} value={passwordFields.factor} onChange={(event) => setPasswordFields((current) => ({ ...current, factor: event.target.value }))} required />
          </label>
          <label>Nuova password
            <input type="password" autoComplete="new-password" minLength="8" maxLength="72" value={passwordFields.newPassword} onChange={(event) => setPasswordFields((current) => ({ ...current, newPassword: event.target.value }))} required />
          </label>
          <label>Conferma nuova password
            <input type="password" autoComplete="new-password" minLength="8" maxLength="72" value={passwordFields.confirmPassword} onChange={(event) => setPasswordFields((current) => ({ ...current, confirmPassword: event.target.value }))} required />
          </label>
          <p>Almeno 8 caratteri, con minuscole, maiuscole, numeri e simboli.</p>
          <button className="admin-utility-primary-button" type="submit" disabled={busy !== ''}>
            <Save size={15} aria-hidden="true" /> {busy === 'password' ? 'Aggiornamento…' : 'Aggiorna password'}
          </button>
        </form>

        <form className="admin-security-credential-form" onSubmit={changePin}>
          <h3>Cambia PIN amministratore</h3>
          <label>Password attuale
            <input type="password" autoComplete="current-password" value={pinFields.currentPassword} onChange={(event) => setPinFields((current) => ({ ...current, currentPassword: event.target.value }))} required />
          </label>
          <label>{factorLabel}
            <input type="password" inputMode="numeric" autoComplete={security.totpEnabled ? 'one-time-code' : 'off'} maxLength={security.totpEnabled ? 6 : 4} value={pinFields.factor} onChange={(event) => setPinFields((current) => ({ ...current, factor: event.target.value }))} required />
          </label>
          <label>Nuovo PIN · 4 cifre
            <input type="password" inputMode="numeric" pattern="[0-9]{4}" maxLength="4" autoComplete="new-password" value={pinFields.newPin} onChange={(event) => setPinFields((current) => ({ ...current, newPin: event.target.value }))} required />
          </label>
          <label>Conferma nuovo PIN
            <input type="password" inputMode="numeric" pattern="[0-9]{4}" maxLength="4" autoComplete="new-password" value={pinFields.confirmPin} onChange={(event) => setPinFields((current) => ({ ...current, confirmPin: event.target.value }))} required />
          </label>
          <p>{security.totpEnabled ? 'Il PIN si userà se disattivi TOTP.' : 'Il PIN viene salvato come hash e usato al prossimo accesso.'}</p>
          <button className="admin-utility-primary-button" type="submit" disabled={busy !== ''}>
            <KeyRound size={15} aria-hidden="true" /> {busy === 'pin' ? 'Aggiornamento…' : 'Aggiorna PIN'}
          </button>
        </form>
      </div>
    </section>
  );
}

function AdminEmailManagement({ security, onUserUpdated, onChanged }) {
  const [email, setEmail] = useState('');
  const [purpose, setPurpose] = useState('primary');
  const [password, setPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [pending, setPending] = useState(() => security.pendingEmailVerifications?.[0] || null);
  const [removeEmail, setRemoveEmail] = useState('');
  const [removePassword, setRemovePassword] = useState('');
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    setPending(security.pendingEmailVerifications?.[0] || null);
  }, [security.pendingEmailVerifications]);

  async function requestEmailVerification(event) {
    event.preventDefault();
    setBusy('email-request');
    setError('');
    setNotice('');
    try {
      await requestJson('/api/admin/security/emails/request', {
        method: 'POST',
        body: JSON.stringify({ email, purpose, password }),
      });
      setPending({ email: email.trim().toLowerCase(), purpose });
      setEmail('');
      setPassword('');
      setVerificationCode('');
      setNotice(`Codice inviato a ${email.trim()}. La richiesta scade tra 10 minuti.`);
    } catch (actionError) {
      setError(actionError.message);
    } finally {
      setBusy('');
    }
  }

  async function verifyEmail(event) {
    event.preventDefault();
    if (!pending) return;
    setBusy('email-verify');
    setError('');
    setNotice('');
    try {
      const result = await requestJson('/api/admin/security/emails/verify', {
        method: 'POST',
        body: JSON.stringify({ email: pending.email, purpose: pending.purpose, code: verificationCode }),
      });
      if (result.user) onUserUpdated(result.user);
      setPending(null);
      setVerificationCode('');
      setNotice(pending.purpose === 'primary' ? 'Email principale aggiornata.' : 'Email aggiuntiva verificata e attivata.');
      await onChanged();
    } catch (actionError) {
      setError(actionError.message);
    } finally {
      setBusy('');
    }
  }

  async function deleteNotificationEmail(event) {
    event.preventDefault();
    if (!removeEmail) return;
    setBusy(`email-remove-${removeEmail}`);
    setError('');
    setNotice('');
    try {
      await requestJson(`/api/admin/security/emails/notification/${encodeURIComponent(removeEmail)}`, {
        method: 'DELETE',
        body: JSON.stringify({ password: removePassword }),
      });
      setRemoveEmail('');
      setRemovePassword('');
      setNotice('Email aggiuntiva rimossa.');
      await onChanged();
    } catch (actionError) {
      setError(actionError.message);
    } finally {
      setBusy('');
    }
  }

  return (
    <section className="admin-dashboard-panel admin-utility-section" aria-labelledby="admin-security-emails-title">
      <div className="admin-dashboard-panel-heading">
        <h2 id="admin-security-emails-title"><SiteIcon name="people" /> Email account</h2>
        <span className="admin-utility-section-note">Verifica obbligatoria</span>
      </div>
      <div className="admin-security-current-email"><span>Email di accesso attuale</span><strong>{security.accountEmail}</strong></div>
      <p className="admin-utility-help">Un cambio dell’email principale si attiva solo dopo il codice inviato alla nuova casella. Le email secondarie sono contatti verificati dell’account, non credenziali di accesso.</p>
      {error && <p className="admin-utility-message is-error" role="alert">{error}</p>}
      {notice && <p className="admin-utility-message" role="status">{notice}</p>}
      <form className="admin-security-email-form" onSubmit={requestEmailVerification}>
        <label>{purpose === 'primary' ? 'Nuova email di accesso' : 'Email secondaria'}
          <input type="email" autoComplete="email" maxLength="254" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </label>
        <label>Tipo di email
          <SelectField className="admin-security-select" value={purpose} onChange={(event) => setPurpose(event.target.value)}>
            <option value="primary">Sostituisci email di accesso</option>
            <option value="notification">Aggiungi email secondaria</option>
          </SelectField>
        </label>
        <label>Password amministratore
          <input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
        </label>
        <button className="admin-utility-primary-button" type="submit" disabled={busy !== ''}>
          {busy === 'email-request' ? 'Invio codice…' : 'Invia codice di verifica'}
        </button>
      </form>

      {pending && (
        <form className="admin-security-email-verification" onSubmit={verifyEmail}>
          <div><strong>Verifica in attesa</strong><span>{pending.email} · {pending.purpose === 'primary' ? 'email principale' : 'notifiche'}</span></div>
          <label>Codice ricevuto
            <input type="text" inputMode="numeric" pattern="[0-9]{6}" maxLength="6" autoComplete="one-time-code" value={verificationCode} onChange={(event) => setVerificationCode(event.target.value)} required />
          </label>
          <button className="admin-utility-primary-button" type="submit" disabled={busy !== ''}>
            {busy === 'email-verify' ? 'Verifica…' : 'Conferma email'}
          </button>
        </form>
      )}

      <div className="admin-security-notification-emails">
        <h3>Email secondarie verificate</h3>
        {security.notificationEmails.length ? security.notificationEmails.map((entry) => (
          <div className="admin-security-email-row" key={entry.email}>
            <div><strong>{entry.email}</strong><small>Verificata il {new Date(entry.verifiedAt).toLocaleDateString('it-IT')}</small></div>
            {removeEmail === entry.email ? (
              <form onSubmit={deleteNotificationEmail}>
                <label className="visually-hidden">Password per rimuovere l’email
                  <input type="password" autoComplete="current-password" value={removePassword} onChange={(event) => setRemovePassword(event.target.value)} required />
                </label>
                <button className="admin-utility-danger-button" type="submit" disabled={busy !== ''}>Conferma rimozione</button>
                <button className="admin-utility-secondary-button" type="button" onClick={() => { setRemoveEmail(''); setRemovePassword(''); }}>Annulla</button>
              </form>
            ) : (
              <button className="admin-utility-danger-button" type="button" disabled={busy !== ''} onClick={() => setRemoveEmail(entry.email)}>Rimuovi</button>
            )}
          </div>
        )) : <p className="admin-utility-empty">Nessuna email secondaria configurata.</p>}
      </div>
    </section>
  );
}

function AdminAccountsPage() {
  const [security, setSecurity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function refreshSecurity() {
    const { security: loadedSecurity } = await requestJson('/api/admin/security');
    setSecurity(loadedSecurity);
  }

  useEffect(() => {
    let active = true;
    requestJson('/api/admin/security')
      .then(({ security: loadedSecurity }) => {
        if (active) setSecurity(loadedSecurity);
      })
      .catch((loadError) => {
        if (active) setError(loadError.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  return (
    <AdminMotionSection className="admin-page admin-accounts-page section-wrap" labelledBy="admin-accounts-title">
      <div className="admin-heading admin-heading-prominent">
        <div>
          <p className="eyebrow">AREA AMMINISTRATORE · ACCESSI</p>
          <h1 id="admin-accounts-title">Account <em>amministratori.</em></h1>
          <p>Aggiungi amministratori, verifica i loro indirizzi email e revoca gli accessi non più necessari.</p>
        </div>
      </div>
      {loading ? (
        <p className="admin-utility-loading" role="status">Caricamento account amministratori…</p>
      ) : error ? (
        <p className="admin-utility-message is-error" role="alert">{error}</p>
      ) : security ? (
        security.isSuperAdmin ? (
          <AdminAccountsManagement security={security} onChanged={refreshSecurity} />
        ) : (
          <section className="admin-dashboard-panel admin-utility-section" aria-labelledby="admin-accounts-permission-title">
            <div className="admin-dashboard-panel-heading">
              <h2 id="admin-accounts-permission-title"><SiteIcon name="warranty" /> Gestione non disponibile</h2>
            </div>
            <p className="admin-utility-message" role="status">Solo il Super Admin <strong>luigipeluso</strong> può aggiungere o rimuovere amministratori.</p>
          </section>
        )
      ) : (
        <p className="admin-utility-message is-error" role="alert">Gli account amministratori non sono disponibili.</p>
      )}
    </AdminMotionSection>
  );
}

function AdminAccountsManagement({ security, onChanged }) {
  const [form, setForm] = useState({
    name: '',
    username: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    pin: '',
    confirmPin: '',
    currentPassword: '',
    factor: '',
  });
  const [pendingInvitation, setPendingInvitation] = useState(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [removeAdminId, setRemoveAdminId] = useState('');
  const [removalAuth, setRemovalAuth] = useState({ currentPassword: '', factor: '' });
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const factorLabel = security.totpEnabled ? 'Codice TOTP attuale' : 'PIN attuale';

  async function createInvitation(event) {
    event.preventDefault();
    if (form.password !== form.confirmPassword) {
      setError('Le password del nuovo account non coincidono.');
      return;
    }
    if (form.pin !== form.confirmPin) {
      setError('I PIN del nuovo account non coincidono.');
      return;
    }
    setBusy('invite');
    setError('');
    setNotice('');
    try {
      const result = await requestJson('/api/admin/security/admins/invitations', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      setPendingInvitation(result);
      setVerificationCode('');
      setForm((current) => ({ ...current, password: '', confirmPassword: '', pin: '', confirmPin: '', currentPassword: '', factor: '' }));
      setNotice(result.message);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy('');
    }
  }

  async function verifyInvitation(event) {
    event.preventDefault();
    if (!pendingInvitation) return;
    setBusy('verify');
    setError('');
    setNotice('');
    try {
      const result = await requestJson('/api/admin/security/admins/invitations/verify', {
        method: 'POST',
        body: JSON.stringify({ invitationId: pendingInvitation.invitationId, code: verificationCode }),
      });
      setPendingInvitation(null);
      setVerificationCode('');
      setNotice(`Account amministratore creato per ${result.admin.email}.${result.warning ? ` ${result.warning}` : ''}`);
      await onChanged();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy('');
    }
  }

  async function removeAdmin(event) {
    event.preventDefault();
    if (!removeAdminId) return;
    setBusy(`remove-${removeAdminId}`);
    setError('');
    setNotice('');
    try {
      const result = await requestJson(`/api/admin/security/admins/${encodeURIComponent(removeAdminId)}`, {
        method: 'DELETE',
        body: JSON.stringify(removalAuth),
      });
      setRemoveAdminId('');
      setRemovalAuth({ currentPassword: '', factor: '' });
      setNotice(`Accesso amministratore revocato e sessioni chiuse.${result.warning ? ` ${result.warning}` : ''}`);
      await onChanged();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy('');
    }
  }

  return (
    <section className="admin-dashboard-panel admin-utility-section" aria-labelledby="admin-security-admins-title">
      <div className="admin-dashboard-panel-heading">
        <h2 id="admin-security-admins-title"><SiteIcon name="people" /> Account amministratori</h2>
        <span className="admin-utility-section-note">Accessi separati e verificati</span>
      </div>
      <p className="admin-utility-help">Ogni amministratore ha username, password e PIN distinti; l’email deve essere verificata prima dell’attivazione. Accedi con username o email.</p>
      {error && <p className="admin-utility-message is-error" role="alert">{error}</p>}
      {notice && <p className="admin-utility-message" role="status">{notice}</p>}
      <div className="admin-account-list">
        {security.admins.map((admin) => (
          <article className="admin-account-row" key={admin._id}>
            <div>
              <strong>{admin.name}</strong>
              <span>{admin.username ? `@${admin.username} · ` : ''}{admin.email}</span>
            </div>
            {admin.email === security.accountEmail ? <small>Sessione corrente</small> : admin.isBootstrap ? <small>Account bootstrap · non revocabile</small> : (
              removeAdminId === admin._id ? (
                <form className="admin-account-revoke-form" onSubmit={removeAdmin}>
                  <label>Password attuale
                    <input type="password" autoComplete="current-password" value={removalAuth.currentPassword} onChange={(event) => setRemovalAuth((current) => ({ ...current, currentPassword: event.target.value }))} required />
                  </label>
                  <label>{factorLabel}
                    <input type="password" inputMode="numeric" autoComplete={security.totpEnabled ? 'one-time-code' : 'off'} maxLength={security.totpEnabled ? 6 : 4} value={removalAuth.factor} onChange={(event) => setRemovalAuth((current) => ({ ...current, factor: event.target.value }))} required />
                  </label>
                  <button className="admin-utility-danger-button" type="submit" disabled={busy !== ''}>{busy === `remove-${admin._id}` ? 'Revoca…' : 'Conferma revoca'}</button>
                  <button className="admin-utility-secondary-button" type="button" onClick={() => { setRemoveAdminId(''); setRemovalAuth({ currentPassword: '', factor: '' }); }}>Annulla</button>
                </form>
              ) : (
                <button className="admin-utility-danger-button" type="button" disabled={busy !== '' || security.admins.length <= 1 || admin.isBootstrap} onClick={() => setRemoveAdminId(admin._id)}>Revoca accesso</button>
              )
            )}
          </article>
        ))}
      </div>
      <form className="admin-account-invite-form" onSubmit={createInvitation}>
        <h3>Aggiungi un amministratore</h3>
        <div className="admin-utility-fields">
          <label>Nome e cognome
            <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} minLength="2" maxLength="80" required />
          </label>
          <label>Username di accesso
            <input value={form.username} onChange={(event) => setForm((current) => ({ ...current, username: event.target.value.toLowerCase() }))} minLength="3" maxLength="32" pattern="[a-zA-Z0-9._-]{3,32}" autoComplete="off" required />
          </label>
          <label>Email (riceverà il codice di attivazione)
            <input type="email" autoComplete="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} maxLength="254" required />
          </label>
          <label>Telefono
            <input type="tel" value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} maxLength="40" />
          </label>
          <label>Password iniziale
            <input type="password" autoComplete="new-password" value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} minLength="8" maxLength="72" required />
          </label>
          <label>Conferma password iniziale
            <input type="password" autoComplete="new-password" value={form.confirmPassword} onChange={(event) => setForm((current) => ({ ...current, confirmPassword: event.target.value }))} minLength="8" maxLength="72" required />
          </label>
          <label>PIN iniziale · 4 cifre
            <input type="password" inputMode="numeric" autoComplete="new-password" pattern="[0-9]{4}" value={form.pin} onChange={(event) => setForm((current) => ({ ...current, pin: event.target.value }))} maxLength="4" required />
          </label>
          <label>Conferma PIN iniziale
            <input type="password" inputMode="numeric" autoComplete="new-password" pattern="[0-9]{4}" value={form.confirmPin} onChange={(event) => setForm((current) => ({ ...current, confirmPin: event.target.value }))} maxLength="4" required />
          </label>
          <label>Password del tuo account
            <input type="password" autoComplete="current-password" value={form.currentPassword} onChange={(event) => setForm((current) => ({ ...current, currentPassword: event.target.value }))} required />
          </label>
          <label>{factorLabel}
            <input type="password" inputMode="numeric" autoComplete={security.totpEnabled ? 'one-time-code' : 'off'} maxLength={security.totpEnabled ? 6 : 4} value={form.factor} onChange={(event) => setForm((current) => ({ ...current, factor: event.target.value }))} required />
          </label>
        </div>
        <p className="admin-utility-help">La password deve contenere almeno 8 caratteri, minuscole, maiuscole, numeri e simboli. L’invito scade dopo 10 minuti.</p>
        <button className="admin-utility-primary-button" type="submit" disabled={busy !== ''}>
          {busy === 'invite' ? 'Invio codice…' : 'Invia invito email'}
        </button>
      </form>
      {pendingInvitation && (
        <form className="admin-account-verification-form" onSubmit={verifyInvitation}>
          <div><strong>Verifica l’indirizzo del nuovo amministratore</strong><span>Invito valido fino alle {new Date(pendingInvitation.expiresAt).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}</span></div>
          <label>Codice a 8 cifre ricevuto via email
            <input inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{8}" maxLength="8" value={verificationCode} onChange={(event) => setVerificationCode(event.target.value)} required />
          </label>
          <button className="admin-utility-primary-button" type="submit" disabled={busy !== ''}>{busy === 'verify' ? 'Verifica…' : 'Verifica e crea account'}</button>
        </form>
      )}
    </section>
  );
}

function AdminTrafficManagement() {
  const [controls, setControls] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [ipDraft, setIpDraft] = useState({ address: '', mode: 'block', action: 'deny', durationHours: '24', reason: '' });

  async function refreshControls() {
    const { controls: loadedControls } = await requestJson('/api/admin/security/controls');
    setControls(loadedControls);
  }

  useEffect(() => {
    let active = true;
    requestJson('/api/admin/security/controls')
      .then(({ controls: loadedControls }) => {
        if (active) setControls(loadedControls);
      })
      .catch((loadError) => {
        if (active) setError(loadError.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  function updateControl(name, value) {
    setControls((current) => ({ ...current, [name]: value }));
    setError('');
    setNotice('');
  }

  async function saveControls(event) {
    event.preventDefault();
    setBusy('controls-save');
    setError('');
    setNotice('');
    try {
      await requestJson('/api/admin/security/controls', {
        method: 'PUT',
        body: JSON.stringify({
          ddosProtectionEnabled: controls.ddosProtectionEnabled,
          trafficLimitsEnabled: controls.trafficLimitsEnabled,
          perIpRequestsPerDay: Number(controls.perIpRequestsPerDay),
          perIpBytesPerDay: Number(controls.perIpBytesPerDay),
          globalRequestsPerDay: Number(controls.globalRequestsPerDay),
          globalBytesPerDay: Number(controls.globalBytesPerDay),
        }),
      });
      await refreshControls();
      setNotice('Controlli e soglie salvati.');
    } catch (actionError) {
      setError(actionError.message);
    } finally {
      setBusy('');
    }
  }

  async function addIpRule(event) {
    event.preventDefault();
    setBusy('ip-add');
    setError('');
    setNotice('');
    try {
      await requestJson('/api/admin/security/ip-rules', {
        method: 'POST',
        body: JSON.stringify({ ...ipDraft, durationHours: Number(ipDraft.durationHours) }),
      });
      setIpDraft({ address: '', mode: 'block', action: 'deny', durationHours: '24', reason: '' });
      await refreshControls();
      setNotice('Regola IP aggiunta. Gli eventi restano registrati nell’audit.');
    } catch (actionError) {
      setError(actionError.message);
    } finally {
      setBusy('');
    }
  }

  async function removeIpRule(ruleId) {
    setBusy(`ip-remove-${ruleId}`);
    setError('');
    setNotice('');
    try {
      await requestJson(`/api/admin/security/ip-rules/${encodeURIComponent(ruleId)}`, { method: 'DELETE' });
      await refreshControls();
      setNotice('Regola IP rimossa.');
    } catch (actionError) {
      setError(actionError.message);
    } finally {
      setBusy('');
    }
  }

  if (loading) {
    return <section className="admin-dashboard-panel admin-utility-section"><p className="admin-utility-loading" role="status">Caricamento limiti e regole IP…</p></section>;
  }
  if (!controls) {
    return <section className="admin-dashboard-panel admin-utility-section"><p className="admin-utility-message is-error" role="alert">{error || 'I controlli del traffico non sono disponibili.'}</p></section>;
  }

  const formatBytes = (value) => {
    const bytes = Number(value) || 0;
    if (bytes < 1024) return `${bytes} B`;
    const units = ['KB', 'MB', 'GB', 'TB'];
    let amount = bytes / 1024;
    let unit = 0;
    while (amount >= 1024 && unit < units.length - 1) {
      amount /= 1024;
      unit += 1;
    }
    return `${new Intl.NumberFormat('it-IT', { maximumFractionDigits: 1 }).format(amount)} ${units[unit]}`;
  };
  return (
    <section className="admin-dashboard-panel admin-utility-section" aria-labelledby="admin-security-traffic-title">
      <div className="admin-dashboard-panel-heading">
        <h2 id="admin-security-traffic-title"><ShieldCheck size={18} aria-hidden="true" /> Traffico, IP e mitigazioni</h2>
        <span className="admin-utility-section-note">Controlli applicativi</span>
      </div>
      {(error || notice) && <p className={`admin-utility-message${error ? ' is-error' : ''}`} role={error ? 'alert' : 'status'}>{error || notice}</p>}
      <div className="admin-security-warning" role="note">
        <TriangleAlert size={18} aria-hidden="true" />
        <span>Queste sono mitigazioni a livello Express e limiti per questo server; non sostituiscono una protezione DDoS di rete/CDN. La soglia automatica è 120 richieste al minuto per IP. Le soglie giornaliere sono indipendenti dal toggle anti-abuso.</span>
      </div>
      <form className="admin-security-controls-form" onSubmit={saveControls}>
        <label className="admin-security-toggle">
          <input type="checkbox" checked={controls.ddosProtectionEnabled} onChange={(event) => updateControl('ddosProtectionEnabled', event.target.checked)} />
          <span><strong>Mitigazione burst per IP</strong><small>{controls.ddosProtectionEnabled ? 'Attiva · 120 richieste/minuto per IP' : 'Disattivata · non applica la soglia al minuto'}</small></span>
        </label>
        <label className="admin-security-toggle">
          <input type="checkbox" checked={controls.trafficLimitsEnabled} onChange={(event) => updateControl('trafficLimitsEnabled', event.target.checked)} />
          <span><strong>Limiti giornalieri di traffico</strong><small>{controls.trafficLimitsEnabled ? 'Attivi · le richieste oltre soglia ricevono HTTP 429' : 'Disattivati · i contatori continuano a registrare il traffico'}</small></span>
        </label>
        <div className="admin-security-limit-grid">
          <label>Richieste giornaliere per IP
            <input type="number" min="60" max="1000000" step="1" value={controls.perIpRequestsPerDay} onChange={(event) => updateControl('perIpRequestsPerDay', event.target.value)} required />
          </label>
          <label>Byte giornalieri per IP
            <input type="number" min="1048576" max="5368709120" step="1" value={controls.perIpBytesPerDay} onChange={(event) => updateControl('perIpBytesPerDay', event.target.value)} required />
            <small>{formatBytes(controls.perIpBytesPerDay)}</small>
          </label>
          <label>Richieste globali giornaliere
            <input type="number" min="1000" max="10000000" step="1" value={controls.globalRequestsPerDay} onChange={(event) => updateControl('globalRequestsPerDay', event.target.value)} required />
          </label>
          <label>Byte globali giornalieri
            <input type="number" min="10485760" max="10995116277760" step="1" value={controls.globalBytesPerDay} onChange={(event) => updateControl('globalBytesPerDay', event.target.value)} required />
            <small>{formatBytes(controls.globalBytesPerDay)}</small>
          </label>
        </div>
        <button className="admin-utility-primary-button" type="submit" disabled={busy !== ''}>
          <Save size={15} aria-hidden="true" /> {busy === 'controls-save' ? 'Salvataggio…' : 'Salva limiti'}
        </button>
      </form>

      <div className="admin-security-traffic-stats">
        <article><span>Traffico globale oggi · {controls.traffic.day}</span><strong>{controls.traffic.globalRequests.toLocaleString('it-IT')} richieste</strong><small>{formatBytes(controls.traffic.globalBytes)} trasferiti</small></article>
        <article><span>IP di questa sessione · {controls.currentIp || 'non rilevato'}</span><strong>{controls.traffic.currentIpRequests.toLocaleString('it-IT')} richieste</strong><small>{formatBytes(controls.traffic.currentIpBytes)} trasferiti</small></article>
      </div>
      <p className="admin-utility-help">Il conteggio include Content-Length delle richieste e delle risposte HTTP. I contatori giornalieri sono conservati per 90 giorni; gli indirizzi IP non autorizzati vengono registrati negli eventi di sicurezza.</p>

      <form className="admin-security-ip-form" onSubmit={addIpRule}>
        <h3>Regole IP · indirizzi singoli IPv4/IPv6</h3>
        <label>Indirizzo IP
          <input value={ipDraft.address} onChange={(event) => setIpDraft((current) => ({ ...current, address: event.target.value }))} placeholder="203.0.113.10 oppure IPv6" required />
        </label>
        <label>Regola
          <SelectField className="admin-security-select" value={ipDraft.mode} onChange={(event) => setIpDraft((current) => ({ ...current, mode: event.target.value }))}>
            <option value="block">Limita IP</option>
            <option value="allow">Autorizza IP · esclude limiti per-IP</option>
          </SelectField>
        </label>
        <label>Azione per IP limitato
          <SelectField className="admin-security-select" value={ipDraft.action} onChange={(event) => setIpDraft((current) => ({ ...current, action: event.target.value }))} disabled={ipDraft.mode !== 'block'}>
            <option value="deny">Risposta generica 404</option>
            <option value="throttle">Limita con risposta 429</option>
          </SelectField>
        </label>
        <label>Durata
          <SelectField className="admin-security-select" value={ipDraft.durationHours} onChange={(event) => setIpDraft((current) => ({ ...current, durationHours: event.target.value }))}>
            <option value="1">1 ora</option><option value="24">24 ore</option><option value="168">7 giorni</option><option value="720">30 giorni</option><option value="8760">1 anno</option><option value="0">Permanente</option>
          </SelectField>
        </label>
        <label className="is-wide">Motivo audit · facoltativo
          <input maxLength="160" value={ipDraft.reason} onChange={(event) => setIpDraft((current) => ({ ...current, reason: event.target.value }))} />
        </label>
        <button className="admin-utility-primary-button" type="submit" disabled={busy !== ''}>
          <MapPin size={15} aria-hidden="true" /> {busy === 'ip-add' ? 'Aggiunta…' : 'Aggiungi regola IP'}
        </button>
      </form>
      <p className="admin-utility-help">Non puoi bloccare l’IP della sessione corrente. Le regole IP si applicano al traffico pubblico; le route di controllo sicurezza restano accessibili all’amministratore autenticato. “Autorizza IP” salta i limiti per-IP ma non quelli globali.</p>

      <div className="admin-security-ip-rules">
        <h3>Regole configurate</h3>
        {controls.ipRules.length ? controls.ipRules.map((rule) => {
          const expired = rule.expiresAt && new Date(rule.expiresAt) <= new Date();
          return (
            <article className={`admin-security-ip-row${expired ? ' is-expired' : ''}`} key={rule.id}>
              <div><strong>{rule.address} · {rule.mode === 'allow' ? 'autorizzato' : rule.action === 'throttle' ? 'limitato (429)' : 'bloccato (404)'}</strong><small>{rule.reason || 'Nessun motivo indicato'} · {expired ? 'Scaduta' : rule.expiresAt ? `Fino al ${new Date(rule.expiresAt).toLocaleString('it-IT')}` : 'Permanente'}</small></div>
              <button className="admin-utility-danger-button" type="button" disabled={busy !== ''} onClick={() => removeIpRule(rule.id)}>{busy === `ip-remove-${rule.id}` ? 'Rimozione…' : 'Rimuovi'}</button>
            </article>
          );
        }) : <p className="admin-utility-empty">Nessuna regola IP configurata.</p>}
      </div>

    </section>
  );
}

function AdminSecurityAuditPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    requestJson('/api/admin/security/controls')
      .then(({ controls }) => {
        if (active) setEvents(Array.isArray(controls?.events) ? controls.events : []);
      })
      .catch((loadError) => {
        if (active) setError(loadError.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  return (
    <AdminMotionSection className="admin-page admin-security-audit-page section-wrap" labelledBy="admin-security-audit-title">
      <div className="admin-heading admin-heading-prominent">
        <div>
          <p className="eyebrow">AREA AMMINISTRATORE · SICUREZZA</p>
          <h1 id="admin-security-audit-title">Audit sicurezza <em>recente.</em></h1>
          <p>Consulta gli ultimi eventi registrati dal sistema di protezione e dalle modifiche ai controlli admin.</p>
        </div>
        <div className="admin-heading-actions">
          <AdminReportExportButton reportType="security-audit" />
        </div>
      </div>
      <section className="admin-dashboard-panel admin-utility-section admin-security-event-list" aria-labelledby="admin-security-audit-list-title">
        <div className="admin-dashboard-panel-heading">
          <h2 id="admin-security-audit-list-title"><SiteIcon name="audit" /> Eventi registrati</h2>
          <span className="admin-utility-section-note">Ultimi 30 eventi</span>
        </div>
        {loading ? (
          <p className="admin-utility-loading" role="status">Caricamento audit…</p>
        ) : error ? (
          <p className="admin-utility-message is-error" role="alert">{error}</p>
        ) : events.length ? (
          events.map((event) => (
            <article key={event.id}>
              <div>
                <strong>{ADMIN_SECURITY_EVENT_LABELS[event.type] || 'Evento sicurezza'}</strong>
                <small>{event.details}{event.ipAddress ? ` · IP ${event.ipAddress}` : ''}</small>
              </div>
              <time dateTime={event.createdAt}>{new Date(event.createdAt).toLocaleString('it-IT')}</time>
            </article>
          ))
        ) : <p className="admin-utility-empty">Nessun evento di sicurezza registrato.</p>}
      </section>
    </AdminMotionSection>
  );
}

function AdminActivityLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    requestJson('/api/admin/activity-logs')
      .then(({ logs: activityLogs }) => {
        if (active) setLogs(Array.isArray(activityLogs) ? activityLogs : []);
      })
      .catch((loadError) => {
        if (active) setError(loadError.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  return (
    <AdminMotionSection className="admin-page admin-logs-page section-wrap" labelledBy="admin-activity-logs-title">
      <div className="admin-heading admin-heading-prominent">
        <div>
          <p className="eyebrow">AREA AMMINISTRATORE · ATTIVITÀ</p>
          <h1 id="admin-activity-logs-title">Attività <em>amministrative.</em></h1>
          <p>Registro delle operazioni effettuate dagli amministratori su contenuti e richieste.</p>
        </div>
        <div className="admin-heading-actions">
          <AdminReportExportButton reportType="logs" />
        </div>
      </div>
      <section className="admin-dashboard-panel admin-utility-section admin-security-event-list" aria-labelledby="admin-activity-logs-list-title">
        <div className="admin-dashboard-panel-heading">
          <h2 id="admin-activity-logs-list-title"><SiteIcon name="audit" /> Attività registrate</h2>
          <span className="admin-utility-section-note">Ultime 100 attività</span>
        </div>
        {loading ? (
          <p className="admin-utility-loading" role="status">Caricamento attività…</p>
        ) : error ? (
          <p className="admin-utility-message is-error" role="alert">{error}</p>
        ) : logs.length ? (
          logs.map((log) => (
            <article key={log.id}>
              <div>
                <strong>{log.resource} · {({ created: 'Creato', updated: 'Modificato', deleted: 'Eliminato' })[log.action] || 'Operazione'}</strong>
                <small>
                  {log.actorName} · {log.outcome === 'success' ? 'Completata' : `Non riuscita (HTTP ${log.statusCode})`}
                  {log.targetId ? ` · Riferimento ${log.targetId}` : ''}
                </small>
              </div>
              <time dateTime={log.createdAt}>{new Date(log.createdAt).toLocaleString('it-IT')}</time>
            </article>
          ))
        ) : <p className="admin-utility-empty">Nessuna attività amministrativa registrata.</p>}
      </section>
    </AdminMotionSection>
  );
}

function AdminConsoleHeader({
  searchTerm,
  onSearchTermChange,
  onNavigate,
  onLogout,
  vehicles,
  purchaseRequests,
  priceOffers,
  rentalRequests,
  visitRequests,
  sellSubmissions,
  timeZone = 'Europe/Rome',
}) {
  const [now, setNow] = useState(() => new Date());
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notificationsRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenError, setFullscreenError] = useState('');

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!notificationsOpen) return undefined;
    const closeOnOutsideClick = (event) => {
      if (notificationsRef.current && event.target instanceof Node && !notificationsRef.current.contains(event.target)) {
        setNotificationsOpen(false);
      }
    };
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setNotificationsOpen(false);
    };
    document.addEventListener('pointerdown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [notificationsOpen]);

  useEffect(() => {
    const syncFullscreenState = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', syncFullscreenState);
    return () => document.removeEventListener('fullscreenchange', syncFullscreenState);
  }, []);

  const pendingCounts = useMemo(() => ({
    purchases: purchaseRequests.filter((request) => request.status === 'pending').length,
    offers: priceOffers.filter((offer) => offer.status === 'pending').length,
    rentals: rentalRequests.filter((request) => request.status === 'pending').length,
    visits: visitRequests.filter((request) => request.status === 'pending').length,
    messages: sellSubmissions.filter((submission) => !['accepted', 'rejected', 'closed'].includes(submission.status)).length,
  }), [purchaseRequests, priceOffers, rentalRequests, visitRequests, sellSubmissions]);

  const searchResults = useMemo(() => {
    const records = [
      ...vehicles.map((vehicle) => ({
        key: `vehicle-${vehicle.id}`,
        title: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
        detail: `Inventario · ${vehicle.type === 'rent' ? 'Noleggio' : 'Vendita'} · ${euro.format(getVehicleCurrentPrice(vehicle))}`,
        searchText: [vehicle.id, vehicle.year, vehicle.make, vehicle.model, vehicle.type, vehicle.color, vehicle.fuel, vehicle.transmission].join(' '),
        path: '/admin/inventory',
      })),
      ...purchaseRequests.map((request) => ({
        key: `purchase-${request.id}`,
        title: `${request.customer?.name || 'Cliente'} · ${request.vehicle?.year || ''} ${request.vehicle?.make || ''} ${request.vehicle?.model || ''}`.trim(),
        detail: `Richiesta acquisto · ${request.customer?.email || request.id}`,
        searchText: [request.id, request.customer?.name, request.customer?.email, request.customer?.phone, request.vehicle?.year, request.vehicle?.make, request.vehicle?.model, request.status].join(' '),
        path: '/admin/purchases',
      })),
      ...priceOffers.map((offer) => ({
        key: `offer-${offer.id}`,
        title: `${offer.customer?.name || 'Cliente'} · ${offer.vehicle?.year || ''} ${offer.vehicle?.make || ''} ${offer.vehicle?.model || ''}`.trim(),
        detail: `Proposta prezzo · ${euro.format(offer.amount || 0)} · ${offer.customer?.email || offer.id}`,
        searchText: [offer.id, offer.customer?.name, offer.customer?.email, offer.customer?.phone, offer.vehicle?.year, offer.vehicle?.make, offer.vehicle?.model, offer.amount, offer.status].join(' '),
        path: '/admin/offers',
      })),
      ...rentalRequests.map((request) => ({
        key: `rental-${request.id}`,
        title: `${request.customer?.name || 'Cliente'} · ${request.vehicle?.year || ''} ${request.vehicle?.make || ''} ${request.vehicle?.model || ''}`.trim(),
        detail: `Richiesta noleggio · ${request.customer?.email || request.id}`,
        searchText: [request.id, request.customer?.name, request.customer?.email, request.customer?.phone, request.vehicle?.year, request.vehicle?.make, request.vehicle?.model, request.status].join(' '),
        path: '/admin/rentals',
      })),
      ...visitRequests.map((request) => ({
        key: `visit-${request.id}`,
        title: `${request.customer?.name || request.name || 'Cliente'} · ${request.vehicle?.year || ''} ${request.vehicle?.make || ''} ${request.vehicle?.model || ''}`.trim(),
        detail: `Visita in concessionaria · ${request.customer?.email || request.email || request.id}`,
        searchText: [request.id, request.customer?.name, request.name, request.customer?.email, request.email, request.customer?.phone, request.phone, request.vehicle?.year, request.vehicle?.make, request.vehicle?.model, request.status].join(' '),
        path: '/admin/visits',
      })),
      ...sellSubmissions.map((submission) => ({
        key: `submission-${submission.id}`,
        title: `${submission.name || 'Cliente'} · ${submission.year || ''} ${submission.make || ''} ${submission.model || ''}`.trim(),
        detail: `Messaggi e vendite · ${submission.email || submission.id}`,
        searchText: [submission.id, submission.name, submission.email, submission.phone, submission.year, submission.make, submission.model, submission.status].join(' '),
        path: '/admin/messages',
      })),
    ];
    const query = searchTerm.trim().toLocaleLowerCase('it-IT');
    if (!query) return [];
    return records
      .filter((record) => record.searchText.toLocaleLowerCase('it-IT').includes(query))
      .slice(0, 7);
  }, [vehicles, purchaseRequests, priceOffers, rentalRequests, visitRequests, sellSubmissions, searchTerm]);

  const notifications = [
    { key: 'purchases', label: 'Richieste acquisto da gestire', path: '/admin/purchases' },
    { key: 'offers', label: 'Proposte prezzo da valutare', path: '/admin/offers' },
    { key: 'rentals', label: 'Richieste noleggio da gestire', path: '/admin/rentals' },
    { key: 'visits', label: 'Visite da confermare', path: '/admin/visits' },
    { key: 'messages', label: 'Messaggi e proposte da gestire', path: '/admin/messages' },
  ].filter((item) => pendingCounts[item.key] > 0);
  const notificationCount = notifications.reduce((total, item) => total + pendingCounts[item.key], 0);
  function selectResult(result) {
    onSearchTermChange(searchTerm);
    setSearchOpen(false);
    onNavigate(result.path);
  }

  async function toggleFullscreen() {
    setFullscreenError('');
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await document.documentElement.requestFullscreen();
      }
    } catch {
      setFullscreenError('Schermo intero non disponibile.');
    }
  }

  return (
    <div className="admin-console-header">
      <div className="admin-global-search">
        <form className="admin-global-search-form" role="search" onSubmit={(event) => { event.preventDefault(); if (searchResults[0]) selectResult(searchResults[0]); }}>
          <SiteIcon name="search" />
          <label className="visually-hidden" htmlFor="admin-record-search">Cerca un record</label>
          <input
            id="admin-record-search"
            type="search"
            value={searchTerm}
            onFocus={() => setSearchOpen(true)}
            onChange={(event) => { onSearchTermChange(event.target.value); setSearchOpen(true); }}
            onKeyDown={(event) => { if (event.key === 'Escape') setSearchOpen(false); }}
            placeholder="Cerca nel gestionale..."
            autoComplete="off"
            aria-expanded={searchOpen && Boolean(searchTerm.trim())}
            aria-controls="admin-search-results"
          />
          {searchTerm && <button className="admin-search-clear" type="button" aria-label="Cancella ricerca" onClick={() => { onSearchTermChange(''); setSearchOpen(true); }}><SiteIcon name="close" /></button>}
          <kbd>INVIO</kbd>
        </form>
        {searchOpen && searchTerm.trim() && (
          <div className="admin-search-results" id="admin-search-results" role="listbox" aria-label="Risultati della ricerca">
            {searchResults.length ? searchResults.map((result) => (
              <button type="button" role="option" aria-selected="false" key={result.key} onClick={() => selectResult(result)}>
                <span className="admin-search-result-icon"><SiteIcon name={result.path === '/admin/inventory' ? 'car' : result.path === '/admin/offers' ? 'price' : 'people'} /></span>
                <span><strong>{result.title}</strong><small>{result.detail}</small></span>
                <SiteIcon className="admin-search-result-arrow" name="chevronRight" />
              </button>
            )) : <p className="admin-search-empty">Nessun record corrisponde alla ricerca.</p>}
          </div>
        )}
      </div>
      <div className="admin-console-tools">
        <div className="admin-notifications" ref={notificationsRef}>
          <button className="admin-notifications-toggle" type="button" aria-label={`Notifiche: ${notificationCount} elementi da gestire`} aria-expanded={notificationsOpen} onClick={() => { setNotificationsOpen((open) => !open); setSearchOpen(false); }}>
            <Bell size={14} strokeWidth={1.7} aria-hidden="true" />
            {notificationCount > 0 && <span>{notificationCount}</span>}
          </button>
          {notificationsOpen && (
            <div className="admin-notifications-panel">
              <strong>Da gestire<span className="admin-notifications-total">{notificationCount}</span></strong>
              {notifications.length ? notifications.map((item) => (
                <button type="button" key={item.key} onClick={() => { setNotificationsOpen(false); onNavigate(item.path); }}>
                  <span className="admin-notification-label">{item.label}</span><b>{pendingCounts[item.key]}</b>
                </button>
              )) : <p>Nessuna notifica in sospeso.</p>}
            </div>
          )}
        </div>
        <div className="admin-console-datetime" aria-label="Data e ora locali">
          <span className="admin-console-date">
            <CalendarDays size={15} strokeWidth={1.7} aria-hidden="true" />
            <time dateTime={now.toISOString()}>{new Intl.DateTimeFormat('it-IT', { day: '2-digit', month: 'long', year: 'numeric', timeZone }).format(now)}</time>
          </span>
          <span className="admin-console-time">
            <Clock3 size={15} strokeWidth={1.7} aria-hidden="true" />
            <time dateTime={now.toISOString()}>{new Intl.DateTimeFormat('it-IT', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone }).format(now)}</time>
          </span>
        </div>
        <button className="admin-fullscreen-toggle" type="button" onClick={toggleFullscreen} aria-label={isFullscreen ? 'Esci da schermo intero' : 'Attiva schermo intero'} title={isFullscreen ? 'Esci da schermo intero' : 'Schermo intero'}>
          {isFullscreen ? <Minimize2 size={16} strokeWidth={1.7} aria-hidden="true" /> : <Maximize2 size={16} strokeWidth={1.7} aria-hidden="true" />}
        </button>
        {fullscreenError && <span className="admin-fullscreen-error" role="status">{fullscreenError}</span>}
      </div>
    </div>
  );
}

function getTermsAcceptanceLabel(request, timeZone = 'Europe/Rome') {
  if (request.termsAccepted !== true) return 'Accettazione termini non registrata';
  if (!request.termsAcceptedAt) return 'Termini e condizioni accettati';
  const acceptedAt = new Date(request.termsAcceptedAt);
  if (!Number.isFinite(acceptedAt.getTime())) return 'Termini e condizioni accettati';
  return `Termini e condizioni accettati · ${acceptedAt.toLocaleString('it-IT', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone,
  })}`;
}

function AdminVisitRequestsPanel({ requests, loading, error, actionBusy, actionStatus, onDecision, globalSearchTerm = '', timeZone = 'Europe/Rome' }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  useEffect(() => setSearchTerm(globalSearchTerm), [globalSearchTerm]);
  const counts = useMemo(() => ({
    pending: requests.filter((request) => request.status === 'pending').length,
    accepted: requests.filter((request) => request.status === 'accepted').length,
    declined: requests.filter((request) => request.status === 'declined').length,
    total: requests.length,
  }), [requests]);
  const filteredRequests = useMemo(() => {
    const query = searchTerm.trim().toLocaleLowerCase('it-IT');
    return requests.filter((request) => (
      (statusFilter === 'all' || request.status === statusFilter)
      && (!query || [
        request.id,
        request.customer?.name,
        request.name,
        request.customer?.email,
        request.email,
        request.customer?.phone,
        request.phone,
        request.vehicle?.year,
        request.vehicle?.make,
        request.vehicle?.model,
      ].some((value) => String(value || '').toLocaleLowerCase('it-IT').includes(query)))
    ));
  }, [requests, searchTerm, statusFilter]);
  const notificationLabel = {
    admin: {
      sent: 'Notifica email inviata all’amministrazione',
      failed: 'Notifica email all’amministrazione non riuscita',
      not_configured: 'Email amministrazione non configurata',
      unknown: 'Stato notifica email non verificato',
      pending: 'Notifica email in invio',
    },
    customer: {
      sent: 'Esito comunicato al cliente via email',
      failed: 'Email al cliente non inviata',
      not_configured: 'Email cliente non configurata',
      unknown: 'Stato email al cliente non verificato',
      pending: 'Email al cliente in invio',
      not_sent: 'Esito non ancora comunicato',
    },
  };

  return (
    <>
      <section className="admin-rental-overview admin-visit-overview" role="group" aria-label="Filtra richieste di visita">
        <button type="button" aria-pressed={statusFilter === 'pending'} onClick={() => setStatusFilter('pending')}><span>Da gestire</span><strong>{counts.pending}</strong></button>
        <button type="button" aria-pressed={statusFilter === 'accepted'} onClick={() => setStatusFilter('accepted')}><span>Accettate</span><strong>{counts.accepted}</strong></button>
        <button type="button" aria-pressed={statusFilter === 'declined'} onClick={() => setStatusFilter('declined')}><span>Rifiutate</span><strong>{counts.declined}</strong></button>
        <button type="button" aria-pressed={statusFilter === 'all'} onClick={() => setStatusFilter('all')}><span>Totali</span><strong>{counts.total}</strong></button>
      </section>
      <section className="admin-submissions admin-visit-requests" aria-labelledby="admin-visit-requests-title">
        <div className="admin-submissions-heading">
          <div>
            <p className="eyebrow">APPUNTAMENTI · VISITE AUTO</p>
            <h2 id="admin-visit-requests-title">Richieste di visita <span>{filteredRequests.length}</span></h2>
          </div>
          <label className="admin-visit-search">
            <span className="visually-hidden">Cerca cliente o auto</span>
            <SiteIcon name="search" />
            <input type="search" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Cerca cliente o auto" />
          </label>
        </div>
        {error && <p className="form-error" role="alert">{error}</p>}
        {loading && <p className="admin-submissions-empty" role="status">Caricamento richieste di visita…</p>}
        {!loading && !error && requests.length === 0 && <p className="admin-submissions-empty">Non ci sono richieste di visita da gestire.</p>}
        {!loading && !error && requests.length > 0 && filteredRequests.length === 0 && <p className="admin-submissions-empty">Nessuna richiesta corrisponde al filtro selezionato.</p>}
        {!loading && !error && filteredRequests.length > 0 && (
          <div className="admin-visit-request-list">
            {filteredRequests.map((request) => {
              const visitDate = new Date(request.visitAt);
              const visitLabel = Number.isFinite(visitDate.getTime())
                ? visitDate.toLocaleString('it-IT', { dateStyle: 'full', timeStyle: 'short', timeZone })
                : 'Data non disponibile';
              const statusLabel = request.status === 'accepted'
                ? 'Accettata'
                : request.status === 'declined' ? 'Rifiutata' : 'Da gestire';
              const notificationStatus = request.status === 'pending'
                ? request.adminNotificationStatus
                : request.customerNotificationStatus;
              const notificationGroup = request.status === 'pending' ? notificationLabel.admin : notificationLabel.customer;

              return (
                <AdminVisitRequestCard
                  key={request.id}
                  request={request}
                  visitLabel={visitLabel}
                  timeZone={timeZone}
                  statusLabel={statusLabel}
                  notificationLabel={notificationGroup[notificationStatus] || notificationGroup.unknown}
                  actionBusy={actionBusy}
                  actionStatus={actionStatus}
                  onDecision={onDecision}
                />
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}

function AdminVisitRequestCard({
  request,
  visitLabel,
  timeZone,
  statusLabel,
  notificationLabel,
  actionBusy,
  actionStatus,
  onDecision,
}) {
  const [reason, setReason] = useState('');
  const trimmedReason = reason.trim();
  const isPending = request.status === 'pending';
  const isBusy = actionBusy === request.id;

  return (
    <article className="customer-request admin-visit-request">
      <div className="customer-request-header">
        <div>
          <span className={`admin-submission-status ${request.status === 'accepted' ? 'status-accepted' : request.status === 'declined' ? 'status-rejected' : 'status-reviewing'}`}>
            {statusLabel}
          </span>
          <h3>{request.vehicle.year} {request.vehicle.make} {request.vehicle.model}</h3>
        </div>
        <time dateTime={request.createdAt}>{new Date(request.createdAt).toLocaleDateString('it-IT', { timeZone })}</time>
      </div>
      <div className="admin-visit-request-summary">
        <ProgressiveImage className="admin-visit-image" src={request.vehicle.image} alt={`${request.vehicle.make} ${request.vehicle.model}`} />
        <div className="admin-visit-request-details">
          <div>
            <span className="admin-purchase-detail-label">VISITA RICHIESTA</span>
            <strong>{visitLabel}</strong>
          </div>
          <div>
            <span className="admin-purchase-detail-label">CLIENTE</span>
            <strong>{request.customer.name}</strong>
          </div>
          <div className="admin-purchase-contacts">
            <a href={`mailto:${encodeURIComponent(request.customer.email)}`}><SiteIcon name="mail" />{request.customer.email}</a>
            <a href={`tel:${request.customer.phone.replace(/[^\d+]/g, '')}`}><SiteIcon name="phone" />{request.customer.phone}</a>
          </div>
          <span className={`request-terms-status${request.termsAccepted === true ? ' is-accepted' : ''}`}>
            {getTermsAcceptanceLabel(request, timeZone)}
          </span>
          <span className="admin-visit-notification">{notificationLabel}</span>
        </div>
      </div>
      {request.message && <p className="admin-visit-customer-message">{request.message}</p>}
      {isPending ? (
        <div className="admin-visit-decision">
          <label className="admin-visit-decision-field">
            <span className="admin-visit-decision-label">Motivo della decisione <small>Facoltativo</small></span>
            <textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              maxLength={500}
              rows={3}
              placeholder="Aggiungi un motivo, se lo desideri…"
              aria-label={`Motivo decisione per ${request.vehicle.make} ${request.vehicle.model}`}
              aria-describedby={`visit-decision-reason-${request.id}`}
            />
            <small id={`visit-decision-reason-${request.id}`} className="admin-visit-decision-hint">
              Facoltativo · massimo 500 caratteri.
            </small>
          </label>
          <div className="admin-visit-decision-actions">
            <button
              className="button button-accent"
              type="button"
              disabled={isBusy}
              onClick={() => onDecision(request, 'accepted', trimmedReason)}
            >
              {isBusy ? 'Salvataggio…' : 'Accetta visita'}
            </button>
            <button
              className="button button-outline"
              type="button"
              disabled={isBusy}
              onClick={() => onDecision(request, 'declined', trimmedReason)}
            >
              Rifiuta visita
            </button>
          </div>
          {actionStatus.requestId === request.id && actionStatus.error && <p className="form-error" role="alert">{actionStatus.error}</p>}
        </div>
      ) : (
        <div className="admin-visit-decision-note">
          <strong>Motivo della decisione</strong>
          <p>{request.decisionReason || 'Nessun motivo indicato.'}</p>
          <small>{notificationLabel}</small>
        </div>
      )}
      {actionStatus.requestId === request.id && actionStatus.message && <p className="form-success" role="status">{actionStatus.message}</p>}
    </article>
  );
}

function AdminPurchaseRequestsPanel({ requests, totalCount, hasFilters, error, actionBusy, actionStatus, onAccept, timeZone = 'Europe/Rome' }) {
  return (
    <section className="admin-submissions" aria-labelledby="admin-purchase-requests-title">
      <div className="admin-submissions-heading">
        <div>
          <p className="eyebrow">CONTATTI · AUTO IN VENDITA</p>
          <h2 id="admin-purchase-requests-title">Richieste di acquisto <span>{requests.length}</span></h2>
        </div>
      </div>
      {error && <p className="form-error" role="alert">{error}</p>}
      {!error && requests.length === 0 && (
        <p className="admin-submissions-empty">
          {hasFilters && totalCount > 0 ? 'Nessuna richiesta corrisponde ai filtri selezionati.' : 'Non ci sono richieste d’acquisto da gestire.'}
        </p>
      )}
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
              <time dateTime={request.createdAt}>{new Date(request.createdAt).toLocaleDateString('it-IT', { timeZone })}</time>
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
                  <span className={`request-terms-status${request.termsAccepted === true ? ' is-accepted' : ''}`}>
                    {getTermsAcceptanceLabel(request, timeZone)}
                  </span>
                </div>
                <div className="admin-purchase-terms">
                  <span className="admin-purchase-price"><SiteIcon name="price" /><span>Prezzo auto <b>{euro.format(getVehicleCurrentPrice(request.vehicle))}</b>{getVehicleDiscountPrice(request.vehicle) !== null && <del className="vehicle-original-price">{euro.format(request.vehicle.price)}</del>}</span></span>
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

function CustomerVehicleCard({ vehicle, badge, isSaved, onOpen, onToggleSave }) {
  return (
    <article className="customer-vehicle-card">
      <a className="customer-vehicle-card-image" href={`/auto/${vehicle.id}`} onClick={(event) => { event.preventDefault(); onOpen(vehicle.id); }}>
        <ProgressiveImage src={vehicle.image || vehicle.images?.[0]} alt={`${vehicle.make} ${vehicle.model}`} />
        <span>{badge}</span>
      </a>
      <div className="customer-vehicle-card-content">
        <p>{vehicle.year} · {vehicle.make}</p>
        <h3>{vehicle.model}</h3>
        <strong>{euro.format(getVehicleCurrentPrice(vehicle))}{vehicle.type === 'rent' ? ' / giorno' : ''}</strong>
        <div className="customer-vehicle-card-actions">
          <a href={`/auto/${vehicle.id}`} onClick={(event) => { event.preventDefault(); onOpen(vehicle.id); }}>Dettagli <span aria-hidden="true">↗</span></a>
          <button
            type="button"
            aria-pressed={isSaved}
            aria-label={isSaved ? `Rimuovi ${vehicle.make} ${vehicle.model} dalla selezione` : `Salva ${vehicle.make} ${vehicle.model} nella selezione`}
            onClick={() => onToggleSave(vehicle)}
          >
            {isSaved ? 'Rimuovi' : 'Salva'}
          </button>
        </div>
      </div>
    </article>
  );
}

function CustomerVehiclePriceOffersWorkspace({
  offers,
  loading,
  error,
  businessName = DEFAULT_SITE_SETTINGS.businessName,
  actionBusy,
  actionStatus,
  onRespond,
  onOpenVehicle,
  onBrowseVehicles,
}) {
  const statusLabels = {
    pending: 'In attesa del concessionario',
    countered: 'Risposta richiesta',
    accepted: 'Accettata',
    declined: 'Rifiutata',
  };
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest');
  const searchQuery = searchTerm.trim().toLocaleLowerCase('it-IT');
  const counts = useMemo(() => ({
    total: offers.length,
    pending: offers.filter((offer) => offer.status === 'pending').length,
    countered: offers.filter((offer) => offer.status === 'countered').length,
    completed: offers.filter((offer) => ['accepted', 'declined'].includes(offer.status)).length,
  }), [offers]);
  const filteredOffers = useMemo(() => offers
    .filter((offer) => {
      const historyText = (offer.history || []).map((entry) => entry.message || '').join(' ');
      const searchableText = [
        offer.vehicle?.make,
        offer.vehicle?.model,
        offer.vehicle?.year,
        offer.status,
        offer.amount,
        offer.vehicle?.askingPrice,
        historyText,
      ].join(' ').toLocaleLowerCase('it-IT');
      const matchesStatus = statusFilter === 'all'
        || (statusFilter === 'completed'
          ? ['accepted', 'declined'].includes(offer.status)
          : offer.status === statusFilter);
      return matchesStatus
        && (!searchQuery || searchableText.includes(searchQuery));
    })
    .slice()
    .sort((left, right) => {
      if (sortOrder === 'highest') return right.amount - left.amount;
      if (sortOrder === 'lowest') return left.amount - right.amount;
      const leftTime = Date.parse(left.respondedAt || left.history?.at(-1)?.createdAt || left.createdAt);
      const rightTime = Date.parse(right.respondedAt || right.history?.at(-1)?.createdAt || right.createdAt);
      const difference = (Number.isFinite(rightTime) ? rightTime : 0) - (Number.isFinite(leftTime) ? leftTime : 0);
      return sortOrder === 'oldest' ? -difference : difference;
    }), [offers, searchQuery, sortOrder, statusFilter]);
  const hasFilters = Boolean(searchQuery) || statusFilter !== 'all' || sortOrder !== 'newest';

  return (
    <section className="customer-purchases customer-price-offers" id="customer-price-offers" aria-labelledby="customer-price-offers-title">
      <div className="customer-purchases-heading">
        <p className="eyebrow">TRATTATIVE RISERVATE</p>
        <h2 id="customer-price-offers-title">Le tue proposte di prezzo</h2>
        <p>Segui ogni negoziazione, confronta le cifre e rispondi alle controfferte del concessionario.</p>
      </div>
      <div className="customer-price-offer-summary" role="group" aria-label="Filtra le trattative per stato">
        <button type="button" aria-pressed={statusFilter === 'all'} onClick={() => setStatusFilter('all')}>
          <span>Totali</span><strong>{counts.total}</strong>
        </button>
        <button type="button" aria-pressed={statusFilter === 'pending'} onClick={() => setStatusFilter('pending')}>
          <span>In attesa</span><strong>{counts.pending}</strong>
        </button>
        <button type="button" aria-pressed={statusFilter === 'countered'} onClick={() => setStatusFilter('countered')}>
          <span>Tocca a te</span><strong>{counts.countered}</strong>
        </button>
        <button type="button" aria-pressed={statusFilter === 'completed'} onClick={() => setStatusFilter('completed')}>
          <span>Concluse</span><strong>{counts.completed}</strong>
        </button>
      </div>
      {loading && <p className="customer-purchases-empty" role="status">Aggiornamento delle tue trattative…</p>}
      {error && <p className="form-error" role="alert">{error}</p>}
      {!loading && !error && offers.length === 0 && (
        <div className="customer-price-offer-empty">
          <strong>La tua prossima auto potrebbe avere il prezzo giusto.</strong>
          <p>Apri un annuncio in vendita e invia una proposta: la trattativa resterà privata nella tua area personale.</p>
          <button className="button button-accent button-small" type="button" onClick={onBrowseVehicles}>Esplora le auto</button>
        </div>
      )}
      {!loading && !error && offers.length > 0 && (
        <div className="customer-price-offer-toolbar" aria-label="Filtri proposte di prezzo">
          <label>
            <span>Cerca auto o messaggio</span>
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Marca, modello, anno…"
              autoComplete="off"
            />
          </label>
          <label>
            <span>Stato</span>
            <SelectField value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="all">Tutte le trattative</option>
              <option value="pending">In attesa del concessionario</option>
              <option value="countered">Tocca a te</option>
              <option value="completed">Concluse</option>
              <option value="accepted">Accettate</option>
              <option value="declined">Rifiutate</option>
            </SelectField>
          </label>
          <label>
            <span>Ordina per</span>
            <SelectField value={sortOrder} onChange={(event) => setSortOrder(event.target.value)}>
              <option value="newest">Ultimo aggiornamento</option>
              <option value="oldest">Meno recenti</option>
              <option value="highest">Importo più alto</option>
              <option value="lowest">Importo più basso</option>
            </SelectField>
          </label>
          <span className="customer-price-offer-results" role="status">
            {filteredOffers.length} {filteredOffers.length === 1 ? 'trattativa' : 'trattative'}
          </span>
          <button
            className="customer-price-offer-reset"
            type="button"
            disabled={!hasFilters}
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('all');
              setSortOrder('newest');
            }}
          >
            Azzera filtri
          </button>
        </div>
      )}
      {!loading && !error && offers.length > 0 && filteredOffers.length === 0 && (
        <p className="customer-purchases-empty">Nessuna trattativa corrisponde ai filtri selezionati.</p>
      )}
      <div className="customer-price-offer-list">
        {filteredOffers.map((offer) => (
          <article className="customer-price-offer-card" key={offer.id}>
            <div className="customer-price-offer-visual">
              <ProgressiveImage src={offer.vehicle.image} alt={`${offer.vehicle.make} ${offer.vehicle.model}`} />
              <a href={`/auto/${offer.vehicle.id}`} onClick={(event) => { event.preventDefault(); onOpenVehicle(offer.vehicle.id); }}>
                Apri annuncio <span aria-hidden="true">↗</span>
              </a>
            </div>
            <div className="customer-price-offer-content">
              <div className="customer-price-offer-heading">
                <span className={`customer-price-offer-status status-${offer.status}`}>
                  {statusLabels[offer.status] || 'Aggiornata'}
                </span>
                <time dateTime={offer.respondedAt || offer.history?.at(-1)?.createdAt || offer.createdAt}>
                  Ultimo aggiornamento {new Date(offer.respondedAt || offer.history?.at(-1)?.createdAt || offer.createdAt).toLocaleDateString('it-IT')}
                </time>
              </div>
              <h3>{offer.vehicle.year} {offer.vehicle.make} {offer.vehicle.model}</h3>
              <div className="customer-price-offer-prices">
                <div><span>Prezzo di riferimento</span><strong>{revenueEuro.format(offer.vehicle.askingPrice)}</strong></div>
                <div><span>Ultima cifra proposta</span><strong>{revenueEuro.format(offer.amount)}</strong></div>
                {Number.isFinite(offer.vehicle.askingPrice) && Number.isFinite(offer.amount) && (
                  <div className="is-highlighted"><span>Differenza dal prezzo</span><strong>{revenueEuro.format(offer.vehicle.askingPrice - offer.amount)}</strong></div>
                )}
              </div>
              <div className="customer-price-offer-history">
                <h4>Conversazione</h4>
                <ol className="price-offer-history" aria-label="Storico della trattativa">
                  {(offer.history || []).map((entry, index) => <li className={entry.actor === 'admin' ? 'from-admin' : 'from-customer'} key={`${entry.createdAt}-${index}`}>
                    <span>{entry.actor === 'admin' ? businessName : 'Tu'}</span>
                    <strong>{revenueEuro.format(entry.amount)}</strong>
                    {entry.message && <p>{entry.message}</p>}
                    <time dateTime={entry.createdAt}>{new Date(entry.createdAt).toLocaleString('it-IT')}</time>
                  </li>)}
                </ol>
              </div>
              {offer.status === 'accepted' && <p className="customer-price-offer-note">Proposta accettata. Il concessionario ti contatterà per definire i dettagli dell’acquisto.</p>}
              {offer.status === 'declined' && <p className="customer-price-offer-note">Questa trattativa è conclusa. Puoi continuare a esplorare le auto disponibili.</p>}
              {offer.status === 'pending' && <p className="customer-price-offer-note">Il concessionario sta valutando la tua ultima proposta. La conversazione si aggiorna automaticamente.</p>}
              {offer.status === 'countered' && <div className="customer-price-offer-actions">
                <p className="customer-price-offer-note">Il concessionario ha risposto: accetta la cifra, rifiutala oppure invia una controproposta.</p>
                <div className="customer-price-offer-action-buttons">
                  <button className="button button-accent button-small" type="button" disabled={actionBusy === offer.id} onClick={() => onRespond(offer, 'accepted')}>
                    {actionBusy === offer.id ? 'Aggiornamento…' : 'Accetta importo'}
                  </button>
                  <button className="button button-outline button-small" type="button" disabled={actionBusy === offer.id} onClick={() => onRespond(offer, 'declined')}>Rifiuta</button>
                </div>
                <form className="customer-price-offer-counter-form" onSubmit={(event) => {
                  event.preventDefault();
                  const formData = new FormData(event.currentTarget);
                  onRespond(offer, 'countered', Number(formData.get('amount')), String(formData.get('message') || ''));
                }}>
                  <label>La tua nuova proposta
                    <input name="amount" type="number" min="0.01" max={(offer.amount - 0.01).toFixed(2)} step="0.01" placeholder="€" required />
                  </label>
                  <label>Nota <span>(facoltativa)</span>
                    <input name="message" type="text" maxLength="500" placeholder="Es. posso concludere a questa cifra" />
                  </label>
                  <button className="button button-outline button-small" type="submit" disabled={actionBusy === offer.id}>Invia controproposta</button>
                </form>
              </div>}
              {actionStatus.offerId === offer.id && actionStatus.error && <p className="form-error" role="alert">{actionStatus.error}</p>}
              {actionStatus.offerId === offer.id && actionStatus.message && <p className="form-success" role="status">{actionStatus.message}</p>}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function AdminVehiclePriceOffersPanel({ offers, loading, error, actionBusy, actionStatus, onRespond, onRefresh, globalSearchTerm = '', businessName = DEFAULT_SITE_SETTINGS.businessName }) {
  const statusLabels = {
    pending: 'Da valutare',
    accepted: 'Accettata',
    declined: 'Rifiutata',
    countered: 'In attesa del cliente',
  };
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest');
  useEffect(() => setSearchTerm(globalSearchTerm), [globalSearchTerm]);
  const searchQuery = searchTerm.trim().toLocaleLowerCase('it-IT');
  const counts = useMemo(() => ({
    total: offers.length,
    pending: offers.filter((offer) => offer.status === 'pending').length,
    countered: offers.filter((offer) => offer.status === 'countered').length,
    accepted: offers.filter((offer) => offer.status === 'accepted').length,
    declined: offers.filter((offer) => offer.status === 'declined').length,
  }), [offers]);
  const filteredOffers = useMemo(() => offers
    .filter((offer) => {
      const historyText = (offer.history || []).map((entry) => entry.message || '').join(' ');
      const searchableText = [
        offer.id,
        offer.customer?.name,
        offer.customer?.email,
        offer.customer?.phone,
        offer.vehicle?.year,
        offer.vehicle?.make,
        offer.vehicle?.model,
        offer.amount,
        offer.vehicle?.askingPrice,
        historyText,
      ].join(' ').toLocaleLowerCase('it-IT');
      return (statusFilter === 'all' || offer.status === statusFilter)
        && (!searchQuery || searchableText.includes(searchQuery));
    })
    .slice()
    .sort((left, right) => {
      if (sortOrder === 'highest') return right.amount - left.amount;
      if (sortOrder === 'lowest') return left.amount - right.amount;
      const leftTime = Date.parse(left.respondedAt || left.history?.at(-1)?.createdAt || left.createdAt);
      const rightTime = Date.parse(right.respondedAt || right.history?.at(-1)?.createdAt || right.createdAt);
      const difference = (Number.isFinite(rightTime) ? rightTime : 0) - (Number.isFinite(leftTime) ? leftTime : 0);
      return sortOrder === 'oldest' ? -difference : difference;
    }), [offers, searchQuery, sortOrder, statusFilter]);
  const hasFilters = Boolean(searchQuery) || statusFilter !== 'all' || sortOrder !== 'newest';
  const exportCountLabel = filteredOffers.length === 1 ? 'proposta visibile' : 'proposte visibili';
  const exportFilteredOffers = () => {
    const columns = [
      'Codice',
      'Stato',
      'Cliente',
      'Email',
      'Telefono',
      'Veicolo',
      'Ultima cifra',
      'Prezzo di riferimento',
      'Differenza',
      'Scostamento percentuale',
      'Ultimo aggiornamento',
    ];
    const rows = filteredOffers.map((offer) => {
      const askingPrice = Number(offer.vehicle?.askingPrice);
      const amount = Number(offer.amount);
      const difference = askingPrice - amount;
      const updatedAt = offer.respondedAt || offer.history?.at(-1)?.createdAt || offer.createdAt;
      const percentage = Number.isFinite(askingPrice) && askingPrice > 0 && Number.isFinite(difference)
        ? (Math.abs(difference) / askingPrice) * 100
        : '';
      return [
        offer.id,
        statusLabels[offer.status] || 'Da valutare',
        offer.customer?.name || 'Cliente',
        offer.customer?.email || '',
        offer.customer?.phone || '',
        `${offer.vehicle?.year || ''} ${offer.vehicle?.make || ''} ${offer.vehicle?.model || ''}`.trim(),
        Number.isFinite(amount) ? amount.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '',
        Number.isFinite(askingPrice) ? askingPrice.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '',
        Number.isFinite(difference) ? difference.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '',
        percentage === '' ? '' : `${percentage.toLocaleString('it-IT', { maximumFractionDigits: 1 })}%`,
        updatedAt ? new Date(updatedAt).toLocaleString('it-IT') : '',
      ];
    });
    downloadCsvFile(`proposte-prezzo-${new Date().toISOString().slice(0, 10)}.csv`, [columns, ...rows]);
  };

  return (
    <section className="admin-submissions admin-vehicle-price-offers" aria-labelledby="admin-price-offers-title">
      <div className="admin-submissions-heading">
        <div>
          <p className="eyebrow">NEGOZIAZIONI · AUTO IN VENDITA</p>
          <h2 id="admin-price-offers-title">Proposte di prezzo <span>{counts.total}</span></h2>
          <p>Gestisci le offerte dei clienti, rispondi con una decisione o una controfferta e segui ogni passaggio.</p>
        </div>
        <div className="admin-price-offer-tools">
          <button
            className="button button-outline button-small admin-price-offer-export"
            type="button"
            onClick={exportFilteredOffers}
            disabled={loading || filteredOffers.length === 0}
            aria-label={`Esporta ${filteredOffers.length} ${exportCountLabel} in formato CSV`}
          >
            <Download size={15} aria-hidden="true" />
            Esporta CSV
          </button>
          <button className="button button-outline button-small admin-price-offer-refresh" type="button" onClick={onRefresh} disabled={loading}>
            <RefreshCw size={14} aria-hidden="true" />
            {loading ? 'Aggiornamento…' : 'Aggiorna'}
          </button>
        </div>
      </div>
      {loading && <p className="reviews-status" role="status">Caricamento delle proposte…</p>}
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="admin-price-offer-summary" aria-label="Riepilogo proposte di prezzo">
        {[
          { key: 'all', label: 'Totali', count: counts.total },
          { key: 'pending', label: 'Da valutare', count: counts.pending },
          { key: 'countered', label: 'Attesa cliente', count: counts.countered },
          { key: 'accepted', label: 'Accettate', count: counts.accepted },
          { key: 'declined', label: 'Rifiutate', count: counts.declined },
        ].map((item) => (
          <button className={statusFilter === item.key ? 'is-selected' : ''} type="button" key={item.key} aria-pressed={statusFilter === item.key} onClick={() => setStatusFilter(item.key)}>
            <span>{item.label}</span><strong>{item.count}</strong>
          </button>
        ))}
      </div>
      {offers.length > 0 && (
        <div className="admin-purchase-filters admin-price-offer-filters" aria-label="Filtri proposte di prezzo">
          <label className="admin-purchase-filter-control admin-purchase-filter-search">
            <span><SiteIcon name="search" /> Cerca cliente, auto o trattativa</span>
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Nome, email, telefono, modello"
              autoComplete="off"
            />
          </label>
          <label className="admin-purchase-filter-control">
            <span><SiteIcon name="sort" /> Ordina per</span>
            <SelectField value={sortOrder} onChange={(event) => setSortOrder(event.target.value)}>
              <option value="newest">Ultimo aggiornamento</option>
              <option value="oldest">Meno recenti</option>
              <option value="highest">Importo più alto</option>
              <option value="lowest">Importo più basso</option>
            </SelectField>
          </label>
          <span className="admin-purchase-filter-results" role="status">
            {filteredOffers.length} {filteredOffers.length === 1 ? 'proposta' : 'proposte'}
          </span>
          <button className="admin-purchase-filter-reset" type="button" disabled={!hasFilters} onClick={() => {
            setSearchTerm('');
            setStatusFilter('all');
            setSortOrder('newest');
          }}>
            <SiteIcon name="close" /> Azzera
          </button>
        </div>
      )}
      {!loading && !error && offers.length === 0 && <p className="admin-submissions-empty">Non ci sono ancora proposte di prezzo.</p>}
      {!loading && !error && offers.length > 0 && filteredOffers.length === 0 && <p className="admin-submissions-empty">Nessuna proposta corrisponde ai filtri selezionati.</p>}
      <div className="admin-vehicle-offer-list">
        {filteredOffers.map((offer) => {
          const askingPrice = Number(offer.vehicle?.askingPrice);
          const amount = Number(offer.amount);
          const difference = askingPrice - amount;
          const differencePercentage = Number.isFinite(askingPrice) && askingPrice > 0 && Number.isFinite(difference)
            ? (Math.abs(difference) / askingPrice) * 100
            : null;
          const differenceDirection = difference > 0 ? 'sotto il prezzo' : difference < 0 ? 'sopra il prezzo' : 'in linea';
          return (
            <article className="admin-vehicle-price-offer" key={offer.id}>
              <div className="customer-request-header">
                <div>
                  <span className={`admin-submission-status status-${offer.status}`}>{statusLabels[offer.status] || 'Da valutare'}</span>
                  <h3>{offer.vehicle.year} {offer.vehicle.make} {offer.vehicle.model}</h3>
                </div>
                <time dateTime={offer.respondedAt || offer.history?.at(-1)?.createdAt || offer.createdAt}>
                  Ultimo aggiornamento {new Date(offer.respondedAt || offer.history?.at(-1)?.createdAt || offer.createdAt).toLocaleString('it-IT')}
                </time>
              </div>
              <div className="admin-vehicle-offer-details">
                <ProgressiveImage src={offer.vehicle.image} alt={`${offer.vehicle.make} ${offer.vehicle.model}`} />
                <div>
                  <p>Cliente <strong>{offer.customer?.name || 'Cliente'}</strong></p>
                  {offer.customer?.email && <a href={`mailto:${encodeURIComponent(offer.customer.email)}`}>{offer.customer.email}</a>}
                  {offer.customer?.phone && <a href={`tel:${offer.customer.phone.replace(/[^\d+]/g, '')}`}>{offer.customer.phone}</a>}
                  <div className="admin-vehicle-offer-prices">
                    <span>Ultima cifra <strong>{revenueEuro.format(offer.amount)}</strong></span>
                    <span>Prezzo di riferimento <strong>{revenueEuro.format(offer.vehicle.askingPrice)}</strong></span>
                    <span className="admin-vehicle-offer-difference">
                      Differenza <strong>{revenueEuro.format(difference)}</strong>
                      {differencePercentage !== null && <small>{differencePercentage.toLocaleString('it-IT', { maximumFractionDigits: 1 })}% {differenceDirection}</small>}
                    </span>
                  </div>
                  <div className="admin-vehicle-offer-history">
                    <h4>Storico trattativa</h4>
                    <ol className="price-offer-history" aria-label="Storico della trattativa">
                      {(offer.history || []).map((entry, index) => <li className={entry.actor === 'admin' ? 'from-admin' : 'from-customer'} key={`${entry.createdAt}-${index}`}>
                        <span>{entry.actor === 'admin' ? businessName : 'Cliente'}</span>
                        <strong>{revenueEuro.format(entry.amount)}</strong>
                        {entry.message && <p>{entry.message}</p>}
                        <time dateTime={entry.createdAt}>{new Date(entry.createdAt).toLocaleString('it-IT')}</time>
                      </li>)}
                    </ol>
                  </div>
                </div>
              </div>
              {offer.status === 'pending' && (
                <div className="admin-vehicle-offer-actions">
                  <button className="button button-accent button-small" type="button" disabled={actionBusy === offer.id} onClick={() => onRespond(offer, 'accepted')}>
                    {actionBusy === offer.id ? 'Aggiornamento…' : 'Accetta proposta'}
                  </button>
                  <button className="button button-outline button-small" type="button" disabled={actionBusy === offer.id} onClick={() => onRespond(offer, 'declined')}>
                    Rifiuta
                  </button>
                  {offer.customer?.id ? (
                    <form onSubmit={(event) => {
                      event.preventDefault();
                      const formData = new FormData(event.currentTarget);
                      const amount = Number(formData.get('counterAmount'));
                      onRespond(offer, 'countered', amount, String(formData.get('message') || ''));
                    }}>
                      <label>
                        Nuova controfferta
                        <input name="counterAmount" type="number" min={(offer.amount + 0.01).toFixed(2)} max={offer.vehicle.askingPrice} step="0.01" placeholder="€" required />
                      </label>
                      <label className="admin-vehicle-offer-message-field">
                        Nota <span>(facoltativa)</span>
                        <input name="message" type="text" maxLength="500" placeholder="Es. importo migliore disponibile" />
                      </label>
                      <button className="button button-outline button-small" type="submit" disabled={actionBusy === offer.id}>Invia controfferta</button>
                    </form>
                  ) : (
                    <p className="admin-vehicle-offer-guest-note">
                      Cliente senza account: contattalo direttamente usando i recapiti indicati.
                    </p>
                  )}
                </div>
              )}
              {actionStatus.offerId === offer.id && actionStatus.error && <p className="form-error" role="alert">{actionStatus.error}</p>}
              {actionStatus.offerId === offer.id && actionStatus.message && <p className="form-success" role="status">{actionStatus.message}</p>}
            </article>
          );
        })}
      </div>
    </section>
  );
}

function AdminPurchaseRequestsWorkspace({ requests, requestError, requestActionBusy, requestActionStatus, onAcceptRequest, globalSearchTerm = '', timeZone = 'Europe/Rome' }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest');
  useEffect(() => setSearchTerm(globalSearchTerm), [globalSearchTerm]);
  const searchQuery = searchTerm.trim().toLocaleLowerCase('it-IT');
  const counts = useMemo(() => ({
    pending: requests.filter((request) => request.status === 'pending').length,
    accepted: requests.filter((request) => request.status === 'accepted').length,
    total: requests.length,
  }), [requests]);

  const matchesSearch = (...values) => !searchQuery || values.some((value) => (
    String(value ?? '').toLocaleLowerCase('it-IT').includes(searchQuery)
  ));
  const sortByCreatedAt = (records) => records.sort((left, right) => {
    const leftTime = Date.parse(left.createdAt);
    const rightTime = Date.parse(right.createdAt);
    const difference = (Number.isFinite(rightTime) ? rightTime : 0) - (Number.isFinite(leftTime) ? leftTime : 0);
    return sortOrder === 'newest' ? difference : -difference;
  });

  const filteredRequests = useMemo(() => sortByCreatedAt(
    requests.filter((request) => (
      (statusFilter === 'all' || request.status === statusFilter)
      && matchesSearch(
        request.id,
        request.customer?.name,
        request.customer?.email,
        request.customer?.phone,
        request.vehicle?.year,
        request.vehicle?.make,
        request.vehicle?.model,
      )
    )),
  ), [requests, searchQuery, statusFilter, sortOrder]);

  const hasFilters = Boolean(searchQuery) || statusFilter !== 'all' || sortOrder !== 'newest';

  return (
    <>
      <section className="admin-rental-overview admin-purchase-overview" role="group" aria-label="Filtra richieste d’acquisto">
        <button type="button" aria-pressed={statusFilter === 'pending'} onClick={() => setStatusFilter('pending')}><span>Da gestire</span><strong>{counts.pending}</strong></button>
        <button type="button" aria-pressed={statusFilter === 'accepted'} onClick={() => setStatusFilter('accepted')}><span>Accettate</span><strong>{counts.accepted}</strong></button>
        <button type="button" aria-pressed={statusFilter === 'all'} onClick={() => setStatusFilter('all')}><span>Richieste totali</span><strong>{counts.total}</strong></button>
      </section>
      <section className="admin-purchase-filters" aria-label="Filtri richieste di acquisto">
        <label className="admin-purchase-filter-control admin-purchase-filter-search">
          <span><SiteIcon name="search" /> Cerca cliente o auto</span>
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Nome, email, telefono, modello"
            autoComplete="off"
          />
        </label>
        <label className="admin-purchase-filter-control">
          <span><SiteIcon name="check" /> Stato</span>
          <SelectField value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="all">Tutti gli stati</option>
            <option value="pending">In attesa</option>
            <option value="contacted">Contattato</option>
            <option value="accepted">Accettata</option>
            <option value="declined">Rifiutata</option>
            <option value="countered">Controfferta inviata</option>
          </SelectField>
        </label>
        <label className="admin-purchase-filter-control">
          <span><SiteIcon name="sort" /> Ordina per</span>
          <SelectField value={sortOrder} onChange={(event) => setSortOrder(event.target.value)}>
            <option value="newest">Più recenti</option>
            <option value="oldest">Meno recenti</option>
          </SelectField>
        </label>
        <span className="admin-purchase-filter-results" role="status">
          {filteredRequests.length} {filteredRequests.length === 1 ? 'risultato' : 'risultati'}
        </span>
        <button
          className="admin-purchase-filter-reset"
          type="button"
          disabled={!hasFilters}
          onClick={() => {
            setSearchTerm('');
            setStatusFilter('all');
            setSortOrder('newest');
          }}
        >
          <SiteIcon name="close" /> Azzera
        </button>
      </section>
      <AdminPurchaseRequestsPanel
        requests={filteredRequests}
        totalCount={requests.length}
        hasFilters={hasFilters}
        error={requestError}
        actionBusy={requestActionBusy}
        actionStatus={requestActionStatus}
        onAccept={onAcceptRequest}
        timeZone={timeZone}
      />
    </>
  );
}

const AdminAnalyticsWorkspace = memo(function AdminAnalyticsWorkspace({
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
});

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

function CatalogVehicleImageGallery({ vehicle, onOpen, linkLabel }) {
  const images = Array.isArray(vehicle.images) && vehicle.images.length
    ? vehicle.images
    : [vehicle.image].filter(Boolean);
  const [imageIndex, setImageIndex] = useState(() => Math.max(0, images.indexOf(vehicle.image)));
  const [photoDirection, setPhotoDirection] = useState(null);
  const currentImageIndex = Math.max(0, Math.min(imageIndex, images.length - 1));
  const currentImage = images[currentImageIndex];
  const vehicleName = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
  const touchStartXRef = useRef(null);
  const lastSwipeTimeRef = useRef(0);
  const changePhoto = (direction) => {
    setPhotoDirection(direction);
    setImageIndex((currentIndex) => (
      (currentIndex + (direction === 'next' ? 1 : -1) + images.length) % images.length
    ));
  };
  const selectPhoto = (index) => {
    if (index === currentImageIndex) return;
    const forwardDistance = (index - currentImageIndex + images.length) % images.length;
    setPhotoDirection(forwardDistance <= images.length / 2 ? 'next' : 'previous');
    setImageIndex(index);
  };

  return (
    <div className="catalog-gallery-block">
      <div className="vehicle-image-wrap catalog-vehicle-gallery">
        <a
          className="vehicle-detail-link"
          href={`/auto/${vehicle.id}`}
          aria-label={linkLabel}
          onClick={(event) => {
            if (Date.now() - lastSwipeTimeRef.current < 500) {
              event.preventDefault();
              return;
            }
            event.preventDefault();
            onOpen(vehicle.id);
          }}
          onTouchStart={(event) => {
            touchStartXRef.current = event.changedTouches[0]?.clientX ?? null;
          }}
          onTouchEnd={(event) => {
            const touchStartX = touchStartXRef.current;
            const touchEndX = event.changedTouches[0]?.clientX;
            touchStartXRef.current = null;
            if (images.length < 2 || touchStartX === null || touchEndX === undefined) return;

            const swipeDistance = touchEndX - touchStartX;
            if (Math.abs(swipeDistance) < 40) return;

            lastSwipeTimeRef.current = Date.now();
            changePhoto(swipeDistance < 0 ? 'next' : 'previous');
          }}
          onTouchCancel={() => { touchStartXRef.current = null; }}
        >
          <ProgressiveImage
            key={`${vehicle.id}-${currentImageIndex}`}
            src={currentImage}
            alt={`${vehicleName} - foto ${currentImageIndex + 1}`}
            className={`vehicle-card-image${photoDirection ? ` photo-slide-in-${photoDirection}` : ''}`}
          />
        </a>
        {images.length > 1 && (
          <>
            <button
              className="vehicle-photo-nav-button is-previous"
              type="button"
              aria-label={`Mostra la foto precedente di ${vehicle.make} ${vehicle.model}`}
              onClick={() => changePhoto('previous')}
            >
              <SiteIcon name="chevronLeft" />
            </button>
            <button
              className="vehicle-photo-nav-button is-next"
              type="button"
              aria-label={`Mostra la foto successiva di ${vehicle.make} ${vehicle.model}`}
              onClick={() => changePhoto('next')}
            >
              <SiteIcon name="chevronRight" />
            </button>
          </>
        )}
        {images.length > 0 && (
          <div className="catalog-gallery-overlay">
            <VehiclePhotoIndicators
              imageCount={images.length}
              currentIndex={currentImageIndex}
              label={`Foto di ${vehicle.make} ${vehicle.model}`}
              onSelect={selectPhoto}
              className="is-overlay"
            />
            <span
              className="catalog-photo-count"
              role="status"
              aria-label={`Foto ${currentImageIndex + 1} di ${images.length}`}
              aria-live="polite"
            >
              <SiteIcon name="image" />
              <span>
                <strong>{currentImageIndex + 1}<i>/</i>{images.length}</strong>
              </span>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

const VehiclePhotoIndicators = memo(function VehiclePhotoIndicators({ imageCount, currentIndex, label, onSelect, className = '' }) {
  if (imageCount < 2) return null;

  return (
    <div className={`vehicle-photo-indicators${className ? ` ${className}` : ''}`} role="group" aria-label={label}>
      {Array.from({ length: imageCount }, (_, index) => (
        <button
          className={index === currentIndex ? 'vehicle-photo-indicator is-active' : 'vehicle-photo-indicator'}
          key={index}
          type="button"
          aria-label={`Mostra foto ${index + 1} di ${imageCount}`}
          aria-pressed={index === currentIndex}
          onClick={() => onSelect(index)}
        >
          <span aria-hidden="true" />
        </button>
      ))}
    </div>
  );
});

function CatalogVehicleCard({ vehicle, onOpen, onSelect, isSelected, isLoggedIn, purchaseRequestCount = 0, onDiscountExpire }) {
  const power = getVehiclePowerDetails(vehicle);
  const engine = vehicle.engine || (vehicle.engineDisplacementCc
    ? `${kilometer.format(vehicle.engineDisplacementCc)} cm³`
    : '—');
  const formattedPower = power.cvValue
    ? `${power.cv} CV${power.kw ? ` · ${power.kw} kW` : ''}`
    : power.cv || '—';

  return (
    <article className="vehicle-card">
      <CatalogVehicleImageGallery
        vehicle={vehicle}
        onOpen={onOpen}
        linkLabel={`Dettagli ${vehicle.make} ${vehicle.model}, ${kilometer.format(vehicle.viewCount || 0)} visualizzazioni${vehicle.type === 'buy' ? `, ${kilometer.format(purchaseRequestCount)} richieste d'acquisto` : ''}`}
      />
      <span className="vehicle-type">{vehicle.type === 'rent' ? 'NOLEGGIO' : 'IN VENDITA'}</span>
      <div className="vehicle-info">
        <div className="vehicle-title-row">
          <div>
            <p className="vehicle-make">{vehicle.make} · {vehicle.year} · {vehicle.color}</p>
            <h3><a href={`/auto/${vehicle.id}`} onClick={(event) => { event.preventDefault(); onOpen(vehicle.id); }}>{vehicle.model}</a></h3>
          </div>
        </div>
        <div className="vehicle-meta">
          <span>{kilometer.format(vehicle.mileageKm)} km</span>
          <span className="meta-divider" />
          <span>{vehicle.bodyType || (vehicle.type === 'rent' ? 'Noleggio' : 'Disponibile subito')}</span>
        </div>
        <div className="vehicle-engagement" aria-label={`Statistiche ${vehicle.make} ${vehicle.model}`}>
          <span className="vehicle-views-count">
            <SiteIcon name="eye" /> {kilometer.format(vehicle.viewCount || 0)} visualizzazioni
          </span>
          {vehicle.type === 'buy' && (
            <span><SiteIcon name="people" /> {kilometer.format(purchaseRequestCount)} richieste</span>
          )}
        </div>
        <dl className="catalog-vehicle-specs" aria-label={`Specifiche ${vehicle.make} ${vehicle.model}`}>
          <div>
            <dt className="visually-hidden">Alimentazione</dt>
            <dd><SiteIcon name="fuel" /><span>{vehicle.fuel || '—'}</span></dd>
          </div>
          <div>
            <dt className="visually-hidden">Cambio</dt>
            <dd><SiteIcon name="transmission" /><span>{vehicle.transmission || '—'}</span></dd>
          </div>
          <div>
            <dt className="visually-hidden">Motore</dt>
            <dd><SiteIcon name="engine" /><span>{engine}</span></dd>
          </div>
          <div>
            <dt className="visually-hidden">Potenza</dt>
            <dd><SiteIcon name="power" /><span>{formattedPower}</span></dd>
          </div>
        </dl>
        <div className="vehicle-price-row">
          <span className="vehicle-price-value">
            <VehicleDiscountPrice
              vehicle={vehicle}
              vatLabel={vehicle.type === 'buy' ? getVehicleVatLabel(vehicle) : null}
              showCountdown={false}
              onExpire={onDiscountExpire}
            />
          </span>
          <div className="vehicle-actions">
            <button className="vehicle-enquire" type="button" onClick={() => onOpen(vehicle.id)}>
              Dettagli <span aria-hidden="true">→</span>
            </button>
            <button
              className={!isLoggedIn
                ? 'vehicle-add is-login-required'
                : isSelected ? 'vehicle-add is-added' : 'vehicle-add'}
              type="button"
              aria-label={!isLoggedIn
                ? `Accedi per selezionare ${vehicle.model}`
                : isSelected ? `${vehicle.model} già nella selezione` : `Aggiungi ${vehicle.model} alla selezione`}
              onClick={() => onSelect(vehicle)}
            >
              <CartIcon className="vehicle-add-icon" />
              {!isLoggedIn ? 'Accedi per selezionare' : isSelected ? 'Aggiunta ✓' : '+ Seleziona'}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

function renderLegalInline(text, onNavigate) {
  const legalLinkRoutes = {
    './PRIVACY-POLICY.md': '/privacy',
    './TERMINI-CONDIZIONI.md': '/termini-condizioni',
    './COOKIE-POLICY.md': '/cookie-policy',
    './NOTE-LEGALI.md': '/note-legali',
  };
  const parts = [];
  const pattern = /(\[([^\]]+)\]\(([^)]+)\))|(\*\*([^*]+)\*\*)/g;
  let lastIndex = 0;
  let match;
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
    if (match[2] && match[3]) {
      const href = legalLinkRoutes[match[3]] || match[3];
      parts.push(
        <a
          href={href}
          key={`${match.index}-link`}
          onClick={href.startsWith('/') && onNavigate
            ? (event) => { event.preventDefault(); onNavigate(href); }
            : undefined}
        >
          {match[2]}
        </a>,
      );
    } else {
      parts.push(<strong key={`${match.index}-strong`}>{match[5]}</strong>);
    }
    lastIndex = pattern.lastIndex;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts;
}

function parseLegalMarkdown(markdown) {
  const lines = markdown.split(/\r?\n/);
  const blocks = [];
  let index = 0;
  while (index < lines.length) {
    const line = lines[index].trim();
    if (!line) {
      index += 1;
      continue;
    }
    if (/^>\s?/.test(line)) {
      const quote = [];
      while (index < lines.length && /^>\s?/.test(lines[index].trim())) {
        quote.push(lines[index].trim().replace(/^>\s?/, ''));
        index += 1;
      }
      blocks.push({ type: 'quote', text: quote.join(' ') });
      continue;
    }
    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      blocks.push({ type: `h${heading[1].length}`, text: heading[2] });
      index += 1;
      continue;
    }
    if (line.startsWith('|')) {
      const rows = [];
      while (index < lines.length && lines[index].trim().startsWith('|')) {
        const cells = lines[index].trim().split('|').slice(1, -1).map((cell) => cell.trim());
        if (!cells.every((cell) => /^:?-{3,}:?$/.test(cell))) rows.push(cells);
        index += 1;
      }
      blocks.push({ type: 'table', rows });
      continue;
    }
    if (/^- /.test(line)) {
      const items = [];
      while (index < lines.length && /^-\s+/.test(lines[index].trim())) {
        items.push(lines[index].trim().replace(/^-\s+/, ''));
        index += 1;
      }
      blocks.push({ type: 'list', items });
      continue;
    }
    const paragraph = [line];
    index += 1;
    while (index < lines.length && lines[index].trim() && !/^(#{1,3})\s+|^>\s?|^- |^\|/.test(lines[index].trim())) {
      paragraph.push(lines[index].trim());
      index += 1;
    }
    blocks.push({ type: 'paragraph', text: paragraph.join(' ') });
  }
  return blocks;
}

function LegalDocumentPage({ document, onHome, onNavigate }) {
  const blocks = parseLegalMarkdown(document.content);
  const renderInline = (text) => renderLegalInline(text, onNavigate);
  return (
    <article className="legal-page dedicated-page" aria-labelledby="legal-page-title">
      <header className="legal-page-header">
        <p className="eyebrow"><ShieldCheck aria-hidden="true" /> {document.eyebrow}</p>
        <h1 id="legal-page-title">{document.title}</h1>
        <p>Informazioni trasparenti per usare PelusoGroup con consapevolezza.</p>
      </header>
      <div className="legal-page-body">
        {blocks.map((block, blockIndex) => {
          if (block.type === 'h1') return <h2 key={blockIndex}>{renderInline(block.text)}</h2>;
          if (block.type === 'h2') return <h2 key={blockIndex}>{renderInline(block.text)}</h2>;
          if (block.type === 'h3') return <h3 key={blockIndex}>{renderInline(block.text)}</h3>;
          if (block.type === 'quote') return <blockquote key={blockIndex}>{renderInline(block.text)}</blockquote>;
          if (block.type === 'list') return <ul key={blockIndex}>{block.items.map((item, itemIndex) => <li key={itemIndex}>{renderInline(item)}</li>)}</ul>;
          if (block.type === 'table') return (
            <div className="legal-table-wrap" key={blockIndex}>
              <table>
                <thead><tr>{block.rows[0]?.map((cell, cellIndex) => <th key={cellIndex}>{renderInline(cell)}</th>)}</tr></thead>
                  <tbody>{block.rows.slice(1).map((row, rowIndex) => <tr key={rowIndex}>{row.map((cell, cellIndex) => <td key={cellIndex}>{renderInline(cell)}</td>)}</tr>)}</tbody>
              </table>
            </div>
          );
          return <p key={blockIndex}>{renderInline(block.text)}</p>;
        })}
      </div>
      <button className="legal-page-back" type="button" onClick={onHome}>
        <ArrowLeft aria-hidden="true" /> Torna alla home
      </button>
    </article>
  );
}

function RouteStyleBoundary({ pathname, children }) {
  const [loadedPath, setLoadedPath] = useState(null);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    let active = true;
    setLoadedPath(null);
    setLoadError(null);
    loadRouteStyles(pathname)
      .then(() => {
        if (active) setLoadedPath(pathname);
      })
      .catch((error) => {
        console.error(`Impossibile caricare gli stili per ${pathname}:`, error);
        if (active) setLoadError(error);
      });

    return () => {
      active = false;
    };
  }, [pathname]);

  if (loadError) {
    return (
      <main className="route-style-error" role="alert">
        <p>Non è stato possibile caricare gli stili della pagina.</p>
        <button type="button" onClick={() => window.location.reload()}>Ricarica la pagina</button>
      </main>
    );
  }
  if (loadedPath !== pathname) {
    return <main className="route-style-loading" role="status">Caricamento della pagina…</main>;
  }
  return children;
}

function SiteStatusBrand({ logoUrl, businessName = DEFAULT_SITE_SETTINGS.businessName }) {
  const hasGroupSuffix = /group$/i.test(businessName);
  const brandName = hasGroupSuffix ? businessName.slice(0, -5) : businessName;
  return (
    <div className="site-status-brand">
      <img src={logoUrl || DEFAULT_SITE_SETTINGS.logoUrl} alt="" />
      <span>{brandName}{hasGroupSuffix && <em>{businessName.slice(-5)}</em>}</span>
    </div>
  );
}

function NotFoundPage({ onHome, onBrowseVehicles, logoUrl, businessName }) {
  return (
    <section className="not-found-page site-status-card is-not-found" aria-labelledby="not-found-title">
      <SiteStatusBrand logoUrl={logoUrl} businessName={businessName} />
      <div className="site-status-layout">
        <div className="site-status-art" aria-hidden="true">
          <div className="site-status-art-lines" />
          <strong>404</strong>
          <span className="site-status-art-icon"><Search /></span>
          <svg className="site-status-car" viewBox="0 0 420 110" fill="none">
            <path d="M25 73h22l22-30c7-9 17-14 29-16l80-9c19-2 37 4 52 16l34 27 66 8c14 2 24 11 28 24l4 10H25V73Z" />
            <path d="m91 42 21-1 67-8c11-1 21 2 30 9l21 18H76l15-18Z" />
            <circle cx="114" cy="96" r="15" /><circle cx="318" cy="96" r="15" />
          </svg>
        </div>
        <div className="site-status-copy">
          <p className="eyebrow">PAGINA NON DISPONIBILE</p>
          <h1 id="not-found-title">Pagina non <em>trovata</em></h1>
          <p>La pagina che stai cercando non esiste oppure è stata rimossa.</p>
          <div className="not-found-actions">
            <button className="site-status-action" type="button" onClick={onHome}>
              <Home size={17} aria-hidden="true" /> Torna alla Home <ArrowRight size={15} aria-hidden="true" />
            </button>
            <button className="site-status-secondary-action" type="button" onClick={onBrowseVehicles}>Esplora le auto</button>
          </div>
        </div>
      </div>
    </section>
  );
}

function SiteAvailabilityPage({ mode, message, logoUrl, businessName, loading = false, error = '' }) {
  const StatusIcon = loading ? RefreshCw : mode === 'maintenance' ? Wrench : WifiOff;
  const eyebrow = loading ? 'PELUSOGROUP'
    : mode === 'maintenance' ? 'MANUTENZIONE IN CORSO'
      : 'SITO OFFLINE';
  return (
    <section className={`site-availability-page site-status-card is-${loading ? 'loading' : mode}`} aria-labelledby="site-availability-title">
      <SiteStatusBrand logoUrl={logoUrl} businessName={businessName} />
      <div className="site-status-layout">
        <div className="site-status-art" aria-hidden="true">
          <div className="site-status-art-lines" />
          <span className="site-status-art-icon"><StatusIcon /></span>
          <span className="site-status-art-orbit" />
        </div>
        <div className="site-status-copy">
          <p className="eyebrow">{eyebrow}</p>
          <h1 id="site-availability-title">
            {loading ? <>Stiamo verificando <em>il sito.</em></>
              : mode === 'maintenance' ? <>Sito in <em>manutenzione</em></>
                : <>Sito attualmente <em>offline</em></>}
          </h1>
          <p>{loading ? 'Stiamo verificando le informazioni del sito.' : message}</p>
          {error && <p className="site-availability-error" role="alert">{error}</p>}
          {!loading && (
            <button className="site-status-action" type="button" onClick={() => window.location.reload()}>
              <RefreshCw size={17} aria-hidden="true" /> Riprova più tardi <ArrowRight size={15} aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
      {mode === 'maintenance' && !loading && (
        <div className="site-status-progress">
          <span aria-hidden="true"><i /></span>
          <small>Stiamo lavorando per tornare online.</small>
        </div>
      )}
    </section>
  );
}

function AccountSettingsField({ label, icon: Icon, type = 'text', inputRef, ...inputProps }) {
  const [visible, setVisible] = useState(false);
  const isPassword = type === 'password';
  return (
    <label>
      <span className="account-settings-field-label">{label}</span>
      <span className={`account-settings-input${isPassword ? ' password-input-wrap' : ''}`}>
        <Icon className="account-settings-input-icon" aria-hidden="true" />
        <input {...inputProps} ref={inputRef} type={isPassword && visible ? 'text' : type} />
        {isPassword && <VisibilityToggle visible={visible} onToggle={() => setVisible((current) => !current)} />}
      </span>
    </label>
  );
}

function CustomerAccountSettings({ user, onUserUpdated, onDeleted, onCookieSettings, onNavigate }) {
  const [busy, setBusy] = useState('');
  const [status, setStatus] = useState({ action: '', error: '', message: '' });
  const [emailPending, setEmailPending] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [username, setUsername] = useState(user.username || '');
  const verificationInputRef = useRef(null);
  const passwordRequirements = getPasswordRequirements(newPassword);
  const completedRequirements = passwordRequirements.filter((item) => item.valid).length;

  async function submit(event, action) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    setStatus({ action, error: '', message: '' });
    if (action === 'password' && data.newPassword !== data.confirmPassword) {
      setStatus({ action, error: 'Le nuove password non coincidono.', message: '' });
      return;
    }
    if (action === 'password' && passwordRequirements.some((item) => !item.valid)) {
      setStatus({ action, error: 'La nuova password deve rispettare tutti i requisiti indicati.', message: '' });
      return;
    }
    setBusy(action);
    try {
      let url = '/api/users/account/credentials';
      let method = 'PATCH';
      let body = { currentPassword: data.currentPassword };
      if (action === 'password') body.newPassword = data.newPassword;
      if (action === 'username') body.username = data.username;
      if (action === 'email') {
        url = '/api/users/account/email/request';
        method = 'POST';
        body.email = data.email;
      }
      if (action === 'verify') {
        url = '/api/users/account/email/verify';
        method = 'POST';
        body.token = data.token;
      }
      if (action === 'delete') {
        url = '/api/users/account';
        method = 'DELETE';
      }
      const result = await requestJson(url, { method, body: JSON.stringify(body) });
      form.reset();
      if (action === 'password') setNewPassword('');
      if (action === 'delete') {
        onDeleted();
        return;
      }
      if (result.user) onUserUpdated(result.user);
      if (action === 'username') setUsername(result.user.username || '');
      if (action === 'email') {
        setEmailPending(true);
        verificationInputRef.current?.focus();
      }
      if (action === 'verify' || action === 'password') setEmailPending(false);
      const message = {
        password: 'Password aggiornata. Le altre sessioni sono state disconnesse.',
        username: 'Nome utente aggiornato. Le altre sessioni sono state disconnesse.',
        email: 'Codice inviato al nuovo indirizzo. Inseriscilo entro 10 minuti.',
        verify: 'Indirizzo email aggiornato. Le altre sessioni sono state disconnesse.',
      }[action];
      setStatus({ action, error: '', message });
    } catch (requestError) {
      setStatus({ action, error: requestError.message, message: '' });
    } finally {
      setBusy('');
    }
  }

  const feedback = (action) => status.action === action && (
    status.error ? <p className="form-error" role="alert">{status.error}</p>
      : status.message ? <p className="form-success" role="status">{status.message}</p> : null
  );
  const submitButton = (action, label, loading) => (
    <button className="button button-accent form-submit header-glossy-accent account-settings-submit" disabled={Boolean(busy)} type="submit">
      {busy === action ? loading : label} <ArrowUpRight aria-hidden="true" />
    </button>
  );
  const currentPassword = () => <AccountSettingsField label="Password attuale" icon={LockKeyhole} name="currentPassword" type="password" autoComplete="current-password" required />;

  return (
    <div className="account-settings">
      <div className="account-settings-profile">
        <span className="account-settings-profile-icon"><UserRound aria-hidden="true" /></span>
        <div><span>ACCOUNT PERSONALE</span><strong>{user.name}</strong><small>{user.email}{user.username ? ` · @${user.username}` : ''}</small></div>
        <ShieldCheck className="account-settings-profile-shield" aria-hidden="true" />
      </div>
      <div className="account-settings-heading"><div><p className="eyebrow">ACCESSO E SICUREZZA</p><h3>Le tue credenziali</h3><p>Apri la voce che vuoi modificare. Per proteggere il tuo account ti chiederemo la password attuale.</p></div></div>
      <div className="account-settings-panels">
        <details className="account-settings-panel">
          <summary><span className="account-settings-panel-icon"><UserRound aria-hidden="true" /></span><span><strong>Nome utente</strong><small>{user.username ? `@${user.username}` : 'Non ancora impostato'}</small></span><Plus className="account-settings-expand" aria-hidden="true" /></summary>
          <form className="account-settings-form" onSubmit={(event) => submit(event, 'username')}>
            <p>Usalo al posto dell’email per accedere. Scegli 3–32 lettere, numeri, punti, trattini o underscore.</p>
            <AccountSettingsField label="Nuovo nome utente" icon={UserRound} name="username" value={username} onChange={(event) => setUsername(event.target.value)} minLength="3" maxLength="32" pattern="[a-zA-Z0-9._-]{3,32}" autoComplete="username" required />
            {currentPassword()}
            {feedback('username')}
            {submitButton('username', 'Salva nome utente', 'Salvataggio…')}
          </form>
        </details>
        <details className="account-settings-panel">
          <summary><span className="account-settings-panel-icon"><Mail aria-hidden="true" /></span><span><strong>Indirizzo email</strong><small>{user.email}</small></span><Plus className="account-settings-expand" aria-hidden="true" /></summary>
          <div className="account-settings-panel-body">
            <form className="account-settings-form" onSubmit={(event) => submit(event, 'email')}>
              <p>Ti invieremo un codice al nuovo indirizzo. I contatti nelle richieste già inviate non cambiano.</p>
              <AccountSettingsField label="Nuova email" icon={Mail} name="email" type="email" autoComplete="email" maxLength="254" placeholder="nome@esempio.it" required />
              {currentPassword()}
              {feedback('email')}
              {submitButton('email', 'Invia codice di verifica', 'Invio…')}
            </form>
            <form className="account-settings-form account-settings-verification" onSubmit={(event) => submit(event, 'verify')}>
              <h4>Hai ricevuto il codice?</h4>
              <p>{emailPending ? 'Inserisci il codice inviato: è valido per 10 minuti dalla richiesta.' : 'Se hai già richiesto un codice, inseriscilo qui entro 10 minuti dalla richiesta.'}</p>
              <AccountSettingsField label="Codice di verifica" icon={KeyRound} name="token" inputRef={verificationInputRef} autoComplete="off" minLength="32" maxLength="32" required />
              {currentPassword()}
              {feedback('verify')}
              {submitButton('verify', 'Conferma nuova email', 'Verifica…')}
            </form>
          </div>
        </details>
        <details className="account-settings-panel">
          <summary><span className="account-settings-panel-icon"><LockKeyhole aria-hidden="true" /></span><span><strong>Password</strong><small>Aggiorna la password di accesso</small></span><Plus className="account-settings-expand" aria-hidden="true" /></summary>
          <form className="account-settings-form" onSubmit={(event) => submit(event, 'password')}>
            <p>Le altre sessioni verranno disconnesse dopo la modifica.</p>
            {currentPassword()}
            <AccountSettingsField label="Nuova password" icon={LockKeyhole} name="newPassword" type="password" autoComplete="new-password" minLength="8" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} required />
            <div className="account-settings-password-guidance">
              <div className="auth-password-guidance-heading"><span>La password deve includere</span><span>{completedRequirements}/{passwordRequirements.length}</span></div>
              <div className="auth-password-progress" role="progressbar" aria-label="Requisiti password completati" aria-valuemin={0} aria-valuemax={passwordRequirements.length} aria-valuenow={completedRequirements}><span style={{ width: `${(completedRequirements / passwordRequirements.length) * 100}%` }} /></div>
              <div className="auth-password-checks">{passwordRequirements.map((item) => <span className={item.valid ? 'is-valid' : ''} key={item.key}><span aria-hidden="true">{item.valid ? <Check /> : <Circle />}</span>{item.label}</span>)}</div>
            </div>
            <AccountSettingsField label="Conferma nuova password" icon={LockKeyhole} name="confirmPassword" type="password" autoComplete="new-password" required />
            {feedback('password')}
            {submitButton('password', 'Aggiorna password', 'Salvataggio…')}
          </form>
        </details>
      </div>
      <div className="account-settings-heading"><div><p className="eyebrow">I TUOI DATI</p><h3>Privacy e preferenze</h3><p>Gestisci le tue scelte e consulta le informazioni sul trattamento dei dati.</p></div></div>
      <div className="account-settings-privacy">
        <div className="account-settings-privacy-card"><span className="account-settings-panel-icon"><ShieldCheck aria-hidden="true" /></span><div><h4>Preferenze cookie</h4><p>Gestisci il consenso per analisi e contenuti esterni.</p><button className="button button-outline button-small" type="button" onClick={onCookieSettings}>Gestisci cookie <ArrowUpRight size={15} aria-hidden="true" /></button></div></div>
        <div className="account-settings-privacy-card"><span className="account-settings-panel-icon"><Info aria-hidden="true" /></span><div><h4>Informative</h4><p>Scopri come vengono utilizzati i tuoi dati.</p><div className="account-settings-legal"><button type="button" onClick={() => onNavigate('/privacy')}>Privacy Policy <ArrowUpRight size={14} aria-hidden="true" /></button><button type="button" onClick={() => onNavigate('/cookie-policy')}>Cookie Policy <ArrowUpRight size={14} aria-hidden="true" /></button></div></div></div>
      </div>
      <details className="account-settings-panel account-settings-danger">
        <summary><span className="account-settings-panel-icon"><Trash2 aria-hidden="true" /></span><span><strong>Cancella account</strong><small>Elimina definitivamente il tuo accesso</small></span><Plus className="account-settings-expand" aria-hidden="true" /></summary>
        <form className="account-settings-form" onSubmit={(event) => submit(event, 'delete')}>
          <p>L’accesso verrà eliminato subito e non potrai più consultare la tua attività. Richieste, conversazioni, acquisti e recensioni già registrati restano conservati separatamente; le vendite non mostreranno più il tuo account.</p>
          {currentPassword()}
          <label className="account-delete-confirm"><input type="checkbox" required /><span>Confermo di voler cancellare definitivamente l’account.</span></label>
          {feedback('delete')}
          <button className="button button-danger account-settings-delete-submit" disabled={Boolean(busy)} type="submit">{busy === 'delete' ? 'Cancellazione…' : 'Cancella definitivamente'} <Trash2 size={16} aria-hidden="true" /></button>
        </form>
      </details>
    </div>
  );
}

function App() {
  const initialCatalogFilters = useMemo(() => readCatalogFilters(), []);
  const prefersReducedMotion = useReducedMotion();
  const servicesRef = useCallback((element) => {
    if (element && window.location.hash === '#services') {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);
  const [vehicles, setVehicles] = useState([]);
  const [cookieConsent, setCookieConsent] = useState(readCookieConsent);
  const [cookieSettingsOpen, setCookieSettingsOpen] = useState(false);
  const [cookieAnalyticsDraft, setCookieAnalyticsDraft] = useState(false);
  const [cookieExternalMediaDraft, setCookieExternalMediaDraft] = useState(false);
  const [cookieConsentError, setCookieConsentError] = useState('');
  const [user, setUser] = useState(null);
  const [siteSettings, setSiteSettings] = useState(DEFAULT_SITE_SETTINGS);
  const [legalDocumentContent, setLegalDocumentContent] = useState({});
  const [siteSettingsLoaded, setSiteSettingsLoaded] = useState(false);
  const [siteSettingsError, setSiteSettingsError] = useState('');
  const [dismissedAnnouncementKey, setDismissedAnnouncementKey] = useState('');
  const [siteClockNow, setSiteClockNow] = useState(Date.now());
  const [authReady, setAuthReady] = useState(false);
  const [authMode, setAuthMode] = useState('');
  const [authError, setAuthError] = useState('');
  const [authFieldErrors, setAuthFieldErrors] = useState({});
  const [authTouchedFields, setAuthTouchedFields] = useState({});
  const [authFormValues, setAuthFormValues] = useState({});
  const [authBusy, setAuthBusy] = useState(false);
  const [adminPinRequired, setAdminPinRequired] = useState(false);
  const [adminTotpRequired, setAdminTotpRequired] = useState(false);
  const [adminPinExpiresAt, setAdminPinExpiresAt] = useState(null);
  const [adminPinSecondsRemaining, setAdminPinSecondsRemaining] = useState(60);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [logoutNotice, setLogoutNotice] = useState('');
  const authRequestIdRef = useRef(0);
  const adminPinDestinationRef = useRef('/admin');
  useEffect(() => {
    setAuthFieldErrors({});
    setAuthTouchedFields({});
    setAuthFormValues({});
  }, [authMode]);
  const passwordRequirements = getPasswordRequirements(
    typeof authFormValues.password === 'string' ? authFormValues.password : '',
  );
  const completedPasswordRequirements = passwordRequirements.filter((requirement) => requirement.valid).length;
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [confirmDialogBusy, setConfirmDialogBusy] = useState(false);
  const [confirmDialogError, setConfirmDialogError] = useState('');
  const [cart, setCart] = useState(() => {
    try {
      const savedCart = JSON.parse(window.localStorage.getItem('pelusogroup-selezione') || '[]');
      return Array.isArray(savedCart)
        ? [...new Set(savedCart.filter((id) => typeof id === 'string'))]
        : [];
    } catch (error) {
      console.error('Impossibile caricare la selezione auto salvata:', error);
      return [];
    }
  });
  const [recentlyViewedVehicleIds, setRecentlyViewedVehicleIds] = useState([]);

  const menuToggleRef = useRef(null);
  const menuCloseRef = useRef(null);
  const menuDrawerRef = useRef(null);
  const cartToggleRef = useRef(null);
  const cartCloseRef = useRef(null);
  const cartDrawerRef = useRef(null);
  const [filter, setFilter] = useState(initialCatalogFilters.filter);
  const [catalogFiltersOpen, setCatalogFiltersOpen] = useState(false);
  const [catalogExtraFiltersOpen, setCatalogExtraFiltersOpen] = useState(false);
  const [catalogPage, setCatalogPage] = useState(1);
  const [search, setSearch] = useState(initialCatalogFilters.search);
  const [catalogSearchPlaceholder, setCatalogSearchPlaceholder] = useState('Cerca marca, modello o caratteristiche');
  const catalogAdvancedFiltersRef = useRef(null);
  const catalogFilterDragRef = useRef(null);
  const [makeFilter, setMakeFilter] = useState(initialCatalogFilters.makeFilter);
  const [bodyTypeFilter, setBodyTypeFilter] = useState(initialCatalogFilters.bodyTypeFilter);
  const [yearFilter, setYearFilter] = useState(initialCatalogFilters.yearFilter);
  const [modelFilter, setModelFilter] = useState(initialCatalogFilters.modelFilter);
  const [colorFilter, setColorFilter] = useState(initialCatalogFilters.colorFilter);
  const [doorsFilter, setDoorsFilter] = useState(initialCatalogFilters.doorsFilter);
  const [drivetrainFilter, setDrivetrainFilter] = useState(initialCatalogFilters.drivetrainFilter);
  const [noviceDriverFilter, setNoviceDriverFilter] = useState(initialCatalogFilters.noviceDriverFilter);
  const [fuelFilter, setFuelFilter] = useState(initialCatalogFilters.fuelFilter);
  const [transmissionFilter, setTransmissionFilter] = useState(initialCatalogFilters.transmissionFilter);
  const [maxKm, setMaxKm] = useState(initialCatalogFilters.maxKm);
  const [maxPrice, setMaxPrice] = useState(initialCatalogFilters.maxPrice);
  const [maxPower, setMaxPower] = useState(initialCatalogFilters.maxPower);
  const [sortBy, setSortBy] = useState(initialCatalogFilters.sortBy);

  useEffect(() => {
    if (search || prefersReducedMotion) {
      setCatalogSearchPlaceholder(search ? '' : 'Cerca marca, modello o caratteristiche');
      return undefined;
    }

    const phrases = [
      'Cerca marca, modello o caratteristiche',
      'Cerca una marca come Audi',
      'Cerca per tipo di carrozzeria',
      'Cerca per anno o potenza',
    ];
    let phraseIndex = 0;
    let characterIndex = 0;
    let deleting = false;
    let timeoutId;

    function updatePlaceholder() {
      const phrase = phrases[phraseIndex];
      if (!deleting) {
        characterIndex += 1;
        setCatalogSearchPlaceholder(phrase.slice(0, characterIndex));
        if (characterIndex >= phrase.length) {
          deleting = true;
          timeoutId = window.setTimeout(updatePlaceholder, 1600);
          return;
        }
      } else {
        characterIndex -= 1;
        setCatalogSearchPlaceholder(phrase.slice(0, characterIndex));
        if (characterIndex <= 0) {
          deleting = false;
          phraseIndex = (phraseIndex + 1) % phrases.length;
          timeoutId = window.setTimeout(updatePlaceholder, 260);
          return;
        }
      }
      timeoutId = window.setTimeout(updatePlaceholder, deleting ? 52 : 76);
    }

    timeoutId = window.setTimeout(updatePlaceholder, 350);
    return () => window.clearTimeout(timeoutId);
  }, [search, prefersReducedMotion]);

  useEffect(() => {
    if (!catalogFiltersOpen || !catalogAdvancedFiltersRef.current) return;
    catalogAdvancedFiltersRef.current.style.transform = '';
    catalogAdvancedFiltersRef.current.style.transition = '';
    catalogAdvancedFiltersRef.current.style.opacity = '';
    catalogAdvancedFiltersRef.current.style.animation = '';
  }, [catalogFiltersOpen]);

  function startCatalogFilterDrag(event) {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    const panel = catalogAdvancedFiltersRef.current;
    if (!panel) return;
    panel.style.animation = 'none';
    panel.getBoundingClientRect();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    catalogFilterDragRef.current = {
      pointerId: event.pointerId,
      startY: event.clientY,
      offsetY: 0,
      lastY: event.clientY,
      lastMoveAt: performance.now(),
      velocityY: 0,
      frameId: 0,
    };
  }

  function moveCatalogFilterDrag(event) {
    const drag = catalogFilterDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId || !catalogAdvancedFiltersRef.current) return;
    const offsetY = Math.max(0, event.clientY - drag.startY);
    drag.offsetY = offsetY;
    const now = performance.now();
    drag.velocityY = (event.clientY - drag.lastY) / Math.max(1, now - drag.lastMoveAt);
    drag.lastY = event.clientY;
    drag.lastMoveAt = now;
    if (drag.frameId) return;
    drag.frameId = window.requestAnimationFrame(() => {
      drag.frameId = 0;
      if (catalogFilterDragRef.current !== drag || !catalogAdvancedFiltersRef.current) return;
      catalogAdvancedFiltersRef.current.style.transition = 'none';
      catalogAdvancedFiltersRef.current.style.transform = `translate3d(-50%, ${drag.offsetY}px, 0)`;
    });
  }

  function finishCatalogFilterDrag(event) {
    const drag = catalogFilterDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId || !catalogAdvancedFiltersRef.current) return;
    catalogFilterDragRef.current = null;
    const panel = catalogAdvancedFiltersRef.current;
    drag.offsetY = Math.max(drag.offsetY, event.clientY - drag.startY);
    if (drag.frameId) {
      window.cancelAnimationFrame(drag.frameId);
      drag.frameId = 0;
    }
    panel.style.transition = 'none';
    panel.style.transform = `translate3d(-50%, ${drag.offsetY}px, 0)`;
    panel.getBoundingClientRect();
    const releaseVelocity = performance.now() - drag.lastMoveAt < 120 ? drag.velocityY : 0;
    if (drag.offsetY > 48 || releaseVelocity > 0.38) {
      let closeFallback;
      const completeClose = () => {
        window.clearTimeout(closeFallback);
        panel.removeEventListener('transitionend', onCloseTransitionEnd);
        setCatalogFiltersOpen(false);
        panel.style.transform = '';
        panel.style.transition = '';
        panel.style.opacity = '';
        panel.style.animation = '';
      };
      const onCloseTransitionEnd = (transitionEvent) => {
        if (transitionEvent.target === panel && transitionEvent.propertyName === 'transform') {
          completeClose();
        }
      };
      panel.addEventListener('transitionend', onCloseTransitionEnd);
      panel.style.transition = 'transform .28s cubic-bezier(.22, .82, .3, 1), opacity .24s ease';
      panel.style.transform = 'translate3d(-50%, 110vh, 0)';
      panel.style.opacity = '0';
      closeFallback = window.setTimeout(completeClose, 360);
    } else {
      const onSnapBackTransitionEnd = (transitionEvent) => {
        if (transitionEvent.target !== panel || transitionEvent.propertyName !== 'transform') return;
        panel.removeEventListener('transitionend', onSnapBackTransitionEnd);
        panel.style.transition = '';
      };
      panel.addEventListener('transitionend', onSnapBackTransitionEnd);
      panel.style.transition = 'transform .24s cubic-bezier(.22, .82, .22, 1)';
      panel.style.transform = 'translate3d(-50%, 0, 0)';
    }
  }
  const [contactMessage, setContactMessage] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactStatus, setContactStatus] = useState('');
  const [contactError, setContactError] = useState('');
  const [contactBusy, setContactBusy] = useState(false);
  const [contactFormKey, setContactFormKey] = useState(0);
  const [pathname, setPathname] = useState(() => window.location.pathname);
  const [adminEntryState, setAdminEntryState] = useState(() => (
    /^\/[a-f0-9]{48}$/.test(window.location.pathname.replace(/\/+$/, '')) ? 'checking' : 'idle'
  ));
  const [verifiedAdminEntryPath, setVerifiedAdminEntryPath] = useState('');
  const [adminEntryError, setAdminEntryError] = useState('');
  const [adminSearchTerm, setAdminSearchTerm] = useState('');
  const [adminInventoryFilter, setAdminInventoryFilter] = useState('all');
  const [adminInventorySort, setAdminInventorySort] = useState('default');
  const [accountSection, setActiveAccountSection] = useState('activity');
  const [accountSidebarOpen, setAccountSidebarOpen] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [inventoryError, setInventoryError] = useState('');
  const [inventoryLoading, setInventoryLoading] = useState(true);
  const [inventoryReloadKey, setInventoryReloadKey] = useState(0);
  const [inventoryReady, setInventoryReady] = useState(false);
  const [publicVehicleMetrics, setPublicVehicleMetrics] = useState([]);
  const [publicVehicleMetricsError, setPublicVehicleMetricsError] = useState('');
  const [detailImageIndex, setDetailImageIndex] = useState(0);
  const [detailImageDirection, setDetailImageDirection] = useState(null);
  const [magnifierVisible, setMagnifierVisible] = useState(false);
  const detailTouchStartXRef = useRef(null);
  const detailGalleryRef = useRef(null);
  const detailImageFrameRef = useRef(null);
  const magnifierLensRef = useRef(null);
  const visitRequestTriggerRef = useRef(null);
  const purchaseRequestTriggerRef = useRef(null);
  const visitRequestBusyRef = useRef(false);
  const purchaseRequestBusyRef = useRef(false);
  const requestModalDragRef = useRef(null);
  const [visitRequestModalOpen, setVisitRequestModalOpen] = useState(false);
  const [purchaseRequestModalOpen, setPurchaseRequestModalOpen] = useState(false);
  const [purchaseRequestPhone, setPurchaseRequestPhone] = useState('');
  const [purchaseRequestFirstName, setPurchaseRequestFirstName] = useState('');
  const [purchaseRequestLastName, setPurchaseRequestLastName] = useState('');
  const [purchaseRequestEmail, setPurchaseRequestEmail] = useState('');
  const [purchaseRequestStatus, setPurchaseRequestStatus] = useState({ vehicleId: '', error: '', message: '' });
  const [purchaseRequestBusy, setPurchaseRequestBusy] = useState('');
  const [priceOfferOpen, setPriceOfferOpen] = useState(false);
  const [priceOfferAmount, setPriceOfferAmount] = useState('');
  const [priceOfferMessage, setPriceOfferMessage] = useState('');
  const [priceOfferStatus, setPriceOfferStatus] = useState({ vehicleId: '', error: '', message: '' });
  const [priceOfferBusy, setPriceOfferBusy] = useState('');
  const [rentalDates, setRentalDates] = useState({ startDate: '', endDate: '' });
  const [rentalAvailability, setRentalAvailability] = useState([]);
  const [rentalAvailabilityLoading, setRentalAvailabilityLoading] = useState(false);
  const [rentalAvailabilityError, setRentalAvailabilityError] = useState('');
  const [rentalAvailabilityReloadKey, setRentalAvailabilityReloadKey] = useState(0);
  const [rentalRequestStatus, setRentalRequestStatus] = useState({ vehicleId: '', error: '', message: '' });
  const [rentalRequestBusy, setRentalRequestBusy] = useState('');
  const [visitRequestStatus, setVisitRequestStatus] = useState({ vehicleId: '', error: '', message: '', warning: false });
  const [visitRequestBusy, setVisitRequestBusy] = useState('');
  purchaseRequestBusyRef.current = Boolean(purchaseRequestBusy);
  visitRequestBusyRef.current = Boolean(visitRequestBusy);
  useEffect(() => {
    if (!purchaseRequestStatus.error) return undefined;
    const timer = window.setTimeout(() => {
      setPurchaseRequestStatus((current) => current.error ? { ...current, error: '' } : current);
    }, 10000);
    return () => window.clearTimeout(timer);
  }, [purchaseRequestStatus.error]);
  useEffect(() => {
    if (!visitRequestStatus.error) return undefined;
    const timer = window.setTimeout(() => {
      setVisitRequestStatus((current) => current.error ? { ...current, error: '' } : current);
    }, 10000);
    return () => window.clearTimeout(timer);
  }, [visitRequestStatus.error]);
  const [purchaseRequestDeleteError, setPurchaseRequestDeleteError] = useState({ requestId: '', error: '' });
  const [adminMessage, setAdminMessage] = useState('');
  const [adminError, setAdminError] = useState('');
  const [adminBusy, setAdminBusy] = useState(false);
  const [sellSubmissions, setSellSubmissions] = useState([]);
  const [adminSellSubmissionFilter, setAdminSellSubmissionFilter] = useState('all');
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
  const [customerSellSubmissionFilter, setCustomerSellSubmissionFilter] = useState('all');
  const [customerPurchaseRequestFilter, setCustomerPurchaseRequestFilter] = useState('all');
  const [customerPurchaseFilter, setCustomerPurchaseFilter] = useState('all');
  const [myVehicleOffers, setMyVehicleOffers] = useState([]);
  const [myVehicleOffersError, setMyVehicleOffersError] = useState('');
  const [myVehicleOffersLoading, setMyVehicleOffersLoading] = useState(false);
  const [customerVehicleOfferActionBusy, setCustomerVehicleOfferActionBusy] = useState('');
  const [customerVehicleOfferActionStatus, setCustomerVehicleOfferActionStatus] = useState({ offerId: '', error: '', message: '' });
  const [adminPurchaseRequests, setAdminPurchaseRequests] = useState([]);
  const [adminPurchaseRequestsError, setAdminPurchaseRequestsError] = useState('');
  const [adminVehicleOffers, setAdminVehicleOffers] = useState([]);
  const [adminVehicleOffersError, setAdminVehicleOffersError] = useState('');
  const [adminVehicleOffersLoading, setAdminVehicleOffersLoading] = useState(false);
  const [adminVehicleOfferRefreshKey, setAdminVehicleOfferRefreshKey] = useState(0);
  const [vehicleOfferActionBusy, setVehicleOfferActionBusy] = useState('');
  const [vehicleOfferActionStatus, setVehicleOfferActionStatus] = useState({ offerId: '', error: '', message: '' });
  const [adminRentalRequests, setAdminRentalRequests] = useState([]);
  const [adminRentalRequestsError, setAdminRentalRequestsError] = useState('');
  const [adminRentalRequestsLoading, setAdminRentalRequestsLoading] = useState(true);
  const [adminVisitRequests, setAdminVisitRequests] = useState([]);
  const [adminVisitRequestsError, setAdminVisitRequestsError] = useState('');
  const [adminVisitRequestsLoading, setAdminVisitRequestsLoading] = useState(true);
  const [visitRequestActionBusy, setVisitRequestActionBusy] = useState('');
  const [visitRequestActionStatus, setVisitRequestActionStatus] = useState({ requestId: '', error: '', message: '', warning: false });
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
  const [adminVehicleTypeDefault, setAdminVehicleTypeDefault] = useState('buy');
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
  const [adminVehicleDiscountPrice, setAdminVehicleDiscountPrice] = useState('');
  const [adminDiscountEndMode, setAdminDiscountEndMode] = useState('scheduled');
  const [adminVehicleDiscountEndsAt, setAdminVehicleDiscountEndsAt] = useState('');
  const [discountExpiryVersion, setDiscountExpiryVersion] = useState(0);
  const adminVehicleFormRef = useRef(null);
  const soldCarsTrackRef = useRef(null);
  const customerReviewsTrackRef = useRef(null);
  const carouselAnimationsRef = useRef(new Map());
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
  const detailDiscountPrice = activeVehicle ? getVehicleDiscountPrice(activeVehicle) : null;
  const detailDiscountEndTime = activeVehicle?.discountEndsAt
    ? new Date(activeVehicle.discountEndsAt).getTime()
    : NaN;
  const detailHasDiscountCountdown = detailDiscountPrice !== null && Number.isFinite(detailDiscountEndTime);
  const currentDetailImageIndex = Math.min(detailImageIndex, Math.max(0, detailImages.length - 1));
  const changeDetailPhoto = (direction) => {
    if (detailImages.length < 2) return;
    setDetailImageDirection(direction);
    setDetailImageIndex((currentIndex) => (
      (currentIndex + (direction === 'next' ? 1 : -1) + detailImages.length) % detailImages.length
    ));
  };
  const selectDetailPhoto = (index) => {
    if (index === currentDetailImageIndex || detailImages.length < 2) return;
    const forwardDistance = (index - currentDetailImageIndex + detailImages.length) % detailImages.length;
    setDetailImageDirection(forwardDistance <= detailImages.length / 2 ? 'next' : 'previous');
    setDetailImageIndex(index);
  };
  useEffect(() => {
    const gallery = detailGalleryRef.current;
    const activeThumbnail = gallery?.querySelector('.vehicle-gallery-thumb.is-active');
    if (!gallery || !activeThumbnail) return;

    const galleryRect = gallery.getBoundingClientRect();
    const thumbnailRect = activeThumbnail.getBoundingClientRect();
    const thumbnailLeft = gallery.scrollLeft + thumbnailRect.left - galleryRect.left;
    const thumbnailRight = thumbnailLeft + thumbnailRect.width;
    const scrollBehavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
    if (thumbnailLeft < gallery.scrollLeft) {
      gallery.scrollTo({ left: thumbnailLeft, behavior: scrollBehavior });
    } else if (thumbnailRight > gallery.scrollLeft + gallery.clientWidth) {
      gallery.scrollTo({ left: thumbnailRight - gallery.clientWidth, behavior: scrollBehavior });
    }
  }, [activeVehicle?.id, currentDetailImageIndex, detailImages.length]);
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
  const normalizedPathname = pathname.replace(/\/+$/, '') || '/';
  const isAdminEntryCandidate = /^\/[a-f0-9]{48}$/.test(normalizedPathname);
  const isAdminEntryPage = isAdminEntryCandidate
    && adminEntryState === 'valid'
    && verifiedAdminEntryPath === normalizedPathname;
  const isAdminEntryPending = isAdminEntryCandidate
    && (adminEntryState === 'idle' || adminEntryState === 'checking'
      || (adminEntryState === 'valid' && verifiedAdminEntryPath !== normalizedPathname)
      || (isAdminEntryPage && !authReady));
  const isAdminEntryCheckError = isAdminEntryCandidate && adminEntryState === 'error';
  const isUnknownVehiclePage = normalizedPathname.startsWith('/auto/') && !activeVehicle;
  const isHomePage = normalizedPathname === '/';
  const isCatalogPage = normalizedPathname === '/catalogo';
  const isSellPage = normalizedPathname === '/vendi-auto';
  const isContactPage = normalizedPathname === '/contatti';
  const isLegalPage = Boolean(LEGAL_DOCUMENTS[normalizedPathname]);
  const legalDocument = LEGAL_DOCUMENTS[normalizedPathname];
  const isPublicMainHeader = isHomePage || isSellPage || isContactPage || isLegalPage || normalizedPathname.startsWith('/auto/');
  const isAdminDashboardPage = normalizedPathname === '/admin' || isAdminEntryPage;
  const isAdminPage = normalizedPathname === '/admin/inventory';
  const isAdminPurchaseRequestsPage = normalizedPathname === '/admin/purchases';
  const isAdminOffersPage = normalizedPathname === '/admin/offers';
  const isAdminAnalyticsPage = normalizedPathname === '/admin/analytics';
  const isAdminMessagesPage = normalizedPathname === '/admin/messages';
  const isAdminRentalsPage = normalizedPathname === '/admin/rentals';
  const isAdminVisitRequestsPage = normalizedPathname === '/admin/visits';
  const isAdminSettingsPage = normalizedPathname === '/admin/settings';
  const isAdminLegalPage = normalizedPathname === '/admin/legal';
  const isAdminSecurityPage = normalizedPathname === '/admin/security';
  const isAdminSecurityAuditPage = normalizedPathname === '/admin/security/audit';
  const isAdminAccountsPage = normalizedPathname === '/admin/security/admins';
  const isAdminLogsPage = normalizedPathname === '/admin/logs';
  const isAdminArea = normalizedPathname === '/admin' || normalizedPathname.startsWith('/admin/') || isAdminEntryPage;
  const isAdminRoutePending = isAdminArea && !authReady;
  const isAdminRouteBlocked = isAdminArea && (isAdminEntryPage
    ? authReady && user?.role === 'admin' && adminPinRequired
    : !authReady || user?.role !== 'admin' || adminPinRequired);
  const isAccountPrivacyPage = normalizedPathname === '/account/privacy';
  const isAccountPage = normalizedPathname === '/account' || isAccountPrivacyPage;
  const activeAccountSection = isAccountPrivacyPage ? 'privacy' : accountSection;
  const isKnownAdminPage = isAdminDashboardPage || isAdminPage || isAdminPurchaseRequestsPage
    || isAdminOffersPage || isAdminAnalyticsPage || isAdminMessagesPage || isAdminRentalsPage
    || isAdminVisitRequestsPage || isAdminSettingsPage || isAdminLegalPage || isAdminSecurityPage || isAdminSecurityAuditPage || isAdminAccountsPage || isAdminLogsPage;
  const isKnownPublicPage = normalizedPathname === '/'
    || normalizedPathname === '/catalogo'
    || normalizedPathname === '/vendi-auto'
    || normalizedPathname === '/contatti'
    || isLegalPage
    || normalizedPathname === '/account'
    || isAccountPrivacyPage
    || normalizedPathname === '/account/offers'
    || /^\/auto\/[^/]+$/.test(normalizedPathname);
  const isNotFoundPage = !(isKnownAdminPage || isKnownPublicPage) && !isAdminEntryPending && !isAdminEntryCheckError;
  const publicStaffContacts = Array.isArray(siteSettings.staffContacts) ? siteSettings.staffContacts : DEFAULT_SITE_SETTINGS.staffContacts;
  const businessName = siteSettings.businessName?.trim() || DEFAULT_SITE_SETTINGS.businessName;
  const siteTitle = siteSettings.siteTitle?.trim() || `${businessName} — La tua prossima auto`;
  const businessContactEmail = siteSettings.contactEmail?.trim() || '';
  const businessContactPhone = siteSettings.contactPhone?.trim() || '';
  const businessContactPhoneDigits = businessContactPhone.replace(/\D/g, '');
  const businessTimeZone = siteSettings.timezone || DEFAULT_SITE_SETTINGS.timezone;
  const showBusinessContactEmail = Boolean(businessContactEmail)
    && !publicStaffContacts.some((contact) => contact.email?.trim().toLowerCase() === businessContactEmail.toLowerCase());
  const showBusinessContactPhone = Boolean(businessContactPhoneDigits)
    && !publicStaffContacts.some((contact) => contact.phone
      && contact.phone.replace(/\D/g, '') === businessContactPhoneDigits);
  const luigiContact = publicStaffContacts.find((contact) => contact.id === 'luigi') || publicStaffContacts[0] || DEFAULT_SITE_SETTINGS.staffContacts[0];
  const gerardoContact = publicStaffContacts.find((contact) => contact.id === 'gerardo') || publicStaffContacts[1] || DEFAULT_SITE_SETTINGS.staffContacts[1];
  const publicAddress = siteSettings.address || DEFAULT_SITE_SETTINGS.address;
  const gerardoPhoneHref = gerardoContact.phone ? `tel:${gerardoContact.phone.replace(/[^\d+]/g, '')}` : '';
  const gerardoWhatsappNumber = gerardoContact.whatsapp || gerardoContact.phone?.replace(/\D/g, '');
  const gerardoWhatsappHref = gerardoWhatsappNumber
    ? `https://wa.me/${gerardoWhatsappNumber}?text=${encodeURIComponent(`Ciao ${gerardoContact.name}, ho visto il sito ${businessName} e vorrei ricevere informazioni.`)}`
    : '';
  const mapsSearchUrl = `https://maps.google.com/?q=${encodeURIComponent(publicAddress)}`;
  const mapsEmbedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(publicAddress)}&t=&z=16&ie=UTF8&iwloc=&output=embed`;
  useEffect(() => {
    const origin = window.location.origin;
    const pageUrl = `${origin}${normalizedPathname}`;
    const vehicleTitle = activeVehicle
      ? `${activeVehicle.year || ''} ${activeVehicle.make || ''} ${activeVehicle.model || ''}`.trim()
      : '';
    const contextualTitle = normalizedPathname === '/'
      ? siteTitle
      : normalizedPathname === '/catalogo'
        ? `Catalogo auto — ${businessName}`
        : normalizedPathname === '/vendi-auto'
          ? `Vendi la tua auto — ${businessName}`
          : normalizedPathname === '/contatti'
            ? `Contatti — ${businessName}`
            : isAccountPrivacyPage
              ? `Privacy e account — ${businessName}`
            : normalizedPathname === '/account'
              ? `Area personale — ${businessName}`
              : normalizedPathname === '/account/offers'
                ? `Le mie richieste — ${businessName}`
                : isLegalPage
                  ? `${legalDocument.title} — ${businessName}`
                  : isAdminSecurityPage
                    ? `Sicurezza account — ${businessName}`
                    : isAdminSettingsPage
                      ? `Impostazioni — ${businessName}`
                      : isAdminLegalPage
                        ? `Documenti legali — ${businessName}`
                      : isAdminSecurityAuditPage
                        ? `Audit sicurezza recente — ${businessName}`
                      : isAdminAccountsPage
                        ? `Account amministratori — ${businessName}`
                      : isAdminLogsPage
                        ? `Attività amministrative — ${businessName}`
                      : isAdminAnalyticsPage
                        ? `Statistiche — ${businessName}`
                        : isAdminMessagesPage
                          ? `Messaggi e richieste — ${businessName}`
                          : isAdminPage
                            ? `Inventario — ${businessName}`
                            : isAdminPurchaseRequestsPage
                              ? `Richieste di acquisto — ${businessName}`
                              : isAdminOffersPage
                                ? `Offerte — ${businessName}`
                                : isAdminRentalsPage
                                  ? `Richieste noleggio — ${businessName}`
                                  : isAdminVisitRequestsPage
                                    ? `Visite — ${businessName}`
                          : isAdminArea
                            ? `Dashboard amministratore — ${businessName}`
                            : `${businessName} — La tua prossima auto`;
    const title = isNotFoundPage
      ? `Pagina non trovata — ${businessName}`
      : adminPinRequired
        ? `Verifica amministratore — ${businessName}`
        : vehicleTitle
          ? `${vehicleTitle} — ${businessName}`
          : contextualTitle;
    const description = vehicleTitle
      ? `${vehicleTitle}. Scopri prezzo, caratteristiche e disponibilità su ${businessName}.`
      : `Trova la tua prossima auto con ${businessName}. Scopri auto selezionate da acquistare, noleggiare o vendere.`;
    document.title = title;
    const setMeta = (attribute, key, content) => {
      let element = document.head.querySelector(`meta[${attribute}="${key}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, key);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };
    setMeta('name', 'description', description);
    setMeta('name', 'robots', isNotFoundPage || isAdminArea || isAccountPage ? 'noindex,nofollow' : 'index,follow');
    setMeta('property', 'og:title', title);
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:url', pageUrl);
    setMeta('property', 'og:type', activeVehicle ? 'product' : 'website');
    setMeta('property', 'og:image', activeVehicle?.images?.[0] ? new URL(activeVehicle.images[0], origin).href : `${origin}/images/logo.png`);
    setMeta('name', 'twitter:title', title);
    setMeta('name', 'twitter:description', description);
    setMeta('name', 'twitter:image', activeVehicle?.images?.[0] ? new URL(activeVehicle.images[0], origin).href : `${origin}/images/logo.png`);
    let favicon = document.head.querySelector('link[rel="icon"]');
    if (!favicon) {
      favicon = document.createElement('link');
      favicon.rel = 'icon';
      document.head.appendChild(favicon);
    }
    const faviconUrl = siteSettings.faviconUrl || DEFAULT_SITE_SETTINGS.faviconUrl;
    favicon.type = faviconUrl.endsWith('.svg') ? 'image/svg+xml' : 'image/png';
    favicon.href = faviconUrl;
    let canonical = document.head.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = pageUrl;

    let structuredData = document.head.querySelector('#site-structured-data');
    if (!structuredData) {
      structuredData = document.createElement('script');
      structuredData.id = 'site-structured-data';
      structuredData.type = 'application/ld+json';
      document.head.appendChild(structuredData);
    }
    if (isNotFoundPage || isAdminArea || isAccountPage) {
      structuredData.textContent = '';
      return;
    }
    const graph = [{
      '@type': 'AutoDealer',
      '@id': `${origin}/#dealer`,
      name: businessName,
      url: origin,
      logo: `${origin}/images/logo.png`,
      telephone: businessContactPhone || undefined,
      email: businessContactEmail || undefined,
      address: {
        '@type': 'PostalAddress',
        streetAddress: publicAddress,
        addressCountry: 'IT',
      },
    }];
    if (activeVehicle) {
      graph.push({
        '@type': 'Vehicle',
        '@id': `${pageUrl}#vehicle`,
        name: vehicleTitle,
        url: pageUrl,
        image: (activeVehicle.images || []).map((image) => new URL(image, origin).href),
        brand: activeVehicle.make ? { '@type': 'Brand', name: activeVehicle.make } : undefined,
        model: activeVehicle.model || undefined,
        vehicleModelDate: activeVehicle.year || undefined,
        mileageFromOdometer: activeVehicle.mileageKm !== undefined
          ? { '@type': 'QuantitativeValue', value: activeVehicle.mileageKm, unitCode: 'KMT' }
          : undefined,
        fuelType: activeVehicle.fuel || undefined,
        vehicleTransmission: activeVehicle.transmission || undefined,
        offers: typeof activeVehicle.price === 'number' ? {
          '@type': 'Offer',
          priceCurrency: 'EUR',
          price: activeVehicle.discountPrice || activeVehicle.price,
          availability: 'https://schema.org/InStock',
          url: pageUrl,
        } : undefined,
      });
    }
    structuredData.textContent = JSON.stringify({ '@context': 'https://schema.org', '@graph': graph });
  }, [
    activeVehicle,
    adminPinRequired,
    businessContactEmail,
    businessContactPhone,
    businessName,
    isAdminAnalyticsPage,
    isAdminMessagesPage,
    isAdminOffersPage,
    isAdminPage,
    isAdminPurchaseRequestsPage,
    isAdminRentalsPage,
    isAdminSecurityPage,
    isAdminSettingsPage,
    isAdminLegalPage,
    isAdminSecurityAuditPage,
    isAdminAccountsPage,
    isAdminLogsPage,
    isAdminVisitRequestsPage,
    isLegalPage,
    legalDocument,
    isAccountPage,
    isAdminArea,
    isNotFoundPage,
    normalizedPathname,
    publicAddress,
    siteSettings.faviconUrl,
    siteTitle,
  ]);
  const siteAnnouncement = siteSettings.announcement
    && new Date(siteSettings.announcement.expiresAt).getTime() > siteClockNow
    ? siteSettings.announcement
    : null;
  const announcementKey = siteAnnouncement
    ? `${siteAnnouncement.type}:${siteAnnouncement.message}:${siteAnnouncement.expiresAt}`
    : '';
  const visibleSiteAnnouncement = announcementKey && announcementKey !== dismissedAnnouncementKey
    ? siteAnnouncement
    : null;
  const AnnouncementIcon = visibleSiteAnnouncement?.type === 'info'
    ? Info
    : visibleSiteAnnouncement?.type === 'warning' ? TriangleAlert : CircleAlert;
  const todayDateParts = new Intl.DateTimeFormat('en-US', {
    timeZone: businessTimeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const todayInBusinessTimeZone = `${todayDateParts.find((part) => part.type === 'year')?.value}-${todayDateParts.find((part) => part.type === 'month')?.value}-${todayDateParts.find((part) => part.type === 'day')?.value}`;
  const todayWeekday = new Intl.DateTimeFormat('en-US', { timeZone: businessTimeZone, weekday: 'long' }).format(new Date()).toLowerCase();
  const todaysHoliday = siteSettings.holidays?.find((holiday) => holiday.date === todayInBusinessTimeZone);
  const upcomingHolidays = (siteSettings.holidays || [])
    .filter((holiday) => holiday.date >= todayInBusinessTimeZone)
    .slice(0, 3);
  const isSiteUnavailable = !isAdminArea && !isAdminEntryCandidate && !isNotFoundPage && siteSettingsLoaded
    && (siteSettings.offlineMode || siteSettings.maintenanceMode);
  const isSiteSettingsLoading = !isAdminArea && !isAdminEntryCandidate && !isNotFoundPage && !siteSettingsLoaded;
  useEffect(() => {
    if (!isSiteUnavailable) return;
    setMenuOpen(false);
    setCartOpen(false);
    setCookieSettingsOpen(false);
    setAuthMode('');
    setVisitRequestModalOpen(false);
    setPurchaseRequestModalOpen(false);
    setPriceOfferOpen(false);
    setConfirmDialog(null);
  }, [isSiteUnavailable]);
  const adminInventorySearchQuery = adminSearchTerm.trim().toLocaleLowerCase('it-IT');
  const adminInventoryCounts = useMemo(() => ({
    total: vehicles.length,
    buy: vehicles.filter((vehicle) => vehicle.type !== 'rent').length,
    rent: vehicles.filter((vehicle) => vehicle.type === 'rent').length,
    discounted: vehicles.filter((vehicle) => getVehicleDiscountPrice(vehicle) !== null).length,
  }), [vehicles]);
  const visibleAdminVehicles = useMemo(() => {
    const filteredVehicles = vehicles.filter((vehicle) => {
      const currentPrice = getVehicleCurrentPrice(vehicle);
      const matchesSearch = !adminInventorySearchQuery || [
        vehicle.id,
        vehicle.make,
        vehicle.model,
        vehicle.year,
        vehicle.color,
        vehicle.fuel,
        vehicle.transmission,
        vehicle.label,
        vehicle.bodyType,
        vehicle.mileageKm,
        vehicle.price,
        Number.isFinite(currentPrice) ? currentPrice.toLocaleString('it-IT') : '',
        vehicle.type === 'rent' ? 'noleggio rent' : 'vendita buy',
      ].some((value) => String(value ?? '').toLocaleLowerCase('it-IT').includes(adminInventorySearchQuery));
      const matchesType = adminInventoryFilter === 'all'
        || (adminInventoryFilter === 'buy' && vehicle.type !== 'rent')
        || (adminInventoryFilter === 'rent' && vehicle.type === 'rent')
        || (adminInventoryFilter === 'discounted' && getVehicleDiscountPrice(vehicle) !== null);
      return matchesSearch && matchesType;
    });

    if (adminInventorySort === 'price-low') {
      filteredVehicles.sort((left, right) => (
        (Number.isFinite(getVehicleCurrentPrice(left)) ? getVehicleCurrentPrice(left) : 0)
        - (Number.isFinite(getVehicleCurrentPrice(right)) ? getVehicleCurrentPrice(right) : 0)
      ));
    } else if (adminInventorySort === 'price-high') {
      filteredVehicles.sort((left, right) => (
        (Number.isFinite(getVehicleCurrentPrice(right)) ? getVehicleCurrentPrice(right) : 0)
        - (Number.isFinite(getVehicleCurrentPrice(left)) ? getVehicleCurrentPrice(left) : 0)
      ));
    } else if (adminInventorySort === 'year-new') {
      filteredVehicles.sort((left, right) => Number(right.year || 0) - Number(left.year || 0));
    } else if (adminInventorySort === 'make') {
      filteredVehicles.sort((left, right) => String(left.make || '').localeCompare(String(right.make || ''), 'it'));
    }

    return filteredVehicles;
  }, [vehicles, adminInventorySearchQuery, adminInventoryFilter, adminInventorySort]);
  const hasAdminInventoryFilters = Boolean(adminInventorySearchQuery) || adminInventoryFilter !== 'all' || adminInventorySort !== 'default';
  const exportAdminInventory = () => {
    const columns = [
      'Codice',
      'Marca',
      'Modello',
      'Anno',
      'Tipo',
      'Carrozzeria',
      'Chilometraggio',
      'Prezzo listino',
      'Prezzo scontato',
      'Prezzo attuale',
      'IVA',
      'Alimentazione',
      'Cambio',
      'Colore',
      'Visualizzazioni',
      'Richieste',
      'Etichetta',
    ];
    const rows = visibleAdminVehicles.map((vehicle) => {
      const metrics = adminVehicleMetricsById.get(vehicle.id);
      const discountPrice = getVehicleDiscountPrice(vehicle);
      const currentPrice = getVehicleCurrentPrice(vehicle);
      return [
        vehicle.id,
        vehicle.make,
        vehicle.model,
        vehicle.year,
        vehicle.type === 'rent' ? 'Noleggio' : 'Vendita',
        vehicle.bodyType || '',
        vehicle.mileageKm ?? '',
        vehicle.price != null && vehicle.price !== '' && Number.isFinite(Number(vehicle.price)) ? Number(vehicle.price) : '',
        discountPrice ?? '',
        Number.isFinite(currentPrice) ? currentPrice : '',
        vehicle.type === 'rent' ? '' : getVehicleVatLabel(vehicle),
        vehicle.fuel || '',
        vehicle.transmission || '',
        vehicle.color || '',
        metrics ? metrics.views : '',
        metrics && vehicle.type === 'buy' ? metrics.purchaseRequests : '',
        vehicle.label || '',
      ];
    });
    downloadCsvFile(`inventario-auto-${new Date().toISOString().slice(0, 10)}.csv`, [columns, ...rows]);
  };

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
  const homeInventorySummary = useMemo(() => {
    const counts = vehicles.reduce((summary, vehicle) => {
      if (vehicle.type === 'buy') summary.buy += 1;
      if (vehicle.type === 'rent') summary.rent += 1;
      return summary;
    }, { buy: 0, rent: 0 });
    return {
      ...counts,
      total: counts.buy + counts.rent,
      chartData: [
        { name: 'In vendita', value: counts.buy, color: 'var(--brand-accent-vivid)' },
        { name: 'A noleggio', value: counts.rent, color: '#5d636a' },
      ].filter((entry) => entry.value > 0),
    };
  }, [vehicles]);
  const homeFeaturedVehicles = useMemo(() => ({
    buy: vehicles.filter((vehicle) => vehicle.type === 'buy').slice(0, 3),
    rent: vehicles.filter((vehicle) => vehicle.type === 'rent').slice(0, 3),
  }), [vehicles]);
  const popularBrandLogoSources = availablePopularMakes
    .map(({ make }) => POPULAR_MAKE_LOGO_PATHS[make.toLocaleLowerCase('it').replace(/[^a-z0-9]/g, '')])
    .filter(Boolean);
  const popularBrandLogosLoaded = useImageGroupLoaded(popularBrandLogoSources);
  const bodyTypeIconsLoaded = useImageGroupLoaded(
    VEHICLE_BODY_TYPES.map((type) => VEHICLE_BODY_TYPE_ICON_PATHS[type]),
  );
  const years = useMemo(() => [...new Set(vehicles.map((vehicle) => vehicle.year))].sort((a, b) => b - a), [vehicles]);
  const models = useMemo(() => {
    const options = new Map();
    vehicles
      .filter((vehicle) => makeFilter === 'all' || normalizeVehicleMake(vehicle.make) === normalizeVehicleMake(makeFilter))
      .forEach((vehicle) => {
        const value = vehicle.model?.trim();
        if (value) options.set(value.toLocaleLowerCase('it'), value);
      });
    return [...options.values()].sort((a, b) => a.localeCompare(b, 'it'));
  }, [vehicles, makeFilter]);
  const colors = useMemo(() => {
    const options = new Map();
    vehicles.forEach((vehicle) => {
      const value = vehicle.color?.trim();
      if (value) options.set(value.toLocaleLowerCase('it'), value);
    });
    return [...options.values()].sort((a, b) => a.localeCompare(b, 'it'));
  }, [vehicles]);
  const doorOptions = useMemo(
    () => [...new Set(vehicles.map((vehicle) => Number(vehicle.doors)).filter((doors) => Number.isInteger(doors) && doors > 0))]
      .sort((a, b) => a - b),
    [vehicles],
  );
  const drivetrainOptions = useMemo(() => {
    const options = new Map();
    vehicles.forEach((vehicle) => {
      const value = vehicle.drivetrain?.trim();
      if (value) options.set(value.toLocaleLowerCase('it'), value);
    });
    return [...options.values()].sort((a, b) => a.localeCompare(b, 'it'));
  }, [vehicles]);
  const fuelOptions = useMemo(
    () => {
      const options = new Map();
      vehicles.forEach((vehicle) => {
        const value = vehicle.fuel?.trim();
        if (value) options.set(value.toLocaleLowerCase('it'), `${value[0].toLocaleUpperCase('it')}${value.slice(1)}`);
      });
      return [...options.values()].sort((a, b) => a.localeCompare(b, 'it'));
    },
    [vehicles],
  );
  const transmissionOptions = useMemo(
    () => {
      const options = new Map();
      vehicles.forEach((vehicle) => {
        const value = vehicle.transmission?.trim();
        if (value) options.set(value.toLocaleLowerCase('it'), `${value[0].toLocaleUpperCase('it')}${value.slice(1)}`);
      });
      return [...options.values()].sort((a, b) => a.localeCompare(b, 'it'));
    },
    [vehicles],
  );
  const filteredVehicles = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('it');
    const results = vehicles.filter((vehicle) => {
      const powerCv = getVehiclePowerDetails(vehicle).cvValue;
      return (
        (filter === 'all' || vehicle.type === filter)
        && (makeFilter === 'all' || normalizeVehicleMake(vehicle.make) === normalizeVehicleMake(makeFilter))
        && (bodyTypeFilter === 'all' || normalizeVehicleBodyType(vehicle.bodyType) === bodyTypeFilter)
        && (yearFilter === 'all' || vehicle.year === Number(yearFilter))
        && (!modelFilter || vehicle.model?.trim().toLocaleLowerCase('it') === modelFilter.toLocaleLowerCase('it'))
        && (!colorFilter || vehicle.color?.trim().toLocaleLowerCase('it') === colorFilter.toLocaleLowerCase('it'))
        && (!doorsFilter || Number(vehicle.doors) === Number(doorsFilter))
        && (!drivetrainFilter || vehicle.drivetrain?.trim().toLocaleLowerCase('it') === drivetrainFilter.toLocaleLowerCase('it'))
        && (!noviceDriverFilter || (vehicle.noviceDriverEligible || 'unknown') === noviceDriverFilter)
        && (!fuelFilter || vehicle.fuel?.trim().toLocaleLowerCase('it') === fuelFilter.toLocaleLowerCase('it'))
        && (!transmissionFilter || vehicle.transmission?.trim().toLocaleLowerCase('it') === transmissionFilter.toLocaleLowerCase('it'))
        && (!maxKm || vehicle.mileageKm <= Number(maxKm))
        && (!maxPrice || getVehicleCurrentPrice(vehicle) <= Number(maxPrice))
        && (!maxPower || (powerCv && powerCv <= Number(maxPower)))
        && (!query || `${vehicle.make} ${vehicle.model} ${vehicle.year} ${vehicle.color} ${vehicle.bodyType} ${vehicle.fuel} ${vehicle.transmission} ${vehicle.engine}`.toLocaleLowerCase('it').includes(query))
      );
    });

    return results.sort((a, b) => {
      if (sortBy === 'price-asc') return getVehicleCurrentPrice(a) - getVehicleCurrentPrice(b);
      if (sortBy === 'price-desc') return getVehicleCurrentPrice(b) - getVehicleCurrentPrice(a);
      if (sortBy === 'year-desc') return b.year - a.year;
      if (sortBy === 'km-asc') return a.mileageKm - b.mileageKm;
      return vehicles.indexOf(a) - vehicles.indexOf(b);
    });
  }, [vehicles, filter, makeFilter, bodyTypeFilter, yearFilter, modelFilter, colorFilter, doorsFilter, drivetrainFilter, noviceDriverFilter, fuelFilter, transmissionFilter, maxKm, maxPrice, maxPower, search, sortBy, discountExpiryVersion]);

  const topDiscountedVehicles = useMemo(
    () => vehicles
      .filter((vehicle) => getVehicleDiscountPrice(vehicle) !== null)
      .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
      .slice(0, 3),
    [vehicles, discountExpiryVersion, pathname],
  );

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
        const priceDifference = Math.abs(getVehicleCurrentPrice(vehicle) - getVehicleCurrentPrice(referenceVehicle))
          / Math.max(getVehicleCurrentPrice(referenceVehicle), 1);
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
  const customerSellSubmissionCounts = useMemo(() => ({
    total: mySellSubmissions.length,
    reviewing: mySellSubmissions.filter((submission) => ['new', 'reviewing', 'contacted'].includes(submission.status)).length,
    countered: mySellSubmissions.filter((submission) => submission.status === 'countered').length,
    completed: mySellSubmissions.filter((submission) => ['accepted', 'rejected', 'closed'].includes(submission.status)).length,
  }), [mySellSubmissions]);
  const visibleCustomerSellSubmissions = useMemo(() => mySellSubmissions.filter((submission) => (
    customerSellSubmissionFilter === 'all'
    || (customerSellSubmissionFilter === 'reviewing' && ['new', 'reviewing', 'contacted'].includes(submission.status))
    || (customerSellSubmissionFilter === 'countered' && submission.status === 'countered')
    || (customerSellSubmissionFilter === 'completed' && ['accepted', 'rejected', 'closed'].includes(submission.status))
  )), [customerSellSubmissionFilter, mySellSubmissions]);
  const customerPurchaseRequestCounts = useMemo(() => ({
    total: myPurchaseRequests.length,
    pending: myPurchaseRequests.filter((request) => request.status === 'pending').length,
    contacted: myPurchaseRequests.filter((request) => request.status === 'contacted').length,
    accepted: myPurchaseRequests.filter((request) => request.status === 'accepted').length,
  }), [myPurchaseRequests]);
  const visibleCustomerPurchaseRequests = useMemo(
    () => myPurchaseRequests.filter((request) => customerPurchaseRequestFilter === 'all' || request.status === customerPurchaseRequestFilter),
    [customerPurchaseRequestFilter, myPurchaseRequests],
  );
  const customerPurchaseCounts = useMemo(() => ({
    total: myPurchases.length,
    pendingReview: myPurchases.filter((purchase) => !purchase.review).length,
    reviewed: myPurchases.filter((purchase) => Boolean(purchase.review)).length,
  }), [myPurchases]);
  const visibleCustomerPurchases = useMemo(
    () => myPurchases.filter((purchase) => (
      customerPurchaseFilter === 'all'
      || (customerPurchaseFilter === 'pendingReview' && !purchase.review)
      || (customerPurchaseFilter === 'reviewed' && Boolean(purchase.review))
    )),
    [customerPurchaseFilter, myPurchases],
  );
  const actionableSellSubmissions = useMemo(
    () => sellSubmissions.filter((submission) => !['accepted', 'rejected', 'closed'].includes(submission.status)),
    [sellSubmissions],
  );
  const visibleSellSubmissions = useMemo(() => {
    const query = adminSearchTerm.trim().toLocaleLowerCase('it-IT');
    let submissions = adminSellSubmissionFilter === 'actionable'
      ? actionableSellSubmissions
      : adminSellSubmissionFilter === 'accepted'
        ? sellSubmissions.filter((submission) => submission.status === 'accepted')
        : sellSubmissions;
    if (query) {
      submissions = submissions.filter((submission) => [
        submission.id,
        submission.name,
        submission.email,
        submission.phone,
        submission.year,
        submission.make,
        submission.model,
        submission.status,
      ].some((value) => String(value || '').toLocaleLowerCase('it-IT').includes(query)));
    }
    return submissions;
  }, [adminSearchTerm, adminSellSubmissionFilter, actionableSellSubmissions, sellSubmissions]);
  const sellSubmissionCounts = useMemo(() => ({
    actionable: actionableSellSubmissions.length,
    accepted: sellSubmissions.filter((submission) => submission.status === 'accepted').length,
    total: sellSubmissions.length,
  }), [actionableSellSubmissions, sellSubmissions]);
  const recentlyViewedVehicles = useMemo(
    () => recentlyViewedVehicleIds
      .map((id) => vehicles.find((vehicle) => vehicle.id === id))
      .filter(Boolean),
    [recentlyViewedVehicleIds, vehicles],
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
    let active = true;
    requestJson('/api/site/settings')
      .then(({ settings: loadedSettings }) => {
        if (active && loadedSettings && typeof loadedSettings === 'object') {
          setSiteSettings((current) => ({ ...current, ...loadedSettings }));
          setSiteSettingsError('');
        }
      })
      .catch((loadError) => {
        if (active) setSiteSettingsError(loadError.message);
      })
      .finally(() => {
        if (active) setSiteSettingsLoaded(true);
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const legalPath = pathname.replace(/\/+$/, '') || '/';
    const slug = Object.prototype.hasOwnProperty.call(LEGAL_DOCUMENTS, legalPath)
      ? legalPath.slice(1)
      : '';
    if (!slug) return undefined;
    let active = true;
    requestJson(`/api/site/legal/${slug}`)
      .then(({ document }) => {
        if (active && document?.content) {
          setLegalDocumentContent((current) => ({ ...current, [slug]: document.content }));
        }
      })
      .catch((error) => {
        console.error('Impossibile caricare il documento legale aggiornato:', error);
      });
    return () => { active = false; };
  }, [pathname]);

  useEffect(() => {
    let active = true;
    const candidatePath = pathname.replace(/\/+$/, '') || '/';
    if (!/^\/[a-f0-9]{48}$/.test(candidatePath)) {
      setAdminEntryState('idle');
      setVerifiedAdminEntryPath('');
      setAdminEntryError('');
      return () => { active = false; };
    }

    setAdminEntryState('checking');
    setVerifiedAdminEntryPath('');
    setAdminEntryError('');
    requestJson('/api/site/admin-entry', {
      method: 'POST',
      body: JSON.stringify({ path: candidatePath }),
    })
      .then(({ valid }) => {
        if (!active) return;
        setAdminEntryState(valid ? 'valid' : 'invalid');
        setVerifiedAdminEntryPath(valid ? candidatePath : '');
      })
      .catch((error) => {
        if (!active) return;
        setAdminEntryState('error');
        setAdminEntryError(error.message);
      });

    return () => { active = false; };
  }, [pathname]);

  useEffect(() => {
      const expiresAt = siteSettings.announcement?.expiresAt;
      const expiresAtMs = expiresAt ? new Date(expiresAt).getTime() : NaN;
      if (!Number.isFinite(expiresAtMs) || expiresAtMs <= siteClockNow) return undefined;
      const delay = Math.min(expiresAtMs - Date.now(), 2147483622);
      const timer = window.setTimeout(() => setSiteClockNow(Date.now()), delay + 25);
      return () => window.clearTimeout(timer);
  }, [siteSettings.announcement, siteClockNow]);

  useEffect(() => {
    const requestId = ++authRequestIdRef.current;
    requestJson('/api/users/me')
      .then(({ user: currentUser, requiresAdminPin, requiresAdminTotp, adminPinExpiresInMs }) => {
        if (authRequestIdRef.current !== requestId) return;
        setUser(currentUser);
        if (requiresAdminPin || requiresAdminTotp) {
          startAdminPinChallenge(adminPinExpiresInMs, requiresAdminTotp);
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
    if (user?.role !== 'admin' || adminPinRequired) return undefined;
    let active = true;
    requestJson('/api/admin/settings')
      .then(({ settings }) => {
        if (active && (settings.defaultVehicleType === 'buy' || settings.defaultVehicleType === 'rent')) {
          setAdminVehicleTypeDefault(settings.defaultVehicleType);
        }
      })
      .catch((error) => {
        if (active) console.error('Impossibile caricare le preferenze predefinite dell’inventario:', error);
      });
    return () => { active = false; };
  }, [adminPinRequired, user]);

  useEffect(() => {
    if (!adminPinRequired || !Number.isFinite(adminPinExpiresAt)) return undefined;
    const updateRemaining = () => {
      const secondsRemaining = Math.max(0, Math.ceil((adminPinExpiresAt - Date.now()) / 1000));
      setAdminPinSecondsRemaining((current) => current === secondsRemaining ? current : secondsRemaining);
    };
    const intervalId = window.setInterval(updateRemaining, 1000);
    updateRemaining();
    return () => window.clearInterval(intervalId);
  }, [adminPinExpiresAt, adminPinRequired]);

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
    const animations = carouselAnimationsRef.current;
    return () => {
      animations.forEach(({ controls }) => controls.stop());
      animations.clear();
    };
  }, []);

  useEffect(() => {
    if (salesLoading || sales.length < 2) return;
    const frame = window.requestAnimationFrame(() => updateCarouselFocus(soldCarsTrackRef, setFocusedSoldCarIndex));
    return () => window.cancelAnimationFrame(frame);
  }, [salesLoading, sales.length, isHomePage]);

  useEffect(() => {
    if (customerReviewsLoading || customerReviews.length < 2) return;
    const frame = window.requestAnimationFrame(() => updateCarouselFocus(customerReviewsTrackRef, setFocusedReviewIndex));
    return () => window.cancelAnimationFrame(frame);
  }, [customerReviewsLoading, customerReviews.length, isHomePage]);

  useEffect(() => {
    if (user?.role !== 'user') {
      setMySellSubmissions([]);
      setMySellSubmissionError('');
      setMyPurchases([]);
      setMyPurchasesError('');
      setMyPurchaseRequests([]);
      setMyPurchaseRequestsError('');
      setMyVehicleOffers([]);
      setMyVehicleOffersError('');
      setMyVehicleOffersLoading(false);
      return undefined;
    }
    let active = true;
    setMySellSubmissionLoading(true);
    setMyVehicleOffersLoading(true);
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
    const loadVehicleOffers = () => {
      requestJson('/api/vehicle-price-offers/mine')
        .then(({ offers }) => {
          if (!Array.isArray(offers)) throw new Error('Il server ha restituito un elenco proposte non valido.');
          if (active) {
            setMyVehicleOffers(offers);
            setMyVehicleOffersError('');
          }
        })
        .catch((error) => {
          if (active) setMyVehicleOffersError(error.message);
        })
        .finally(() => {
          if (active) setMyVehicleOffersLoading(false);
        });
    };
    loadSubmissions();
    const refresh = window.setInterval(loadSubmissions, 20000);
    loadPurchaseRequests();
    const purchaseRequestRefresh = window.setInterval(loadPurchaseRequests, 20000);
    loadVehicleOffers();
    const vehicleOfferRefresh = window.setInterval(loadVehicleOffers, 20000);
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
      window.clearInterval(vehicleOfferRefresh);
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
      if (adminPinRequired && window.location.pathname !== '/admin/verify') {
        window.history.replaceState({ adminPinReturnPath: adminPinDestinationRef.current }, '', '/admin/verify');
      }
      setPathname(window.location.pathname);
      window.scrollTo({ top: 0 });
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [adminPinRequired]);

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
    setDetailImageDirection(null);
    setVisitRequestModalOpen(false);
    setPurchaseRequestModalOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!purchaseRequestModalOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !purchaseRequestBusyRef.current) {
        setPurchaseRequestModalOpen(false);
        return;
      }
      if (event.key !== 'Tab') return;

      const modal = document.getElementById('purchase-request-modal');
      const focusableElements = modal?.querySelectorAll('button:not(:disabled), input:not(:disabled), textarea:not(:disabled)');
      if (!focusableElements?.length) return;
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      if (!modal.contains(document.activeElement)) {
        event.preventDefault();
        (event.shiftKey ? lastElement : firstElement).focus();
      } else if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.body.style.overflow = 'hidden';
    document.getElementById('purchase-request-modal')?.focus({ preventScroll: true });
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
      window.requestAnimationFrame(() => {
        if (purchaseRequestTriggerRef.current?.disabled) {
          document.querySelector('.purchase-request-form [role="status"][tabindex="-1"]')?.focus();
        } else {
          purchaseRequestTriggerRef.current?.focus();
        }
      });
    };
  }, [purchaseRequestModalOpen]);

  useEffect(() => {
    if (!visitRequestModalOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !visitRequestBusyRef.current) {
        setVisitRequestModalOpen(false);
        return;
      }
      if (event.key !== 'Tab') return;

      const modal = document.querySelector('.dealer-visit-modal');
      const focusableElements = modal?.querySelectorAll('button:not(:disabled), input:not(:disabled), textarea:not(:disabled)');
      if (!focusableElements?.length) return;
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      if (!modal.contains(document.activeElement)) {
        event.preventDefault();
        (event.shiftKey ? lastElement : firstElement).focus();
      } else if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.body.style.overflow = 'hidden';
    document.getElementById('dealer-visit-modal')?.focus({ preventScroll: true });
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
      window.requestAnimationFrame(() => visitRequestTriggerRef.current?.focus());
    };
  }, [visitRequestModalOpen]);

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
      window.localStorage.setItem(CATALOG_FILTERS_STORAGE_KEY, JSON.stringify({
        filter,
        makeFilter,
        bodyTypeFilter,
        yearFilter,
        modelFilter,
        colorFilter,
        doorsFilter,
        drivetrainFilter,
        noviceDriverFilter,
        fuelFilter,
        transmissionFilter,
        maxKm,
        maxPrice,
        maxPower,
        search,
        sortBy,
      }));
    } catch (error) {
      console.error('Impossibile salvare i filtri del catalogo:', error);
    }
  }, [filter, makeFilter, bodyTypeFilter, yearFilter, modelFilter, colorFilter, doorsFilter, drivetrainFilter, noviceDriverFilter, fuelFilter, transmissionFilter, maxKm, maxPrice, maxPower, search, sortBy]);

  useEffect(() => {
    try {
      window.localStorage.setItem('pelusogroup-selezione', JSON.stringify(cart));
    } catch (error) {
      console.error('Impossibile salvare la selezione auto:', error);
    }
  }, [cart]);

  useEffect(() => {
    setRecentlyViewedVehicleIds(
      user?.role === 'user' ? readCustomerVehicleHistory(user.id) : [],
    );
  }, [user?.id, user?.role]);

  useEffect(() => {
    if (!authReady || user?.role !== 'user' || !user.id || !activeVehicle || !pathname.startsWith('/auto/')) return;
    const history = [
      activeVehicle.id,
      ...readCustomerVehicleHistory(user.id).filter((id) => id !== activeVehicle.id),
    ].slice(0, 12);
    setRecentlyViewedVehicleIds(history);
    try {
      window.localStorage.setItem(`pelusogroup-viewed-${user.id}`, JSON.stringify(history));
    } catch (error) {
      console.error('Impossibile salvare lo storico delle auto visualizzate:', error);
    }
  }, [activeVehicle?.id, authReady, pathname, user?.id, user?.role]);

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
    if (!isAdminArea || user?.role !== 'admin') {
      setAdminVehicleOffers([]);
      setAdminVehicleOffersError('');
      setAdminVehicleOffersLoading(false);
      return undefined;
    }

    let active = true;
    setAdminVehicleOffersLoading(true);
    const loadOffers = () => {
      requestJson('/api/vehicle-price-offers/admin')
        .then(({ offers }) => {
          if (!Array.isArray(offers)) throw new Error('Il server ha restituito un elenco proposte non valido.');
          if (active) {
            setAdminVehicleOffers(offers);
            setAdminVehicleOffersError('');
          }
        })
        .catch((error) => {
          if (active) setAdminVehicleOffersError(error.message);
        })
        .finally(() => {
          if (active) setAdminVehicleOffersLoading(false);
        });
    };
    loadOffers();
    const refresh = window.setInterval(loadOffers, 20000);
    return () => {
      active = false;
      window.clearInterval(refresh);
    };
  }, [adminVehicleOfferRefreshKey, isAdminArea, user?.id, user?.role]);

  useEffect(() => {
    if (!isAdminArea || user?.role !== 'admin') {
      setAdminVisitRequests([]);
      setAdminVisitRequestsError('');
      setAdminVisitRequestsLoading(false);
      return undefined;
    }

    let active = true;
    setAdminVisitRequestsLoading(true);
    const loadVisitRequests = () => {
      requestJson('/api/visit-requests/admin')
        .then(({ requests }) => {
          if (!Array.isArray(requests)) throw new Error('Il server ha restituito un elenco di visite non valido.');
          if (active) {
            setAdminVisitRequests(requests);
            setAdminVisitRequestsError('');
          }
        })
        .catch((error) => {
          if (active) setAdminVisitRequestsError(error.message);
        })
        .finally(() => {
          if (active) setAdminVisitRequestsLoading(false);
        });
    };

    loadVisitRequests();
    const refresh = window.setInterval(loadVisitRequests, 30000);
    return () => {
      active = false;
      window.clearInterval(refresh);
    };
  }, [isAdminArea, user?.id, user?.role]);

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
    setPriceOfferOpen(false);
    setPriceOfferAmount('');
    setPriceOfferMessage('');
    setPriceOfferStatus({ vehicleId: '', error: '', message: '' });
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

  function selectAccountSection(section) {
    if (section === 'privacy') {
      if (!isAccountPrivacyPage) navigateToPath('/account/privacy');
    } else {
      setActiveAccountSection(section);
      if (isAccountPrivacyPage) navigateToPath('/account');
    }
    setAccountSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function navigateAfterAuthentication(signedInUser) {
    const destination = signedInUser.role === 'admin'
      ? window.location.pathname === '/admin/verify'
        ? adminPinDestinationRef.current
        : window.location.pathname.startsWith('/admin') ? window.location.pathname : '/admin'
      : window.location.pathname === '/account/privacy' ? '/account/privacy' : '/account';
    navigateToPath(destination, window.location.pathname === '/admin/verify');
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
    setAdminVehicleDiscountPrice(vehicle?.type === 'buy' && vehicle.discountPrice != null ? String(vehicle.discountPrice) : '');
    setAdminDiscountEndMode(vehicle ? (vehicle.discountEndsAt ? 'scheduled' : 'permanent') : 'scheduled');
    setAdminVehicleDiscountEndsAt(formatLocalDateInput(vehicle?.discountEndsAt));
    setAdminVehicleType(vehicle?.type || adminVehicleTypeDefault);
    setAdminVehicleVatMode(getVehicleVatMode(vehicle));
    setAdminVehicleFormSubmitted(false);
    setAdminImageFiles([]);
    setAdminImagePreviews([]);
    setMainImageIndex(vehicle ? Math.max(0, (vehicle.images || []).indexOf(vehicle.image)) : -1);
    setAdminError('');
    setAdminMessage('');
    closeMenu(false);
    navigateToPath('/admin/inventory');
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
    const hasDiscountPrice = adminVehicleType === 'buy' && adminVehicleDiscountPrice !== '';
    let discountEndsAt = null;
    if (hasDiscountPrice && adminDiscountEndMode === 'scheduled') {
      const endDate = parseLocalDiscountEndDate(adminVehicleDiscountEndsAt);
      if (!endDate) {
        setAdminVehicleFormSubmitted(true);
        setAdminError('Inserisci una data valida nel formato gg/mm/aaaa.');
        return;
      }
      if (!editingVehicle && endDate.getTime() <= Date.now()) {
        setAdminVehicleFormSubmitted(true);
        setAdminError('La scadenza dello sconto deve essere futura.');
        return;
      }
      discountEndsAt = endDate.toISOString();
    }
    const payload = {
      make: formData.get('make'),
      model: formData.get('model'),
      year: Number(formData.get('year')),
      mileageKm: Number(formData.get('mileageKm')),
      price: Number(formData.get('price')),
      discountPrice: hasDiscountPrice ? Number(adminVehicleDiscountPrice) : null,
      discountEndsAt,
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
      if (!response.vehicle) throw new Error('Il server non ha restituito i dati aggiornati dell’auto.');
      if (discountEndsAt && Date.parse(response.vehicle?.discountEndsAt) !== Date.parse(discountEndsAt)) {
        setAdminError('L’API non ha confermato la scadenza dello sconto. L’auto potrebbe essere stata salvata senza scadenza: aggiorna il backend che gestisce /api/vehicles, poi verifica l’auto in inventario prima di riprovare.');
        return;
      }
      if (editing) {
        setVehicles((current) => current.map((vehicle) => vehicle.id === editing.id ? response.vehicle : vehicle));
        setAdminMessage('Auto aggiornata correttamente.');
      } else {
        setVehicles((current) => [response.vehicle, ...current]);
        setAdminMessage('Nuova auto aggiunta all’inventario.');
      }
      setEditingVehicle(null);
      setAdminVehiclePrice('');
      setAdminVehicleDiscountPrice('');
      setAdminDiscountEndMode('scheduled');
      setAdminVehicleDiscountEndsAt('');
      setAdminVehicleType(adminVehicleTypeDefault);
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
    setAdminVehicleDiscountPrice(vehicle.type === 'buy' && vehicle.discountPrice != null ? String(vehicle.discountPrice) : '');
    setAdminDiscountEndMode(vehicle.discountEndsAt ? 'scheduled' : 'permanent');
    setAdminVehicleDiscountEndsAt(formatLocalDateInput(vehicle.discountEndsAt));
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
    if (type !== 'all') setFilter(type);
    closeMenu(false);
    navigateToPath('/catalogo');
  }

  function goToMake(make) {
    const matchingMake = vehicles.find((vehicle) => normalizeVehicleMake(vehicle.make) === normalizeVehicleMake(make))?.make;
    setMakeFilter(matchingMake || make);
    setModelFilter('');
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

  function openPurchaseRequestModal() {
    const nameParts = String(user?.name || '').trim().split(/\s+/).filter(Boolean);
    if (!purchaseRequestFirstName.trim() && nameParts.length) {
      setPurchaseRequestFirstName(nameParts[0]);
      setPurchaseRequestLastName(nameParts.slice(1).join(' '));
    }
    if (!purchaseRequestEmail.trim() && user?.email) setPurchaseRequestEmail(user.email);
    setPurchaseRequestModalOpen(true);
  }

  function startRequestModalDrag(event) {
    if (!event.isPrimary || event.button !== 0 || purchaseRequestBusyRef.current || visitRequestBusyRef.current) return;
    const modal = event.currentTarget.closest('.dealer-visit-modal');
    if (!modal) return;
    requestModalDragRef.current = {
      pointerId: event.pointerId,
      startY: event.clientY,
      startedAt: performance.now(),
      modal,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    event.preventDefault();
    modal.style.animation = 'none';
    modal.style.transition = 'none';
    modal.style.transform = 'translate3d(0, 0, 0)';
  }

  function moveRequestModalDrag(event) {
    const drag = requestModalDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const offsetY = Math.max(0, event.clientY - drag.startY);
    drag.modal.style.transform = `translate3d(0, ${offsetY}px, 0)`;
    event.preventDefault();
  }

  function finishRequestModalDrag(event, cancelled = false) {
    const drag = requestModalDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    requestModalDragRef.current = null;
    const offsetY = Math.max(0, event.clientY - drag.startY);
    const elapsed = Math.max(1, performance.now() - drag.startedAt);
    const isPurchaseModal = drag.modal.classList.contains('purchase-request-modal');
    const isBusy = isPurchaseModal ? purchaseRequestBusyRef.current : visitRequestBusyRef.current;
    const shouldClose = !cancelled && !isBusy && (
      offsetY >= 110 || (offsetY >= 55 && offsetY / elapsed >= 0.65)
    );

    if (shouldClose) {
      if (isPurchaseModal) setPurchaseRequestModalOpen(false);
      else setVisitRequestModalOpen(false);
      return;
    }

    drag.modal.style.transition = 'transform .24s cubic-bezier(.2, .8, .2, 1)';
    drag.modal.style.transform = 'translate3d(0, 0, 0)';
  }

  async function submitPurchaseRequest(vehicle, contact) {
    if (user && user.role !== 'user') {
      setPurchaseRequestStatus({
        vehicleId: vehicle.id,
        error: 'Gli account amministratore non possono inviare richieste cliente.',
        message: '',
      });
      return;
    }
    if (vehicle.type !== 'buy') return;
    const firstName = typeof contact?.firstName === 'string' ? contact.firstName.trim() : '';
    const lastName = typeof contact?.lastName === 'string' ? contact.lastName.trim() : '';
    const email = typeof contact?.email === 'string' ? contact.email.trim() : '';
    const phone = typeof contact?.phone === 'string' ? contact.phone.trim() : '';
    if (contact?.termsAccepted !== true) {
      setPurchaseRequestStatus({
        vehicleId: vehicle.id,
        error: 'Accetta i termini e le condizioni per proseguire.',
        message: '',
      });
      return;
    }
    if (!firstName || !lastName || !email || phone.length < 6) {
      setPurchaseRequestStatus({
        vehicleId: vehicle.id,
        error: 'Controlla nome, cognome, email e numero di telefono.',
        message: '',
      });
      return;
    }
    setPurchaseRequestStatus({ vehicleId: vehicle.id, error: '', message: '' });
    setPurchaseRequestBusy(vehicle.id);
    try {
      const { request, message } = await requestJson('/api/purchase-requests', {
        method: 'POST',
        body: JSON.stringify({
          vehicleId: vehicle.id,
          firstName,
          lastName,
          email,
          phone,
          termsAccepted: true,
        }),
      });
      if (user?.role === 'user') {
        setMyPurchaseRequests((current) => [request, ...current.filter((item) => item.id !== request.id)]);
      }
      setPurchaseRequestStatus({ vehicleId: vehicle.id, error: '', message });
      setPurchaseRequestModalOpen(false);
    } catch (error) {
      setPurchaseRequestStatus({ vehicleId: vehicle.id, error: error.message, message: '' });
    } finally {
      setPurchaseRequestBusy('');
    }
  }

  async function submitVehiclePriceOffer(event, vehicle) {
    event.preventDefault();
    if (user && user.role !== 'user') {
      setPriceOfferStatus({
        vehicleId: vehicle.id,
        error: 'Gli account amministratore non possono inviare proposte cliente.',
        message: '',
      });
      return;
    }
    const formData = new FormData(event.currentTarget);
    const amount = Number(priceOfferAmount);
    const name = String(formData.get('name') || '').trim();
    const email = String(formData.get('email') || '').trim();
    const phone = String(formData.get('phone') || '').trim();
    const termsAccepted = formData.get('termsAccepted') === 'on';
    const message = priceOfferMessage.trim();
    if (!termsAccepted) {
      setPriceOfferStatus({
        vehicleId: vehicle.id,
        error: 'Accetta i termini e le condizioni per proseguire.',
        message: '',
      });
      return;
    }
    if (name.length < 2 || name.length > 80 || !email || phone.length < 6 || phone.length > 30) {
      setPriceOfferStatus({
        vehicleId: vehicle.id,
        error: 'Inserisci nome, email e un numero di telefono validi.',
        message: '',
      });
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0 || amount >= getVehicleCurrentPrice(vehicle)) {
      setPriceOfferStatus({
        vehicleId: vehicle.id,
        error: 'Inserisci un importo positivo e inferiore al prezzo attuale.',
        message: '',
      });
      return;
    }
    if (message.length > 500) {
      setPriceOfferStatus({ vehicleId: vehicle.id, error: 'Il messaggio non può superare 500 caratteri.', message: '' });
      return;
    }
    if (myVehicleOffers.some((offer) => offer.vehicle.id === vehicle.id && ['pending', 'countered'].includes(offer.status))) {
      setPriceOfferStatus({ vehicleId: vehicle.id, error: 'Hai già una trattativa aperta per questa auto. Rispondi dalla sezione Proposte di prezzo.', message: '' });
      return;
    }

    setPriceOfferBusy(vehicle.id);
    setPriceOfferStatus({ vehicleId: vehicle.id, error: '', message: '' });
    try {
      const { offer, message: responseMessage } = await requestJson('/api/vehicle-price-offers', {
        method: 'POST',
        body: JSON.stringify({ vehicleId: vehicle.id, amount, message, name, email, phone, termsAccepted: true }),
      });
      if (!offer || offer.vehicle?.id !== vehicle.id || offer.status !== 'pending') {
        throw new Error('Il server non ha confermato l’invio della proposta.');
      }
      if (user?.role === 'user') {
        setMyVehicleOffers((current) => [offer, ...current.filter((item) => item.id !== offer.id)]);
      }
      setPriceOfferStatus({ vehicleId: vehicle.id, error: '', message: responseMessage });
      setPriceOfferAmount('');
      setPriceOfferMessage('');
      setPriceOfferOpen(false);
    } catch (error) {
      setPriceOfferStatus({ vehicleId: vehicle.id, error: error.message, message: '' });
    } finally {
      setPriceOfferBusy('');
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

  async function submitVisitRequest(event, vehicle) {
    event.preventDefault();
    const form = event.currentTarget;
    const invalidField = Array.from(form.elements).find((field) => typeof field.checkValidity === 'function' && !field.checkValidity());
    if (invalidField) {
      const fieldMessages = {
        visitDate: 'Seleziona il giorno della visita.',
        visitTime: 'Seleziona l’orario della visita.',
        name: 'Inserisci nome e cognome.',
        email: 'Inserisci un indirizzo email valido.',
        phone: 'Inserisci un numero di telefono valido.',
        termsAccepted: 'Accetta i termini e le condizioni per proseguire.',
      };
      setVisitRequestStatus({
        vehicleId: vehicle.id,
        error: fieldMessages[invalidField.name] || 'Controlla i dati obbligatori prima di proseguire.',
        message: '',
        warning: false,
      });
      invalidField.focus();
      return;
    }
    const formData = new FormData(form);
    const localVisitAt = parseDateTimeInTimeZone(
      formData.get('visitDate'),
      formData.get('visitTime'),
      businessTimeZone,
    );
    if (!localVisitAt || localVisitAt <= new Date()) {
      setVisitRequestStatus({
        vehicleId: vehicle.id,
        error: 'Scegli una data e un’ora future e valide nel fuso orario della concessionaria.',
        message: '',
        warning: false,
      });
      return;
    }

    setVisitRequestStatus({ vehicleId: vehicle.id, error: '', message: '', warning: false });
    setVisitRequestBusy(vehicle.id);
    try {
      const { message, adminNotificationStatus } = await requestJson('/api/visit-requests', {
        method: 'POST',
        body: JSON.stringify({
          vehicleId: vehicle.id,
          name: formData.get('name'),
          email: formData.get('email'),
          phone: formData.get('phone'),
          visitAt: localVisitAt.toISOString(),
          message: formData.get('message'),
          termsAccepted: formData.get('termsAccepted') === 'on',
        }),
      });
      setVisitRequestStatus({
        vehicleId: vehicle.id,
        error: '',
        message,
        warning: adminNotificationStatus !== 'sent',
      });
      form.reset();
      setVisitRequestModalOpen(false);
    } catch (error) {
      setVisitRequestStatus({ vehicleId: vehicle.id, error: error.message, message: '', warning: false });
    } finally {
      setVisitRequestBusy('');
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
      .map((vehicle) => {
        const discountPrice = getVehicleDiscountPrice(vehicle);
        const price = discountPrice === null
          ? euro.format(vehicle.price)
          : `${euro.format(discountPrice)} (scontato, listino ${euro.format(vehicle.price)})`;
        return `• ${vehicle.year} ${vehicle.make} ${vehicle.model} (${price}${vehicle.type === 'rent' ? ' al giorno' : ` · ${getVehicleVatLabel(vehicle)}`})`;
      })
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

  async function respondToVehiclePriceOffer(offer, status, counterAmount = null, message = '') {
    setVehicleOfferActionBusy(offer.id);
    setVehicleOfferActionStatus({ offerId: offer.id, error: '', message: '' });
    try {
      const { offer: updatedOffer, message } = await requestJson(
        `/api/vehicle-price-offers/${encodeURIComponent(offer.id)}/respond`,
        {
          method: 'PATCH',
          body: JSON.stringify({ status, ...(counterAmount !== null ? { counterAmount, message } : {}) }),
        },
      );
      if (!updatedOffer || updatedOffer.id !== offer.id || updatedOffer.status !== status) {
        throw new Error('Il server non ha confermato l’aggiornamento della proposta.');
      }
      setAdminVehicleOffers((current) => current.map((item) => (
        item.id === offer.id ? updatedOffer : item
      )));
      setVehicleOfferActionStatus({ offerId: offer.id, error: '', message });
    } catch (error) {
      setVehicleOfferActionStatus({ offerId: offer.id, error: error.message, message: '' });
    } finally {
      setVehicleOfferActionBusy('');
    }
  }

  async function respondToVehiclePriceOfferAsCustomer(offer, status, amount = null, message = '') {
    setCustomerVehicleOfferActionBusy(offer.id);
    setCustomerVehicleOfferActionStatus({ offerId: offer.id, error: '', message: '' });
    try {
      const { offer: updatedOffer, message: responseMessage } = await requestJson(
        `/api/vehicle-price-offers/${encodeURIComponent(offer.id)}/customer-response`,
        {
          method: 'PATCH',
          body: JSON.stringify({ status, ...(amount !== null ? { amount, message } : {}) }),
        },
      );
      if (!updatedOffer || updatedOffer.id !== offer.id) throw new Error('Il server non ha confermato l’aggiornamento della trattativa.');
      setMyVehicleOffers((current) => current.map((item) => (item.id === offer.id ? updatedOffer : item)));
      setCustomerVehicleOfferActionStatus({ offerId: offer.id, error: '', message: responseMessage });
    } catch (error) {
      setCustomerVehicleOfferActionStatus({ offerId: offer.id, error: error.message, message: '' });
    } finally {
      setCustomerVehicleOfferActionBusy('');
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

  async function decideVisitRequest(request, status, reason) {
    setVisitRequestActionBusy(request.id);
    setVisitRequestActionStatus({ requestId: request.id, error: '', message: '', warning: false });
    try {
      const { request: updatedRequest, notificationStatus } = await requestJson(
        `/api/visit-requests/${encodeURIComponent(request.id)}/decision`,
        { method: 'PATCH', body: JSON.stringify({ status, reason }) },
      );
      if (!updatedRequest || updatedRequest.id !== request.id || updatedRequest.status !== status
          || updatedRequest.decisionReason !== reason) {
        throw new Error('Il server non ha confermato la decisione sulla visita.');
      }
      setAdminVisitRequests((current) => current.map((item) => (
        item.id === request.id ? updatedRequest : item
      )));
      setVisitRequestActionStatus({
        requestId: request.id,
        error: '',
        message: notificationStatus === 'sent'
          ? 'Decisione salvata e comunicata al cliente via email.'
          : 'Decisione salvata, ma non è stato possibile inviare l’email al cliente. Contattalo manualmente.',
        warning: notificationStatus !== 'sent',
      });
    } catch (error) {
      setVisitRequestActionStatus({ requestId: request.id, error: error.message, message: '', warning: false });
    } finally {
      setVisitRequestActionBusy('');
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
    setModelFilter('');
    setColorFilter('');
    setDoorsFilter('');
    setDrivetrainFilter('');
    setNoviceDriverFilter('');
    setFuelFilter('');
    setTransmissionFilter('');
    setMaxKm('');
    setMaxPrice('');
    setMaxPower('');
    setSearch('');
    setSortBy('recommended');
    setCatalogExtraFiltersOpen(false);
  }

  function stopCarouselAnimation(track) {
    const running = carouselAnimationsRef.current.get(track);
    if (!running) return;
    running.controls.stop();
    carouselAnimationsRef.current.delete(track);
    delete track.dataset.animating;
  }

  function getCarouselOffsets(track) {
    const trackStart = track.getBoundingClientRect().left + track.clientLeft
      + parseFloat(getComputedStyle(track).scrollPaddingLeft);
    return Array.from(track.children, (card) => card.getBoundingClientRect().left - trackStart);
  }

  function scrollCarousel(trackRef, direction) {
    const track = trackRef.current;
    const cards = track ? Array.from(track.children) : [];
    if (!track || cards.length === 0) return;

    const running = carouselAnimationsRef.current.get(track);
    const offsets = getCarouselOffsets(track);
    const currentIndex = running
      ? running.targetIndex
      : offsets.reduce((best, offset, index) => (Math.abs(offset) < Math.abs(offsets[best]) ? index : best), 0);
    const targetIndex = Math.min(cards.length - 1, Math.max(0, currentIndex + direction));
    const maxScroll = track.scrollWidth - track.clientWidth;
    const target = Math.min(maxScroll, Math.max(0, track.scrollLeft + offsets[targetIndex]));

    stopCarouselAnimation(track);
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      track.scrollTo({ left: target, behavior: 'instant' });
      return;
    }

    // Scroll snapping is paused while the animation runs so the two do not fight each other.
    track.dataset.animating = 'true';
    const finish = () => {
      carouselAnimationsRef.current.delete(track);
      delete track.dataset.animating;
    };
    const controls = animate(track.scrollLeft, target, {
      duration: 0.85,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (value) => { track.scrollLeft = value; },
      onComplete: finish,
    });
    carouselAnimationsRef.current.set(track, { controls, targetIndex });
  }

  function interruptCarouselAnimation(event) {
    stopCarouselAnimation(event.currentTarget);
  }

  function updateCarouselFocus(trackRef, setFocusedIndex) {
    const track = trackRef.current;
    if (!track) return;
    let closestIndex = 0;
    let closestDistance = Number.POSITIVE_INFINITY;
    getCarouselOffsets(track).forEach((offset, index) => {
      const distance = Math.abs(offset);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });
    setFocusedIndex((current) => current === closestIndex ? current : closestIndex);
  }

  function startAdminPinChallenge(expiresInMs, requiresTotp = false) {
    const currentPath = window.location.pathname;
    const returnPath = currentPath === '/admin/verify'
      ? window.history.state?.adminPinReturnPath
      : currentPath;
    adminPinDestinationRef.current = typeof returnPath === 'string'
      && /^\/admin(?:\/|$)/.test(returnPath)
      && returnPath !== '/admin/verify'
      ? returnPath : '/admin';
    if (currentPath !== '/admin/verify') {
      window.history.replaceState({ adminPinReturnPath: adminPinDestinationRef.current }, '', '/admin/verify');
      setPathname('/admin/verify');
      window.scrollTo({ top: 0 });
    }
    const suppliedRemainingMs = Number(expiresInMs);
    const remainingMs = Number.isFinite(suppliedRemainingMs)
      ? Math.min(ADMIN_PIN_CHALLENGE_LIFETIME_MS, Math.max(0, suppliedRemainingMs))
      : ADMIN_PIN_CHALLENGE_LIFETIME_MS;
    setAdminPinExpiresAt(Date.now() + remainingMs);
    setAdminPinSecondsRemaining(Math.ceil(remainingMs / 1000));
    setAdminPinRequired(true);
    setAdminTotpRequired(Boolean(requiresTotp));
    setAuthMode('admin-pin');
    setPasswordVisible(false);
    setAuthError('');
  }

  async function handleAuthSubmit(event) {
    event.preventDefault();
    if (!authReady && authMode !== 'admin-pin') {
      setAuthError('Attendi il controllo della sessione prima di accedere.');
      return;
    }
    if (authMode === 'admin-pin' && adminPinSecondsRemaining <= 0) {
      setAuthError('Il tempo per inserire il codice è scaduto. Accedi di nuovo.');
      return;
    }
    const form = event.currentTarget;
    const formData = new FormData(form);
    const values = Object.fromEntries(formData.entries());
    const fieldErrors = validateAuthValues(authMode, values, adminTotpRequired);
    const fieldsToTouch = authMode === 'admin-pin'
      ? [adminTotpRequired ? 'code' : 'pin']
      : authMode === 'signup'
        ? ['name', 'email', 'password', 'confirmPassword']
        : ['email', 'password'];
    setAuthTouchedFields(Object.fromEntries(fieldsToTouch.map((field) => [field, true])));
    setAuthFieldErrors(fieldErrors);
    setAuthError('');
    if (Object.keys(fieldErrors).length) {
      const firstInvalidField = authMode === 'admin-pin'
        ? adminTotpRequired ? 'code' : 'pin'
        : authMode === 'signup'
          ? ['name', 'email', 'password', 'confirmPassword'].find((field) => fieldErrors[field])
          : ['email', 'password'].find((field) => fieldErrors[field]);
      form.elements.namedItem(firstInvalidField)?.focus();
      return;
    }

    setAuthBusy(true);
    setLogoutNotice('');
    const requestId = ++authRequestIdRef.current;

    if (authMode === 'admin-pin') {
      try {
        const { user: verifiedUser } = await requestJson(
          adminTotpRequired ? '/api/admin/mfa/totp' : '/api/users/admin-pin',
          {
            method: 'POST',
            body: JSON.stringify(adminTotpRequired
              ? { code: String(formData.get('code') || '').trim() }
              : { pin: formData.get('pin') }),
          },
        );
        if (authRequestIdRef.current !== requestId) return;
        setUser(verifiedUser);
        setAdminPinRequired(false);
        setAdminTotpRequired(false);
        setAdminPinExpiresAt(null);
        setAdminPinSecondsRemaining(60);
        setAuthMode('');
        setAuthReady(true);
        navigateAfterAuthentication(verifiedUser);
      } catch (error) {
        if (authRequestIdRef.current === requestId) {
          if (/scadut/i.test(error.message)) {
            setAdminPinExpiresAt(Date.now());
            setAdminPinSecondsRemaining(0);
          }
          form.reset();
          setAuthError(error.message);
        }
      } finally {
        setAuthBusy(false);
      }
      return;
    }

    const password = String(formData.get('password') ?? '');
    const payload = authMode === 'signup'
      ? { email: formData.get('email'), name: formData.get('name'), password }
      : { identifier: formData.get('email'), password };

    try {
      const { user: signedInUser, requiresAdminPin, requiresAdminTotp, adminPinExpiresInMs } = await requestJson(`/api/users/${authMode}`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      if (authRequestIdRef.current !== requestId) return;
      if (requiresAdminPin || requiresAdminTotp) {
        startAdminPinChallenge(adminPinExpiresInMs, requiresAdminTotp);
        return;
      }
      setUser(signedInUser);
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
    setAdminPinRequired(false);
    setAdminTotpRequired(false);
    setAdminPinExpiresAt(null);
    setAdminPinSecondsRemaining(60);
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
          <p>La valutazione della tua auto è gratuita e viene effettuata in meno di 24 ore. Al ritiro, se concordato, pensiamo noi.</p>
        </div>
        <ol className="vehicle-sale-steps">
          <li className="vehicle-sale-step">
            <span className="vehicle-sale-step-icon" aria-hidden="true"><ClipboardList /></span>
            <span className="vehicle-sale-step-number">01</span>
            <div><h3>Proponi</h3><p>Inviaci i dati e le foto dell’auto.</p></div>
          </li>
          <li className="vehicle-sale-step">
            <span className="vehicle-sale-step-icon" aria-hidden="true"><Search /></span>
            <span className="vehicle-sale-step-number">02</span>
            <div><h3>Valutiamo</h3><p>La esaminiamo e ti ricontattiamo.</p></div>
          </li>
          <li className="vehicle-sale-step">
            <span className="vehicle-sale-step-icon" aria-hidden="true"><Truck /></span>
            <span className="vehicle-sale-step-number">03</span>
            <div><h3>La ritiriamo</h3><p>Se troviamo l’accordo, concordiamo il ritiro.</p></div>
          </li>
        </ol>
        <div className="vehicle-sale-process-footer">
          <p><SiteIcon name="info" /> Possiamo concordare il ritiro dell’auto che vendi o la consegna di quella acquistata: zona, tempi, disponibilità ed eventuali costi dipendono dal veicolo.</p>
          <button type="button" onClick={() => goToInventory('buy')}>Scopri le auto in vendita <ArrowUpRight aria-hidden="true" /></button>
        </div>
      </section>
      <section className="sell-section section-wrap" id="sell">
        <div className="sell-section-heading">
          <p className="eyebrow">ACQUISTIAMO AUTO USATE</p>
          <h2>Valutiamo la tua auto<br />con la <em>giusta attenzione.</em></h2>
          <p>Compila i dati e aggiungi le foto per richiedere una valutazione gratuita in meno di 24 ore. La proposta resta riservata al concessionario, che ti ricontatterà per discuterne.</p>
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
              {sellFormBusy ? 'Invio in corso…' : 'Invia la proposta'} <ArrowUpRight aria-hidden="true" />
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
          <h1>La tua prossima auto inizia con un <em>ciao.</em></h1>
          <p>Hai una domanda, vuoi vendere la tua auto o cerchi un modello in particolare? Scrivici.</p>
          <div className="contact-channel-list">
            <div className="contact-detail">
              <span className="contact-detail-icon"><SiteIcon name="pin" /></span>
              <div>
                <small>VIENI A TROVARCI</small>
                <a href={mapsSearchUrl} target="_blank" rel="noreferrer">{publicAddress}</a>
              </div>
            </div>
            {showBusinessContactPhone && (
              <div className="contact-detail">
                <span className="contact-detail-icon"><SiteIcon name="phone" /></span>
                <div>
                  <small>TELEFONO GENERALE</small>
                  <a href={`tel:${businessContactPhone.replace(/[^\d+]/g, '')}`}>{businessContactPhone}</a>
                </div>
              </div>
            )}
            {showBusinessContactEmail && (
              <div className="contact-detail">
                <span className="contact-detail-icon"><SiteIcon name="mail" /></span>
                <div>
                  <small>EMAIL GENERALE</small>
                  <a href={`mailto:${businessContactEmail}`}>{businessContactEmail}</a>
                </div>
              </div>
            )}
            <div className="contact-detail">
              <span className="contact-detail-icon"><SiteIcon name="phone" /></span>
              <div>
                <small>CHIAMA {gerardoContact.name.toLocaleUpperCase('it-IT')}</small>
                <div className="contact-detail-links">
                  {gerardoPhoneHref && <a href={gerardoPhoneHref}>{gerardoContact.phone}</a>}
                  {gerardoWhatsappHref && <a href={gerardoWhatsappHref} target="_blank" rel="noopener noreferrer">WhatsApp <span aria-hidden="true">↗</span></a>}
                </div>
              </div>
            </div>
            <div className="contact-detail">
              <span className="contact-detail-icon"><SiteIcon name="mail" /></span>
              <div>
                <small>SCRIVICI</small>
                {luigiContact.email && <a href={`mailto:${luigiContact.email}`}>{luigiContact.email}</a>}
              </div>
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
            <h2 id="location-title">Ti aspettiamo <em>in sede.</em></h2>
          </div>
          <a className="text-link" href={mapsSearchUrl} target="_blank" rel="noreferrer">
            Apri in Google Maps <span aria-hidden="true">↗</span>
          </a>
        </div>
        <div className="location-content-grid">
          <div className="location-map">
            {cookieConsent?.externalMedia ? (
              <iframe
                title={`Mappa della sede ${businessName} in ${publicAddress}`}
                src={mapsEmbedUrl}
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
          <aside className="contact-hours-card" aria-label="Orari di apertura">
            <p className="eyebrow">ORARI DI APERTURA</p>
            <h3>Passa a trovarci.</h3>
            <dl>
              {(siteSettings.openingHours || DEFAULT_SITE_SETTINGS.openingHours).map((entry) => (
                <div key={entry.day}>
                  <dt>{WEEKDAY_LABELS[entry.day]}</dt>
                  <dd>{todaysHoliday && entry.day === todayWeekday
                    ? `Chiuso · ${todaysHoliday.label}`
                    : entry.closed
                      ? 'Chiuso'
                      : <>
                        <time dateTime={entry.morningOpen}>{entry.morningOpen}</time> – <time dateTime={entry.morningClose}>{entry.morningClose}</time>
                        {entry.afternoonOpen && entry.afternoonClose
                          ? <><br /><time dateTime={entry.afternoonOpen}>{entry.afternoonOpen}</time> – <time dateTime={entry.afternoonClose}>{entry.afternoonClose}</time></>
                          : <><br /><span>Pomeriggio chiuso</span></>}
                      </>}
                  </dd>
                </div>
              ))}
            </dl>
            {todaysHoliday && <p className="contact-holiday-notice">Oggi: {todaysHoliday.label}</p>}
          </aside>
        </div>
      </section>
    </>
  );

  if (isAdminRoutePending) {
    return (
      <RouteStyleBoundary pathname={pathname}>
        <main className="route-style-loading" role="status">Verifica della sessione amministratore…</main>
      </RouteStyleBoundary>
    );
  }

  return (
    <RouteStyleBoundary pathname={pathname}>
    <div
      className={`site-shell${isAccountPage ? ' account-page-shell' : ''}${isCatalogPage ? ' catalog-page-shell' : ''}${isSellPage ? ' sell-page-shell' : ''}${normalizedPathname.startsWith('/auto/') ? ' vehicle-detail-page-shell' : ''}${isAdminArea && !isAdminRouteBlocked && !isNotFoundPage ? ' admin-site-shell' : ''}${isAdminArea && !isAdminRouteBlocked && !isNotFoundPage && user?.role === 'admin' && !adminPinRequired ? ' admin-authenticated-shell' : ''}${visibleSiteAnnouncement && !isAdminArea ? ' has-site-announcement' : ''}`}
      data-theme="public"
      data-home-theme={(isHomePage || isSellPage || isAccountPage || isCatalogPage) && !isSiteUnavailable && !isSiteSettingsLoading ? 'monochrome' : undefined}
      style={visibleSiteAnnouncement && !isAdminArea ? { '--site-announcement-height': '44px' } : undefined}
    >
      {!adminPinRequired && <>
      {!isNotFoundPage && !isAdminArea && !isSiteUnavailable && !isSiteSettingsLoading && (!cookieConsent || cookieSettingsOpen) && (
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
      {!isNotFoundPage && !isSiteUnavailable && !isSiteSettingsLoading && logoutNotice && (
        <div className="logout-notice" role="status">
          <span>{logoutNotice}</span>
          <button type="button" aria-label="Chiudi avviso" onClick={() => setLogoutNotice('')}>×</button>
        </div>
      )}
      {visibleSiteAnnouncement && !isAdminArea && !isSiteUnavailable && !isSiteSettingsLoading && (
        <aside className={`site-announcement-banner is-${visibleSiteAnnouncement.type}`} role={visibleSiteAnnouncement.type === 'alert' ? 'alert' : 'status'}>
          <AnnouncementIcon className="site-announcement-icon" size={18} aria-hidden="true" />
          <div className="site-announcement-copy">
            <span>{visibleSiteAnnouncement.message}</span>
            <small>Fino al {new Date(visibleSiteAnnouncement.expiresAt).toLocaleString('it-IT', { dateStyle: 'short', timeStyle: 'short' })}</small>
          </div>
          <button type="button" className="site-announcement-close" aria-label="Chiudi il banner" onClick={() => setDismissedAnnouncementKey(announcementKey)}>
            <X size={17} aria-hidden="true" />
          </button>
        </aside>
      )}
      {!isNotFoundPage && !isAdminRouteBlocked && !isSiteUnavailable && !isSiteSettingsLoading
        && !isAdminEntryPending && !isAdminEntryCheckError
        && (!isAdminEntryPage || user?.role === 'admin')
        && <header className={`site-header${isAdminArea ? ' admin-site-header' : ''}${isPublicMainHeader ? ' public-main-header' : ''}${isAccountPage ? ' account-site-header' : ''}${visibleSiteAnnouncement && !isAdminArea ? ' has-site-announcement' : ''}`}>
        {isAdminArea ? (
          <AdminConsoleHeader
            searchTerm={adminSearchTerm}
            onSearchTermChange={setAdminSearchTerm}
            onNavigate={navigateToPath}
            onLogout={handleLogout}
            vehicles={vehicles}
            purchaseRequests={adminPurchaseRequests}
            priceOffers={adminVehicleOffers}
            rentalRequests={adminRentalRequests}
            visitRequests={adminVisitRequests}
            sellSubmissions={sellSubmissions}
            timeZone={businessTimeZone}
          />
        ) : (
          <>
        {isPublicMainHeader ? (
          <>
            {!normalizedPathname.startsWith('/auto/') && (
              <a className="public-header-brand" href="/" aria-label={`${businessName}, pagina iniziale`} onClick={(event) => { event.preventDefault(); navigateToHome(); }}>
                <img src={siteSettings.logoUrl || DEFAULT_SITE_SETTINGS.logoUrl} alt={businessName} />
              </a>
            )}
            {normalizedPathname.startsWith('/auto/') && (
              <button className="public-header-catalog" type="button" aria-label="Torna al catalogo" onClick={() => navigateToPath('/catalogo')}>
                <ArrowLeft size={17} aria-hidden="true" />
                <span>Torna indietro</span>
              </button>
            )}
            <nav className="public-header-nav" aria-label="Navigazione principale">
              {!normalizedPathname.startsWith('/auto/') && <a href="/catalogo" onClick={(event) => { event.preventDefault(); goToInventory('all'); }}>Auto disponibili</a>}
              <a href="/vendi-auto" aria-current={isSellPage ? 'page' : undefined} onClick={(event) => { event.preventDefault(); navigateToPath('/vendi-auto'); }}>Vendi auto</a>
              <a href="/#about" onClick={(event) => { event.preventDefault(); navigateToHome('about'); }}>Chi siamo</a>
              <a href="/contatti" aria-current={isContactPage ? 'page' : undefined} onClick={(event) => { event.preventDefault(); navigateToPath('/contatti'); }}>Contatti</a>
            </nav>
            <div className="public-header-actions">
              {user?.role === 'user' && (
                <button ref={cartToggleRef} className="public-header-selection" type="button" aria-label={`Apri la selezione auto, ${selectedVehicles.length} veicoli`} onClick={openCart}>
                  <CartIcon />
                  <span className="public-header-action-label">Selezione</span>
                  <span className="public-header-count">{selectedVehicles.length}</span>
                </button>
              )}
              <button
                className="public-header-account"
                type="button"
                aria-label={user?.role === 'admin' ? 'Apri la dashboard amministratore' : user ? 'Apri la tua area personale' : 'Accedi al tuo account'}
                onClick={() => {
                  if (user?.role === 'admin') navigateToPath('/admin');
                  else if (user) navigateToPath('/account');
                  else { setAuthError(''); setAuthMode('login'); }
                }}
              >
                <UserRound size={19} aria-hidden="true" />
                <span className="public-header-action-label">{user?.role === 'admin' ? 'Admin' : user ? 'Account' : 'Accedi'}</span>
              </button>
              <button
                className="public-header-menu"
                ref={menuToggleRef}
                type="button"
                aria-label="Apri il menu di navigazione"
                aria-expanded={menuOpen}
                aria-controls="site-menu"
                onClick={() => setMenuOpen(true)}
              >
                <Menu size={20} strokeWidth={1.8} aria-hidden="true" />
                <span className="public-header-action-label">Menu</span>
              </button>
            </div>
          </>
        ) : (
          <>
        {isCatalogPage && (
          <button
            className="catalog-header-back"
            type="button"
            aria-label="Torna alla home"
            onClick={() => navigateToHome()}
          >
            <ArrowLeft size={20} aria-hidden="true" />
          </button>
        )}
        {isCatalogPage && (
          <div className="catalog-header-tools" role="search">
            <label className="catalog-header-search">
              <span className="visually-hidden">Cerca marca, modello o caratteristiche</span>
              <input
                type="search"
                placeholder={search ? '' : catalogSearchPlaceholder || 'Cerca un’auto'}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              <span className="catalog-header-search-icon" aria-hidden="true"><SiteIcon name="search" /></span>
            </label>
            <button
              className="catalog-header-filter"
              type="button"
              aria-label={catalogFiltersOpen ? 'Chiudi i filtri del catalogo' : 'Apri i filtri del catalogo'}
              aria-expanded={catalogFiltersOpen}
              aria-controls="catalog-advanced-filters"
              onClick={() => setCatalogFiltersOpen((open) => !open)}
            >
              <SlidersHorizontal size={18} strokeWidth={1.8} aria-hidden="true" />
            </button>
          </div>
        )}
        {!activeVehicle && !isUnknownVehiclePage && !isAdminArea && !isAccountPage && (
          <nav className="header-nav" aria-label="Navigazione principale">
            <button type="button" onClick={() => goToInventory('all')}>Auto disponibili</button>
            <button type="button" onClick={() => navigateToSection('services')}>Servizi</button>
            <button type="button" onClick={() => navigateToSection('about')}>Chi siamo</button>
          </nav>
        )}
        {isAccountPage && (
          <a className="account-dashboard-brand" href="/" aria-label={`${businessName}, pagina iniziale`} onClick={(event) => { event.preventDefault(); navigateToHome(); }}>
            <img src={siteSettings.logoUrl || DEFAULT_SITE_SETTINGS.logoUrl} alt={businessName} />
          </a>
        )}
        <div className="header-actions">
          {isCatalogPage && (
            <button
              className="catalog-header-account"
              type="button"
              aria-label={user?.role === 'admin' ? 'Apri la dashboard amministratore' : user ? 'Apri la tua area personale' : 'Accedi al tuo account'}
              onClick={() => {
                if (user?.role === 'admin') navigateToPath('/admin');
                else if (user) navigateToPath('/account');
                else { setAuthError(''); setAuthMode('login'); }
              }}
            >
              <UserRound size={20} aria-hidden="true" />
            </button>
          )}
          {user?.role === 'admin' ? (
            !isCatalogPage && <button className="admin-header-link header-glossy-accent" type="button" onClick={() => navigateToPath('/admin')} aria-label="Apri la dashboard amministratore">
              Amministratore
              <span className="admin-header-arrow" aria-hidden="true">→</span>
            </button>
          ) : (
            <>
              {user?.role === 'user' && !normalizedPathname.startsWith('/auto/') && !isAccountPage && !isCatalogPage && (
                <button className="header-account-link header-glossy-accent" type="button" onClick={() => navigateToPath('/account')} aria-label="Apri la tua area personale">
                  <span className="header-account-avatar" aria-hidden="true">{user.name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()}</span>
                  <span className="header-account-label">ACCOUNT</span>
                </button>
              )}
              {!isAccountPage && (
                <button ref={cartToggleRef} className={`${user ? 'cart-toggle' : 'cart-toggle is-login-required header-glossy-accent'}`} type="button" aria-label={user ? `Apri la selezione auto, ${selectedVehicles.length} veicoli` : 'Accedi per aprire la selezione auto'} onClick={openCart}>
                  <CartIcon />
                  <span className="cart-toggle-label">{user ? 'LA MIA SELEZIONE' : 'ACCEDI'}</span>
                  <span className="cart-count">{user ? selectedVehicles.length : 0}</span>
                </button>
              )}
            </>
          )}
          <span className="italian-flag" role="img" aria-label="Bandiera italiana"><i /><i /><i /></span>
          <button
            className={`menu-toggle${isAccountPage ? ' account-site-header-control' : ''}`}
            ref={menuToggleRef}
            type="button"
            aria-label="Apri il menu di navigazione"
            aria-expanded={menuOpen}
            aria-controls="site-menu"
            onClick={() => setMenuOpen(true)}
          >
            <Menu size={20} strokeWidth={1.8} aria-hidden="true" />
            <span className="menu-toggle-label">MENU</span>
          </button>
        </div>
          </>
        )}
        {menuOpen && (
          <>
            <button className="menu-backdrop" type="button" aria-label="Chiudi il menu di navigazione" onClick={closeMenu} />
            <aside className="menu-drawer" id="site-menu" ref={menuDrawerRef} role="dialog" aria-modal="true" aria-labelledby="menu-title">
              <div className="drawer-topline">
                <a className="brand" href="/" onClick={(event) => { event.preventDefault(); closeMenu(); navigateToHome(); }}>
                  <img className="brand-logo" src={siteSettings.logoUrl || DEFAULT_SITE_SETTINGS.logoUrl} alt={businessName} />
                </a>
                <button className="drawer-close" ref={menuCloseRef} type="button" onClick={closeMenu} aria-label="Chiudi il menu">
                  <svg className="close-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>
                </button>
              </div>
              <div className="drawer-intro">
                <p className="eyebrow">IL TUO PROSSIMO VIAGGIO</p>
                <h2 id="menu-title">Da dove<br /><em>vuoi partire?</em></h2>
              </div>
              <nav className="drawer-links" aria-label={`Scopri ${businessName}`}>
                <p className="drawer-label">SCOPRI</p>
                <button type="button" onClick={() => goToInventory('all')}>
                  <span>01</span> Tutte le auto <ArrowUpRight className="drawer-arrow" aria-hidden="true" />
                </button>
                <button type="button" onClick={() => goToInventory('buy')}>
                  <span>02</span> Auto in vendita <ArrowUpRight className="drawer-arrow" aria-hidden="true" />
                </button>
                <button type="button" onClick={() => goToInventory('rent')}>
                  <span>03</span> Auto a noleggio <ArrowUpRight className="drawer-arrow" aria-hidden="true" />
                </button>
                {(user?.role !== 'admin' || isPublicMainHeader) && <a href="/vendi-auto" onClick={(event) => { event.preventDefault(); closeMenu(false); navigateToPath('/vendi-auto'); }}><span>04</span> Vendi la tua auto <ArrowUpRight className="drawer-arrow" aria-hidden="true" /></a>}
                {user?.role === 'user' && (
                  <>
                    <a href="/account" onClick={(event) => { event.preventDefault(); closeMenu(false); navigateToPath('/account'); }}><span>05</span> La mia area personale <ArrowUpRight className="drawer-arrow" aria-hidden="true" /></a>
                  </>
                )}
                {user?.role === 'admin' && (
                  <>
                    <a href="/admin/inventory" onClick={(event) => { event.preventDefault(); closeMenu(false); navigateToPath('/admin/inventory'); }}><span>{isPublicMainHeader ? '05' : '04'}</span> Gestione inventario <ArrowUpRight className="drawer-arrow" aria-hidden="true" /></a>
                    <a href="/admin/messages" onClick={(event) => { event.preventDefault(); closeMenu(false); navigateToPath('/admin/messages'); }}><span>{isPublicMainHeader ? '06' : '05'}</span> Messaggi e vendite <ArrowUpRight className="drawer-arrow" aria-hidden="true" /></a>
                  </>
                )}
              </nav>
              <nav className="drawer-secondary" aria-label="Altre informazioni">
                <a href="/#services" onClick={(event) => { event.preventDefault(); closeMenu(false); navigateToHome('services'); }}>I nostri servizi</a>
                <a href="/#about" onClick={(event) => { event.preventDefault(); closeMenu(false); navigateToHome('about'); }}>Chi siamo</a>
                {(user?.role !== 'admin' || isPublicMainHeader) && <a href="/contatti" onClick={(event) => { event.preventDefault(); closeMenu(false); navigateToPath('/contatti'); }}>Contatta il team</a>}
                {user?.role !== 'admin' && luigiContact.email && <a href={`mailto:${luigiContact.email}`}>Scrivici via email</a>}
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
                      Crea un account <ArrowUpRight aria-hidden="true" />
                    </button>
                  </>
                )}
              </div>
              <p className="drawer-footer">BELLE AUTO. PERSONE AUTENTICHE. NUOVI VIAGGI.</p>
            </aside>
          </>
        )}
          </>
        )}
      </header>}

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
                <CartIcon className="cart-empty-icon" />
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
                          {getVehicleDiscountPrice(vehicle) !== null && <del className="vehicle-original-price">{euro.format(vehicle.price)}</del>}
                          <strong>{euro.format(getVehicleCurrentPrice(vehicle))}{vehicle.type === 'rent' ? ' / giorno' : ''}</strong>
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

      <main className={isNotFoundPage || isAdminRouteBlocked
        ? 'not-found-main'
        : isAdminEntryPending || isAdminEntryCheckError || isSiteUnavailable || isSiteSettingsLoading ? 'site-availability-main'
        : isAdminArea && user?.role === 'admin' ? 'admin-main-layout is-authenticated-admin' : isAdminArea ? 'admin-main-layout' : undefined}>
        {isNotFoundPage || isAdminRouteBlocked ? (
          <NotFoundPage
            onHome={() => navigateToHome()}
            onBrowseVehicles={() => navigateToPath('/catalogo')}
            logoUrl={siteSettings.logoUrl}
            businessName={siteSettings.businessName}
          />
        ) : null}
        {isAdminEntryPending && (
          <SiteAvailabilityPage loading logoUrl={siteSettings.logoUrl} businessName={siteSettings.businessName} />
        )}
        {isAdminEntryCheckError && (
          <SiteAvailabilityPage
            mode="offline"
            message="Riprova tra poco o contatta l’amministratore del sito."
            logoUrl={siteSettings.logoUrl}
            businessName={siteSettings.businessName}
            error={adminEntryError}
          />
        )}
        {isSiteSettingsLoading && (
          <p className="site-settings-loading" role="status">Caricamento del sito…</p>
        )}
        {isSiteUnavailable && (
          <SiteAvailabilityPage
            mode={siteSettings.offlineMode ? 'offline' : 'maintenance'}
            message={siteSettings.offlineMode ? siteSettings.offlineMessage : siteSettings.maintenanceMessage}
            logoUrl={siteSettings.logoUrl}
            businessName={siteSettings.businessName}
          />
        )}
        {siteSettingsError && siteSettingsLoaded && !isAdminArea && !isNotFoundPage && !isSiteUnavailable && (
          <p className="site-settings-warning" role="alert">{siteSettingsError}</p>
        )}
        {!isNotFoundPage && !isAdminRouteBlocked && isAdminArea && user?.role === 'admin' && !adminPinRequired && (
          <AdminSectionNavigation
            active={isAdminDashboardPage ? 'dashboard'
              : isAdminPage ? 'inventory'
                : isAdminPurchaseRequestsPage ? 'purchases'
                : isAdminOffersPage ? 'offers'
                  : isAdminRentalsPage ? 'rentals'
                    : isAdminVisitRequestsPage ? 'visits'
                      : isAdminAnalyticsPage ? 'analytics'
                        : isAdminSettingsPage ? 'settings'
                          : isAdminLegalPage ? 'legal'
                            : isAdminSecurityAuditPage ? 'audit'
                              : isAdminAccountsPage ? 'admins'
                                : isAdminLogsPage ? 'logs'
                          : isAdminSecurityPage ? 'security'
                          : 'messages'}
            pendingPurchases={adminPurchaseRequests.filter((request) => request.status === 'pending').length}
            pendingPriceOffers={adminVehicleOffers.filter((offer) => offer.status === 'pending').length}
            pendingRentals={adminRentalRequests.filter((request) => request.status === 'pending').length}
            pendingVisits={adminVisitRequests.filter((request) => request.status === 'pending').length}
            user={user}
            onNavigate={navigateToPath}
            onLogout={handleLogout}
            timeZone={businessTimeZone}
          />
        )}
        {!isNotFoundPage && !isAdminRouteBlocked && !isSiteUnavailable && !isSiteSettingsLoading && !isAdminEntryPending && !isAdminEntryCheckError && <div className={isAdminArea && user?.role === 'admin' && !adminPinRequired ? 'admin-main-content' : 'route-content'}>
        {isLegalPage ? (
          <LegalDocumentPage
            document={{ ...legalDocument, content: legalDocumentContent[normalizedPathname.slice(1)] || legalDocument.content }}
            onHome={() => navigateToHome()}
            onNavigate={navigateToPath}
          />
        ) : activeVehicle ? (
          <section className="vehicle-detail section-wrap" aria-labelledby="vehicle-detail-title">
            <div className="vehicle-detail-content-layout">
            <div className="vehicle-detail-heading">
              <div>
                <p className="eyebrow vehicle-detail-status"><span />{activeVehicle.type === 'rent' ? 'DISPONIBILE A NOLEGGIO' : 'DISPONIBILE PER L’ACQUISTO'}</p>
                <h1 id="vehicle-detail-title">{activeVehicle.make} <em>{activeVehicle.model}</em></h1>
                <p className="vehicle-detail-subtitle">{activeVehicle.year} <span /> {activeVehicle.bodyType} <span /> {activeVehicle.color}</p>
                {activeVehicle.label && <span className="vehicle-detail-label">{activeVehicle.label}</span>}
              </div>
              <div className={`vehicle-detail-price-block${detailDiscountPrice !== null ? ' has-discount' : ' is-regular-price'}${detailHasDiscountCountdown ? ' has-countdown' : ''}`}>
                <span>{activeVehicle.type === 'rent' ? 'TARIFFA GIORNALIERA' : detailDiscountPrice !== null ? 'PREZZO SCONTATO' : 'PREZZO'}</span>
                <VehicleDiscountPrice
                  vehicle={activeVehicle}
                  priceClassName="vehicle-detail-price"
                  dailySuffixSmall
                  vatLabel={activeVehicle.type === 'buy' ? getVehicleVatLabel(activeVehicle) : null}
                  onExpire={() => setDiscountExpiryVersion((version) => version + 1)}
                />
              </div>
            </div>
            <section className="vehicle-basic-info" aria-label="Dati principali dell’auto">
              <div className="vehicle-detail-highlights" aria-label="Informazioni principali">
              <div><SiteIcon name="calendar" /><span><small>ANNO</small><strong>{activeVehicle.year}</strong></span></div>
              <div><SiteIcon name="odometer" /><span><small>CHILOMETRAGGIO</small><strong>{kilometer.format(activeVehicle.mileageKm)} km</strong></span></div>
              <div><SiteIcon name="fuel" /><span><small>ALIMENTAZIONE</small><strong>{activeVehicle.fuel}</strong></span></div>
              <div><SiteIcon name="transmission" /><span><small>CAMBIO</small><strong>{activeVehicle.transmission}</strong></span></div>
              </div>
            </section>
            <div className="vehicle-detail-layout">
              <div className="vehicle-detail-gallery-column">
                <div
                  className="vehicle-detail-image"
                  ref={detailImageFrameRef}
                  onTouchStart={(event) => {
                    setMagnifierVisible(false);
                    if (event.target instanceof Element && event.target.closest('button')) {
                      detailTouchStartXRef.current = null;
                      return;
                    }
                    detailTouchStartXRef.current = event.changedTouches[0]?.clientX ?? null;
                  }}
                  onTouchEnd={(event) => {
                    const touchStartX = detailTouchStartXRef.current;
                    const touchEndX = event.changedTouches[0]?.clientX;
                    detailTouchStartXRef.current = null;
                    if (detailImages.length < 2 || touchStartX === null || touchEndX === undefined) return;
                    const swipeDistance = touchEndX - touchStartX;
                    if (Math.abs(swipeDistance) < 40) return;
                    changeDetailPhoto(swipeDistance < 0 ? 'next' : 'previous');
                  }}
                  onTouchCancel={() => { detailTouchStartXRef.current = null; }}
                  onPointerMove={(event) => {
                    if (event.pointerType === 'touch') return;
                    if (event.target instanceof Element && event.target.closest('button')) {
                      setMagnifierVisible(false);
                      return;
                    }
                    const frame = event.currentTarget;
                    const lens = magnifierLensRef.current;
                    const lensImage = lens?.firstElementChild;
                    const bounds = frame.getBoundingClientRect();
                    if (!lens || !lensImage || !bounds.width || !bounds.height) return;

                    const x = Math.min(bounds.width, Math.max(0, event.clientX - bounds.left));
                    const y = Math.min(bounds.height, Math.max(0, event.clientY - bounds.top));
                    const radius = lens.offsetWidth / 2;
                    lens.style.left = `${x}px`;
                    lens.style.top = `${y}px`;
                    lensImage.style.width = `${bounds.width}px`;
                    lensImage.style.height = `${bounds.height}px`;
                    lensImage.style.left = `${radius - x}px`;
                    lensImage.style.top = `${radius - y}px`;
                    lensImage.style.transformOrigin = `${x}px ${y}px`;
                    setMagnifierVisible(true);
                  }}
                  onPointerLeave={() => setMagnifierVisible(false)}
                >
                  <ProgressiveImage
                    key={`${activeVehicle.id}-${currentDetailImageIndex}`}
                    src={detailImages[currentDetailImageIndex]}
                    alt={`${activeVehicle.year} ${activeVehicle.make} ${activeVehicle.model} - foto ${currentDetailImageIndex + 1}`}
                    className={`vehicle-detail-main-image${detailImageDirection ? ` photo-slide-in-${detailImageDirection}` : ''}`}
                    loading="eager"
                    fetchPriority="high"
                  />
                  <span className="vehicle-type">{activeVehicle.type === 'rent' ? 'NOLEGGIO' : 'IN VENDITA'}</span>
                  {detailImages.length > 1 && (
                    <>
                      <button className="vehicle-photo-nav-button is-previous" type="button" aria-label="Mostra la foto precedente" onClick={() => changeDetailPhoto('previous')}>
                        <SiteIcon name="chevronLeft" />
                      </button>
                      <button className="vehicle-photo-nav-button is-next" type="button" aria-label="Mostra la foto successiva" onClick={() => changeDetailPhoto('next')}>
                        <SiteIcon name="chevronRight" />
                      </button>
                    </>
                  )}
                  <div className="vehicle-engagement" aria-label={`Statistiche ${activeVehicle.make} ${activeVehicle.model}`}>
                    <span><SiteIcon name="eye" /> {kilometer.format(activeVehicle.viewCount || 0)} visualizzazioni</span>
                    {activeVehicle.type === 'buy' && (
                      <span><SiteIcon name="people" /> {kilometer.format(publicVehicleMetricsById.get(activeVehicle.id)?.purchaseRequests || 0)} richieste</span>
                    )}
                  </div>
                  {detailImages[currentDetailImageIndex] && (
                    <div
                      className={`vehicle-photo-magnifier${magnifierVisible ? ' is-visible' : ''}`}
                      ref={magnifierLensRef}
                      aria-hidden="true"
                    >
                      <img src={detailImages[currentDetailImageIndex]} alt="" draggable="false" />
                    </div>
                  )}
                </div>
                <VehiclePhotoIndicators
                  imageCount={detailImages.length}
                  currentIndex={currentDetailImageIndex}
                  label={`Foto di ${activeVehicle.make} ${activeVehicle.model}`}
                  onSelect={selectDetailPhoto}
                  className="is-below-photo"
                />
                {detailImages.length > 1 && (
                  <div className="vehicle-gallery" ref={detailGalleryRef} aria-label="Foto dell’auto">
                    {detailImages.map((image, index) => (
                      <button
                        key={`${image}-${index}`}
                        className={detailImageIndex === index ? 'vehicle-gallery-thumb is-active' : 'vehicle-gallery-thumb'}
                        type="button"
                        aria-label={`Mostra foto ${index + 1} di ${detailImages.length}`}
                        aria-pressed={detailImageIndex === index}
                        onClick={() => selectDetailPhoto(index)}
                      >
                        <ProgressiveImage src={image} alt="" className="vehicle-gallery-thumb-image" />
                      </button>
                    ))}
                  </div>
                )}
                <VehicleDownloadButton vehicleId={activeVehicle.id} />
              </div>
              <aside className="vehicle-contact-panel" aria-label="Richieste e contatti">
                <div className="vehicle-contact-heading">
                  <p className="eyebrow"><SiteIcon name="info" /> INFORMAZIONI E CONTATTI</p>
                  <h2>Parliamone <em>senza impegno.</em></h2>
                  <p className="vehicle-contact-intro">
                    Richiedi informazioni, prenota una visita o contattaci direttamente: scegli tu come proseguire.
                  </p>
                </div>
                <div className="vehicle-contact-actions">
                {activeVehicle.type === 'buy' ? (
                  <div className="purchase-request-form">
                    <div className="vehicle-action-heading">
                      <p className="eyebrow"><SiteIcon name="car" /> RICHIESTA DI ACQUISTO</p>
                      <h3>Ti interessa questa auto?</h3>
                      <p>Non serve un account: lasciaci i tuoi recapiti e ti ricontatteremo per informazioni e prossimi passi.</p>
                    </div>
                    {myPurchaseRequests.some((request) => request.vehicle.id === activeVehicle.id) && <p className="form-success" role="status" tabIndex="-1">Hai già inviato una richiesta per questa auto. Puoi seguirla in Messaggi e acquisti.</p>}
                    <button
                      ref={purchaseRequestTriggerRef}
                      className="button button-accent detail-primary-action purchase-request-open"
                      type="button"
                      aria-haspopup="dialog"
                      aria-expanded={purchaseRequestModalOpen}
                      aria-controls="purchase-request-modal"
                      disabled={
                        purchaseRequestBusy === activeVehicle.id
                        || myPurchaseRequests.some((request) => request.vehicle.id === activeVehicle.id)
                        || (purchaseRequestStatus.vehicleId === activeVehicle.id && Boolean(purchaseRequestStatus.message))
                      }
                      onClick={openPurchaseRequestModal}
                    >
                      <SiteIcon name="car" />
                      <span>{purchaseRequestBusy === activeVehicle.id ? 'Invio richiesta…' : (myPurchaseRequests.some((request) => request.vehicle.id === activeVehicle.id) || (purchaseRequestStatus.vehicleId === activeVehicle.id && purchaseRequestStatus.message)) ? 'Richiesta inviata' : 'Richiedi l’acquisto'}</span>
                      <SiteIcon className="vehicle-action-chevron" name="chevronRight" />
                    </button>
                    {purchaseRequestStatus.vehicleId === activeVehicle.id && purchaseRequestStatus.message && (
                      <div className="purchase-request-success" role="status" tabIndex="-1">
                        <span>{purchaseRequestStatus.message}</span>
                        {user?.role === 'user' && <button type="button" className="purchase-request-view-requests" onClick={() => navigateToPath('/account')}>Vedi le tue richieste <SiteIcon name="chevronRight" /></button>}
                      </div>
                    )}
                    <div className="vehicle-price-offer-panel">
                      {myVehicleOffers.some((offer) => offer.vehicle.id === activeVehicle.id && ['pending', 'countered'].includes(offer.status)) ? (
                        <p className="vehicle-price-offer-pending" role="status">
                          Hai già una trattativa aperta per questa auto. <button type="button" onClick={() => navigateToPath('/account')}>Seguila nel tuo account</button>
                        </p>
                      ) : !user && priceOfferStatus.vehicleId === activeVehicle.id && priceOfferStatus.message ? (
                        <p className="vehicle-price-offer-pending" role="status">{priceOfferStatus.message}</p>
                      ) : (
                        <>
                          <button
                            className="vehicle-price-offer-toggle"
                            type="button"
                            aria-expanded={priceOfferOpen}
                            onClick={() => {
                              setPriceOfferOpen((open) => !open);
                              setPriceOfferStatus({ vehicleId: activeVehicle.id, error: '', message: '' });
                            }}
                          >
                            <span><strong>Hai un prezzo in mente?</strong><small>Invia una proposta, anche senza account</small></span>
                            <span aria-hidden="true">{priceOfferOpen ? '−' : '+'}</span>
                          </button>
                          {priceOfferOpen && (
                            <form className="vehicle-price-offer-form" onSubmit={(event) => submitVehiclePriceOffer(event, activeVehicle)}>
                              <label>
                                La tua proposta
                                <span className="vehicle-price-offer-input">
                                  <span aria-hidden="true">€</span>
                                  <input
                                    name="amount"
                                    type="number"
                                    min="0.01"
                                    max={Math.max(0.01, getVehicleCurrentPrice(activeVehicle) - 0.01).toFixed(2)}
                                    step="0.01"
                                    value={priceOfferAmount}
                                    onChange={(event) => setPriceOfferAmount(event.target.value)}
                                    placeholder="Es. 12.500"
                                    required
                                  />
                                </span>
                                <small>Prezzo esposto: {euro.format(getVehicleCurrentPrice(activeVehicle))}</small>
                              </label>
                              <label>
                                Nome e cognome
                                <input
                                  name="name"
                                  type="text"
                                  autoComplete="name"
                                  minLength="2"
                                  maxLength="80"
                                  defaultValue={user?.role === 'user' ? user.name : ''}
                                  placeholder="Il tuo nome e cognome"
                                  required
                                />
                              </label>
                              <label>
                                Email
                                <input
                                  name="email"
                                  type="email"
                                  autoComplete="email"
                                  maxLength="254"
                                  defaultValue={user?.role === 'user' ? user.email : ''}
                                  placeholder="nome@esempio.it"
                                  required
                                />
                              </label>
                              <label>
                                Telefono
                                <input
                                  name="phone"
                                  type="tel"
                                  autoComplete="tel"
                                  minLength="6"
                                  maxLength="30"
                                  placeholder="+39 333 123 4567"
                                  required
                                />
                              </label>
                              <label className="request-terms-consent">
                                <input name="termsAccepted" type="checkbox" required />
                                <span>Accetto i termini e le condizioni.</span>
                              </label>
                              <label>
                                <span className="vehicle-price-offer-label-text">Messaggio <span className="price-offer-optional">facoltativo</span></span>
                                <textarea
                                  value={priceOfferMessage}
                                  onChange={(event) => setPriceOfferMessage(event.target.value)}
                                  maxLength="500"
                                  rows="3"
                                  placeholder="Aggiungi una nota per il concessionario…"
                                />
                              </label>
                              {priceOfferStatus.vehicleId === activeVehicle.id && priceOfferStatus.error && <p className="form-error" role="alert">{priceOfferStatus.error}</p>}
                              <button className="button button-outline vehicle-price-offer-submit" type="submit" disabled={priceOfferBusy === activeVehicle.id}>
                                {priceOfferBusy === activeVehicle.id ? 'Invio proposta…' : 'Invia proposta'}
                              </button>
                            </form>
                          )}
                        </>
                      )}
                      {priceOfferStatus.vehicleId === activeVehicle.id && priceOfferStatus.message && user?.role === 'user' && <p className="form-success" role="status">{priceOfferStatus.message} <button type="button" onClick={() => navigateToPath('/account')}>Apri account</button></p>}
                    </div>
                  </div>
                ) : (
                  <form className="rental-request-form dealer-visit-request-form" key={activeVehicle.id} onSubmit={(event) => submitRentalRequest(event, activeVehicle)}>
                    <p className="rental-request-intro">{!rentalDates.startDate ? '1 · Scegli il giorno di ritiro' : !rentalDates.endDate ? '2 · Scegli il giorno di riconsegna' : '3 · Lascia i tuoi contatti'}</p>
                    {rentalAvailabilityError ? (
                      <div className="rental-calendar-error" role="alert">
                        <span>{rentalAvailabilityError}</span>
                        <button className="button button-outline button-small" type="button" onClick={() => setRentalAvailabilityReloadKey((key) => key + 1)}>Riprova</button>
                      </div>
                    ) : (
                      <div className="rental-calendar-shell" aria-busy={rentalAvailabilityLoading}>
                        <Suspense fallback={<div className="calendar-loading" role="status">Caricamento calendario…</div>}>
                          <RentalDatePicker
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
                            weekStartsOn={1}
                            showOutsideDays
                            footer={rentalAvailabilityLoading ? 'Verifica disponibilità…' : 'I giorni rossi non sono disponibili · seleziona ritiro e riconsegna'}
                            aria-label="Seleziona il periodo di noleggio"
                            lang="it-IT"
                          />
                        </Suspense>
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
                        <label><span className="request-field-label"><SiteIcon name="people" /> Nome e cognome</span>
                          <input name="name" autoComplete="name" minLength="2" maxLength="80" defaultValue={user?.name || ''} placeholder="Mario Rossi" required />
                        </label>
                        <label><span className="request-field-label"><SiteIcon name="mail" /> Email</span>
                          <input name="email" type="email" autoComplete="email" maxLength="254" defaultValue={user?.email || ''} placeholder="nome@esempio.it" required />
                        </label>
                        <label><span className="request-field-label"><SiteIcon name="phone" /> Telefono</span>
                          <input name="phone" type="tel" autoComplete="tel" minLength="6" maxLength="30" placeholder="+39 333 123 4567" required />
                        </label>
                        <label><span className="request-field-label"><SiteIcon name="info" /> Note per il team <span className="rental-optional-label">facoltative</span></span>
                          <textarea name="message" rows="2" maxLength="1000" placeholder="Orario di ritiro o altre richieste…" />
                        </label>
                        <button className="button button-accent detail-primary-action" type="submit" disabled={rentalRequestBusy === activeVehicle.id || rentalAvailabilityLoading || Boolean(rentalAvailabilityError)}>
                          <SiteIcon name="send" />
                          <span>{rentalRequestBusy === activeVehicle.id ? 'Invio richiesta…' : 'Richiedi disponibilità'}</span>
                          <SiteIcon className="vehicle-action-chevron" name="chevronRight" />
                        </button>
                        <p className="rental-request-disclaimer">La richiesta non blocca l’auto. Il team confermerà disponibilità, tariffa e condizioni.</p>
                      </div>
                    )}
                    {rentalRequestStatus.vehicleId === activeVehicle.id && rentalRequestStatus.error && <p className="form-error" role="alert">{rentalRequestStatus.error}</p>}
                    {rentalRequestStatus.vehicleId === activeVehicle.id && rentalRequestStatus.message && <p className="form-success" role="status">{rentalRequestStatus.message}</p>}
                  </form>
                )}
                <section className="dealer-visit-panel" aria-labelledby="dealer-visit-title">
                  <div className="dealer-visit-heading">
                    <p className="eyebrow"><SiteIcon name="calendar" /> APPUNTAMENTO IN CONCESSIONARIA</p>
                    <h3 id="dealer-visit-title">Vieni a vedere l’auto.</h3>
                    <p>Scegli data e orario: ti ricontatteremo per confermare l’appuntamento.</p>
                  </div>
                  <button
                    ref={visitRequestTriggerRef}
                    className="button button-accent detail-primary-action dealer-visit-open"
                    type="button"
                    aria-haspopup="dialog"
                    aria-expanded={visitRequestModalOpen}
                    aria-controls="dealer-visit-modal"
                    onClick={() => setVisitRequestModalOpen(true)}
                  >
                    <SiteIcon name="calendar" />
                    <span>Richiedi una visita</span>
                    <SiteIcon className="vehicle-action-chevron" name="chevronRight" />
                  </button>
                  {visitRequestStatus.vehicleId === activeVehicle.id && visitRequestStatus.message && (
                    <p className={visitRequestStatus.warning ? 'dealer-visit-notice is-warning' : 'form-success'} role="status">
                      {visitRequestStatus.message}
                    </p>
                  )}
                </section>
                <section className="vehicle-save-panel" aria-label="Salva auto per dopo">
                  <div className="vehicle-action-heading">
                    <p className="eyebrow"><SiteIcon name="check" /> LA TUA SELEZIONE</p>
                    <h3>Vuoi ritrovarla più tardi?</h3>
                    <p>Aggiungila alla tua selezione e riprendi da qui quando vuoi.</p>
                  </div>
                  <button
                    className={cart.includes(activeVehicle.id) ? 'button button-outline detail-secondary-action is-added' : 'button button-outline detail-secondary-action'}
                    type="button"
                    onClick={() => addToCart(activeVehicle)}
                  >
                    <CartIcon className="vehicle-contact-save-icon" />
                    <span>{!user ? 'Salva per dopo' : cart.includes(activeVehicle.id) ? 'Salvata per dopo' : 'Salva per dopo'}</span>
                    {cart.includes(activeVehicle.id) && <SiteIcon className="vehicle-contact-save-check" name="check" />}
                  </button>
                </section>
                </div>
                <div className="vehicle-direct-contact">
                  <span><SiteIcon name="phone" /> Vuoi un contatto diretto?</span>
                  {gerardoPhoneHref && <a href={gerardoPhoneHref}><SiteIcon name="phone" /> Chiama {gerardoContact.name}</a>}
                  {gerardoWhatsappNumber && <a href={`https://wa.me/${gerardoWhatsappNumber}?text=${encodeURIComponent(`Ciao, vorrei informazioni sulla ${activeVehicle.make} ${activeVehicle.model} ${activeVehicle.year}.`)}`} target="_blank" rel="noopener noreferrer"><SiteIcon name="whatsapp" /> Scrivi su WhatsApp</a>}
                </div>
                <p className="detail-disclaimer"><SiteIcon name="info" /> Prezzo, disponibilità e condizioni saranno confermati dal team prima di procedere.</p>
              </aside>
            </div>
            <section className="vehicle-detail-panel">
                <div className="vehicle-panel-heading">
                  {detailImages[0] && (
                    <img
                      className="vehicle-panel-hero-image"
                      src={detailImages[0]}
                      alt=""
                      aria-hidden="true"
                      loading="lazy"
                      decoding="async"
                    />
                  )}
                  <div className="vehicle-panel-heading-copy">
                    <span className="eyebrow">LA SCHEDA</span>
                    <h2>Dati tecnici e dettagli <span>dell’<em>auto</em></span></h2>
                    <p className="vehicle-panel-intro">Esplora le informazioni dell’auto per categoria o consulta la scheda completa.</p>
                  </div>
                </div>
                <nav className="vehicle-spec-index" aria-label="Indice della scheda auto">
                  <span className="vehicle-spec-index-label">Indice rapido</span>
                  <a href="#vehicle-spec-group-0"><SiteIcon name="car" /><span className="vehicle-spec-index-link-label">Caratteristiche</span></a>
                  <a href="#vehicle-spec-group-1"><SiteIcon name="engine" /><span className="vehicle-spec-index-link-label">Motore</span></a>
                  <a href="#vehicle-spec-group-2"><SiteIcon name="speed" /><span className="vehicle-spec-index-link-label">Prestazioni</span></a>
                  <a href="#vehicle-spec-group-3"><SiteIcon name="consumption" /><span className="vehicle-spec-index-link-label">Consumi</span></a>
                  <a href="#vehicle-spec-group-4"><SiteIcon name="condition" /><span className="vehicle-spec-index-link-label">Condizioni e manutenzione</span></a>
                  <a href="#vehicle-spec-group-5"><SiteIcon name={activeVehicle.type === 'buy' ? 'payment' : 'sell'} /><span className="vehicle-spec-index-link-label">{activeVehicle.type === 'buy' ? 'Agevolazioni' : 'Altre informazioni'}</span></a>
                  <a href="#vehicle-detail-features"><SiteIcon name="check" /><span className="vehicle-spec-index-link-label">Dotazioni</span></a>
                </nav>
                <div className="vehicle-description-block">
                  <div className="vehicle-description-icon" aria-hidden="true"><SiteIcon name="info" /></div>
                  <div className="vehicle-description-copy">
                    <h3>Descrizione</h3>
                    <p className="vehicle-detail-description">{activeVehicle.description}</p>
                  </div>
                </div>
                <div className="vehicle-spec-section-heading">
                  <span aria-hidden="true" />
                  <h3>Caratteristiche <em>tecniche</em></h3>
                </div>
                <div className="vehicle-spec-groups">
                  {[
                    {
                      icon: 'car',
                      title: 'Caratteristiche del veicolo',
                      description: 'Tipo di carrozzeria, configurazione e capacità del veicolo.',
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
                      description: 'Motorizzazione, alimentazione, cambio e tipo di trazione.',
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
                      description: 'Valori dichiarati per coppia, accelerazione e velocità massima.',
                      specs: [
                        { icon: 'torque', label: 'Coppia', value: activeVehicle.torqueNm != null ? `${kilometer.format(activeVehicle.torqueNm)} Nm` : '' },
                        { icon: 'acceleration', label: 'Accelerazione 0–100 km/h', value: activeVehicle.accelerationSeconds != null ? `${vehiclePowerNumber.format(activeVehicle.accelerationSeconds)} s` : '' },
                        { icon: 'speed', label: 'Velocità massima', value: activeVehicle.topSpeedKmh != null ? `${kilometer.format(activeVehicle.topSpeedKmh)} km/h` : '' },
                      ],
                    },
                    {
                      icon: 'consumption',
                      title: 'Consumi ed emissioni',
                      description: 'Consumi dichiarati e informazioni relative alle emissioni.',
                      specs: [
                        { icon: 'consumption', label: 'Consumo combinato', value: activeVehicle.consumptionCombined != null ? `${vehiclePowerNumber.format(activeVehicle.consumptionCombined)} ${activeVehicle.consumptionUnit || 'l/100 km'}` : '' },
                        { icon: 'emissions', label: 'Classe emissioni', value: activeVehicle.emissionsClass },
                        { icon: 'co2', label: 'Emissioni CO₂', value: activeVehicle.co2Emissions != null ? `${activeVehicle.co2Emissions} g/km` : '' },
                      ],
                    },
                    {
                      icon: 'condition',
                      title: 'Condizioni, manutenzione e documenti',
                      description: 'Stato del veicolo, copertura e riferimenti di manutenzione e documentazione.',
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
                      description: 'Dettagli sulle opzioni di acquisto e sulle informazioni commerciali.',
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
                      description: 'Informazioni aggiuntive associate a questa vettura.',
                      specs: [{ icon: 'sell', label: 'Etichetta', value: activeVehicle.label }],
                    }]),
                  ].map((group, index) => (
                    <section className="vehicle-spec-group" id={`vehicle-spec-group-${index}`} key={group.title} aria-label={group.title}>
                      <h4>
                        <SiteIcon name={group.icon} />
                        <span className="vehicle-spec-group-title">{group.title}</span>
                        <span className="vehicle-spec-count">{group.specs.length} {group.specs.length === 1 ? 'voce' : 'voci'}</span>
                      </h4>
                      <p className="vehicle-spec-group-description">{group.description}</p>
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
                  <p className="vehicle-section-caption vehicle-maintenance-intro">Interventi e riferimenti di manutenzione disponibili per questo veicolo.</p>
                  <p className="vehicle-maintenance-value">{activeVehicle.maintenanceHistory || <span className="is-unspecified">Non specificato</span>}</p>
                </div>
                <section className="vehicle-detail-features" id="vehicle-detail-features" aria-labelledby="vehicle-features-title">
                  <h2 id="vehicle-features-title"><SiteIcon name="check" /> Dotazioni</h2>
                  <p className="vehicle-section-caption vehicle-features-intro">Equipaggiamenti e accessori riportati nella scheda dell’auto.</p>
                  {(activeVehicle.features || []).length > 0 ? (
                    <ul>
                      {activeVehicle.features.map((feature) => (
                        <li key={feature}><FeatureIcon feature={feature} /><span>{feature}</span></li>
                      ))}
                    </ul>
                  ) : <p className="is-unspecified">Non specificato</p>}
                </section>
            </section>
            </div>
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
        ) : isAdminDashboardPage ? (
          user?.role === 'admin' ? (
            <AdminDashboard
              vehicles={vehicles}
              sales={adminSales}
              purchaseRequests={adminPurchaseRequests}
              priceOffers={adminVehicleOffers}
              rentalRequests={adminRentalRequests}
              visitRequests={adminVisitRequests}
              sellSubmissions={sellSubmissions}
              salesLoaded={adminSalesLoaded}
              requestsLoading={adminVehicleOffersLoading || adminRentalRequestsLoading || adminVisitRequestsLoading}
              dataErrors={[
                adminSalesError && `vendite: ${adminSalesError}`,
                adminPurchaseRequestsError && `richieste acquisto: ${adminPurchaseRequestsError}`,
                adminVehicleOffersError && `proposte prezzo: ${adminVehicleOffersError}`,
                adminRentalRequestsError && `noleggi: ${adminRentalRequestsError}`,
                adminVisitRequestsError && `visite: ${adminVisitRequestsError}`,
                sellSubmissionError && `proposte di vendita: ${sellSubmissionError}`,
              ].filter(Boolean)}
              onNavigate={navigateToPath}
            />
          ) : (
            <section className="admin-page section-wrap" aria-labelledby="admin-access-title">
              <AdminAccessPanel
                area="AREA AMMINISTRATORE"
                title={<>Accedi alla <em>dashboard.</em></>}
                description="Accedi con un account amministratore per consultare i dati operativi e gestire le attività della concessionaria."
                accountNote={user ? 'L’account attualmente collegato non dispone dei permessi di amministratore.' : ''}
                onLogin={() => { setAuthMode('login'); setAuthError(''); }}
                onBack={() => navigateToHome('inventory')}
              />
            </section>
          )
        ) : isAdminPage ? (
          <MotionConfig reducedMotion="user">
          <motion.section
            className="admin-page admin-inventory-page section-wrap"
            aria-labelledby={user?.role === 'admin' ? 'admin-title' : 'admin-access-title'}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
          >
            {user?.role === 'admin' ? (
              <>
                <div className="admin-heading admin-inventory-heading">
                  <div>
                    <p className="eyebrow"><CarFront size={15} strokeWidth={1.9} aria-hidden="true" /> INVENTARIO</p>
                    <h1 id="admin-title">Gestione <em>veicoli.</em></h1>
                    <p>Aggiungi e aggiorna le auto disponibili per la vendita o il noleggio.</p>
                  </div>
                </div>
                <div className="admin-layout">
                  <motion.form
                    ref={adminVehicleFormRef}
                    className={`admin-vehicle-form${adminVehicleFormSubmitted ? ' was-submitted' : ''}`}
                    key={editingVehicle?.id || 'new-vehicle'}
                    onSubmit={handleAdminVehicleSubmit}
                    onInvalid={() => setAdminVehicleFormSubmitted(true)}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.04, ease: 'easeOut' }}
                  >
                    <div className="admin-form-heading">
                      <h2><span className="admin-inventory-heading-icon"><CarFront size={18} strokeWidth={1.8} aria-hidden="true" /></span><span>{editingVehicle ? `Modifica ${editingVehicle.make} ${editingVehicle.model}` : 'Aggiungi una nuova auto'}</span></h2>
                      {editingVehicle && <button className="clear-cart" type="button" onClick={() => { setEditingVehicle(null); setAdminVehicleDiscountPrice(''); setAdminDiscountEndMode('scheduled'); setAdminVehicleDiscountEndsAt(''); setAdminImageFiles([]); setMainImageIndex(-1); }}>Annulla modifica</button>}
                    </div>
                    <div className="admin-form-section-heading is-required">
                      <span className="admin-form-section-mark">*</span>
                      <div><strong>Informazioni obbligatorie</strong><small>Compila i campi obbligatori per pubblicare l’auto; quelli indicati come facoltativi possono essere lasciati vuoti.</small></div>
                    </div>
                    <div className="admin-form-grid">
                      <label><span className="admin-spec-label"><SiteIcon name="car" /> Marca</span><input name="make" defaultValue={editingVehicle?.make || ''} maxLength="60" placeholder="Es. Alfa Romeo" required /></label>
                      <label><span className="admin-spec-label"><SiteIcon name="car" /> Modello</span><input name="model" defaultValue={editingVehicle?.model || ''} maxLength="100" placeholder="Es. Giulietta" required /></label>
                      <label><span className="admin-spec-label"><SiteIcon name="calendar" /> Anno</span><input name="year" type="number" defaultValue={editingVehicle?.year ?? ''} min="1950" max={new Date().getFullYear() + 1} placeholder="Es. 2018" required /></label>
                      <label><span className="admin-spec-label"><SiteIcon name="key" /> Vendita o noleggio</span><SelectField name="type" value={adminVehicleType} onChange={(event) => { setAdminVehicleType(event.target.value); if (event.target.value === 'rent') { setAdminVehicleDiscountPrice(''); setAdminDiscountEndMode('permanent'); setAdminVehicleDiscountEndsAt(''); } else setAdminDiscountEndMode('scheduled'); }}><option value="buy">In vendita</option><option value="rent">A noleggio</option></SelectField></label>
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
                      {adminVehicleType === 'buy' && (
                        <label className="admin-price-field">
                          <span className="admin-spec-label"><SiteIcon name="sell" /> Prezzo scontato (€) · facoltativo</span>
                          <input name="discountPrice" type="number" value={adminVehicleDiscountPrice} onChange={(event) => setAdminVehicleDiscountPrice(event.target.value)} min="1" max={adminVehiclePrice ? Math.max(0, Number(adminVehiclePrice) - 1) : 100000000} step="1" placeholder="Es. 11900" />
                          {adminVehicleDiscountPrice && (
                            <>
                              <small>Deve essere inferiore al prezzo originale, che resta invariato.</small>
                              <span className="admin-discount-expiration-label">Durata dello sconto</span>
                              <SelectField value={adminDiscountEndMode} onChange={(event) => setAdminDiscountEndMode(event.target.value)} ariaLabel="Durata dello sconto">
                                <option value="permanent">Sconto permanente</option>
                                <option value="scheduled">Sconto con scadenza</option>
                              </SelectField>
                              {adminDiscountEndMode === 'permanent' && <small>Lo sconto resta attivo senza scadenza e non mostra un countdown.</small>}
                              {adminDiscountEndMode === 'scheduled' && (
                                <>
                                  <input
                                    name="discountEndsAt"
                                    type="text"
                                    value={adminVehicleDiscountEndsAt}
                                    onChange={(event) => setAdminVehicleDiscountEndsAt(event.target.value)}
                                    placeholder="gg/mm/aaaa"
                                    inputMode="numeric"
                                    maxLength={10}
                                    aria-label="Data di scadenza dello sconto"
                                    required
                                  />
                                  <small>Inserisci la data nel formato gg/mm/aaaa. Lo sconto resta attivo fino alle 23:59:59 di quel giorno, ora locale.</small>
                                </>
                              )}
                            </>
                          )}
                        </label>
                      )}
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
                      <span className="admin-photo-label"><ImagePlus size={16} strokeWidth={1.8} aria-hidden="true" /> Foto dell’auto <span className="required-marker" aria-hidden="true">*</span></span>
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
                        <ImagePlus size={15} strokeWidth={1.8} aria-hidden="true" /> Aggiungi foto ({existingAdminImages.length + adminImageFiles.length}/20)
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
                    {adminMessage && <p className="admin-vehicle-success" role="status"><SiteIcon name="check" /><span>{adminMessage}</span></p>}
                    <button className="button button-accent header-glossy-accent admin-vehicle-submit" type="submit" disabled={adminBusy}>
                      {editingVehicle ? <Pencil size={19} strokeWidth={1.8} aria-hidden="true" /> : <Plus size={20} strokeWidth={1.9} aria-hidden="true" />}
                      <span>{adminBusy ? 'Salvataggio…' : editingVehicle ? 'Salva modifiche' : 'Aggiungi auto'}</span>
                    </button>
                  </motion.form>
                  <motion.section
                    className="admin-inventory"
                    aria-labelledby="admin-inventory-title"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.1, ease: 'easeOut' }}
                  >
                    <div className="admin-inventory-panel-heading">
                      <h2 id="admin-inventory-title"><span className="admin-inventory-heading-icon"><ListFilter size={17} strokeWidth={1.8} aria-hidden="true" /></span><span>Auto in inventario <small>{adminInventoryCounts.total}</small></span></h2>
                      <span className="admin-inventory-results-count">{visibleAdminVehicles.length} di {adminInventoryCounts.total}</span>
                    </div>
                    <p className="admin-metrics-note">Ogni apertura di una scheda auto registra una visualizzazione. Le richieste contano gli account cliente che hanno inviato una richiesta.</p>
                    <div className="admin-inventory-overview-metrics" role="group" aria-label="Filtra veicoli per tipologia">
                      {[
                        { key: 'all', label: 'Tutte le auto', count: adminInventoryCounts.total, Icon: CarFront },
                        { key: 'buy', label: 'In vendita', count: adminInventoryCounts.buy, Icon: BadgeEuro },
                        { key: 'rent', label: 'A noleggio', count: adminInventoryCounts.rent, Icon: CalendarDays },
                        { key: 'discounted', label: 'In sconto', count: adminInventoryCounts.discounted, Icon: Tag },
                      ].map(({ key, label, count, Icon }) => (
                        <button
                          className={adminInventoryFilter === key ? 'is-selected' : ''}
                          type="button"
                          key={key}
                          aria-pressed={adminInventoryFilter === key}
                          onClick={() => setAdminInventoryFilter(key)}
                        >
                          <span className="admin-overview-metric-icon"><Icon size={17} strokeWidth={1.8} aria-hidden="true" /></span>
                          <span><small>{label}</small><strong>{count}</strong></span>
                        </button>
                      ))}
                    </div>
                    <div className="admin-inventory-toolbar" aria-label="Ricerca e ordinamento inventario">
                      <label className="admin-inventory-search">
                        <span><SiteIcon name="search" /> Cerca in inventario</span>
                        <input
                          type="search"
                          value={adminSearchTerm}
                          onChange={(event) => setAdminSearchTerm(event.target.value)}
                          placeholder="Marca, modello, anno, colore"
                          autoComplete="off"
                        />
                      </label>
                      <label className="admin-inventory-sort">
                        <span><SiteIcon name="sort" /> Ordina per</span>
                        <SelectField value={adminInventorySort} onChange={(event) => setAdminInventorySort(event.target.value)}>
                          <option value="default">Ordine predefinito</option>
                          <option value="price-low">Prezzo crescente</option>
                          <option value="price-high">Prezzo decrescente</option>
                          <option value="year-new">Anno più recente</option>
                          <option value="make">Marca A–Z</option>
                        </SelectField>
                      </label>
                      <span className="admin-inventory-filter-results" role="status">
                        {visibleAdminVehicles.length} {visibleAdminVehicles.length === 1 ? 'veicolo' : 'veicoli'}
                      </span>
                      <div className="admin-inventory-toolbar-actions">
                        <button
                          className="admin-inventory-reset"
                          type="button"
                          disabled={!hasAdminInventoryFilters}
                          onClick={() => {
                            setAdminSearchTerm('');
                            setAdminInventoryFilter('all');
                            setAdminInventorySort('default');
                          }}
                        >
                          <RefreshCw size={13} aria-hidden="true" /> Azzera
                        </button>
                        <button
                          className="button button-outline button-small admin-inventory-export"
                          type="button"
                          onClick={exportAdminInventory}
                          disabled={inventoryLoading || visibleAdminVehicles.length === 0}
                          aria-label={`Esporta ${visibleAdminVehicles.length} ${visibleAdminVehicles.length === 1 ? 'auto filtrata' : 'auto filtrate'} in CSV`}
                        >
                          <Download size={14} aria-hidden="true" /> Esporta CSV
                        </button>
                        <button
                          className="button button-outline button-small admin-inventory-refresh"
                          type="button"
                          onClick={() => {
                            setInventoryLoading(true);
                            setInventoryReloadKey((key) => key + 1);
                          }}
                          disabled={inventoryLoading}
                        >
                          <RefreshCw size={14} aria-hidden="true" /> {inventoryLoading ? 'Aggiornamento…' : 'Aggiorna'}
                        </button>
                      </div>
                    </div>
                    {inventoryError && <p className="form-error" role="alert">{inventoryError}</p>}
                    {saleAdminMessage && <p className="form-success" role="status">{saleAdminMessage}</p>}
                    {saleAdminError && <p className="form-error" role="alert">{saleAdminError}</p>}
                    {inventoryLoading && vehicles.length === 0 && <p className="admin-submissions-empty" role="status">Caricamento inventario…</p>}
                    {!inventoryLoading && !inventoryError && vehicles.length === 0 && <p className="admin-submissions-empty">L’inventario è vuoto. Aggiungi la prima auto dal modulo.</p>}
                    {!inventoryLoading && !inventoryError && vehicles.length > 0 && visibleAdminVehicles.length === 0 && <p className="admin-submissions-empty">Nessuna auto corrisponde ai filtri selezionati.</p>}
                    {visibleAdminVehicles.map((vehicle, index) => {
                      const vehicleRequestCustomers = adminPurchaseRequests
                        .filter((request) => request.vehicle.id === vehicle.id && request.customer?.id)
                        .map((request) => request.customer);
                      return (
                      <motion.article
                        className="admin-vehicle-row"
                        key={vehicle.id}
                        initial={{ opacity: 0, y: 7 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, delay: Math.min(index * 0.02, 0.18), ease: 'easeOut' }}
                      >
                        <ProgressiveImage className="admin-vehicle-thumbnail" src={vehicle.image || vehicle.images?.[0]} alt="" />
                        <div className="admin-vehicle-info">
                          <strong>{vehicle.make} {vehicle.model}</strong>
                          <small className="admin-vehicle-list-meta">
                            {vehicle.year} · {vehicle.type === 'rent' ? 'Noleggio' : `Vendita · ${getVehicleVatLabel(vehicle)}`} ·{' '}
                            {getVehicleDiscountPrice(vehicle) !== null
                              ? <><del>{euro.format(vehicle.price)}</del> <strong>{euro.format(getVehicleCurrentPrice(vehicle))} · Scontata</strong></>
                              : `${euro.format(vehicle.price)}${vehicle.type === 'rent' ? ' / giorno' : ''}`}
                          </small>
                          {((vehicle.mileageKm != null && vehicle.mileageKm !== '' && Number.isFinite(Number(vehicle.mileageKm))) || vehicle.bodyType || vehicle.fuel || vehicle.transmission) && (
                            <div className="admin-vehicle-specs" aria-label={`Caratteristiche ${vehicle.make} ${vehicle.model}`}>
                              {vehicle.mileageKm != null && vehicle.mileageKm !== '' && Number.isFinite(Number(vehicle.mileageKm)) && <span><SiteIcon name="odometer" />{kilometer.format(Number(vehicle.mileageKm))} km</span>}
                              {vehicle.bodyType && <span><SiteIcon name="car" />{vehicle.bodyType}</span>}
                              {vehicle.fuel && <span><SiteIcon name="fuel" />{vehicle.fuel}</span>}
                              {vehicle.transmission && <span><SiteIcon name="transmission" />{vehicle.transmission}</span>}
                            </div>
                          )}
                          {adminVehicleMetricsById.has(vehicle.id) && (
                            <div className="admin-vehicle-metrics" aria-label={`Statistiche ${vehicle.make} ${vehicle.model}`}>
                              <span><Eye size={14} strokeWidth={1.8} aria-hidden="true" /> {kilometer.format(adminVehicleMetricsById.get(vehicle.id).views)} visualizzazioni</span>
                              {vehicle.type === 'buy' && <span><UsersRound size={14} strokeWidth={1.8} aria-hidden="true" /> {kilometer.format(adminVehicleMetricsById.get(vehicle.id).purchaseRequests)} richieste</span>}
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
                                  <button className="button button-outline button-small" type="button" disabled={adminBusy} onClick={() => { setSaleAdminError(''); setSaleAdminMessage(''); setSoldBuyerId(''); setSoldFinalPrice(String(getVehicleVatMode(vehicle) === 'exclusive' ? getVehicleCurrentPrice(vehicle) * 1.22 : getVehicleCurrentPrice(vehicle))); setMarkingSoldVehicleId(vehicle.id); }}><BadgeEuro size={14} strokeWidth={1.8} aria-hidden="true" /> Segna venduta</button>
                              )
                            )}
                              <button className="button button-outline button-small" type="button" disabled={adminBusy} onClick={() => editAdminVehicle(vehicle)}><Pencil size={13} strokeWidth={1.9} aria-hidden="true" /> Modifica</button>
                              <button className="admin-delete" type="button" aria-label={`Rimuovi ${vehicle.make} ${vehicle.model}`} disabled={adminBusy} onClick={() => deleteAdminVehicle(vehicle)}><Trash2 size={13} strokeWidth={1.9} aria-hidden="true" /> Rimuovi</button>
                          </div>
                        </div>
                      </motion.article>
                      );
                    })}
                  </motion.section>
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
          </motion.section>
          </MotionConfig>
        ) : isAdminMessagesPage ? (
          <AdminMotionSection className="admin-page admin-messages-page section-wrap" labelledBy={user?.role === 'admin' ? 'admin-messages-title' : 'admin-access-title'}>
            {user?.role === 'admin' ? (
              <>
                <div className="admin-heading admin-heading-prominent">
                  <div>
                    <p className="eyebrow">AREA AMMINISTRATORE · POSTA E VENDITE</p>
                    <h1 id="admin-messages-title">Messaggi <em>e trattative.</em></h1>
                    <p>Gestisci le valutazioni, le richieste di acquisto dei clienti e lo storico delle consegne.</p>
                  </div>
                  <div className="admin-heading-actions">
                    <button className="button button-outline" type="button" onClick={() => navigateToPath('/admin/inventory')}>Gestione inventario</button>
                    <button className="button button-outline" type="button" onClick={() => navigateToHome('inventory')}>Torna al sito</button>
                    <AdminReportExportButton reportType="messages" />
                  </div>
                </div>
                <section className="admin-submissions" aria-labelledby="admin-submissions-title">
                  <div className="admin-submissions-heading">
                    <div>
                      <p className="eyebrow">VALUTAZIONI · AUTO DEI CLIENTI</p>
                      <h2 id="admin-submissions-title">Proposte ricevute <span>{sellSubmissions.length}</span></h2>
                    </div>
                  </div>
                  <section className="admin-rental-overview admin-message-overview" role="group" aria-label="Filtra proposte ricevute">
                    <button type="button" aria-pressed={adminSellSubmissionFilter === 'actionable'} onClick={() => setAdminSellSubmissionFilter('actionable')}><span>Da gestire</span><strong>{sellSubmissionCounts.actionable}</strong></button>
                    <button type="button" aria-pressed={adminSellSubmissionFilter === 'accepted'} onClick={() => setAdminSellSubmissionFilter('accepted')}><span>Accettate</span><strong>{sellSubmissionCounts.accepted}</strong></button>
                    <button type="button" aria-pressed={adminSellSubmissionFilter === 'all'} onClick={() => setAdminSellSubmissionFilter('all')}><span>Proposte totali</span><strong>{sellSubmissionCounts.total}</strong></button>
                  </section>
                  {sellSubmissionError && <p className="form-error" role="alert">{sellSubmissionError}</p>}
                  {!sellSubmissionError && sellSubmissions.length === 0 && <p className="admin-submissions-empty">Non ci sono proposte da gestire.</p>}
                  {!sellSubmissionError && sellSubmissions.length > 0 && visibleSellSubmissions.length === 0 && <p className="admin-submissions-empty">Nessuna proposta corrisponde al filtro selezionato.</p>}
                  <div className="admin-submission-list">
                    {visibleSellSubmissions.map((submission) => (
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
                                <span>{message.senderRole === 'admin' ? businessName : submission.name}</span>
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
                  <div className="admin-submissions-heading">
                    <div><p className="eyebrow">ACQUISTI CONFERMATI</p><h2 id="admin-sales-title">Storico vendite <span>{adminSales.length}</span></h2></div>
                    <AdminReportExportButton reportType="sales" />
                  </div>
                  {adminSalesError && <p className="form-error" role="alert">{adminSalesError}</p>}
                  {!adminSalesError && adminSales.length === 0 && <p className="admin-submissions-empty">Non risultano acquisti confermati nello storico vendite.</p>}
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
          </AdminMotionSection>
        ) : isAdminPurchaseRequestsPage ? (
          <AdminMotionSection className="admin-page admin-purchase-requests-page section-wrap" labelledBy={user?.role === 'admin' ? 'admin-purchases-title' : 'admin-access-title'}>
            {user?.role === 'admin' ? (
              <>
                <div className="admin-heading admin-heading-prominent">
                  <div>
                    <p className="eyebrow">AREA AMMINISTRATORE · CLIENTI E VEICOLI</p>
                    <h1 id="admin-purchases-title">Richieste di <em>acquisto.</em></h1>
                    <p>Consulta e gestisci le richieste dei clienti per le auto in vendita.</p>
                  </div>
                  <div className="admin-heading-actions">
                    <button className="button button-outline" type="button" onClick={() => navigateToPath('/admin/offers')}>Proposte prezzo</button>
                  </div>
                </div>
                <AdminPurchaseRequestsWorkspace
                  requests={adminPurchaseRequests}
                  requestError={adminPurchaseRequestsError}
                  requestActionBusy={purchaseRequestActionBusy}
                  requestActionStatus={purchaseRequestActionStatus}
                  onAcceptRequest={acceptPurchaseRequest}
                  globalSearchTerm={adminSearchTerm}
                  timeZone={businessTimeZone}
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
          </AdminMotionSection>
        ) : isAdminOffersPage ? (
          <AdminMotionSection className="admin-page admin-price-offers-page section-wrap" labelledBy={user?.role === 'admin' ? 'admin-price-offers-page-title' : 'admin-access-title'}>
            {user?.role === 'admin' ? (
              <>
                <div className="admin-heading admin-heading-prominent">
                  <div>
                    <p className="eyebrow">AREA AMMINISTRATORE · AUTO IN VENDITA</p>
                    <h1 id="admin-price-offers-page-title">Proposte di <em>prezzo.</em></h1>
                    <p>Una postazione dedicata per valutare le offerte, negoziare con i clienti e seguire lo stato di ogni trattativa.</p>
                  </div>
                  <div className="admin-heading-actions">
                    <button className="button button-outline" type="button" onClick={() => navigateToPath('/admin/purchases')}>Richieste acquisto</button>
                  </div>
                </div>
                <AdminVehiclePriceOffersPanel
                  offers={adminVehicleOffers}
                  loading={adminVehicleOffersLoading}
                  error={adminVehicleOffersError}
                  actionBusy={vehicleOfferActionBusy}
                  actionStatus={vehicleOfferActionStatus}
                  onRespond={respondToVehiclePriceOffer}
                  globalSearchTerm={adminSearchTerm}
                  businessName={businessName}
                  onRefresh={() => {
                    setAdminVehicleOffersLoading(true);
                    setAdminVehicleOfferRefreshKey((current) => current + 1);
                  }}
                />
              </>
            ) : (
              <AdminAccessPanel
                area="PROPOSTE DI PREZZO"
                title={<>Accesso <em>riservato.</em></>}
                description="Accedi con un account amministratore per gestire le proposte di prezzo e le trattative con i clienti."
                accountNote={user ? 'L’account attualmente collegato non dispone dei permessi di amministratore.' : ''}
                onLogin={() => { setAuthMode('login'); setAuthError(''); }}
                onBack={() => navigateToHome('inventory')}
              />
            )}
          </AdminMotionSection>
        ) : isAdminAnalyticsPage ? (
          <AdminMotionSection className="admin-page admin-analytics-page section-wrap" labelledBy={user?.role === 'admin' ? 'admin-analytics-page-title' : 'admin-access-title'}>
            {user?.role === 'admin' ? (
              <>
                <div className="admin-heading admin-heading-prominent">
                  <div>
                    <p className="eyebrow">AREA AMMINISTRATORE · REPORT OPERATIVI</p>
                    <h1 id="admin-analytics-page-title">Statistiche <em>e grafici.</em></h1>
                    <p>Monitora visite, richieste, conversione e andamento delle vendite.</p>
                  </div>
                  <div className="admin-heading-actions">
                    <button className="button button-outline" type="button" onClick={() => navigateToPath('/admin/inventory')}>Inventario</button>
                  </div>
                </div>
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
          </AdminMotionSection>
        ) : isAdminRentalsPage ? (
          <AdminMotionSection className="admin-page admin-rentals-page section-wrap" labelledBy={user?.role === 'admin' ? 'admin-rentals-title' : 'admin-access-title'}>
            {user?.role === 'admin' ? (
              <>
                <div className="admin-heading admin-heading-prominent admin-rentals-heading">
                  <div>
                    <p className="eyebrow">AREA AMMINISTRATORE · GESTIONE OPERATIVA</p>
                    <h1 id="admin-rentals-title">Noleggi <em>e disponibilità.</em></h1>
                    <p>Gestisci le richieste, conferma i periodi e tieni sotto controllo le auto occupate.</p>
                  </div>
                  <div className="admin-heading-actions">
                    <button className="button button-outline" type="button" onClick={() => navigateToPath('/admin/inventory')}>Inventario</button>
                    <button className="button button-outline" type="button" onClick={() => navigateToPath('/admin/messages')}>Messaggi e vendite</button>
                    <AdminReportExportButton reportType="rentals" />
                  </div>
                </div>
                <AdminRentalManager
                  vehicles={vehicles}
                  requests={adminRentalRequests}
                  loading={adminRentalRequestsLoading}
                  error={adminRentalRequestsError}
                  actionBusy={rentalRequestActionBusy}
                  actionStatus={rentalRequestActionStatus}
                  onUpdateStatus={updateRentalRequestStatus}
                  globalSearchTerm={adminSearchTerm}
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
          </AdminMotionSection>
        ) : isAdminVisitRequestsPage ? (
          <AdminMotionSection className="admin-page admin-visit-requests-page section-wrap" labelledBy={user?.role === 'admin' ? 'admin-visits-title' : 'admin-access-title'}>
            {user?.role === 'admin' ? (
              <>
                <div className="admin-heading admin-heading-prominent">
                  <div>
                    <p className="eyebrow">AREA AMMINISTRATORE · APPUNTAMENTI</p>
                    <h1 id="admin-visits-title">Visite in <em>concessionaria.</em></h1>
                    <p>Esamina le richieste dei clienti e gestisci gli appuntamenti. Il motivo della decisione è facoltativo.</p>
                  </div>
                  <div className="admin-heading-actions">
                    <button className="button button-outline" type="button" onClick={() => navigateToPath('/admin/inventory')}>Inventario</button>
                    <AdminReportExportButton reportType="visits" />
                  </div>
                </div>
                <AdminVisitRequestsPanel
                  requests={adminVisitRequests}
                  loading={adminVisitRequestsLoading}
                  error={adminVisitRequestsError}
                  actionBusy={visitRequestActionBusy}
                  actionStatus={visitRequestActionStatus}
                  onDecision={decideVisitRequest}
                  globalSearchTerm={adminSearchTerm}
                  timeZone={businessTimeZone}
                />
              </>
            ) : (
              <AdminAccessPanel
                area="VISITE IN CONCESSIONARIA"
                title={<>Accesso <em>riservato.</em></>}
                description="Accedi con un account amministratore per gestire le richieste di visita."
                accountNote={user ? 'L’account attualmente collegato non dispone dei permessi di amministratore.' : ''}
                onLogin={() => { setAuthMode('login'); setAuthError(''); }}
                onBack={() => navigateToHome('inventory')}
              />
            )}
          </AdminMotionSection>
        ) : isAdminLegalPage ? (
          user?.role === 'admin' ? (
            <AdminLegalDocumentsPage />
          ) : (
            <section className="admin-page section-wrap" aria-labelledby="admin-access-title">
              <AdminAccessPanel
                area="DOCUMENTI LEGALI"
                title={<>Accesso <em>riservato.</em></>}
                description="Accedi con un account amministratore per modificare i documenti pubblicati sul sito."
                accountNote={user ? 'L’account attualmente collegato non dispone dei permessi di amministratore.' : ''}
                onLogin={() => { setAuthMode('login'); setAuthError(''); }}
                onBack={() => navigateToHome('inventory')}
              />
            </section>
          )
        ) : isAdminSecurityAuditPage ? (
          user?.role === 'admin' ? (
            <AdminSecurityAuditPage />
          ) : (
            <section className="admin-page section-wrap" aria-labelledby="admin-access-title">
              <AdminAccessPanel
                area="AUDIT SICUREZZA"
                title={<>Accesso <em>riservato.</em></>}
                description="Accedi con un account amministratore per consultare gli eventi di sicurezza recenti."
                accountNote={user ? 'L’account attualmente collegato non dispone dei permessi di amministratore.' : ''}
                onLogin={() => { setAuthMode('login'); setAuthError(''); }}
                onBack={() => navigateToHome('inventory')}
              />
            </section>
          )
        ) : isAdminLogsPage ? (
          user?.role === 'admin' ? (
            <AdminActivityLogsPage />
          ) : (
            <section className="admin-page section-wrap" aria-labelledby="admin-access-title">
              <AdminAccessPanel
                area="ATTIVITÀ AMMINISTRATIVE"
                title={<>Accesso <em>riservato.</em></>}
                description="Accedi con un account amministratore per consultare il registro delle operazioni."
                accountNote={user ? 'L’account attualmente collegato non dispone dei permessi di amministratore.' : ''}
                onLogin={() => { setAuthMode('login'); setAuthError(''); }}
                onBack={() => navigateToHome('inventory')}
              />
            </section>
          )
        ) : isAdminAccountsPage ? (
          user?.role === 'admin' ? (
            <AdminAccountsPage />
          ) : (
            <section className="admin-page section-wrap" aria-labelledby="admin-access-title">
              <AdminAccessPanel
                area="ACCOUNT AMMINISTRATORI"
                title={<>Accesso <em>riservato.</em></>}
                description="Accedi con un account amministratore per gestire gli accessi separati della dashboard."
                accountNote={user ? 'L’account attualmente collegato non dispone dei permessi di amministratore.' : ''}
                onLogin={() => { setAuthMode('login'); setAuthError(''); }}
                onBack={() => navigateToHome('inventory')}
              />
            </section>
          )
        ) : isAdminSettingsPage || isAdminSecurityPage ? (
          user?.role === 'admin' ? (
            <AdminUtilityPage
              section={isAdminSecurityPage ? 'security' : 'settings'}
              user={user}
              onNavigate={navigateToPath}
              onLogout={handleLogout}
              businessName={businessName}
              onSettingsSaved={(savedSettings) => {
                setSiteSettings((current) => ({ ...current, ...savedSettings }));
                setSiteSettingsLoaded(true);
                setSiteSettingsError('');
                if (savedSettings.defaultVehicleType === 'buy' || savedSettings.defaultVehicleType === 'rent') {
                  setAdminVehicleTypeDefault(savedSettings.defaultVehicleType);
                }
              }}
            />
          ) : (
            <section className="admin-page section-wrap" aria-labelledby="admin-access-title">
              <AdminAccessPanel
                area={isAdminSecurityPage ? 'SICUREZZA ACCOUNT' : 'IMPOSTAZIONI GESTIONALI'}
                title={<>Accesso <em>riservato.</em></>}
                description="Accedi con un account amministratore per consultare questa sezione."
                accountNote={user ? 'L’account attualmente collegato non dispone dei permessi di amministratore.' : ''}
                onLogin={() => { setAuthMode('login'); setAuthError(''); }}
                onBack={() => navigateToHome('inventory')}
              />
            </section>
          )
        ) : isAccountPage ? (
          <section className={`account-page section-wrap${user?.role === 'user' ? '' : ' account-page-access-denied'}`} aria-labelledby="account-title">
            {user?.role === 'user' ? (
              <>
                <h1 className="visually-hidden" id="account-title">Area personale</h1>
                <button
                  className="account-sidebar-toggle"
                  type="button"
                  aria-expanded={accountSidebarOpen}
                  aria-controls="account-sections-nav"
                  aria-label={accountSidebarOpen ? 'Chiudi sezioni' : 'Apri sezioni'}
                  onClick={() => setAccountSidebarOpen((open) => !open)}
                >
                  {accountSidebarOpen ? <X size={20} aria-hidden="true" /> : <PanelLeftOpen size={20} aria-hidden="true" />}
                </button>
                <nav id="account-sections-nav" className={`account-page-nav${accountSidebarOpen ? ' is-open' : ''}`} aria-label="Sezioni area personale">
                  <button className={activeAccountSection === 'activity' ? 'is-active' : ''} type="button" aria-pressed={activeAccountSection === 'activity'} onClick={() => selectAccountSection('activity')}><span className="account-nav-icon"><SiteIcon name="eye" /></span><span><strong>Auto seguite</strong></span></button>
                  <button className={activeAccountSection === 'priceOffers' ? 'is-active' : ''} type="button" aria-pressed={activeAccountSection === 'priceOffers'} onClick={() => selectAccountSection('priceOffers')}><span className="account-nav-icon"><SiteIcon name="price" /></span><span><strong>Proposte prezzo</strong></span></button>
                  <button className={activeAccountSection === 'sellRequests' ? 'is-active' : ''} type="button" aria-pressed={activeAccountSection === 'sellRequests'} onClick={() => selectAccountSection('sellRequests')}><span className="account-nav-icon"><SiteIcon name="sell" /></span><span><strong>Le tue proposte</strong></span></button>
                  <button className={activeAccountSection === 'purchaseRequests' ? 'is-active' : ''} type="button" aria-pressed={activeAccountSection === 'purchaseRequests'} onClick={() => selectAccountSection('purchaseRequests')}><span className="account-nav-icon"><SiteIcon name="car" /></span><span><strong>Richieste acquisto</strong></span></button>
                  <button className={activeAccountSection === 'purchases' ? 'is-active' : ''} type="button" aria-pressed={activeAccountSection === 'purchases'} onClick={() => selectAccountSection('purchases')}><span className="account-nav-icon"><SiteIcon name="check" /></span><span><strong>I tuoi acquisti</strong></span></button>
                  <button className={activeAccountSection === 'privacy' ? 'is-active' : ''} type="button" aria-pressed={activeAccountSection === 'privacy'} onClick={() => selectAccountSection('privacy')}><span className="account-nav-icon"><ShieldCheck size={16} aria-hidden="true" /></span><span><strong>Privacy e account</strong></span></button>
                </nav>
                {activeAccountSection === 'activity' && <section className="customer-purchases customer-car-activity" id="customer-car-activity" aria-labelledby="customer-car-activity-title">
                  <div className="customer-purchases-heading">
                    <p className="eyebrow">LA TUA ATTIVITÀ</p>
                    <h2 id="customer-car-activity-title">Auto viste di recente</h2>
                    <p>Ritrova le auto che hai visualizzato mentre eri connesso.</p>
                  </div>
                  <div className="customer-vehicle-activity-grid">
                    <div className="customer-vehicle-activity-group">
                      <div className="customer-vehicle-activity-heading"><h3>Viste di recente</h3><span>{recentlyViewedVehicles.length}</span></div>
                      {recentlyViewedVehicles.length === 0
                        ? <p className="customer-purchases-empty">I veicoli che visualizzi mentre hai effettuato l’accesso compariranno qui.</p>
                        : <div className="customer-vehicle-card-grid">{recentlyViewedVehicles.map((vehicle) => (
                          <CustomerVehicleCard
                            key={vehicle.id}
                            vehicle={vehicle}
                            badge="Vista di recente"
                            isSaved={cart.includes(vehicle.id)}
                            onOpen={(id) => navigateToPath(`/auto/${id}`)}
                            onToggleSave={(item) => cart.includes(item.id) ? removeFromCart(item.id) : addToCart(item)}
                          />
                        ))}</div>}
                    </div>
                  </div>
                </section>}
                {activeAccountSection === 'priceOffers' && (
                  <CustomerVehiclePriceOffersWorkspace
                    offers={myVehicleOffers}
                    loading={myVehicleOffersLoading}
                    error={myVehicleOffersError}
                    businessName={businessName}
                    actionBusy={customerVehicleOfferActionBusy}
                    actionStatus={customerVehicleOfferActionStatus}
                    onRespond={respondToVehiclePriceOfferAsCustomer}
                    onOpenVehicle={(id) => navigateToPath(`/auto/${id}`)}
                    onBrowseVehicles={() => navigateToHome('inventory')}
                  />
                )}
                {activeAccountSection === 'sellRequests' && <section className="customer-requests" id="customer-requests" aria-labelledby="customer-requests-title">
                  <div className="section-heading"><div><p className="eyebrow">LE TUE PROPOSTE</p><h2 id="customer-requests-title">Valutazioni <em>e messaggi.</em></h2></div><p className="section-intro">Segui le risposte del concessionario e continua ogni conversazione qui.</p></div>
                  <div className="customer-request-summary" role="group" aria-label="Filtra le proposte di vendita">
                    <button type="button" aria-pressed={customerSellSubmissionFilter === 'all'} onClick={() => setCustomerSellSubmissionFilter('all')}><span>Proposte totali</span><strong>{customerSellSubmissionCounts.total}</strong></button>
                    <button type="button" aria-pressed={customerSellSubmissionFilter === 'reviewing'} onClick={() => setCustomerSellSubmissionFilter('reviewing')}><span>In valutazione</span><strong>{customerSellSubmissionCounts.reviewing}</strong></button>
                    <button type="button" aria-pressed={customerSellSubmissionFilter === 'countered'} onClick={() => setCustomerSellSubmissionFilter('countered')}><span>Controfferte</span><strong>{customerSellSubmissionCounts.countered}</strong></button>
                    <button type="button" aria-pressed={customerSellSubmissionFilter === 'completed'} onClick={() => setCustomerSellSubmissionFilter('completed')}><span>Concluse</span><strong>{customerSellSubmissionCounts.completed}</strong></button>
                  </div>
                  {mySellSubmissionLoading && <p className="reviews-status" role="status">Caricamento delle tue proposte…</p>}
                  {mySellSubmissionError && <p className="form-error" role="alert">{mySellSubmissionError}</p>}
                  {!mySellSubmissionLoading && !mySellSubmissionError && mySellSubmissions.length === 0 && <p className="reviews-status">Non hai ancora inviato proposte per vendere la tua auto.</p>}
                  {!mySellSubmissionLoading && !mySellSubmissionError && mySellSubmissions.length > 0 && visibleCustomerSellSubmissions.length === 0 && <p className="reviews-status">Nessuna proposta corrisponde al filtro selezionato.</p>}
                  <div className="customer-requests-list">
                    {visibleCustomerSellSubmissions.map((submission) => (
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
                          {(submission.messages || []).map((message, index) => <article className={`submission-message${message.senderRole === 'user' ? ' from-customer' : ' from-admin'}`} key={`${message.createdAt}-${index}`}><span>{message.senderRole === 'admin' ? businessName : 'Tu'}</span><p>{message.text}</p><time dateTime={message.createdAt}>{new Date(message.createdAt).toLocaleString('it-IT')}</time></article>)}
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
                </section>}
                {activeAccountSection === 'purchaseRequests' && <section className="customer-purchases customer-requested-purchases" id="customer-purchase-requests" aria-labelledby="customer-purchase-requests-title">
                  <div className="customer-purchases-heading"><p className="eyebrow">LE TUE RICHIESTE</p><h2 id="customer-purchase-requests-title">Auto che vuoi acquistare</h2><p>Il concessionario riceverà la richiesta e ti contatterà per verificare disponibilità e dettagli.</p></div>
                  <div className="customer-request-summary" role="group" aria-label="Filtra le richieste di acquisto">
                    <button type="button" aria-pressed={customerPurchaseRequestFilter === 'all'} onClick={() => setCustomerPurchaseRequestFilter('all')}><span>Richieste totali</span><strong>{customerPurchaseRequestCounts.total}</strong></button>
                    <button type="button" aria-pressed={customerPurchaseRequestFilter === 'pending'} onClick={() => setCustomerPurchaseRequestFilter('pending')}><span>In attesa</span><strong>{customerPurchaseRequestCounts.pending}</strong></button>
                    <button type="button" aria-pressed={customerPurchaseRequestFilter === 'contacted'} onClick={() => setCustomerPurchaseRequestFilter('contacted')}><span>Contattato</span><strong>{customerPurchaseRequestCounts.contacted}</strong></button>
                    <button type="button" aria-pressed={customerPurchaseRequestFilter === 'accepted'} onClick={() => setCustomerPurchaseRequestFilter('accepted')}><span>Accettate</span><strong>{customerPurchaseRequestCounts.accepted}</strong></button>
                  </div>
                  {myPurchaseRequestsError && <p className="form-error" role="alert">{myPurchaseRequestsError}</p>}
                  {!myPurchaseRequestsError && myPurchaseRequests.length === 0 && <p className="customer-purchases-empty">Non hai ancora richiesto l’acquisto di un’auto.</p>}
                  {!myPurchaseRequestsError && myPurchaseRequests.length > 0 && visibleCustomerPurchaseRequests.length === 0 && <p className="customer-purchases-empty">Nessuna richiesta corrisponde al filtro selezionato.</p>}
                  <div className="customer-requests-list">
                    {visibleCustomerPurchaseRequests.map((request) => (
                      <article className="customer-request customer-buy-request" key={request.id}>
                        <ProgressiveImage className="customer-buy-request-image" src={request.vehicle.image || request.vehicle.images?.[0]} alt={`${request.vehicle.make} ${request.vehicle.model}`} />
                        <div>
                          <span className={`admin-submission-status ${request.status === 'accepted' ? 'status-accepted' : request.status === 'contacted' ? 'status-contacted' : 'status-reviewing'}`}>{request.status === 'accepted' ? 'Richiesta accettata' : request.status === 'contacted' ? 'Contattato' : 'Richiesta inviata'}</span>
                          <h3>{request.vehicle.year} {request.vehicle.make} {request.vehicle.model}</h3>
                          <p>Prezzo richiesto: {getVehicleDiscountPrice(request.vehicle) !== null && <del className="vehicle-original-price">{euro.format(request.vehicle.price)}</del>} <strong>{euro.format(getVehicleCurrentPrice(request.vehicle))}</strong> · {getVehicleVatLabel(request.vehicle)}</p>
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
                </section>}
                {activeAccountSection === 'purchases' && <section className="customer-purchases" id="customer-purchases" aria-labelledby="customer-purchases-title">
                  <div className="customer-purchases-heading"><p className="eyebrow">ACQUISTI CONFERMATI</p><h2 id="customer-purchases-title">Le tue auto acquistate</h2><p>Se l’amministratore ha associato una vendita al tuo account, puoi lasciare qui una recensione verificata.</p></div>
                  <div className="customer-request-summary" role="group" aria-label="Filtra i tuoi acquisti">
                    <button type="button" aria-pressed={customerPurchaseFilter === 'all'} onClick={() => setCustomerPurchaseFilter('all')}><span>Acquisti totali</span><strong>{customerPurchaseCounts.total}</strong></button>
                    <button type="button" aria-pressed={customerPurchaseFilter === 'pendingReview'} onClick={() => setCustomerPurchaseFilter('pendingReview')}><span>Da recensire</span><strong>{customerPurchaseCounts.pendingReview}</strong></button>
                    <button type="button" aria-pressed={customerPurchaseFilter === 'reviewed'} onClick={() => setCustomerPurchaseFilter('reviewed')}><span>Recensite</span><strong>{customerPurchaseCounts.reviewed}</strong></button>
                  </div>
                  {myPurchasesError && <p className="form-error" role="alert">{myPurchasesError}</p>}
                  {!myPurchasesError && myPurchases.length === 0 && <p className="customer-purchases-empty">Non risultano acquisti collegati a questo account.</p>}
                  {!myPurchasesError && myPurchases.length > 0 && visibleCustomerPurchases.length === 0 && <p className="customer-purchases-empty">Nessun acquisto corrisponde al filtro selezionato.</p>}
                  {visibleCustomerPurchases.map((purchase) => <article className="customer-purchase" key={purchase.id}><ProgressiveImage className="customer-purchase-image" src={purchase.images[0]} alt="" /><div className="customer-purchase-info"><h3>{purchase.year} {purchase.make} {purchase.model}</h3><small>Acquistata il {new Date(purchase.soldAt).toLocaleDateString('it-IT')}</small>{purchase.review ? <p className="customer-review-complete">Hai già recensito quest’auto · {'★'.repeat(purchase.review.rating)}</p> : <form className="customer-review-form" onSubmit={(event) => handleCustomerReviewSubmit(event, purchase)}><label>La tua valutazione<SelectField name="rating" defaultValue="5" required><option value="5">★★★★★ · Eccellente</option><option value="4">★★★★☆ · Molto buona</option><option value="3">★★★☆☆ · Buona</option><option value="2">★★☆☆☆ · Da migliorare</option><option value="1">★☆☆☆☆ · Insoddisfacente</option></SelectField></label><label>Racconta la tua esperienza<textarea name="text" rows="3" minLength="10" maxLength="500" placeholder={`Com’è stata l’esperienza con ${businessName}? (massimo 500 caratteri)`} required /></label><label className="review-name-consent"><input name="publishName" type="checkbox" required /><span>Acconsento a pubblicare la recensione con il mio nome (solo nome).</span></label>{reviewStatus.saleId === purchase.id && reviewStatus.error && <p className="form-error" role="alert">{reviewStatus.error}</p>}{reviewStatus.saleId === purchase.id && reviewStatus.message && <p className="form-success" role="status">{reviewStatus.message}</p>}<button className="button button-accent button-small" type="submit" disabled={reviewBusy}>{reviewBusy ? 'Pubblicazione…' : 'Pubblica recensione'} <span aria-hidden="true">↗</span></button></form>}</div></article>)}
                </section>}
                {activeAccountSection === 'privacy' && (
                  <section className="customer-purchases account-privacy-section" aria-labelledby="account-privacy-title">
                    <div className="customer-purchases-heading">
                      <p className="eyebrow">I TUOI DATI</p>
                      <h2 id="account-privacy-title">Privacy e account</h2>
                      <p>Gestisci l’accesso, le tue preferenze e i dati del tuo account in un unico posto.</p>
                    </div>
                    <CustomerAccountSettings user={user} onUserUpdated={setUser} onCookieSettings={openCookieSettings} onNavigate={navigateToPath} onDeleted={() => {
                      try {
                        window.localStorage.removeItem(`pelusogroup-viewed-${user.id}`);
                      } catch (error) {
                        console.error('Could not remove local vehicle history:', error);
                      }
                      handleLogout();
                    }} />
                  </section>
                )}
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
          <MotionConfig reducedMotion="user">
          <>
        <section className="hero" id="home">
          <motion.div
            className="hero-image"
            initial={{ opacity: 0.65, scale: 1.075 }}
            animate={{ opacity: 1, scale: 1.015 }}
            transition={{ duration: 1.35, ease: [0.22, 1, 0.36, 1] }}
            style={{ backgroundImage: `url("${siteSettings.heroImageUrl || DEFAULT_SITE_SETTINGS.heroImageUrl}")` }}
          />
          <motion.div
            className="hero-content"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.72, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="eyebrow"><MapPin aria-hidden="true" /> PELUSOGROUP · CELLOLE</p>
            <h1>La strada giusta<br />parte da <em>qui.</em></h1>
            <p className="hero-copy">
              Acquistiamo auto usate e ti aiutiamo a trovare la prossima. Scopri le auto disponibili e le nostre soluzioni di noleggio.
            </p>
            <div className="hero-actions">
              <a className="button button-accent header-glossy-accent" href="/catalogo" onClick={(event) => {
                event.preventDefault();
                goToInventory('all');
              }}>
                Scopri le auto <ArrowUpRight aria-hidden="true" />
              </a>
              <a className="text-link" href="#services" onClick={(event) => { event.preventDefault(); navigateToSection('services'); }}>Scopri i servizi <ArrowRight aria-hidden="true" /></a>
            </div>
            <div className="hero-highlights" aria-label="I nostri servizi">
              <span><CarFront aria-hidden="true" /> Compriamo e vendiamo</span>
              <span><KeyRound aria-hidden="true" /> Noleggio</span>
              <span><Tag aria-hidden="true" /> Valutazione auto</span>
            </div>
          </motion.div>
          {!inventoryLoading && !inventoryError && homeInventorySummary.total > 0 && (
            <motion.aside
              className="hero-inventory-card"
              aria-label={`Inventario: ${homeInventorySummary.buy} auto in vendita e ${homeInventorySummary.rent} a noleggio`}
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="hero-inventory-heading">
                <span className="hero-inventory-mark"><Activity size={15} aria-hidden="true" /></span>
                <div>
                  <p className="eyebrow">SELEZIONE ATTUALE</p>
                  <h2>Auto disponibili</h2>
                </div>
              </div>
              <div className="hero-inventory-content">
                <div
                  className="hero-inventory-donut"
                  role="img"
                  aria-label={`${homeInventorySummary.total} auto in catalogo: ${homeInventorySummary.buy} in vendita e ${homeInventorySummary.rent} a noleggio`}
                >
                  <PieChart width={98} height={98}>
                    <Pie
                      data={homeInventorySummary.chartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius="68%"
                      outerRadius="92%"
                      paddingAngle={4}
                      stroke="none"
                      isAnimationActive={!prefersReducedMotion}
                      animationDuration={850}
                      animationEasing="ease-out"
                    >
                      {homeInventorySummary.chartData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                  <div className="hero-inventory-total" aria-hidden="true">
                    <strong>{homeInventorySummary.total}</strong>
                    <span>auto</span>
                  </div>
                </div>
                <div className="hero-inventory-legend" aria-hidden="true">
                  <span><i className="is-buy" /><span>In vendita</span><strong>{homeInventorySummary.buy}</strong></span>
                  <span><i className="is-rent" /><span>A noleggio</span><strong>{homeInventorySummary.rent}</strong></span>
                </div>
              </div>
              <button className="hero-inventory-link" type="button" onClick={() => goToInventory('all')}>
                Esplora il catalogo <ArrowRight size={15} aria-hidden="true" />
              </button>
            </motion.aside>
          )}
          <div className="hero-caption"><span>DAL 19 MARZO 2017</span><span>AL TUO FIANCO, A CELLOLE</span></div>
          <a className="scroll-cue" href="/catalogo" onClick={(event) => { event.preventDefault(); goToInventory('all'); }}><span /> Scopri l’inventario</a>
        </section>

        {(homeFeaturedVehicles.buy.length > 0 || homeFeaturedVehicles.rent.length > 0) && (
          <motion.section
            className="home-featured-inventory section-wrap"
            aria-labelledby="home-featured-title"
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.12 }}
            transition={{ duration: 0.62, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="home-featured-heading">
              <div>
                <p className="eyebrow">IN VETRINA</p>
                <h2 id="home-featured-title">Auto disponibili <em>ora.</em></h2>
              </div>
              <p>Scopri alcune delle vetture in vendita e a noleggio. Tutte le auto sono nel catalogo completo.</p>
            </div>
            <div className="home-featured-groups">
              {homeFeaturedVehicles.buy.length > 0 && (
                <section className="home-featured-group catalog-page-section" aria-labelledby="home-featured-buy-title">
                  <div className="home-featured-group-heading">
                    <h3 id="home-featured-buy-title">In vendita</h3>
                    <button type="button" onClick={() => goToInventory('buy')}>Tutte le auto in vendita <ArrowRight aria-hidden="true" /></button>
                  </div>
                  <div className="vehicle-grid home-featured-grid">
                    {homeFeaturedVehicles.buy.map((vehicle) => (
                      <CatalogVehicleCard
                        key={vehicle.id}
                        vehicle={vehicle}
                        onOpen={openVehicle}
                        onSelect={addToCart}
                        isLoggedIn={Boolean(user)}
                        isSelected={cart.includes(vehicle.id)}
                        purchaseRequestCount={publicVehicleMetricsById.get(vehicle.id)?.purchaseRequests || 0}
                        onDiscountExpire={() => setDiscountExpiryVersion((version) => version + 1)}
                      />
                    ))}
                  </div>
                </section>
              )}
              {homeFeaturedVehicles.rent.length > 0 && (
                <section className="home-featured-group catalog-page-section" aria-labelledby="home-featured-rent-title">
                  <div className="home-featured-group-heading">
                    <h3 id="home-featured-rent-title">A noleggio</h3>
                    <button type="button" onClick={() => goToInventory('rent')}>Tutte le auto a noleggio <ArrowRight aria-hidden="true" /></button>
                  </div>
                  <div className="vehicle-grid home-featured-grid">
                    {homeFeaturedVehicles.rent.map((vehicle) => (
                      <CatalogVehicleCard
                        key={vehicle.id}
                        vehicle={vehicle}
                        onOpen={openVehicle}
                        onSelect={addToCart}
                        isLoggedIn={Boolean(user)}
                        isSelected={cart.includes(vehicle.id)}
                        purchaseRequestCount={publicVehicleMetricsById.get(vehicle.id)?.purchaseRequests || 0}
                        onDiscountExpire={() => setDiscountExpiryVersion((version) => version + 1)}
                      />
                    ))}
                  </div>
                </section>
              )}
            </div>
          </motion.section>
        )}

        {!isCatalogPage && <motion.section
          className="popular-brands section-wrap"
          aria-labelledby="popular-brands-title"
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.12 }}
          transition={{ duration: 0.62, ease: [0.22, 1, 0.36, 1] }}
        >
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
                Esplora tutto il catalogo <ArrowUpRight aria-hidden="true" />
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
              {availablePopularMakes.map(({ make, query, count }, index) => {
                const normalizedMake = make.toLocaleLowerCase('it').replace(/[^a-z0-9]/g, '');
                const logoPath = POPULAR_MAKE_LOGO_PATHS[normalizedMake];
                return (
                  <motion.div
                    className="popular-brand-item"
                    key={make}
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.45, delay: Math.min(index * 0.04, 0.25) }}
                  >
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
                      <ArrowUpRight className="popular-brand-arrow" aria-hidden="true" />
                    </button>
                    <span className="popular-brand-name">{make}</span>
                    <span className="popular-brand-availability">{count} {count === 1 ? 'auto disponibile' : 'auto disponibili'}</span>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="popular-brands-empty">
              <p>Al momento non ci sono auto pubblicate nel catalogo.</p>
              <button type="button" onClick={() => goToInventory('all')}>Visita il catalogo <span aria-hidden="true">↗</span></button>
            </div>
          )}
        </motion.section>}

        <motion.section
          className="home-start section-wrap"
          id="services"
          ref={servicesRef}
          aria-labelledby="home-start-title"
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.12 }}
          transition={{ duration: 0.62, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="home-start-heading">
            <div>
              <p className="eyebrow">SCOPRI I NOSTRI SERVIZI</p>
              <h2 id="home-start-title">Come possiamo <em>aiutarti?</em></h2>
            </div>
            <p>Acquisto, noleggio o vendita: scegli il servizio più adatto alle tue esigenze.</p>
          </div>
          <motion.div
            className="home-path-grid"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.18 }}
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1 } } }}
          >
            <motion.article
              className="home-path-card"
              variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.48 } } }}
            >
              <span className="home-path-icon"><CarFront aria-hidden="true" /></span>
              <span className="home-path-step">01 · ACQUISTO</span>
              <h3>Cerchi un’auto da acquistare?</h3>
              <p>Consulta le auto disponibili e confronta i dettagli per trovare quella giusta per te.</p>
              <button type="button" onClick={() => goToInventory('buy')}>Guarda le auto in vendita <ArrowUpRight aria-hidden="true" /></button>
            </motion.article>
            <motion.article
              className="home-path-card"
              variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.48 } } }}
            >
              <span className="home-path-icon"><KeyRound aria-hidden="true" /></span>
              <span className="home-path-step">02 · NOLEGGIO</span>
              <h3>Hai bisogno di un’auto a noleggio?</h3>
              <p>Scopri le auto disponibili e scegli quella più adatta al tuo viaggio o alla tua occasione.</p>
              <button type="button" onClick={() => goToInventory('rent')}>Scopri il noleggio <ArrowUpRight aria-hidden="true" /></button>
            </motion.article>
            <motion.article
              className="home-path-card"
              variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.48 } } }}
            >
              <span className="home-path-icon"><Tag aria-hidden="true" /></span>
              <span className="home-path-step">03 · VALUTAZIONE</span>
              <h3>Vuoi vendere la tua auto?</h3>
              <p>Inviaci i dati e le foto: valuteremo la tua auto gratuitamente in meno di 24 ore e ti ricontatteremo con una proposta riservata.</p>
              <button type="button" onClick={() => navigateToSection('sell-form')}>Richiedi una valutazione <ArrowUpRight aria-hidden="true" /></button>
            </motion.article>
          </motion.div>
          <div className="home-trust-line">
            <span className="home-trust-mark" aria-hidden="true"><MapPin /></span>
            <p><strong>Dal 19 marzo 2017 siamo al tuo fianco.</strong> Ci trovi in sede: {publicAddress}.</p>
            <button type="button" onClick={() => navigateToSection('about')}>Scopri chi siamo <ArrowRight aria-hidden="true" /></button>
          </div>
        </motion.section>
          </>
          </MotionConfig>
        )}

        {isCatalogPage && (
        <section className="inventory-section section-wrap catalog-page-section" id="inventory">
          <div className="catalog-page-heading">
            <p className="eyebrow">CATALOGO AUTO · CELLOLE</p>
            <h1>Trova la tua prossima <em>auto.</em></h1>
            <p>Confronta le auto disponibili, filtra per le caratteristiche che contano e contattaci per ricevere informazioni su acquisto e noleggio.</p>
            <div className="catalog-benefits" aria-label={`I vantaggi del catalogo ${businessName}`}>
              <span><SiteIcon name="check" /> Dettagli chiari</span>
              <span><SiteIcon name="car" /> Vendita e noleggio</span>
              <span><SiteIcon name="phone" /> Supporto diretto</span>
            </div>
          </div>
          {(inventoryLoading || (!inventoryError && topDiscountedVehicles.length > 0)) && (
            <section className="discount-podium" aria-labelledby="discount-podium-title">
              <header className="discount-podium-heading">
                <h2 id="discount-podium-title">Offerte <em>scontate</em> più viste</h2>
              </header>
              <div
                className="discount-podium-grid"
                role={inventoryLoading ? 'status' : undefined}
                aria-label={inventoryLoading ? 'Caricamento delle tre offerte più viste' : undefined}
                aria-busy={inventoryLoading}
              >
                {inventoryLoading ? <DiscountPodiumSkeletonCards /> : topDiscountedVehicles.map((vehicle, index) => (
                  <article className="vehicle-card most-viewed-card discount-podium-card" key={vehicle.id}>
                    <a
                      className="vehicle-detail-link"
                      href={`/auto/${vehicle.id}`}
                      aria-label={`Scopri ${vehicle.year} ${vehicle.make} ${vehicle.model}, auto scontata con ${kilometer.format(vehicle.viewCount || 0)} visualizzazioni`}
                      onClick={(event) => {
                        event.preventDefault();
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
                        <div className="vehicle-engagement" aria-label={`${kilometer.format(vehicle.viewCount || 0)} visualizzazioni`}>
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
                        <span>In vendita</span>
                      </div>
                      <div className="most-viewed-card-footer discount-podium-card-footer">
                        <span className="vehicle-price-value">
                          <VehicleDiscountPrice
                            vehicle={vehicle}
                            vatLabel={vehicle.type === 'buy' ? getVehicleVatLabel(vehicle) : null}
                            onExpire={() => setDiscountExpiryVersion((version) => version + 1)}
                          />
                        </span>
                        <button
                          className="button button-accent most-viewed-view-button header-glossy-accent"
                          type="button"
                          onClick={() => openVehicle(vehicle.id)}
                        >
                          Dettagli auto <span aria-hidden="true">↗</span>
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
              {!inventoryLoading && (
                <p className="discount-podium-footnote">Classifica delle offerte attive in base alle visualizzazioni registrate.</p>
              )}
            </section>
          )}
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

          <div
            ref={catalogAdvancedFiltersRef}
            className="advanced-filters"
            id="catalog-advanced-filters"
            hidden={!catalogFiltersOpen}
          >
            <button
              className="advanced-filter-drag-handle"
              type="button"
              aria-label="Nascondi i filtri avanzati"
              onClick={(event) => {
                if (event.detail === 0) setCatalogFiltersOpen(false);
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') setCatalogFiltersOpen(false);
              }}
              onPointerDown={startCatalogFilterDrag}
              onPointerMove={moveCatalogFilterDrag}
              onPointerUp={finishCatalogFilterDrag}
              onPointerCancel={finishCatalogFilterDrag}
            >
              <span aria-hidden="true" />
            </button>
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
              <RefreshCw size={14} aria-hidden="true" />
              Azzera filtri
            </button>
            <button
              className={`catalog-extra-filters-toggle${catalogExtraFiltersOpen ? ' is-open' : ''}`}
              type="button"
              aria-expanded={catalogExtraFiltersOpen}
              aria-controls="catalog-extra-filters"
              onClick={() => setCatalogExtraFiltersOpen((open) => !open)}
            >
              <span className="catalog-extra-filters-toggle-label"><ListFilter size={15} aria-hidden="true" />{catalogExtraFiltersOpen ? 'Nascondi filtri aggiuntivi' : 'Mostra altri filtri'}</span>
              {[modelFilter, colorFilter, doorsFilter, drivetrainFilter, noviceDriverFilter].filter(Boolean).length > 0 && (
                <span className="catalog-extra-filter-count">
                  Filtri attivi: {[modelFilter, colorFilter, doorsFilter, drivetrainFilter, noviceDriverFilter].filter(Boolean).length}
                </span>
              )}
              <Plus className="catalog-extra-filters-toggle-icon" size={16} aria-hidden="true" />
            </button>
            <div className="catalog-extra-filters" id="catalog-extra-filters" hidden={!catalogExtraFiltersOpen}>
              <label className="filter-control">
                <span><SiteIcon name="car" /> Modello</span>
                <SelectField value={modelFilter} onChange={(event) => setModelFilter(event.target.value)}>
                  <option value="">Tutti i modelli</option>
                  {models.map((model) => <option key={model} value={model}>{model}</option>)}
                </SelectField>
              </label>
              <label className="filter-control">
                <span><SiteIcon name="color" /> Colore</span>
                <SelectField value={colorFilter} onChange={(event) => setColorFilter(event.target.value)}>
                  <option value="">Tutti i colori</option>
                  {colors.map((color) => <option key={color} value={color}>{color}</option>)}
                </SelectField>
              </label>
              <label className="filter-control">
                <span><SiteIcon name="doors" /> Porte</span>
                <SelectField value={doorsFilter} onChange={(event) => setDoorsFilter(event.target.value)}>
                  <option value="">Qualsiasi numero</option>
                  {doorOptions.map((doors) => <option key={doors} value={doors}>{doors} {doors === 1 ? 'porta' : 'porte'}</option>)}
                </SelectField>
              </label>
              <label className="filter-control">
                <span><SiteIcon name="drivetrain" /> Trazione</span>
                <SelectField value={drivetrainFilter} onChange={(event) => setDrivetrainFilter(event.target.value)}>
                  <option value="">Tutte</option>
                  {drivetrainOptions.map((drivetrain) => <option key={drivetrain} value={drivetrain}>{drivetrain}</option>)}
                </SelectField>
              </label>
              <label className="filter-control">
                <span><SiteIcon name="novice" /> Neopatentati</span>
                <SelectField value={noviceDriverFilter} onChange={(event) => setNoviceDriverFilter(event.target.value)}>
                  <option value="">Indifferente</option>
                  <option value="yes">Idonea</option>
                  <option value="no">Non idonea</option>
                  <option value="unknown">Non verificata</option>
                </SelectField>
              </label>
            </div>
            <label className="filter-control">
              <span><SiteIcon name="car" /> Marca</span>
              <SelectField value={makeFilter} onChange={(event) => { setMakeFilter(event.target.value); setModelFilter(''); }}>
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
              <span><SiteIcon name="fuel" /> Alimentazione</span>
              <SelectField value={fuelFilter} onChange={(event) => setFuelFilter(event.target.value)}>
                <option value="">Tutte</option>
                {fuelOptions.map((fuel) => <option key={fuel} value={fuel}>{fuel}</option>)}
              </SelectField>
            </label>
            <label className="filter-control">
              <span><SiteIcon name="transmission" /> Cambio</span>
              <SelectField value={transmissionFilter} onChange={(event) => setTransmissionFilter(event.target.value)}>
                <option value="">Tutti</option>
                {transmissionOptions.map((transmission) => <option key={transmission} value={transmission}>{transmission}</option>)}
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
              <span><SiteIcon name="price" /> Prezzo massimo</span>
              <SelectField value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)}>
                <option value="">Qualsiasi prezzo</option>
                <option value="15000">Fino a 15.000 €</option>
                <option value="30000">Fino a 30.000 €</option>
                <option value="40000">Fino a 40.000 €</option>
              </SelectField>
            </label>
            <label className="filter-control">
              <span><SiteIcon name="power" /> Potenza massima</span>
              <SelectField value={maxPower} onChange={(event) => setMaxPower(event.target.value)}>
                <option value="">Qualsiasi potenza</option>
                <option value="100">Fino a 100 CV</option>
                <option value="150">Fino a 150 CV</option>
                <option value="200">Fino a 200 CV</option>
                <option value="300">Fino a 300 CV</option>
                <option value="450">Fino a 450 CV</option>
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
              <CatalogVehicleCard
                key={vehicle.id}
                vehicle={vehicle}
                onOpen={openVehicle}
                onSelect={addToCart}
                isLoggedIn={Boolean(user)}
                isSelected={cart.includes(vehicle.id)}
                purchaseRequestCount={publicVehicleMetricsById.get(vehicle.id)?.purchaseRequests || 0}
                onDiscountExpire={() => setDiscountExpiryVersion((version) => version + 1)}
              />
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
                      <VehicleDiscountPrice vehicle={vehicle} priceElement="em" showCountdown={false} onExpire={() => setDiscountExpiryVersion((version) => version + 1)} />
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
          <MotionConfig reducedMotion="user">
          <>
        <motion.section
          className="sold-cars-section section-wrap"
          aria-labelledby="sold-cars-title"
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.12 }}
          transition={{ duration: 0.62, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="section-heading">
            <div>
              <p className="eyebrow">AUTO VENDUTE</p>
              <h2 id="sold-cars-title">Le auto che hanno<br /><em>già trovato casa.</em></h2>
            </div>
            <p className="section-intro">Scopri alcune delle auto consegnate ai nostri clienti.</p>
          </div>
          <ol className="sold-cars-steps" aria-label="Le tre tappe dell’acquisto">
            <li className="sold-cars-step">
              <span className="sold-cars-step-icon"><ClipboardList aria-hidden="true" /></span>
              <span className="sold-cars-step-copy"><small>01</small>Richiesta d’acquisto</span>
            </li>
            <li className="sold-cars-step">
              <span className="sold-cars-step-icon"><CreditCard aria-hidden="true" /></span>
              <span className="sold-cars-step-copy"><small>02</small>Pagamento</span>
            </li>
            <li className="sold-cars-step">
              <span className="sold-cars-step-icon"><Truck aria-hidden="true" /></span>
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
                onWheel={interruptCarouselAnimation}
                onPointerDown={interruptCarouselAnimation}
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
              <button type="button" aria-label="Auto consegnate precedenti" aria-controls="sold-cars-track" onClick={() => scrollCarousel(soldCarsTrackRef, -1)}><ArrowLeft aria-hidden="true" /></button>
              <button type="button" aria-label="Auto consegnate successive" aria-controls="sold-cars-track" onClick={() => scrollCarousel(soldCarsTrackRef, 1)}><ArrowRight aria-hidden="true" /></button>
            </div>
          )}
          <div className="sold-cars-footer">
            <span>La prossima storia potrebbe essere la tua.</span>
            <button type="button" onClick={() => goToInventory('buy')}>Trova la tua auto <ArrowUpRight aria-hidden="true" /></button>
          </div>
        </motion.section>

        <motion.section
          className="about-section section-wrap"
          id="about"
          aria-labelledby="about-title"
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.12 }}
          transition={{ duration: 0.62, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="about-visual">
            <img className="about-section-logo" src={siteSettings.logoUrl || DEFAULT_SITE_SETTINGS.logoUrl} alt={businessName} loading="lazy" decoding="async" />
            <div className="about-image">
              <ProgressiveImage
                src="/images/pelusogroup-luxury-car-handover.png"
                alt={`Consegna di un'auto a un cliente davanti al salone ${businessName}`}
                className="about-main-image"
              />
              <div className="about-image-caption">
                <span>{businessName.toLocaleUpperCase('it-IT')} · SEDE</span>
                <strong>Una storia di famiglia,<br />dal 2017.</strong>
              </div>
              <span className="image-stamp">DAL<br />2017</span>
            </div>
          </div>
          <div className="about-copy">
            <p className="eyebrow">UNA PASSIONE, UN RAPPORTO DIRETTO</p>
            <h2 id="about-title">La tua prossima auto<br />inizia da <em>qui.</em></h2>
            <p>
              {businessName} è un’attività di famiglia fondata dai fratelli Gerardo e Luigi Peluso.
              Dal 19 marzo 2017 accogliamo presso la nostra sede chi cerca un’auto da acquistare, una soluzione
              di noleggio o una valutazione per la propria vettura.
            </p>
            <p>
              Ascoltiamo le tue esigenze, condividiamo le informazioni con chiarezza e ti seguiamo
              con un contatto diretto in ogni fase. Ci trovi in {publicAddress}.
            </p>
            <div className="about-values" aria-label="I nostri valori">
              <article><span>01</span><strong>Esperienza di famiglia</strong><small>Un’attività costruita nel tempo, con attenzione alle persone.</small></article>
              <article><span>02</span><strong>Informazioni chiare</strong><small>Dettagli e risposte utili per scegliere con consapevolezza.</small></article>
              <article><span>03</span><strong>Contatto diretto</strong><small>Parli con Gerardo e Luigi per acquisto, vendita o noleggio.</small></article>
            </div>
            <div className="about-actions">
              <button className="button button-accent button-small" type="button" onClick={() => goToInventory('buy')}>
                Esplora le auto <ArrowUpRight aria-hidden="true" />
              </button>
              <button className="button button-outline button-small" type="button" onClick={() => navigateToPath('/contatti')}>
                Parla con il team <ArrowUpRight aria-hidden="true" />
              </button>
            </div>
            <div className="peluso-team-heading">
              <p className="eyebrow">SIAMO QUI PER TE</p>
              <h3>Parla direttamente con <em>{publicStaffContacts.map((contact) => contact.name).join(' e ')}.</em></h3>
              <p>Chiamaci o scrivici su WhatsApp: ti risponderemo per aiutarti con la tua richiesta.</p>
            </div>
            <div className="peluso-team" aria-label={`Contatti del team ${businessName}`}>
              {publicStaffContacts.map((contact) => {
                const initials = contact.name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toLocaleUpperCase('it-IT');
                const phoneHref = contact.phone ? `tel:${contact.phone.replace(/[^\d+]/g, '')}` : '';
                const whatsappNumber = contact.whatsapp || contact.phone?.replace(/\D/g, '');
                const whatsappHref = whatsappNumber
                  ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`Ciao ${contact.name}, ho visto il sito ${businessName} e vorrei ricevere informazioni.`)}`
                  : '';
                return (
                  <article className="team-card" key={contact.id}>
                    <span className="team-initials" aria-hidden="true">{initials}</span>
                    <div className="team-card-info">
                      <h3>{contact.name}</h3>
                      {contact.role && <span>{contact.role}</span>}
                      {contact.email && <a href={`mailto:${contact.email}`}>{contact.email}</a>}
                      {(phoneHref || whatsappHref) && (
                        <div className="team-card-actions">
                          {phoneHref && <a className="team-contact-button" href={phoneHref}><SiteIcon name="phone" /> Chiama</a>}
                          {whatsappHref && <a className="team-contact-button team-whatsapp-button" href={whatsappHref} target="_blank" rel="noopener noreferrer"><SiteIcon name="whatsapp" /> WhatsApp</a>}
                        </div>
                      )}
                      {phoneHref && <a className="team-phone-number" href={phoneHref}>{contact.phone}</a>}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </motion.section>

        <motion.section
          className="reviews-section section-wrap"
          aria-labelledby="reviews-title"
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.12 }}
          transition={{ duration: 0.62, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="reviews-heading">
            <div>
              <p className="eyebrow"><ShieldCheck aria-hidden="true" /> RECENSIONI VERIFICATE</p>
              <h2 id="reviews-title">Esperienze <em>condivise.</em></h2>
            </div>
            {user?.role !== 'user' && (
              <button className="text-link reviews-login-link" type="button" onClick={() => { setAuthError(''); setAuthMode('login'); }}>
                Accedi per lasciare una recensione dopo l’acquisto <ArrowRight aria-hidden="true" />
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
                onWheel={interruptCarouselAnimation}
                onPointerDown={interruptCarouselAnimation}
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
                    <div className="customer-review-top">
                      <div className="customer-review-rating" role="img" aria-label={`${review.rating} stelle su 5`}>
                        {Array.from({ length: 5 }, (_, starIndex) => (
                          <Star className={starIndex < review.rating ? 'is-filled' : ''} aria-hidden="true" key={starIndex} />
                        ))}
                      </div>
                      <Quote className="customer-review-quote" aria-hidden="true" />
                    </div>
                    <p
                      tabIndex={review.text.length > 200 ? 0 : undefined}
                      aria-label={review.text.length > 200 ? 'Testo completo della recensione, scorri per leggerlo' : undefined}
                    >
                      {review.text}
                    </p>
                    <div className="customer-review-author">
                      <span className="customer-review-avatar" aria-hidden="true"><UserRound /></span>
                      <div className="customer-review-identity">
                        <span>{review.authorName}</span>
                        <span className="customer-review-verified"><ShieldCheck aria-hidden="true" /> Acquisto verificato</span>
                      </div>
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
              <button type="button" aria-label="Recensioni precedenti" aria-controls="customer-reviews-track" onClick={() => scrollCarousel(customerReviewsTrackRef, -1)}><ArrowLeft aria-hidden="true" /></button>
              <button type="button" aria-label="Recensioni successive" aria-controls="customer-reviews-track" onClick={() => scrollCarousel(customerReviewsTrackRef, 1)}><ArrowRight aria-hidden="true" /></button>
            </div>
          )}
        </motion.section>
        <motion.section
          className="home-faq section-wrap"
          aria-labelledby="home-faq-title"
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.12 }}
          transition={{ duration: 0.62, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="home-faq-heading">
            <p className="eyebrow">DOMANDE FREQUENTI</p>
            <h2 id="home-faq-title">Scegli con <em>serenità.</em></h2>
            <p>Acquisto, visite, noleggio e vendita: le risposte essenziali, senza sorprese.</p>
          </div>
          <div className="home-faq-list">
            {HOME_FAQ_ITEMS.map(({ question, answer }) => (
              <details className="home-faq-item" key={question}>
                <summary>{question}<span aria-hidden="true">+</span></summary>
                <p>{answer}</p>
              </details>
            ))}
          </div>
        </motion.section>
          </>
          </MotionConfig>
        )}
          </>
        )}
        </div>}
      </main>

      {!activeVehicle && !isUnknownVehiclePage && !isAdminArea && !isAccountPage && !isNotFoundPage && !isAdminRouteBlocked && !isSiteUnavailable && !isSiteSettingsLoading && <footer className="site-footer">
        <div className={`footer-main${user?.role === 'admin' ? ' is-admin-view' : ''}`}>
          <div className="footer-brand-column">
            <a className="brand brand-footer" href="/" onClick={(event) => { event.preventDefault(); navigateToHome(); }}>
              <img className="brand-logo" src={siteSettings.logoUrl || DEFAULT_SITE_SETTINGS.logoUrl} alt={businessName} loading="lazy" decoding="async" />
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
              {gerardoWhatsappHref && <a className="footer-social-link footer-social-whatsapp" href={gerardoWhatsappHref} target="_blank" rel="noopener noreferrer" aria-label={`Contatta ${gerardoContact.name} su WhatsApp`}>
                <SiteIcon name="whatsapp" />
                <span>WhatsApp</span>
              </a>}
              <a className="footer-social-link" href="https://www.facebook.com/PelusoGroup/" target="_blank" rel="noopener noreferrer" aria-label={`Visita la pagina Facebook ${businessName}`}>
                <SiteIcon name="facebook" />
                <span>Facebook</span>
              </a>
            </nav>
          </div>
          <div className="footer-column">
            <h2>{businessName}</h2>
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
              : <button type="button" onClick={() => { if (!user) { setAuthMode('login'); return; } setCartOpen(true); }}>La mia selezione ({selectedVehicles.length})</button>}
          </div>
          <div className="footer-column">
            <h2>Informazioni</h2>
            <a href="/privacy" onClick={(event) => { event.preventDefault(); navigateToPath('/privacy'); }}>Privacy Policy</a>
            <a href="/termini-condizioni" onClick={(event) => { event.preventDefault(); navigateToPath('/termini-condizioni'); }}>Termini e condizioni</a>
            <a href="/cookie-policy" onClick={(event) => { event.preventDefault(); navigateToPath('/cookie-policy'); }}>Cookie Policy</a>
            <a href="/note-legali" onClick={(event) => { event.preventDefault(); navigateToPath('/note-legali'); }}>Note legali</a>
            <a href="/account/privacy" onClick={(event) => { event.preventDefault(); navigateToPath('/account/privacy'); }}>Gestisci account e privacy</a>
          </div>
          {user?.role !== 'admin' && <div className="footer-column footer-contact-column">
            <h2>Parla con noi</h2>
            {publicStaffContacts.map((contact) => {
              const phoneHref = contact.phone ? `tel:${contact.phone.replace(/[^\d+]/g, '')}` : '';
              const whatsappNumber = contact.whatsapp || contact.phone?.replace(/\D/g, '');
              const whatsappHref = whatsappNumber
                ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`Ciao ${contact.name}, ho visto il sito ${businessName} e vorrei ricevere informazioni.`)}`
                : '';
              return (
                <div className="footer-contact-person" key={contact.id}>
                  <strong>{contact.name} {contact.role && <span>{contact.role}</span>}</strong>
                  {phoneHref && <a href={phoneHref}><SiteIcon name="phone" /> {contact.phone}</a>}
                  {whatsappHref && <a className="footer-whatsapp-contact" href={whatsappHref} target="_blank" rel="noopener noreferrer"><SiteIcon name="whatsapp" /> Scrivi su WhatsApp</a>}
                  {contact.email && <a href={`mailto:${contact.email}`}><SiteIcon name="mail" /> {contact.email}</a>}
                </div>
              );
            })}
            {(showBusinessContactPhone || showBusinessContactEmail) && (
              <div className="footer-contact-person">
                <strong>Contatto generale</strong>
                {showBusinessContactPhone && <a href={`tel:${businessContactPhone.replace(/[^\d+]/g, '')}`}><SiteIcon name="phone" /> {businessContactPhone}</a>}
                {showBusinessContactEmail && <a href={`mailto:${businessContactEmail}`}><SiteIcon name="mail" /> {businessContactEmail}</a>}
              </div>
            )}
            <a className="footer-address" href={mapsSearchUrl} target="_blank" rel="noreferrer">
              <SiteIcon name="pin" />
              <span><strong>Vieni a trovarci</strong>{publicAddress}</span>
              <span aria-hidden="true">↗</span>
            </a>
          </div>}
        </div>
        <section className="footer-hours" aria-labelledby="footer-hours-title">
          <div className="footer-hours-heading">
            <span className="footer-hours-icon"><SiteIcon name="clock" /></span>
            <div>
              <p className="eyebrow">ORARI DELLA CONCESSIONARIA</p>
              <h2 id="footer-hours-title">Orari di apertura</h2>
            </div>
          </div>
          <div className="footer-hours-grid">
            {(siteSettings.openingHours || DEFAULT_SITE_SETTINGS.openingHours).map((entry) => {
              const holidayToday = todaysHoliday && entry.day === todayWeekday;
              const closed = entry.closed || holidayToday;
              return (
                <div className={`footer-hours-day${closed ? ' is-closed' : ''}`} key={entry.day}>
                  <strong>{WEEKDAY_LABELS[entry.day]}</strong>
                  {closed ? (
                    <span className="footer-hours-closed">{holidayToday ? `Chiuso · ${todaysHoliday.label}` : 'Chiuso'}</span>
                  ) : (
                    <>
                      <span><time dateTime={entry.morningOpen}>{entry.morningOpen}</time> – <time dateTime={entry.morningClose}>{entry.morningClose}</time></span>
                      {entry.afternoonOpen && entry.afternoonClose
                        ? <span><time dateTime={entry.afternoonOpen}>{entry.afternoonOpen}</time> – <time dateTime={entry.afternoonClose}>{entry.afternoonClose}</time></span>
                        : <span className="footer-hours-closed">Pomeriggio chiuso</span>}
                    </>
                  )}
                </div>
              );
            })}
          </div>
          {upcomingHolidays.length > 0 && (
            <p className="footer-holiday-notice">
              Prossime chiusure: {upcomingHolidays.map((holiday) => `${new Date(`${holiday.date}T12:00:00`).toLocaleDateString('it-IT')} · ${holiday.label}`).join(' · ')}
            </p>
          )}
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
            <strong>{businessName}</strong>
            <span>{publicAddress}</span>
            {siteSettings.vatNumber && <span>Partita IVA: {siteSettings.vatNumber}</span>}
          </div>
          <p>Prezzi, disponibilità e condizioni possono variare in base al veicolo: contattaci per una conferma aggiornata.</p>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} {businessName} · Tutti i diritti riservati</span>
          <a href={isCatalogPage ? '/catalogo' : '/#home'} onClick={(event) => { event.preventDefault(); if (isCatalogPage) navigateToPath('/catalogo'); else navigateToHome(); }}>Torna all’inizio ↑</a>
        </div>
      </footer>}

      {!isAdminArea && !isAccountPage && !isUnknownVehiclePage && !isNotFoundPage && !isAdminRouteBlocked && !isSiteUnavailable && !isSiteSettingsLoading && gerardoWhatsappHref && user?.role !== 'admin' && (
        <a
          className="whatsapp-floating-link"
          href={gerardoWhatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Contatta l’amministratore Gerardo su WhatsApp"
        >
          <SiteIcon name="whatsapp" />
        </a>
      )}

      {purchaseRequestStatus.vehicleId === activeVehicle?.id && purchaseRequestStatus.error && (
        <div className="request-modal-alert" role="alert">
          <span className="request-modal-alert-icon" aria-hidden="true"><SiteIcon name="info" /></span>
          <span className="request-modal-alert-message">{purchaseRequestStatus.error}</span>
          <button
            className="request-modal-alert-dismiss"
            type="button"
            aria-label="Chiudi avviso"
            onClick={() => setPurchaseRequestStatus((current) => ({ ...current, error: '' }))}
          >
            <SiteIcon name="close" />
          </button>
        </div>
      )}

      {visitRequestStatus.vehicleId === activeVehicle?.id && visitRequestStatus.error && (
        <div className="request-modal-alert" role="alert">
          <span className="request-modal-alert-icon" aria-hidden="true"><SiteIcon name="info" /></span>
          <span className="request-modal-alert-message">{visitRequestStatus.error}</span>
          <button
            className="request-modal-alert-dismiss"
            type="button"
            aria-label="Chiudi avviso"
            onClick={() => setVisitRequestStatus((current) => ({ ...current, error: '', warning: false }))}
          >
            <SiteIcon name="close" />
          </button>
        </div>
      )}

      {purchaseRequestModalOpen && activeVehicle?.type === 'buy' && (
        <div
          className="dealer-visit-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !purchaseRequestBusyRef.current) {
              setPurchaseRequestModalOpen(false);
            }
          }}
        >
          <section
            className="dealer-visit-modal purchase-request-modal"
            id="purchase-request-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="purchase-request-modal-title"
            aria-describedby="purchase-request-modal-description"
            tabIndex="-1"
          >
            <span
              className="dealer-visit-modal-grabber"
              aria-hidden="true"
              onPointerDown={startRequestModalDrag}
              onPointerMove={moveRequestModalDrag}
              onPointerUp={finishRequestModalDrag}
              onPointerCancel={(event) => finishRequestModalDrag(event, true)}
            />
            <header className="dealer-visit-modal-header">
              <div>
                <p className="eyebrow"><SiteIcon name="car" /> RICHIESTA DI ACQUISTO</p>
                <h2 id="purchase-request-modal-title">Parliamone insieme.</h2>
                <p id="purchase-request-modal-description">
                  Non serve un account: inserisci i tuoi recapiti e ti ricontatteremo per la {activeVehicle.make} {activeVehicle.model}.
                </p>
              </div>
            </header>
            <form
              className="dealer-visit-request-form purchase-request-modal-form"
              noValidate
              onSubmit={(event) => {
                event.preventDefault();
                const form = event.currentTarget;
                const invalidField = Array.from(form.elements).find((field) => typeof field.checkValidity === 'function' && !field.checkValidity());
                if (invalidField) {
                  const fieldMessages = {
                    firstName: 'Inserisci il nome.',
                    lastName: 'Inserisci il cognome.',
                    email: 'Inserisci un indirizzo email valido.',
                    phone: 'Inserisci un numero di telefono valido.',
                    termsAccepted: 'Accetta i termini e le condizioni per proseguire.',
                  };
                  setPurchaseRequestStatus({
                    vehicleId: activeVehicle.id,
                    error: fieldMessages[invalidField.name] || 'Controlla i dati obbligatori prima di proseguire.',
                    message: '',
                  });
                  invalidField.focus();
                  return;
                }
                const formData = new FormData(event.currentTarget);
                submitPurchaseRequest(activeVehicle, {
                  firstName: formData.get('firstName'),
                  lastName: formData.get('lastName'),
                  email: formData.get('email'),
                  phone: formData.get('phone'),
                  termsAccepted: formData.get('termsAccepted') === 'on',
                });
              }}
              onChange={() => {
                if (purchaseRequestStatus.vehicleId === activeVehicle.id && purchaseRequestStatus.error) {
                  setPurchaseRequestStatus({ vehicleId: activeVehicle.id, error: '', message: '' });
                }
              }}
            >
              <label htmlFor="purchase-request-first-name">
                <span>Nome <span className="required-marker" aria-hidden="true">*</span></span>
                <span className="auth-input-wrap">
                  <SiteIcon className="auth-input-icon" name="people" aria-hidden="true" />
                  <input
                    id="purchase-request-first-name"
                    name="firstName"
                    type="text"
                    autoComplete="given-name"
                    minLength="1"
                    maxLength="80"
                    required
                    placeholder="Il tuo nome"
                    value={purchaseRequestFirstName}
                    onChange={(event) => setPurchaseRequestFirstName(event.target.value)}
                  />
                </span>
              </label>
              <label htmlFor="purchase-request-last-name">
                <span>Cognome <span className="required-marker" aria-hidden="true">*</span></span>
                <span className="auth-input-wrap">
                  <SiteIcon className="auth-input-icon" name="people" aria-hidden="true" />
                  <input
                    id="purchase-request-last-name"
                    name="lastName"
                    type="text"
                    autoComplete="family-name"
                    minLength="1"
                    maxLength="80"
                    required
                    placeholder="Il tuo cognome"
                    value={purchaseRequestLastName}
                    onChange={(event) => setPurchaseRequestLastName(event.target.value)}
                  />
                </span>
              </label>
              <label htmlFor="purchase-request-email">
                <span>Email <span className="required-marker" aria-hidden="true">*</span></span>
                <span className="auth-input-wrap">
                  <SiteIcon className="auth-input-icon" name="mail" aria-hidden="true" />
                  <input
                    id="purchase-request-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    maxLength="254"
                    required
                    placeholder="nome@esempio.it"
                    value={purchaseRequestEmail}
                    onChange={(event) => setPurchaseRequestEmail(event.target.value)}
                  />
                </span>
              </label>
              <label htmlFor="purchase-request-phone">
                <span>Telefono <span className="required-marker" aria-hidden="true">*</span></span>
                <span className="auth-input-wrap">
                  <SiteIcon className="auth-input-icon" name="phone" aria-hidden="true" />
                  <input
                    id="purchase-request-phone"
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    minLength="6"
                    maxLength="30"
                    required
                    value={purchaseRequestPhone}
                    onChange={(event) => setPurchaseRequestPhone(event.target.value)}
                    placeholder="+39 333 123 4567"
                    aria-describedby="purchase-request-phone-hint"
                  />
                </span>
              </label>
              <small id="purchase-request-phone-hint" className="purchase-request-phone-hint">
                Obbligatorio per poter inviare la richiesta.
              </small>
              <label className="request-terms-consent">
                <input name="termsAccepted" type="checkbox" required />
                <span>Accetto i termini e le condizioni.</span>
              </label>
              <button
                className="button button-accent detail-primary-action purchase-request-submit"
                type="submit"
                disabled={purchaseRequestBusy === activeVehicle.id}
              >
                <SiteIcon name="send" />
                <span>{purchaseRequestBusy === activeVehicle.id ? 'Invio richiesta…' : 'Richiedi acquisto'}</span>
                <SiteIcon className="vehicle-action-chevron" name="chevronRight" />
              </button>
            </form>
          </section>
        </div>
      )}

      {visitRequestModalOpen && activeVehicle && (
        <div
          className="dealer-visit-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !visitRequestBusyRef.current) {
              setVisitRequestModalOpen(false);
            }
          }}
        >
          <section
            className="dealer-visit-modal"
            id="dealer-visit-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="dealer-visit-modal-title"
            aria-describedby="dealer-visit-modal-description"
            tabIndex="-1"
          >
            <span
              className="dealer-visit-modal-grabber"
              aria-hidden="true"
              onPointerDown={startRequestModalDrag}
              onPointerMove={moveRequestModalDrag}
              onPointerUp={finishRequestModalDrag}
              onPointerCancel={(event) => finishRequestModalDrag(event, true)}
            />
            <header className="dealer-visit-modal-header">
              <div>
                <p className="eyebrow"><SiteIcon name="calendar" /> APPUNTAMENTO IN CONCESSIONARIA</p>
                <h2 id="dealer-visit-modal-title">Prenota una visita</h2>
                <p id="dealer-visit-modal-description">
                  Non serve un account: scegli quando vedere la {activeVehicle.make} {activeVehicle.model}. Ti contatteremo per confermare.
                </p>
              </div>
            </header>
            <form
              className="dealer-visit-request-form"
              key={activeVehicle.id}
              noValidate
              onSubmit={(event) => submitVisitRequest(event, activeVehicle)}
              onChange={() => {
                if (visitRequestStatus.vehicleId === activeVehicle.id && (visitRequestStatus.error || visitRequestStatus.message)) {
                  setVisitRequestStatus({ vehicleId: activeVehicle.id, error: '', message: '', warning: false });
                }
              }}
            >
              <div className="dealer-visit-date-fields">
                <label><span>Giorno</span>
                  <span className="auth-input-wrap">
                    <SiteIcon className="auth-input-icon" name="calendar" aria-hidden="true" />
                    <input name="visitDate" type="date" min={todayInBusinessTimeZone} required />
                  </span>
                </label>
                <label><span>Orario</span>
                  <span className="auth-input-wrap">
                    <SiteIcon className="auth-input-icon" name="clock" aria-hidden="true" />
                    <input name="visitTime" type="time" required />
                  </span>
                </label>
              </div>
              <label><span>Nome e cognome</span>
                <span className="auth-input-wrap">
                  <SiteIcon className="auth-input-icon" name="people" aria-hidden="true" />
                  <input name="name" autoComplete="name" minLength="2" maxLength="80" defaultValue={user?.name || ''} placeholder="Il tuo nome e cognome" required />
                </span>
              </label>
              <label><span>Email</span>
                <span className="auth-input-wrap">
                  <SiteIcon className="auth-input-icon" name="mail" aria-hidden="true" />
                  <input name="email" type="email" autoComplete="email" maxLength="254" defaultValue={user?.email || ''} placeholder="nome@esempio.it" required />
                </span>
              </label>
              <label><span>Telefono</span>
                <span className="auth-input-wrap">
                  <SiteIcon className="auth-input-icon" name="phone" aria-hidden="true" />
                  <input name="phone" type="tel" autoComplete="tel" minLength="6" maxLength="30" placeholder="+39 333 123 4567" required />
                </span>
              </label>
              <label><span>Note <span className="rental-optional-label">facoltative</span></span>
                <span className="auth-input-wrap auth-textarea-wrap">
                  <SiteIcon className="auth-input-icon" name="info" aria-hidden="true" />
                  <textarea name="message" rows="2" maxLength="1000" placeholder="Aggiungi un messaggio per il concessionario." />
                </span>
              </label>
              <label className="request-terms-consent">
                <input name="termsAccepted" type="checkbox" required />
                <span>Accetto i termini e le condizioni.</span>
              </label>
              <button className="button button-accent detail-primary-action" type="submit" disabled={visitRequestBusy === activeVehicle.id}>
                <SiteIcon name="send" />
                <span>{visitRequestBusy === activeVehicle.id ? 'Invio richiesta…' : 'Richiedi visita'}</span>
                <SiteIcon className="vehicle-action-chevron" name="chevronRight" />
              </button>
            </form>
          </section>
        </div>
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
      </>}

      {authMode && (
        <div className={`modal-backdrop${adminPinRequired ? ' admin-pin-backdrop' : ''}`} onMouseDown={(event) => { if (event.target === event.currentTarget && !adminPinRequired) closeAuth(); }}>
          <section className={adminPinRequired ? 'admin-pin-modal' : 'auth-modal'} role={adminPinRequired ? 'main' : 'dialog'} aria-modal={adminPinRequired ? undefined : 'true'} aria-labelledby="auth-title">
            <button className={`modal-close${adminPinRequired ? ' modal-exit' : ''}`} type="button" aria-label={adminPinRequired ? 'Esci e annulla la verifica' : 'Chiudi la finestra'} onClick={adminPinRequired ? handleLogout : closeAuth}><svg className="close-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg></button>
            {!adminPinRequired && (
              <a className="brand modal-brand" href="#home" onClick={closeAuth}>
                <img className="brand-logo" src={siteSettings.logoUrl || DEFAULT_SITE_SETTINGS.logoUrl} alt={businessName} />
              </a>
            )}
            {adminPinRequired && (
              <div className="admin-pin-hero" aria-hidden="true">
                <span className="admin-pin-hero-orbit admin-pin-hero-orbit-outer" />
                <span className="admin-pin-hero-orbit admin-pin-hero-orbit-inner" />
                <svg className="admin-pin-hero-shield" viewBox="0 0 180 200" fill="none">
                  <path className="admin-pin-shield-outline" d="M90 8 162 35v51c0 48-30 83-72 105C48 169 18 134 18 86V35L90 8Z" />
                  <path className="admin-pin-shield-inner" d="M90 22 149 44v42c0 39-23 69-59 89-36-20-59-50-59-89V44l59-22Z" />
                  <rect className="admin-pin-lock-body" x="57" y="86" width="66" height="55" rx="8" />
                  <path className="admin-pin-lock-arch" d="M70 87V67a20 20 0 0 1 40 0v20" />
                  <circle className="admin-pin-lock-keyhole" cx="90" cy="109" r="6" />
                  <path className="admin-pin-lock-keyhole" d="m87 113-3 15h12l-3-15" />
                </svg>
              </div>
            )}
            <p className={`eyebrow${adminPinRequired ? ' admin-pin-eyebrow' : ''}`}>{!adminPinRequired && <ShieldCheck aria-hidden="true" />}{adminPinRequired ? 'ACCESSO AMMINISTRATORE · LIVELLO 02' : authMode === 'signup' ? 'IL TUO PROSSIMO VIAGGIO' : 'BENTORNATO'}</p>
            <h2 id="auth-title">
              {adminPinRequired
                ? <>SEZIONE <span className="admin-pin-title-accent">RISERVATA</span></>
                : authMode === 'signup' ? 'Crea il tuo account.' : 'Che piacere rivederti.'}
            </h2>
            <p className={`auth-intro${adminPinRequired ? ' admin-pin-tagline' : ''}`}>
              {adminPinRequired
                ? 'ACCESSO LIMITATO E STRETTAMENTE CONTROLLATO'
                : authMode === 'signup' ? 'Salva i tuoi dati e preparati alla prossima partenza.' : 'Accedi per continuare da dove eri rimasto.'}
            </p>
            {adminPinRequired && (
              <>
                <div className="admin-pin-divider" aria-hidden="true">
                  <span />
                  <svg viewBox="0 0 24 24" fill="none">
                    <rect x="5" y="10" width="14" height="11" rx="2" />
                    <path d="M8 10V7a4 4 0 1 1 8 0v3m-4 4v3" />
                  </svg>
                  <span />
                </div>
                <p className="admin-pin-description">{adminTotpRequired
                  ? 'Questa sezione è protetta. Inserisci il codice dell’app autenticatore o un codice di recupero.'
                  : 'Questa sezione è protetta e accessibile solo a personale autorizzato. Inserisci il tuo PIN per proseguire.'}</p>
              </>
            )}
            {adminPinRequired && (
              <div className={`admin-pin-countdown${adminPinSecondsRemaining <= 10 ? ' is-critical' : ''}`} role="timer" aria-label={`Tempo rimanente ${formatAdminPinCountdown(adminPinSecondsRemaining)}`}>
                <span className="admin-pin-countdown-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="13" r="8" />
                    <path d="M12 9v4l2.5 1.5M9 2h6m-3 0v3" />
                  </svg>
                </span>
                <span className="admin-pin-countdown-copy">
                  <strong>{adminTotpRequired ? 'Verifica TOTP' : 'Tempo residuo'}</strong>
                  <span>{adminPinSecondsRemaining > 0 ? 'Conferma entro' : 'Tempo scaduto'}</span>
                </span>
                <strong className="admin-pin-countdown-value">{formatAdminPinCountdown(adminPinSecondsRemaining)}</strong>
              </div>
            )}
            {adminPinRequired && (
              <p className="admin-pin-security-note">
                <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path d="M10 2.5 18 17H2L10 2.5Z" />
                  <path d="M10 7v4m0 2.5v.1" />
                </svg>
                <span>{adminTotpRequired
                  ? 'Usa un codice TOTP attuale o un codice di recupero non ancora utilizzato.'
                  : '3 tentativi disponibili · dopo 3 errori l’accesso si blocca per 30 minuti.'}</span>
              </p>
            )}
            <form
              className={`auth-form${adminPinRequired ? ' admin-pin-form' : ''}`}
              autoComplete={adminPinRequired ? 'off' : undefined}
              noValidate
              onSubmit={handleAuthSubmit}
              onChange={(event) => {
                const field = event.target.name;
                if (field) {
                  if (authMode === 'admin-pin') {
                    if (authFieldErrors[field]) {
                      const values = Object.fromEntries(new FormData(event.currentTarget).entries());
                      const errors = validateAuthValues(authMode, values, adminTotpRequired);
                      if (!errors[field]) setAuthFieldErrors(errors);
                    }
                  } else {
                    const values = Object.fromEntries(new FormData(event.currentTarget).entries());
                    setAuthFormValues(values);
                    setAuthTouchedFields((current) => ({ ...current, [field]: true }));
                    setAuthFieldErrors(validateAuthValues(authMode, values, adminTotpRequired));
                  }
                }
                if (authError) setAuthError('');
              }}
            >
              {adminPinRequired && !adminTotpRequired ? (
                <label>
                  PIN AMMINISTRATORE · 4 CIFRE
                  <span className={`password-input-wrap admin-pin-field-wrap${adminPinSecondsRemaining <= 0 ? ' is-disabled' : ''}`}>
                    <svg className="admin-pin-input-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <rect x="5" y="10" width="14" height="11" rx="2" />
                      <path d="M8 10V7a4 4 0 1 1 8 0v3m-4 4v3" />
                    </svg>
                    <input className={`admin-pin-input${passwordVisible ? ' is-visible' : ''}`} name="pin" type="text" inputMode="numeric" pattern="[0-9]{4}" autoComplete="off" maxLength="4" placeholder="••••" aria-label="Codice amministratore di 4 cifre" aria-invalid={Boolean(authFieldErrors.pin)} aria-describedby={authFieldErrors.pin ? 'auth-pin-error' : undefined} required autoFocus disabled={adminPinSecondsRemaining <= 0} />
                    <VisibilityToggle visible={passwordVisible} onToggle={() => setPasswordVisible((visible) => !visible)} />
                  </span>
                  {authFieldErrors.pin && <span className="auth-field-error" id="auth-pin-error" role="alert">{authFieldErrors.pin}</span>}
                  {adminPinSecondsRemaining <= 0 && <span className="admin-pin-expired-note" role="status">Per continuare, esci e accedi di nuovo.</span>}
                </label>
              ) : adminPinRequired && adminTotpRequired ? (
                <label>
                  CODICE TOTP O CODICE DI RECUPERO
                  <span className={`password-input-wrap admin-pin-field-wrap${adminPinSecondsRemaining <= 0 ? ' is-disabled' : ''}`}>
                    <svg className="admin-pin-input-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <rect x="4" y="4" width="16" height="16" rx="3" />
                      <path d="M8 9h.01M12 9h.01M16 9h.01M8 13h.01M12 13h.01M16 13h.01M8 17h8" />
                    </svg>
                    <input className="admin-pin-input" name="code" type="text" inputMode="text" autoComplete="off" maxLength="32" placeholder="000000" aria-label="Codice TOTP o codice di recupero" aria-invalid={Boolean(authFieldErrors.code)} aria-describedby={authFieldErrors.code ? 'auth-code-error' : undefined} required autoFocus disabled={adminPinSecondsRemaining <= 0} />
                  </span>
                  {authFieldErrors.code && <span className="auth-field-error" id="auth-code-error" role="alert">{authFieldErrors.code}</span>}
                  {adminPinSecondsRemaining <= 0 && <span className="admin-pin-expired-note" role="status">Per continuare, esci e accedi di nuovo.</span>}
                </label>
              ) : authMode === 'signup' && (
                <label>
                  <span className="auth-input-wrap">
                    <UserRound className="auth-input-icon" aria-hidden="true" />
                    <input name="name" type="text" autoComplete="name" minLength="2" maxLength="80" placeholder="Nome e cognome" aria-label="Nome e cognome" aria-invalid={Boolean(authTouchedFields.name && authFieldErrors.name)} aria-describedby={authTouchedFields.name && authFieldErrors.name ? 'auth-name-error' : undefined} required />
                  </span>
                  {authTouchedFields.name && authFieldErrors.name && <span className="auth-field-error" id="auth-name-error" role="alert">{authFieldErrors.name}</span>}
                </label>
              )}
              {!adminPinRequired && (
                <>
                  <label>
                    <span className="auth-input-wrap">
                      <Mail className="auth-input-icon" aria-hidden="true" />
                      <input
                        name="email"
                        type={authMode === 'signup' ? 'email' : 'text'}
                        autoComplete={authMode === 'signup' ? 'email' : 'username'}
                        maxLength="254"
                        placeholder={authMode === 'signup' ? 'Email' : 'Email o username'}
                        aria-label={authMode === 'signup' ? 'Email' : 'Email o username'}
                        aria-invalid={Boolean(authTouchedFields.email && authFieldErrors.email)}
                        aria-describedby={authTouchedFields.email && authFieldErrors.email ? 'auth-email-error' : undefined}
                        required
                      />
                    </span>
                    {authTouchedFields.email && authFieldErrors.email && <span className="auth-field-error" id="auth-email-error" role="alert">{authFieldErrors.email}</span>}
                  </label>
                  <label>
                    <span className="password-input-wrap auth-input-wrap">
                      <LockKeyhole className="auth-input-icon" aria-hidden="true" />
                      <input name="password" type={passwordVisible ? 'text' : 'password'} autoComplete={authMode === 'signup' ? 'new-password' : 'current-password'} minLength={authMode === 'signup' ? '8' : undefined} maxLength="72" placeholder="Password" aria-label="Password" aria-invalid={Boolean(authTouchedFields.password && authFieldErrors.password)} aria-describedby={authTouchedFields.password && authFieldErrors.password ? 'auth-password-error' : undefined} required />
                      <VisibilityToggle visible={passwordVisible} onToggle={() => setPasswordVisible((visible) => !visible)} />
                    </span>
                    {authTouchedFields.password && authFieldErrors.password && <span className="auth-field-error" id="auth-password-error" role="alert">{authFieldErrors.password}</span>}
                    {authMode === 'signup' && (
                      <div className="auth-password-guidance">
                        <div className="auth-password-guidance-heading">
                          <span>La password deve includere</span>
                          <span>{completedPasswordRequirements}/{passwordRequirements.length}</span>
                        </div>
                        <div className="auth-password-progress" role="progressbar" aria-label="Requisiti password completati" aria-valuemin="0" aria-valuemax={passwordRequirements.length} aria-valuenow={completedPasswordRequirements}>
                          <span style={{ width: `${(completedPasswordRequirements / passwordRequirements.length) * 100}%` }} />
                        </div>
                        <div className="auth-password-checks">
                          {passwordRequirements.map((requirement) => (
                            <span className={requirement.valid ? 'is-valid' : ''} key={requirement.key}>
                              <span aria-hidden="true">{requirement.valid ? <Check /> : <Circle />}</span>
                              {requirement.label}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </label>
                  {authMode === 'signup' && (
                    <label>
                      <span className="auth-input-wrap">
                        <LockKeyhole className="auth-input-icon" aria-hidden="true" />
                        <input
                          name="confirmPassword"
                          type="password"
                          autoComplete="new-password"
                          maxLength="72"
                          placeholder="Conferma password"
                          aria-label="Conferma password"
                          aria-invalid={Boolean(authTouchedFields.confirmPassword && authFieldErrors.confirmPassword)}
                          aria-describedby={authTouchedFields.confirmPassword && authFieldErrors.confirmPassword ? 'auth-confirm-password-error' : undefined}
                          required
                        />
                      </span>
                      {authTouchedFields.confirmPassword && authFieldErrors.confirmPassword && <span className="auth-field-error" id="auth-confirm-password-error" role="alert">{authFieldErrors.confirmPassword}</span>}
                    </label>
                  )}
                </>
              )}
              {authError && <p className="form-error" role="alert">{authError}</p>}
              <button className={`button button-accent form-submit ${adminPinRequired ? 'header-glossy-accent' : 'auth-submit-pill'}`} type="submit" disabled={authBusy || (!authReady && authMode !== 'admin-pin') || (adminPinRequired && adminPinSecondsRemaining <= 0)}>
                {adminPinRequired ? (
                  adminPinSecondsRemaining <= 0 ? 'Tempo scaduto' : 'Accedi'
                ) : authMode === 'signup' ? (
                  <>
                    <UserPlus className="auth-submit-register-icon" aria-hidden="true" />
                    <span className="auth-login-divider" aria-hidden="true" />
                    <span className="auth-login-label">{authBusy ? 'Attendi…' : !authReady ? 'Verifica…' : 'Registrati'}</span>
                    <ArrowRight className="auth-login-arrow" aria-hidden="true" />
                  </>
                ) : (
                  <>
                    <UserRound className="auth-login-user-icon" aria-hidden="true" />
                    <span className="auth-login-divider" aria-hidden="true" />
                    <span className="auth-login-label">{authBusy ? 'Attendi…' : !authReady ? 'Verifica…' : 'Accedi'}</span>
                    <ArrowRight className="auth-login-arrow" aria-hidden="true" />
                  </>
                )}
              </button>
            </form>
            {adminPinRequired && (
              <div className="admin-pin-denial-warning">
                <span className="admin-pin-denial-rule" aria-hidden="true" />
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M12 3 22 21H2L12 3Z" />
                  <path d="M12 9v5m0 3v.1" />
                </svg>
                <span>Accesso non autorizzato è severamente vietato.</span>
                <span className="admin-pin-denial-rule" aria-hidden="true" />
              </div>
            )}
            {!adminPinRequired && <p className="auth-switch">
              {authMode === 'signup' ? 'Hai già un account?' : `È la tua prima volta su ${businessName}?`}
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
    </RouteStyleBoundary>
  );
}

export default App;
