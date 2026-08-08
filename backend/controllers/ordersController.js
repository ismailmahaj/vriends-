const prisma = require('../db/prisma');

const createOrder = async (req, res) => {
  const { items, pickupTime } = req.body;
  const userId = req.user.id;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Panier vide' });
  }

  if (!pickupTime) {
    return res.status(400).json({ error: 'Heure de retrait requise' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });

    let total = 0;
    const lineData = [];

    for (const item of items) {
      const product = await prisma.product.findFirst({
        where: { id: item.product_id, available: true },
      });
      if (!product) {
        return res.status(400).json({ error: `Produit ${item.product_id} indisponible` });
      }
      total += product.price * item.quantity;
      lineData.push({
        productId: product.id,
        quantity: item.quantity,
        price: product.price,
      });
    }

    if (user.localStatus && user.discountPercent > 0) {
      total *= 1 - user.discountPercent / 100;
    }

    const order = await prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          userId,
          totalPrice: total,
          pickupTime,
          status: 'pending',
          items: {
            create: lineData,
          },
        },
      });
      return created;
    });

    res.status(201).json({
      success: true,
      orderId: order.id,
      total: total.toFixed(2),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const serializeOrderItems = (items) =>
  items.map((item) => ({
    product_id: item.productId,
    product_name: item.product?.name || 'Produit supprimé',
    quantity: item.quantity,
    price: item.price,
  }));

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

    res.json(
      orders.map((order) => ({
        id: order.id,
        user_id: order.userId,
        total_price: order.totalPrice,
        pickup_time: order.pickupTime,
        status: order.status,
        created_at: order.createdAt,
        items: serializeOrderItems(order.items),
      }))
    );
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

    res.json(
      orders.map((order) => ({
        id: order.id,
        user_id: order.userId,
        total_price: order.totalPrice,
        pickup_time: order.pickupTime,
        status: order.status,
        created_at: order.createdAt,
        user: {
          name: order.user.name,
          email: order.user.email,
        },
        items: serializeOrderItems(order.items),
      }))
    );
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const updateStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ['pending', 'ready', 'completed', 'cancelled'];
  if (!validStatuses.includes(status)) {
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

module.exports = { createOrder, getMyOrders, getAllOrders, updateStatus };
