const db = require('../db/database');

const submitContact = (req, res) => {
  const { name, email, phone, message, consent } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Nom, email et message sont requis' });
  }

  if (consent !== true) {
    return res.status(400).json({ error: 'Le consentement est requis' });
  }

  try {
    // Sanitizer basique
    const sanitizedMessage = message
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/&/g, '&amp;');

    db.prepare(`
      INSERT INTO contacts (name, email, phone, message, consent)
      VALUES (?, ?, ?, ?, 1)
    `).run(name, email, phone || null, sanitizedMessage);

    res.status(201).json({ success: true, message: 'Message envoyé avec succès' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const getContacts = (req, res) => {
  const { sort = 'desc', treated } = req.query;

  try {
    let query = 'SELECT * FROM contacts';
    const params = [];

    if (treated !== undefined) {
      query += ' WHERE treated = ?';
      params.push(treated === 'true' ? 1 : 0);
    }

    query += ` ORDER BY created_at ${sort === 'asc' ? 'ASC' : 'DESC'}`;

    const contacts = db.prepare(query).all(...params);
    const newCount = db.prepare('SELECT COUNT(*) as count FROM contacts WHERE treated = 0').get().count;

    res.json({
      contacts: contacts.map(c => ({
        ...c,
        treated: c.treated === 1,
        consent: c.consent === 1
      })),
      total: contacts.length,
      newCount
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const markTreated = (req, res) => {
  const { id } = req.params;
  const { treated } = req.body;

  try {
    db.prepare('UPDATE contacts SET treated = ? WHERE id = ?').run(treated ? 1 : 0, id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const deleteContact = (req, res) => {
  const { id } = req.params;

  try {
    db.prepare('DELETE FROM contacts WHERE id = ?').run(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const exportCSV = (req, res) => {
  try {
    const contacts = db.prepare('SELECT * FROM contacts ORDER BY created_at DESC').all();
    
    console.log(`📊 Export CSV: ${contacts.length} contact(s) trouvé(s)`);
    
    // BOM UTF-8 pour Excel
    let csv = '\ufeffID,Nom,Email,Téléphone,Message,Consentement,Traité,Date\n';
    
    if (contacts.length === 0) {
      csv += 'Aucun contact\n';
    } else {
      contacts.forEach(contact => {
        const row = [
          contact.id,
          `"${String(contact.name || '').replace(/"/g, '""')}"`,
          String(contact.email || ''),
          String(contact.phone || ''),
          `"${String(contact.message || '').replace(/"/g, '""').replace(/\n/g, ' ').replace(/\r/g, '')}"`,
          contact.consent === 1 ? 'Oui' : 'Non',
          contact.treated === 1 ? 'Oui' : 'Non',
          String(contact.created_at || '')
        ].join(',');
        csv += row + '\n';
      });
    }

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=contacts-vriends.csv');
    res.send(csv);
  } catch (error) {
    console.error('❌ Erreur export CSV:', error);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
};

module.exports = { submitContact, getContacts, markTreated, deleteContact, exportCSV };
