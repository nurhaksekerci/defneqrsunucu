const express = require('express');
const router = express.Router();
const passport = require('../config/passport');
const oauthController = require('../controllers/oauth.controller');

/**
 * @route   GET /api/auth/google
 * @desc    Google OAuth başlangıç endpoint'i
 * @query   return=randevu - DefneRandevu'dan geliyorsa callback randevu.defneqr.com'a yönlendirilir
 * @access  Public
 */
router.get('/google', 
  (req, res, next) => {
    // OAuth başlatılırken hedef projeyi cookie'ye yaz (eski cookie'yi ezer)
    const returnTo = req.query.return === 'randevu' ? 'randevu' : 'defneqr';
    res.cookie('oauth_return', returnTo, {
      maxAge: 10 * 60 * 1000, // 10 dakika
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    });
    console.log('========================================');
    console.log('🚀 STEP 1: Google OAuth Başlatılıyor');
    console.log('   Request from:', req.get('origin') || req.get('referer'));
    console.log('   Return:', req.query.return);
    console.log('========================================');
    next();
  },
  passport.authenticate('google', { 
    scope: ['profile', 'email'],
    session: false 
  })
);

/**
 * @route   GET /api/auth/google/callback
 * @desc    Google OAuth callback endpoint'i
 * @access  Public
 */
router.get('/google/callback',
  (req, res, next) => {
    console.log('========================================');
    console.log('🔍 STEP 2: Google Callback Alındı');
    console.log('   Time:', new Date().toISOString());
    console.log('   Callback URL (ENV):', process.env.GOOGLE_CALLBACK_URL);
    console.log('   Client ID:', process.env.GOOGLE_CLIENT_ID?.substring(0, 35) + '...');
    console.log('   Code received:', req.query.code?.substring(0, 30) + '...');
    console.log('   Code length:', req.query.code?.length);
    console.log('   Code HEX (first 60 bytes):', Buffer.from(req.query.code || '').toString('hex').substring(0, 60));
    console.log('   Code contains HTML entities:', req.query.code?.includes('&#'));
    console.log('   Full request URL:', req.protocol + '://' + req.get('host') + req.originalUrl);
    console.log('   Request method:', req.method);
    console.log('   User agent:', req.get('user-agent')?.substring(0, 50));
    console.log('========================================');
    
    console.log('🔑 STEP 3: Passport Authentication Başlatılıyor...');
    passport.authenticate('google', { session: false }, (err, user, info) => {
      console.log('========================================');
      console.log('📨 STEP 4: Passport Authentication Sonucu');
      
      const oauthFrontend = req.cookies?.oauth_return === 'randevu'
        ? (process.env.RANDEVU_FRONTEND_URL || process.env.RANDEVU_SITE_URL || 'https://randevu.defneqr.com')
        : (process.env.FRONTEND_URL || 'https://defneqr.com');

      if (err) {
        console.error('❌ HATA VAR!');
        console.error('   Error message:', err.message);
        console.error('   Error code:', err.code);
        console.log('========================================');
        return res.redirect(`${oauthFrontend}/auth/login?error=google_auth_failed&detail=${err.code || ''}`);
      }
      
      if (!user) {
        console.error('❌ User bulunamadı!');
        console.error('   Info:', info);
        console.log('========================================');
        return res.redirect(`${oauthFrontend}/auth/login?error=google_auth_failed`);
      }
      
      console.log('✅ BAŞARILI!');
      console.log('   User ID:', user.id);
      console.log('   User Email:', user.email);
      console.log('   Next: Token generation...');
      console.log('========================================');
      
      req.user = user;
      next();
    })(req, res, next);
  },
  oauthController.googleCallback
);

/**
 * @route   GET /api/auth/google/failure
 * @desc    Google OAuth başarısız durumu
 * @access  Public
 */
router.get('/google/failure', oauthController.googleFailure);

module.exports = router;
