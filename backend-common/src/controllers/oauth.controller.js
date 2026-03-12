const tokenManager = require('../utils/tokenManager');

const DEFNEQR_ROLES = ['RESTAURANT_OWNER', 'CASHIER', 'WAITER', 'BARISTA', 'COOK', 'ADMIN', 'STAFF'];
const DEFNERANDEVU_ROLES = ['BUSINESS_OWNER', 'APPOINTMENT_STAFF', 'ADMIN', 'STAFF'];

const RANDEVU_FRONTEND_URL = process.env.RANDEVU_FRONTEND_URL || process.env.RANDEVU_SITE_URL || 'https://randevu.defneqr.com';

exports.googleCallback = async (req, res) => {
  try {
    const isRandevu = req.cookies?.oauth_return === 'randevu';
    const frontendUrl = isRandevu ? RANDEVU_FRONTEND_URL : (process.env.FRONTEND_URL || 'https://defneqr.com');
    const allowedRoles = isRandevu ? DEFNERANDEVU_ROLES : DEFNEQR_ROLES;

    const user = req.user;

    if (!user) {
      return res.redirect(`${frontendUrl}/auth/login?error=authentication_failed`);
    }

    if (!allowedRoles.includes(user.role)) {
      const msg = isRandevu
        ? 'Bu hesap DefneRandevu için değil. Lütfen defneqr.com üzerinden giriş yapın.'
        : 'Bu hesap Defne Qr için değil. Lütfen randevu.defneqr.com üzerinden giriş yapın.';
      return res.redirect(`${frontendUrl}/auth/login?error=project_mismatch&message=${encodeURIComponent(msg)}`);
    }

    const accessToken = tokenManager.generateAccessToken(user.id, user.role);
    const { token: refreshToken } = await tokenManager.generateRefreshToken(
      user.id,
      req.headers['user-agent'],
      req.ip
    );

    const redirectUrl = `${frontendUrl}/auth/callback?accessToken=${accessToken}&refreshToken=${refreshToken}`;
    res.redirect(redirectUrl);
  } catch (error) {
    const frontendUrl = req.cookies?.oauth_return === 'randevu' ? RANDEVU_FRONTEND_URL : (process.env.FRONTEND_URL || 'https://defneqr.com');
    res.redirect(`${frontendUrl}/auth/login?error=authentication_failed`);
  }
};

exports.googleFailure = (req, res) => {
  const frontendUrl = req.cookies?.oauth_return === 'randevu' ? RANDEVU_FRONTEND_URL : (process.env.FRONTEND_URL || 'https://defneqr.com');
  res.redirect(`${frontendUrl}/auth/login?error=google_auth_failed`);
};
