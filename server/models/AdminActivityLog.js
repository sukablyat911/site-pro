const mongoose = require('mongoose');

const adminActivityLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      enum: ['created', 'updated', 'deleted'],
      required: true,
    },
    resource: { type: String, required: true, maxlength: 80 },
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    actorName: { type: String, required: true, maxlength: 80 },
    targetId: { type: String, maxlength: 24, default: '' },
    outcome: {
      type: String,
      enum: ['success', 'failure'],
      required: true,
    },
    statusCode: { type: Number, min: 100, max: 599, required: true },
  },
  { timestamps: true, collection: 'admin_activity_logs' },
);

adminActivityLogSchema.index({ createdAt: -1 }, { expireAfterSeconds: 7776000 });

module.exports = mongoose.model('AdminActivityLog', adminActivityLogSchema);
