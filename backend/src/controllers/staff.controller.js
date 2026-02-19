const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

/**
 * Restorana ait personeli listele
 */
exports.getRestaurantStaff = async (req, res) => {
  try {
    const { restaurantId } = req.params;

    // Restoran sahibi kontrolü
    const restaurant = await prisma.restaurant.findFirst({
      where: {
        id: restaurantId,
        ownerId: req.user.id,
        isDeleted: false
      }
    });

    if (!restaurant) {
      return res.status(403).json({
        success: false,
        message: 'Bu restorana erişim yetkiniz yok'
      });
    }

    // Personel listesi (CASHIER, WAITER, BARISTA, COOK)
    const staff = await prisma.user.findMany({
      where: {
        role: {
          in: ['CASHIER', 'WAITER', 'BARISTA', 'COOK']
        },
        isDeleted: false,
        // Burada restaurant ilişkisi yoksa, tüm personeli getiririz
        // İleride restaurant-user pivot table eklenebilir
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        username: true,
        role: true,
        createdAt: true
      }
    });

    res.json({
      success: true,
      data: staff
    });
  } catch (error) {
    console.error('Get restaurant staff error:', error);
    res.status(500).json({
      success: false,
      message: 'Personel listesi alınamadı'
    });
  }
};

/**
 * Yeni personel ekle
 */
exports.createStaff = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { fullName, email, username, password, role } = req.body;

    // Validasyon
    if (!fullName || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Gerekli alanlar eksik: fullName, email, password, role'
      });
    }

    // Rol kontrolü
    const allowedRoles = ['CASHIER', 'WAITER', 'BARISTA', 'COOK'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz rol. İzin verilen roller: ' + allowedRoles.join(', ')
      });
    }

    // Restoran sahibi kontrolü
    const restaurant = await prisma.restaurant.findFirst({
      where: {
        id: restaurantId,
        ownerId: req.user.id,
        isDeleted: false
      }
    });

    if (!restaurant) {
      return res.status(403).json({
        success: false,
        message: 'Bu restorana erişim yetkiniz yok'
      });
    }

    // Email benzersizlik kontrolü
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Bu email adresi zaten kullanılıyor'
      });
    }

    // Username varsa benzersizlik kontrolü
    if (username) {
      const existingUsername = await prisma.user.findUnique({
        where: { username }
      });

      if (existingUsername) {
        return res.status(400).json({
          success: false,
          message: 'Bu kullanıcı adı zaten kullanılıyor'
        });
      }
    }

    // Şifreyi hashle
    const hashedPassword = await bcrypt.hash(password, 10);

    // Yeni personel oluştur
    const staff = await prisma.user.create({
      data: {
        fullName,
        email,
        username: username || null,
        password: hashedPassword,
        role
        // İleride restaurant ilişkisi eklenebilir
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        username: true,
        role: true,
        createdAt: true
      }
    });

    res.status(201).json({
      success: true,
      message: 'Personel başarıyla eklendi',
      data: staff
    });
  } catch (error) {
    console.error('Create staff error:', error);
    res.status(500).json({
      success: false,
      message: 'Personel eklenemedi'
    });
  }
};

/**
 * Personel güncelle
 */
exports.updateStaff = async (req, res) => {
  try {
    const { restaurantId, staffId } = req.params;
    const { fullName, email, username, role } = req.body;

    // Restoran sahibi kontrolü
    const restaurant = await prisma.restaurant.findFirst({
      where: {
        id: restaurantId,
        ownerId: req.user.id,
        isDeleted: false
      }
    });

    if (!restaurant) {
      return res.status(403).json({
        success: false,
        message: 'Bu restorana erişim yetkiniz yok'
      });
    }

    // Personel kontrolü
    const staff = await prisma.user.findFirst({
      where: {
        id: staffId,
        isDeleted: false
      }
    });

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Personel bulunamadı'
      });
    }

    // Güncelleme
    const updateData = {};
    if (fullName) updateData.fullName = fullName;
    if (email) updateData.email = email;
    if (username !== undefined) updateData.username = username || null;
    if (role) updateData.role = role;

    const updatedStaff = await prisma.user.update({
      where: { id: staffId },
      data: updateData,
      select: {
        id: true,
        fullName: true,
        email: true,
        username: true,
        role: true,
        createdAt: true
      }
    });

    res.json({
      success: true,
      message: 'Personel başarıyla güncellendi',
      data: updatedStaff
    });
  } catch (error) {
    console.error('Update staff error:', error);
    res.status(500).json({
      success: false,
      message: 'Personel güncellenemedi'
    });
  }
};

/**
 * Personel sil (soft delete)
 */
exports.deleteStaff = async (req, res) => {
  try {
    const { restaurantId, staffId } = req.params;

    // Restoran sahibi kontrolü
    const restaurant = await prisma.restaurant.findFirst({
      where: {
        id: restaurantId,
        ownerId: req.user.id,
        isDeleted: false
      }
    });

    if (!restaurant) {
      return res.status(403).json({
        success: false,
        message: 'Bu restorana erişim yetkiniz yok'
      });
    }

    // Personel kontrolü
    const staff = await prisma.user.findFirst({
      where: {
        id: staffId,
        isDeleted: false
      }
    });

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Personel bulunamadı'
      });
    }

    // Soft delete
    await prisma.user.update({
      where: { id: staffId },
      data: {
        isDeleted: true,
        deletedAt: new Date()
      }
    });

    res.json({
      success: true,
      message: 'Personel başarıyla silindi'
    });
  } catch (error) {
    console.error('Delete staff error:', error);
    res.status(500).json({
      success: false,
      message: 'Personel silinemedi'
    });
  }
};
