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
    const admins = await User.find({ role: 'admin' }).select('+security');
    const fallbackPinHash = getAdminPinHash();
    if (admins.some((admin) => !admin.security?.adminPinHash && !admin.security?.totpEnabled) && !fallbackPinHash) {
      throw new Error('Existing admin accounts need a PIN hash or enabled TOTP. Configure ADMIN_PIN_HASH before starting the server.');
    }
    console.warn('No bootstrap admin is configured. Existing database admin accounts remain available.');
    return;
  }
  let admin = await User.findOne({ username: config.username }).select('+security');
  if (!admin) admin = await User.findOne({ email: config.email }).select('+security');

  if (!admin) {
    const legacyAdmins = await User.find({ role: 'admin', username: { $exists: false } })
      .select('+security')
      .limit(2);
    if (legacyAdmins.length === 1) admin = legacyAdmins[0];
  }
  if (admin && admin.role !== 'admin') {
    throw new Error('ADMIN_EMAIL or ADMIN_USERNAME already belongs to a non-admin account.');
  }

  const configuredPinHash = getAdminPinHash();
  if (!admin && !configuredPinHash) {
    throw new Error('ADMIN_PIN_HASH is required to initialize the bootstrap admin account.');
  }
  if (admin && !admin.security?.adminPinHash && !admin.security?.totpEnabled && !configuredPinHash) {
    throw new Error('The bootstrap admin has no configured PIN or TOTP. Configure ADMIN_PIN_HASH before starting the server.');
  }
  const updates = {
    name: config.username,
    username: config.username,
    role: 'admin',
  };
  if (!admin) updates.email = config.email;
  if (configuredPinHash && !admin?.security?.adminPinHash) {
    updates['security.adminPinHash'] = configuredPinHash;
  }
  if (admin) {
    await User.updateOne({ _id: admin._id }, { $set: updates }, { runValidators: true });
  } else {
    const existingUser = await User.findOne({ email: config.email }).select('_id');
    if (existingUser) {
      throw new Error('ADMIN_EMAIL already belongs to another account; choose a different ADMIN_EMAIL.');
    }
    await User.create({
      ...updates,
      email: config.email,
      passwordHash: config.passwordHash,
      security: { adminPinHash: configuredPinHash },
    });
  }

  console.log(`Admin account configured for username "${config.username}".`);
}

module.exports = { configureAdminAccount, getAdminConfig, getAdminPinHash };
