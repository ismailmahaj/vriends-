const db = require('../db/database');

const createOrder = (req, res) => {
  const { items, pickupTime } = req.body;
  const userId = req.user.id;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Panier vide' });
  }

  if (!pickupTime) {
    return res.status(400).json({ error: 'Heure de retrait requise' });
  }

  try {
    // Récupérer l'utilisateur pour appliquer la réduction
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    
    // Calculer le total en vérifiant les prix en DB
    let total = 0;
    for (const item of items) {
      const product = db.prepare('SELECT * FROM products WHERE id = ? AND available = 1').get(item.product_id);
      if (!product) {
        return res.status(400).json({ error: `Produit ${item.product_id} indisponible` });
      }
      total += product.price * item.quantity;
    }

    // Appliquer réduction si local
    if (user.local_status === 1 && user.discount_percent > 0) {
      total = total * (1 - user.discount_percent / 100);
    }

    // Transaction pour créer order + order_items
    const insertOrder = db.prepare(`
      INSERT INTO orders (user_id, total_price, pickup_time, status)
      VALUES (?, ?, ?, 'pending')
    `);
    
    const insertItem = db.prepare(`
      INSERT INTO order_items (order_id, product_id, quantity, price)
      VALUES (?, ?, ?, ?)
    `);

    const createOrderTransaction = db.transaction((orderData) => {
      const orderResult = insertOrder.run(orderData.userId, orderData.total, orderData.pickupTime);
      const orderId = orderResult.lastInsertRowid;

      for (const item of orderData.items) {
        const product = db.prepare('SELECT price FROM products WHERE id = ?').get(item.product_id);
        insertItem.run(orderId, item.product_id, item.quantity, product.price);
      }

      return orderId;
    });

    const orderId = createOrderTransaction({ userId, total, pickupTime, items });

    res.status(201).json({
      success: true,
      orderId,
      total: total.toFixed(2)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const getMyOrders = (req, res) => {
  const userId = req.user.id;

  try {
    const orders = db.prepare(`
      SELECT o.*, 
        GROUP_CONCAT(oi.product_id || ':' || oi.quantity || ':' || oi.price, '|') as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.user_id = ?
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `).all(userId);

    const ordersWithItems = orders.map(order => {
      const items = order.items ? order.items.split('|').map(item => {
        const [product_id, quantity, price] = item.split(':');
        const product = db.prepare('SELECT name FROM products WHERE id = ?').get(product_id);
        return {
          product_id: parseInt(product_id),
          product_name: product?.name || 'Produit supprimé',
          quantity: parseInt(quantity),
          price: parseFloat(price)
        };
      }) : [];
      
      return {
        ...order,
        total_price: parseFloat(order.total_price),
        items
      };
    });

    res.json(ordersWithItems);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const getAllOrders = (req, res) => {
  try {
    const orders = db.prepare(`
      SELECT o.*, u.name as user_name, u.email as user_email,
        GROUP_CONCAT(oi.product_id || ':' || oi.quantity || ':' || oi.price, '|') as items
      FROM orders o
      JOIN users u ON o.user_id = u.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      GROUP BY o.id
      ORDER BY o.pickup_time ASC, o.created_at DESC
    `).all();

    const ordersWithItems = orders.map(order => {
      const items = order.items ? order.items.split('|').map(item => {
        const [product_id, quantity, price] = item.split(':');
        const product = db.prepare('SELECT name FROM products WHERE id = ?').get(product_id);
        return {
          product_id: parseInt(product_id),
          product_name: product?.name || 'Produit supprimé',
          quantity: parseInt(quantity),
          price: parseFloat(price)
        };
      }) : [];
      
      return {
        ...order,
        total_price: parseFloat(order.total_price),
        user: {
          name: order.user_name,
          email: order.user_email
        },
        items
      };
    });

    res.json(ordersWithItems);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const updateStatus = (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ['pending', 'ready', 'completed', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Statut invalide' });
  }

  try {
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
    if (!order) {
      return res.status(404).json({ error: 'Commande non trouvée' });
    }

    db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, id);
    res.json({ success: true, status });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

module.exports = { createOrder, getMyOrders, getAllOrders, updateStatus };
