const db = require('../db/database');

const mapCategory = (c) => ({
  id: c.id,
  name: c.name,
  sortOrder: c.sort_order,
  createdAt: c.created_at,
});

const getCategories = (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT c.*,
        (SELECT COUNT(*) FROM products p WHERE p.category = c.name) as product_count
      FROM categories c
      ORDER BY c.sort_order ASC, c.name ASC
    `).all();
    res.json(rows.map((c) => ({ ...mapCategory(c), productCount: c.product_count })));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const createCategory = (req, res) => {
  try {
    const name = String(req.body?.name || '').trim();
    const sortOrder = Number(req.body?.sortOrder ?? 0) || 0;
    if (!name) return res.status(400).json({ error: 'Nom de catégorie requis' });

    const exists = db.prepare('SELECT id FROM categories WHERE lower(name) = lower(?)').get(name);
    if (exists) return res.status(400).json({ error: 'Cette catégorie existe déjà' });

    const result = db.prepare(`
      INSERT INTO categories (name, sort_order) VALUES (?, ?)
    `).run(name, sortOrder);

    const created = db.prepare('SELECT * FROM categories WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(mapCategory(created));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const updateCategory = (req, res) => {
  try {
    const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(req.params.id);
    if (!category) return res.status(404).json({ error: 'Catégorie non trouvée' });

    const name = req.body?.name != null ? String(req.body.name).trim() : category.name;
    const sortOrder = req.body?.sortOrder != null ? Number(req.body.sortOrder) || 0 : category.sort_order;
    if (!name) return res.status(400).json({ error: 'Nom de catégorie requis' });

    const clash = db.prepare(`
      SELECT id FROM categories WHERE lower(name) = lower(?) AND id != ?
    `).get(name, category.id);
    if (clash) return res.status(400).json({ error: 'Cette catégorie existe déjà' });

    const tx = db.transaction(() => {
      db.prepare(`
        UPDATE categories SET name = ?, sort_order = ? WHERE id = ?
      `).run(name, sortOrder, category.id);
      if (name !== category.name) {
        db.prepare(`
          UPDATE products SET category = ? WHERE category = ?
        `).run(name, category.name);
      }
    });
    tx();

    const updated = db.prepare('SELECT * FROM categories WHERE id = ?').get(category.id);
    res.json(mapCategory(updated));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const deleteCategory = (req, res) => {
  try {
    const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(req.params.id);
    if (!category) return res.status(404).json({ error: 'Catégorie non trouvée' });

    const count = db.prepare('SELECT COUNT(*) as c FROM products WHERE category = ?').get(category.name);
    if (count.c > 0) {
      return res.status(400).json({
        error: `Impossible de supprimer : ${count.c} produit(s) utilisent cette catégorie`,
      });
    }

    db.prepare('DELETE FROM categories WHERE id = ?').run(category.id);
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

module.exports = {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};
