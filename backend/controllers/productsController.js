const db = require('../db/database');

const mapProduct = (p) => ({
  id: p.id,
  name: p.name,
  price: p.price,
  available: p.available === 1,
  category: p.category || 'Autres',
  imageUrl: p.image_url || null,
  isFavorite: p.is_favorite === 1,
  sku: p.sku || null,
  optionsSchema: p.options_schema
    ? (() => {
        try {
          return JSON.parse(p.options_schema);
        } catch {
          return null;
        }
      })()
    : null,
});

const ensureCategoryExists = (categoryName) => {
  const name = String(categoryName || 'Autres').trim() || 'Autres';
  db.prepare(`
    INSERT OR IGNORE INTO categories (name, sort_order) VALUES (?, 99)
  `).run(name);
  return name;
};

const getProducts = (req, res) => {
  try {
    const products = db.prepare('SELECT * FROM products ORDER BY category ASC, name ASC').all();
    res.json(products.map(mapProduct));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const createProduct = (req, res) => {
  try {
    const {
      name,
      price,
      category = 'Autres',
      available = true,
      isFavorite = false,
      sku = null,
      imageUrl = null,
    } = req.body || {};

    const trimmedName = String(name || '').trim();
    const priceNum = Number(price);
    if (!trimmedName) return res.status(400).json({ error: 'Nom du produit requis' });
    if (Number.isNaN(priceNum) || priceNum < 0) {
      return res.status(400).json({ error: 'Prix invalide' });
    }

    const categoryName = ensureCategoryExists(category);

    const result = db.prepare(`
      INSERT INTO products (name, price, available, category, is_favorite, sku, image_url)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      trimmedName,
      priceNum,
      available ? 1 : 0,
      categoryName,
      isFavorite ? 1 : 0,
      sku ? String(sku).trim() : null,
      imageUrl ? String(imageUrl).trim() : null
    );

    const created = db.prepare('SELECT * FROM products WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(mapProduct(created));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const updateProduct = (req, res) => {
  try {
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    if (!product) return res.status(404).json({ error: 'Produit non trouvé' });

    const body = req.body || {};
    const name = body.name != null ? String(body.name).trim() : product.name;
    const priceNum = body.price != null ? Number(body.price) : product.price;
    const categoryName = body.category != null
      ? ensureCategoryExists(body.category)
      : (product.category || 'Autres');
    const available = body.available != null ? (body.available ? 1 : 0) : product.available;
    const isFavorite = body.isFavorite != null ? (body.isFavorite ? 1 : 0) : product.is_favorite;
    const sku = body.sku !== undefined
      ? (body.sku ? String(body.sku).trim() : null)
      : product.sku;
    const imageUrl = body.imageUrl !== undefined
      ? (body.imageUrl ? String(body.imageUrl).trim() : null)
      : product.image_url;

    if (!name) return res.status(400).json({ error: 'Nom du produit requis' });
    if (Number.isNaN(priceNum) || priceNum < 0) {
      return res.status(400).json({ error: 'Prix invalide' });
    }

    db.prepare(`
      UPDATE products
      SET name = ?, price = ?, available = ?, category = ?, is_favorite = ?, sku = ?, image_url = ?
      WHERE id = ?
    `).run(name, priceNum, available, categoryName, isFavorite, sku, imageUrl, product.id);

    const updated = db.prepare('SELECT * FROM products WHERE id = ?').get(product.id);
    res.json(mapProduct(updated));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const deleteProduct = (req, res) => {
  try {
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    if (!product) return res.status(404).json({ error: 'Produit non trouvé' });

    const usedInPos = db.prepare(`
      SELECT COUNT(*) as c FROM pos_order_items WHERE product_id = ?
    `).get(product.id);
    const usedInOrders = db.prepare(`
      SELECT COUNT(*) as c FROM order_items WHERE product_id = ?
    `).get(product.id);

    if (usedInPos.c > 0 || usedInOrders.c > 0) {
      // Soft delete : rendre indisponible plutôt que casser l'historique
      db.prepare('UPDATE products SET available = 0 WHERE id = ?').run(product.id);
      return res.json({
        success: true,
        softDeleted: true,
        message: 'Produit désactivé (déjà utilisé dans des commandes)',
        product: mapProduct({ ...product, available: 0 }),
      });
    }

    db.prepare('DELETE FROM products WHERE id = ?').run(product.id);
    res.json({ success: true, softDeleted: false });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const toggleProduct = (req, res) => {
  const { id } = req.params;

  try {
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
    if (!product) {
      return res.status(404).json({ error: 'Produit non trouvé' });
    }

    const newAvailable = product.available === 1 ? 0 : 1;
    db.prepare('UPDATE products SET available = ? WHERE id = ?').run(newAvailable, id);

    res.json(mapProduct({ ...product, available: newAvailable }));
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

module.exports = {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  toggleProduct,
};
