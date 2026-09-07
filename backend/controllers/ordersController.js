const prisma = require('../db/prisma');
const {
  normalizeOptionsSchema,
  validateSelection,
  computeUnitPriceEuros,
  computeOptionsExtraEuros,
  buildOptionsSnapshot,
} = require('../lib/optionsEngine.cjs');
const {
  getOrdersAcceptingState,
  getSettingValue,
  sanitizeLineNote,
  buildAddressSnapshot,
} = require('../lib/shopSettings');
const { notifyNewOrder, notifyCustomerStatus } = require('../lib/emailService');

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
    line_note: item.lineNote || null,
  }));

const serializeOrder = (order) => ({
  id: order.id,
  user_id: order.userId,
  total_price: order.totalPrice,
  pickup_time: order.pickupTime,
  status: order.status,
  notes: order.notes || null,
  order_type: order.orderType || 'TAKEAWAY',
  address_snapshot: order.addressSnapshot || null,
  cgv_accepted_at: order.cgvAcceptedAt || null,
  cgv_version: order.cgvVersion || null,
  created_at: order.createdAt,
  user: order.user
    ? {
        id: order.user.id,
        name: order.user.name,
        first_name: order.user.firstName || null,
        last_name: order.user.lastName || null,
        email: order.user.email,
        phone: order.user.phone || null,
        street: order.user.street || null,
        house_number: order.user.houseNumber || null,
        box: order.user.box || null,
        postal_code: order.user.postalCode || null,
        city: order.user.city || null,
        country: order.user.country || null,
        delivery_instructions: order.user.deliveryInstructions || null,
        internal_notes: order.user.internalNotes || null,
      }
    : undefined,
  items: serializeOrderItems(order.items || []),
});

const createOrder = async (req, res) => {
  const { items, pickupTime, notes, cgvAccepted, address, orderType } = req.body || {};
  const userId = req.user.id;

  try {
    const accepting = await getOrdersAcceptingState();
    if (!accepting.accepting) {
      return res.status(403).json({
        error: accepting.message,
        code: 'ORDERS_CLOSED',
        reopenAt: accepting.reopenAt,
      });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Panier vide' });
    }
    if (!pickupTime) {
      return res.status(400).json({ error: 'Heure de retrait requise' });
    }
    if (!cgvAccepted) {
      return res.status(400).json({ error: 'Vous devez accepter les conditions générales' });
    }

    const notesClean = notes != null ? String(notes).trim() : '';
    if (notesClean.length > NOTES_MAX) {
      return res.status(400).json({ error: `Commentaire trop long (max ${NOTES_MAX} caractères)` });
    }

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
      const lineNote = sanitizeLineNote(item.lineNote || item.line_note || item.note);

      total += unitPrice * quantity;
      lineData.push({
        productId: product.id,
        quantity,
        price: unitPrice,
        productNameSnapshot: product.name,
        optionsJson: snapshot,
        basePrice,
        optionsExtra,
        lineNote,
      });
    }

    if (user.localStatus && user.discountPercent > 0) {
      total *= 1 - user.discountPercent / 100;
    }
    total = Math.round(total * 100) / 100;

    const cgvVersion = await getSettingValue('cgv_version', '1.0');
    const addressSnapshot = buildAddressSnapshot(address || user);

    const order = await prisma.$transaction(async (tx) => {
      return tx.order.create({
        data: {
          userId,
          totalPrice: total,
          pickupTime,
          status: 'pending',
          notes: notesClean || null,
          orderType: orderType === 'DELIVERY' ? 'DELIVERY' : 'TAKEAWAY',
          addressSnapshot,
          cgvAcceptedAt: new Date(),
          cgvVersion,
          items: { create: lineData },
        },
        include: {
          items: true,
          user: true,
        },
      });
    });

    // e-mail async — ne bloque pas la réponse
    setImmediate(() => {
      notifyNewOrder(serializeOrder(order)).catch(() => {});
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
  try {
    const orders = await prisma.order.findMany({
      where: { userId: req.user.id },
      include: { items: { include: { product: true } }, user: true },
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
      include: { user: true, items: { include: { product: true } } },
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
    const order = await prisma.order.findUnique({
      where: { id: Number(id) },
      include: { user: true, items: true },
    });
    if (!order) return res.status(404).json({ error: 'Commande non trouvée' });

    const updated = await prisma.order.update({
      where: { id: order.id },
      data: { status },
      include: { user: true, items: true },
    });

    setImmediate(() => {
      notifyCustomerStatus(serializeOrder(updated), status).catch(() => {});
    });

    res.json({ success: true, status });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const updateOrderAddress = async (req, res) => {
  try {
    const order = await prisma.order.findUnique({ where: { id: Number(req.params.id) } });
    if (!order) return res.status(404).json({ error: 'Commande non trouvée' });

    if (['confirmed', 'preparing', 'ready', 'delivering'].includes(order.status)) {
      if (!req.body?.confirm) {
        return res.status(400).json({
          error: 'Confirmation requise pour modifier l’adresse d’une commande déjà confirmée',
          code: 'CONFIRM_REQUIRED',
        });
      }
    }

    const newAddress = buildAddressSnapshot(req.body?.address || req.body);
    if (!newAddress) return res.status(400).json({ error: 'Adresse invalide' });

    await prisma.$transaction(async (tx) => {
      await tx.addressAudit.create({
        data: {
          orderId: order.id,
          userId: order.userId,
          actorId: req.user.id,
          oldAddress: order.addressSnapshot || null,
          newAddress,
        },
      });
      await tx.order.update({
        where: { id: order.id },
        data: { addressSnapshot: newAddress },
      });
    });

    res.json({ success: true, address_snapshot: newAddress });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  getAllOrders,
  updateStatus,
  updateOrderAddress,
  ORDER_STATUSES,
  NOTES_MAX,
  serializeOrder,
};
