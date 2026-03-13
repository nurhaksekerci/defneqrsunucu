const prisma = require('../config/database');
const { generateUniqueSlug } = require('../utils/slugify');
const { parsePaginationParams, createPaginatedResponse } = require('../utils/pagination');
const crypto = require('crypto');

async function fetchOwnersFromCommon(ownerIds, authHeader) {
  if (ownerIds.length === 0) return {};
  const commonUrl = process.env.BACKEND_COMMON_URL || 'http://backend-common:5001';
  const url = `${commonUrl}/api/internal/admin/users-by-ids?ids=${ownerIds.join(',')}`;
  try {
    const res = await fetch(url, {
      headers: { Authorization: authHeader || '' }
    });
    if (!res.ok) return {};
    const json = await res.json();
    return json.data || {};
  } catch {
    return {};
  }
}

exports.getAllRestaurants = async (req, res, next) => {
  try {
    const { page, limit, skip } = parsePaginationParams(req.query);
    const { search, ownerId } = req.query;
    const where = { isDeleted: false };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (ownerId) where.ownerId = ownerId;

    const totalCount = await prisma.restaurant.count({ where });
    const restaurants = await prisma.restaurant.findMany({
      where,
      include: {
        _count: { select: { categories: true, products: true, tables: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    const ownerIds = [...new Set(restaurants.map((r) => r.ownerId))];
    const now = new Date();
    const activeSubscriptions = await prisma.subscription.findMany({
      where: { userId: { in: ownerIds }, status: 'ACTIVE', endDate: { gte: now } },
      include: { plan: { select: { id: true, name: true, type: true } } },
      orderBy: { createdAt: 'desc' },
    });
    const subByOwner = {};
    activeSubscriptions.forEach((s) => {
      if (!subByOwner[s.userId]) subByOwner[s.userId] = s;
    });

    // Admin/Staff: enrich with owner (fullName, email) from backend-common
    let ownersById = {};
    if ((req.user?.role === 'ADMIN' || req.user?.role === 'STAFF') && ownerIds.length > 0) {
      const authHeader = req.headers.authorization;
      ownersById = await fetchOwnersFromCommon(ownerIds, authHeader);
    }

    const enriched = restaurants.map((r) => {
      const owner = ownersById[r.ownerId];
      return {
        ...r,
        subscription: subByOwner[r.ownerId] || null,
        owner: owner ? { id: owner.id, fullName: owner.fullName, email: owner.email } : undefined
      };
    });
    res.json(createPaginatedResponse(enriched, totalCount, { page, limit }));
  } catch (error) {
    next(error);
  }
};

exports.getRestaurantById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const restaurant = await prisma.restaurant.findUnique({
      where: { id, isDeleted: false },
    });

    if (!restaurant) {
      return res.status(404).json({ success: false, message: 'Restoran bulunamadı' });
    }

    if (req.user.role !== 'ADMIN' && restaurant.ownerId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Bu restorana erişim yetkiniz yok' });
    }

    res.json({ success: true, data: restaurant });
  } catch (error) {
    next(error);
  }
};

exports.getRestaurantBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const restaurant = await prisma.restaurant.findUnique({
      where: { slug, isDeleted: false },
    });

    if (!restaurant) {
      return res.status(404).json({ success: false, message: 'Restoran bulunamadı' });
    }

    res.json({ success: true, data: restaurant });
  } catch (error) {
    next(error);
  }
};

exports.createRestaurant = async (req, res, next) => {
  try {
    const { name, description, address, phone, logo } = req.body;
    const ownerId = req.user.id;

    const slug = await generateUniqueSlug(name, prisma);

    const restaurant = await prisma.restaurant.create({
      data: { name, slug, description, address, phone, logo, ownerId },
    });

    const restaurantCount = await prisma.restaurant.count({
      where: { ownerId, isDeleted: false },
    });

    if (restaurantCount === 1) {
      try {
        const existingAffiliate = await prisma.affiliatePartner.findUnique({
          where: { userId: ownerId },
        });

        if (!existingAffiliate) {
          let referralCode;
          let isUnique = false;
          while (!isUnique) {
            referralCode = crypto.randomBytes(4).toString('hex').toUpperCase();
            const existing = await prisma.affiliatePartner.findUnique({ where: { referralCode } });
            if (!existing) isUnique = true;
          }
          await prisma.affiliatePartner.create({
            data: { userId: ownerId, referralCode, status: 'ACTIVE' },
          });
        }
      } catch (affiliateError) {
        console.error('Failed to create affiliate partner:', affiliateError);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Restoran başarıyla oluşturuldu',
      data: restaurant,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateRestaurant = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, address, phone, logo } = req.body;

    const existing = await prisma.restaurant.findUnique({
      where: { id, isDeleted: false },
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Restoran bulunamadı' });
    }

    if (req.user.role !== 'ADMIN' && existing.ownerId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Bu işlem için yetkiniz yok' });
    }

    let slug = existing.slug;
    if (name && name !== existing.name) {
      slug = await generateUniqueSlug(name, prisma);
    }

    const updateData = { name: name || existing.name, slug, description, address, phone, logo };
    if (req.body.menuSettings !== undefined) updateData.menuSettings = req.body.menuSettings;

    const restaurant = await prisma.restaurant.update({
      where: { id },
      data: updateData,
    });

    res.json({
      success: true,
      message: 'Restoran başarıyla güncellendi',
      data: restaurant,
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteRestaurant = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.restaurant.findUnique({
      where: { id, isDeleted: false },
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Restoran bulunamadı' });
    }

    if (req.user.role !== 'ADMIN' && existing.ownerId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Bu işlem için yetkiniz yok' });
    }

    await prisma.restaurant.update({
      where: { id },
      data: { isDeleted: true, deletedAt: new Date() },
    });

    res.json({ success: true, message: 'Restoran başarıyla silindi' });
  } catch (error) {
    next(error);
  }
};

exports.getMyRestaurants = async (req, res, next) => {
  try {
    const restaurants = await prisma.restaurant.findMany({
      where: { ownerId: req.user.id, isDeleted: false },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: restaurants });
  } catch (error) {
    next(error);
  }
};

exports.getPublicSlugs = async (req, res, next) => {
  try {
    const restaurants = await prisma.restaurant.findMany({
      where: { isDeleted: false },
      select: { slug: true },
    });
    res.json(restaurants.map((r) => r.slug));
  } catch (error) {
    next(error);
  }
};
