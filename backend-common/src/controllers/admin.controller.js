const prisma = require('../config/database');

/**
 * Get users by IDs (id, fullName, email) - for cross-service enrichment (e.g. backend-qr restaurants)
 */
exports.getUsersByIds = async (req, res, next) => {
  try {
    const idsParam = req.query.ids;
    if (!idsParam || typeof idsParam !== 'string') {
      return res.json({ success: true, data: [] });
    }
    const ids = idsParam.split(',').map((id) => id.trim()).filter(Boolean);
    if (ids.length === 0) {
      return res.json({ success: true, data: [] });
    }

    const users = await prisma.user.findMany({
      where: { id: { in: ids } },
      select: { id: true, fullName: true, email: true }
    });

    const byId = {};
    users.forEach((u) => { byId[u.id] = u; });
    res.json({ success: true, data: byId });
  } catch (error) {
    next(error);
  }
};

exports.getDashboardData = async (req, res, next) => {
  try {
    const activityLimit = Math.min(parseInt(req.query.activityLimit) || 15, 100);

    const [recentUsers, recentTickets] = await Promise.all([
      prisma.user.findMany({
        where: { isDeleted: false },
        take: Math.min(activityLimit, 20),
        orderBy: { createdAt: 'desc' },
        select: { id: true, fullName: true, email: true, role: true, createdAt: true }
      }),
      prisma.supportTicket.findMany({
        take: Math.min(activityLimit, 20),
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { fullName: true, email: true } } }
      })
    ]);

    const activities = [
      ...recentUsers.map((u) => ({
        type: 'user',
        icon: '👤',
        label: `Yeni kullanıcı: ${u.fullName}`,
        sublabel: u.email,
        date: u.createdAt,
        ipAddress: null,
        userAgent: null,
        device: null
      })),
      ...recentTickets.map((t) => ({
        type: 'ticket',
        icon: '🎫',
        label: `Destek talebi: ${t.subject}`,
        sublabel: t.user?.fullName,
        date: t.createdAt,
        ipAddress: null,
        userAgent: null,
        device: null
      }))
    ]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, activityLimit);

    res.json({ success: true, data: { activities } });
  } catch (error) {
    next(error);
  }
};
