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
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone || null,
        role: user.role,
        local_status: user.localStatus,
        discount_percent: user.discountPercent,
      },
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
  role: user.role,
  local_status: user.localStatus,
  discount_percent: user.discountPercent,
  created_at: user.createdAt,
});

const getUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
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

module.exports = {
  register,
  login,
  getUsers,
  exportUsersCSV,
  searchCustomers,
  createCustomer,
};
