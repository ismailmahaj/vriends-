const express = require('express');
const router = express.Router();
const { trackQRScan, getQRStats } = require('../controllers/qrController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

router.post('/track', trackQRScan);
router.get('/stats', authMiddleware, adminMiddleware, getQRStats);

module.exports = router;
