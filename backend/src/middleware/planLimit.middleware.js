const prisma = require('../config/database');

/**
 * Get user's active subscription and plan
 */
async function getUserPlan(userId) {
  // Find active subscription
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

  // If no subscription, get FREE plan
  if (!subscription) {
    const freePlan = await prisma.plan.findFirst({
      where: {
        type: 'FREE',
        isActive: true
      }
    });

    return freePlan;
  }

  return subscription.plan;
}

/**
 * Check if user has reached restaurant limit
 */
async function checkRestaurantLimit(userId) {
  const plan = await getUserPlan(userId);
  
  if (!plan) {
    throw new Error('Plan bulunamadı');
  }

  // Count user's restaurants
  const restaurantCount = await prisma.restaurant.count({
    where: {
      ownerId: userId,
      isDeleted: false
    }
  });

  // Check limit
  if (restaurantCount >= plan.maxRestaurants) {
    return {
      allowed: false,
      plan,
      currentCount: restaurantCount,
      maxCount: plan.maxRestaurants,
      message: `Plan limitinize ulaştınız. Maksimum ${plan.maxRestaurants} işletme oluşturabilirsiniz. Daha fazla işletme için planınızı yükseltin.`
    };
  }

  return {
    allowed: true,
    plan,
    currentCount: restaurantCount,
    maxCount: plan.maxRestaurants
  };
}

/**
 * Check if user has reached category limit
 */
async function checkCategoryLimit(userId, restaurantId = null) {
  const plan = await getUserPlan(userId);
  
  if (!plan) {
    throw new Error('Plan bulunamadı');
  }

  // Count user's categories (global or restaurant-specific)
  const where = {
    isDeleted: false,
    OR: [
      { isGlobal: false, restaurant: { ownerId: userId } }
    ]
  };

  if (restaurantId) {
    where.restaurantId = restaurantId;
  }

  const categoryCount = await prisma.category.count({ where });

  // Check limit
  if (categoryCount >= plan.maxCategories) {
    return {
      allowed: false,
      plan,
      currentCount: categoryCount,
      maxCount: plan.maxCategories,
      message: `Plan limitinize ulaştınız. Maksimum ${plan.maxCategories} kategori oluşturabilirsiniz. Daha fazla kategori için planınızı yükseltin.`
    };
  }

  return {
    allowed: true,
    plan,
    currentCount: categoryCount,
    maxCount: plan.maxCategories
  };
}

/**
 * Check if user has reached product limit
 */
async function checkProductLimit(userId, restaurantId = null) {
  const plan = await getUserPlan(userId);
  
  if (!plan) {
    throw new Error('Plan bulunamadı');
  }

  // Count user's products (global or restaurant-specific)
  const where = {
    isDeleted: false,
    OR: [
      { isGlobal: false, restaurant: { ownerId: userId } }
    ]
  };

  if (restaurantId) {
    where.restaurantId = restaurantId;
  }

  const productCount = await prisma.product.count({ where });

  // Check limit
  if (productCount >= plan.maxProducts) {
    return {
      allowed: false,
      plan,
      currentCount: productCount,
      maxCount: plan.maxProducts,
      message: `Plan limitinize ulaştınız. Maksimum ${plan.maxProducts} ürün oluşturabilirsiniz. Daha fazla ürün için planınızı yükseltin.`
    };
  }

  return {
    allowed: true,
    plan,
    currentCount: productCount,
    maxCount: plan.maxProducts
  };
}

/**
 * Auto-assign FREE plan to user if they don't have one
 */
async function assignFreePlanIfNeeded(userId) {
  // Check if user already has a subscription
  const existingSubscription = await prisma.subscription.findFirst({
    where: {
      userId,
      status: 'ACTIVE'
    }
  });

  if (existingSubscription) {
    return null;
  }

  // Get FREE plan
  const freePlan = await prisma.plan.findFirst({
    where: {
      type: 'FREE',
      isActive: true
    }
  });

  if (!freePlan) {
    throw new Error('Ücretsiz plan bulunamadı');
  }

  // Create subscription
  const subscription = await prisma.subscription.create({
    data: {
      userId,
      planId: freePlan.id,
      startDate: new Date(),
      endDate: new Date(Date.now() + freePlan.duration * 24 * 60 * 60 * 1000), // duration in days
      status: 'ACTIVE',
      amount: 0
    },
    include: {
      plan: true
    }
  });

  return subscription;
}

/**
 * Middleware: Check restaurant limit before creation
 */
exports.checkRestaurantLimitMiddleware = async (req, res, next) => {
  try {
    // Auto-assign FREE plan if this is user's first restaurant
    await assignFreePlanIfNeeded(req.user.id);

    const limitCheck = await checkRestaurantLimit(req.user.id);

    if (!limitCheck.allowed) {
      return res.status(403).json({
        success: false,
        message: limitCheck.message,
        data: {
          currentCount: limitCheck.currentCount,
          maxCount: limitCheck.maxCount,
          planName: limitCheck.plan.name,
          planType: limitCheck.plan.type
        }
      });
    }

    // Attach plan info to request for later use
    req.userPlan = limitCheck.plan;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware: Check category limit before creation
 */
exports.checkCategoryLimitMiddleware = async (req, res, next) => {
  try {
    const limitCheck = await checkCategoryLimit(req.user.id, req.body.restaurantId);

    if (!limitCheck.allowed) {
      return res.status(403).json({
        success: false,
        message: limitCheck.message,
        data: {
          currentCount: limitCheck.currentCount,
          maxCount: limitCheck.maxCount,
          planName: limitCheck.plan.name,
          planType: limitCheck.plan.type
        }
      });
    }

    req.userPlan = limitCheck.plan;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware: Check product limit before creation
 */
exports.checkProductLimitMiddleware = async (req, res, next) => {
  try {
    const limitCheck = await checkProductLimit(req.user.id, req.body.restaurantId);

    if (!limitCheck.allowed) {
      return res.status(403).json({
        success: false,
        message: limitCheck.message,
        data: {
          currentCount: limitCheck.currentCount,
          maxCount: limitCheck.maxCount,
          planName: limitCheck.plan.name,
          planType: limitCheck.plan.type
        }
      });
    }

    req.userPlan = limitCheck.plan;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUserPlan,
  checkRestaurantLimit,
  checkCategoryLimit,
  checkProductLimit,
  assignFreePlanIfNeeded,
  checkRestaurantLimitMiddleware: exports.checkRestaurantLimitMiddleware,
  checkCategoryLimitMiddleware: exports.checkCategoryLimitMiddleware,
  checkProductLimitMiddleware: exports.checkProductLimitMiddleware
};
