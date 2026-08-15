require('dotenv').config();

const express = require('express');
const cors = require('cors');
const prisma = require('./db/prisma');
const authRoutes = require('./routes/auth');
const productsRoutes = require('./routes/products');
const categoriesRoutes = require('./routes/categories');
const ordersRoutes = require('./routes/orders');
const contactsRoutes = require('./routes/contacts');
const qrRoutes = require('./routes/qr');
const settingsRoutes = require('./routes/settings');
const posRoutes = require('./routes/pos');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

app.set('trust proxy', 1);
app.use(express.json({ limit: '2mb' }));

app.use('/api/auth', authRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/contacts', contactsRoutes);
app.use('/api/qr', qrRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/pos', posRoutes);

app.get('/api/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', db: 'postgresql' });
  } catch (error) {
    res.status(500).json({ status: 'error', db: 'unavailable' });
  }
});

app.use((req, res) => {
  res.status(404).json({ error: 'Route non trouvée' });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Erreur serveur' });
});

if (!process.env.JWT_SECRET) {
  console.warn('⚠️  JWT_SECRET non défini, utilisation d\'une valeur par défaut (non sécurisée pour la production)');
  process.env.JWT_SECRET = 'vriends_super_secret_key_change_in_production';
}

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL manquante — configurez PostgreSQL (voir docs/POSTGRES.md)');
  process.exit(1);
}

app.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
  console.log('🗄️  Database: PostgreSQL (Prisma)');
  console.log(`📝 JWT_SECRET: ${process.env.JWT_SECRET ? '✅ Défini' : '❌ Non défini'}`);
});
