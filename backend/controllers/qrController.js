const db = require('../db/database');

const trackQRScan = (req, res) => {
  try {
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    db.prepare(`
      INSERT INTO qr_scans (ip_address, user_agent)
      VALUES (?, ?)
    `).run(ipAddress, userAgent);

    res.json({ success: true });
  } catch (error) {
    console.error('❌ Erreur tracking QR scan:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const getQRStats = (req, res) => {
  try {
    const totalScans = db.prepare('SELECT COUNT(*) as count FROM qr_scans').get().count;
    const todayScans = db.prepare(`
      SELECT COUNT(*) as count FROM qr_scans 
      WHERE DATE(created_at) = DATE('now')
    `).get().count;
    const thisWeekScans = db.prepare(`
      SELECT COUNT(*) as count FROM qr_scans 
      WHERE created_at >= datetime('now', '-7 days')
    `).get().count;
    const thisMonthScans = db.prepare(`
      SELECT COUNT(*) as count FROM qr_scans 
      WHERE created_at >= datetime('now', '-30 days')
    `).get().count;

    res.json({
      total: totalScans,
      today: todayScans,
      thisWeek: thisWeekScans,
      thisMonth: thisMonthScans
    });
  } catch (error) {
    console.error('❌ Erreur récupération stats QR:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

module.exports = { trackQRScan, getQRStats };
