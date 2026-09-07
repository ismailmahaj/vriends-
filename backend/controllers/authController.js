const prisma = require('../db/prisma');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const register = async (req, res) => {
  const { name, email, password, localStatus, phone } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Tous les champs sont requis' });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 8 caractères' });
  }

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email déjà utilisé' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const local_status = !!localStatus;
    const discount_percent = localStatus ? 10 : 0;
    const phoneClean = phone != null ? String(phone).trim() || null : null;

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone: phoneClean,
        localStatus: local_status,
        discountPercent: discount_percent,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Compte créé',
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
        local_status: newUser.localStatus,
        discount_percent: newUser.discountPercent,
      },
    });
  } catch (error) {
    console.error('❌ Erreur inscription:', error);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email et mot de passe requis' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    console.log('Tentative de connexion pour:', email);

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      console.log('Mot de passe incorrect pour:', email);
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    const jwtSecret = process.env.JWT_SECRET || 'vriends_super_secret_key_change_in_production';

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      jwtSecret,
      { expiresIn: '7d' }
    );

    console.log('✅ Connexion réussie pour:', email);

    res.json({
      token,
      user: mapPublicUser(user),
    });
  } catch (error) {
    console.error('❌ Erreur login:', error);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
};

const mapPublicUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  phone: user.phone || null,
  first_name: user.firstName || null,
  last_name: user.lastName || null,
  street: user.street || null,
  house_number: user.houseNumber || null,
  box: user.box || null,
  postal_code: user.postalCode || null,
  city: user.city || null,
  country: user.country || null,
  delivery_instructions: user.deliveryInstructions || null,
  internal_notes: user.internalNotes || null,
  role: user.role,
  local_status: user.localStatus,
  discount_percent: user.discountPercent,
  created_at: user.createdAt,
});

const updateMyProfile = async (req, res) => {
  try {
    const body = req.body || {};
    const data = {};
    if (body.name != null) data.name = String(body.name).trim();
    if (body.phone != null) data.phone = String(body.phone).trim() || null;
    if (body.firstName != null || body.first_name != null) {
      data.firstName = String(body.firstName ?? body.first_name).trim() || null;
    }
    if (body.lastName != null || body.last_name != null) {
      data.lastName = String(body.lastName ?? body.last_name).trim() || null;
    }
    if (body.street != null) data.street = String(body.street).trim() || null;
    if (body.houseNumber != null || body.house_number != null) {
      data.houseNumber = String(body.houseNumber ?? body.house_number).trim() || null;
    }
    if (body.box != null) data.box = String(body.box).trim() || null;
    if (body.postalCode != null || body.postal_code != null) {
      data.postalCode = String(body.postalCode ?? body.postal_code).trim() || null;
    }
    if (body.city != null) data.city = String(body.city).trim() || null;
    if (body.country != null) data.country = String(body.country).trim() || 'Belgique';
    if (body.deliveryInstructions != null || body.delivery_instructions != null) {
      data.deliveryInstructions =
        String(body.deliveryInstructions ?? body.delivery_instructions).trim() || null;
    }

    if (data.postalCode && !/^\d{4}$/.test(data.postalCode)) {
      return res.status(400).json({ error: 'Code postal belge invalide (4 chiffres)' });
    }

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data,
    });
    res.json({ success: true, user: mapPublicUser(user) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const getUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        street: true,
        houseNumber: true,
        box: true,
        postalCode: true,
        city: true,
        country: true,
        deliveryInstructions: true,
        internalNotes: true,
        role: true,
        localStatus: true,
        discountPercent: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(users.map(mapPublicUser));
  } catch (error) {
    console.error('❌ Erreur récupération utilisateurs:', error);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
};

const searchCustomers = async (req, res) => {
  try {
    const q = String(req.query.q || '').trim();
    if (q.length < 2) {
      return res.json([]);
    }

    const users = await prisma.user.findMany({
      where: {
        role: 'client',
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
          { phone: { contains: q, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        localStatus: true,
        discountPercent: true,
        createdAt: true,
      },
      take: 20,
      orderBy: { name: 'asc' },
    });

    res.json(users.map(mapPublicUser));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const createCustomer = async (req, res) => {
  try {
    const name = String(req.body?.name || '').trim();
    const emailRaw = String(req.body?.email || '').trim().toLowerCase();
    const phone = req.body?.phone != null ? String(req.body.phone).trim() || null : null;
    const localStatus = !!req.body?.localStatus;

    if (!name) return res.status(400).json({ error: 'Nom requis' });

    let email = emailRaw;
    if (!email) {
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '.').replace(/^\.|\.$/g, '') || 'client';
      email = `${slug}.${Date.now()}@pos.vriends.local`;
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: 'Email déjà utilisé' });
    }

    const tempPassword = `Pos${Math.random().toString(36).slice(2)}${Date.now()}!`;
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        password: hashedPassword,
        role: 'client',
        localStatus,
        discountPercent: localStatus ? 10 : 0,
      },
    });

    res.status(201).json(mapPublicUser(user));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const exportUsersCSV = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        localStatus: true,
        discountPercent: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    console.log(`📊 Export CSV utilisateurs: ${users.length} utilisateur(s) trouvé(s)`);

    let csv = '\ufeffID,Nom,Email,Rôle,Statut Local,Réduction (%),Date de création\n';

    if (users.length === 0) {
      csv += 'Aucun utilisateur\n';
    } else {
      users.forEach((user) => {
        const row = [
          user.id,
          `"${String(user.name || '').replace(/"/g, '""')}"`,
          String(user.email || ''),
          String(user.role || 'client'),
          user.localStatus ? 'Oui' : 'Non',
          String(user.discountPercent || 0),
          String(user.createdAt || ''),
        ].join(',');
        csv += `${row}\n`;
      });
    }

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=utilisateurs-vriends.csv');
    res.send(csv);
  } catch (error) {
    console.error('❌ Erreur export CSV utilisateurs:', error);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
};

const getCustomerDetail = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: 'ID invalide' });

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        street: true,
        houseNumber: true,
        box: true,
        postalCode: true,
        city: true,
        country: true,
        deliveryInstructions: true,
        internalNotes: true,
        role: true,
        localStatus: true,
        discountPercent: true,
        createdAt: true,
      },
    });
    if (!user) return res.status(404).json({ error: 'Client introuvable' });

    const orders = await prisma.order.findMany({
      where: { userId: id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        totalPrice: true,
        status: true,
        pickupTime: true,
        createdAt: true,
        addressSnapshot: true,
        notes: true,
      },
      take: 50,
    });

    const orderCount = await prisma.order.count({ where: { userId: id } });
    const agg = await prisma.order.aggregate({
      where: {
        userId: id,
        status: { notIn: ['cancelled'] },
      },
      _sum: { totalPrice: true },
    });

    res.json({
      ...mapPublicUser(user),
      stats: {
        order_count: orderCount,
        total_spent: Math.round((agg._sum.totalPrice || 0) * 100) / 100,
        last_order_at: orders[0]?.createdAt || null,
      },
      orders: orders.map((o) => ({
        id: o.id,
        total_price: o.totalPrice,
        status: o.status,
        pickup_time: o.pickupTime,
        created_at: o.createdAt,
        address_snapshot: o.addressSnapshot,
        notes: o.notes,
      })),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const updateCustomerAdmin = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: 'ID invalide' });

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Client introuvable' });

    const body = req.body || {};
    const data = {};
    if (body.phone != null) data.phone = String(body.phone).trim() || null;
    if (body.firstName != null || body.first_name != null) {
      data.firstName = String(body.firstName ?? body.first_name).trim() || null;
    }
    if (body.lastName != null || body.last_name != null) {
      data.lastName = String(body.lastName ?? body.last_name).trim() || null;
    }
    if (body.street != null) data.street = String(body.street).trim() || null;
    if (body.houseNumber != null || body.house_number != null) {
      data.houseNumber = String(body.houseNumber ?? body.house_number).trim() || null;
    }
    if (body.box != null) data.box = String(body.box).trim() || null;
    if (body.postalCode != null || body.postal_code != null) {
      data.postalCode = String(body.postalCode ?? body.postal_code).trim() || null;
    }
    if (body.city != null) data.city = String(body.city).trim() || null;
    if (body.country != null) data.country = String(body.country).trim() || 'Belgique';
    if (body.deliveryInstructions != null || body.delivery_instructions != null) {
      data.deliveryInstructions =
        String(body.deliveryInstructions ?? body.delivery_instructions).trim() || null;
    }
    if (body.internalNotes != null || body.internal_notes != null) {
      data.internalNotes = String(body.internalNotes ?? body.internal_notes)
        .replace(/[<>]/g, '')
        .trim()
        .slice(0, 2000) || null;
    }

    if (data.postalCode && !/^\d{4}$/.test(data.postalCode)) {
      return res.status(400).json({ error: 'Code postal belge invalide (4 chiffres)' });
    }

    const oldAddress = {
      street: existing.street,
      houseNumber: existing.houseNumber,
      box: existing.box,
      postalCode: existing.postalCode,
      city: existing.city,
      country: existing.country,
      deliveryInstructions: existing.deliveryInstructions,
    };

    const user = await prisma.user.update({ where: { id }, data });

    const addressChanged = [
      'street',
      'houseNumber',
      'box',
      'postalCode',
      'city',
      'country',
      'deliveryInstructions',
    ].some((k) => data[k] !== undefined);

    if (addressChanged) {
      const { buildAddressSnapshot } = require('../lib/shopSettings');
      await prisma.addressAudit.create({
        data: {
          userId: id,
          actorId: req.user.id,
          oldAddress,
          newAddress: buildAddressSnapshot(user),
        },
      });
    }

    res.json({ success: true, user: mapPublicUser(user) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

module.exports = {
  register,
  login,
  getUsers,
  exportUsersCSV,
  searchCustomers,
  createCustomer,
  updateMyProfile,
  getCustomerDetail,
  updateCustomerAdmin,
};
