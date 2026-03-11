const jwt = require('jsonwebtoken');
const tokenManager = require('../utils/tokenManager');
const { recordUserRegistration, recordLoginAttempt } = require('../utils/metrics');
const { processReferral } = require('../middleware/referral.middleware');

/**
 * Google OAuth başarılı callback
 */
const DEFNEQR_ROLES = ['RESTAURANT_OWNER', 'CASHIER', 'WAITER', 'BARISTA', 'COOK', 'ADMIN', 'STAFF'];

exports.googleCallback = async (req, res) => {
  try {
    console.log('========================================');
    console.log('🎯 STEP 10: OAuth Controller - Token Generation');
    
    // Kullanıcı passport tarafından req.user'a eklendi
    const user = req.user;

    if (!user) {
      console.error('❌ req.user boş!');
      console.log('========================================');
      return res.redirect(`${process.env.FRONTEND_URL}/auth/login?error=authentication_failed`);
    }

    // Google OAuth sadece DefneQr için - DefneRandevu hesapları reddedilir
    if (!DEFNEQR_ROLES.includes(user.role)) {
      return res.redirect(`${process.env.FRONTEND_URL}/auth/login?error=project_mismatch&message=${encodeURIComponent('Bu hesap Defne Qr için değil. Lütfen randevu.defneqr.com üzerinden giriş yapın.')}`);
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

    const redirectUrl = `${process.env.FRONTEND_URL}/auth/callback?accessToken=${accessToken}&refreshToken=${refreshToken}`;
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
    res.redirect(`${process.env.FRONTEND_URL}/auth/login?error=authentication_failed`);
  }
};

/**
 * Google OAuth başarısız
 */
exports.googleFailure = (req, res) => {
  res.redirect(`${process.env.FRONTEND_URL}/auth/login?error=google_auth_failed`);
};
