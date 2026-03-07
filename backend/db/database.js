const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcrypt');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'vriends.db');
const db = new Database(DB_PATH);

// Activer WAL mode et foreign keys
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Créer les tables si elles n'existent pas
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'client',
    local_status INTEGER NOT NULL DEFAULT 0,
    discount_percent INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    price REAL NOT NULL,
    available INTEGER NOT NULL DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    total_price REAL NOT NULL,
    pickup_time TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at DATETIME DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL REFERENCES orders(id),
    product_id INTEGER NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL,
    price REAL NOT NULL
  );

  CREATE TABLE IF NOT EXISTS contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    message TEXT NOT NULL,
    consent INTEGER NOT NULL DEFAULT 0,
    treated INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS qr_scans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ip_address TEXT,
    user_agent TEXT,
    created_at DATETIME DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT NOT NULL UNIQUE,
    value TEXT NOT NULL,
    updated_at DATETIME DEFAULT (datetime('now'))
  );
`);

// Seed initial data
const seedData = async () => {
  try {
    // Vérifier si admin existe
    const adminExists = db.prepare('SELECT id FROM users WHERE email = ?').get('admin@vriends.be');
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('admin1234', 10);
      db.prepare(`
        INSERT INTO users (name, email, password, role, local_status, discount_percent)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run('Admin Vriends', 'admin@vriends.be', hashedPassword, 'admin', 1, 10);
      console.log('✅ Admin créé : admin@vriends.be / admin1234');
    } else {
      console.log('ℹ️  Admin existe déjà');
    }

    // Créer le compte admin Ismael
    const ismaelExists = db.prepare('SELECT id FROM users WHERE email = ?').get('ismaelbentaleb@hotmail.com');
    if (!ismaelExists) {
      const hashedPasswordIsmael = await bcrypt.hash('Admin1234', 10);
      db.prepare(`
        INSERT INTO users (name, email, password, role, local_status, discount_percent)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run('Ismael Bentaleb', 'ismaelbentaleb@hotmail.com', hashedPasswordIsmael, 'admin', 1, 10);
      console.log('✅ Admin Ismael créé : ismaelbentaleb@hotmail.com / Admin1234');
    } else {
      console.log('ℹ️  Admin Ismael existe déjà');
    }

    // Vérifier si produits existent
    const productsCount = db.prepare('SELECT COUNT(*) as count FROM products').get();
    if (productsCount.count === 0) {
      const products = [
        { name: 'Menu Phare', price: 7.0 },
        { name: 'Croissant', price: 2.5 },
        { name: 'Jus Zumex', price: 3.5 },
        { name: 'Gaufre-Crêpe', price: 3.0 }
      ];
      const insertProduct = db.prepare('INSERT INTO products (name, price, available) VALUES (?, ?, ?)');
      const insertMany = db.transaction((products) => {
        for (const product of products) {
          insertProduct.run(product.name, product.price, 1);
        }
      });
      insertMany(products);
      console.log('✅ Produits seed créés');
    } else {
      console.log('ℹ️  Produits existent déjà');
    }

    // Initialiser les settings par défaut
    const qrUrlExists = db.prepare('SELECT id FROM settings WHERE key = ?').get('qr_code_url');
    if (!qrUrlExists) {
      const defaultUrl = 'https://vriends-frontend-production.up.railway.app/contact?qr=true';
      db.prepare(`
        INSERT INTO settings (key, value)
        VALUES (?, ?)
      `).run('qr_code_url', defaultUrl);
      console.log('✅ Setting qr_code_url initialisé');
      
      // Générer et stocker l'URL de l'image QR code
      const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(defaultUrl)}&bgcolor=F7F5F2&color=3A2E25&margin=12`;
      db.prepare(`
        INSERT INTO settings (key, value)
        VALUES (?, ?)
      `).run('qr_code_image_url', qrImageUrl);
      console.log('✅ Setting qr_code_image_url initialisé');
    }
  } catch (error) {
    console.error('❌ Erreur lors du seed:', error);
    throw error;
  }
};

// Exécuter le seed au chargement du module
seedData()
  .then(() => {
    console.log('✅ Seed terminé avec succès');
  })
  .catch((error) => {
    console.error('❌ Erreur lors du seed:', error);
  });

module.exports = db;
module.exports.seedData = seedData;
