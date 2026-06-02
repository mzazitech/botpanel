const express = require('express');
const router = express.Router();
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const Purchase = require('../models/Purchase');
const Product = require('../models/Product');
const { authMiddleware } = require('../middleware/auth');

// Generate random API key
const generateApiKey = () => {
  return 'MZ-' + uuidv4().replace(/-/g, '').substring(0, 24).toUpperCase();
};

// Initialize payment
router.post('/initialize', authMiddleware, async (req, res) => {
  try {
    const { productId } = req.body;
    const product = await Product.findById(productId);
    
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const transactionRef = 'MZ-' + Date.now() + '-' + Math.random().toString(36).substr(2, 8);
    const amountInKobo = product.price * 100; // Paystack uses kobo (100 kobo = 1 KES)

    // Create pending purchase record
    const purchase = new Purchase({
      user: req.user._id,
      product: product._id,
      transactionRef,
      amount: product.price,
      status: 'pending'
    });
    await purchase.save();

    // Initialize Paystack transaction
    const response = await axios.post('https://api.paystack.co/transaction/initialize', {
      email: req.user.email,
      amount: amountInKobo,
      reference: transactionRef,
      callback_url: process.env.PAYSTACK_CALLBACK_URL,
      metadata: {
        userId: req.user._id.toString(),
        productId: product._id.toString(),
        purchaseId: purchase._id.toString()
      }
    }, {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.data.status) {
      res.json({
        success: true,
        authorization_url: response.data.data.authorization_url,
        reference: transactionRef
      });
    } else {
      throw new Error('Paystack initialization failed');
    }
  } catch (error) {
    console.error('Payment init error:', error.response?.data || error.message);
    res.status(500).json({ success: false, message: 'Payment initialization failed' });
  }
});

// Verify payment (callback endpoint)
router.get('/verify', async (req, res) => {
  try {
    const { reference } = req.query;
    
    if (!reference) {
      return res.redirect('/payment/failed?error=No reference provided');
    }

    const purchase = await Purchase.findOne({ transactionRef: reference }).populate('product user');
    
    if (!purchase) {
      return res.redirect('/payment/failed?error=Invalid transaction');
    }

    if (purchase.status === 'completed') {
      return res.redirect(`/payment/success?reference=${reference}`);
    }

    // Verify with Paystack
    const response = await axios.get(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
      }
    });

    const { data } = response.data;
    
    if (data.status === 'success') {
      // Generate API key for the purchase
      const apiKey = generateApiKey();
      
      // Calculate expiry date for subscription products
      let expiryDate = null;
      if (purchase.product.type === 'subscription' && purchase.product.durationDays) {
        expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + purchase.product.durationDays);
      }

      purchase.status = 'completed';
      purchase.apiKey = apiKey;
      purchase.expiryDate = expiryDate;
      purchase.paymentDetails = data;
      purchase.deliveredAt = new Date();
      await purchase.save();

      // Redirect to success page
      res.redirect(`/payment/success?reference=${reference}`);
    } else {
      purchase.status = 'failed';
      await purchase.save();
      res.redirect('/payment/failed?error=Payment verification failed');
    }
  } catch (error) {
    console.error('Verification error:', error);
    res.redirect('/payment/failed?error=Verification error');
  }
});

// Success page data
router.get('/success-data', async (req, res) => {
  try {
    const { reference } = req.query;
    const purchase = await Purchase.findOne({ transactionRef: reference }).populate('product user');
    
    if (!purchase || purchase.status !== 'completed') {
      return res.status(404).json({ success: false, message: 'Purchase not found' });
    }
    
    res.json({
      success: true,
      purchase: {
        id: purchase._id,
        productName: purchase.product.name,
        amount: purchase.amount,
        apiKey: purchase.apiKey,
        expiryDate: purchase.expiryDate,
        deliveredAt: purchase.deliveredAt
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
