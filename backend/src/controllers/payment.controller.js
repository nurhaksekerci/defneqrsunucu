const prisma = require('../config/database');

// Ödemeleri listele
exports.getPayments = async (req, res, next) => {
  try {
    const { restaurantId, status, orderId } = req.query;

    const where = { isDeleted: false };

    if (restaurantId) {
      where.restaurantId = restaurantId;
    }

    if (status) {
      where.status = status;
    }

    if (orderId) {
      where.orderId = orderId;
    }

    const payments = await prisma.payment.findMany({
      where,
      include: {
        order: {
          include: {
            orderItems: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            }
          }
        },
        cashier: {
          select: {
            id: true,
            fullName: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: payments
    });
  } catch (error) {
    next(error);
  }
};

// Ödeme al
exports.createPayment = async (req, res, next) => {
  try {
    const { orderId, amount, method } = req.body;

    // Sipariş kontrolü
    const order = await prisma.order.findUnique({
      where: { id: orderId, isDeleted: false },
      include: {
        orderItems: true,
        payments: {
          where: { isDeleted: false }
        }
      }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Sipariş bulunamadı'
      });
    }

    // Toplam tutarı hesapla
    const totalAmount = order.orderItems.reduce(
      (sum, item) => sum + Number(item.totalPrice),
      0
    );

    // Ödenmiş tutarı hesapla
    const paidAmount = order.payments
      .filter(p => p.status === 'PAID')
      .reduce((sum, p) => sum + Number(p.amount), 0);

    // Kalan tutarı hesapla
    const remainingAmount = totalAmount - paidAmount;

    if (amount > remainingAmount) {
      return res.status(400).json({
        success: false,
        message: 'Ödeme tutarı kalan tutardan fazla olamaz'
      });
    }

    // Ödeme oluştur
    const payment = await prisma.payment.create({
      data: {
        orderId,
        restaurantId: order.restaurantId,
        amount,
        method,
        status: amount >= remainingAmount ? 'PAID' : 'PARTIAL',
        cashierId: req.user.id
      },
      include: {
        order: {
          include: {
            orderItems: {
              include: {
                product: true
              }
            }
          }
        }
      }
    });

    // Sipariş durumunu güncelle
    if (paidAmount + amount >= totalAmount) {
      await prisma.order.update({
        where: { id: orderId },
        data: { status: 'DELIVERED' }
      });
    }

    res.status(201).json({
      success: true,
      message: 'Ödeme başarıyla alındı',
      data: {
        payment,
        totalAmount,
        paidAmount: paidAmount + amount,
        remainingAmount: remainingAmount - amount
      }
    });
  } catch (error) {
    next(error);
  }
};

// Gün sonu raporu (Z-Raporu)
exports.getDailySummary = async (req, res, next) => {
  try {
    const { restaurantId, date } = req.query;

    if (!restaurantId) {
      return res.status(400).json({
        success: false,
        message: 'Restaurant ID gerekli'
      });
    }

    const targetDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    // Günlük ödemeleri al
    const payments = await prisma.payment.findMany({
      where: {
        restaurantId,
        isDeleted: false,
        status: 'PAID',
        createdAt: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      include: {
        order: {
          include: {
            orderItems: true
          }
        }
      }
    });

    // Toplam hesapla
    const totalCash = payments
      .filter(p => p.method === 'CASH')
      .reduce((sum, p) => sum + Number(p.amount), 0);

    const totalCard = payments
      .filter(p => p.method === 'CREDIT_CARD' || p.method === 'DEBIT_CARD')
      .reduce((sum, p) => sum + Number(p.amount), 0);

    const totalAmount = totalCash + totalCard;

    // Sipariş sayısı
    const orderCount = new Set(payments.map(p => p.orderId)).size;

    res.json({
      success: true,
      data: {
        date: targetDate,
        totalAmount,
        totalCash,
        totalCard,
        orderCount,
        paymentCount: payments.length,
        payments
      }
    });
  } catch (error) {
    next(error);
  }
};
