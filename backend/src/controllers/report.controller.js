const prisma = require('../config/database');

// Satış raporları
exports.getSalesReport = async (req, res, next) => {
  try {
    const { restaurantId, startDate, endDate, groupBy } = req.query;

    if (!restaurantId) {
      return res.status(400).json({
        success: false,
        message: 'Restaurant ID gerekli'
      });
    }

    const start = startDate ? new Date(startDate) : new Date(new Date().setDate(1));
    const end = endDate ? new Date(endDate) : new Date();

    // Ödemeleri al
    const payments = await prisma.payment.findMany({
      where: {
        restaurantId,
        isDeleted: false,
        status: 'PAID',
        createdAt: {
          gte: start,
          lte: end
        }
      },
      include: {
        order: {
          include: {
            orderItems: {
              include: {
                product: {
                  include: {
                    category: true
                  }
                }
              }
            }
          }
        }
      }
    });

    // Toplam satış
    const totalSales = payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const totalOrders = new Set(payments.map(p => p.orderId)).size;

    // Ödeme yöntemine göre dağılım
    const paymentMethodBreakdown = {
      CASH: 0,
      CREDIT_CARD: 0,
      DEBIT_CARD: 0
    };

    payments.forEach(p => {
      paymentMethodBreakdown[p.method] += Number(p.amount);
    });

    // Ürün bazlı satışlar
    const productSales = {};
    payments.forEach(payment => {
      payment.order.orderItems.forEach(item => {
        const productId = item.productId;
        if (!productSales[productId]) {
          productSales[productId] = {
            productId,
            productName: item.product.name,
            categoryName: item.product.category.name,
            quantity: 0,
            revenue: 0
          };
        }
        productSales[productId].quantity += item.quantity;
        productSales[productId].revenue += Number(item.totalPrice);
      });
    });

    // Kategori bazlı satışlar
    const categorySales = {};
    Object.values(productSales).forEach(ps => {
      if (!categorySales[ps.categoryName]) {
        categorySales[ps.categoryName] = {
          categoryName: ps.categoryName,
          revenue: 0,
          productCount: 0
        };
      }
      categorySales[ps.categoryName].revenue += ps.revenue;
      categorySales[ps.categoryName].productCount += 1;
    });

    res.json({
      success: true,
      data: {
        period: { start, end },
        summary: {
          totalSales,
          totalOrders,
          averageOrderValue: totalOrders > 0 ? totalSales / totalOrders : 0
        },
        paymentMethodBreakdown,
        topProducts: Object.values(productSales)
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 10),
        categorySales: Object.values(categorySales)
          .sort((a, b) => b.revenue - a.revenue)
      }
    });
  } catch (error) {
    next(error);
  }
};

// Çalışan performans raporu
exports.getStaffReport = async (req, res, next) => {
  try {
    const { restaurantId, startDate, endDate } = req.query;

    if (!restaurantId) {
      return res.status(400).json({
        success: false,
        message: 'Restaurant ID gerekli'
      });
    }

    const start = startDate ? new Date(startDate) : new Date(new Date().setDate(1));
    const end = endDate ? new Date(endDate) : new Date();

    // Garson performansı
    const waiterOrders = await prisma.order.findMany({
      where: {
        restaurantId,
        isDeleted: false,
        createdAt: {
          gte: start,
          lte: end
        },
        waiterId: { not: null }
      },
      include: {
        waiter: {
          select: {
            id: true,
            fullName: true
          }
        },
        orderItems: true,
        payments: {
          where: {
            status: 'PAID'
          }
        }
      }
    });

    const waiterStats = {};
    waiterOrders.forEach(order => {
      const waiterId = order.waiterId;
      if (!waiterStats[waiterId]) {
        waiterStats[waiterId] = {
          waiterId,
          waiterName: order.waiter.fullName,
          orderCount: 0,
          totalRevenue: 0,
          averageOrderValue: 0
        };
      }
      waiterStats[waiterId].orderCount += 1;
      const orderRevenue = order.payments.reduce((sum, p) => sum + Number(p.amount), 0);
      waiterStats[waiterId].totalRevenue += orderRevenue;
    });

    // Ortalama sipariş değerini hesapla
    Object.values(waiterStats).forEach(stat => {
      stat.averageOrderValue = stat.orderCount > 0 ? stat.totalRevenue / stat.orderCount : 0;
    });

    res.json({
      success: true,
      data: {
        period: { start, end },
        staffPerformance: Object.values(waiterStats)
          .sort((a, b) => b.totalRevenue - a.totalRevenue)
      }
    });
  } catch (error) {
    next(error);
  }
};

// Stok raporu
exports.getStockReport = async (req, res, next) => {
  try {
    const { restaurantId } = req.query;

    if (!restaurantId) {
      return res.status(400).json({
        success: false,
        message: 'Restaurant ID gerekli'
      });
    }

    const stocks = await prisma.stock.findMany({
      where: {
        restaurantId,
        isDeleted: false
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            image: true,
            category: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: { quantity: 'asc' }
    });

    // Düşük stok uyarıları
    const lowStockItems = stocks.filter(s => s.quantity <= s.minStock);
    const outOfStockItems = stocks.filter(s => s.quantity === 0);

    // Toplam stok değeri
    const totalStockValue = stocks.reduce(
      (sum, s) => sum + (s.quantity * Number(s.price)),
      0
    );

    res.json({
      success: true,
      data: {
        summary: {
          totalProducts: stocks.length,
          lowStockCount: lowStockItems.length,
          outOfStockCount: outOfStockItems.length,
          totalStockValue
        },
        lowStockItems,
        outOfStockItems,
        allStocks: stocks
      }
    });
  } catch (error) {
    next(error);
  }
};

// Dashboard özet istatistikleri
exports.getDashboardStats = async (req, res, next) => {
  try {
    const { restaurantId } = req.query;

    if (!restaurantId) {
      return res.status(400).json({
        success: false,
        message: 'Restaurant ID gerekli'
      });
    }

    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    // Bugünkü siparişler
    const todayOrders = await prisma.order.count({
      where: {
        restaurantId,
        isDeleted: false,
        createdAt: {
          gte: startOfDay,
          lte: endOfDay
        }
      }
    });

    // Bugünkü satışlar
    const todayPayments = await prisma.payment.findMany({
      where: {
        restaurantId,
        isDeleted: false,
        status: 'PAID',
        createdAt: {
          gte: startOfDay,
          lte: endOfDay
        }
      }
    });

    const todaySales = todayPayments.reduce((sum, p) => sum + Number(p.amount), 0);

    // Aktif siparişler (Beklemede + Hazırlanıyor)
    const activeOrders = await prisma.order.count({
      where: {
        restaurantId,
        isDeleted: false,
        status: {
          in: ['PENDING', 'PREPARING', 'READY']
        }
      }
    });

    // Düşük stok uyarıları
    const lowStockCount = await prisma.stock.count({
      where: {
        restaurantId,
        isDeleted: false,
        quantity: {
          lte: prisma.stock.fields.minStock
        }
      }
    });

    res.json({
      success: true,
      data: {
        todayOrders,
        todaySales,
        activeOrders,
        lowStockCount
      }
    });
  } catch (error) {
    next(error);
  }
};
