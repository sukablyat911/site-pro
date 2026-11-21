const mongoose = require('mongoose');

const adminSecurityEventSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: [
        'ip_rule_added',
        'ip_rule_removed',
        'traffic_limits_updated',
        'password_changed',
        'pin_changed',
        'email_verification_requested',
        'email_updated',
        'notification_email_added',
        'notification_email_removed',
        'ip_blocked',
        'ip_throttled',
        'traffic_limit_reached',
      ],
      required: true,
    },
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    ipAddress: { type: String, maxlength: 45, default: '' },
    details: { type: String, maxlength: 240, default: '' },
  },
  { timestamps: true },
);

adminSecurityEventSchema.index({ createdAt: -1 }, { expireAfterSeconds: 7776000 });

module.exports = mongoose.model('AdminSecurityEvent', adminSecurityEventSchema);
