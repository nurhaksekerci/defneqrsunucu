const prisma = require('../config/database');
const { generateUniqueSlug } = require('../utils/slugify');
const { parsePaginationParams, createPaginatedResponse } = require('../utils/pagination');

// Tüm restoranları listele (Admin için)
exports.getAllRestaurants = async (req, res, next) => {
  try {
    const { page, limit, skip } = parsePaginationParams(req.query);
    const { search, ownerId } = req.query;

    const where = { isDeleted: false };

    // Search filter
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Owner filter
    if (ownerId) {
      where.ownerId = ownerId;
    }

    // Get total count
    const totalCount = await prisma.restaurant.count({ where });

    // Get paginated restaurants
    const restaurants = await prisma.restaurant.findMany({
      where,
      include: {
        owner: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        },
        _count: {
          select: {
            categories: true,
            products: true,
            tables: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    });

    res.json(createPaginatedResponse(restaurants, totalCount, { page, limit }));
  } catch (error) {
    next(error);
  }
};

// ID ile restoran detayı
exports.getRestaurantById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const restaurant = await prisma.restaurant.findUnique({
      where: { id, isDeleted: false },
      include: {
        owner: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        }
      }
    });

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restoran bulunamadı'
      });
    }

    // Yetki kontrolü (sadece sahibi veya admin görebilir)
    if (req.user.role !== 'ADMIN' && restaurant.ownerId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Bu restorana erişim yetkiniz yok'
      });
    }

    res.json({
      success: true,
      data: restaurant
    });
  } catch (error) {
    next(error);
  }
};

// Slug ile restoran detayı
exports.getRestaurantBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;

    const restaurant = await prisma.restaurant.findUnique({
      where: { slug, isDeleted: false },
      include: {
        owner: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        }
      }
    });

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restoran bulunamadı'
      });
    }

    res.json({
      success: true,
      data: restaurant
    });
  } catch (error) {
    next(error);
  }
};

// Restoran oluştur
exports.createRestaurant = async (req, res, next) => {
  try {
    const { name, description, address, phone, logo } = req.body;
    const ownerId = req.user.id;

    // Slug oluştur
    const slug = await generateUniqueSlug(name, prisma);

    const restaurant = await prisma.restaurant.create({
      data: {
        name,
        slug,
        description,
        address,
        phone,
        logo,
        ownerId
      },
      include: {
        owner: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Restoran başarıyla oluşturuldu',
      data: restaurant
    });
  } catch (error) {
    next(error);
  }
};

// Restoran güncelle
exports.updateRestaurant = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, address, phone, logo } = req.body;

    // Restoran kontrolü
    const existing = await prisma.restaurant.findUnique({
      where: { id, isDeleted: false }
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Restoran bulunamadı'
      });
    }

    // Yetki kontrolü (sadece sahibi veya admin)
    if (req.user.role !== 'ADMIN' && existing.ownerId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Bu işlem için yetkiniz yok'
      });
    }

    // Slug güncelleme gerekli mi?
    let slug = existing.slug;
    if (name && name !== existing.name) {
      slug = await generateUniqueSlug(name, prisma);
    }

    const updateData = {
      name: name || existing.name,
      slug,
      description,
      address,
      phone,
      logo
    };

    // menuSettings varsa ekle
    if (req.body.menuSettings !== undefined) {
      updateData.menuSettings = req.body.menuSettings;
    }

    const restaurant = await prisma.restaurant.update({
      where: { id },
      data: updateData
    });

    res.json({
      success: true,
      message: 'Restoran başarıyla güncellendi',
      data: restaurant
    });
  } catch (error) {
    next(error);
  }
};

// Restoran sil (Soft delete)
exports.deleteRestaurant = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Restoran kontrolü
    const existing = await prisma.restaurant.findUnique({
      where: { id, isDeleted: false }
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Restoran bulunamadı'
      });
    }

    // Yetki kontrolü
    if (req.user.role !== 'ADMIN' && existing.ownerId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Bu işlem için yetkiniz yok'
      });
    }

    await prisma.restaurant.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date()
      }
    });

    res.json({
      success: true,
      message: 'Restoran başarıyla silindi'
    });
  } catch (error) {
    next(error);
  }
};

// Kullanıcının restoranlarını listele
exports.getMyRestaurants = async (req, res, next) => {
  try {
    const restaurants = await prisma.restaurant.findMany({
      where: {
        ownerId: req.user.id,
        isDeleted: false
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: restaurants
    });
  } catch (error) {
    next(error);
  }
};

// Get public restaurant slugs for sitemap (SEO)
exports.getPublicSlugs = async (req, res, next) => {
  try {
    const restaurants = await prisma.restaurant.findMany({
      where: {
        isDeleted: false,
      },
      select: {
        slug: true,
      },
    });

    const slugs = restaurants.map(r => r.slug);
    res.json(slugs);
  } catch (error) {
    next(error);
  }
};
