const express = require('express');
const router = express.Router();
const { createOrder, getMyOrders, getAllOrders, updateStatus } = require('../controllers/ordersController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

router.post('/', authMiddleware, createOrder);
router.get('/me', authMiddleware, getMyOrders);
router.get('/', authMiddleware, adminMiddleware, getAllOrders);
router.patch('/:id/status', authMiddleware, adminMiddleware, updateStatus);

module.exports = router;
