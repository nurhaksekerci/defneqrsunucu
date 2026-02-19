const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report.controller');
const { authenticate } = require('../middleware/auth.middleware');

// All routes protected
router.use(authenticate);

router.get('/sales', reportController.getSalesReport);
router.get('/staff', reportController.getStaffReport);
router.get('/stock', reportController.getStockReport);
router.get('/dashboard', reportController.getDashboardStats);

module.exports = router;
