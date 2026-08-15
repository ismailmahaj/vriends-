const prisma = require('../db/prisma');
const {
  parseCategories,
  productUsesCategory,
  renameCategoryInList,
} = require('../lib/productHelpers');

const mapCategory = (c, productCount = 0) => ({
  id: c.id,
  name: c.name,
  sortOrder: c.sortOrder,
  createdAt: c.createdAt,
  productCount,
});

const countProductsByCategory = async () => {
  const products = await prisma.product.findMany({
    where: { deletedAt: null },
    select: { category: true, categories: true },
  });
  const countMap = {};
  for (const p of products) {
    for (const name of parseCategories(p)) {
      countMap[name] = (countMap[name] || 0) + 1;
    }
  }
  return countMap;
};

const getCategories = async (req, res) => {
  try {
    const rows = await prisma.category.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
    const countMap = await countProductsByCategory();
    res.json(rows.map((c) => mapCategory(c, countMap[c.name] || 0)));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const createCategory = async (req, res) => {
  try {
    const name = String(req.body?.name || '').trim();
    const sortOrder = Number(req.body?.sortOrder ?? 0) || 0;
    if (!name) return res.status(400).json({ error: 'Nom de catégorie requis' });

    const exists = await prisma.category.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } },
    });
    if (exists) return res.status(400).json({ error: 'Cette catégorie existe déjà' });

    const created = await prisma.category.create({
      data: { name, sortOrder },
    });
    res.status(201).json(mapCategory(created, 0));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const updateCategory = async (req, res) => {
  try {
    const category = await prisma.category.findUnique({ where: { id: Number(req.params.id) } });
    if (!category) return res.status(404).json({ error: 'Catégorie non trouvée' });

    const name = req.body?.name != null ? String(req.body.name).trim() : category.name;
    const sortOrder = req.body?.sortOrder != null ? Number(req.body.sortOrder) || 0 : category.sortOrder;
    if (!name) return res.status(400).json({ error: 'Nom de catégorie requis' });

    const clash = await prisma.category.findFirst({
      where: {
        name: { equals: name, mode: 'insensitive' },
        NOT: { id: category.id },
      },
    });
    if (clash) return res.status(400).json({ error: 'Cette catégorie existe déjà' });

    const updated = await prisma.$transaction(async (tx) => {
      const cat = await tx.category.update({
        where: { id: category.id },
        data: { name, sortOrder },
      });

      if (name !== category.name) {
        const products = await tx.product.findMany({
          where: { deletedAt: null },
          select: { id: true, category: true, categories: true },
        });
        for (const p of products) {
          const cats = parseCategories(p);
          if (!productUsesCategory(p, category.name)) continue;
          const next = renameCategoryInList(cats, category.name, name);
          await tx.product.update({
            where: { id: p.id },
            data: { category: next[0], categories: next },
          });
        }
      }
      return cat;
    });

    const countMap = await countProductsByCategory();
    res.json(mapCategory(updated, countMap[updated.name] || 0));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const category = await prisma.category.findUnique({ where: { id: Number(req.params.id) } });
    if (!category) return res.status(404).json({ error: 'Catégorie non trouvée' });

    const products = await prisma.product.findMany({
      where: { deletedAt: null },
      select: { category: true, categories: true },
    });
    const count = products.filter((p) => productUsesCategory(p, category.name)).length;
    if (count > 0) {
      return res.status(400).json({
        error: `Impossible de supprimer : ${count} produit(s) utilisent cette catégorie`,
      });
    }

    await prisma.category.delete({ where: { id: category.id } });
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
