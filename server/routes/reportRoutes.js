const fs = require('node:fs');
const path = require('node:path');
const express = require('express');
const mongoose = require('mongoose');
const AdminSecurityEvent = require('../models/AdminSecurityEvent');
const LegalDocument = require('../models/LegalDocument');
const { requireAdmin } = require('../middleware/auth');
const { loadSecurityReport, loadCollectionReport, renderReport } = require('../services/reportExport');

const router = express.Router();
const legalDocumentDefinitions = {
  privacy: { title: 'Informativa privacy', file: 'PRIVACY-POLICY.md' },
  'termini-condizioni': { title: 'Termini e condizioni', file: 'TERMINI-CONDIZIONI.md' },
  'cookie-policy': { title: 'Cookie Policy', file: 'COOKIE-POLICY.md' },
  'note-legali': { title: 'Note legali', file: 'NOTE-LEGALI.md' },
};

const collectionReports = {
  rentals: {
    title: 'Richieste di noleggio',
    collection: 'rental_requests',
    searchFields: ['customer.name', 'customer.email', 'customer.phone', 'vehicle.make', 'vehicle.model', 'message', 'status'],
    columns: [
      { key: 'date', label: 'Data richiesta' }, { key: 'status', label: 'Stato' },
      { key: 'vehicle', label: 'Veicolo' }, { key: 'customer', label: 'Cliente' },
      { key: 'period', label: 'Periodo' }, { key: 'rentalDays', label: 'Giorni' },
      { key: 'estimatedTotal', label: 'Totale stimato' }, { key: 'message', label: 'Messaggio' },
    ],
    pdfColumns: ['date', 'status', 'vehicle', 'customer', 'period'],
    mapRow: (record) => ({
      date: record.createdAt instanceof Date ? record.createdAt.toISOString() : record.createdAt || '',
      status: record.status || '',
      vehicle: `${record.vehicle?.year || ''} ${record.vehicle?.make || ''} ${record.vehicle?.model || ''}`.trim(),
      customer: `${record.customer?.name || ''} (${record.customer?.email || ''})`.trim(),
      period: `${record.startDate || ''} - ${record.endDate || ''}`,
      rentalDays: record.rentalDays || 0,
      estimatedTotal: record.estimatedTotal ?? '',
      message: record.message || '',
    }),
  },
  visits: {
    title: 'Visite prenotate',
    collection: 'dealer_visit_requests',
    searchFields: ['customer.name', 'customer.email', 'customer.phone', 'vehicle.make', 'vehicle.model', 'message', 'status'],
    columns: [
      { key: 'date', label: 'Data richiesta' }, { key: 'visitAt', label: 'Appuntamento' },
      { key: 'status', label: 'Stato' }, { key: 'vehicle', label: 'Veicolo' },
      { key: 'customer', label: 'Cliente' }, { key: 'message', label: 'Messaggio' },
      { key: 'decisionReason', label: 'Motivo decisione' },
    ],
    pdfColumns: ['date', 'visitAt', 'status', 'vehicle', 'customer'],
    mapRow: (record) => ({
      date: record.createdAt instanceof Date ? record.createdAt.toISOString() : record.createdAt || '',
      visitAt: record.visitAt instanceof Date ? record.visitAt.toISOString() : record.visitAt || '',
      status: record.status || '',
      vehicle: `${record.vehicle?.year || ''} ${record.vehicle?.make || ''} ${record.vehicle?.model || ''}`.trim(),
      customer: `${record.customer?.name || ''} (${record.customer?.email || ''})`.trim(),
      message: record.message || '',
      decisionReason: record.decisionReason || '',
    }),
  },
  messages: {
    title: 'Messaggi e trattative',
    collection: 'sell_submissions',
    searchFields: ['name', 'email', 'phone', 'make', 'model', 'description', 'status', 'messages.text'],
    columns: [
      { key: 'date', label: 'Data' }, { key: 'status', label: 'Stato' },
      { key: 'vehicle', label: 'Veicolo' }, { key: 'customer', label: 'Cliente' },
      { key: 'askingPrice', label: 'Prezzo richiesto' }, { key: 'messageCount', label: 'Numero messaggi' },
      { key: 'messages', label: 'Messaggi' },
      { key: 'lastMessage', label: 'Ultimo messaggio' },
    ],
    pdfColumns: ['date', 'status', 'vehicle', 'customer', 'messageCount'],
    mapRow: (record) => {
      const messages = Array.isArray(record.messages) ? record.messages : [];
      const lastMessage = messages[messages.length - 1];
      return {
        date: record.createdAt instanceof Date ? record.createdAt.toISOString() : record.createdAt || '',
        status: record.status || '',
        vehicle: `${record.year || ''} ${record.make || ''} ${record.model || ''}`.trim(),
        customer: `${record.name || ''} (${record.email || ''})`.trim(),
        askingPrice: record.askingPrice ?? '',
        messageCount: messages.length,
        messages: messages.map((message) => `${message.senderRole || 'cliente'}: ${message.text || ''}`).join('\n'),
        lastMessage: lastMessage?.text || '',
      };
    },
  },
  sales: {
    title: 'Vendite concluse',
    collection: 'vehicle_sales',
    dateField: 'soldAt',
    searchFields: ['vehicle.make', 'vehicle.model', 'vehicle.bodyType', 'buyerId'],
    columns: [
      { key: 'date', label: 'Data vendita' }, { key: 'vehicle', label: 'Veicolo' },
      { key: 'buyerId', label: 'ID cliente' }, { key: 'finalPrice', label: 'Prezzo finale' },
      { key: 'views', label: 'Visualizzazioni' }, { key: 'purchaseRequests', label: 'Richieste acquisto' },
    ],
    pdfColumns: ['date', 'vehicle', 'buyerId', 'finalPrice'],
    mapRow: (record) => ({
      date: record.soldAt instanceof Date ? record.soldAt.toISOString() : record.soldAt || '',
      vehicle: `${record.vehicle?.year || ''} ${record.vehicle?.make || ''} ${record.vehicle?.model || ''}`.trim(),
      buyerId: record.buyerId?.toString() || '',
      finalPrice: record.finalPrice ?? '',
      views: record.engagement?.views ?? '',
      purchaseRequests: record.engagement?.purchaseRequests ?? '',
    }),
  },
  admins: {
    title: 'Account amministratori',
    collection: 'users',
    baseFilter: { role: 'admin' },
    searchFields: ['name', 'username', 'email'],
    columns: [
      { key: 'date', label: 'Data creazione' }, { key: 'name', label: 'Nome' },
      { key: 'username', label: 'Username' }, { key: 'email', label: 'Email' },
      { key: 'role', label: 'Ruolo' }, { key: 'status', label: 'Stato' },
    ],
    pdfColumns: ['date', 'name', 'username', 'email', 'status'],
    mapRow: (record) => ({
      date: record.createdAt instanceof Date ? record.createdAt.toISOString() : record.createdAt || '',
      name: record.name || '',
      username: record.username || '',
      email: record.email || '',
      role: record.role || 'admin',
      status: 'Attivo',
    }),
  },
  logs: {
    title: 'Attività amministrative',
    collection: 'admin_activity_logs',
    searchFields: ['actorName', 'action', 'resource', 'targetId', 'outcome'],
    columns: [
      { key: 'date', label: 'Data' }, { key: 'action', label: 'Azione' },
      { key: 'resource', label: 'Elemento' }, { key: 'actor', label: 'Amministratore' },
      { key: 'targetId', label: 'Riferimento' }, { key: 'result', label: 'Esito' },
    ],
    pdfColumns: ['date', 'action', 'resource', 'actor', 'result'],
    mapRow: (record) => ({
      date: record.createdAt instanceof Date ? record.createdAt.toISOString() : record.createdAt || '',
      action: ({ created: 'Creato', updated: 'Modificato', deleted: 'Eliminato' })[record.action] || 'Operazione',
      resource: record.resource || '',
      actor: record.actorName || 'Amministratore',
      targetId: record.targetId || '',
      result: record.outcome === 'success' ? 'Completata' : `Non riuscita (HTTP ${record.statusCode || ''})`,
    }),
  },
};

router.get('/legal-documents/:slug', requireAdmin, async (req, res) => {
  const definition = legalDocumentDefinitions[req.params.slug];
  if (!definition) return res.status(404).json({ error: 'Documento legale non trovato.' });
  const format = typeof req.query.format === 'string' ? req.query.format.toLowerCase() : '';
  if (!['json', 'xlsx', 'pdf'].includes(format)) {
    return res.status(400).json({ error: 'Scegli un formato PDF, Excel o JSON.' });
  }
  try {
    const stored = await LegalDocument.findOne({ slug: req.params.slug }).lean();
    const content = stored?.content || await fs.promises.readFile(path.join(__dirname, '../../legal', definition.file), 'utf8');
    const report = {
      filters: { from: '', to: '', search: '' },
      columns: [
        { key: 'title', label: 'Documento' },
        { key: 'slug', label: 'Slug' },
        { key: 'updatedAt', label: 'Ultimo aggiornamento' },
        { key: 'content', label: 'Contenuto Markdown' },
      ],
      pdfColumns: ['title', 'slug', 'updatedAt', 'content'],
      summary: { total: 1 },
      rows: [{
        title: definition.title,
        slug: req.params.slug,
        updatedAt: stored?.updatedAt || '',
        content,
      }],
    };
    const rendered = renderReport(report, format, definition.title);
    res.set('Cache-Control', 'no-store');
    res.set('Content-Type', rendered.contentType);
    res.set('Content-Disposition', `attachment; filename="pelusogroup-${req.params.slug}.${rendered.extension}"`);
    return res.send(rendered.body);
  } catch (error) {
    console.error('Could not export legal document:', error);
    return res.status(500).json({ error: 'Non è stato possibile scaricare il documento legale.' });
  }
});

router.get('/:reportType', requireAdmin, async (req, res) => {
  const isSecurityReport = req.params.reportType === 'security-audit';
  const collectionConfig = collectionReports[req.params.reportType];
  if (!isSecurityReport && !collectionConfig) {
    return res.status(404).json({ error: 'Tipo di report non trovato.' });
  }
  const format = typeof req.query.format === 'string' ? req.query.format.toLowerCase() : '';
  if (!['json', 'xlsx', 'pdf'].includes(format)) {
    return res.status(400).json({ error: 'Scegli un formato PDF, Excel o JSON.' });
  }
  try {
    const report = isSecurityReport
      ? await loadSecurityReport(AdminSecurityEvent, req.query)
      : await loadCollectionReport(mongoose.connection.collection(collectionConfig.collection), req.query, collectionConfig);
    const title = isSecurityReport ? 'Audit sicurezza' : collectionConfig.title;
    const rendered = renderReport(report, format, title);
    const filename = `pelusogroup-${req.params.reportType}-${report.filters.from}-${report.filters.to}.${rendered.extension}`;
    res.set('Cache-Control', 'no-store');
    res.set('Content-Type', rendered.contentType);
    res.set('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(rendered.body);
  } catch (error) {
    if (error.message.includes('periodo') || error.message.includes('Formato')) {
      return res.status(400).json({ error: error.message });
    }
    console.error('Could not export admin report:', error);
    return res.status(500).json({ error: 'Non è stato possibile generare il report.' });
  }
});

module.exports = router;
