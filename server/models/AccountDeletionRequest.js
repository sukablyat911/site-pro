const mongoose = require('mongoose');

const accountDeletionRequestSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    email: { type: String, required: true, lowercase: true, trim: true, maxlength: 254 },
    reason: { type: String, trim: true, maxlength: 1000, default: '' },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'rejected'],
      default: 'pending',
      index: true,
    },
    requestedAt: { type: Date, default: Date.now },
    processedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

accountDeletionRequestSchema.index({ userId: 1, status: 1 });
accountDeletionRequestSchema.index(
  { userId: 1 },
  {
    name: 'pending_account_deletion_user_unique',
    unique: true,
    partialFilterExpression: { status: { $in: ['pending', 'processing'] } },
  },
);

module.exports = mongoose.model('AccountDeletionRequest', accountDeletionRequestSchema);
