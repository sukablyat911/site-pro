const mongoose = require('mongoose');

const authSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    tokenHash: {
      type: String,
      required: true,
      unique: true,
    },
    adminVerified: {
      type: Boolean,
      default: false,
    },
    pendingPinExpiresAt: {
      type: Date,
    },
    pendingTotpSecretEncrypted: {
      type: String,
      select: false,
    },
    totpSetupExpiresAt: {
      type: Date,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 },
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model('AuthSession', authSessionSchema);
