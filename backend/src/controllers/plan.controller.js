const prisma = require('../config/database');

// Tüm planları listele
exports.getAllPlans = async (req, res, next) => {
  try {
    const plans = await prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { price: 'asc' }
    });

    res.json({
      success: true,
      data: plans
    });
  } catch (error) {
    next(error);
  }
};

// Plan detayı
exports.getPlanById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const plan = await prisma.plan.findUnique({
      where: { id }
    });

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan bulunamadı'
      });
    }

    res.json({
      success: true,
      data: plan
    });
  } catch (error) {
    next(error);
  }
};

// Plan oluştur (Admin only)
exports.createPlan = async (req, res, next) => {
  try {
    const {
      name,
      type,
      price,
      duration,
      maxRestaurants,
      maxCategories,
      maxProducts,
      canRemoveBranding,
      hasGlobalCatalog,
      hasDetailedReports,
      isPopular,
      extraRestaurantPrice,
      description,
      features
    } = req.body;

    const plan = await prisma.plan.create({
      data: {
        name,
        type,
        price: price || 0,
        duration: duration || 365,
        maxRestaurants: maxRestaurants || 1,
        maxCategories: maxCategories || 5,
        maxProducts: maxProducts || 20,
        canRemoveBranding: canRemoveBranding || false,
        hasGlobalCatalog: hasGlobalCatalog !== false,
        hasDetailedReports: hasDetailedReports !== false,
        isPopular: isPopular || false,
        extraRestaurantPrice: extraRestaurantPrice || 0,
        description,
        features
      }
    });

    res.status(201).json({
      success: true,
      message: 'Plan başarıyla oluşturuldu',
      data: plan
    });
  } catch (error) {
    next(error);
  }
};

// Plan güncelle (Admin only)
exports.updatePlan = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const plan = await prisma.plan.update({
      where: { id },
      data: updateData
    });

    res.json({
      success: true,
      message: 'Plan başarıyla güncellendi',
      data: plan
    });
  } catch (error) {
    next(error);
  }
};

// Plan sil (Admin only)
exports.deletePlan = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Plan ile ilişkili aktif abonelik var mı kontrol et
    const activeSubscriptions = await prisma.subscription.count({
      where: {
        planId: id,
        status: 'ACTIVE'
      }
    });

    if (activeSubscriptions > 0) {
      return res.status(400).json({
        success: false,
        message: 'Bu plana aktif abonelikler var, silinemez'
      });
    }

    // Soft delete
    await prisma.plan.update({
      where: { id },
      data: { isActive: false }
    });

    res.json({
      success: true,
      message: 'Plan başarıyla silindi'
    });
  } catch (error) {
    next(error);
  }
};

// Default planları oluştur
exports.seedPlans = async (req, res, next) => {
  try {
    // Mevcut planları kontrol et
    const existingPlans = await prisma.plan.count();
    
    if (existingPlans > 0) {
      return res.json({
        success: true,
        message: 'Planlar zaten mevcut'
      });
    }

    // Default planları oluştur
    const plans = await prisma.plan.createMany({
      data: [
        {
          name: 'Ücretsiz',
          type: 'FREE',
          price: 0,
          duration: 365,
          maxRestaurants: 1,
          maxCategories: 5,
          maxProducts: 20,
          canRemoveBranding: false,
          hasGlobalCatalog: true,
          hasDetailedReports: true,
          isPopular: false,
          extraRestaurantPrice: 0,
          description: 'Küçük işletmeler için',
          features: JSON.stringify([
            '1 İşletme',
            '5 Kategori',
            '20 Ürün',
            'Global Katalog',
            'Detaylı Grafikler'
          ])
        },
        {
          name: 'Premium',
          type: 'PREMIUM',
          price: 2000,
          duration: 365,
          maxRestaurants: 1,
          maxCategories: 999999,
          maxProducts: 999999,
          canRemoveBranding: true,
          hasGlobalCatalog: true,
          hasDetailedReports: true,
          isPopular: true,
          extraRestaurantPrice: 0,
          description: 'Profesyonel işletmeler için',
          features: JSON.stringify([
            '1 İşletme',
            'Sınırsız Kategori',
            'Sınırsız Ürün',
            'Powered by kaldırma',
            'Global Katalog',
            'Detaylı Grafikler'
          ])
        },
        {
          name: 'Kurumsal',
          type: 'CUSTOM',
          price: 2000,
          duration: 365,
          maxRestaurants: 999999,
          maxCategories: 999999,
          maxProducts: 999999,
          canRemoveBranding: true,
          hasGlobalCatalog: true,
          hasDetailedReports: true,
          isPopular: false,
          extraRestaurantPrice: 1000,
          description: 'Çoklu şube işletmeleri için',
          features: JSON.stringify([
            'Çoklu İşletme (özelleştirilebilir)',
            'Sınırsız Kategori',
            'Sınırsız Ürün',
            'Powered by kaldırma',
            'Global Katalog',
            'Detaylı Grafikler'
          ])
        }
      ]
    });

    res.json({
      success: true,
      message: 'Default planlar oluşturuldu',
      data: plans
    });
  } catch (error) {
    next(error);
  }
};
