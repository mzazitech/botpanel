const mongoose = require('mongoose');

const purchaseSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  transactionRef: {
    type: String,
    required: true,
    unique: true
  },
  amount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  apiKey: {
    type: String,
    unique: true,
    sparse: true
  },
  expiryDate: {
    type: Date,
    default: null
  },
  paymentDetails: {
    type: Object,
    default: {}
  },
  deliveredAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster queries
purchaseSchema.index({ user: 1, createdAt: -1 });
purchaseSchema.index({ transactionRef: 1 });

module.exports = mongoose.model('Purchase', purchaseSchema);
