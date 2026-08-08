/**
 * Migration one-shot SQLite → PostgreSQL.
 * Usage: npm run db:migrate-from-sqlite
 *
 * Prérequis: DATABASE_URL Postgres + fichier SQLite (SQLITE_PATH ou backend/db/vriends.db)
 */
require('dotenv').config();
const path = require('path');
const fs = require('fs');
const Module = require('module');

// Préférer local_modules si node_modules racine est cassé / root-owned
const localNm = path.join(__dirname, '../local_modules/node_modules');
if (fs.existsSync(localNm)) {
  process.env.NODE_PATH = [localNm, process.env.NODE_PATH].filter(Boolean).join(path.delimiter);
  Module._initPaths();
}

const Database = require(fs.existsSync(path.join(localNm, 'better-sqlite3'))
  ? path.join(localNm, 'better-sqlite3')
  : 'better-sqlite3');
const { PrismaClient } = require(fs.existsSync(path.join(localNm, '@prisma/client'))
  ? path.join(localNm, '@prisma/client')
  : '@prisma/client');

const SQLITE_PATH = process.env.SQLITE_PATH || path.join(__dirname, '../db/vriends.db');
const prisma = new PrismaClient();

function toBool(v) {
  return v === 1 || v === true || v === '1';
}

function parseJson(value, fallback = null) {
  if (value == null || value === '') return fallback;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function toDate(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

async function resetSequence(table, idCol = 'id') {
  await prisma.$executeRawUnsafe(`
    SELECT setval(
      pg_get_serial_sequence('${table}', '${idCol}'),
      COALESCE((SELECT MAX(${idCol}) FROM ${table}), 1),
      true
    );
  `);
}

async function main() {
  console.log('📥 Lecture SQLite:', SQLITE_PATH);
  const sqlite = new Database(SQLITE_PATH, { readonly: true });

  const users = sqlite.prepare('SELECT * FROM users').all();
  const categories = (() => {
    try {
      return sqlite.prepare('SELECT * FROM categories').all();
    } catch {
      return [];
    }
  })();
  const products = sqlite.prepare('SELECT * FROM products').all();
  const orders = sqlite.prepare('SELECT * FROM orders').all();
  const orderItems = sqlite.prepare('SELECT * FROM order_items').all();
  const contacts = sqlite.prepare('SELECT * FROM contacts').all();
  const qrScans = sqlite.prepare('SELECT * FROM qr_scans').all();
  const settings = sqlite.prepare('SELECT * FROM settings').all();
  const posOrders = (() => {
    try {
      return sqlite.prepare('SELECT * FROM pos_orders').all();
    } catch {
      return [];
    }
  })();
  const posItems = (() => {
    try {
      return sqlite.prepare('SELECT * FROM pos_order_items').all();
    } catch {
      return [];
    }
  })();

  console.log('🧹 Nettoyage Postgres (ordre FK)...');
  await prisma.posOrderItem.deleteMany();
  await prisma.posOrder.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.qrScan.deleteMany();
  await prisma.setting.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  console.log(`👤 Users: ${users.length}`);
  for (const u of users) {
    await prisma.user.create({
      data: {
        id: u.id,
        name: u.name,
        email: u.email,
        password: u.password,
        role: u.role || 'client',
        localStatus: toBool(u.local_status),
        discountPercent: u.discount_percent || 0,
        createdAt: toDate(u.created_at) || new Date(),
      },
    });
  }
  await resetSequence('users');

  console.log(`🏷️  Categories: ${categories.length}`);
  for (const c of categories) {
    await prisma.category.create({
      data: {
        id: c.id,
        name: c.name,
        sortOrder: c.sort_order || 0,
        createdAt: toDate(c.created_at) || new Date(),
      },
    });
  }
  // Catégories issues des produits
  const productCats = [...new Set(products.map((p) => p.category || 'Autres'))];
  for (const name of productCats) {
    await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name, sortOrder: 99 },
    });
  }
  await resetSequence('categories');

  console.log(`🧃 Products: ${products.length}`);
  for (const p of products) {
    await prisma.product.create({
      data: {
        id: p.id,
        name: p.name,
        price: p.price,
        available: toBool(p.available),
        category: p.category || 'Autres',
        imageUrl: p.image_url || null,
        isFavorite: toBool(p.is_favorite),
        sku: p.sku || null,
        optionsSchema: p.options_schema || null,
      },
    });
  }
  await resetSequence('products');

  console.log(`📦 Orders: ${orders.length}`);
  for (const o of orders) {
    await prisma.order.create({
      data: {
        id: o.id,
        userId: o.user_id,
        totalPrice: o.total_price,
        pickupTime: o.pickup_time,
        status: o.status || 'pending',
        createdAt: toDate(o.created_at) || new Date(),
      },
    });
  }
  await resetSequence('orders');

  console.log(`📦 Order items: ${orderItems.length}`);
  for (const it of orderItems) {
    await prisma.orderItem.create({
      data: {
        id: it.id,
        orderId: it.order_id,
        productId: it.product_id,
        quantity: it.quantity,
        price: it.price,
      },
    });
  }
  await resetSequence('order_items');

  console.log(`💳 POS orders: ${posOrders.length}`);
  for (const o of posOrders) {
    await prisma.posOrder.create({
      data: {
        id: o.id,
        orderNumber: o.order_number,
        cashierId: o.cashier_id,
        customerType: o.customer_type || 'STANDARD',
        orderType: o.order_type || 'DINE_IN',
        status: o.status || 'open',
        subtotalCents: o.subtotal_cents || 0,
        customerDiscountCents: o.customer_discount_cents || 0,
        earlyBirdDiscountCents: o.early_bird_discount_cents || 0,
        lateSurchargeCents: o.late_surcharge_cents || 0,
        discountCents: o.discount_cents || 0,
        surchargeCents: o.surcharge_cents || 0,
        totalCents: o.total_cents || 0,
        paymentMethod: o.payment_method || null,
        paymentStatus: o.payment_status || 'unpaid',
        cashReceivedCents: o.cash_received_cents,
        cashChangeCents: o.cash_change_cents,
        appliedRules: parseJson(o.applied_rules, []),
        taxCents: o.tax_cents || 0,
        idempotencyKey: o.idempotency_key || null,
        notes: o.notes || null,
        heldAt: toDate(o.held_at),
        paidAt: toDate(o.paid_at),
        createdAt: toDate(o.created_at) || new Date(),
        updatedAt: toDate(o.updated_at) || new Date(),
      },
    });
  }
  await resetSequence('pos_orders');

  console.log(`💳 POS items: ${posItems.length}`);
  for (const it of posItems) {
    await prisma.posOrderItem.create({
      data: {
        id: it.id,
        orderId: it.order_id,
        productId: it.product_id,
        productNameSnapshot: it.product_name_snapshot,
        unitPriceCents: it.unit_price_cents,
        quantity: it.quantity,
        optionsJson: parseJson(it.options_json, null),
        subtotalCents: it.subtotal_cents,
      },
    });
  }
  await resetSequence('pos_order_items');

  console.log(`✉️  Contacts: ${contacts.length}`);
  for (const c of contacts) {
    await prisma.contact.create({
      data: {
        id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        message: c.message,
        consent: toBool(c.consent),
        treated: toBool(c.treated),
        createdAt: toDate(c.created_at) || new Date(),
      },
    });
  }
  await resetSequence('contacts');

  console.log(`📱 QR scans: ${qrScans.length}`);
  for (const q of qrScans) {
    await prisma.qrScan.create({
      data: {
        id: q.id,
        ipAddress: q.ip_address,
        userAgent: q.user_agent,
        createdAt: toDate(q.created_at) || new Date(),
      },
    });
  }
  await resetSequence('qr_scans');

  console.log(`⚙️  Settings: ${settings.length}`);
  for (const s of settings) {
    await prisma.setting.create({
      data: {
        id: s.id,
        key: s.key,
        value: s.value,
        updatedAt: toDate(s.updated_at) || new Date(),
      },
    });
  }
  await resetSequence('settings');

  sqlite.close();
  console.log('✅ Migration SQLite → PostgreSQL terminée');
}

main()
  .catch((err) => {
    console.error('❌ Migration échouée:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
