const prisma = require('../config/database');
const { getUserPlan } = require('../middleware/planLimit.middleware');
const { createCommission } = require('../middleware/referral.middleware');

/**
 * Get user's current subscription and plan limits
 */
exports.getMySubscription = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Get active subscription
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId,
        status: 'ACTIVE',
        endDate: {
          gte: new Date()
        }
      },
      include: {
        plan: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // If no subscription, return FREE plan info
    if (!subscription) {
      const freePlan = await prisma.plan.findFirst({
        where: {
          type: 'FREE',
          isActive: true
        }
      });

      // Count current usage
      const restaurantCount = await prisma.restaurant.count({
        where: { ownerId: userId, isDeleted: false }
      });

      const categoryCount = await prisma.category.count({
        where: {
          isDeleted: false,
          isGlobal: false,
          restaurant: { ownerId: userId }
        }
      });

      const productCount = await prisma.product.count({
        where: {
          isDeleted: false,
          isGlobal: false,
          restaurant: { ownerId: userId }
        }
      });

      return res.json({
        success: true,
        data: {
          hasSubscription: false,
          plan: freePlan,
          usage: {
            restaurants: restaurantCount,
            categories: categoryCount,
            products: productCount
          },
          limits: {
            restaurants: freePlan?.maxRestaurants || 1,
            categories: freePlan?.maxCategories || 10,
            products: freePlan?.maxProducts || 50
          }
        }
      });
    }

    // Count current usage
    const restaurantCount = await prisma.restaurant.count({
      where: { ownerId: userId, isDeleted: false }
    });

    const categoryCount = await prisma.category.count({
      where: {
        isDeleted: false,
        isGlobal: false,
        restaurant: { ownerId: userId }
      }
    });

    const productCount = await prisma.product.count({
      where: {
        isDeleted: false,
        isGlobal: false,
        restaurant: { ownerId: userId }
      }
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
          daysRemaining: Math.ceil((subscription.endDate - new Date()) / (1000 * 60 * 60 * 24))
        },
        plan: subscription.plan,
        usage: {
          restaurants: restaurantCount,
          categories: categoryCount,
          products: productCount
        },
        limits: {
          restaurants: subscription.plan.maxRestaurants,
          categories: subscription.plan.maxCategories,
          products: subscription.plan.maxProducts
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all subscriptions for current user
 */
exports.getMySubscriptions = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const subscriptions = await prisma.subscription.findMany({
      where: { userId },
      include: {
        plan: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      data: subscriptions
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Kullanıcının kendi planını satın alması (RESTAURANT_OWNER)
 * Deneme/ücretsiz plan limiti aşıldığında Premium'a yükseltmek için
 */
exports.subscribeSelf = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { planId, customRestaurantCount, amount, paymentDate } = req.body;

    // Sadece RESTAURANT_OWNER kendi planını satın alabilir (ADMIN zaten createSubscription kullanır)
    if (req.user.role !== 'RESTAURANT_OWNER' && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Bu işlem için yetkiniz yok'
      });
    }

    // createSubscription mantığını kullan (userId = req.user.id)
    req.body.userId = userId;
    return exports.createSubscription(req, res, next);
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new subscription (for admin)
 */
exports.createSubscription = async (req, res, next) => {
  try {
    const { userId, planId, customRestaurantCount, amount, paymentDate, promoCodeId, originalAmount, discountAmount } = req.body;

    // Get plan
    const plan = await prisma.plan.findUnique({
      where: { id: planId }
    });

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan bulunamadı'
      });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Kullanıcı bulunamadı'
      });
    }

    // Cancel existing active subscriptions
    await prisma.subscription.updateMany({
      where: {
        userId,
        status: 'ACTIVE'
      },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date()
      }
    });

    // Create new subscription
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + plan.duration * 24 * 60 * 60 * 1000);

    const subscription = await prisma.subscription.create({
      data: {
        userId,
        planId,
        startDate,
        endDate,
        status: 'ACTIVE',
        amount: (amount === 0 || amount === '0') ? 0 : (amount ?? plan.price),
        paymentDate: paymentDate ? new Date(paymentDate) : null,
        customRestaurantCount: customRestaurantCount || null
      },
      include: {
        plan: true,
        user: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        }
      }
    });

    // Promosyon kodu kullanıldıysa kaydet ve usedCount artır
    if (promoCodeId) {
      try {
        const promoCode = await prisma.promoCode.findUnique({
          where: { id: promoCodeId }
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
                finalAmount: final
              }
            }),
            prisma.promoCode.update({
              where: { id: promoCodeId },
              data: { usedCount: { increment: 1 } }
            })
          ]);
        }
      } catch (promoError) {
        console.error('❌ Promo code usage recording failed:', promoError);
        // Promo kaydı hatası abonelik oluşturmayı engellemez
      }
    }

    // Affiliate komisyon oluştur (varsa)
    try {
      await createCommission(userId, subscription.id, subscription.amount);
    } catch (commissionError) {
      console.error('❌ Commission creation failed:', commissionError);
      // Komisyon hatası abonelik oluşturmayı engellemez
    }

    res.status(201).json({
      success: true,
      message: 'Abonelik başarıyla oluşturuldu',
      data: subscription
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cancel subscription
 */
exports.cancelSubscription = async (req, res, next) => {
  try {
    const { id } = req.params;

    const subscription = await prisma.subscription.findUnique({
      where: { id }
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Abonelik bulunamadı'
      });
    }

    // Check authorization
    if (req.user.role !== 'ADMIN' && subscription.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Bu aboneliği iptal etme yetkiniz yok'
      });
    }

    const updatedSubscription = await prisma.subscription.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date()
      },
      include: {
        plan: true
      }
    });

    res.json({
      success: true,
      message: 'Abonelik iptal edildi',
      data: updatedSubscription
    });
  } catch (error) {
    next(error);
  }
};
