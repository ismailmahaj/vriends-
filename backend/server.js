require('dotenv').config();
const db = require('./db/database');

const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const productsRoutes = require('./routes/products');
const ordersRoutes = require('./routes/orders');
const contactsRoutes = require('./routes/contacts');
const qrRoutes = require('./routes/qr');

const app = express();
const PORT = process.env.PORT || 3001;

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

app.set('trust proxy', 1);
app.use(express.json({ limit: '10kb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/contacts', contactsRoutes);
app.use('/api/qr', qrRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Route non trouvée' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Erreur serveur' });
});

// Vérifier les variables d'environnement
if (!process.env.JWT_SECRET) {
  console.warn('⚠️  JWT_SECRET non défini, utilisation d\'une valeur par défaut (non sécurisée pour la production)');
  process.env.JWT_SECRET = 'vriends_super_secret_key_change_in_production';
}

// Démarrer le serveur
// Le seed s'exécute automatiquement lors du chargement de database.js
app.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
  console.log(`📝 JWT_SECRET: ${process.env.JWT_SECRET ? '✅ Défini' : '❌ Non défini'}`);
});
