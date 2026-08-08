const prisma = require('../db/prisma');

const mapProduct = (p) => ({
  id: p.id,
  name: p.name,
  price: p.price,
  available: p.available,
  category: p.category || 'Autres',
  imageUrl: p.imageUrl || null,
  isFavorite: p.isFavorite,
  sku: p.sku || null,
  optionsSchema: p.optionsSchema
    ? (() => {
        try {
          return JSON.parse(p.optionsSchema);
        } catch {
          return null;
        }
      })()
    : null,
});

const ensureCategoryExists = async (categoryName) => {
  const name = String(categoryName || 'Autres').trim() || 'Autres';
  await prisma.category.upsert({
    where: { name },
    create: { name, sortOrder: 99 },
    update: {},
  });
  return name;
};

const getProducts = async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });
    res.json(products.map(mapProduct));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const createProduct = async (req, res) => {
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

    const categoryName = await ensureCategoryExists(category);

    const created = await prisma.product.create({
      data: {
        name: trimmedName,
        price: priceNum,
        available: !!available,
        category: categoryName,
        isFavorite: !!isFavorite,
        sku: sku ? String(sku).trim() : null,
        imageUrl: imageUrl ? String(imageUrl).trim() : null,
      },
    });

    res.status(201).json(mapProduct(created));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const updateProduct = async (req, res) => {
  try {
    const product = await prisma.product.findUnique({ where: { id: Number(req.params.id) } });
    if (!product) return res.status(404).json({ error: 'Produit non trouvé' });

    const body = req.body || {};
    const name = body.name != null ? String(body.name).trim() : product.name;
    const priceNum = body.price != null ? Number(body.price) : product.price;
    const categoryName = body.category != null
      ? await ensureCategoryExists(body.category)
      : (product.category || 'Autres');

    if (!name) return res.status(400).json({ error: 'Nom du produit requis' });
    if (Number.isNaN(priceNum) || priceNum < 0) {
      return res.status(400).json({ error: 'Prix invalide' });
    }

    const updated = await prisma.product.update({
      where: { id: product.id },
      data: {
        name,
        price: priceNum,
        available: body.available != null ? !!body.available : product.available,
        category: categoryName,
        isFavorite: body.isFavorite != null ? !!body.isFavorite : product.isFavorite,
        sku: body.sku !== undefined ? (body.sku ? String(body.sku).trim() : null) : product.sku,
        imageUrl: body.imageUrl !== undefined
          ? (body.imageUrl ? String(body.imageUrl).trim() : null)
          : product.imageUrl,
      },
    });

    res.json(mapProduct(updated));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const product = await prisma.product.findUnique({ where: { id: Number(req.params.id) } });
    if (!product) return res.status(404).json({ error: 'Produit non trouvé' });

    const [usedInPos, usedInOrders] = await Promise.all([
      prisma.posOrderItem.count({ where: { productId: product.id } }),
      prisma.orderItem.count({ where: { productId: product.id } }),
    ]);

    if (usedInPos > 0 || usedInOrders > 0) {
      const updated = await prisma.product.update({
        where: { id: product.id },
        data: { available: false },
      });
      return res.json({
        success: true,
        softDeleted: true,
        message: 'Produit désactivé (déjà utilisé dans des commandes)',
        product: mapProduct(updated),
      });
    }

    await prisma.product.delete({ where: { id: product.id } });
    res.json({ success: true, softDeleted: false });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const toggleProduct = async (req, res) => {
  try {
    const product = await prisma.product.findUnique({ where: { id: Number(req.params.id) } });
    if (!product) {
      return res.status(404).json({ error: 'Produit non trouvé' });
    }

    const updated = await prisma.product.update({
      where: { id: product.id },
      data: { available: !product.available },
    });

    res.json(mapProduct(updated));
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
