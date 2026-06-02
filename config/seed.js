const Product = require('../models/Product');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

const productsData = [
  {
    name: 'Unlimited Server Panel',
    description: 'Full-featured Pterodactyl panel with unlimited servers, game support, and 24/7 uptime.',
    price: 100,
    category: 'panel',
    features: ['Unlimited servers', 'DDoS protection', 'Game & web hosting', 'Auto installer'],
    imageIcon: '🖥️',
    type: 'license'
  },
  {
    name: 'Unlimited Server Panel Premium',
    description: 'Advanced panel with premium features, priority support, and resource monitoring.',
    price: 150,
    category: 'panel',
    features: ['All Unlimited features', 'Premium templates', 'API access', 'Priority queue'],
    imageIcon: '⚡',
    type: 'license'
  },
  {
    name: 'Admin Panel',
    description: 'Complete administration dashboard with user management, analytics, and automation.',
    price: 300,
    category: 'panel',
    features: ['User management', 'Analytics', 'Automation rules', 'Custom branding'],
    imageIcon: '👑',
    type: 'license'
  },
  {
    name: 'WhatsApp Bot Monthly Subscription',
    description: 'AI-powered WhatsApp bot with automation, bulk messaging, and CRM integration.',
    price: 130,
    category: 'subscription',
    features: ['Unlimited messages', 'Auto-reply', 'Broadcast lists', 'Analytics dashboard'],
    imageIcon: '🤖',
    type: 'subscription',
    durationDays: 30
  },
  {
    name: 'API Key Premium',
    description: 'High-performance API key with 10K requests/day, webhooks, and real-time data.',
    price: 200,
    category: 'api',
    features: ['10K daily requests', 'Webhook support', 'Rate limiting control', 'Analytics'],
    imageIcon: '🔑',
    type: 'api_key'
  }
];

async function seedProducts() {
  try {
    const count = await Product.countDocuments();
    if (count === 0) {
      await Product.insertMany(productsData);
      console.log('✅ Products seeded successfully');
    } else {
      console.log('📦 Products already exist, skipping seed');
    }
  } catch (error) {
    console.error('Error seeding products:', error);
  }
}

async function seedAdmin() {
  try {
    const adminExists = await User.findOne({ email: process.env.ADMIN_EMAIL });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);
      await User.create({
        username: 'Administrator',
        email: process.env.ADMIN_EMAIL,
        password: hashedPassword,
        isAdmin: true,
        emailVerified: true
      });
      console.log('✅ Admin user created successfully');
    }
  } catch (error) {
    console.error('Error seeding admin:', error);
  }
}

module.exports = async () => {
  await seedProducts();
  await seedAdmin();
};
