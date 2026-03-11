const prisma = require('../config/database');
const { generateUniqueBusinessSlug } = require('../utils/businessSlugify');
const logger = require('../utils/logger');

// Kullanıcının işletmelerini listele
exports.getMyBusinesses = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const businesses = await prisma.appointmentBusiness.findMany({
      where: { ownerId: userId, isDeleted: false },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { staff: true, services: true, customers: true }
        }
      }
    });
    res.json({ success: true, data: businesses });
  } catch (error) {
    next(error);
  }
};

// İşletme detayı
exports.getBusinessById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const business = await prisma.appointmentBusiness.findFirst({
      where: { id, ownerId: userId, isDeleted: false },
      include: {
        staff: { where: { isDeleted: false } },
        services: { where: { isDeleted: false } },
        _count: { select: { customers: true, appointments: true } }
      }
    });

    if (!business) {
      return res.status(404).json({ success: false, message: 'İşletme bulunamadı' });
    }

    res.json({ success: true, data: business });
  } catch (error) {
    next(error);
  }
};

// Slug ile işletme (public - randevu alma sayfası için)
exports.getBusinessBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;

    const business = await prisma.appointmentBusiness.findFirst({
      where: { slug, isDeleted: false },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        address: true,
        phone: true,
        logo: true,
        staff: {
          where: { isActive: true, isDeleted: false },
          select: { id: true, fullName: true, specialty: true, color: true }
        },
        services: {
          where: { isDeleted: false },
          select: { id: true, name: true, duration: true, price: true }
        }
      }
    });

    if (!business) {
      return res.status(404).json({ success: false, message: 'İşletme bulunamadı' });
    }

    res.json({ success: true, data: business });
  } catch (error) {
    next(error);
  }
};

// Yeni işletme oluştur (hesap başına 1 işletme)
exports.createBusiness = async (req, res, next) => {
  try {
    const { name, description, address, phone } = req.body;
    const userId = req.user.id;

    const existingCount = await prisma.appointmentBusiness.count({
      where: { ownerId: userId, isDeleted: false }
    });
    if (existingCount >= 1) {
      return res.status(400).json({
        success: false,
        message: 'Her hesap için yalnızca bir işletme eklenebilir.'
      });
    }

    const slug = await generateUniqueBusinessSlug(name, prisma);

    const business = await prisma.appointmentBusiness.create({
      data: {
        name: name.trim(),
        slug,
        description: description?.trim() || null,
        address: address?.trim() || null,
        phone: phone?.trim() || null,
        ownerId: userId
      }
    });

    logger.info('DefneRandevu işletme oluşturuldu', { businessId: business.id, userId });

    res.status(201).json({ success: true, data: business });
  } catch (error) {
    next(error);
  }
};

// İşletme güncelle
exports.updateBusiness = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, address, phone, logo } = req.body;
    const userId = req.user.id;

    const existing = await prisma.appointmentBusiness.findFirst({
      where: { id, ownerId: userId, isDeleted: false }
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'İşletme bulunamadı' });
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (address !== undefined) updateData.address = address?.trim() || null;
    if (phone !== undefined) updateData.phone = phone?.trim() || null;
    if (logo !== undefined) updateData.logo = logo;

    if (name && name !== existing.name) {
      updateData.slug = await generateUniqueBusinessSlug(name, prisma);
    }

    const business = await prisma.appointmentBusiness.update({
      where: { id },
      data: updateData
    });

    res.json({ success: true, data: business });
  } catch (error) {
    next(error);
  }
};

// İşletme sil (soft delete)
exports.deleteBusiness = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const existing = await prisma.appointmentBusiness.findFirst({
      where: { id, ownerId: userId, isDeleted: false }
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'İşletme bulunamadı' });
    }

    await prisma.appointmentBusiness.update({
      where: { id },
      data: { isDeleted: true, deletedAt: new Date() }
    });

    res.json({ success: true, message: 'İşletme silindi' });
  } catch (error) {
    next(error);
  }
};
