const express = require('express');
const router = express.Router();
const { getSettings, updateSetting } = require('../controllers/settingsController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// GET /api/settings - Récupérer une setting spécifique (public pour qr_code_url et qr_code_image_url)
router.get('/', (req, res) => {
  // Si on demande spécifiquement qr_code_url ou qr_code_image_url, c'est public (pas besoin d'auth)
  if (req.query.key === 'qr_code_url' || req.query.key === 'qr_code_image_url') {
    return getSettings(req, res);
  }
  // Sinon, admin seulement
  authMiddleware(req, res, () => {
    adminMiddleware(req, res, () => {
      getSettings(req, res);
    });
  });
});

// PUT /api/settings - Mettre à jour une setting (admin seulement)
router.put('/', authMiddleware, adminMiddleware, updateSetting);

module.exports = router;
