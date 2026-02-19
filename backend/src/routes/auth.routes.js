const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');
const {
  registerValidation,
  loginValidation,
  changePasswordValidation,
  forgotPasswordValidation,
  resetPasswordValidation
} = require('../middleware/validation.middleware');

// POST /api/auth/register
router.post('/register', registerValidation, authController.register);

// POST /api/auth/login
router.post('/login', loginValidation, authController.login);

// POST /api/auth/logout
router.post('/logout', authController.logout);

// POST /api/auth/logout-all (logout from all devices)
router.post('/logout-all', authenticate, authController.logoutAll);

// POST /api/auth/refresh (get new access token)
router.post('/refresh', authController.refreshToken);

// GET /api/auth/me
router.get('/me', authenticate, authController.getCurrentUser);

// GET /api/auth/sessions (get active sessions)
router.get('/sessions', authenticate, authController.getActiveSessions);

// PUT /api/auth/change-password
router.put('/change-password', authenticate, changePasswordValidation, authController.changePassword);

// POST /api/auth/forgot-password
router.post('/forgot-password', forgotPasswordValidation, authController.forgotPassword);

// POST /api/auth/reset-password
router.post('/reset-password', resetPasswordValidation, authController.resetPassword);

// Note: Google OAuth routes are in oauth.routes.js

module.exports = router;
