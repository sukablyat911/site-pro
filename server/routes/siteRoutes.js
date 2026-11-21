const express = require('express');
const crypto = require('node:crypto');
const AdminSettings = require('../models/AdminSettings');

const router = express.Router();

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
        contactEmail: settings.contactEmail,
        contactPhone: settings.contactPhone,
        vatNumber: settings.vatNumber,
        address: settings.address,
        timezone: settings.timezone,
        logoUrl: settings.logoUrl,
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
