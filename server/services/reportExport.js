const EVENT_TYPES = [
  'ip_rule_added',
  'ip_rule_removed',
  'traffic_limits_updated',
  'password_changed',
  'pin_changed',
  'email_verification_requested',
  'email_updated',
  'notification_email_added',
  'notification_email_removed',
  'ip_blocked',
  'ip_throttled',
  'traffic_limit_reached',
  'admin_account_created',
  'admin_account_removed',
];

const EVENT_LABELS = {
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

const pdfNumberFormat = new Intl.NumberFormat('it-IT', { maximumFractionDigits: 2 });
const pdfCurrencyFormat = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

function parseDate(value, fallback) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return fallback;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) ? date : fallback;
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeReportFilters(query = {}) {
  const now = new Date();
  const defaultFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const from = parseDate(query.from, defaultFrom);
  const toDate = parseDate(query.to, now);
  const to = new Date(toDate.getTime() + 24 * 60 * 60 * 1000 - 1);
  if (to < from) throw new Error('Il periodo selezionato non è valido.');
  if (to.getTime() - from.getTime() > 366 * 24 * 60 * 60 * 1000) {
    throw new Error('Il periodo massimo esportabile è di 366 giorni.');
  }
  const eventType = typeof query.eventType === 'string' && EVENT_TYPES.includes(query.eventType)
    ? query.eventType
    : '';
  const ipAddress = typeof query.ipAddress === 'string' ? query.ipAddress.trim().slice(0, 45) : '';
  const search = typeof query.search === 'string' ? query.search.trim().slice(0, 120) : '';
  return { from, to, eventType, ipAddress, search };
}

async function loadSecurityReport(EventModel, query) {
  const filters = normalizeReportFilters(query);
  const filter = { createdAt: { $gte: filters.from, $lte: filters.to } };
  if (filters.eventType) filter.type = filters.eventType;
  if (filters.ipAddress) filter.ipAddress = filters.ipAddress;
  if (filters.search) {
    const searchRegex = escapeRegex(filters.search);
    filter.$or = [
      { details: { $regex: searchRegex, $options: 'i' } },
      { type: { $regex: searchRegex, $options: 'i' } },
      { ipAddress: { $regex: searchRegex, $options: 'i' } },
    ];
  }
  const events = await EventModel.find(filter)
    .sort({ createdAt: -1 })
    .limit(10000)
    .populate('actorId', 'name username email')
    .lean();
  const rows = events.map((event) => ({
    date: event.createdAt,
    type: event.type,
    label: EVENT_LABELS[event.type] || 'Evento sicurezza',
    actor: event.actorId?.username || event.actorId?.name || event.actorId?.email || 'Sistema',
    ipAddress: event.ipAddress || '',
    details: event.details || '',
  }));
  return {
    filters: {
      from: filters.from.toISOString().slice(0, 10),
      to: filters.to.toISOString().slice(0, 10),
      eventType: filters.eventType,
      ipAddress: filters.ipAddress,
      search: filters.search,
    },
    columns: [
      { key: 'date', label: 'Data' },
      { key: 'type', label: 'Tipo' },
      { key: 'label', label: 'Etichetta' },
      { key: 'actor', label: 'Attore' },
      { key: 'ipAddress', label: 'Indirizzo IP' },
      { key: 'details', label: 'Dettagli' },
    ],
    pdfColumns: ['date', 'label', 'actor', 'ipAddress'],
    summary: {
      total: rows.length,
      byType: rows.reduce((counts, row) => {
        counts[row.type] = (counts[row.type] || 0) + 1;
        return counts;
      }, {}),
    },
    rows,
  };
}

function normalizeDataReportFilters(query = {}) {
  const now = new Date();
  const defaultFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const from = parseDate(query.from, defaultFrom);
  const toDate = parseDate(query.to, now);
  const to = new Date(toDate.getTime() + 24 * 60 * 60 * 1000 - 1);
  if (to < from) throw new Error('Il periodo selezionato non è valido.');
  if (to.getTime() - from.getTime() > 366 * 24 * 60 * 60 * 1000) {
    throw new Error('Il periodo massimo esportabile è di 366 giorni.');
  }
  const search = typeof query.search === 'string' ? query.search.trim().slice(0, 120) : '';
  return {
    from: from.toISOString().slice(0, 10),
    to: toDate.toISOString().slice(0, 10),
    fromDate: from,
    toDate: to,
    search,
  };
}

async function loadCollectionReport(collection, query, config) {
  const filters = normalizeDataReportFilters(query);
  const filter = {
    ...(config.baseFilter || {}),
    [config.dateField || 'createdAt']: { $gte: filters.fromDate, $lte: filters.toDate },
  };
  if (filters.search && config.searchFields?.length) {
    filter.$or = config.searchFields.map((field) => ({ [field]: { $regex: escapeRegex(filters.search), $options: 'i' } }));
  }
  const records = await collection.find(filter).sort({ [config.dateField || 'createdAt']: -1 }).limit(10000).toArray();
  const rows = records.map(config.mapRow);
  return {
    filters: { from: filters.from, to: filters.to, search: filters.search },
    columns: config.columns,
    pdfColumns: config.pdfColumns || config.columns.slice(0, 4).map((column) => column.key),
    summary: { total: rows.length },
    rows,
  };
}

function createVehicleReport(vehicle) {
  const row = {
    vehicle: `${vehicle.year || ''} ${vehicle.make || ''} ${vehicle.model || ''}`.trim(),
    type: vehicle.type === 'rent' ? 'Noleggio' : 'Vendita',
    price: vehicle.price ?? '',
    discountPrice: vehicle.discountPrice ?? '',
    discountEndsAt: vehicle.discountEndsAt || '',
    vatMode: vehicle.vatMode || '',
    mileageKm: vehicle.mileageKm ?? '',
    fuel: vehicle.fuel || '',
    transmission: vehicle.transmission || '',
    bodyType: vehicle.bodyType || '',
    color: vehicle.color || '',
    power: vehicle.power || [
      vehicle.powerCv ? `${vehicle.powerCv} CV` : '',
      vehicle.powerKw ? `${vehicle.powerKw} kW` : '',
    ].filter(Boolean).join(' · '),
    engine: vehicle.engine || '',
    engineDisplacementCc: vehicle.engineDisplacementCc ?? '',
    cylinders: vehicle.cylinders ?? '',
    drivetrain: vehicle.drivetrain || '',
    doors: vehicle.doors ?? '',
    seats: vehicle.seats ?? '',
    trunkCapacityLitres: vehicle.trunkCapacityLitres ?? '',
    firstRegistration: vehicle.firstRegistration || '',
    condition: vehicle.condition || '',
    previousOwners: vehicle.previousOwners ?? '',
    warrantyMonths: vehicle.warrantyMonths ?? '',
    warrantyCoverage: Array.isArray(vehicle.warrantyCoverage) ? vehicle.warrantyCoverage.join(', ') : '',
    lastService: vehicle.lastService || '',
    inspectionYear: vehicle.inspectionYear ?? '',
    noviceDriverEligible: vehicle.noviceDriverEligible || '',
    consumptionCombined: vehicle.consumptionCombined ?? '',
    consumptionUnit: vehicle.consumptionUnit || '',
    emissionsClass: vehicle.emissionsClass || '',
    co2Emissions: vehicle.co2Emissions ?? '',
    torqueNm: vehicle.torqueNm ?? '',
    accelerationSeconds: vehicle.accelerationSeconds ?? '',
    topSpeedKmh: vehicle.topSpeedKmh ?? '',
    maintenanceHistory: vehicle.maintenanceHistory || '',
    installmentPlan: vehicle.installmentPlan
      ? `${vehicle.installmentPlan.monthlyAmount} EUR al mese per ${vehicle.installmentPlan.months} mesi`
      : '',
    label: vehicle.label || '',
    description: vehicle.description || '',
    features: Array.isArray(vehicle.features) ? vehicle.features.join(', ') : '',
    images: Array.isArray(vehicle.images) ? vehicle.images.join(', ') : '',
  };
  const columns = [
    ['vehicle', 'Veicolo'], ['type', 'Destinazione'], ['price', 'Prezzo'], ['discountPrice', 'Prezzo scontato'],
    ['discountEndsAt', 'Scadenza sconto'], ['vatMode', 'Modalita IVA'], ['mileageKm', 'Chilometraggio (km)'],
    ['fuel', 'Alimentazione'], ['transmission', 'Cambio'], ['bodyType', 'Carrozzeria'], ['color', 'Colore'],
    ['power', 'Potenza'], ['engine', 'Motore'], ['engineDisplacementCc', 'Cilindrata (cm3)'], ['cylinders', 'Cilindri'],
    ['drivetrain', 'Trazione'], ['doors', 'Porte'], ['seats', 'Posti'], ['trunkCapacityLitres', 'Capacita bagagliaio (l)'],
    ['firstRegistration', 'Prima immatricolazione'], ['condition', 'Condizione'], ['previousOwners', 'Precedenti proprietari'],
    ['warrantyMonths', 'Garanzia (mesi)'], ['warrantyCoverage', 'Componenti coperti'], ['lastService', 'Ultimo tagliando'],
    ['inspectionYear', 'Revisione valida fino al'], ['noviceDriverEligible', 'Idoneita neopatentati'],
    ['consumptionCombined', 'Consumo combinato'], ['consumptionUnit', 'Unita di consumo'], ['emissionsClass', 'Classe emissioni'],
    ['co2Emissions', 'Emissioni CO2 (g/km)'], ['torqueNm', 'Coppia (Nm)'], ['accelerationSeconds', 'Accelerazione 0-100 km/h (s)'],
    ['topSpeedKmh', 'Velocita massima (km/h)'], ['maintenanceHistory', 'Storico manutenzione'],
    ['installmentPlan', 'Piano rateale'], ['label', 'Etichetta'], ['description', 'Descrizione'],
    ['features', 'Dotazioni'], ['images', 'Immagini'],
  ].map(([key, label]) => ({ key, label }));
  return {
    filters: { from: '', to: '', search: '' },
    columns,
    pdfColumns: ['vehicle', 'type', 'price', 'description'],
    summary: { total: 1 },
    rows: [row],
  };
}

function xmlEscape(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function columnName(index) {
  let name = '';
  let value = index + 1;
  while (value > 0) {
    const remainder = (value - 1) % 26;
    name = String.fromCharCode(65 + remainder) + name;
    value = Math.floor((value - 1) / 26);
  }
  return name;
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function zipStore(files) {
  const localParts = [];
  const centralParts = [];
  let offset = 0;
  files.forEach(({ name, content }) => {
    const nameBuffer = Buffer.from(name);
    const data = Buffer.isBuffer(content) ? content : Buffer.from(content);
    const checksum = crc32(data);
    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0, 6);
    localHeader.writeUInt16LE(0, 8);
    localHeader.writeUInt16LE(0, 10);
    localHeader.writeUInt16LE(0, 12);
    localHeader.writeUInt32LE(checksum, 14);
    localHeader.writeUInt32LE(data.length, 18);
    localHeader.writeUInt32LE(data.length, 22);
    localHeader.writeUInt16LE(nameBuffer.length, 26);
    localHeader.writeUInt16LE(0, 28);
    localParts.push(localHeader, nameBuffer, data);

    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE(20, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt16LE(0, 8);
    centralHeader.writeUInt16LE(0, 10);
    centralHeader.writeUInt16LE(0, 12);
    centralHeader.writeUInt16LE(0, 14);
    centralHeader.writeUInt32LE(checksum, 16);
    centralHeader.writeUInt32LE(data.length, 20);
    centralHeader.writeUInt32LE(data.length, 24);
    centralHeader.writeUInt16LE(nameBuffer.length, 28);
    centralHeader.writeUInt16LE(0, 30);
    centralHeader.writeUInt16LE(0, 32);
    centralHeader.writeUInt16LE(0, 34);
    centralHeader.writeUInt16LE(0, 36);
    centralHeader.writeUInt32LE(0, 38);
    centralHeader.writeUInt32LE(offset, 42);
    centralParts.push(centralHeader, nameBuffer);
    offset += localHeader.length + nameBuffer.length + data.length;
  });
  const centralDirectory = Buffer.concat(centralParts);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(centralDirectory.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...localParts, centralDirectory, end]);
}

function buildXlsx(report, title) {
  const columns = report.columns || [
    { key: 'date', label: 'Data' },
    { key: 'type', label: 'Tipo' },
    { key: 'label', label: 'Etichetta' },
    { key: 'actor', label: 'Attore' },
    { key: 'ipAddress', label: 'Indirizzo IP' },
    { key: 'details', label: 'Dettagli' },
  ];
  const headers = columns.map((column) => column.label);
  const emptyColumns = Array(Math.max(0, columns.length - 2)).fill('');
  const rows = [
    ['Report', title, ...emptyColumns],
    ['Periodo', report.filters.from ? `${report.filters.from} - ${report.filters.to}` : 'Scheda veicolo', ...emptyColumns],
    ['Totale record', report.summary.total, ...emptyColumns],
    [],
    headers,
    ...report.rows.map((row) => columns.map((column) => row[column.key])),
  ];
  const sheetRows = rows.map((row, rowIndex) => `<row r="${rowIndex + 1}">${row.map((value, columnIndex) => {
    const cell = String(value ?? '');
    const ref = `${columnName(columnIndex)}${rowIndex + 1}`;
    return `<c r="${ref}" t="inlineStr"><is><t>${xmlEscape(cell)}</t></is></c>`;
  }).join('')}</row>`).join('');
  const sheet = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${sheetRows}</sheetData><autoFilter ref="A5:${columnName(columns.length - 1)}${rows.length}" /></worksheet>`;
  return zipStore([
    { name: '[Content_Types].xml', content: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>' },
    { name: '_rels/.rels', content: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>' },
    { name: 'xl/workbook.xml', content: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Eventi" sheetId="1" r:id="rId1"/></sheets></workbook>' },
    { name: 'xl/_rels/workbook.xml.rels', content: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>' },
    { name: 'xl/worksheets/sheet1.xml', content: sheet },
  ]);
}

function pdfText(value) {
  const substitutions = {
    '\u2019': "'",
    '\u2018': "'",
    '\u2013': '-',
    '\u2014': '-',
    '\u00b7': '/',
    '\u00e0': 'a',
    '\u00e8': 'e',
    '\u00e9': 'e',
    '\u00ec': 'i',
    '\u00f2': 'o',
    '\u00f9': 'u',
    '\u20ac': 'EUR',
    '\u2082': '2',
    '\u00b3': '3',
  };
  return String(value ?? '')
    .replace(/[^\x00-\xff]/g, (character) => substitutions[character] || '?')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x20-\x7e]/g, '?')
    .replace(/([\\()])/g, '\\$1');
}

function createPdfDocument(reportLines) {
  const pages = [];
  const linesPerPage = 42;
  for (let index = 0; index < reportLines.length; index += linesPerPage) pages.push(reportLines.slice(index, index + linesPerPage));
  if (!pages.length) pages.push([]);
  const objects = [];
  const pageIds = [];
  const addObject = (content) => { objects.push(content); return objects.length; };
  const fontId = addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  pages.forEach((lines) => {
    const content = ['BT', '/F1 9 Tf', '50 760 Td', ...lines.flatMap((line, index) => [
      `(${pdfText(line)}) Tj`,
      index < lines.length - 1 ? '0 -16 Td' : '',
    ]).filter(Boolean), 'ET'].join('\n');
    const contentId = addObject(`<< /Length ${Buffer.byteLength(content, 'latin1')} >>\nstream\n${content}\nendstream`);
    const pageId = addObject(`<< /Type /Page /Parent 0 0 R /MediaBox [0 0 595 842] /Resources << /ProcSet [/PDF /Text] /Font << /F1 ${fontId} 0 R >> >> /Contents ${contentId} 0 R >>`);
    pageIds.push(pageId);
  });
  const pagesId = addObject(`<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageIds.length} >>`);
  pageIds.forEach((id) => { objects[id - 1] = objects[id - 1].replace('/Parent 0 0 R', `/Parent ${pagesId} 0 R`); });
  const catalogId = addObject(`<< /Type /Catalog /Pages ${pagesId} 0 R >>`);
  let body = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets[index + 1] = Buffer.byteLength(body, 'latin1');
    body += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = Buffer.byteLength(body, 'latin1');
  body += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let index = 1; index <= objects.length; index += 1) body += `${String(offsets[index]).padStart(10, '0')} 00000 n \n`;
  body += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return Buffer.from(body, 'latin1');
}

function buildPdf(report, title) {
  const reportLines = [
    title,
    report.filters.from ? `Periodo: ${report.filters.from} - ${report.filters.to}` : 'Scheda veicolo',
    `Record trovati: ${report.summary.total}`,
    '',
    report.pdfColumns.map((key) => report.columns.find((column) => column.key === key)?.label || key).join(' | '),
    ...report.rows.map((row) => report.pdfColumns.map((key) => {
      const value = row[key];
      return value instanceof Date ? value.toISOString().slice(0, 19).replace('T', ' ') : String(value ?? '-').slice(0, 24);
    }).join(' | ')),
  ];
  return createPdfDocument(reportLines);
}

function wrapPdfText(value, maxLength = 92) {
  const words = String(value ?? '').replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);
  const lines = [];
  let line = '';
  words.forEach((word) => {
    let remaining = word;
    while (remaining.length > maxLength) {
      if (line) {
        lines.push(line);
        line = '';
      }
      lines.push(remaining.slice(0, maxLength));
      remaining = remaining.slice(maxLength);
    }
    if (!remaining) return;
    if (line && line.length + remaining.length + 1 > maxLength) {
      lines.push(line);
      line = remaining;
    } else {
      line = line ? `${line} ${remaining}` : remaining;
    }
  });
  if (line) lines.push(line);
  return lines.length ? lines : [''];
}

function formatVehiclePdfValue(key, value) {
  if (key === 'images') {
    const imageCount = Array.isArray(value)
      ? value.length
      : String(value || '').split(/,\s/).filter(Boolean).length;
    return imageCount ? `${imageCount} foto disponibili nella galleria` : 'Non specificato';
  }
  if (value === '' || value === null || value === undefined) return 'Non specificato';
  if (value instanceof Date) return value.toLocaleDateString('it-IT');
  if (key === 'price' || key === 'discountPrice') return pdfCurrencyFormat.format(Number(value));
  if (key === 'mileageKm') return `${pdfNumberFormat.format(Number(value))} km`;
  if (key === 'engineDisplacementCc') return `${pdfNumberFormat.format(Number(value))} cm\u00b3`;
  if (key === 'trunkCapacityLitres') return `${pdfNumberFormat.format(Number(value))} l`;
  if (key === 'consumptionCombined') return pdfNumberFormat.format(Number(value));
  if (key === 'co2Emissions') return `${pdfNumberFormat.format(Number(value))} g/km`;
  if (key === 'torqueNm') return `${pdfNumberFormat.format(Number(value))} Nm`;
  if (key === 'accelerationSeconds') return `${pdfNumberFormat.format(Number(value))} s`;
  if (key === 'topSpeedKmh') return `${pdfNumberFormat.format(Number(value))} km/h`;
  if (key === 'noviceDriverEligible') {
    if (value === 'yes') return 'Idoneo';
    if (value === 'no') return 'Non idoneo';
    return 'Non specificato';
  }
  if (key === 'warrantyMonths') return Number(value) === 0 ? 'Non prevista' : `${value} mesi`;
  return String(value);
}

function buildVehiclePdf(report, title) {
  const row = report.rows[0] || {};
  const reportLines = [
    ...wrapPdfText(title),
    'Scheda auto completa',
    `Generata il: ${new Date().toLocaleDateString('it-IT')}`,
    '',
    ...report.columns.flatMap(({ key, label }) => wrapPdfText(`${label}: ${formatVehiclePdfValue(key, row[key])}`)),
  ];
  return createPdfDocument(reportLines);
}

function renderVehiclePdf(report, title) {
  return { contentType: 'application/pdf', extension: 'pdf', body: buildVehiclePdf(report, title) };
}

function renderReport(report, format, title) {
  if (format === 'json') return { contentType: 'application/json; charset=utf-8', extension: 'json', body: Buffer.from(JSON.stringify({ title, generatedAt: new Date().toISOString(), ...report }, null, 2)) };
  if (format === 'xlsx') return { contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', extension: 'xlsx', body: buildXlsx(report, title) };
  if (format === 'pdf') return { contentType: 'application/pdf', extension: 'pdf', body: buildPdf(report, title) };
  throw new Error('Formato di esportazione non supportato.');
}

module.exports = { EVENT_TYPES, EVENT_LABELS, loadSecurityReport, loadCollectionReport, createVehicleReport, renderVehiclePdf, renderReport };
