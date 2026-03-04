const express = require('express');
const router = express.Router();
const { getProducts, toggleProduct } = require('../controllers/productsController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

router.get('/', getProducts);
router.patch('/:id/toggle', authMiddleware, adminMiddleware, toggleProduct);

module.exports = router;
