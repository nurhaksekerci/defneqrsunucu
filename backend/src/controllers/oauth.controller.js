const jwt = require('jsonwebtoken');
const tokenManager = require('../utils/tokenManager');
const { recordUserRegistration, recordLoginAttempt } = require('../utils/metrics');
const { processReferral } = require('../middleware/referral.middleware');

const DEFNEQR_ROLES = ['RESTAURANT_OWNER', 'CASHIER', 'WAITER', 'BARISTA', 'COOK', 'ADMIN', 'STAFF'];
const DEFNERANDEVU_ROLES = ['BUSINESS_OWNER', 'APPOINTMENT_STAFF', 'ADMIN', 'STAFF'];

const RANDEVU_FRONTEND_URL = process.env.RANDEVU_FRONTEND_URL || process.env.RANDEVU_SITE_URL || 'https://randevu.defneqr.com';

exports.googleCallback = async (req, res) => {
  try {
    const isRandevu = req.cookies?.oauth_return === 'randevu';
    const frontendUrl = isRandevu ? RANDEVU_FRONTEND_URL : (process.env.FRONTEND_URL || 'https://defneqr.com');
    const allowedRoles = isRandevu ? DEFNERANDEVU_ROLES : DEFNEQR_ROLES;

    console.log('========================================');
    console.log('🎯 STEP 10: OAuth Controller - Token Generation');
    console.log('   isRandevu:', isRandevu, '| frontendUrl:', frontendUrl);
    
    const user = req.user;

    if (!user) {
      console.error('❌ req.user boş!');
      return res.redirect(`${frontendUrl}/auth/login?error=authentication_failed`);
    }

    // Proje-rol uyumluluğu
    if (!allowedRoles.includes(user.role)) {
      const msg = isRandevu
        ? 'Bu hesap DefneRandevu için değil. Lütfen defneqr.com üzerinden giriş yapın.'
        : 'Bu hesap Defne Qr için değil. Lütfen randevu.defneqr.com üzerinden giriş yapın.';
      return res.redirect(`${frontendUrl}/auth/login?error=project_mismatch&message=${encodeURIComponent(msg)}`);
    }

    console.log('   User:', user.email, '(ID:', user.id + ')');
    console.log('🔐 Token üretiliyor...');
    
    // Generate tokens
    const accessToken = tokenManager.generateAccessToken(user.id);
    const { token: refreshToken } = await tokenManager.generateRefreshToken(
      user.id,
      req.headers['user-agent'],
      req.ip
    );

    console.log('✅ Token\'lar oluşturuldu');
    console.log('   Access Token length:', accessToken?.length);
    console.log('   Refresh Token length:', refreshToken?.length);

    // Record metrics
    recordLoginAttempt('success', 'google');

    // Referral tracking (cookie'den) - Yeni kullanıcı ise
    const referralCode = req.cookies?.referral_code;
    if (referralCode) {
      await processReferral(referralCode, user.id, req.ip, req.headers['user-agent']);
    }

    const redirectUrl = `${frontendUrl}/auth/callback?accessToken=${accessToken}&refreshToken=${refreshToken}`;
    console.log('🔄 STEP 11: Frontend\'e Redirect Ediliyor');
    console.log('   Redirect URL:', redirectUrl.substring(0, 100) + '...');
    console.log('========================================');
    
    // Kullanıcıyı frontend'e yönlendir ve token'ları query parameter olarak gönder
    res.redirect(redirectUrl);
  } catch (error) {
    console.error('========================================');
    console.error('❌ Controller Error:', error.message);
    console.error('   Stack:', error.stack?.split('\n').slice(0, 3).join('\n'));
    console.error('========================================');
    const frontendUrl = req.cookies?.oauth_return === 'randevu' ? RANDEVU_FRONTEND_URL : (process.env.FRONTEND_URL || 'https://defneqr.com');
    res.redirect(`${frontendUrl}/auth/login?error=authentication_failed`);
  }
};

/**
 * Google OAuth başarısız
 */
exports.googleFailure = (req, res) => {
  const frontendUrl = req.cookies?.oauth_return === 'randevu' ? RANDEVU_FRONTEND_URL : (process.env.FRONTEND_URL || 'https://defneqr.com');
  res.redirect(`${frontendUrl}/auth/login?error=google_auth_failed`);
};
