const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');
const prisma = require('../config/db');

router.use(authMiddleware, adminMiddleware);

router.get('/stats', async (req, res) => {
  try {
    const totalUsers = await prisma.user.count();
    const totalProducts = await prisma.product.count();
    const salesAgg = await prisma.purchase.aggregate({
      where: { status: 'completed' },
      _sum: { amount: true }
    });
    const totalPurchases = await prisma.purchase.count({ where: { status: 'completed' } });
    const recentPurchases = await prisma.purchase.findMany({
      where: { status: 'completed' },
      include: { user: { select: { username: true, email: true } }, product: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalProducts,
        totalSales: salesAgg._sum.amount || 0,
        totalPurchases
      },
      recentPurchases
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, username: true, email: true, isAdmin: true, createdAt: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.delete('/users/:id', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    await prisma.purchase.deleteMany({ where: { userId: user.id } });
    await prisma.user.delete({ where: { id: user.id } });
    res.json({ success: true, message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/products', async (req, res) => {
  try {
    const products = await prisma.product.findMany({ orderBy: { createdAt: 'desc' } });
    res.json({ success: true, products });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.put('/products/:id', async (req, res) => {
  try {
    const { name, description, price, features, isActive } = req.body;
    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: { name, description, price, features, isActive }
    });
    res.json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/products', async (req, res) => {
  try {
    const product = await prisma.product.create({ data: req.body });
    res.status(201).json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.delete('/products/:id', async (req, res) => {
  try {
    await prisma.product.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Product deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/payments', async (req, res) => {
  try {
    const payments = await prisma.purchase.findMany({
      include: { user: { select: { username: true, email: true } }, product: { select: { name: true, price: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, payments });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.patch('/payments/:id', async (req, res) => {
  try {
    const { status } = req.body;
    const payment = await prisma.purchase.update({
      where: { id: req.params.id },
      data: { status }
    });
    res.json({ success: true, payment });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
