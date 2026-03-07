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

    // Si on met à jour qr_code_url, NE PAS régénérer l'image QR code
    // L'image QR code pointe toujours vers /qr-redirect (URL fixe)
    // La redirection se fera automatiquement vers la nouvelle URL
    // Ainsi, même si l'URL change, le QR code imprimé continue de fonctionner

    res.json({ success: true, key, value });
  } catch (error) {
    console.error('❌ Erreur mise à jour setting:', error);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
};

module.exports = { getSettings, updateSetting };
