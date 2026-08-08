const prisma = require('../db/prisma');

const submitContact = async (req, res) => {
  const { name, email, phone, message, consent } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Nom, email et message sont requis' });
  }

  if (consent !== true) {
    return res.status(400).json({ error: 'Le consentement est requis' });
  }

  try {
    const sanitizedMessage = message
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/&/g, '&amp;');

    await prisma.contact.create({
      data: {
        name,
        email,
        phone: phone || null,
        message: sanitizedMessage,
        consent: true,
      },
    });

    res.status(201).json({ success: true, message: 'Message envoyé avec succès' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const getContacts = async (req, res) => {
  const { sort = 'desc', treated } = req.query;

  try {
    const where = {};
    if (treated !== undefined) {
      where.treated = treated === 'true';
    }

    const contacts = await prisma.contact.findMany({
      where,
      orderBy: { createdAt: sort === 'asc' ? 'asc' : 'desc' },
    });
    const newCount = await prisma.contact.count({ where: { treated: false } });

    res.json({
      contacts: contacts.map((c) => ({
        id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        message: c.message,
        consent: c.consent,
        treated: c.treated,
        created_at: c.createdAt,
      })),
      total: contacts.length,
      newCount,
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const markTreated = async (req, res) => {
  const { id } = req.params;
  const { treated } = req.body;

  try {
    await prisma.contact.update({
      where: { id: Number(id) },
      data: { treated: !!treated },
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const deleteContact = async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.contact.delete({ where: { id: Number(id) } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const exportCSV = async (req, res) => {
  try {
    const contacts = await prisma.contact.findMany({
      orderBy: { createdAt: 'desc' },
    });

    console.log(`📊 Export CSV: ${contacts.length} contact(s) trouvé(s)`);

    let csv = '\ufeffID,Nom,Email,Téléphone,Message,Consentement,Traité,Date\n';

    if (contacts.length === 0) {
      csv += 'Aucun contact\n';
    } else {
      contacts.forEach((contact) => {
        const row = [
          contact.id,
          `"${String(contact.name || '').replace(/"/g, '""')}"`,
          String(contact.email || ''),
          String(contact.phone || ''),
          `"${String(contact.message || '').replace(/"/g, '""').replace(/\n/g, ' ').replace(/\r/g, '')}"`,
          contact.consent ? 'Oui' : 'Non',
          contact.treated ? 'Oui' : 'Non',
          String(contact.createdAt || ''),
        ].join(',');
        csv += `${row}\n`;
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
