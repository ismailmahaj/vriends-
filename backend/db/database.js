const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcrypt');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'vriends.db');
const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

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

  CREATE TABLE IF NOT EXISTS pos_orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_number TEXT NOT NULL UNIQUE,
    cashier_id INTEGER NOT NULL REFERENCES users(id),
    customer_type TEXT NOT NULL DEFAULT 'STANDARD',
    order_type TEXT NOT NULL DEFAULT 'DINE_IN',
    status TEXT NOT NULL DEFAULT 'open',
    subtotal_cents INTEGER NOT NULL DEFAULT 0,
    customer_discount_cents INTEGER NOT NULL DEFAULT 0,
    early_bird_discount_cents INTEGER NOT NULL DEFAULT 0,
    late_surcharge_cents INTEGER NOT NULL DEFAULT 0,
    discount_cents INTEGER NOT NULL DEFAULT 0,
    surcharge_cents INTEGER NOT NULL DEFAULT 0,
    total_cents INTEGER NOT NULL DEFAULT 0,
    payment_method TEXT,
    payment_status TEXT NOT NULL DEFAULT 'unpaid',
    cash_received_cents INTEGER,
    cash_change_cents INTEGER,
    applied_rules TEXT,
    tax_cents INTEGER NOT NULL DEFAULT 0,
    idempotency_key TEXT UNIQUE,
    notes TEXT,
    held_at DATETIME,
    paid_at DATETIME,
    created_at DATETIME DEFAULT (datetime('now')),
    updated_at DATETIME DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS pos_order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL REFERENCES pos_orders(id) ON DELETE CASCADE,
    product_id INTEGER,
    product_name_snapshot TEXT NOT NULL,
    unit_price_cents INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    options_json TEXT,
    subtotal_cents INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_pos_orders_status ON pos_orders(status);
  CREATE INDEX IF NOT EXISTS idx_pos_orders_created ON pos_orders(created_at);
  CREATE INDEX IF NOT EXISTS idx_pos_orders_cashier ON pos_orders(cashier_id);

  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT (datetime('now'))
  );
`);

function ensureColumn(table, column, definition) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all();
  if (!cols.some((c) => c.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

ensureColumn('products', 'category', "TEXT NOT NULL DEFAULT 'Autres'");
ensureColumn('products', 'image_url', 'TEXT');
ensureColumn('products', 'is_favorite', 'INTEGER NOT NULL DEFAULT 0');
ensureColumn('products', 'sku', 'TEXT');
ensureColumn('products', 'options_schema', 'TEXT');

const DEFAULT_POS_SETTINGS = [
  ['pos_resident_discount_percent', '10'],
  ['pos_worker_discount_percent', '5'],
  ['pos_early_bird_discount_percent', '4'],
  ['pos_early_bird_end_time', '09:45'],
  ['pos_late_surcharge_percent', '3'],
  ['pos_late_surcharge_start_time', '11:00'],
  ['pos_shop_name', 'VRIENDS'],
  ['pos_shop_address', 'Poperinge, Belgique'],
];

function inferCategory(name) {
  const n = (name || '').toLowerCase();
  if (n.includes('jus') || n.includes('zumex') || n.includes('smoothie')) return 'Jus';
  if (n.includes('café') || n.includes('coffee') || n.includes('latte') || n.includes('thé') || n.includes('boisson')) return 'Boissons';
  if (n.includes('wrap') || n.includes('menu') || n.includes('phare') || n.includes('sandwich')) return 'Wraps';
  if (n.includes('gaufre') || n.includes('crêpe') || n.includes('crepe') || n.includes('croissant') || n.includes('dessert')) return 'Desserts';
  return 'Autres';
}

const seedData = async () => {
  try {
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

    const cashierExists = db.prepare('SELECT id FROM users WHERE email = ?').get('caisse@vriends.be');
    if (!cashierExists) {
      const hashedCashier = await bcrypt.hash('caisse1234', 10);
      db.prepare(`
        INSERT INTO users (name, email, password, role, local_status, discount_percent)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run('Caisse Vriends', 'caisse@vriends.be', hashedCashier, 'cashier', 0, 0);
      console.log('✅ Caissier créé : caisse@vriends.be / caisse1234');
    }

    const productsCount = db.prepare('SELECT COUNT(*) as count FROM products').get();
    if (productsCount.count === 0) {
      const products = [
        { name: 'Menu Phare', price: 7.0, category: 'Wraps', favorite: 1 },
        { name: 'Wrap Poulet', price: 6.5, category: 'Wraps', favorite: 1 },
        { name: 'Croissant', price: 2.5, category: 'Desserts', favorite: 1 },
        { name: 'Jus Zumex', price: 3.5, category: 'Jus', favorite: 1 },
        { name: 'Gaufre-Crêpe', price: 3.0, category: 'Desserts', favorite: 0 },
        { name: 'Café filtre', price: 2.2, category: 'Boissons', favorite: 1 },
        { name: 'Cappuccino', price: 3.2, category: 'Boissons', favorite: 0 },
        { name: 'Eau plate', price: 1.5, category: 'Boissons', favorite: 0 },
      ];
      const insertProduct = db.prepare(`
        INSERT INTO products (name, price, available, category, is_favorite)
        VALUES (?, ?, 1, ?, ?)
      `);
      const insertMany = db.transaction((list) => {
        for (const product of list) {
          insertProduct.run(product.name, product.price, product.category, product.favorite);
        }
      });
      insertMany(products);
      console.log('✅ Produits seed créés');
    } else {
      const products = db.prepare('SELECT id, name, category, is_favorite FROM products').all();
      const updateCat = db.prepare('UPDATE products SET category = ? WHERE id = ?');
      const updateFav = db.prepare('UPDATE products SET is_favorite = 1 WHERE id = ?');
      const favCount = db.prepare('SELECT COUNT(*) as c FROM products WHERE is_favorite = 1').get();
      for (const p of products) {
        if (!p.category || p.category === 'Autres') {
          const inferred = inferCategory(p.name);
          if (inferred !== 'Autres') updateCat.run(inferred, p.id);
        }
      }
      if (favCount.c === 0) {
        for (const p of products.slice(0, 3)) updateFav.run(p.id);
      }
      console.log('ℹ️  Produits existent déjà');
    }

    const qrUrlExists = db.prepare('SELECT id FROM settings WHERE key = ?').get('qr_code_url');
    if (!qrUrlExists) {
      const defaultUrl = 'https://www.vriendscoffeeshop.com/register';
      db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run('qr_code_url', defaultUrl);
      console.log('✅ Setting qr_code_url initialisé');
    }

    const imageExists = db.prepare('SELECT id FROM settings WHERE key = ?').get('qr_code_image_url');
    if (!imageExists) {
      const qrUrlSetting = db.prepare('SELECT value FROM settings WHERE key = ?').get('qr_code_url');
      const destinationUrl = qrUrlSetting ? qrUrlSetting.value : 'https://www.vriendscoffeeshop.com/register';
      const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(destinationUrl)}&bgcolor=F7F5F2&color=3A2E25&margin=12`;
      db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run('qr_code_image_url', qrImageUrl);
      console.log(`✅ Setting qr_code_image_url initialisé (pointe vers: ${destinationUrl})`);
    } else {
      const qrUrlSetting = db.prepare('SELECT value FROM settings WHERE key = ?').get('qr_code_url');
      if (qrUrlSetting) {
        const destinationUrl = qrUrlSetting.value;
        const currentImage = db.prepare('SELECT value FROM settings WHERE key = ?').get('qr_code_image_url');
        if (!currentImage.value.includes(encodeURIComponent(destinationUrl))) {
          const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(destinationUrl)}&bgcolor=F7F5F2&color=3A2E25&margin=12`;
          db.prepare(`
            UPDATE settings SET value = ?, updated_at = datetime('now') WHERE key = 'qr_code_image_url'
          `).run(qrImageUrl);
          console.log(`✅ Image QR code mise à jour pour pointer vers: ${destinationUrl}`);
        }
      }
    }

    const insertSetting = db.prepare(`
      INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)
    `);
    for (const [key, value] of DEFAULT_POS_SETTINGS) {
      insertSetting.run(key, value);
    }
    console.log('✅ Settings POS initialisés');

    // Synchroniser les catégories depuis les produits + défauts
    const defaultCategories = ['Wraps', 'Boissons', 'Desserts', 'Jus', 'Autres'];
    const insertCat = db.prepare(`
      INSERT OR IGNORE INTO categories (name, sort_order) VALUES (?, ?)
    `);
    defaultCategories.forEach((name, i) => insertCat.run(name, i));
    const fromProducts = db.prepare(`
      SELECT DISTINCT category as name FROM products WHERE category IS NOT NULL AND trim(category) != ''
    `).all();
    fromProducts.forEach((row, i) => insertCat.run(row.name, defaultCategories.length + i));
    console.log('✅ Catégories synchronisées');
  } catch (error) {
    console.error('❌ Erreur lors du seed:', error);
    throw error;
  }
};

seedData()
  .then(() => {
    console.log('✅ Seed terminé avec succès');
  })
  .catch((error) => {
    console.error('❌ Erreur lors du seed:', error);
  });

module.exports = db;
module.exports.seedData = seedData;
