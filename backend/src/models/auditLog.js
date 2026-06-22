const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  parcelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Parcel',
    required: false, // Optional for system-wide events (e.g., config checks)
    index: true
  },
  action: {
    type: String,
    required: true,
    index: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
});

module.exports = mongoose.model('AuditLog', auditLogSchema);
