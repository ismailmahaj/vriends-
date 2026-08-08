const db = require('../db/database');
const {
  calculateOrderPricing,
  eurosToCents,
  DEFAULT_POS_SETTINGS,
  CUSTOMER_TYPES,
} = require('../../shared/pricingEngine.cjs');
const { processPayment } = require('../services/paymentProvider');

const STAFF_ROLES = new Set(['admin', 'manager', 'cashier']);
const MANAGER_ROLES = new Set(['admin', 'manager']);

const VALID_CUSTOMER = new Set(Object.values(CUSTOMER_TYPES));
const VALID_ORDER_TYPE = new Set(['DINE_IN', 'TAKEAWAY', 'DELIVERY']);
const VALID_PAYMENT = new Set(['CARD', 'CASH', 'OTHER']);

function getPosSettingsFromDb() {
  const keys = [
    'pos_resident_discount_percent',
    'pos_worker_discount_percent',
    'pos_early_bird_discount_percent',
    'pos_early_bird_end_time',
    'pos_late_surcharge_percent',
    'pos_late_surcharge_start_time',
    'pos_shop_name',
    'pos_shop_address',
  ];
  const rows = db.prepare(
    `SELECT key, value FROM settings WHERE key IN (${keys.map(() => '?').join(',')})`
  ).all(...keys);
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));

  return {
    residentDiscountPercent: Number(map.pos_resident_discount_percent ?? DEFAULT_POS_SETTINGS.residentDiscountPercent),
    workerDiscountPercent: Number(map.pos_worker_discount_percent ?? DEFAULT_POS_SETTINGS.workerDiscountPercent),
    earlyBirdDiscountPercent: Number(map.pos_early_bird_discount_percent ?? DEFAULT_POS_SETTINGS.earlyBirdDiscountPercent),
    earlyBirdEndTime: map.pos_early_bird_end_time || DEFAULT_POS_SETTINGS.earlyBirdEndTime,
    lateSurchargePercent: Number(map.pos_late_surcharge_percent ?? DEFAULT_POS_SETTINGS.lateSurchargePercent),
    lateSurchargeStartTime: map.pos_late_surcharge_start_time || DEFAULT_POS_SETTINGS.lateSurchargeStartTime,
    shopName: map.pos_shop_name || 'VRIENDS',
    shopAddress: map.pos_shop_address || 'Poperinge, Belgique',
  };
}

function mapProduct(p) {
  let optionsSchema = null;
  if (p.options_schema) {
    try {
      optionsSchema = JSON.parse(p.options_schema);
    } catch {
      optionsSchema = null;
    }
  }
  return {
    id: p.id,
    name: p.name,
    price: p.price,
    priceCents: eurosToCents(p.price),
    available: p.available === 1,
    category: p.category || 'Autres',
    imageUrl: p.image_url || null,
    isFavorite: p.is_favorite === 1,
    sku: p.sku || null,
    optionsSchema,
  };
}

function generateOrderNumber() {
  const now = new Date();
  const day = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('');
  const prefix = `VR-${day}-`;
  const last = db.prepare(`
    SELECT order_number FROM pos_orders
    WHERE order_number LIKE ?
    ORDER BY id DESC LIMIT 1
  `).get(`${prefix}%`);

  let seq = 1;
  if (last?.order_number) {
    const part = last.order_number.split('-').pop();
    const n = parseInt(part, 10);
    if (!Number.isNaN(n)) seq = n + 1;
  }
  return `${prefix}${String(seq).padStart(4, '0')}`;
}

function loadOrder(id) {
  const order = db.prepare(`
    SELECT o.*, u.name as cashier_name
    FROM pos_orders o
    LEFT JOIN users u ON u.id = o.cashier_id
    WHERE o.id = ?
  `).get(id);
  if (!order) return null;

  const items = db.prepare(`
    SELECT * FROM pos_order_items WHERE order_id = ? ORDER BY id
  `).all(id);

  return serializeOrder(order, items);
}

function serializeOrder(order, items = []) {
  let appliedRules = [];
  try {
    appliedRules = order.applied_rules ? JSON.parse(order.applied_rules) : [];
  } catch {
    appliedRules = [];
  }

  return {
    id: order.id,
    orderNumber: order.order_number,
    cashierId: order.cashier_id,
    cashierName: order.cashier_name || null,
    customerType: order.customer_type,
    orderType: order.order_type,
    status: order.status,
    subtotalCents: order.subtotal_cents,
    customerDiscountCents: order.customer_discount_cents,
    earlyBirdDiscountCents: order.early_bird_discount_cents,
    lateSurchargeCents: order.late_surcharge_cents,
    discountCents: order.discount_cents,
    surchargeCents: order.surcharge_cents,
    totalCents: order.total_cents,
    paymentMethod: order.payment_method,
    paymentStatus: order.payment_status,
    cashReceivedCents: order.cash_received_cents,
    cashChangeCents: order.cash_change_cents,
    appliedRules,
    taxCents: order.tax_cents,
    notes: order.notes,
    heldAt: order.held_at,
    paidAt: order.paid_at,
    createdAt: order.created_at,
    updatedAt: order.updated_at,
    items: items.map((it) => {
      let options = null;
      try {
        options = it.options_json ? JSON.parse(it.options_json) : null;
      } catch {
        options = null;
      }
      return {
        id: it.id,
        productId: it.product_id,
        productNameSnapshot: it.product_name_snapshot,
        unitPriceCents: it.unit_price_cents,
        quantity: it.quantity,
        options,
        subtotalCents: it.subtotal_cents,
      };
    }),
  };
}

function resolveLineItems(rawItems) {
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    return { error: 'Panier vide' };
  }

  const lines = [];
  for (const item of rawItems) {
    const productId = item.productId ?? item.product_id;
    const quantity = Math.floor(Number(item.quantity) || 0);
    if (!productId || quantity <= 0) {
      return { error: 'Article invalide' };
    }

    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(productId);
    if (!product) {
      return { error: `Produit ${productId} introuvable` };
    }
    if (product.available !== 1) {
      return { error: `Produit « ${product.name} » épuisé` };
    }

    const unitPriceCents = eurosToCents(product.price);
    const options = item.options || null;
    lines.push({
      productId: product.id,
      productNameSnapshot: product.name,
      unitPriceCents,
      quantity,
      options,
      subtotalCents: unitPriceCents * quantity,
    });
  }

  return { lines };
}

const getProducts = (req, res) => {
  try {
    const products = db.prepare('SELECT * FROM products ORDER BY is_favorite DESC, name ASC').all();
    res.json(products.map(mapProduct));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const getCategories = (req, res) => {
  try {
    const catalog = db.prepare(`
      SELECT c.name, c.sort_order,
        (SELECT COUNT(*) FROM products p WHERE p.category = c.name) as count
      FROM categories c
      ORDER BY c.sort_order ASC, c.name ASC
    `).all();

    // Inclure aussi les catégories orphelines encore présentes sur des produits
    const fromProducts = db.prepare(`
      SELECT category as name, COUNT(*) as count
      FROM products
      GROUP BY category
    `).all();
    const known = new Set(catalog.map((c) => c.name));
    for (const row of fromProducts) {
      if (row.name && !known.has(row.name)) {
        catalog.push({ name: row.name, sort_order: 999, count: row.count });
      }
    }

    const total = db.prepare('SELECT COUNT(*) as c FROM products').get().c;
    const favorites = db.prepare('SELECT COUNT(*) as count FROM products WHERE is_favorite = 1').get();
    res.json({
      categories: [
        { key: 'ALL', label: 'Tous', count: total },
        { key: 'FAVORITES', label: 'Favoris', count: favorites.count },
        ...catalog.map((r) => ({ key: r.name, label: r.name, count: r.count })),
      ],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const getSettings = (req, res) => {
  try {
    res.json(getPosSettingsFromDb());
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const updateSettings = (req, res) => {
  try {
    const body = req.body || {};
    const mapping = {
      residentDiscountPercent: 'pos_resident_discount_percent',
      workerDiscountPercent: 'pos_worker_discount_percent',
      earlyBirdDiscountPercent: 'pos_early_bird_discount_percent',
      earlyBirdEndTime: 'pos_early_bird_end_time',
      lateSurchargePercent: 'pos_late_surcharge_percent',
      lateSurchargeStartTime: 'pos_late_surcharge_start_time',
      shopName: 'pos_shop_name',
      shopAddress: 'pos_shop_address',
    };

    const upsert = db.prepare(`
      INSERT INTO settings (key, value, updated_at) VALUES (?, ?, datetime('now'))
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')
    `);

    const tx = db.transaction(() => {
      for (const [field, key] of Object.entries(mapping)) {
        if (body[field] !== undefined && body[field] !== null) {
          upsert.run(key, String(body[field]));
        }
      }
    });
    tx();

    res.json({ success: true, settings: getPosSettingsFromDb() });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const toggleFavorite = (req, res) => {
  try {
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    if (!product) return res.status(404).json({ error: 'Produit non trouvé' });
    const next = product.is_favorite === 1 ? 0 : 1;
    db.prepare('UPDATE products SET is_favorite = ? WHERE id = ?').run(next, product.id);
    res.json(mapProduct({ ...product, is_favorite: next }));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Crée une commande POS (paiement immédiat ou mise en attente).
 * Recalcule TOUJOURS les prix côté serveur.
 */
const createOrder = async (req, res) => {
  try {
    const {
      items,
      customerType = 'STANDARD',
      orderType = 'DINE_IN',
      hold = false,
      paymentMethod,
      cashReceivedCents,
      idempotencyKey,
      notes,
    } = req.body || {};

    if (idempotencyKey) {
      const existing = db.prepare('SELECT id FROM pos_orders WHERE idempotency_key = ?').get(idempotencyKey);
      if (existing) {
        return res.status(200).json({
          success: true,
          duplicate: true,
          order: loadOrder(existing.id),
        });
      }
    }

    if (!VALID_CUSTOMER.has(customerType)) {
      return res.status(400).json({ error: 'Type de client invalide' });
    }
    if (!VALID_ORDER_TYPE.has(orderType)) {
      return res.status(400).json({ error: 'Type de commande invalide' });
    }

    const resolved = resolveLineItems(items);
    if (resolved.error) return res.status(400).json({ error: resolved.error });

    const settings = getPosSettingsFromDb();
    const pricing = calculateOrderPricing({
      items: resolved.lines,
      customerType,
      now: new Date(),
      settings,
    });

    let status = hold ? 'held' : 'open';
    let paymentStatus = 'unpaid';
    let paymentResult = null;
    let paidMethod = null;
    let cashReceived = null;
    let cashChange = null;
    let paidAt = null;

    if (!hold && paymentMethod) {
      if (!VALID_PAYMENT.has(paymentMethod)) {
        return res.status(400).json({ error: 'Moyen de paiement invalide' });
      }
      paymentResult = await processPayment({
        method: paymentMethod,
        amountCents: pricing.finalTotalCents,
        cashReceivedCents,
      });
      if (!paymentResult.success) {
        return res.status(400).json({ error: paymentResult.error });
      }
      status = 'paid';
      paymentStatus = 'paid';
      paidMethod = paymentMethod;
      cashReceived = paymentResult.cashReceivedCents;
      cashChange = paymentResult.cashChangeCents;
      paidAt = new Date().toISOString();
    }

    const insertOrder = db.prepare(`
      INSERT INTO pos_orders (
        order_number, cashier_id, customer_type, order_type, status,
        subtotal_cents, customer_discount_cents, early_bird_discount_cents,
        late_surcharge_cents, discount_cents, surcharge_cents, total_cents,
        payment_method, payment_status, cash_received_cents, cash_change_cents,
        applied_rules, idempotency_key, notes, held_at, paid_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?, ?, datetime('now')
      )
    `);

    const insertItem = db.prepare(`
      INSERT INTO pos_order_items (
        order_id, product_id, product_name_snapshot, unit_price_cents,
        quantity, options_json, subtotal_cents
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const tx = db.transaction(() => {
      const orderNumber = generateOrderNumber();
      const result = insertOrder.run(
        orderNumber,
        req.user.id,
        customerType,
        orderType,
        status,
        pricing.subtotalCents,
        pricing.customerDiscountCents,
        pricing.earlyBirdDiscountCents,
        pricing.lateSurchargeCents,
        pricing.totalDiscountCents,
        pricing.surchargeCents,
        pricing.finalTotalCents,
        paidMethod,
        paymentStatus,
        cashReceived,
        cashChange,
        JSON.stringify(pricing.appliedRules),
        idempotencyKey || null,
        notes || null,
        hold ? new Date().toISOString() : null,
        paidAt
      );
      const orderId = result.lastInsertRowid;
      for (const line of resolved.lines) {
        insertItem.run(
          orderId,
          line.productId,
          line.productNameSnapshot,
          line.unitPriceCents,
          line.quantity,
          line.options ? JSON.stringify(line.options) : null,
          line.subtotalCents
        );
      }
      return orderId;
    });

    let orderId;
    try {
      orderId = tx();
    } catch (err) {
      if (String(err.message || '').includes('UNIQUE') && idempotencyKey) {
        const existing = db.prepare('SELECT id FROM pos_orders WHERE idempotency_key = ?').get(idempotencyKey);
        if (existing) {
          return res.status(200).json({ success: true, duplicate: true, order: loadOrder(existing.id) });
        }
      }
      throw err;
    }

    res.status(201).json({
      success: true,
      order: loadOrder(orderId),
      paymentMessage: paymentResult?.message || null,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const getOrders = (req, res) => {
  try {
    const { status, limit = 100 } = req.query;
    let rows;
    if (status) {
      rows = db.prepare(`
        SELECT o.*, u.name as cashier_name
        FROM pos_orders o
        LEFT JOIN users u ON u.id = o.cashier_id
        WHERE o.status = ?
        ORDER BY o.created_at DESC
        LIMIT ?
      `).all(status, Number(limit) || 100);
    } else {
      rows = db.prepare(`
        SELECT o.*, u.name as cashier_name
        FROM pos_orders o
        LEFT JOIN users u ON u.id = o.cashier_id
        ORDER BY o.created_at DESC
        LIMIT ?
      `).all(Number(limit) || 100);
    }

    const orders = rows.map((order) => {
      const items = db.prepare('SELECT * FROM pos_order_items WHERE order_id = ?').all(order.id);
      return serializeOrder(order, items);
    });
    res.json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const getOrderById = (req, res) => {
  try {
    const order = loadOrder(req.params.id);
    if (!order) return res.status(404).json({ error: 'Commande non trouvée' });
    res.json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const payOrder = async (req, res) => {
  try {
    const order = db.prepare('SELECT * FROM pos_orders WHERE id = ?').get(req.params.id);
    if (!order) return res.status(404).json({ error: 'Commande non trouvée' });

    if (order.payment_status === 'paid' || order.status === 'paid') {
      return res.status(200).json({
        success: true,
        duplicate: true,
        order: loadOrder(order.id),
        message: 'Commande déjà payée',
      });
    }

    if (order.status === 'cancelled') {
      return res.status(400).json({ error: 'Commande annulée' });
    }

    const { paymentMethod, cashReceivedCents, idempotencyKey } = req.body || {};
    if (!VALID_PAYMENT.has(paymentMethod)) {
      return res.status(400).json({ error: 'Moyen de paiement invalide' });
    }

    if (idempotencyKey && order.idempotency_key && order.idempotency_key !== idempotencyKey) {
      // ignore mismatch — use order-level lock via status
    }

    const paymentResult = await processPayment({
      method: paymentMethod,
      amountCents: order.total_cents,
      cashReceivedCents,
    });
    if (!paymentResult.success) {
      return res.status(400).json({ error: paymentResult.error });
    }

    const update = db.prepare(`
      UPDATE pos_orders SET
        status = 'paid',
        payment_status = 'paid',
        payment_method = ?,
        cash_received_cents = ?,
        cash_change_cents = ?,
        paid_at = datetime('now'),
        held_at = NULL,
        updated_at = datetime('now'),
        idempotency_key = COALESCE(idempotency_key, ?)
      WHERE id = ? AND payment_status != 'paid'
    `);

    const result = update.run(
      paymentMethod,
      paymentResult.cashReceivedCents,
      paymentResult.cashChangeCents,
      idempotencyKey || null,
      order.id
    );

    if (result.changes === 0) {
      return res.status(200).json({
        success: true,
        duplicate: true,
        order: loadOrder(order.id),
        message: 'Commande déjà payée',
      });
    }

    res.json({
      success: true,
      order: loadOrder(order.id),
      paymentMessage: paymentResult.message,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const holdOrder = (req, res) => {
  try {
    const order = db.prepare('SELECT * FROM pos_orders WHERE id = ?').get(req.params.id);
    if (!order) return res.status(404).json({ error: 'Commande non trouvée' });
    if (order.payment_status === 'paid') {
      return res.status(400).json({ error: 'Impossible de mettre en attente une commande payée' });
    }

    db.prepare(`
      UPDATE pos_orders SET status = 'held', held_at = datetime('now'), updated_at = datetime('now')
      WHERE id = ?
    `).run(order.id);

    res.json({ success: true, order: loadOrder(order.id) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const resumeOrder = (req, res) => {
  try {
    const order = db.prepare('SELECT * FROM pos_orders WHERE id = ?').get(req.params.id);
    if (!order) return res.status(404).json({ error: 'Commande non trouvée' });
    if (order.status !== 'held') {
      return res.status(400).json({ error: 'Cette commande n’est pas en attente' });
    }

    db.prepare(`
      UPDATE pos_orders SET status = 'open', held_at = NULL, updated_at = datetime('now')
      WHERE id = ?
    `).run(order.id);

    res.json({ success: true, order: loadOrder(order.id) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const cancelOrder = (req, res) => {
  try {
    const order = db.prepare('SELECT * FROM pos_orders WHERE id = ?').get(req.params.id);
    if (!order) return res.status(404).json({ error: 'Commande non trouvée' });
    if (order.payment_status === 'paid') {
      return res.status(400).json({
        error: 'Commande payée : utiliser un remboursement (non disponible ici)',
      });
    }

    db.prepare(`
      UPDATE pos_orders SET status = 'cancelled', updated_at = datetime('now')
      WHERE id = ?
    `).run(order.id);

    res.json({ success: true, order: loadOrder(order.id) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const getStats = (req, res) => {
  try {
    const paid = db.prepare(`
      SELECT * FROM pos_orders
      WHERE payment_status = 'paid'
        AND date(created_at) = date('now')
    `).all();

    const caCents = paid.reduce((a, o) => a + o.total_cents, 0);
    const discountsCents = paid.reduce((a, o) => a + o.discount_cents, 0);
    const cardCount = paid.filter((o) => o.payment_method === 'CARD').length;
    const cashCount = paid.filter((o) => o.payment_method === 'CASH').length;
    const cardCents = paid.filter((o) => o.payment_method === 'CARD').reduce((a, o) => a + o.total_cents, 0);
    const cashCents = paid.filter((o) => o.payment_method === 'CASH').reduce((a, o) => a + o.total_cents, 0);

    const topProducts = db.prepare(`
      SELECT oi.product_name_snapshot as name, SUM(oi.quantity) as quantity, SUM(oi.subtotal_cents) as revenueCents
      FROM pos_order_items oi
      JOIN pos_orders o ON o.id = oi.order_id
      WHERE o.payment_status = 'paid' AND date(o.created_at) = date('now')
      GROUP BY oi.product_name_snapshot
      ORDER BY quantity DESC
      LIMIT 10
    `).all();

    const byHourRows = db.prepare(`
      SELECT strftime('%H', created_at) as hour, SUM(total_cents) as revenueCents, COUNT(*) as orders
      FROM pos_orders
      WHERE payment_status = 'paid' AND date(created_at) = date('now')
      GROUP BY hour
      ORDER BY hour
    `).all();

    res.json({
      date: new Date().toISOString().slice(0, 10),
      ordersCount: paid.length,
      revenueCents: caCents,
      averageBasketCents: paid.length ? Math.round(caCents / paid.length) : 0,
      discountsCents,
      payments: {
        card: { count: cardCount, amountCents: cardCents },
        cash: { count: cashCount, amountCents: cashCents },
      },
      topProducts,
      revenueByHour: byHourRows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const previewPricing = (req, res) => {
  try {
    const { items, customerType = 'STANDARD' } = req.body || {};
    const resolved = resolveLineItems(items || []);
    if (resolved.error && resolved.error !== 'Panier vide') {
      return res.status(400).json({ error: resolved.error });
    }
    const lines = resolved.lines || [];
    const settings = getPosSettingsFromDb();
    const pricing = calculateOrderPricing({
      items: lines,
      customerType: VALID_CUSTOMER.has(customerType) ? customerType : 'STANDARD',
      now: new Date(),
      settings,
    });
    res.json({ pricing, settings, serverTime: new Date().toISOString() });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

module.exports = {
  getProducts,
  getCategories,
  getSettings,
  updateSettings,
  toggleFavorite,
  createOrder,
  getOrders,
  getOrderById,
  payOrder,
  holdOrder,
  resumeOrder,
  cancelOrder,
  getStats,
  previewPricing,
  STAFF_ROLES,
  MANAGER_ROLES,
  getPosSettingsFromDb,
};
