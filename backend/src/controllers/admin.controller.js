const prisma = require('../config/database');

function parseUserAgent(ua) {
  if (!ua) return null;
  const u = ua.toLowerCase();
  let browser = 'Tarayıcı';
  if (u.includes('chrome') && !u.includes('edg')) browser = 'Chrome';
  else if (u.includes('firefox')) browser = 'Firefox';
  else if (u.includes('safari') && !u.includes('chrome')) browser = 'Safari';
  else if (u.includes('edg')) browser = 'Edge';
  else if (u.includes('opera') || u.includes('opr')) browser = 'Opera';
  let device = u.includes('mobile') || u.includes('android') || u.includes('iphone') ? 'Mobil' : 'Masaüstü';
  if (u.includes('iphone') || u.includes('ipad')) device = 'iOS';
  else if (u.includes('android')) device = 'Android';
  return `${browser} / ${device}`;
}

/**
 * Admin dashboard - son restoranlar ve sistem aktivitesi
 */
exports.getDashboardData = async (req, res, next) => {
  try {
    const activityLimit = Math.min(parseInt(req.query.activityLimit) || 15, 100);
    const [recentRestaurants, recentUsers, recentSubscriptions, recentTickets, recentScans, recentReferrals] = await Promise.all([
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
      }),
      prisma.referral.findMany({
        take: Math.min(activityLimit, 20),
        orderBy: { createdAt: 'desc' },
        include: {
          referredUser: { select: { fullName: true, email: true } },
          affiliate: { include: { user: { select: { fullName: true } } } }
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
        date: r.createdAt,
        ipAddress: null,
        userAgent: null,
        device: null
      })),
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
      ...recentSubscriptions.map((s) => ({
        type: 'subscription',
        icon: '💎',
        label: `${s.user?.fullName} → ${s.plan?.name}`,
        sublabel: 'Abonelik oluşturuldu',
        date: s.createdAt,
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
      })),
      ...recentScans.map((s) => ({
        type: 'scan',
        icon: '📱',
        label: `QR tarama: ${s.restaurant?.name}`,
        sublabel: null,
        date: s.scannedAt,
        ipAddress: s.ipAddress || null,
        userAgent: s.userAgent || null,
        device: parseUserAgent(s.userAgent)
      })),
      ...recentReferrals.map((r) => ({
        type: 'referral',
        icon: '🔗',
        label: `Referral: ${r.referredUser?.fullName} (${r.affiliate?.user?.fullName})`,
        sublabel: r.referredUser?.email,
        date: r.createdAt,
        ipAddress: r.ipAddress || null,
        userAgent: r.userAgent || null,
        device: parseUserAgent(r.userAgent)
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
