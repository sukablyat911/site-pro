const express = require('express');
const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const path = require('node:path');
const AdminSettings = require('../models/AdminSettings');
const LegalDocument = require('../models/LegalDocument');

const router = express.Router();
const legalDocumentFiles = {
  privacy: 'PRIVACY-POLICY.md',
  'termini-condizioni': 'TERMINI-CONDIZIONI.md',
  'cookie-policy': 'COOKIE-POLICY.md',
  'note-legali': 'NOTE-LEGALI.md',
};

async function getLegalDocument(slug) {
  const fileName = legalDocumentFiles[slug];
  if (!fileName) return null;
  const stored = await LegalDocument.findOne({ slug }).lean();
  if (stored) return stored;
  const content = await fs.readFile(path.join(__dirname, '../../legal', fileName), 'utf8');
  return { slug, content, updatedAt: null };
}

router.post('/admin-entry', async (req, res) => {
  const candidate = typeof req.body?.path === 'string' && /^\/[a-f0-9]{48}$/.test(req.body.path)
    ? req.body.path
    : '';
  try {
    const settings = await AdminSettings.findById('global').select('+adminAccessPathHash');
    const storedHash = settings?.adminAccessPathHash || '';
    const expectedHash = /^[a-f0-9]{64}$/.test(storedHash)
      ? Buffer.from(storedHash, 'hex')
      : Buffer.alloc(32);
    const suppliedHash = crypto.createHash('sha256').update(candidate || 'invalid-admin-entry').digest();
    const valid = Boolean(candidate && storedHash) && crypto.timingSafeEqual(suppliedHash, expectedHash);
    res.set('Cache-Control', 'no-store');
    return res.json({ valid });
  } catch (error) {
    console.error('Could not verify private admin entry:', error);
    return res.status(500).json({ error: 'Non è stato possibile verificare il collegamento amministratore.' });
  }
});

router.get('/legal/:slug', async (req, res) => {
  const { slug } = req.params;
  if (!legalDocumentFiles[slug]) return res.status(404).json({ error: 'Documento legale non trovato.' });
  try {
    const document = await getLegalDocument(slug);
    res.set('Cache-Control', 'no-store');
    return res.json({ document });
  } catch (error) {
    console.error('Could not load legal document:', error);
    return res.status(500).json({ error: 'Non è stato possibile caricare il documento legale.' });
  }
});

router.get('/settings', async (req, res) => {
  try {
    let settings = await AdminSettings.findById('global');
    if (!settings) settings = await AdminSettings.create({ _id: 'global' });

    const announcement = settings.announcement && settings.announcement.expiresAt > new Date()
      ? settings.announcement
      : null;
    res.set('Cache-Control', 'no-store');
    return res.json({
      settings: {
        businessName: settings.businessName,
        siteTitle: settings.siteTitle,
        contactEmail: settings.contactEmail,
        contactPhone: settings.contactPhone,
        vatNumber: settings.vatNumber,
        address: settings.address,
        timezone: settings.timezone,
        logoUrl: settings.logoUrl,
        faviconUrl: settings.faviconUrl,
        heroImageUrl: settings.heroImageUrl,
        staffContacts: settings.staffContacts,
        openingHours: settings.openingHours,
        holidays: settings.holidays,
        announcement,
        maintenanceMode: settings.maintenanceMode,
        maintenanceMessage: settings.maintenanceMessage,
        offlineMode: settings.offlineMode,
        offlineMessage: settings.offlineMessage,
      },
    });
  } catch (error) {
    console.error('Could not load public site settings:', error);
    return res.status(500).json({ error: 'Non è stato possibile caricare le impostazioni del sito.' });
  }
});

module.exports = router;
