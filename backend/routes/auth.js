const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getUsers,
  exportUsersCSV,
  searchCustomers,
  createCustomer,
} = require('../controllers/authController');
const { authMiddleware, adminMiddleware, staffMiddleware } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/users', authMiddleware, adminMiddleware, getUsers);
router.get('/export/csv', authMiddleware, adminMiddleware, exportUsersCSV);
router.get('/customers/search', authMiddleware, staffMiddleware, searchCustomers);
router.post('/customers', authMiddleware, staffMiddleware, createCustomer);

module.exports = router;
