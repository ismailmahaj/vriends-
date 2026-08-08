const express = require('express');
const router = express.Router();
const {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  toggleProduct,
} = require('../controllers/productsController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

router.get('/', getProducts);
router.post('/', authMiddleware, adminMiddleware, createProduct);
router.put('/:id', authMiddleware, adminMiddleware, updateProduct);
router.delete('/:id', authMiddleware, adminMiddleware, deleteProduct);
router.patch('/:id/toggle', authMiddleware, adminMiddleware, toggleProduct);

module.exports = router;
