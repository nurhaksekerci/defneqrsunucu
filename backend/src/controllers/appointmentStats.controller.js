const prisma = require('../config/database');

const ensureBusinessAccess = async (userId, businessId) => {
  const business = await prisma.appointmentBusiness.findFirst({
    where: { id: businessId, ownerId: userId, isDeleted: false }
  });
  return business;
};

exports.getStats = async (req, res, next) => {
  try {
    const { id: businessId } = req.params;
    const { months = 6 } = req.query;
    const business = await ensureBusinessAccess(req.user.id, businessId);
    if (!business) {
      return res.status(404).json({ success: false, message: 'İşletme bulunamadı' });
    }

    const monthsNum = Math.min(Math.max(parseInt(months, 10) || 6, 1), 24);
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - monthsNum, 1);

    const appointments = await prisma.appointment.findMany({
      where: {
        businessId,
        startAt: { gte: startDate }
      },
      select: {
        id: true,
        startAt: true,
        status: true,
        serviceId: true,
        staffId: true
      }
    });

    const total = appointments.length;
    const byStatus = appointments.reduce((acc, a) => {
      acc[a.status] = (acc[a.status] || 0) + 1;
      return acc;
    }, {});

    const monthlyData = [];
    for (let i = monthsNum - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
      const count = appointments.filter(
        (a) => new Date(a.startAt) >= d && new Date(a.startAt) <= monthEnd
      ).length;
      const completed = appointments.filter(
        (a) => a.status === 'COMPLETED' && new Date(a.startAt) >= d && new Date(a.startAt) <= monthEnd
      ).length;
      const cancelled = appointments.filter(
        (a) => a.status === 'CANCELLED' && new Date(a.startAt) >= d && new Date(a.startAt) <= monthEnd
      ).length;
      monthlyData.push({
        month: d.toISOString().slice(0, 7),
        label: d.toLocaleDateString('tr-TR', { month: 'short', year: 'numeric' }),
        total: count,
        completed,
        cancelled
      });
    }

    const thisMonth = monthlyData[monthlyData.length - 1]?.total || 0;
    const lastMonth = monthlyData[monthlyData.length - 2]?.total || 0;
    const growthPercent = lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth * 100).toFixed(1) : thisMonth > 0 ? 100 : 0;

    const byDayOfWeek = [0, 1, 2, 3, 4, 5, 6].map((day) => {
      const count = appointments.filter((a) => new Date(a.startAt).getDay() === day).length;
      const dayNames = ['Pazar', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
      return { day: dayNames[day], count };
    });

    const byHour = Array.from({ length: 12 }, (_, i) => {
      const hour = i + 8;
      const count = appointments.filter((a) => {
        const h = new Date(a.startAt).getHours();
        return h >= hour && h < hour + 1;
      }).length;
      return { hour: `${hour}:00`, count };
    });

    const byService = await prisma.appointment.groupBy({
      by: ['serviceId'],
      where: { businessId, startAt: { gte: startDate } },
      _count: { id: true }
    });
    const serviceIds = byService.map((s) => s.serviceId);
    const services = await prisma.appointmentService.findMany({
      where: { id: { in: serviceIds } },
      select: { id: true, name: true }
    });
    const serviceMap = Object.fromEntries(services.map((s) => [s.id, s.name]));
    const byServiceNamed = byService.map((s) => ({
      name: serviceMap[s.serviceId] || 'Bilinmiyor',
      count: s._count.id
    })).sort((a, b) => b.count - a.count);

    res.json({
      success: true,
      data: {
        total,
        byStatus,
        thisMonth,
        lastMonth,
        growthPercent: parseFloat(growthPercent),
        monthlyData,
        byDayOfWeek,
        byHour,
        byService: byServiceNamed
      }
    });
  } catch (error) {
    next(error);
  }
};
