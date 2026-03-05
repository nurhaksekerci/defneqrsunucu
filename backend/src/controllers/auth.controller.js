const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const prisma = require('../config/database');
const { validatePassword } = require('../utils/passwordValidator');
const tokenManager = require('../utils/tokenManager');
const { sendPasswordResetEmail } = require('../utils/emailService');
const { recordUserRegistration, recordLoginAttempt } = require('../utils/metrics');
const logger = require('../utils/logger');
const { processReferral } = require('../middleware/referral.middleware');

// Kayıt olma
exports.register = async (req, res, next) => {
  try {
    const { email, username, password, fullName } = req.body;

    // Password complexity validation
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({
        success: false,
        message: passwordValidation.message
      });
    }

    // Email kontrolü
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Bu email adresi zaten kullanılıyor'
      });
    }

    // Username kontrolü
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

    // Kullanıcı oluştur
    const user = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        fullName,
        role: 'RESTAURANT_OWNER' // Varsayılan rol
      },
      select: {
        id: true,
        email: true,
        username: true,
        fullName: true,
        role: true,
        createdAt: true
      }
    });

    // Generate tokens
    const accessToken = tokenManager.generateAccessToken(user.id);
    const { token: refreshToken } = await tokenManager.generateRefreshToken(
      user.id,
      req.headers['user-agent'],
      req.ip
    );

    // Record metrics
    recordUserRegistration('email');

    // Referral tracking (cookie veya body'den - ref link ile kayıt)
    const referralCode = req.body?.ref || req.cookies?.referral_code;
    if (referralCode) {
      await processReferral(referralCode, user.id, req.ip, req.headers['user-agent']);
    }

    res.status(201).json({
      success: true,
      message: 'Kayıt başarılı',
      data: { 
        user, 
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    next(error);
  }
};

// Giriş yapma
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Kullanıcıyı bul
    const user = await prisma.user.findUnique({
      where: { email, isDeleted: false }
    });

    if (!user || !user.password) {
      // Record failed login attempt
      recordLoginAttempt('failed', 'email');
      
      return res.status(401).json({
        success: false,
        message: 'Email veya şifre hatalı'
      });
    }

    // Şifre kontrolü
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      // Record failed login attempt
      recordLoginAttempt('failed', 'email');
      
      return res.status(401).json({
        success: false,
        message: 'Email veya şifre hatalı'
      });
    }

    // Generate tokens
    const accessToken = tokenManager.generateAccessToken(user.id);
    const { token: refreshToken } = await tokenManager.generateRefreshToken(
      user.id,
      req.headers['user-agent'],
      req.ip
    );

    // Record successful login attempt
    recordLoginAttempt('success', 'email');

    // Şifreyi response'dan çıkar
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      success: true,
      message: 'Giriş başarılı',
      data: { 
        user: userWithoutPassword, 
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    next(error);
  }
};

// Çıkış yapma
exports.logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const accessToken = req.headers.authorization?.split(' ')[1];

    // Revoke refresh token if provided
    if (refreshToken) {
      await tokenManager.revokeRefreshToken(refreshToken);
    }

    // Blacklist current access token
    if (accessToken) {
      await tokenManager.blacklistAccessToken(accessToken, 'logout');
    }

    res.json({
      success: true,
      message: 'Çıkış başarılı'
    });
  } catch (error) {
    next(error);
  }
};

// Mevcut kullanıcı bilgisi
exports.getCurrentUser = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id, isDeleted: false },
      select: {
        id: true,
        email: true,
        username: true,
        fullName: true,
        role: true,
        createdAt: true,
        restaurants: {
          where: { isDeleted: false },
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Kullanıcı bulunamadı'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// Şifre değiştirme (authenticated user)
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    // Kullanıcıyı bul
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user || !user.password) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz işlem'
      });
    }

    // Mevcut şifreyi kontrol et
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Mevcut şifre hatalı'
      });
    }

    // Yeni şifre complexity validation
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      return res.status(400).json({
        success: false,
        message: passwordValidation.message
      });
    }

    // Yeni şifreyi hashle ve güncelle
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    });

    res.json({
      success: true,
      message: 'Şifre başarıyla değiştirildi'
    });
  } catch (error) {
    next(error);
  }
};

// Şifremi unuttum (reset token oluştur)
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    // Kullanıcıyı bul
    const user = await prisma.user.findUnique({
      where: { email, isDeleted: false }
    });

    // Güvenlik: Email bulunamasa bile başarılı mesaj dön (email enumeration saldırısını önle)
    if (!user) {
      logger.info('Şifre sıfırlama talebi - kayıtlı kullanıcı bulunamadı (email DB\'de yok)');
      return res.json({
        success: true,
        message: 'Eğer bu email adresi sistemde kayıtlıysa, şifre sıfırlama bağlantısı gönderilecektir'
      });
    }

    // Önceki kullanılmamış tokenları temizle
    await prisma.passwordReset.updateMany({
      where: {
        userId: user.id,
        used: false,
        expiresAt: { gt: new Date() }
      },
      data: { used: true }
    });

    // Reset token oluştur (random 32 byte hex)
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Token'ı veritabanına kaydet (1 saat geçerli)
    await prisma.passwordReset.create({
      data: {
        userId: user.id,
        token: hashedToken,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000) // 1 hour
      }
    });

    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/reset-password?token=${resetToken}`;
    logger.info('Şifre sıfırlama maili gönderiliyor', { to: user.email });
    const sent = await sendPasswordResetEmail(user.email, resetLink, user.fullName || user.username || 'Kullanıcı');
    if (!sent) {
      logger.error('Şifre sıfırlama maili gönderilemedi', { to: user.email });
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('🔐 Password Reset Token:', resetToken);
      console.log('🔗 Reset Link:', resetLink);
    }

    res.json({
      success: true,
      message: 'Eğer bu email adresi sistemde kayıtlıysa, şifre sıfırlama bağlantısı gönderilecektir',
      ...(process.env.NODE_ENV === 'development' && { resetToken, resetLink })
    });
  } catch (error) {
    next(error);
  }
};

// Şifre sıfırlama (token ile)
exports.resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz sıfırlama bağlantısı'
      });
    }

    // Token'ı hashle
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Token'ı bul
    const resetRecord = await prisma.passwordReset.findFirst({
      where: {
        token: hashedToken,
        used: false,
        expiresAt: { gt: new Date() }
      },
      include: {
        user: true
      }
    });

    if (!resetRecord) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz veya süresi dolmuş sıfırlama bağlantısı'
      });
    }

    // Yeni şifre complexity validation
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      return res.status(400).json({
        success: false,
        message: passwordValidation.message
      });
    }

    // Yeni şifreyi hashle
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Kullanıcının şifresini güncelle ve token'ı kullanılmış işaretle
    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetRecord.userId },
        data: { password: hashedPassword }
      }),
      prisma.passwordReset.update({
        where: { id: resetRecord.id },
        data: {
          used: true,
          usedAt: new Date()
        }
      })
    ]);

    res.json({
      success: true,
      message: 'Şifre başarıyla sıfırlandı. Şimdi giriş yapabilirsiniz.'
    });
  } catch (error) {
    next(error);
  }
};

// Refresh token (yeni access token al)
exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token gerekli'
      });
    }

    // Verify refresh token
    const tokenRecord = await tokenManager.verifyRefreshToken(refreshToken);

    if (!tokenRecord) {
      return res.status(401).json({
        success: false,
        message: 'Geçersiz veya süresi dolmuş refresh token'
      });
    }

    // Generate new access token
    const accessToken = tokenManager.generateAccessToken(tokenRecord.userId);

    // Optionally: Rotate refresh token (more secure)
    // const { token: newRefreshToken } = await tokenManager.generateRefreshToken(
    //   tokenRecord.userId,
    //   req.headers['user-agent'],
    //   req.ip
    // );
    // await tokenManager.revokeRefreshToken(refreshToken);

    res.json({
      success: true,
      data: {
        accessToken
        // refreshToken: newRefreshToken // If rotating
      }
    });
  } catch (error) {
    next(error);
  }
};

// Logout from all devices (revoke all tokens)
exports.logoutAll = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const accessToken = req.headers.authorization?.split(' ')[1];

    // Revoke all refresh tokens
    const count = await tokenManager.revokeAllUserTokens(userId);

    // Blacklist current access token
    if (accessToken) {
      await tokenManager.blacklistAccessToken(accessToken, 'logout_all');
    }

    res.json({
      success: true,
      message: `Tüm cihazlardan çıkış yapıldı. ${count} oturum sonlandırıldı.`
    });
  } catch (error) {
    next(error);
  }
};

// Get active sessions
exports.getActiveSessions = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const sessions = await tokenManager.getUserActiveSessions(userId);

    res.json({
      success: true,
      data: sessions
    });
  } catch (error) {
    next(error);
  }
};
