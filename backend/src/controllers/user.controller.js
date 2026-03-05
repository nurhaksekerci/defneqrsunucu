const prisma = require('../config/database');
const { parsePaginationParams, createPaginatedResponse } = require('../utils/pagination');

/**
 * Tüm kullanıcıları listele (Admin only - aktif ve pasif)
 */
exports.getAllUsers = async (req, res, next) => {
  try {
    const { page, limit, skip } = parsePaginationParams(req.query);
    const { search, role, status } = req.query;

    const where = {};

    // status: all | active | passive (deleted)
    if (status === 'active') {
      where.isDeleted = false;
    } else if (status === 'passive') {
      where.isDeleted = true;
    }

    // Search filter
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { fullName: { contains: search, mode: 'insensitive' } },
        { username: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Role filter
    if (role) {
      where.role = role;
    }

    // Get total count for pagination
    const totalCount = await prisma.user.count({ where });

    // Get paginated users
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        username: true,
        fullName: true,
        role: true,
        googleId: true,
        isDeleted: true,
        deletedAt: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            restaurants: true,
            orders: true,
            payments: true
          }
        },
        subscriptions: {
          where: {
            status: 'ACTIVE',
            endDate: {
              gte: new Date()
            }
          },
          select: {
            id: true,
            startDate: true,
            endDate: true,
            status: true,
            plan: {
              select: {
                id: true,
                name: true,
                type: true,
                maxRestaurants: true,
                maxCategories: true,
                maxProducts: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: limit
    });

    res.json(createPaginatedResponse(users, totalCount, { page, limit }));
  } catch (error) {
    next(error);
  }
};

/**
 * Kullanıcı detayı (Admin only)
 */
exports.getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: {
        id,
        isDeleted: false
      },
      select: {
        id: true,
        email: true,
        username: true,
        fullName: true,
        role: true,
        googleId: true,
        createdAt: true,
        updatedAt: true,
        restaurants: {
          where: { isDeleted: false },
          select: {
            id: true,
            name: true,
            slug: true,
            phone: true,
            address: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Kullanıcı bulunamadı'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Kullanıcı rolü güncelle (Admin only)
 */
exports.updateUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    // Geçerli rol kontrolü
    const validRoles = ['ADMIN', 'STAFF', 'RESTAURANT_OWNER', 'CASHIER', 'WAITER', 'BARISTA', 'COOK'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz rol'
      });
    }

    // Kullanıcıyı güncelle
    const user = await prisma.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        email: true,
        username: true,
        fullName: true,
        role: true,
        createdAt: true
      }
    });

    res.json({
      success: true,
      message: 'Kullanıcı rolü güncellendi',
      data: user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Kullanıcıyı aktif et - Soft delete geri al (Admin only)
 */
exports.restoreUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Kullanıcı bulunamadı'
      });
    }

    if (!user.isDeleted) {
      return res.status(400).json({
        success: false,
        message: 'Kullanıcı zaten aktif'
      });
    }

    await prisma.user.update({
      where: { id },
      data: {
        isDeleted: false,
        deletedAt: null
      }
    });

    res.json({
      success: true,
      message: 'Kullanıcı aktif edildi'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Kullanıcı sil - Soft delete (Admin only)
 */
exports.deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Kendi hesabınızı silemezsiniz'
      });
    }

    await prisma.user.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date()
      }
    });

    res.json({
      success: true,
      message: 'Kullanıcı silindi (pasif)'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Kullanıcı kalıcı sil (Hard delete - Admin only)
 * Kullanıcıya ait tüm kayıtlar (restoranlar, siparişler vb.) silinir
 */
exports.hardDeleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Kendi hesabınızı silemezsiniz'
      });
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Kullanıcı bulunamadı'
      });
    }

    await prisma.$transaction(async (tx) => {
      const restaurants = await tx.restaurant.findMany({
        where: { ownerId: id },
        select: { id: true }
      });
      const restaurantIds = restaurants.map((r) => r.id);

      for (const rid of restaurantIds) {
        const orders = await tx.order.findMany({ where: { restaurantId: rid }, select: { id: true } });
        const orderIds = orders.map((o) => o.id);

        for (const oid of orderIds) {
          await tx.orderItem.deleteMany({ where: { orderId: oid } });
          await tx.payment.updateMany({ where: { orderId: oid }, data: { cashierId: null } });
          await tx.payment.deleteMany({ where: { orderId: oid } });
        }
        await tx.order.deleteMany({ where: { restaurantId: rid } });
        await tx.stock.deleteMany({ where: { restaurantId: rid } });
        await tx.product.deleteMany({ where: { restaurantId: rid } });
        await tx.category.deleteMany({ where: { restaurantId: rid } });
        await tx.table.deleteMany({ where: { restaurantId: rid } });
        await tx.menuScan.deleteMany({ where: { restaurantId: rid } });
        await tx.supportTicket.deleteMany({ where: { restaurantId: rid } });
      }
      await tx.restaurant.deleteMany({ where: { ownerId: id } });

      await tx.order.updateMany({ where: { waiterId: id }, data: { waiterId: null } });
      await tx.payment.updateMany({ where: { cashierId: id }, data: { cashierId: null } });
      await tx.promoCodeUsage.deleteMany({ where: { userId: id } });
      await tx.subscription.deleteMany({ where: { userId: id } });
      await tx.passwordReset.deleteMany({ where: { userId: id } });
      await tx.refreshToken.deleteMany({ where: { userId: id } });
      await tx.wheelSpin.deleteMany({ where: { userId: id } });

      const affiliate = await tx.affiliatePartner.findUnique({ where: { userId: id } });
      if (affiliate) {
        await tx.affiliateCommission.deleteMany({ where: { affiliateId: affiliate.id } });
        await tx.affiliatePayout.deleteMany({ where: { affiliateId: affiliate.id } });
        await tx.referral.deleteMany({ where: { affiliateId: affiliate.id } });
        await tx.referral.deleteMany({ where: { referredUserId: id } });
        await tx.affiliatePartner.delete({ where: { id: affiliate.id } });
      } else {
        await tx.referral.deleteMany({ where: { referredUserId: id } });
      }

      await tx.supportTicket.updateMany({ where: { assignedToId: id }, data: { assignedToId: null } });
      await tx.supportTicket.updateMany({ where: { resolvedById: id }, data: { resolvedById: null } });
      await tx.supportTicket.deleteMany({ where: { userId: id } });
      await tx.ticketMessage.deleteMany({ where: { authorId: id } });

      await tx.user.delete({ where: { id } });
    });

    res.json({
      success: true,
      message: 'Kullanıcı ve tüm ilişkili kayıtlar kalıcı olarak silindi'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Kullanıcı istatistikleri (Admin only)
 */
exports.getUserStats = async (req, res, next) => {
  try {
    const totalUsers = await prisma.user.count({
      where: { isDeleted: false }
    });

    const usersByRole = await prisma.user.groupBy({
      by: ['role'],
      where: { isDeleted: false },
      _count: true
    });

    const recentUsers = await prisma.user.count({
      where: {
        isDeleted: false,
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Son 30 gün
        }
      }
    });

    res.json({
      success: true,
      data: {
        totalUsers,
        usersByRole,
        recentUsers
      }
    });
  } catch (error) {
    next(error);
  }
};
