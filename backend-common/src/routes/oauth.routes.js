const express = require('express');
const router = express.Router();
const passport = require('../config/passport');
const oauthController = require('../controllers/oauth.controller');

router.get('/google',
  (req, res, next) => {
    const returnTo = req.query.return === 'randevu' ? 'randevu' : 'defneqr';
    res.cookie('oauth_return', returnTo, {
      maxAge: 10 * 60 * 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    });
    next();
  },
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false
  })
);

router.get('/google/callback',
  (req, res, next) => {
    passport.authenticate('google', { session: false }, (err, user, info) => {
      const oauthFrontend = req.cookies?.oauth_return === 'randevu'
        ? (process.env.RANDEVU_FRONTEND_URL || process.env.RANDEVU_SITE_URL || 'https://randevu.defneqr.com')
        : (process.env.FRONTEND_URL || 'https://defneqr.com');

      if (err) {
        return res.redirect(`${oauthFrontend}/auth/login?error=google_auth_failed&detail=${err.code || ''}`);
      }

      if (!user) {
        return res.redirect(`${oauthFrontend}/auth/login?error=google_auth_failed`);
      }

      req.user = user;
      next();
    })(req, res, next);
  },
  oauthController.googleCallback
);

router.get('/google/failure', oauthController.googleFailure);

module.exports = router;
