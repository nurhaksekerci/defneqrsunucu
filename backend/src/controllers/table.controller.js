const prisma = require('../config/database');

// Masaları listele
exports.getTables = async (req, res, next) => {
  try {
    const { restaurantId } = req.query;

    if (!restaurantId) {
      return res.status(400).json({
        success: false,
        message: 'Restoran ID gerekli'
      });
    }

    const tables = await prisma.table.findMany({
      where: {
        restaurantId,
        isDeleted: false
      },
      orderBy: { name: 'asc' }
    });

    res.json({
      success: true,
      data: tables
    });
  } catch (error) {
    next(error);
  }
};

// Toplu masa oluştur
exports.createBulkTables = async (req, res, next) => {
  try {
    const { restaurantId, prefix, startNumber, endNumber } = req.body;

    if (!restaurantId || prefix === undefined || !startNumber || !endNumber) {
      return res.status(400).json({
        success: false,
        message: 'Tüm alanlar gerekli'
      });
    }

    const start = parseInt(startNumber);
    const end = parseInt(endNumber);

    if (isNaN(start) || isNaN(end) || start > end) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz numara aralığı'
      });
    }

    if (end - start > 100) {
      return res.status(400).json({
        success: false,
        message: 'Bir seferde en fazla 100 masa oluşturabilirsiniz'
      });
    }

    // Restoran kontrolü
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId, isDeleted: false }
    });

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restoran bulunamadı'
      });
    }

    // Mevcut masa isimlerini kontrol et
    const existingTables = await prisma.table.findMany({
      where: {
        restaurantId,
        isDeleted: false
      },
      select: { name: true }
    });

    const existingNames = new Set(existingTables.map(t => t.name));
    const tablesToCreate = [];

    for (let i = start; i <= end; i++) {
      const tableName = `${prefix}${i}`;
      if (!existingNames.has(tableName)) {
        tablesToCreate.push({
          name: tableName,
          restaurantId
        });
      }
    }

    if (tablesToCreate.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Tüm masalar zaten mevcut'
      });
    }

    // Toplu oluştur
    const result = await prisma.table.createMany({
      data: tablesToCreate,
      skipDuplicates: true
    });

    // Oluşturulan masaları getir
    const createdTables = await prisma.table.findMany({
      where: {
        restaurantId,
        name: {
          in: tablesToCreate.map(t => t.name)
        }
      }
    });

    res.json({
      success: true,
      message: `${result.count} masa başarıyla oluşturuldu`,
      data: createdTables
    });
  } catch (error) {
    next(error);
  }
};

// Tek masa oluştur
exports.createTable = async (req, res, next) => {
  try {
    const { name, restaurantId } = req.body;

    if (!name || !restaurantId) {
      return res.status(400).json({
        success: false,
        message: 'Masa adı ve restoran ID gerekli'
      });
    }

    const table = await prisma.table.create({
      data: {
        name,
        restaurantId
      }
    });

    res.json({
      success: true,
      message: 'Masa başarıyla oluşturuldu',
      data: table
    });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        message: 'Bu masa adı zaten kullanılıyor'
      });
    }
    next(error);
  }
};

// Masa güncelle
exports.updateTable = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, isOccupied } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (isOccupied !== undefined) updateData.isOccupied = isOccupied;

    const table = await prisma.table.update({
      where: { id },
      data: updateData
    });

    res.json({
      success: true,
      message: 'Masa başarıyla güncellendi',
      data: table
    });
  } catch (error) {
    next(error);
  }
};

// Masa sil (soft delete)
exports.deleteTable = async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.table.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date()
      }
    });

    res.json({
      success: true,
      message: 'Masa başarıyla silindi'
    });
  } catch (error) {
    next(error);
  }
};

// Tüm masaları sil (soft delete)
exports.deleteAllTables = async (req, res, next) => {
  try {
    const { restaurantId } = req.body;

    if (!restaurantId) {
      return res.status(400).json({
        success: false,
        message: 'Restoran ID gerekli'
      });
    }

    const result = await prisma.table.updateMany({
      where: {
        restaurantId,
        isDeleted: false
      },
      data: {
        isDeleted: true,
        deletedAt: new Date()
      }
    });

    res.json({
      success: true,
      message: `${result.count} masa başarıyla silindi`
    });
  } catch (error) {
    next(error);
  }
};
