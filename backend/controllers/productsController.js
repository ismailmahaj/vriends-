const db = require('../db/database');

const getProducts = (req, res) => {
  try {
    const products = db.prepare('SELECT * FROM products ORDER BY id').all();
    res.json(products.map(p => ({
      ...p,
      available: p.available === 1
    })));
  } catch (error) {
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

    res.json({
      ...product,
      available: newAvailable === 1
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

module.exports = { getProducts, toggleProduct };
