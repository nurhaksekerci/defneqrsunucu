const prisma = require('../config/database');

async function getUserPlan(userId) {
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
    return prisma.plan.findFirst({
      where: { type: 'FREE', isActive: true },
    });
  }

  return subscription.plan;
}

async function checkRestaurantLimit(userId) {
  const plan = await getUserPlan(userId);
  if (!plan) return { allowed: true, plan: null, currentCount: 0, maxCount: 999, message: '' };

  const restaurantCount = await prisma.restaurant.count({
    where: { ownerId: userId, isDeleted: false },
  });

  if (restaurantCount >= plan.maxRestaurants) {
    return {
      allowed: false,
      plan,
      currentCount: restaurantCount,
      maxCount: plan.maxRestaurants,
      message: `Plan limitinize ulaştınız. Maksimum ${plan.maxRestaurants} işletme oluşturabilirsiniz.`,
    };
  }

  return { allowed: true, plan, currentCount: restaurantCount, maxCount: plan.maxRestaurants };
}

async function checkCategoryLimit(userId) {
  const plan = await getUserPlan(userId);
  if (!plan) return { allowed: true, plan: null, currentCount: 0, maxCount: 999, message: '' };

  const categoryCount = await prisma.category.count({
    where: {
      isDeleted: false,
      isGlobal: false,
      restaurant: { ownerId: userId, isDeleted: false },
    },
  });

  if (categoryCount >= plan.maxCategories) {
    return {
      allowed: false,
      plan,
      currentCount: categoryCount,
      maxCount: plan.maxCategories,
      message: `Plan limitinize ulaştınız. Maksimum ${plan.maxCategories} kategori oluşturabilirsiniz.`,
    };
  }

  return { allowed: true, plan, currentCount: categoryCount, maxCount: plan.maxCategories };
}

async function checkProductLimit(userId) {
  const plan = await getUserPlan(userId);
  if (!plan) return { allowed: true, plan: null, currentCount: 0, maxCount: 999, message: '' };

  const productCount = await prisma.product.count({
    where: {
      isDeleted: false,
      isGlobal: false,
      restaurant: { ownerId: userId, isDeleted: false },
    },
  });

  if (productCount >= plan.maxProducts) {
    return {
      allowed: false,
      plan,
      currentCount: productCount,
      maxCount: plan.maxProducts,
      message: `Plan limitinize ulaştınız. Maksimum ${plan.maxProducts} ürün oluşturabilirsiniz.`,
    };
  }

  return { allowed: true, plan, currentCount: productCount, maxCount: plan.maxProducts };
}

const checkRestaurantLimitMiddleware = async (req, res, next) => {
  try {
    const limitCheck = await checkRestaurantLimit(req.user.id);
    if (!limitCheck.allowed) {
      return res.status(403).json({ success: false, message: limitCheck.message });
    }
    req.userPlan = limitCheck.plan;
    next();
  } catch (error) {
    next(error);
  }
};

const checkCategoryLimitMiddleware = async (req, res, next) => {
  try {
    const limitCheck = await checkCategoryLimit(req.user.id);
    if (!limitCheck.allowed) {
      return res.status(403).json({ success: false, message: limitCheck.message });
    }
    req.userPlan = limitCheck.plan;
    next();
  } catch (error) {
    next(error);
  }
};

const checkProductLimitMiddleware = async (req, res, next) => {
  try {
    const limitCheck = await checkProductLimit(req.user.id);
    if (!limitCheck.allowed) {
      return res.status(403).json({ success: false, message: limitCheck.message });
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
  checkRestaurantLimitMiddleware,
  checkCategoryLimitMiddleware,
  checkProductLimitMiddleware,
};
