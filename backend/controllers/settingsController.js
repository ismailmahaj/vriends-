const prisma = require('../db/prisma');

const getSettings = async (req, res) => {
  try {
    const { key } = req.query;

    if (key) {
      const setting = await prisma.setting.findUnique({ where: { key } });
      if (!setting) {
        console.log(`⚠️ Setting ${key} non trouvée`);
        return res.status(404).json({ error: 'Setting non trouvée' });
      }
      console.log(`✅ Setting ${key} récupérée: ${setting.value}`);
      return res.json({ key: setting.key, value: setting.value });
    }

    const settings = await prisma.setting.findMany({
      select: { key: true, value: true },
    });
    const settingsObj = {};
    settings.forEach((s) => {
      settingsObj[s.key] = s.value;
    });
    res.json(settingsObj);
  } catch (error) {
    console.error('❌ Erreur récupération settings:', error);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
};

const updateSetting = async (req, res) => {
  try {
    const { key, value } = req.body;

    if (!key || value === undefined) {
      return res.status(400).json({ error: 'Clé et valeur requises' });
    }

    await prisma.setting.upsert({
      where: { key },
      create: { key, value: String(value) },
      update: { value: String(value) },
    });
    console.log(`✅ Setting ${key} mise à jour: ${value}`);

    if (key === 'qr_code_url') {
      const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(value)}&bgcolor=F7F5F2&color=3A2E25&margin=12`;
      await prisma.setting.upsert({
        where: { key: 'qr_code_image_url' },
        create: { key: 'qr_code_image_url', value: qrImageUrl },
        update: { value: qrImageUrl },
      });
      console.log(`✅ Image QR code mise à jour pour pointer directement vers: ${value}`);
    }

    const updatedSetting = await prisma.setting.findUnique({ where: { key } });
    const finalValue = updatedSetting ? updatedSetting.value : value;

    console.log(`✅ Réponse API: Setting ${key} = ${finalValue}`);
    res.json({ success: true, key, value: finalValue });
  } catch (error) {
    console.error('❌ Erreur mise à jour setting:', error);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
};

module.exports = { getSettings, updateSetting };
