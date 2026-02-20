const prisma = require('../config/database');
const { parsePaginationParams, createPaginatedResponse } = require('../utils/pagination');

/**
 * Tüm kullanıcıları listele (Admin only)
 */
exports.getAllUsers = async (req, res, next) => {
  try {
    const { page, limit, skip } = parsePaginationParams(req.query);
    const { search, role } = req.query;

    const where = {
      isDeleted: false
    };

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
 * Kullanıcı sil (Soft delete - Admin only)
 */
exports.deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Kendi hesabını silmeye çalışıyor mu?
    if (id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Kendi hesabınızı silemezsiniz'
      });
    }

    // Soft delete
    await prisma.user.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date()
      }
    });

    res.json({
      success: true,
      message: 'Kullanıcı silindi'
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
