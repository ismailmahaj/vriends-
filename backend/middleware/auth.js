const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1] || req.query.token;

  if (!token) {
    return res.status(401).json({ error: 'Token manquant' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token invalide' });
  }
};

const adminMiddleware = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Accès admin requis' });
  }
  next();
};

const STAFF_ROLES = ['admin', 'manager', 'cashier'];
const MANAGER_ROLES = ['admin', 'manager'];

const staffMiddleware = (req, res, next) => {
  if (!STAFF_ROLES.includes(req.user.role)) {
    return res.status(403).json({ error: 'Accès caisse requis' });
  }
  next();
};

const managerMiddleware = (req, res, next) => {
  if (!MANAGER_ROLES.includes(req.user.role)) {
    return res.status(403).json({ error: 'Accès manager requis' });
  }
  next();
};

module.exports = {
  authMiddleware,
  adminMiddleware,
  staffMiddleware,
  managerMiddleware,
  STAFF_ROLES,
  MANAGER_ROLES,
};
