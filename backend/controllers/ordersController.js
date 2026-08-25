const prisma = require('../db/prisma');
const {
  normalizeOptionsSchema,
  validateSelection,
  computeUnitPriceEuros,
  computeOptionsExtraEuros,
  buildOptionsSnapshot,
} = require('../lib/optionsEngine.cjs');

const NOTES_MAX = 500;

const ORDER_STATUSES = [
  'pending',
  'confirmed',
  'preparing',
  'ready',
  'delivering',
  'delivered',
  'completed',
  'cancelled',
];

const serializeOrderItems = (items) =>
  items.map((item) => ({
    product_id: item.productId,
    product_name: item.productNameSnapshot || item.product?.name || 'Produit supprimé',
    quantity: item.quantity,
    price: item.price,
    base_price: item.basePrice != null ? item.basePrice : item.price,
    options_extra: item.optionsExtra || 0,
    options: item.optionsJson || null,
  }));

const serializeOrder = (order) => ({
  id: order.id,
  user_id: order.userId,
  total_price: order.totalPrice,
  pickup_time: order.pickupTime,
  status: order.status,
  notes: order.notes || null,
  created_at: order.createdAt,
  user: order.user
    ? {
        name: order.user.name,
        email: order.user.email,
        phone: order.user.phone || null,
      }
    : undefined,
  items: serializeOrderItems(order.items || []),
});

const createOrder = async (req, res) => {
  const { items, pickupTime, notes } = req.body || {};
  const userId = req.user.id;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Panier vide' });
  }

  if (!pickupTime) {
    return res.status(400).json({ error: 'Heure de retrait requise' });
  }

  const notesClean = notes != null ? String(notes).trim() : '';
  if (notesClean.length > NOTES_MAX) {
    return res.status(400).json({ error: `Commentaire trop long (max ${NOTES_MAX} caractères)` });
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });

    let total = 0;
    const lineData = [];

    for (const item of items) {
      const quantity = Math.floor(Number(item.quantity) || 0);
      if (quantity <= 0) {
        return res.status(400).json({ error: 'Quantité invalide' });
      }

      const product = await prisma.product.findFirst({
        where: { id: item.product_id ?? item.productId, available: true, deletedAt: null },
      });
      if (!product) {
        return res.status(400).json({ error: `Produit ${item.product_id} indisponible` });
      }

      const schema = normalizeOptionsSchema(product.optionsSchema);
      const selection = item.options || item.selection || null;
      if (schema?.length) {
        const check = validateSelection(schema, selection || {});
        if (!check.ok) {
          return res.status(400).json({ error: check.errors[0]?.message || 'Options invalides' });
        }
      }

      const basePrice = product.price;
      const optionsExtra = computeOptionsExtraEuros(schema, selection || {});
      const unitPrice = computeUnitPriceEuros(basePrice, schema, selection || {});
      const snapshot = schema?.length ? buildOptionsSnapshot(schema, selection || {}) : null;

      total += unitPrice * quantity;
      lineData.push({
        productId: product.id,
        quantity,
        price: unitPrice,
        productNameSnapshot: product.name,
        optionsJson: snapshot,
        basePrice,
        optionsExtra,
      });
    }

    if (user.localStatus && user.discountPercent > 0) {
      total *= 1 - user.discountPercent / 100;
    }
    total = Math.round(total * 100) / 100;

    const order = await prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          userId,
          totalPrice: total,
          pickupTime,
          status: 'pending',
          notes: notesClean || null,
          items: {
            create: lineData,
          },
        },
        include: {
          items: true,
          user: true,
        },
      });
      return created;
    });

    res.status(201).json({
      success: true,
      orderId: order.id,
      total: total.toFixed(2),
      order: serializeOrder(order),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const getMyOrders = async (req, res) => {
  const userId = req.user.id;

  try {
    const orders = await prisma.order.findMany({
      where: { userId },
      include: {
        items: { include: { product: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(orders.map(serializeOrder));
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const getAllOrders = async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      include: {
        user: true,
        items: { include: { product: true } },
      },
      orderBy: [{ pickupTime: 'asc' }, { createdAt: 'desc' }],
    });

    res.json(orders.map(serializeOrder));
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const updateStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!ORDER_STATUSES.includes(status)) {
    return res.status(400).json({ error: 'Statut invalide' });
  }

  try {
    const order = await prisma.order.findUnique({ where: { id: Number(id) } });
    if (!order) {
      return res.status(404).json({ error: 'Commande non trouvée' });
    }

    await prisma.order.update({
      where: { id: order.id },
      data: { status },
    });
    res.json({ success: true, status });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  getAllOrders,
  updateStatus,
  ORDER_STATUSES,
  NOTES_MAX,
};
