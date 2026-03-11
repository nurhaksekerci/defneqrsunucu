const prisma = require('../config/database');

const ensureBusinessAccess = async (userId, businessId) => {
  const business = await prisma.appointmentBusiness.findFirst({
    where: { id: businessId, ownerId: userId, isDeleted: false }
  });
  return business;
};

exports.getSmsLogs = async (req, res, next) => {
  try {
    const { id: businessId } = req.params;
    const business = await ensureBusinessAccess(req.user.id, businessId);
    if (!business) {
      return res.status(404).json({ success: false, message: 'İşletme bulunamadı' });
    }
    const { limit = 50 } = req.query;
    const logs = await prisma.appointmentSmsLog.findMany({
      where: { businessId },
      orderBy: { sentAt: 'desc' },
      take: Math.min(parseInt(limit, 10) || 50, 100)
    });
    res.json({ success: true, data: logs });
  } catch (error) {
    next(error);
  }
};
