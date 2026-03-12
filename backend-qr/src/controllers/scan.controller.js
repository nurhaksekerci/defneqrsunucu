const prisma = require('../config/database');
const {
  getTurkeyDateAndHour,
  getTurkeyDayRange,
  getTurkeyTodayRange,
  getTurkeyYearStart,
  getTurkeyMonthStart,
  getTurkeySevenDaysAgo,
} = require('../utils/turkeyTime');

exports.recordScan = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const ipAddress = req.ip || req.connection?.remoteAddress;
    const userAgent = req.get('user-agent');

    const restaurant = await prisma.restaurant.findUnique({
      where: { slug, isDeleted: false },
    });

    if (!restaurant) {
      return res.status(404).json({ success: false, message: 'Restoran bulunamadı' });
    }

    const scan = await prisma.menuScan.create({
      data: {
        restaurantId: restaurant.id,
        ipAddress,
        userAgent,
      },
    });

    res.json({ success: true, data: scan });
  } catch (error) {
    next(error);
  }
};

exports.getScanStats = async (req, res, next) => {
  try {
    const { restaurantId } = req.params;
    const { startDate, endDate } = req.query;

    const where = {
      restaurantId,
      ...(startDate || endDate
        ? {
            scannedAt: {
              ...(startDate ? { gte: new Date(startDate) } : {}),
              ...(endDate ? { lte: new Date(endDate) } : {}),
            },
          }
        : {}),
    };

    const totalScans = await prisma.menuScan.count({ where });
    const yearStart = getTurkeyYearStart();
    const yearScans = await prisma.menuScan.count({
      where: { restaurantId, scannedAt: { gte: yearStart } },
    });
    const monthStart = getTurkeyMonthStart();
    const monthScans = await prisma.menuScan.count({
      where: { restaurantId, scannedAt: { gte: monthStart } },
    });

    const sevenDaysAgo = getTurkeySevenDaysAgo();
    const recentScans = await prisma.menuScan.findMany({
      where: { restaurantId, scannedAt: { gte: sevenDaysAgo } },
      select: { scannedAt: true },
      orderBy: { scannedAt: 'asc' },
    });

    const dailyScans = {};
    recentScans.forEach((scan) => {
      const { date } = getTurkeyDateAndHour(scan.scannedAt);
      dailyScans[date] = (dailyScans[date] || 0) + 1;
    });

    const todayParts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Europe/Istanbul',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(new Date());
    const todayObj = {};
    todayParts.forEach((p) => {
      todayObj[p.type] = p.value;
    });
    const todayTurkey = `${todayObj.year}-${todayObj.month}-${todayObj.day}`;
    const targetDateStr = req.query.date || todayTurkey;
    const { start: targetDayStart, end: targetDayEnd } = getTurkeyDayRange(targetDateStr);

    const dayScans = await prisma.menuScan.findMany({
      where: {
        restaurantId,
        scannedAt: { gte: targetDayStart, lt: targetDayEnd },
      },
      select: { scannedAt: true },
    });

    const hourlyScans = Array(24).fill(0);
    dayScans.forEach((scan) => {
      const { hour } = getTurkeyDateAndHour(scan.scannedAt);
      const idx = Math.min(23, Math.max(0, hour));
      hourlyScans[idx]++;
    });

    const { start: todayStart, end: todayEnd } = getTurkeyTodayRange();
    const todayTotal = await prisma.menuScan.count({
      where: {
        restaurantId,
        scannedAt: { gte: todayStart, lt: todayEnd },
      },
    });

    res.json({
      success: true,
      data: {
        totalScans,
        yearScans,
        monthScans,
        dailyScans,
        hourlyScans,
        todayTotal,
        selectedDate: targetDateStr,
        selectedDateTotal: dayScans.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getAllScansStats = async (req, res, next) => {
  try {
    const restaurants = await prisma.restaurant.findMany({
      where: { isDeleted: false },
      select: {
        id: true,
        name: true,
        slug: true,
        _count: { select: { menuScans: true } },
      },
    });
    restaurants.sort((a, b) => (b._count?.menuScans || 0) - (a._count?.menuScans || 0));

    res.json({ success: true, data: restaurants });
  } catch (error) {
    next(error);
  }
};
