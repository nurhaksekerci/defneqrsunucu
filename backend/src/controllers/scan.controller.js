const prisma = require('../config/database');
const { recordQrScan } = require('../utils/metrics');

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

    // Bu yılki tarama sayısı
    const yearStart = new Date(new Date().getFullYear(), 0, 1);
    yearStart.setHours(0, 0, 0, 0);
    const yearScans = await prisma.menuScan.count({
      where: {
        restaurantId,
        scannedAt: { gte: yearStart }
      }
    });

    // Bu ayki tarama sayısı
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    monthStart.setHours(0, 0, 0, 0);
    const monthScans = await prisma.menuScan.count({
      where: {
        restaurantId,
        scannedAt: { gte: monthStart }
      }
    });

    // Günlük tarama sayıları (son 7 gün)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

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

    // Günlere göre grupla
    const dailyScans = {};
    recentScans.forEach(scan => {
      const date = scan.scannedAt.toISOString().split('T')[0];
      dailyScans[date] = (dailyScans[date] || 0) + 1;
    });

    // Saatlere göre grupla (belirli bir tarih için)
    const { date } = req.query;
    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);
    
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);
    
    const dayScans = await prisma.menuScan.findMany({
      where: {
        restaurantId,
        scannedAt: { 
          gte: targetDate,
          lt: nextDay
        }
      },
      select: {
        scannedAt: true
      }
    });

    const hourlyScans = Array(24).fill(0);
    dayScans.forEach(scan => {
      const hour = scan.scannedAt.getHours();
      hourlyScans[hour]++;
    });

    // Bugünün toplam taraması
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayNext = new Date(today);
    todayNext.setDate(todayNext.getDate() + 1);
    
    const todayTotal = await prisma.menuScan.count({
      where: {
        restaurantId,
        scannedAt: { 
          gte: today,
          lt: todayNext
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
        selectedDate: targetDate.toISOString().split('T')[0],
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
