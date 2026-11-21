const mongoose = require('mongoose');

const adminTrafficCounterSchema = new mongoose.Schema(
  {
    day: { type: String, required: true },
    key: { type: String, required: true, maxlength: 64 },
    requests: { type: Number, default: 0, min: 0 },
    bytes: { type: Number, default: 0, min: 0 },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
  },
  { timestamps: true },
);

adminTrafficCounterSchema.index({ day: 1, key: 1 }, { unique: true });

module.exports = mongoose.model('AdminTrafficCounter', adminTrafficCounterSchema);
