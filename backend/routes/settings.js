const express = require('express');
const router = express.Router();
const { getSettings, updateSetting } = require('../controllers/settingsController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const {
  getOrdersAcceptingState,
  getSettingsMap,
  ensureDefaultSettings,
  DEFAULTS,
} = require('../lib/shopSettings');
const { sendTestEmail } = require('../lib/emailService');
const prisma = require('../db/prisma');

const PUBLIC_KEYS = new Set([
  'qr_code_url',
  'qr_code_image_url',
  'orders_accepting',
  'orders_closed_message',
  'orders_reopen_at',
  'cgv_version',
]);

router.get('/orders-status', async (req, res) => {
  try {
    await ensureDefaultSettings();
    const state = await getOrdersAcceptingState();
    res.json(state);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.get('/shop', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await ensureDefaultSettings();
    const map = await getSettingsMap(Object.keys(DEFAULTS));
    res.json(map);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.put('/shop', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const body = req.body || {};
    const allowed = Object.keys(DEFAULTS);

    if (body.pos_auto_print_copies !== undefined) {
      const copies = Number(body.pos_auto_print_copies);
      if (!Number.isInteger(copies) || copies < 1 || copies > 5) {
        return res.status(400).json({ error: 'Nombre de copies invalide (1 à 5)' });
      }
      body.pos_auto_print_copies = String(copies);
    }
    if (body.pos_ticket_width_mm !== undefined) {
      const w = String(body.pos_ticket_width_mm);
      if (w !== '58' && w !== '80') {
        return res.status(400).json({ error: 'Largeur ticket invalide (58 ou 80)' });
      }
    }

    for (const key of allowed) {
      if (body[key] === undefined) continue;
      await prisma.setting.upsert({
        where: { key },
        create: { key, value: String(body[key]) },
        update: { value: String(body[key]) },
      });
    }
    const map = await getSettingsMap(allowed);
    res.json({ success: true, settings: map });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.post('/email-test', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const result = await sendTestEmail(req.body?.to);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.get('/email-logs', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const logs = await prisma.emailLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: Number(req.query.limit) || 50,
    });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.get('/', (req, res) => {
  if (req.query.key && PUBLIC_KEYS.has(req.query.key)) {
    return getSettings(req, res);
  }
  authMiddleware(req, res, () => {
    adminMiddleware(req, res, () => {
      getSettings(req, res);
    });
  });
});

router.put('/', authMiddleware, adminMiddleware, updateSetting);

module.exports = router;
