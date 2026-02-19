const express = require('express');
const router = express.Router();
const passport = require('../config/passport');
const oauthController = require('../controllers/oauth.controller');

/**
 * @route   GET /api/auth/google
 * @desc    Google OAuth başlangıç endpoint'i
 * @access  Public
 */
router.get('/google', 
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
    console.log('🔍 OAuth Callback Debug:');
    console.log('   Callback URL:', process.env.GOOGLE_CALLBACK_URL);
    console.log('   Client ID:', process.env.GOOGLE_CLIENT_ID?.substring(0, 30) + '...');
    console.log('   Code received:', req.query.code?.substring(0, 20) + '...');
    console.log('   Full URL:', req.protocol + '://' + req.get('host') + req.originalUrl);
    
    passport.authenticate('google', { session: false }, (err, user, info) => {
      if (err) {
        console.error('❌ Passport authentication error:', err.message);
        console.error('   Error code:', err.code);
        console.error('   Error type:', err.name);
        return res.redirect(`${process.env.FRONTEND_URL}/auth/login?error=google_auth_failed&detail=${err.code}`);
      }
      if (!user) {
        console.error('❌ No user returned from passport');
        return res.redirect(`${process.env.FRONTEND_URL}/auth/login?error=google_auth_failed`);
      }
      console.log('✅ OAuth successful, user:', user.email);
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
