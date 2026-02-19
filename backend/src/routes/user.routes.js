const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const {
  uuidParamValidation,
  updateUserRoleValidation
} = require('../middleware/validation.middleware');

// Tüm route'lar authentication ve ADMIN yetkisi gerektiriyor
router.use(authenticate);
router.use(authorize('ADMIN', 'STAFF'));

/**
 * @route   GET /api/users
 * @desc    Tüm kullanıcıları listele
 * @access  Admin, Staff
 */
router.get('/', userController.getAllUsers);

/**
 * @route   GET /api/users/stats
 * @desc    Kullanıcı istatistikleri
 * @access  Admin, Staff
 */
router.get('/stats', userController.getUserStats);

/**
 * @route   GET /api/users/:id
 * @desc    Kullanıcı detayı
 * @access  Admin, Staff
 */
router.get('/:id', uuidParamValidation('id'), userController.getUserById);

/**
 * @route   PUT /api/users/:id/role
 * @desc    Kullanıcı rolü güncelle
 * @access  Admin
 */
router.put('/:id/role', authorize('ADMIN'), updateUserRoleValidation, userController.updateUserRole);

/**
 * @route   DELETE /api/users/:id
 * @desc    Kullanıcı sil (soft delete)
 * @access  Admin
 */
router.delete('/:id', authorize('ADMIN'), uuidParamValidation('id'), userController.deleteUser);

module.exports = router;
