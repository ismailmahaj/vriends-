const express = require('express');
const router = express.Router();
const { register, login, getUsers, exportUsersCSV } = require('../controllers/authController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/users', authMiddleware, adminMiddleware, getUsers);
router.get('/export/csv', authMiddleware, adminMiddleware, exportUsersCSV);

module.exports = router;
