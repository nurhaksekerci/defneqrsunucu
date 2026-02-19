const prisma = require('../config/database');

// Sistem ayarlarını getir
exports.getSettings = async (req, res, next) => {
  try {
    let settings = await prisma.systemSettings.findFirst();
    
    // Eğer ayar yoksa default oluştur
    if (!settings) {
      settings = await prisma.systemSettings.create({
        data: {
          siteName: 'Defne Qr',
          siteDescription: 'QR Menü ve Restoran Yönetim Sistemi',
          supportEmail: 'destek@defneqr.com',
          maxRestaurantsPerUser: 5,
          enableGoogleAuth: false,
          maintenanceMode: false
        }
      });
    }

    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    next(error);
  }
};

// Sistem ayarlarını güncelle (Admin only)
exports.updateSettings = async (req, res, next) => {
  try {
    const { 
      siteName, 
      siteDescription, 
      supportEmail, 
      maxRestaurantsPerUser,
      enableGoogleAuth,
      maintenanceMode 
    } = req.body;

    let settings = await prisma.systemSettings.findFirst();
    
    // Güncellenecek veriyi hazırla
    const updateData = {};
    if (siteName !== undefined) updateData.siteName = siteName;
    if (siteDescription !== undefined) updateData.siteDescription = siteDescription;
    if (supportEmail !== undefined) updateData.supportEmail = supportEmail;
    if (maxRestaurantsPerUser !== undefined) updateData.maxRestaurantsPerUser = maxRestaurantsPerUser;
    if (enableGoogleAuth !== undefined) updateData.enableGoogleAuth = enableGoogleAuth;
    if (maintenanceMode !== undefined) updateData.maintenanceMode = maintenanceMode;
    
    if (!settings) {
      // Yoksa oluştur
      settings = await prisma.systemSettings.create({
        data: {
          siteName: siteName || 'Defne Qr',
          siteDescription: siteDescription || 'QR Menü ve Restoran Yönetim Sistemi',
          supportEmail: supportEmail || 'destek@defneqr.com',
          maxRestaurantsPerUser: maxRestaurantsPerUser || 5,
          enableGoogleAuth: enableGoogleAuth || false,
          maintenanceMode: maintenanceMode || false
        }
      });
    } else {
      // Varsa güncelle
      settings = await prisma.systemSettings.update({
        where: { id: settings.id },
        data: updateData
      });
    }

    res.json({
      success: true,
      message: 'Sistem ayarları güncellendi',
      data: settings
    });
  } catch (error) {
    next(error);
  }
};
