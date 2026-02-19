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
  passport.authenticate('google', { 
    session: false,
    failureRedirect: '/api/auth/google/failure'
  }),
  oauthController.googleCallback
);

/**
 * @route   GET /api/auth/google/failure
 * @desc    Google OAuth başarısız durumu
 * @access  Public
 */
router.get('/google/failure', oauthController.googleFailure);

module.exports = router;
