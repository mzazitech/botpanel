const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');
const User = require('../models/User');
const Product = require('../models/Product');
const Purchase = require('../models/Purchase');

// Apply admin middleware to all routes
router.use(authMiddleware, adminMiddleware);

// Dashboard statistics
router.get('/stats', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalProducts = await Product.countDocuments();
    const totalSales = await Purchase.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalPurchases = await Purchase.countDocuments({ status: 'completed' });
    const recentPurchases = await Purchase.find({ status: 'completed' })
      .populate('user', 'username email')
      .populate('product', 'name')
      .sort({ createdAt: -1 })
      .limit(10);
    
    res.json({
      success: true,
      stats: {
        totalUsers,
        totalProducts,
        totalSales: totalSales[0]?.total || 0,
        totalPurchases
      },
      recentPurchases
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get all users
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Delete user
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Delete all purchases of this user
    await Purchase.deleteMany({ user: user._id });
    await User.findByIdAndDelete(user._id);
    
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get all products
router.get('/products', async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json({ success: true, products });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update product
router.put('/products/:id', async (req, res) => {
  try {
    const { name, description, price, features, isActive } = req.body;
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { name, description, price, features, isActive },
      { new: true, runValidators: true }
    );
    
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    
    res.json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Create product
router.post('/products', async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();
    res.status(201).json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Delete product
router.delete('/products/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, message: 'Product deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get all payments (purchases)
router.get('/payments', async (req, res) => {
  try {
    const payments = await Purchase.find()
      .populate('user', 'username email')
      .populate('product', 'name price')
      .sort({ createdAt: -1 });
    res.json({ success: true, payments });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update payment status
router.patch('/payments/:id', async (req, res) => {
  try {
    const { status } = req.body;
    const payment = await Purchase.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }
    res.json({ success: true, payment });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
