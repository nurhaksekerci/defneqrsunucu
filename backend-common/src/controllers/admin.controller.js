const prisma = require('../config/database');

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
