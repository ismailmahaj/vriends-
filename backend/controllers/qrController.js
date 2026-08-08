const prisma = require('../db/prisma');

const trackQRScan = async (req, res) => {
  try {
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    await prisma.qrScan.create({
      data: {
        ipAddress,
        userAgent,
      },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('❌ Erreur tracking QR scan:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const getQRStats = async (req, res) => {
  try {
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const monthAgo = new Date(now);
    monthAgo.setDate(monthAgo.getDate() - 30);

    const [total, today, thisWeek, thisMonth] = await Promise.all([
      prisma.qrScan.count(),
      prisma.qrScan.count({ where: { createdAt: { gte: startOfToday } } }),
      prisma.qrScan.count({ where: { createdAt: { gte: weekAgo } } }),
      prisma.qrScan.count({ where: { createdAt: { gte: monthAgo } } }),
    ]);

    res.json({
      total,
      today,
      thisWeek,
      thisMonth,
    });
  } catch (error) {
    console.error('❌ Erreur récupération stats QR:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

module.exports = { trackQRScan, getQRStats };
