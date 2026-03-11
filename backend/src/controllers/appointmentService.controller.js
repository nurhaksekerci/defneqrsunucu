const prisma = require('../config/database');

const ensureBusinessAccess = async (userId, businessId) => {
  const business = await prisma.appointmentBusiness.findFirst({
    where: { id: businessId, ownerId: userId, isDeleted: false }
  });
  if (!business) return null;
  return business;
};

exports.getServices = async (req, res, next) => {
  try {
    const { id: businessId } = req.params;
    const business = await ensureBusinessAccess(req.user.id, businessId);
    if (!business) {
      return res.status(404).json({ success: false, message: 'İşletme bulunamadı' });
    }
    const services = await prisma.appointmentService.findMany({
      where: { businessId, isDeleted: false },
      orderBy: { name: 'asc' }
    });
    res.json({ success: true, data: services });
  } catch (error) {
    next(error);
  }
};

exports.createService = async (req, res, next) => {
  try {
    const { id: businessId } = req.params;
    const { name, duration, price, description } = req.body;
    const business = await ensureBusinessAccess(req.user.id, businessId);
    if (!business) {
      return res.status(404).json({ success: false, message: 'İşletme bulunamadı' });
    }
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Hizmet adı zorunludur' });
    }
    const durationNum = parseInt(duration, 10) || 30;
    const priceNum = parseFloat(price) || 0;
    const service = await prisma.appointmentService.create({
      data: {
        businessId,
        name: name.trim(),
        duration: Math.max(1, durationNum),
        price: priceNum,
        description: description?.trim() || null
      }
    });
    res.status(201).json({ success: true, data: service });
  } catch (error) {
    next(error);
  }
};

exports.updateService = async (req, res, next) => {
  try {
    const { id: businessId, serviceId } = req.params;
    const { name, duration, price, description } = req.body;
    const business = await ensureBusinessAccess(req.user.id, businessId);
    if (!business) {
      return res.status(404).json({ success: false, message: 'İşletme bulunamadı' });
    }
    const existing = await prisma.appointmentService.findFirst({
      where: { id: serviceId, businessId, isDeleted: false }
    });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Hizmet bulunamadı' });
    }
    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (duration !== undefined) updateData.duration = Math.max(1, parseInt(duration, 10) || 30);
    if (price !== undefined) updateData.price = parseFloat(price) || 0;
    if (description !== undefined) updateData.description = description?.trim() || null;
    const service = await prisma.appointmentService.update({
      where: { id: serviceId },
      data: updateData
    });
    res.json({ success: true, data: service });
  } catch (error) {
    next(error);
  }
};

exports.deleteService = async (req, res, next) => {
  try {
    const { id: businessId, serviceId } = req.params;
    const business = await ensureBusinessAccess(req.user.id, businessId);
    if (!business) {
      return res.status(404).json({ success: false, message: 'İşletme bulunamadı' });
    }
    const existing = await prisma.appointmentService.findFirst({
      where: { id: serviceId, businessId, isDeleted: false }
    });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Hizmet bulunamadı' });
    }
    await prisma.appointmentService.update({
      where: { id: serviceId },
      data: { isDeleted: true, deletedAt: new Date() }
    });
    res.json({ success: true, message: 'Hizmet silindi' });
  } catch (error) {
    next(error);
  }
};
