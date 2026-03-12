const prisma = require('../config/database');

const ensureBusinessAccess = async (userId, businessId) => {
  const business = await prisma.appointmentBusiness.findFirst({
    where: { id: businessId, ownerId: userId, isDeleted: false }
  });
  return business;
};

exports.getPackages = async (req, res, next) => {
  try {
    const { id: businessId } = req.params;
    const { customerId, active } = req.query;
    const business = await ensureBusinessAccess(req.user.id, businessId);
    if (!business) {
      return res.status(404).json({ success: false, message: 'İşletme bulunamadı' });
    }
    const where = { businessId, isDeleted: false };
    if (customerId) where.customerId = customerId;
    if (active === 'true') {
      where.remainingSessions = { gt: 0 };
      where.OR = [
        { expiresAt: null },
        { expiresAt: { gte: new Date() } }
      ];
    }
    const packages = await prisma.customerPackage.findMany({
      where,
      include: {
        customer: { select: { id: true, fullName: true, phone: true } },
        service: { select: { id: true, name: true } },
        usages: { select: { id: true, usedAt: true, appointmentId: true } }
      },
      orderBy: { purchasedAt: 'desc' }
    });
    res.json({ success: true, data: packages });
  } catch (error) {
    next(error);
  }
};

exports.createPackage = async (req, res, next) => {
  try {
    const { id: businessId } = req.params;
    const { customerId, serviceId, totalSessions, expiresAt, notes } = req.body;
    const business = await ensureBusinessAccess(req.user.id, businessId);
    if (!business) {
      return res.status(404).json({ success: false, message: 'İşletme bulunamadı' });
    }
    const [customer, service] = await Promise.all([
      prisma.appointmentCustomer.findFirst({ where: { id: customerId, businessId, isDeleted: false } }),
      prisma.appointmentService.findFirst({ where: { id: serviceId, businessId, isDeleted: false } })
    ]);
    if (!customer) return res.status(400).json({ success: false, message: 'Müşteri bulunamadı' });
    if (!service) return res.status(400).json({ success: false, message: 'Hizmet bulunamadı' });
    const sessions = parseInt(totalSessions, 10);
    if (!sessions || sessions < 1) {
      return res.status(400).json({ success: false, message: 'Geçerli seans sayısı girin' });
    }
    const pkg = await prisma.customerPackage.create({
      data: {
        businessId,
        customerId,
        serviceId,
        totalSessions: sessions,
        remainingSessions: sessions,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        notes: (notes || '').trim() || null
      },
      include: {
        customer: { select: { id: true, fullName: true, phone: true } },
        service: { select: { id: true, name: true } }
      }
    });
    res.status(201).json({ success: true, data: pkg });
  } catch (error) {
    next(error);
  }
};

exports.updatePackage = async (req, res, next) => {
  try {
    const { id: businessId, packageId } = req.params;
    const { remainingSessions, expiresAt, notes } = req.body;
    const business = await ensureBusinessAccess(req.user.id, businessId);
    if (!business) {
      return res.status(404).json({ success: false, message: 'İşletme bulunamadı' });
    }
    const existing = await prisma.customerPackage.findFirst({
      where: { id: packageId, businessId, isDeleted: false }
    });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Paket bulunamadı' });
    }
    const data = {};
    if (remainingSessions !== undefined) {
      const remaining = parseInt(remainingSessions, 10);
      if (remaining >= 0 && remaining <= existing.totalSessions) data.remainingSessions = remaining;
    }
    if (expiresAt !== undefined) data.expiresAt = expiresAt ? new Date(expiresAt) : null;
    if (notes !== undefined) data.notes = (notes || '').trim() || null;
    const pkg = await prisma.customerPackage.update({
      where: { id: packageId },
      data,
      include: {
        customer: { select: { id: true, fullName: true, phone: true } },
        service: { select: { id: true, name: true } },
        usages: true
      }
    });
    res.json({ success: true, data: pkg });
  } catch (error) {
    next(error);
  }
};

exports.deletePackage = async (req, res, next) => {
  try {
    const { id: businessId, packageId } = req.params;
    const business = await ensureBusinessAccess(req.user.id, businessId);
    if (!business) {
      return res.status(404).json({ success: false, message: 'İşletme bulunamadı' });
    }
    const existing = await prisma.customerPackage.findFirst({
      where: { id: packageId, businessId, isDeleted: false }
    });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Paket bulunamadı' });
    }
    await prisma.customerPackage.update({
      where: { id: packageId },
      data: { isDeleted: true, deletedAt: new Date() }
    });
    res.json({ success: true, message: 'Silindi' });
  } catch (error) {
    next(error);
  }
};

// Müşterinin belirli hizmet için kullanılabilir paketleri
exports.getPackagesForCustomer = async (req, res, next) => {
  try {
    const { id: businessId } = req.params;
    const { customerId, serviceId } = req.query;
    const business = await ensureBusinessAccess(req.user.id, businessId);
    if (!business) {
      return res.status(404).json({ success: false, message: 'İşletme bulunamadı' });
    }
    const where = { businessId, isDeleted: false, remainingSessions: { gt: 0 } };
    if (customerId) where.customerId = customerId;
    if (serviceId) where.serviceId = serviceId;
    where.OR = [
      { expiresAt: null },
      { expiresAt: { gte: new Date() } }
    ];
    const packages = await prisma.customerPackage.findMany({
      where,
      include: {
        customer: { select: { id: true, fullName: true, phone: true } },
        service: { select: { id: true, name: true } }
      },
      orderBy: { expiresAt: 'asc' }
    });
    res.json({ success: true, data: packages });
  } catch (error) {
    next(error);
  }
};

// Yaklaşan bitiş / az kalan paketler (uyarı için)
exports.getExpiringPackages = async (req, res, next) => {
  try {
    const { id: businessId } = req.params;
    const { days = 7 } = req.query;
    const business = await ensureBusinessAccess(req.user.id, businessId);
    if (!business) {
      return res.status(404).json({ success: false, message: 'İşletme bulunamadı' });
    }
    const daysNum = Math.min(Math.max(parseInt(days, 10) || 7, 1), 30);
    const future = new Date();
    future.setDate(future.getDate() + daysNum);
    const packages = await prisma.customerPackage.findMany({
      where: {
        businessId,
        isDeleted: false,
        remainingSessions: { gt: 0 },
        expiresAt: { lte: future, gte: new Date() }
      },
      include: {
        customer: { select: { id: true, fullName: true, phone: true } },
        service: { select: { id: true, name: true } }
      },
      orderBy: { expiresAt: 'asc' }
    });
    res.json({ success: true, data: packages });
  } catch (error) {
    next(error);
  }
};
