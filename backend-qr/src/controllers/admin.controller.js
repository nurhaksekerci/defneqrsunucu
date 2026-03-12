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

exports.getStats = async (req, res, next) => {
  try {
    const now = new Date();
    const premiumPlan = await prisma.plan.findFirst({ where: { type: 'PREMIUM', isActive: true } });

    const [totalRestaurants, premiumRestaurantOwnerIds, totalCategories, totalProducts, activeProductsCount, productsWithoutImageCount] = await Promise.all([
      prisma.restaurant.count({ where: { isDeleted: false } }),
      prisma.subscription.findMany({
        where: {
          status: 'ACTIVE',
          endDate: { gte: now },
          planId: premiumPlan?.id
        },
        select: { userId: true }
      }).then((subs) => [...new Set(subs.map((s) => s.userId))]),
      prisma.category.count({ where: { isGlobal: true, isDeleted: false } }),
      prisma.product.count({ where: { isGlobal: true, isDeleted: false } }),
      prisma.product.count({ where: { isGlobal: true, isActive: true, isDeleted: false } }),
      prisma.product.count({
        where: {
          isGlobal: true,
          isDeleted: false,
          OR: [{ image: null }, { image: '' }]
        }
      })
    ]);

    const premiumRestaurants = premiumRestaurantOwnerIds.length
      ? await prisma.restaurant.count({
          where: {
            isDeleted: false,
            ownerId: { in: premiumRestaurantOwnerIds }
          }
        })
      : 0;

    res.json({
      success: true,
      data: {
        restaurants: {
          total: totalRestaurants,
          active: totalRestaurants,
          premium: premiumRestaurants,
          free: totalRestaurants - premiumRestaurants
        },
        global: {
          categories: totalCategories,
          products: totalProducts,
          activeProducts: activeProductsCount,
          productsWithoutImage: productsWithoutImageCount
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getDashboardData = async (req, res, next) => {
  try {
    const activityLimit = Math.min(parseInt(req.query.activityLimit) || 15, 100);

    const [recentRestaurants, recentSubscriptions, recentScans, recentReferrals] = await Promise.all([
      prisma.restaurant.findMany({
        where: { isDeleted: false },
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { id: true, name: true, slug: true, ownerId: true, createdAt: true }
      }),
      prisma.subscription.findMany({
        take: Math.min(activityLimit, 20),
        orderBy: { createdAt: 'desc' },
        include: { plan: { select: { name: true } } }
      }),
      prisma.menuScan.findMany({
        take: Math.min(activityLimit * 2, 50),
        orderBy: { scannedAt: 'desc' },
        include: { restaurant: { select: { name: true, slug: true } } }
      }),
      prisma.referral.findMany({
        take: Math.min(activityLimit, 20),
        orderBy: { createdAt: 'desc' },
        include: { affiliate: true }
      })
    ]);

    const activities = [
      ...recentRestaurants.map((r) => ({
        type: 'restaurant',
        icon: '🏪',
        label: `Yeni restoran: ${r.name}`,
        sublabel: r.ownerId,
        date: r.createdAt,
        ipAddress: null,
        userAgent: null,
        device: null
      })),
      ...recentSubscriptions.map((s) => ({
        type: 'subscription',
        icon: '💎',
        label: `${s.userId} → ${s.plan?.name}`,
        sublabel: 'Abonelik oluşturuldu',
        date: s.createdAt,
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
        label: `Referral: ${r.referredUserId} (${r.affiliate?.referralCode})`,
        sublabel: r.referredUserId,
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
