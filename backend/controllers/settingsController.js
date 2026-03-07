const db = require('../db/database');

// Récupérer toutes les settings ou une setting spécifique
const getSettings = (req, res) => {
  try {
    const { key } = req.query;
    
    if (key) {
      // Récupérer une setting spécifique
      const setting = db.prepare('SELECT * FROM settings WHERE key = ?').get(key);
      if (!setting) {
        console.log(`⚠️ Setting ${key} non trouvée`);
        return res.status(404).json({ error: 'Setting non trouvée' });
      }
      console.log(`✅ Setting ${key} récupérée: ${setting.value}`);
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
      
      // Vérifier que la mise à jour a bien fonctionné
      const updated = db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
      console.log(`🔍 Setting ${key} vérifiée après mise à jour: ${updated.value}`);
    } else {
      // Créer
      db.prepare(`
        INSERT INTO settings (key, value)
        VALUES (?, ?)
      `).run(key, value);
      console.log(`✅ Setting ${key} créée: ${value}`);
    }

    // Si on met à jour qr_code_url, régénérer l'image QR code pour pointer directement vers cette URL
    if (key === 'qr_code_url') {
      // Générer l'image QR code qui pointe directement vers l'URL de destination
      const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(value)}&bgcolor=F7F5F2&color=3A2E25&margin=12`;
      
      const imageExists = db.prepare('SELECT id FROM settings WHERE key = ?').get('qr_code_image_url');
      if (imageExists) {
        db.prepare(`
          UPDATE settings 
          SET value = ?, updated_at = datetime('now')
          WHERE key = 'qr_code_image_url'
        `).run(qrImageUrl);
        console.log(`✅ Image QR code mise à jour pour pointer directement vers: ${value}`);
      } else {
        db.prepare(`
          INSERT INTO settings (key, value)
          VALUES (?, ?)
        `).run('qr_code_image_url', qrImageUrl);
        console.log(`✅ Image QR code créée pour pointer directement vers: ${value}`);
      }
    }

    // Récupérer la valeur mise à jour depuis la base de données pour la retourner
    const updatedSetting = db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
    const finalValue = updatedSetting ? updatedSetting.value : value;
    
    console.log(`✅ Réponse API: Setting ${key} = ${finalValue}`);
    res.json({ success: true, key, value: finalValue });
  } catch (error) {
    console.error('❌ Erreur mise à jour setting:', error);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
};

module.exports = { getSettings, updateSetting };
