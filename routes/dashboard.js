const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const Purchase = require('../models/Purchase');
const Product = require('../models/Product');

// Get dashboard data
router.get('/', authMiddleware, async (req, res) => {
  try {
    const purchases = await Purchase.find({ user: req.user._id, status: 'completed' })
      .populate('product')
      .sort({ createdAt: -1 });
    
    // Separate active subscriptions and API keys
    const activePurchases = purchases.filter(p => {
      if (p.expiryDate) {
        return new Date(p.expiryDate) > new Date();
      }
      return true;
    });
    
    const apiKeys = purchases.filter(p => p.apiKey).map(p => ({
      id: p._id,
      productName: p.product.name,
      apiKey: p.apiKey,
      expiryDate: p.expiryDate,
      createdAt: p.createdAt
    }));
    
    res.json({
      success: true,
      user: {
        username: req.user.username,
        email: req.user.email,
        memberSince: req.user.createdAt
      },
      stats: {
        totalPurchases: purchases.length,
        activeProducts: activePurchases.length,
        totalSpent: purchases.reduce((sum, p) => sum + p.amount, 0)
      },
      purchases: purchases.map(p => ({
        id: p._id,
        productName: p.product.name,
        productIcon: p.product.imageIcon,
        amount: p.amount,
        apiKey: p.apiKey,
        expiryDate: p.expiryDate,
        deliveredAt: p.deliveredAt,
        status: p.status
      })),
      apiKeys
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get single purchase details
router.get('/purchase/:id', authMiddleware, async (req, res) => {
  try {
    const purchase = await Purchase.findOne({ 
      _id: req.params.id, 
      user: req.user._id 
    }).populate('product');
    
    if (!purchase) {
      return res.status(404).json({ success: false, message: 'Purchase not found' });
    }
    
    res.json({ success: true, purchase });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
