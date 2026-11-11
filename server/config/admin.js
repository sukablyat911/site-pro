const User = require('../models/User');

const bcryptHashPattern = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/;

function getAdminConfig() {
  const username = process.env.ADMIN_USERNAME?.trim().toLowerCase();
  const passwordHash = process.env.ADMIN_PASSWORD_HASH?.trim();
  if (!username && !passwordHash) return null;
  if (!/^[a-z0-9._-]{3,32}$/.test(username) || !bcryptHashPattern.test(passwordHash)) {
    throw new Error('ADMIN_USERNAME or ADMIN_PASSWORD_HASH has an invalid format.');
  }

  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase() || `${username}@admin.pelusogroup.local`;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    throw new Error('ADMIN_EMAIL has an invalid format.');
  }

  return { username, email, passwordHash };
}

function getAdminPinHash() {
  const pinHash = process.env.ADMIN_PIN_HASH?.trim();
  if (!pinHash) return null;
  if (!bcryptHashPattern.test(pinHash)) {
    throw new Error('ADMIN_PIN_HASH must be a valid bcrypt hash.');
  }
  return pinHash;
}

async function configureAdminAccount() {
  const config = getAdminConfig();
  if (!config) {
    await User.updateMany({ role: 'admin' }, { $set: { role: 'user' } });
    console.warn('Admin account is disabled. Configure ADMIN_USERNAME and ADMIN_PASSWORD_HASH.');
    return;
  }
  if (!getAdminPinHash()) {
    throw new Error('ADMIN_PIN_HASH is required when admin access is enabled. Configure a bcrypt hash of a four-digit PIN.');
  }

  const admins = await User.find({ role: 'admin' }).select('_id').limit(2);
  if (admins.length > 1) {
    throw new Error('Multiple admin accounts exist; keep one before configuring the admin credentials.');
  }
  const existingUser = await User.findOne({
    email: config.email,
    role: { $ne: 'admin' },
    ...(admins[0] ? { _id: { $ne: admins[0]._id } } : {}),
  }).select('_id');
  if (existingUser) {
    throw new Error('ADMIN_EMAIL already belongs to a non-admin account; choose a different ADMIN_EMAIL.');
  }

  await User.updateOne(
    admins[0] ? { _id: admins[0]._id } : { email: config.email },
    {
      $set: { name: config.username, email: config.email, passwordHash: config.passwordHash, role: 'admin' },
      $setOnInsert: { createdAt: new Date() },
    },
    { upsert: true, runValidators: true },
  );
  console.log(`Admin account configured for username "${config.username}".`);
}

module.exports = { configureAdminAccount, getAdminConfig, getAdminPinHash };
