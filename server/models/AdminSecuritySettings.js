const mongoose = require('mongoose');

const ipRuleSchema = new mongoose.Schema(
  {
    address: { type: String, required: true, maxlength: 45 },
    mode: { type: String, enum: ['allow', 'block'], required: true },
    action: { type: String, enum: ['deny', 'throttle'], default: 'deny' },
    reason: { type: String, trim: true, maxlength: 160, default: '' },
    expiresAt: { type: Date, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
);

const adminSecuritySettingsSchema = new mongoose.Schema(
  {
    _id: { type: String, default: 'global' },
    ddosProtectionEnabled: { type: Boolean, default: true },
    trafficLimitsEnabled: { type: Boolean, default: true },
    perIpRequestsPerDay: { type: Number, min: 60, max: 1000000, default: 10000 },
    perIpBytesPerDay: { type: Number, min: 1048576, max: 5368709120, default: 52428800 },
    globalRequestsPerDay: { type: Number, min: 1000, max: 10000000, default: 250000 },
    globalBytesPerDay: { type: Number, min: 10485760, max: 10995116277760, default: 10737418240 },
    ipRules: { type: [ipRuleSchema], default: [] },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

module.exports = mongoose.model('AdminSecuritySettings', adminSecuritySettingsSchema);
