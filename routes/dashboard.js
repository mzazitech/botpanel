const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const prisma = require('../config/db');

router.get('/', authMiddleware, async (req, res) => {
  try {
    const purchases = await prisma.purchase.findMany({
      where: { userId: req.user.id, status: 'completed' },
      include: { product: true },
      orderBy: { createdAt: 'desc' }
    });

    const activePurchases = purchases.filter(p => {
      if (p.expiryDate) {
        return new Date(p.expiryDate) > new Date();
      }
      return true;
    });

    const apiKeys = purchases.filter(p => p.apiKey).map(p => ({
      id: p.id,
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
        id: p.id,
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

router.get('/purchase/:id', authMiddleware, async (req, res) => {
  try {
    const purchase = await prisma.purchase.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      },
      include: { product: true }
    });
    if (!purchase) {
      return res.status(404).json({ success: false, message: 'Purchase not found' });
    }
    res.json({ success: true, purchase });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
