const express = require('express');
const router = express.Router();
const { authMiddleware, staffMiddleware, managerMiddleware } = require('../middleware/auth');
const pos = require('../controllers/posController');

router.use(authMiddleware, staffMiddleware);

router.get('/products', pos.getProducts);
router.get('/categories', pos.getCategories);
router.get('/settings', pos.getSettings);
router.put('/settings', managerMiddleware, pos.updateSettings);
router.post('/products/:id/favorite', pos.toggleFavorite);

router.post('/orders/preview', pos.previewPricing);
router.post('/orders', pos.createOrder);
router.get('/orders', pos.getOrders);
router.get('/orders/:id', pos.getOrderById);
router.post('/orders/:id/payment', pos.payOrder);
router.post('/orders/:id/hold', pos.holdOrder);
router.post('/orders/:id/resume', pos.resumeOrder);
router.post('/orders/:id/cancel', pos.cancelOrder);

router.get('/stats', managerMiddleware, pos.getStats);

module.exports = router;
