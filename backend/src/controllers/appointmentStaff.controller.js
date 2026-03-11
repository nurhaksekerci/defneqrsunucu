const prisma = require('../config/database');

const ensureBusinessAccess = async (userId, businessId) => {
  const business = await prisma.appointmentBusiness.findFirst({
    where: { id: businessId, ownerId: userId, isDeleted: false }
  });
  if (!business) return null;
  return business;
};

exports.getStaff = async (req, res, next) => {
  try {
    const { id: businessId } = req.params;
    const business = await ensureBusinessAccess(req.user.id, businessId);
    if (!business) {
      return res.status(404).json({ success: false, message: 'İşletme bulunamadı' });
    }
    const staff = await prisma.appointmentStaff.findMany({
      where: { businessId, isDeleted: false },
      orderBy: { fullName: 'asc' }
    });
    res.json({ success: true, data: staff });
  } catch (error) {
    next(error);
  }
};

exports.createStaff = async (req, res, next) => {
  try {
    const { id: businessId } = req.params;
    const { fullName, phone, specialty, color, notes } = req.body;
    const business = await ensureBusinessAccess(req.user.id, businessId);
    if (!business) {
      return res.status(404).json({ success: false, message: 'İşletme bulunamadı' });
    }
    if (!fullName || !fullName.trim()) {
      return res.status(400).json({ success: false, message: 'Personel adı zorunludur' });
    }
    const staff = await prisma.appointmentStaff.create({
      data: {
        businessId,
        fullName: fullName.trim(),
        phone: phone?.trim() || null,
        specialty: specialty?.trim() || null,
        color: color?.trim() || null,
        notes: notes?.trim() || null
      }
    });
    res.status(201).json({ success: true, data: staff });
  } catch (error) {
    next(error);
  }
};

exports.updateStaff = async (req, res, next) => {
  try {
    const { id: businessId, staffId } = req.params;
    const { fullName, phone, specialty, color, notes, isActive } = req.body;
    const business = await ensureBusinessAccess(req.user.id, businessId);
    if (!business) {
      return res.status(404).json({ success: false, message: 'İşletme bulunamadı' });
    }
    const existing = await prisma.appointmentStaff.findFirst({
      where: { id: staffId, businessId, isDeleted: false }
    });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Personel bulunamadı' });
    }
    const updateData = {};
    if (fullName !== undefined) updateData.fullName = fullName.trim();
    if (phone !== undefined) updateData.phone = phone?.trim() || null;
    if (specialty !== undefined) updateData.specialty = specialty?.trim() || null;
    if (color !== undefined) updateData.color = color?.trim() || null;
    if (notes !== undefined) updateData.notes = notes?.trim() || null;
    if (isActive !== undefined) updateData.isActive = !!isActive;
    const staff = await prisma.appointmentStaff.update({
      where: { id: staffId },
      data: updateData
    });
    res.json({ success: true, data: staff });
  } catch (error) {
    next(error);
  }
};

exports.deleteStaff = async (req, res, next) => {
  try {
    const { id: businessId, staffId } = req.params;
    const business = await ensureBusinessAccess(req.user.id, businessId);
    if (!business) {
      return res.status(404).json({ success: false, message: 'İşletme bulunamadı' });
    }
    const existing = await prisma.appointmentStaff.findFirst({
      where: { id: staffId, businessId, isDeleted: false }
    });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Personel bulunamadı' });
    }
    await prisma.appointmentStaff.update({
      where: { id: staffId },
      data: { isDeleted: true, deletedAt: new Date() }
    });
    res.json({ success: true, message: 'Personel silindi' });
  } catch (error) {
    next(error);
  }
};
