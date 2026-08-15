const prisma = require('../db/prisma');
const {
  parseCategories,
  categoriesFromBody,
  normalizeOptionsSchema,
  parseOptionsSchema,
} = require('../lib/productHelpers');

const mapProduct = (p) => {
  const categories = parseCategories(p);
  return {
    id: p.id,
    name: p.name,
    price: p.price,
    available: p.available,
    category: categories[0] || 'Autres',
    categories,
    imageUrl: p.imageUrl || null,
    isFavorite: p.isFavorite,
    sku: p.sku || null,
    optionsSchema: parseOptionsSchema(p.optionsSchema),
    deletedAt: p.deletedAt || null,
  };
};

const ensureCategoriesExist = async (categoryNames) => {
  const names = parseCategories({ categories: categoryNames });
  await Promise.all(
    names.map((name) =>
      prisma.category.upsert({
        where: { name },
        create: { name, sortOrder: 99 },
        update: {},
      })
    )
  );
  return names;
};

const activeWhere = { deletedAt: null };

const getProducts = async (req, res) => {
  try {
    const includeDeleted = req.query.includeDeleted === '1' || req.query.includeDeleted === 'true';
    const products = await prisma.product.findMany({
      where: includeDeleted ? undefined : activeWhere,
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
    const body = req.body || {};
    const {
      name,
      price,
      available = true,
      isFavorite = false,
      sku = null,
      imageUrl = null,
    } = body;

    const trimmedName = String(name || '').trim();
    const priceNum = Number(price);
    if (!trimmedName) return res.status(400).json({ error: 'Nom du produit requis' });
    if (Number.isNaN(priceNum) || priceNum < 0) {
      return res.status(400).json({ error: 'Prix invalide' });
    }

    const categories = await ensureCategoriesExist(categoriesFromBody(body));
    const options = normalizeOptionsSchema(body.optionsSchema);
    const image =
      imageUrl != null && String(imageUrl).trim() ? String(imageUrl).trim() : null;

    if (image && image.length > 1_500_000) {
      return res.status(400).json({ error: 'Image trop volumineuse (max ~1 Mo)' });
    }

    const created = await prisma.product.create({
      data: {
        name: trimmedName,
        price: priceNum,
        available: !!available,
        category: categories[0],
        categories,
        isFavorite: !!isFavorite,
        sku: sku ? String(sku).trim() : null,
        imageUrl: image,
        optionsSchema: options ? JSON.stringify(options) : null,
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
    const product = await prisma.product.findFirst({
      where: { id: Number(req.params.id), ...activeWhere },
    });
    if (!product) return res.status(404).json({ error: 'Produit non trouvé' });

    const body = req.body || {};
    const name = body.name != null ? String(body.name).trim() : product.name;
    const priceNum = body.price != null ? Number(body.price) : product.price;

    if (!name) return res.status(400).json({ error: 'Nom du produit requis' });
    if (Number.isNaN(priceNum) || priceNum < 0) {
      return res.status(400).json({ error: 'Prix invalide' });
    }

    const categories =
      body.categories != null || body.category != null
        ? await ensureCategoriesExist(categoriesFromBody(body, product))
        : parseCategories(product);

    let optionsSchema = product.optionsSchema;
    if (body.optionsSchema !== undefined) {
      const opts = normalizeOptionsSchema(body.optionsSchema);
      optionsSchema = opts ? JSON.stringify(opts) : null;
    }

    let imageUrl = product.imageUrl;
    if (body.imageUrl !== undefined) {
      imageUrl = body.imageUrl ? String(body.imageUrl).trim() : null;
      if (imageUrl && imageUrl.length > 1_500_000) {
        return res.status(400).json({ error: 'Image trop volumineuse (max ~1 Mo)' });
      }
    }

    const updated = await prisma.product.update({
      where: { id: product.id },
      data: {
        name,
        price: priceNum,
        available: body.available != null ? !!body.available : product.available,
        category: categories[0],
        categories,
        isFavorite: body.isFavorite != null ? !!body.isFavorite : product.isFavorite,
        sku: body.sku !== undefined ? (body.sku ? String(body.sku).trim() : null) : product.sku,
        imageUrl,
        optionsSchema,
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
    const product = await prisma.product.findFirst({
      where: { id: Number(req.params.id), ...activeWhere },
    });
    if (!product) return res.status(404).json({ error: 'Produit non trouvé' });

    const [usedInPos, usedInOrders] = await Promise.all([
      prisma.posOrderItem.count({ where: { productId: product.id } }),
      prisma.orderItem.count({ where: { productId: product.id } }),
    ]);

    if (usedInPos > 0 || usedInOrders > 0) {
      const updated = await prisma.product.update({
        where: { id: product.id },
        data: {
          available: false,
          deletedAt: new Date(),
          isFavorite: false,
        },
      });
      return res.json({
        success: true,
        softDeleted: true,
        message: 'Produit archivé (déjà utilisé dans des commandes historiques)',
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
    const product = await prisma.product.findFirst({
      where: { id: Number(req.params.id), ...activeWhere },
    });
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
  mapProduct,
};
