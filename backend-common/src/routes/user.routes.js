const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const {
  uuidParamValidation,
  updateUserRoleValidation
} = require('../middleware/validation.middleware');

router.use(authenticate);
router.use(authorize('ADMIN', 'STAFF'));

router.get('/', userController.getAllUsers);
router.get('/stats', userController.getUserStats);
router.get('/:id', uuidParamValidation('id'), userController.getUserById);
router.put('/:id/role', authorize('ADMIN'), updateUserRoleValidation, userController.updateUserRole);
router.delete('/:id/hard', uuidParamValidation('id'), authorize('ADMIN'), userController.hardDeleteUser);
router.put('/:id/restore', authorize('ADMIN'), uuidParamValidation('id'), userController.restoreUser);
router.delete('/:id', authorize('ADMIN'), uuidParamValidation('id'), userController.deleteUser);

module.exports = router;
