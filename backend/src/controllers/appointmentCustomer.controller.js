const prisma = require('../config/database');

const ensureBusinessAccess = async (userId, businessId) => {
  const business = await prisma.appointmentBusiness.findFirst({
    where: { id: businessId, ownerId: userId, isDeleted: false }
  });
  if (!business) return null;
  return business;
};

exports.getCustomers = async (req, res, next) => {
  try {
    const { id: businessId } = req.params;
    const business = await ensureBusinessAccess(req.user.id, businessId);
    if (!business) {
      return res.status(404).json({ success: false, message: 'İşletme bulunamadı' });
    }
    const customers = await prisma.appointmentCustomer.findMany({
      where: { businessId, isDeleted: false },
      orderBy: { fullName: 'asc' }
    });
    res.json({ success: true, data: customers });
  } catch (error) {
    next(error);
  }
};

exports.createCustomer = async (req, res, next) => {
  try {
    const { id: businessId } = req.params;
    const { fullName, phone, email } = req.body;
    const business = await ensureBusinessAccess(req.user.id, businessId);
    if (!business) {
      return res.status(404).json({ success: false, message: 'İşletme bulunamadı' });
    }
    if (!fullName?.trim() || !phone?.trim()) {
      return res.status(400).json({ success: false, message: 'Ad soyad ve telefon zorunludur' });
    }
    const customer = await prisma.appointmentCustomer.create({
      data: {
        businessId,
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: email?.trim() || null
      }
    });
    res.status(201).json({ success: true, data: customer });
  } catch (error) {
    next(error);
  }
};
