require('dotenv').config();

require('./config/dns');

const cors = require('cors');
const express = require('express');
const path = require('node:path');
const connectDB = require('./config/db');
const contactRoutes = require('./routes/contactRoutes');
const { router: analyticsRoutes, ensureAnalyticsIndexes } = require('./routes/analyticsRoutes');
const { router: salesRoutes, ensureSalesIndexes } = require('./routes/salesRoutes');
const userRoutes = require('./routes/userRoutes');
const { router: vehicleRoutes, ensureVehicleInventory } = require('./routes/vehicleRoutes');
const { router: sellSubmissionRoutes, ensureSellSubmissionIndexes } = require('./routes/sellSubmissionRoutes');
const { router: purchaseRequestRoutes, ensurePurchaseRequestIndexes } = require('./routes/purchaseRequestRoutes');
const { router: rentalRequestRoutes, ensureRentalRequestIndexes } = require('./routes/rentalRequestRoutes');
const { isContactEmailConfigured } = require('./services/contactEmail');
const { configureAdminAccount } = require('./config/admin');
const AdminPinAttempt = require('./models/AdminPinAttempt');

const app = express();
const port = process.env.PORT || 5000;
const clientOrigin = process.env.CLIENT_ORIGIN;

if (clientOrigin) {
  app.use(cors({ origin: clientOrigin, credentials: true }));
}
app.use(express.json({ limit: '20kb' }));
app.use('/api/analytics', analyticsRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/users', userRoutes);
app.use('/api/sell-submissions', sellSubmissionRoutes);
app.use('/api/purchase-requests', purchaseRequestRoutes);
app.use('/api/rental-requests', rentalRequestRoutes);
app.use('/uploads/cars', express.static(path.join(__dirname, 'uploads/cars'), {
  fallthrough: false,
  immutable: true,
  maxAge: '1y',
  setHeaders: (res) => res.setHeader('X-Content-Type-Options', 'nosniff'),
}));
app.use('/api/vehicles', vehicleRoutes);

async function startServer() {
  await connectDB();
  await ensureAnalyticsIndexes();
  await AdminPinAttempt.createIndexes();
  await ensureVehicleInventory();
  await ensureSellSubmissionIndexes();
  await ensurePurchaseRequestIndexes();
  await ensureRentalRequestIndexes();
  await ensureSalesIndexes();
  await configureAdminAccount();
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
