const prisma = require('../config/database');
const { parsePaginationParams, createPaginatedResponse } = require('../utils/pagination');

/**
 * Tüm kullanıcıları listele (Admin only)
 * Note: restaurants, orders, subscriptions counts are in db-qr; use backend-admin for full aggregation
 */
exports.getAllUsers = async (req, res, next) => {
  try {
    const { page, limit, skip } = parsePaginationParams(req.query);
    const { search, role, status, project } = req.query;

    const where = {};
    if (status === 'active') where.isDeleted = false;
    else if (status === 'passive') where.isDeleted = true;

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { fullName: { contains: search, mode: 'insensitive' } },
        { username: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (role) where.role = role;

    const DEFNEQR_ROLES = ['RESTAURANT_OWNER', 'CASHIER', 'WAITER', 'BARISTA', 'COOK'];
    const DEFNERANDEVU_ROLES = ['BUSINESS_OWNER', 'APPOINTMENT_STAFF'];
    if (project === 'defneqr') where.role = { in: DEFNEQR_ROLES };
    else if (project === 'defnerandevu') where.role = { in: DEFNERANDEVU_ROLES };
    else if (project === 'both') where.role = { in: ['ADMIN', 'STAFF'] };

    const totalCount = await prisma.user.count({ where });

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
        updatedAt: true
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    });

    const DEFNEQR_ROLES_MAP = ['RESTAURANT_OWNER', 'CASHIER', 'WAITER', 'BARISTA', 'COOK'];
    const DEFNERANDEVU_ROLES_MAP = ['BUSINESS_OWNER', 'APPOINTMENT_STAFF'];
    const usersWithProject = users.map((u) => {
      let proj = 'defneqr';
      if (DEFNERANDEVU_ROLES_MAP.includes(u.role) && !DEFNEQR_ROLES_MAP.includes(u.role)) proj = 'defnerandevu';
      else if (DEFNEQR_ROLES_MAP.includes(u.role)) proj = 'defneqr';
      else if (['ADMIN', 'STAFF'].includes(u.role)) proj = 'both';
      return { ...u, project: proj };
    });

    res.json(createPaginatedResponse(usersWithProject, totalCount, { page, limit }));
  } catch (error) {
    next(error);
  }
};

exports.getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: { id, isDeleted: false },
      select: {
        id: true,
        email: true,
        username: true,
        fullName: true,
        role: true,
        googleId: true,
        createdAt: true,
        updatedAt: true
      }
    });
    if (!user) return res.status(404).json({ success: false, message: 'Kullanıcı bulunamadı' });
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

exports.updateUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    const validRoles = ['ADMIN', 'STAFF', 'RESTAURANT_OWNER', 'BUSINESS_OWNER', 'APPOINTMENT_STAFF', 'CASHIER', 'WAITER', 'BARISTA', 'COOK'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ success: false, message: 'Geçersiz rol' });
    }
    const user = await prisma.user.update({
      where: { id },
      data: { role },
      select: { id: true, email: true, username: true, fullName: true, role: true, createdAt: true }
    });
    res.json({ success: true, message: 'Kullanıcı rolü güncellendi', data: user });
  } catch (error) {
    next(error);
  }
};

exports.restoreUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return res.status(404).json({ success: false, message: 'Kullanıcı bulunamadı' });
    if (!user.isDeleted) return res.status(400).json({ success: false, message: 'Kullanıcı zaten aktif' });
    await prisma.user.update({
      where: { id },
      data: { isDeleted: false, deletedAt: null }
    });
    res.json({ success: true, message: 'Kullanıcı aktif edildi' });
  } catch (error) {
    next(error);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (id === req.user.id) return res.status(400).json({ success: false, message: 'Kendi hesabınızı silemezsiniz' });
    await prisma.user.update({
      where: { id },
      data: { isDeleted: true, deletedAt: new Date() }
    });
    res.json({ success: true, message: 'Kullanıcı silindi (pasif)' });
  } catch (error) {
    next(error);
  }
};

/**
 * Hard delete - only removes from db-common. Backend-admin should orchestrate cleanup in db-qr/db-randevu first.
 */
exports.hardDeleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (id === req.user.id) return res.status(400).json({ success: false, message: 'Kendi hesabınızı silemezsiniz' });
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return res.status(404).json({ success: false, message: 'Kullanıcı bulunamadı' });

    await prisma.$transaction(async (tx) => {
      await tx.ticketMessage.deleteMany({ where: { authorId: id } });
      await tx.supportTicket.updateMany({ where: { assignedToId: id }, data: { assignedToId: null } });
      await tx.supportTicket.updateMany({ where: { resolvedById: id }, data: { resolvedById: null } });
      await tx.supportTicket.deleteMany({ where: { userId: id } });
      await tx.passwordReset.deleteMany({ where: { userId: id } });
      await tx.refreshToken.deleteMany({ where: { userId: id } });
      await tx.user.delete({ where: { id } });
    });

    res.json({ success: true, message: 'Kullanıcı kalıcı olarak silindi (db-common). İlişkili QR/Randevu verileri backend-admin ile temizlenmeli.' });
  } catch (error) {
    next(error);
  }
};

exports.getUserStats = async (req, res, next) => {
  try {
    const totalUsers = await prisma.user.count({ where: { isDeleted: false } });
    const usersByRole = await prisma.user.groupBy({
      by: ['role'],
      where: { isDeleted: false },
      _count: true
    });
    const recentUsers = await prisma.user.count({
      where: {
        isDeleted: false,
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      }
    });
    res.json({
      success: true,
      data: { totalUsers, usersByRole, recentUsers }
    });
  } catch (error) {
    next(error);
  }
};
