const mongoose = require('mongoose');

const webAuthnCredentialSchema = new mongoose.Schema(
  {
    credentialId: { type: String, required: true },
    publicKey: { type: String, required: true },
    counter: { type: Number, required: true, default: 0 },
    transports: { type: [String], default: [] },
    name: { type: String, required: true, maxlength: 80 },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const securitySchema = new mongoose.Schema(
  {
    totpEnabled: { type: Boolean, default: false },
    totpSecretEncrypted: { type: String, default: '' },
    recoveryCodeHashes: { type: [String], default: [] },
    adminPinHash: { type: String, default: '' },
    notificationEmails: {
      type: [{
        email: { type: String, required: true, lowercase: true, trim: true, maxlength: 254 },
        verifiedAt: { type: Date, required: true },
      }],
      default: [],
    },
    pendingEmailVerifications: {
      type: [{
        email: { type: String, required: true, lowercase: true, trim: true, maxlength: 254 },
        purpose: { type: String, enum: ['primary', 'notification'], required: true },
        codeHash: { type: String, required: true },
        expiresAt: { type: Date, required: true },
      }],
      default: [],
    },
    webAuthnCredentials: { type: [webAuthnCredentialSchema], default: [] },
  },
  { _id: false },
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
    },
    username: {
      type: String,
      lowercase: true,
      trim: true,
      minlength: 3,
      maxlength: 32,
      match: /^[a-z0-9._-]+$/,
      sparse: true,
      unique: true,
    },
    phone: {
      type: String,
      trim: true,
      maxlength: 40,
      default: '',
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    pendingCustomerEmail: {
      type: new mongoose.Schema({
        email: { type: String, required: true },
        tokenHash: { type: String, required: true },
        expiresAt: { type: Date, required: true },
      }, { _id: false }),
      select: false,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
      required: true,
    },
    security: {
      type: securitySchema,
      default: () => ({}),
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('User', userSchema);
