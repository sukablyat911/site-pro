require('dotenv').config();

require('./config/dns');

const cors = require('cors');
const compression = require('compression');
const mongoose = require('mongoose');
const express = require('express');
const path = require('node:path');
const fs = require('node:fs');
const { connectDB } = require('./config/db');
const { ensureIndexes } = require('./config/db');
const contactRoutes = require('./routes/contactRoutes');
const siteRoutes = require('./routes/siteRoutes');
const { router: analyticsRoutes, ensureAnalyticsIndexes } = require('./routes/analyticsRoutes');
const { router: salesRoutes, ensureSalesIndexes } = require('./routes/salesRoutes');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const { router: vehicleRoutes, ensureVehicleInventory } = require('./routes/vehicleRoutes');
const { router: sellSubmissionRoutes, ensureSellSubmissionIndexes } = require('./routes/sellSubmissionRoutes');
const { router: purchaseRequestRoutes, ensurePurchaseRequestIndexes } = require('./routes/purchaseRequestRoutes');
const { router: vehiclePriceOfferRoutes, ensureVehiclePriceOfferIndexes } = require('./routes/vehiclePriceOfferRoutes');
const { router: rentalRequestRoutes, ensureRentalRequestIndexes } = require('./routes/rentalRequestRoutes');
const { router: visitRequestRoutes, ensureVisitRequestIndexes } = require('./routes/visitRequestRoutes');
const { isContactEmailConfigured } = require('./services/contactEmail');
const { configureAdminAccount } = require('./config/admin');
const AdminSecurityEvent = require('./models/AdminSecurityEvent');
const AdminPinAttempt = require('./models/AdminPinAttempt');
const AdminSecurityAttempt = require('./models/AdminSecurityAttempt');
const AdminSecuritySettings = require('./models/AdminSecuritySettings');
const AdminTrafficCounter = require('./models/AdminTrafficCounter');
const AdminInvitation = require('./models/AdminInvitation');
const User = require('./models/User');
const { adminTrafficGuard, invalidateSecuritySettingsCache } = require('./middleware/adminTrafficGuard');
const { siteAvailabilityGuard } = require('./middleware/siteAvailabilityGuard');

const app = express();
const port = process.env.PORT || 5000;
const clientOrigin = process.env.CLIENT_ORIGIN;
const clientDist = path.join(__dirname, '../client/dist');

app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob: https:; connect-src 'self'",
  );
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
});

if (clientOrigin) {
  app.use(cors({ origin: clientOrigin, credentials: true }));
}
app.use(adminTrafficGuard);
app.post('/api/admin/security/emergency-reset', async (req, res) => {
  if (process.env.NODE_ENV === 'production') return res.status(404).json({ error: 'Not Found' });
  const rawIp = typeof req.ip === 'string' ? req.ip.toLowerCase() : '';
  const clientIp = rawIp.startsWith('::ffff:') ? rawIp.slice(7) : rawIp;
  if (clientIp !== '127.0.0.1' && clientIp !== '::1') {
    return res.status(403).json({ error: 'Reset disponibile solo dalla sessione locale.' });
  }
  try {
    const settings = await AdminSecuritySettings.findById('global');
    if (settings) {
      settings.trafficLimitsEnabled = false;
      settings.ddosProtectionEnabled = false;
      settings.ipRules = (settings.ipRules || []).filter((rule) => (
        rule.address !== '127.0.0.1' && rule.address !== '::1'
      ));
      await settings.save();
      invalidateSecuritySettingsCache();
    }
    const day = new Date().toISOString().slice(0, 10);
    const deletedCounters = await AdminTrafficCounter.deleteMany({ day });
    return res.json({
      reset: true,
      trafficLimitsEnabled: false,
      ddosProtectionEnabled: false,
      deletedCounters: deletedCounters.deletedCount,
      day,
    });
  } catch (error) {
    console.error('Could not reset local traffic protection:', error);
    return res.status(500).json({ error: 'Non è stato possibile ripristinare i limiti.' });
  }
});
app.use(express.json({ limit: '20kb' }));
app.use(siteAvailabilityGuard);
app.use('/api/site', siteRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/sell-submissions', sellSubmissionRoutes);
app.use('/api/purchase-requests', purchaseRequestRoutes);
app.use('/api/vehicle-price-offers', (req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
}, vehiclePriceOfferRoutes);
app.use('/api/rental-requests', rentalRequestRoutes);
app.use('/api/visit-requests', visitRequestRoutes);
app.use('/uploads/cars', express.static(path.join(__dirname, 'uploads/cars'), {
  fallthrough: false,
  immutable: true,
  maxAge: '1y',
  setHeaders: (res) => res.setHeader('X-Content-Type-Options', 'nosniff'),
}));
app.use('/uploads/site', express.static(path.join(__dirname, 'uploads/site'), {
  fallthrough: false,
  immutable: true,
  maxAge: '1y',
  setHeaders: (res) => res.setHeader('X-Content-Type-Options', 'nosniff'),
}));
app.use('/api/vehicles', vehicleRoutes);

if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist, {
    index: false,
    maxAge: '7d',  // Cache static files for 7 days
    setHeaders: (res, filePath) => {
      const relativePath = path.relative(clientDist, filePath).replace(/\\/g, '/');
      if (relativePath.startsWith('assets/')) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      } else {
        res.setHeader('Cache-Control', 'no-cache');
      }
      res.setHeader('X-Content-Type-Options', 'nosniff');
    },
  }));

  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/') || req.path.startsWith('/uploads/')) return next();
    if (/\/[^/]+\.[^/]+$/.test(req.path)) return next();
    if (!req.accepts('html')) return next();
    res.setHeader('Cache-Control', 'no-cache');
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

async function startServer() {
  await connectDB();
  await ensureIndexes(mongoose.connection.collection('vehicles'));
  await ensureAnalyticsIndexes();
  await AdminPinAttempt.createIndexes();
  await AdminSecurityAttempt.createIndexes();
  await AdminInvitation.createIndexes();
  await User.createIndexes();
  await AdminSecurityEvent.createIndexes();
  await AdminTrafficCounter.createIndexes();
  await ensureVehicleInventory();
  await ensureSellSubmissionIndexes();
  await ensurePurchaseRequestIndexes();
  await ensureVehiclePriceOfferIndexes();
  await ensureRentalRequestIndexes();
  await ensureVisitRequestIndexes();
  await ensureSalesIndexes();
  await configureAdminAccount();
  if (process.env.NODE_ENV !== 'production') {
    const settings = await AdminSecuritySettings.findById('global');
    if (settings) {
      settings.trafficLimitsEnabled = false;
      settings.ddosProtectionEnabled = false;
      settings.ipRules = (settings.ipRules || []).filter((rule) => (
        rule.address !== '127.0.0.1' && rule.address !== '::1'
      ));
      await settings.save();
      invalidateSecuritySettingsCache();
    }
    const day = new Date().toISOString().slice(0, 10);
    await AdminTrafficCounter.deleteMany({ day });
  }
  if (!isContactEmailConfigured()) {
    console.warn('Contact email is disabled. Configure SMTP_HOST, SMTP_USER, and SMTP_PASS to deliver contact form emails.');
  }
  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
}

startServer().catch((error) => {
  console.error('Server startup failed:', error instanceof Error ? error.message : 'Unknown startup error.');
  process.exitCode = 1;
});
