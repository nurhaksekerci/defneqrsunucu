const prisma = require('../config/database');
const { getUserPlan } = require('../middleware/planLimit.middleware');

exports.getMySubscription = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const subscription = await prisma.subscription.findFirst({
      where: {
        userId,
        status: 'ACTIVE',
        endDate: { gte: new Date() },
      },
      include: { plan: true },
      orderBy: { createdAt: 'desc' },
    });

    if (!subscription) {
      const freePlan = await prisma.plan.findFirst({
        where: { type: 'FREE', isActive: true },
      });

      const restaurantCount = await prisma.restaurant.count({
        where: { ownerId: userId, isDeleted: false },
      });
      const categoryCount = await prisma.category.count({
        where: {
          isDeleted: false,
          isGlobal: false,
          restaurant: { ownerId: userId },
        },
      });
      const productCount = await prisma.product.count({
        where: {
          isDeleted: false,
          isGlobal: false,
          restaurant: { ownerId: userId },
        },
      });

      return res.json({
        success: true,
        data: {
          hasSubscription: false,
          plan: freePlan,
          usage: { restaurants: restaurantCount, categories: categoryCount, products: productCount },
          limits: {
            restaurants: freePlan?.maxRestaurants || 1,
            categories: freePlan?.maxCategories || 10,
            products: freePlan?.maxProducts || 50,
          },
        },
      });
    }

    const restaurantCount = await prisma.restaurant.count({
      where: { ownerId: userId, isDeleted: false },
    });
    const categoryCount = await prisma.category.count({
      where: {
        isDeleted: false,
        isGlobal: false,
        restaurant: { ownerId: userId },
      },
    });
    const productCount = await prisma.product.count({
      where: {
        isDeleted: false,
        isGlobal: false,
        restaurant: { ownerId: userId },
      },
    });

    res.json({
      success: true,
      data: {
        hasSubscription: true,
        subscription: {
          id: subscription.id,
          startDate: subscription.startDate,
          endDate: subscription.endDate,
          status: subscription.status,
          daysRemaining: Math.ceil((subscription.endDate - new Date()) / (1000 * 60 * 60 * 24)),
        },
        plan: subscription.plan,
        usage: { restaurants: restaurantCount, categories: categoryCount, products: productCount },
        limits: {
          restaurants: subscription.plan.maxRestaurants,
          categories: subscription.plan.maxCategories,
          products: subscription.plan.maxProducts,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getAllSubscriptions = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, planId, startDate, endDate } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (status) where.status = status;
    if (planId) where.planId = planId;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    const [subscriptions, total] = await Promise.all([
      prisma.subscription.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          plan: { select: { id: true, name: true, type: true, price: true } },
          promoCodeUsages: {
            include: { promoCode: { select: { code: true, type: true, discountValue: true } } },
          },
        },
      }),
      prisma.subscription.count({ where }),
    ]);

    const cancelledFreeIds = subscriptions
      .filter((s) => s.status === 'CANCELLED' && s.plan?.type === 'FREE')
      .map((s) => s.userId);
    const userIdsWithUpgrade = new Set();
    if (cancelledFreeIds.length > 0) {
      const upgraded = await prisma.subscription.findMany({
        where: {
          userId: { in: [...new Set(cancelledFreeIds)] },
          status: 'ACTIVE',
          plan: { type: { in: ['PREMIUM', 'CUSTOM'] } },
        },
        select: { userId: true },
      });
      upgraded.forEach((u) => userIdsWithUpgrade.add(u.userId));
    }

    const enriched = subscriptions.map((s) => ({
      ...s,
      isUpgraded: s.status === 'CANCELLED' && s.plan?.type === 'FREE' && userIdsWithUpgrade.has(s.userId),
    }));

    res.json({
      success: true,
      data: enriched,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getSubscriptionStats = async (req, res, next) => {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalRevenue, todayRevenue, monthRevenue, activeCount, todayCount, monthCount] = await Promise.all([
      prisma.subscription.aggregate({
        _sum: { amount: true },
        where: { status: { in: ['ACTIVE', 'EXPIRED'] } },
      }),
      prisma.subscription.aggregate({
        _sum: { amount: true },
        where: { createdAt: { gte: todayStart }, status: { in: ['ACTIVE', 'EXPIRED'] } },
      }),
      prisma.subscription.aggregate({
        _sum: { amount: true },
        where: { createdAt: { gte: monthStart }, status: { in: ['ACTIVE', 'EXPIRED'] } },
      }),
      prisma.subscription.count({
        where: { status: 'ACTIVE', endDate: { gte: now } },
      }),
      prisma.subscription.count({
        where: { createdAt: { gte: todayStart }, status: { in: ['ACTIVE', 'EXPIRED'] } },
      }),
      prisma.subscription.count({
        where: { createdAt: { gte: monthStart }, status: { in: ['ACTIVE', 'EXPIRED'] } },
      }),
    ]);

    res.json({
      success: true,
      data: {
        totalRevenue: totalRevenue._sum.amount || 0,
        todayRevenue: todayRevenue._sum.amount || 0,
        monthRevenue: monthRevenue._sum.amount || 0,
        activeSubscriptions: activeCount,
        todaySubscriptions: todayCount,
        monthSubscriptions: monthCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getMySubscriptions = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const subscriptions = await prisma.subscription.findMany({
      where: { userId },
      include: { plan: true },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: subscriptions });
  } catch (error) {
    next(error);
  }
};

exports.subscribeSelf = async (req, res, next) => {
  try {
    const userId = req.user.id;
    if (req.user.role !== 'RESTAURANT_OWNER' && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Bu işlem için yetkiniz yok' });
    }
    req.body.userId = userId;
    return exports.createSubscription(req, res, next);
  } catch (error) {
    next(error);
  }
};

exports.createSubscription = async (req, res, next) => {
  try {
    const { userId, planId, customRestaurantCount, amount, paymentDate, promoCodeId, originalAmount, discountAmount } = req.body;

    const plan = await prisma.plan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      return res.status(404).json({ success: false, message: 'Plan bulunamadı' });
    }

    await prisma.subscription.updateMany({
      where: { userId, status: 'ACTIVE' },
      data: { status: 'CANCELLED', cancelledAt: new Date() },
    });

    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + plan.duration * 24 * 60 * 60 * 1000);

    const subscription = await prisma.subscription.create({
      data: {
        userId,
        planId,
        startDate,
        endDate,
        status: 'ACTIVE',
        amount: amount === 0 || amount === '0' ? 0 : amount ?? plan.price,
        paymentDate: paymentDate ? new Date(paymentDate) : null,
        customRestaurantCount: customRestaurantCount || null,
      },
      include: { plan: true },
    });

    if (promoCodeId) {
      try {
        const promoCode = await prisma.promoCode.findUnique({
          where: { id: promoCodeId },
        });
        if (promoCode) {
          const orig = parseFloat(originalAmount) || subscription.amount;
          const disc = parseFloat(discountAmount) || 0;
          const final = Math.max(0, orig - disc);

          await prisma.$transaction([
            prisma.promoCodeUsage.create({
              data: {
                promoCodeId,
                userId,
                subscriptionId: subscription.id,
                discountAmount: disc,
                originalAmount: orig,
                finalAmount: final,
              },
            }),
            prisma.promoCode.update({
              where: { id: promoCodeId },
              data: { usedCount: { increment: 1 } },
            }),
          ]);
        }
      } catch (promoError) {
        console.error('Promo code usage recording failed:', promoError);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Abonelik başarıyla oluşturuldu',
      data: subscription,
    });
  } catch (error) {
    next(error);
  }
};

exports.extendSubscription = async (req, res, next) => {
  try {
    const { restaurantId, days } = req.body;
    const daysNum = parseInt(days, 10);

    if (!daysNum || daysNum < 1 || daysNum > 365) {
      return res.status(400).json({ success: false, message: 'Geçerli bir gün sayısı girin (1-365)' });
    }

    let ownerIds = [];
    if (restaurantId) {
      const restaurant = await prisma.restaurant.findUnique({
        where: { id: restaurantId, isDeleted: false },
      });
      if (!restaurant) {
        return res.status(404).json({ success: false, message: 'Restoran bulunamadı' });
      }
      ownerIds = [restaurant.ownerId];
    } else {
      const owners = await prisma.restaurant.findMany({
        where: { isDeleted: false },
        select: { ownerId: true },
      });
      ownerIds = [...new Set(owners.map((r) => r.ownerId))];
    }

    const now = new Date();
    const activeSubs = await prisma.subscription.findMany({
      where: { userId: { in: ownerIds }, status: 'ACTIVE' },
    });

    const msPerDay = 24 * 60 * 60 * 1000;
    let updated = 0;

    for (const sub of activeSubs) {
      const currentEnd = new Date(sub.endDate);
      const newEnd =
        currentEnd < now
          ? new Date(now.getTime() + daysNum * msPerDay)
          : new Date(currentEnd.getTime() + daysNum * msPerDay);

      await prisma.subscription.update({
        where: { id: sub.id },
        data: { endDate: newEnd },
      });
      updated++;
    }

    res.json({
      success: true,
      message: restaurantId
        ? `${updated} aboneliğe ${daysNum} gün eklendi`
        : `Tüm restoran sahiplerinin ${updated} aboneliğine ${daysNum} gün eklendi`,
      data: { extendedCount: updated, daysAdded: daysNum },
    });
  } catch (error) {
    next(error);
  }
};

exports.cancelSubscription = async (req, res, next) => {
  try {
    const { id } = req.params;

    const subscription = await prisma.subscription.findUnique({
      where: { id },
    });

    if (!subscription) {
      return res.status(404).json({ success: false, message: 'Abonelik bulunamadı' });
    }

    if (req.user.role !== 'ADMIN' && subscription.userId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Bu aboneliği iptal etme yetkiniz yok' });
    }

    const updatedSubscription = await prisma.subscription.update({
      where: { id },
      data: { status: 'CANCELLED', cancelledAt: new Date() },
      include: { plan: true },
    });

    res.json({
      success: true,
      message: 'Abonelik iptal edildi',
      data: updatedSubscription,
    });
  } catch (error) {
    next(error);
  }
};
