const mongoose = require('mongoose');

const adminApiTokenSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    tokenHash: {
      type: String,
      required: true,
      unique: true,
      select: false,
    },
    tokenPrefix: {
      type: String,
      required: true,
      maxlength: 24,
    },
    scopes: {
      type: [String],
      enum: ['vehicles:read', 'analytics:read'],
      required: true,
    },
    lastUsedAt: {
      type: Date,
      default: null,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    revokedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

adminApiTokenSchema.index({ userId: 1, revokedAt: 1 });

module.exports = mongoose.model('AdminApiToken', adminApiTokenSchema);
