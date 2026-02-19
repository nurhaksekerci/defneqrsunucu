const prisma = require('../config/database');

// Stok listele
exports.getStocks = async (req, res, next) => {
  try {
    const { restaurantId } = req.query;

    if (!restaurantId) {
      return res.status(400).json({
        success: false,
        message: 'Restaurant ID gerekli'
      });
    }

    // Yetki kontrolü
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId }
    });

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restoran bulunamadı'
      });
    }

    if (req.user.role !== 'ADMIN' && restaurant.ownerId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Bu restoranın stoklarını görüntüleme yetkiniz yok'
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
      orderBy: { updatedAt: 'desc' }
    });

    // Düşük stok uyarıları
    const lowStockItems = stocks.filter(s => s.quantity <= s.minStock);

    res.json({
      success: true,
      data: {
        stocks,
        lowStockCount: lowStockItems.length,
        lowStockItems
      }
    });
  } catch (error) {
    next(error);
  }
};

// Stok oluştur veya güncelle
exports.upsertStock = async (req, res, next) => {
  try {
    const { restaurantId, productId, quantity, price, minStock } = req.body;

    // Restoran kontrolü
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId }
    });

    if (!restaurant || restaurant.ownerId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Bu restoran için stok işlemi yapma yetkiniz yok'
      });
    }

    const stock = await prisma.stock.upsert({
      where: {
        restaurantId_productId: {
          restaurantId,
          productId
        }
      },
      update: {
        quantity,
        price,
        minStock,
        isDeleted: false
      },
      create: {
        restaurantId,
        productId,
        quantity,
        price,
        minStock: minStock || 0
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            image: true
          }
        }
      }
    });

    res.json({
      success: true,
      message: 'Stok başarıyla güncellendi',
      data: stock
    });
  } catch (error) {
    next(error);
  }
};

// Stok güncelle (miktar artır/azalt)
exports.updateStockQuantity = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { quantity, operation } = req.body; // operation: 'add' veya 'subtract'

    const stock = await prisma.stock.findUnique({
      where: { id, isDeleted: false },
      include: { restaurant: true }
    });

    if (!stock) {
      return res.status(404).json({
        success: false,
        message: 'Stok bulunamadı'
      });
    }

    // Yetki kontrolü
    if (stock.restaurant.ownerId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Bu stoğu güncelleme yetkiniz yok'
      });
    }

    let newQuantity = stock.quantity;
    if (operation === 'add') {
      newQuantity += quantity;
    } else if (operation === 'subtract') {
      newQuantity -= quantity;
      if (newQuantity < 0) {
        return res.status(400).json({
          success: false,
          message: 'Stok miktarı negatif olamaz'
        });
      }
    } else {
      newQuantity = quantity;
    }

    const updatedStock = await prisma.stock.update({
      where: { id },
      data: { quantity: newQuantity },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            image: true
          }
        }
      }
    });

    res.json({
      success: true,
      message: 'Stok miktarı güncellendi',
      data: updatedStock
    });
  } catch (error) {
    next(error);
  }
};

// Stok sil
exports.deleteStock = async (req, res, next) => {
  try {
    const { id } = req.params;

    const stock = await prisma.stock.findUnique({
      where: { id, isDeleted: false },
      include: { restaurant: true }
    });

    if (!stock) {
      return res.status(404).json({
        success: false,
        message: 'Stok bulunamadı'
      });
    }

    // Yetki kontrolü
    if (stock.restaurant.ownerId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Bu stoğu silme yetkiniz yok'
      });
    }

    await prisma.stock.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date()
      }
    });

    res.json({
      success: true,
      message: 'Stok başarıyla silindi'
    });
  } catch (error) {
    next(error);
  }
};
