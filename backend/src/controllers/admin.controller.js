const prisma = require('../config/database');

/**
 * Admin dashboard - son restoranlar ve sistem aktivitesi
 */
exports.getDashboardData = async (req, res, next) => {
  try {
    const activityLimit = Math.min(parseInt(req.query.activityLimit) || 15, 100);
    const [recentRestaurants, recentUsers, recentSubscriptions, recentTickets, recentScans] = await Promise.all([
      prisma.restaurant.findMany({
        where: { isDeleted: false },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          owner: { select: { fullName: true, email: true } }
        }
      }),
      prisma.user.findMany({
        where: { isDeleted: false },
        take: Math.min(activityLimit, 20),
        orderBy: { createdAt: 'desc' },
        select: { id: true, fullName: true, email: true, role: true, createdAt: true }
      }),
      prisma.subscription.findMany({
        take: Math.min(activityLimit, 20),
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { fullName: true, email: true } },
          plan: { select: { name: true } }
        }
      }),
      prisma.supportTicket.findMany({
        take: Math.min(activityLimit, 20),
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { fullName: true, email: true } }
        }
      }),
      prisma.menuScan.findMany({
        take: Math.min(activityLimit * 2, 50),
        orderBy: { scannedAt: 'desc' },
        include: {
          restaurant: { select: { name: true, slug: true } }
        }
      })
    ]);

    // Aktivite akışı: tüm kaynakları birleştir, tarihe göre sırala
    const activities = [
      ...recentRestaurants.map((r) => ({
        type: 'restaurant',
        icon: '🏪',
        label: `Yeni restoran: ${r.name}`,
        sublabel: r.owner?.fullName,
        date: r.createdAt
      })),
      ...recentUsers.map((u) => ({
        type: 'user',
        icon: '👤',
        label: `Yeni kullanıcı: ${u.fullName}`,
        sublabel: u.email,
        date: u.createdAt
      })),
      ...recentSubscriptions.map((s) => ({
        type: 'subscription',
        icon: '💎',
        label: `${s.user?.fullName} → ${s.plan?.name}`,
        sublabel: 'Abonelik oluşturuldu',
        date: s.createdAt
      })),
      ...recentTickets.map((t) => ({
        type: 'ticket',
        icon: '🎫',
        label: `Destek talebi: ${t.subject}`,
        sublabel: t.user?.fullName,
        date: t.createdAt
      })),
      ...recentScans.map((s) => ({
        type: 'scan',
        icon: '📱',
        label: `QR tarama: ${s.restaurant?.name}`,
        sublabel: null,
        date: s.scannedAt
      }))
    ]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, activityLimit);

    res.json({
      success: true,
      data: {
        recentRestaurants,
        activities
      }
    });
  } catch (error) {
    next(error);
  }
};
