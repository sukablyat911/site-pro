const mongoose = require('mongoose');

const legalDocumentSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      enum: ['privacy', 'termini-condizioni', 'cookie-policy', 'note-legali'],
    },
    content: {
      type: String,
      required: true,
      maxlength: 100000,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model('LegalDocument', legalDocumentSchema);
