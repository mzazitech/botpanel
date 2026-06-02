const express = require('express');
const router = express.Router();
const { optionalAuth } = require('../middleware/auth');
const Product = require('../models/Product');
const Purchase = require('../models/Purchase');

// Main pages
router.get('/', optionalAuth, async (req, res) => {
  try {
    const products = await Product.find({ isActive: true });
    res.render('index', { 
      title: 'Mzazi Tech Store - Premium Digital Products',
      user: req.user || null,
      products: products
    });
  } catch (error) {
    res.render('index', { title: 'Mzazi Tech Store', user: req.user || null, products: [] });
  }
});

router.get('/login', (req, res) => {
  if (req.user) return res.redirect('/dashboard');
  res.render('login', { title: 'Login - Mzazi Tech Store', user: null });
});

router.get('/register', (req, res) => {
  if (req.user) return res.redirect('/dashboard');
  res.render('register', { title: 'Register - Mzazi Tech Store', user: null });
});

router.get('/dashboard', optionalAuth, async (req, res) => {
  if (!req.user) return res.redirect('/login');
  res.render('dashboard', { title: 'Dashboard - Mzazi Tech Store', user: req.user });
});

router.get('/admin', optionalAuth, async (req, res) => {
  if (!req.user || !req.user.isAdmin) return res.redirect('/');
  res.render('admin', { title: 'Admin Panel - Mzazi Tech Store', user: req.user });
});

// Payment pages
router.get('/payment/success', optionalAuth, async (req, res) => {
  const { reference } = req.query;
  if (!reference) return res.redirect('/');
  
  try {
    const purchase = await Purchase.findOne({ transactionRef: reference }).populate('product');
    res.render('payment-success', { 
      title: 'Payment Successful',
      user: req.user || null,
      purchase: purchase,
      reference: reference
    });
  } catch (error) {
    res.render('payment-success', { title: 'Payment Successful', user: req.user || null, purchase: null });
  }
});

router.get('/payment/failed', optionalAuth, (req, res) => {
  const { error } = req.query;
  res.render('payment-failed', { 
    title: 'Payment Failed',
    user: req.user || null,
    error: error || 'Your payment could not be processed'
  });
});

// Static pages
router.get('/faq', optionalAuth, (req, res) => {
  res.render('faq', { title: 'FAQ - Mzazi Tech Store', user: req.user || null });
});

router.get('/contact', optionalAuth, (req, res) => {
  res.render('contact', { title: 'Contact Us - Mzazi Tech Store', user: req.user || null });
});

router.get('/terms', optionalAuth, (req, res) => {
  res.render('terms', { title: 'Terms & Conditions - Mzazi Tech Store', user: req.user || null });
});

router.get('/privacy', optionalAuth, (req, res) => {
  res.render('privacy', { title: 'Privacy Policy - Mzazi Tech Store', user: req.user || null });
});

module.exports = router;
