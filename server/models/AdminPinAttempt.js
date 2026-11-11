const mongoose = require('mongoose');

const adminPinAttemptSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  attempts: {
    type: Number,
    default: 0,
    min: 0,
  },
  lockedUntil: {
    type: Date,
    default: null,
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: 0 },
  },
});

adminPinAttemptSchema.index({ userId: 1 }, { unique: true });

module.exports = mongoose.model('AdminPinAttempt', adminPinAttemptSchema);
