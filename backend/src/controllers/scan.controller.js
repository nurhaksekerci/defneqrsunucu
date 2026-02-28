const prisma = require('../config/database');
const { recordQrScan } = require('../utils/metrics');
const {
  getTurkeyDateAndHour,
  getTurkeyDayRange,
  getTurkeyTodayRange,
  getTurkeyYearStart,
  getTurkeyMonthStart,
  getTurkeySevenDaysAgo
} = require('../utils/turkeyTime');

// QR Menü taraması kaydet
exports.recordScan = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');

    // Restaurant'ı slug ile bul
    const restaurant = await prisma.restaurant.findUnique({
      where: { slug, isDeleted: false }
    });

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restoran bulunamadı'
      });
    }

    // Taramayı kaydet
    const scan = await prisma.menuScan.create({
      data: {
        restaurantId: restaurant.id,
        ipAddress,
        userAgent
      }
    });

    // Record QR scan metric
    recordQrScan(restaurant.id);

    res.json({
      success: true,
      data: scan
    });
  } catch (error) {
    next(error);
  }
};

// Restoran için tarama istatistikleri
exports.getScanStats = async (req, res, next) => {
  try {
    const { restaurantId } = req.params;
    const { startDate, endDate } = req.query;

    // Tarih filtresi
    const where = {
      restaurantId,
      ...(startDate || endDate ? {
        scannedAt: {
          ...(startDate ? { gte: new Date(startDate) } : {}),
          ...(endDate ? { lte: new Date(endDate) } : {})
        }
      } : {})
    };

    // Toplam tarama sayısı
    const totalScans = await prisma.menuScan.count({ where });

    // Bu yılki tarama sayısı (Türkiye saati)
    const yearStart = getTurkeyYearStart();
    const yearScans = await prisma.menuScan.count({
      where: {
        restaurantId,
        scannedAt: { gte: yearStart }
      }
    });

    // Bu ayki tarama sayısı (Türkiye saati)
    const monthStart = getTurkeyMonthStart();
    const monthScans = await prisma.menuScan.count({
      where: {
        restaurantId,
        scannedAt: { gte: monthStart }
      }
    });

    // Günlük tarama sayıları (son 7 gün, Türkiye saati)
    const sevenDaysAgo = getTurkeySevenDaysAgo();

    const recentScans = await prisma.menuScan.findMany({
      where: {
        restaurantId,
        scannedAt: { gte: sevenDaysAgo }
      },
      select: {
        scannedAt: true
      },
      orderBy: {
        scannedAt: 'asc'
      }
    });

    // Günlere göre grupla (Türkiye saati)
    const dailyScans = {};
    recentScans.forEach(scan => {
      const { date } = getTurkeyDateAndHour(scan.scannedAt);
      dailyScans[date] = (dailyScans[date] || 0) + 1;
    });

    // Saatlere göre grupla (belirli bir tarih için, Türkiye saati)
    const { date } = req.query;
    const todayTurkey = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Istanbul' });
    const targetDateStr = date || todayTurkey;
    const { start: targetDayStart, end: targetDayEnd } = getTurkeyDayRange(targetDateStr);

    const dayScans = await prisma.menuScan.findMany({
      where: {
        restaurantId,
        scannedAt: {
          gte: targetDayStart,
          lt: targetDayEnd
        }
      },
      select: {
        scannedAt: true
      }
    });

    const hourlyScans = Array(24).fill(0);
    dayScans.forEach(scan => {
      const { hour } = getTurkeyDateAndHour(scan.scannedAt);
      hourlyScans[hour]++;
    });

    // Bugünün toplam taraması (Türkiye saati)
    const { start: todayStart, end: todayEnd } = getTurkeyTodayRange();
    const todayTotal = await prisma.menuScan.count({
      where: {
        restaurantId,
        scannedAt: {
          gte: todayStart,
          lt: todayEnd
        }
      }
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
        selectedDateTotal: dayScans.length
      }
    });
  } catch (error) {
    next(error);
  }
};

// Tüm restoranlar için tarama özeti (Admin)
exports.getAllScansStats = async (req, res, next) => {
  try {
    const restaurants = await prisma.restaurant.findMany({
      where: { isDeleted: false },
      select: {
        id: true,
        name: true,
        slug: true,
        _count: {
          select: {
            menuScans: true
          }
        }
      },
      orderBy: {
        menuScans: {
          _count: 'desc'
        }
      }
    });

    res.json({
      success: true,
      data: restaurants
    });
  } catch (error) {
    next(error);
  }
};
