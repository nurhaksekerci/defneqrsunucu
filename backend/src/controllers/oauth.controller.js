const jwt = require('jsonwebtoken');
const tokenManager = require('../utils/tokenManager');
const { recordUserRegistration, recordLoginAttempt } = require('../utils/metrics');

/**
 * Google OAuth başarılı callback
 */
exports.googleCallback = async (req, res) => {
  try {
    // Kullanıcı passport tarafından req.user'a eklendi
    const user = req.user;

    if (!user) {
      return res.redirect(`${process.env.FRONTEND_URL}/auth/login?error=authentication_failed`);
    }

    // Generate tokens
    const accessToken = tokenManager.generateAccessToken(user.id);
    const { token: refreshToken } = await tokenManager.generateRefreshToken(
      user.id,
      req.headers['user-agent'],
      req.ip
    );

    // Record metrics (Google OAuth login/register)
    // Note: We treat all Google OAuth authentications as login success
    // New user creation is handled in passport strategy
    recordLoginAttempt('success', 'google');

    // Kullanıcıyı frontend'e yönlendir ve token'ları query parameter olarak gönder
    // Frontend bu token'ları alıp localStorage'a kaydedecek
    res.redirect(
      `${process.env.FRONTEND_URL}/auth/callback?accessToken=${accessToken}&refreshToken=${refreshToken}`
    );
  } catch (error) {
    console.error('Google callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL}/auth/login?error=authentication_failed`);
  }
};

/**
 * Google OAuth başarısız
 */
exports.googleFailure = (req, res) => {
  res.redirect(`${process.env.FRONTEND_URL}/auth/login?error=google_auth_failed`);
};
