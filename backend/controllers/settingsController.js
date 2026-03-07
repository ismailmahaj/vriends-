const db = require('../db/database');

// Récupérer toutes les settings ou une setting spécifique
const getSettings = (req, res) => {
  try {
    const { key } = req.query;
    
    if (key) {
      // Récupérer une setting spécifique
      const setting = db.prepare('SELECT * FROM settings WHERE key = ?').get(key);
      if (!setting) {
        return res.status(404).json({ error: 'Setting non trouvée' });
      }
      res.json({ key: setting.key, value: setting.value });
    } else {
      // Récupérer toutes les settings
      const settings = db.prepare('SELECT key, value FROM settings').all();
      const settingsObj = {};
      settings.forEach(s => {
        settingsObj[s.key] = s.value;
      });
      res.json(settingsObj);
    }
  } catch (error) {
    console.error('❌ Erreur récupération settings:', error);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
};

// Mettre à jour une setting
const updateSetting = (req, res) => {
  try {
    const { key, value } = req.body;

    if (!key || value === undefined) {
      return res.status(400).json({ error: 'Clé et valeur requises' });
    }

    // Vérifier si la setting existe
    const existing = db.prepare('SELECT id FROM settings WHERE key = ?').get(key);
    
    if (existing) {
      // Mettre à jour
      db.prepare(`
        UPDATE settings 
        SET value = ?, updated_at = datetime('now')
        WHERE key = ?
      `).run(value, key);
      console.log(`✅ Setting ${key} mise à jour: ${value}`);
    } else {
      // Créer
      db.prepare(`
        INSERT INTO settings (key, value)
        VALUES (?, ?)
      `).run(key, value);
      console.log(`✅ Setting ${key} créée: ${value}`);
    }

    // Si on met à jour qr_code_url, régénérer automatiquement l'image QR code
    if (key === 'qr_code_url') {
      const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(value)}&bgcolor=F7F5F2&color=3A2E25&margin=12`;
      const imageExists = db.prepare('SELECT id FROM settings WHERE key = ?').get('qr_code_image_url');
      if (imageExists) {
        db.prepare(`
          UPDATE settings 
          SET value = ?, updated_at = datetime('now')
          WHERE key = 'qr_code_image_url'
        `).run(qrImageUrl);
        console.log('✅ Image QR code régénérée');
      } else {
        db.prepare(`
          INSERT INTO settings (key, value)
          VALUES (?, ?)
        `).run('qr_code_image_url', qrImageUrl);
        console.log('✅ Image QR code créée');
      }
    }

    res.json({ success: true, key, value });
  } catch (error) {
    console.error('❌ Erreur mise à jour setting:', error);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
};

module.exports = { getSettings, updateSetting };
