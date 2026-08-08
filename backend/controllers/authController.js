const prisma = require('../db/prisma');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const register = async (req, res) => {
  const { name, email, password, localStatus } = req.body;

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

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        localStatus: local_status,
        discountPercent: discount_percent,
      },
    });

    console.log('✅ Utilisateur créé:', {
      id: newUser.id,
      email,
      name,
      local_status: local_status ? 'Oui' : 'Non',
      discount_percent: `${discount_percent}%`,
    });

    res.status(201).json({
      success: true,
      message: 'Compte créé',
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
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

const getUsers = async (req, res) => {
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

    res.json(
      users.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        local_status: user.localStatus,
        discount_percent: user.discountPercent,
        created_at: user.createdAt,
      }))
    );
  } catch (error) {
    console.error('❌ Erreur récupération utilisateurs:', error);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
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

module.exports = { register, login, getUsers, exportUsersCSV };
