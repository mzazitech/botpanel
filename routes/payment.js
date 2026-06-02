const express = require('express');
const router = express.Router();
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const prisma = require('../config/db');
const { authMiddleware } = require('../middleware/auth');

const generateApiKey = () => {
  return 'MZ-' + uuidv4().replace(/-/g, '').substring(0, 24).toUpperCase();
};

router.post('/initialize', authMiddleware, async (req, res) => {
  try {
    const { productId } = req.body;
    const product = await prisma.product.findUnique({
      where: { id: productId }
    });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const transactionRef = 'MZ-' + Date.now() + '-' + Math.random().toString(36).substr(2, 8);
    const amountInKobo = product.price * 100;

    // Create pending purchase
    const purchase = await prisma.purchase.create({
      data: {
        userId: req.user.id,
        productId: product.id,
        transactionRef,
        amount: product.price,
        status: 'pending'
      }
    });

    const response = await axios.post('https://api.paystack.co/transaction/initialize', {
      email: req.user.email,
      amount: amountInKobo,
      reference: transactionRef,
      callback_url: process.env.PAYSTACK_CALLBACK_URL,
      metadata: {
        userId: req.user.id,
        productId: product.id,
        purchaseId: purchase.id
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

router.get('/verify', async (req, res) => {
  try {
    const { reference } = req.query;
    if (!reference) {
      return res.redirect('/payment/failed?error=No reference provided');
    }

    const purchase = await prisma.purchase.findUnique({
      where: { transactionRef: reference },
      include: { product: true, user: true }
    });

    if (!purchase) {
      return res.redirect('/payment/failed?error=Invalid transaction');
    }

    if (purchase.status === 'completed') {
      return res.redirect(`/payment/success?reference=${reference}`);
    }

    const response = await axios.get(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` }
    });

    const { data } = response.data;

    if (data.status === 'success') {
      const apiKey = generateApiKey();
      let expiryDate = null;
      if (purchase.product.type === 'subscription' && purchase.product.durationDays) {
        expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + purchase.product.durationDays);
      }

      await prisma.purchase.update({
        where: { id: purchase.id },
        data: {
          status: 'completed',
          apiKey,
          expiryDate,
          paymentDetails: data,
          deliveredAt: new Date()
        }
      });

      res.redirect(`/payment/success?reference=${reference}`);
    } else {
      await prisma.purchase.update({
        where: { id: purchase.id },
        data: { status: 'failed' }
      });
      res.redirect('/payment/failed?error=Payment verification failed');
    }
  } catch (error) {
    console.error('Verification error:', error);
    res.redirect('/payment/failed?error=Verification error');
  }
});

router.get('/success-data', async (req, res) => {
  try {
    const { reference } = req.query;
    const purchase = await prisma.purchase.findUnique({
      where: { transactionRef: reference },
      include: { product: true, user: true }
    });

    if (!purchase || purchase.status !== 'completed') {
      return res.status(404).json({ success: false, message: 'Purchase not found' });
    }

    res.json({
      success: true,
      purchase: {
        id: purchase.id,
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
