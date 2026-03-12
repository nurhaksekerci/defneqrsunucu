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

router.post('/register', registerValidation, authController.register);
router.post('/login', loginValidation, authController.login);
router.post('/logout', authController.logout);
router.post('/logout-all', authenticate, authController.logoutAll);
router.post('/refresh', authController.refreshToken);
router.get('/me', authenticate, authController.getCurrentUser);
router.get('/sessions', authenticate, authController.getActiveSessions);
router.put('/profile', authenticate, authController.updateProfile);
router.put('/change-password', authenticate, changePasswordValidation, authController.changePassword);
router.post('/forgot-password', forgotPasswordValidation, authController.forgotPassword);
router.post('/reset-password', resetPasswordValidation, authController.resetPassword);

module.exports = router;
