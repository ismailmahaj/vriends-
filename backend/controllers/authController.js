const db = require('../db/database');
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
    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existingUser) {
      return res.status(400).json({ error: 'Email déjà utilisé' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const local_status = localStatus ? 1 : 0;
    // Si l'utilisateur vient de Poperinge, lui attribuer 10% de réduction
    const discount_percent = localStatus ? 10 : 0;

    const result = db.prepare(`
      INSERT INTO users (name, email, password, local_status, discount_percent)
      VALUES (?, ?, ?, ?, ?)
    `).run(name, email, hashedPassword, local_status, discount_percent);

    const newUser = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);

    console.log('✅ Utilisateur créé:', { 
      id: newUser.id, 
      email, 
      name, 
      local_status: local_status === 1 ? 'Oui' : 'Non',
      discount_percent: discount_percent + '%'
    });

    res.status(201).json({
      success: true,
      message: 'Compte créé',
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        local_status: newUser.local_status === 1,
        discount_percent: newUser.discount_percent
      }
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
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    
    if (!user) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    console.log('Tentative de connexion pour:', email);
    
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      console.log('Mot de passe incorrect pour:', email);
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    // Utiliser une valeur par défaut si JWT_SECRET n'est pas défini
    const jwtSecret = process.env.JWT_SECRET || 'vriends_super_secret_key_change_in_production';
    
    if (!jwtSecret) {
      console.error('❌ JWT_SECRET n\'est pas défini');
      return res.status(500).json({ error: 'Configuration serveur manquante' });
    }

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
        local_status: user.local_status === 1,
        discount_percent: user.discount_percent
      }
    });
  } catch (error) {
    console.error('❌ Erreur login:', error);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
};

const getUsers = (req, res) => {
  try {
    const users = db.prepare('SELECT id, name, email, role, local_status, discount_percent, created_at FROM users ORDER BY created_at DESC').all();
    
    res.json(users.map(user => ({
      ...user,
      local_status: user.local_status === 1
    })));
  } catch (error) {
    console.error('❌ Erreur récupération utilisateurs:', error);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
};

const exportUsersCSV = (req, res) => {
  try {
    const users = db.prepare('SELECT id, name, email, role, local_status, discount_percent, created_at FROM users ORDER BY created_at DESC').all();
    
    console.log(`📊 Export CSV utilisateurs: ${users.length} utilisateur(s) trouvé(s)`);
    
    // BOM UTF-8 pour Excel
    let csv = '\ufeffID,Nom,Email,Rôle,Statut Local,Réduction (%),Date de création\n';
    
    if (users.length === 0) {
      csv += 'Aucun utilisateur\n';
    } else {
      users.forEach(user => {
        const row = [
          user.id,
          `"${String(user.name || '').replace(/"/g, '""')}"`,
          String(user.email || ''),
          String(user.role || 'client'),
          user.local_status === 1 ? 'Oui' : 'Non',
          String(user.discount_percent || 0),
          String(user.created_at || '')
        ].join(',');
        csv += row + '\n';
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
