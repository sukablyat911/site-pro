const mongoose = require('mongoose');

const adminInvitationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    username: { type: String, required: true, lowercase: true, trim: true, minlength: 3, maxlength: 32 },
    email: { type: String, required: true, lowercase: true, trim: true, maxlength: 254 },
    phone: { type: String, trim: true, maxlength: 40, default: '' },
    passwordHash: { type: String, required: true, select: false },
    adminPinHash: { type: String, required: true, select: false },
    codeHash: { type: String, required: true, select: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
  },
  { timestamps: true },
);

module.exports = mongoose.model('AdminInvitation', adminInvitationSchema);
