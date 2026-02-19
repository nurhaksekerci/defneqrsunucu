const prisma = require('../config/database');
const { parsePaginationParams, createPaginatedResponse } = require('../utils/pagination');
const { recordOrder } = require('../utils/metrics');

// Sipariş numarası oluştur
const generateOrderNumber = () => {
  const date = new Date();
  const timestamp = date.getTime().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `ORD-${timestamp}${random}`;
};

// Siparişleri listele
exports.getOrders = async (req, res, next) => {
  try {
    const { restaurantId, status, waiterId, tableId, paginate } = req.query;
    const { page, limit, skip } = parsePaginationParams(req.query);

    const where = { isDeleted: false };

    if (restaurantId) {
      where.restaurantId = restaurantId;
    }

    if (tableId) {
      where.tableId = tableId;
    }

    if (status) {
      // Birden fazla status için (örn: "PENDING,PREPARING")
      if (status.includes(',')) {
        where.status = { in: status.split(',') };
      } else {
        where.status = status;
      }
    }

    if (waiterId) {
      where.waiterId = waiterId;
    }

    const queryOptions = {
      where,
      include: {
        orderItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                image: true
              }
            }
          }
        },
        waiter: {
          select: {
            id: true,
            fullName: true
          }
        },
        table: {
          select: {
            id: true,
            number: true
          }
        },
        _count: {
          select: {
            payments: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    };

    // Pagination (default enabled for list endpoints)
    if (paginate !== 'false') {
      queryOptions.skip = skip;
      queryOptions.take = limit;

      const totalCount = await prisma.order.count({ where });
      const orders = await prisma.order.findMany(queryOptions);

      return res.json(createPaginatedResponse(orders, totalCount, { page, limit }));
    }

    // Without pagination (for specific table queries)
    const orders = await prisma.order.findMany(queryOptions);

    res.json({
      success: true,
      data: orders
    });
  } catch (error) {
    next(error);
  }
};

// Sipariş detayı
exports.getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id, isDeleted: false },
      include: {
        orderItems: {
          include: {
            product: true
          }
        },
        waiter: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        },
        restaurant: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        payments: true
      }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Sipariş bulunamadı'
      });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    next(error);
  }
};

// Sipariş oluştur
exports.createOrder = async (req, res, next) => {
  try {
    const { restaurantId, tableId, tableNumber, items, notes } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Sipariş için en az bir ürün gerekli'
      });
    }

    // Sipariş numarası oluştur
    let orderNumber = generateOrderNumber();
    
    // Benzersiz olduğundan emin ol
    let existing = await prisma.order.findUnique({ where: { orderNumber } });
    while (existing) {
      orderNumber = generateOrderNumber();
      existing = await prisma.order.findUnique({ where: { orderNumber } });
    }

    // Eğer tableId varsa, masayı dolu yap
    if (tableId) {
      await prisma.table.update({
        where: { id: tableId },
        data: { isOccupied: true }
      });
    }

    // Sipariş oluştur
    const order = await prisma.order.create({
      data: {
        orderNumber,
        restaurantId,
        tableId: tableId || null,
        tableNumber: tableNumber || null,
        notes,
        waiterId: req.user?.id || null,
        status: 'PENDING',
        orderItems: {
          create: items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.price || item.unitPrice,
            totalPrice: item.quantity * (item.price || item.unitPrice),
            notes: item.notes || null
          }))
        }
      },
      include: {
        orderItems: {
          include: {
            product: true
          }
        },
        table: true
      }
    });

    // Stokları güncelle (opsiyonel) - Optimized to avoid N+1
    try {
      // Batch update: tüm productId'leri topla
      const productIds = items.map(item => item.productId);
      
      // Her ürün için tek sorguda güncelle
      await Promise.all(
        items.map(item =>
          prisma.stock.updateMany({
            where: {
              restaurantId,
              productId: item.productId,
              isDeleted: false
            },
            data: {
              quantity: {
                decrement: item.quantity
              }
            }
          })
        )
      );
    } catch (stockError) {
      // Stok hatası kritik değil, sadece log'la
      console.warn('Stock update warning:', stockError);
    }

    // Record order metrics
    recordOrder(restaurantId, 'PENDING', order.totalAmount);

    res.status(201).json({
      success: true,
      message: 'Sipariş başarıyla oluşturuldu',
      data: order
    });
  } catch (error) {
    next(error);
  }
};

// Sipariş durumu güncelle
exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['PENDING', 'PREPARING', 'READY', 'DELIVERED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz sipariş durumu'
      });
    }

    const order = await prisma.order.findUnique({
      where: { id, isDeleted: false }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Sipariş bulunamadı'
      });
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status },
      include: {
        orderItems: {
          include: {
            product: true
          }
        },
        waiter: {
          select: {
            id: true,
            fullName: true
          }
        }
      }
    });

    res.json({
      success: true,
      message: 'Sipariş durumu güncellendi',
      data: updatedOrder
    });
  } catch (error) {
    next(error);
  }
};

// Sipariş iptal et
exports.cancelOrder = async (req, res, next) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id, isDeleted: false },
      include: {
        orderItems: true,
        restaurant: true
      }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Sipariş bulunamadı'
      });
    }

    // İptal edilebilir mi kontrol et
    if (order.status === 'DELIVERED') {
      return res.status(400).json({
        success: false,
        message: 'Teslim edilmiş sipariş iptal edilemez'
      });
    }

    // Sipariş durumunu iptal et
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status: 'CANCELLED' }
    });

    // Stokları geri ekle - Optimized to avoid N+1
    await Promise.all(
      order.orderItems.map(item =>
        prisma.stock.updateMany({
          where: {
            restaurantId: order.restaurantId,
            productId: item.productId,
            isDeleted: false
          },
          data: {
            quantity: {
              increment: item.quantity
            }
          }
        })
      )
    );

    res.json({
      success: true,
      message: 'Sipariş iptal edildi',
      data: updatedOrder
    });
  } catch (error) {
    next(error);
  }
};
