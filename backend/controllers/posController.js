const prisma = require('../db/prisma');
const {
  calculateOrderPricing,
  eurosToCents,
  DEFAULT_POS_SETTINGS,
  CUSTOMER_TYPES,
} = require('../lib/pricingEngine.cjs');
const { processPayment } = require('../services/paymentProvider');
const { parseCategories, parseOptionsSchema } = require('../lib/productHelpers');
const {
  normalizeOptionsSchema,
  validateSelection,
  computeUnitPriceEuros,
  buildOptionsSnapshot,
} = require('../lib/optionsEngine.cjs');

const VALID_CUSTOMER = new Set(Object.values(CUSTOMER_TYPES));
const VALID_ORDER_TYPE = new Set(['DINE_IN', 'TAKEAWAY', 'DELIVERY']);
const VALID_PAYMENT = new Set(['CARD', 'CASH', 'OTHER']);

async function getPosSettingsFromDb() {
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
  const rows = await prisma.setting.findMany({
    where: { key: { in: keys } },
  });
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
  const categories = parseCategories(p);
  return {
    id: p.id,
    name: p.name,
    price: p.price,
    priceCents: eurosToCents(p.price),
    available: p.available,
    category: categories[0] || 'Autres',
    categories,
    imageUrl: p.imageUrl || null,
    isFavorite: p.isFavorite,
    sku: p.sku || null,
    optionsSchema: parseOptionsSchema(p.optionsSchema),
  };
}

async function generateOrderNumber() {
  const now = new Date();
  const day = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('');
  const prefix = `VR-${day}-`;

  const last = await prisma.posOrder.findFirst({
    where: { orderNumber: { startsWith: prefix } },
    orderBy: { id: 'desc' },
  });

  let seq = 1;
  if (last?.orderNumber) {
    const part = last.orderNumber.split('-').pop();
    const n = parseInt(part, 10);
    if (!Number.isNaN(n)) seq = n + 1;
  }
  return `${prefix}${String(seq).padStart(4, '0')}`;
}

function serializeOrder(order) {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    cashierId: order.cashierId,
    cashierName: order.cashier?.name || null,
    customerId: order.customerId || null,
    customer: order.customer
      ? {
          id: order.customer.id,
          name: order.customer.name,
          email: order.customer.email,
          phone: order.customer.phone || null,
          local_status: order.customer.localStatus,
          discount_percent: order.customer.discountPercent,
        }
      : null,
    customerType: order.customerType,
    orderType: order.orderType,
    status: order.status,
    subtotalCents: order.subtotalCents,
    customerDiscountCents: order.customerDiscountCents,
    earlyBirdDiscountCents: order.earlyBirdDiscountCents,
    lateSurchargeCents: order.lateSurchargeCents,
    discountCents: order.discountCents,
    surchargeCents: order.surchargeCents,
    totalCents: order.totalCents,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    cashReceivedCents: order.cashReceivedCents,
    cashChangeCents: order.cashChangeCents,
    appliedRules: order.appliedRules || [],
    taxCents: order.taxCents,
    notes: order.notes,
    heldAt: order.heldAt,
    paidAt: order.paidAt,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    items: (order.items || []).map((it) => ({
      id: it.id,
      productId: it.productId,
      productNameSnapshot: it.productNameSnapshot,
      unitPriceCents: it.unitPriceCents,
      quantity: it.quantity,
      options: it.optionsJson || null,
      subtotalCents: it.subtotalCents,
    })),
  };
}

async function loadOrder(id) {
  const order = await prisma.posOrder.findUnique({
    where: { id: Number(id) },
    include: {
      cashier: true,
      customer: true,
      items: { orderBy: { id: 'asc' } },
    },
  });
  if (!order) return null;
  return serializeOrder(order);
}

async function resolveLineItems(rawItems) {
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

    const product = await prisma.product.findFirst({
      where: { id: Number(productId), deletedAt: null },
    });
    if (!product) {
      return { error: `Produit ${productId} introuvable` };
    }
    if (!product.available) {
      return { error: `Produit « ${product.name} » épuisé` };
    }

    const schema = normalizeOptionsSchema(product.optionsSchema);
    const selection = item.options || item.selection || null;
    if (schema?.length) {
      const check = validateSelection(schema, selection || {});
      if (!check.ok) {
        return { error: check.errors[0]?.message || 'Options invalides' };
      }
    }

    const unitPriceEuros = computeUnitPriceEuros(product.price, schema, selection || {});
    const unitPriceCents = eurosToCents(unitPriceEuros);
    const snapshot = schema?.length ? buildOptionsSnapshot(schema, selection || {}) : null;

    lines.push({
      productId: product.id,
      productNameSnapshot: product.name,
      unitPriceCents,
      quantity,
      options: snapshot || selection || null,
      subtotalCents: unitPriceCents * quantity,
    });
  }

  return { lines };
}

const getProducts = async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: { deletedAt: null },
      orderBy: [{ isFavorite: 'desc' }, { name: 'asc' }],
    });
    res.json(products.map(mapProduct));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const getCategories = async (req, res) => {
  try {
    const catalog = await prisma.category.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
    const products = await prisma.product.findMany({
      where: { deletedAt: null },
      select: { category: true, categories: true, isFavorite: true },
    });

    const countMap = {};
    let favorites = 0;
    for (const p of products) {
      if (p.isFavorite) favorites += 1;
      for (const name of parseCategories(p)) {
        countMap[name] = (countMap[name] || 0) + 1;
      }
    }

    const known = new Set(catalog.map((c) => c.name));
    const orphan = Object.keys(countMap)
      .filter((name) => !known.has(name))
      .map((name) => ({ name, count: countMap[name] }));

    res.json({
      categories: [
        { key: 'ALL', label: 'Tous', count: products.length },
        { key: 'FAVORITES', label: 'Favoris', count: favorites },
        ...catalog.map((r) => ({ key: r.name, label: r.name, count: countMap[r.name] || 0 })),
        ...orphan.map((r) => ({ key: r.name, label: r.name, count: r.count })),
      ],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const getSettings = async (req, res) => {
  try {
    res.json(await getPosSettingsFromDb());
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const updateSettings = async (req, res) => {
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

    await prisma.$transaction(
      Object.entries(mapping)
        .filter(([field]) => body[field] !== undefined && body[field] !== null)
        .map(([field, key]) =>
          prisma.setting.upsert({
            where: { key },
            create: { key, value: String(body[field]) },
            update: { value: String(body[field]) },
          })
        )
    );

    res.json({ success: true, settings: await getPosSettingsFromDb() });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const toggleFavorite = async (req, res) => {
  try {
    const product = await prisma.product.findFirst({
      where: { id: Number(req.params.id), deletedAt: null },
    });
    if (!product) return res.status(404).json({ error: 'Produit non trouvé' });
    const updated = await prisma.product.update({
      where: { id: product.id },
      data: { isFavorite: !product.isFavorite },
    });
    res.json(mapProduct(updated));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

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
      customerId = null,
    } = req.body || {};

    const notesClean = notes != null ? String(notes).trim() : '';
    if (notesClean.length > 500) {
      return res.status(400).json({ error: 'Commentaire trop long (max 500 caractères)' });
    }

    let resolvedCustomerId = null;
    if (customerId != null && customerId !== '') {
      const customer = await prisma.user.findFirst({
        where: { id: Number(customerId), role: 'client' },
      });
      if (!customer) return res.status(400).json({ error: 'Client introuvable' });
      resolvedCustomerId = customer.id;
    }

    if (idempotencyKey) {
      const existing = await prisma.posOrder.findUnique({ where: { idempotencyKey } });
      if (existing) {
        return res.status(200).json({
          success: true,
          duplicate: true,
          order: await loadOrder(existing.id),
        });
      }
    }

    if (!VALID_CUSTOMER.has(customerType)) {
      return res.status(400).json({ error: 'Type de client invalide' });
    }
    if (!VALID_ORDER_TYPE.has(orderType)) {
      return res.status(400).json({ error: 'Type de commande invalide' });
    }

    const resolved = await resolveLineItems(items);
    if (resolved.error) return res.status(400).json({ error: resolved.error });

    const settings = await getPosSettingsFromDb();
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
      paidAt = new Date();
    }

    try {
      const orderNumber = await generateOrderNumber();
      const created = await prisma.posOrder.create({
        data: {
          orderNumber,
          cashierId: req.user.id,
          customerId: resolvedCustomerId,
          customerType,
          orderType,
          status,
          subtotalCents: pricing.subtotalCents,
          customerDiscountCents: pricing.customerDiscountCents,
          earlyBirdDiscountCents: pricing.earlyBirdDiscountCents,
          lateSurchargeCents: pricing.lateSurchargeCents,
          discountCents: pricing.totalDiscountCents,
          surchargeCents: pricing.surchargeCents,
          totalCents: pricing.finalTotalCents,
          paymentMethod: paidMethod,
          paymentStatus,
          cashReceivedCents: cashReceived,
          cashChangeCents: cashChange,
          appliedRules: pricing.appliedRules,
          idempotencyKey: idempotencyKey || null,
          notes: notesClean || null,
          heldAt: hold ? new Date() : null,
          paidAt,
          items: {
            create: resolved.lines.map((line) => ({
              productId: line.productId,
              productNameSnapshot: line.productNameSnapshot,
              unitPriceCents: line.unitPriceCents,
              quantity: line.quantity,
              optionsJson: line.options,
              subtotalCents: line.subtotalCents,
            })),
          },
        },
      });

      res.status(201).json({
        success: true,
        order: await loadOrder(created.id),
        paymentMessage: paymentResult?.message || null,
      });
    } catch (err) {
      if (idempotencyKey && String(err.code) === 'P2002') {
        const existing = await prisma.posOrder.findUnique({ where: { idempotencyKey } });
        if (existing) {
          return res.status(200).json({
            success: true,
            duplicate: true,
            order: await loadOrder(existing.id),
          });
        }
      }
      throw err;
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const getOrders = async (req, res) => {
  try {
    const { status, limit = 100 } = req.query;
    const orders = await prisma.posOrder.findMany({
      where: status ? { status } : undefined,
      include: {
        cashier: true,
        customer: true,
        items: true,
      },
      orderBy: { createdAt: 'desc' },
      take: Number(limit) || 100,
    });
    res.json(orders.map(serializeOrder));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const getOrderById = async (req, res) => {
  try {
    const order = await loadOrder(req.params.id);
    if (!order) return res.status(404).json({ error: 'Commande non trouvée' });
    res.json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const payOrder = async (req, res) => {
  try {
    const order = await prisma.posOrder.findUnique({ where: { id: Number(req.params.id) } });
    if (!order) return res.status(404).json({ error: 'Commande non trouvée' });

    if (order.paymentStatus === 'paid' || order.status === 'paid') {
      return res.status(200).json({
        success: true,
        duplicate: true,
        order: await loadOrder(order.id),
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

    const paymentResult = await processPayment({
      method: paymentMethod,
      amountCents: order.totalCents,
      cashReceivedCents,
    });
    if (!paymentResult.success) {
      return res.status(400).json({ error: paymentResult.error });
    }

    const updated = await prisma.posOrder.updateMany({
      where: { id: order.id, paymentStatus: { not: 'paid' } },
      data: {
        status: 'paid',
        paymentStatus: 'paid',
        paymentMethod,
        cashReceivedCents: paymentResult.cashReceivedCents,
        cashChangeCents: paymentResult.cashChangeCents,
        paidAt: new Date(),
        heldAt: null,
        idempotencyKey: order.idempotencyKey || idempotencyKey || null,
      },
    });

    if (updated.count === 0) {
      return res.status(200).json({
        success: true,
        duplicate: true,
        order: await loadOrder(order.id),
        message: 'Commande déjà payée',
      });
    }

    res.json({
      success: true,
      order: await loadOrder(order.id),
      paymentMessage: paymentResult.message,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const holdOrder = async (req, res) => {
  try {
    const order = await prisma.posOrder.findUnique({ where: { id: Number(req.params.id) } });
    if (!order) return res.status(404).json({ error: 'Commande non trouvée' });
    if (order.paymentStatus === 'paid') {
      return res.status(400).json({ error: 'Impossible de mettre en attente une commande payée' });
    }

    await prisma.posOrder.update({
      where: { id: order.id },
      data: { status: 'held', heldAt: new Date() },
    });

    res.json({ success: true, order: await loadOrder(order.id) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const resumeOrder = async (req, res) => {
  try {
    const order = await prisma.posOrder.findUnique({ where: { id: Number(req.params.id) } });
    if (!order) return res.status(404).json({ error: 'Commande non trouvée' });
    if (order.status !== 'held') {
      return res.status(400).json({ error: 'Cette commande n’est pas en attente' });
    }

    await prisma.posOrder.update({
      where: { id: order.id },
      data: { status: 'open', heldAt: null },
    });

    res.json({ success: true, order: await loadOrder(order.id) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const cancelOrder = async (req, res) => {
  try {
    const order = await prisma.posOrder.findUnique({ where: { id: Number(req.params.id) } });
    if (!order) return res.status(404).json({ error: 'Commande non trouvée' });
    if (order.paymentStatus === 'paid') {
      return res.status(400).json({
        error: 'Commande payée : utiliser un remboursement (non disponible ici)',
      });
    }

    await prisma.posOrder.update({
      where: { id: order.id },
      data: { status: 'cancelled' },
    });

    res.json({ success: true, order: await loadOrder(order.id) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const getStats = async (req, res) => {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const paid = await prisma.posOrder.findMany({
      where: {
        paymentStatus: 'paid',
        createdAt: { gte: startOfToday, lte: endOfToday },
      },
      include: { items: true },
    });

    const caCents = paid.reduce((a, o) => a + o.totalCents, 0);
    const discountsCents = paid.reduce((a, o) => a + o.discountCents, 0);
    const cardOrders = paid.filter((o) => o.paymentMethod === 'CARD');
    const cashOrders = paid.filter((o) => o.paymentMethod === 'CASH');

    const productMap = new Map();
    for (const order of paid) {
      for (const item of order.items) {
        const prev = productMap.get(item.productNameSnapshot) || { name: item.productNameSnapshot, quantity: 0, revenueCents: 0 };
        prev.quantity += item.quantity;
        prev.revenueCents += item.subtotalCents;
        productMap.set(item.productNameSnapshot, prev);
      }
    }
    const topProducts = [...productMap.values()]
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    const byHour = new Map();
    for (const order of paid) {
      const hour = String(new Date(order.createdAt).getHours()).padStart(2, '0');
      const prev = byHour.get(hour) || { hour, revenueCents: 0, orders: 0 };
      prev.revenueCents += order.totalCents;
      prev.orders += 1;
      byHour.set(hour, prev);
    }

    res.json({
      date: startOfToday.toISOString().slice(0, 10),
      ordersCount: paid.length,
      revenueCents: caCents,
      averageBasketCents: paid.length ? Math.round(caCents / paid.length) : 0,
      discountsCents,
      payments: {
        card: {
          count: cardOrders.length,
          amountCents: cardOrders.reduce((a, o) => a + o.totalCents, 0),
        },
        cash: {
          count: cashOrders.length,
          amountCents: cashOrders.reduce((a, o) => a + o.totalCents, 0),
        },
      },
      topProducts,
      revenueByHour: [...byHour.values()].sort((a, b) => a.hour.localeCompare(b.hour)),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const previewPricing = async (req, res) => {
  try {
    const { items, customerType = 'STANDARD' } = req.body || {};
    const resolved = await resolveLineItems(items || []);
    if (resolved.error && resolved.error !== 'Panier vide') {
      return res.status(400).json({ error: resolved.error });
    }
    const lines = resolved.lines || [];
    const settings = await getPosSettingsFromDb();
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
  getPosSettingsFromDb,
};
