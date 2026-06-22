const mongoose = require('mongoose');

const parcelSchema = new mongoose.Schema(
  {
    weight: {
      type: Number,
      required: true,
      min: 0
    },
    value: {
      type: Number,
      required: true,
      min: 0
    },
    destinationCountry: {
      type: String,
      required: true,
      trim: true
    },
    department: {
      type: String,
      trim: true,
      default: null
    },
    status: {
      type: String,
      required: true,
      enum: ['ROUTED', 'PENDING_INSURANCE_APPROVAL'],
      index: true
    },
    matchedRule: {
      type: String,
      trim: true,
      default: null
    }
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: false }
  }
);

// Indexing for dashboard counters and audits
parcelSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Parcel', parcelSchema);
