const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const prisma = require('../config/database');
const { validatePassword } = require('../utils/passwordValidator');
const tokenManager = require('../utils/tokenManager');
const { sendPasswordResetEmail } = require('../utils/emailService');
const logger = require('../utils/logger');

exports.register = async (req, res, next) => {
  try {
    const { email, username, password, fullName } = req.body;

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({
        success: false,
        message: passwordValidation.message
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Bu email adresi zaten kullanılıyor'
      });
    }

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

    const hashedPassword = await bcrypt.hash(password, 10);
    const defaultRole = req.project === 'defnerandevu' ? 'BUSINESS_OWNER' : 'RESTAURANT_OWNER';

    const user = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        fullName,
        role: defaultRole
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

    const accessToken = tokenManager.generateAccessToken(user.id, user.role);
    const { token: refreshToken } = await tokenManager.generateRefreshToken(
      user.id,
      req.headers['user-agent'],
      req.ip
    );

    // DefneQr: ref ile kayıt olunduysa backend-qr'da referral oluştur
    const ref = req.body?.ref;
    if (ref && req.project !== 'defnerandevu') {
      const qrUrl = process.env.BACKEND_QR_URL || 'http://backend-qr:5002';
      fetch(`${qrUrl}/api/internal/referrals/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          referralCode: ref,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent']
        })
      }).catch((err) => logger.warn?.('Referral create failed', { err: err?.message }));
    }

    res.status(201).json({
      success: true,
      message: 'Kayıt başarılı',
      data: { user, accessToken, refreshToken }
    });
  } catch (error) {
    next(error);
  }
};

const DEFNERANDEVU_ROLES = ['BUSINESS_OWNER', 'APPOINTMENT_STAFF', 'ADMIN', 'STAFF'];
const DEFNEQR_ROLES = ['RESTAURANT_OWNER', 'CASHIER', 'WAITER', 'BARISTA', 'COOK', 'ADMIN', 'STAFF'];

const isRoleAllowedForProject = (role, project) => {
  if (project === 'defnerandevu') return DEFNERANDEVU_ROLES.includes(role);
  return DEFNEQR_ROLES.includes(role);
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const project = req.project || 'defneqr';

    const user = await prisma.user.findUnique({
      where: { email, isDeleted: false }
    });

    if (!user || !user.password) {
      return res.status(401).json({
        success: false,
        message: 'Email veya şifre hatalı'
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Email veya şifre hatalı'
      });
    }

    if (!isRoleAllowedForProject(user.role, project)) {
      const isRandevu = project === 'defnerandevu';
      return res.status(403).json({
        success: false,
        code: 'PROJECT_MISMATCH',
        message: isRandevu
          ? 'Bu hesap DefneRandevu için değil. Lütfen defneqr.com üzerinden giriş yapın.'
          : 'Bu hesap Defne Qr için değil. Lütfen randevu.defneqr.com üzerinden giriş yapın.'
      });
    }

    const accessToken = tokenManager.generateAccessToken(user.id, user.role);
    const { token: refreshToken } = await tokenManager.generateRefreshToken(
      user.id,
      req.headers['user-agent'],
      req.ip
    );

    const { password: _, ...userWithoutPassword } = user;

    res.json({
      success: true,
      message: 'Giriş başarılı',
      data: { user: userWithoutPassword, accessToken, refreshToken }
    });
  } catch (error) {
    next(error);
  }
};

exports.logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const accessToken = req.headers.authorization?.split(' ')[1];

    if (refreshToken) {
      await tokenManager.revokeRefreshToken(refreshToken);
    }

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

exports.getCurrentUser = async (req, res, next) => {
  try {
    const project = req.project || 'defneqr';

    const user = await prisma.user.findUnique({
      where: { id: req.user.id, isDeleted: false },
      select: {
        id: true,
        email: true,
        username: true,
        fullName: true,
        avatar: true,
        role: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Kullanıcı bulunamadı'
      });
    }

    if (!isRoleAllowedForProject(user.role, project)) {
      const isRandevu = project === 'defnerandevu';
      return res.status(403).json({
        success: false,
        code: 'PROJECT_MISMATCH',
        message: isRandevu
          ? 'Bu hesap DefneRandevu için değil. Lütfen defneqr.com üzerinden giriş yapın.'
          : 'Bu hesap Defne Qr için değil. Lütfen randevu.defneqr.com üzerinden giriş yapın.'
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

exports.updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { fullName, avatar } = req.body;

    const updateData = {};
    if (typeof fullName === 'string' && fullName.trim()) {
      updateData.fullName = fullName.trim();
    }
    if (avatar !== undefined) {
      updateData.avatar = avatar === null || avatar === '' ? null : String(avatar);
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Güncellenecek alan belirtilmedi'
      });
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        username: true,
        fullName: true,
        avatar: true,
        role: true,
        createdAt: true
      }
    });

    res.json({
      success: true,
      message: 'Profil güncellendi',
      data: user
    });
  } catch (error) {
    next(error);
  }
};

exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user || !user.password) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz işlem'
      });
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Mevcut şifre hatalı'
      });
    }

    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      return res.status(400).json({
        success: false,
        message: passwordValidation.message
      });
    }

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

exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await prisma.user.findUnique({
      where: { email, isDeleted: false }
    });

    if (!user) {
      logger.info('Şifre sıfırlama talebi - kayıtlı kullanıcı bulunamadı');
      return res.json({
        success: true,
        message: 'Eğer bu email adresi sistemde kayıtlıysa, şifre sıfırlama bağlantısı gönderilecektir'
      });
    }

    await prisma.passwordReset.updateMany({
      where: {
        userId: user.id,
        used: false,
        expiresAt: { gt: new Date() }
      },
      data: { used: true }
    });

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    await prisma.passwordReset.create({
      data: {
        userId: user.id,
        token: hashedToken,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000)
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

exports.resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz sıfırlama bağlantısı'
      });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const resetRecord = await prisma.passwordReset.findFirst({
      where: {
        token: hashedToken,
        used: false,
        expiresAt: { gt: new Date() }
      },
      include: { user: true }
    });

    if (!resetRecord) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz veya süresi dolmuş sıfırlama bağlantısı'
      });
    }

    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      return res.status(400).json({
        success: false,
        message: passwordValidation.message
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetRecord.userId },
        data: { password: hashedPassword }
      }),
      prisma.passwordReset.update({
        where: { id: resetRecord.id },
        data: { used: true, usedAt: new Date() }
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

exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const project = req.project || 'defneqr';

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token gerekli'
      });
    }

    const tokenRecord = await tokenManager.verifyRefreshToken(refreshToken);

    if (!tokenRecord) {
      return res.status(401).json({
        success: false,
        message: 'Geçersiz veya süresi dolmuş refresh token'
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: tokenRecord.userId, isDeleted: false },
      select: { role: true }
    });
    if (user && !isRoleAllowedForProject(user.role, project)) {
      const isRandevu = project === 'defnerandevu';
      return res.status(403).json({
        success: false,
        code: 'PROJECT_MISMATCH',
        message: isRandevu
          ? 'Bu hesap DefneRandevu için değil. Lütfen defneqr.com üzerinden giriş yapın.'
          : 'Bu hesap Defne Qr için değil. Lütfen randevu.defneqr.com üzerinden giriş yapın.'
      });
    }

    const accessToken = tokenManager.generateAccessToken(tokenRecord.userId, user?.role);

    res.json({
      success: true,
      data: { accessToken }
    });
  } catch (error) {
    next(error);
  }
};

exports.logoutAll = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const accessToken = req.headers.authorization?.split(' ')[1];

    const count = await tokenManager.revokeAllUserTokens(userId);

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
