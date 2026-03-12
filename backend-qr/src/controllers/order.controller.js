const prisma = require('../config/database');
const { parsePaginationParams, createPaginatedResponse } = require('../utils/pagination');

const generateOrderNumber = () => {
  const timestamp = new Date().getTime().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `ORD-${timestamp}${random}`;
};

exports.getOrders = async (req, res, next) => {
  try {
    const { restaurantId, status, waiterId, tableId, paginate } = req.query;
    const { page, limit, skip } = parsePaginationParams(req.query);
    const where = { isDeleted: false };

    if (restaurantId) where.restaurantId = restaurantId;
    if (tableId) where.tableId = tableId;
    if (status) {
      where.status = status.includes(',') ? { in: status.split(',') } : status;
    }
    if (waiterId) where.waiterId = waiterId;

    const queryOptions = {
      where,
      include: {
        orderItems: {
          include: {
            product: { select: { id: true, name: true, image: true } },
          },
        },
        table: { select: { id: true, name: true } },
        _count: { select: { payments: true } },
      },
      orderBy: { createdAt: 'desc' },
    };

    if (paginate !== 'false') {
      queryOptions.skip = skip;
      queryOptions.take = limit;
      const totalCount = await prisma.order.count({ where });
      const orders = await prisma.order.findMany(queryOptions);
      return res.json(createPaginatedResponse(orders, totalCount, { page, limit }));
    }

    const orders = await prisma.order.findMany(queryOptions);
    res.json({ success: true, data: orders });
  } catch (error) {
    next(error);
  }
};

exports.getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const order = await prisma.order.findUnique({
      where: { id, isDeleted: false },
      include: {
        orderItems: { include: { product: true } },
        restaurant: { select: { id: true, name: true, slug: true } },
        payments: true,
      },
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Sipariş bulunamadı' });
    }

    res.json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

exports.createOrder = async (req, res, next) => {
  try {
    const { restaurantId, tableId, tableNumber, items, notes } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Sipariş için en az bir ürün gerekli' });
    }

    let orderNumber = generateOrderNumber();
    while (await prisma.order.findUnique({ where: { orderNumber } })) {
      orderNumber = generateOrderNumber();
    }

    if (tableId) {
      await prisma.table.update({
        where: { id: tableId },
        data: { isOccupied: true },
      });
    }

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
          create: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.price || item.unitPrice,
            totalPrice: item.quantity * (item.price || item.unitPrice),
            notes: item.notes || null,
          })),
        },
      },
      include: {
        orderItems: { include: { product: true } },
        table: true,
      },
    });

    try {
      await Promise.all(
        items.map((item) =>
          prisma.stock.updateMany({
            where: {
              restaurantId,
              productId: item.productId,
              isDeleted: false,
            },
            data: { quantity: { decrement: item.quantity } },
          })
        )
      );
    } catch (stockError) {
      console.warn('Stock update warning:', stockError);
    }

    res.status(201).json({
      success: true,
      message: 'Sipariş başarıyla oluşturuldu',
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['PENDING', 'PREPARING', 'READY', 'DELIVERED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Geçersiz sipariş durumu' });
    }

    const order = await prisma.order.findUnique({
      where: { id, isDeleted: false },
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Sipariş bulunamadı' });
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status },
      include: {
        orderItems: { include: { product: true } },
      },
    });

    res.json({
      success: true,
      message: 'Sipariş durumu güncellendi',
      data: updatedOrder,
    });
  } catch (error) {
    next(error);
  }
};

exports.cancelOrder = async (req, res, next) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id, isDeleted: false },
      include: { orderItems: true, restaurant: true },
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Sipariş bulunamadı' });
    }

    if (order.status === 'DELIVERED') {
      return res.status(400).json({ success: false, message: 'Teslim edilmiş sipariş iptal edilemez' });
    }

    await prisma.order.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    await Promise.all(
      order.orderItems.map((item) =>
        prisma.stock.updateMany({
          where: {
            restaurantId: order.restaurantId,
            productId: item.productId,
            isDeleted: false,
          },
          data: { quantity: { increment: item.quantity } },
        })
      )
    );

    res.json({
      success: true,
      message: 'Sipariş iptal edildi',
      data: { id: order.id, status: 'CANCELLED' },
    });
  } catch (error) {
    next(error);
  }
};
