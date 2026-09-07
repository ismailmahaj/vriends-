const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getUsers,
  exportUsersCSV,
  searchCustomers,
  createCustomer,
  updateMyProfile,
  getCustomerDetail,
  updateCustomerAdmin,
} = require('../controllers/authController');
const { authMiddleware, adminMiddleware, staffMiddleware } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.patch('/me', authMiddleware, updateMyProfile);
router.get('/users', authMiddleware, adminMiddleware, getUsers);
router.get('/users/:id', authMiddleware, adminMiddleware, getCustomerDetail);
router.patch('/users/:id', authMiddleware, adminMiddleware, updateCustomerAdmin);
router.get('/export/csv', authMiddleware, adminMiddleware, exportUsersCSV);
router.get('/customers/search', authMiddleware, staffMiddleware, searchCustomers);
router.post('/customers', authMiddleware, staffMiddleware, createCustomer);

module.exports = router;
