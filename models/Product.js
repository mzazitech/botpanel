const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  category: {
    type: String,
    enum: ['panel', 'subscription', 'api', 'vps'],
    required: true
  },
  features: [String],
  imageIcon: String,
  type: {
    type: String,
    enum: ['license', 'subscription', 'api_key'],
    required: true
  },
  durationDays: {
    type: Number,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Product', productSchema);
