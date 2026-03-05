const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.use(authenticate);
router.use(authorize('ADMIN', 'STAFF'));

router.get('/dashboard', adminController.getDashboardData);
router.get('/stats', adminController.getDashboardStats);

module.exports = router;
