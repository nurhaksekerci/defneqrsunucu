const express = require('express');
const router = express.Router();
const scanController = require('../controllers/scan.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

// Public route - QR menü taraması kaydet
router.post('/record/:slug', scanController.recordScan);

// Protected routes
router.use(authenticate);

// Restoran sahibi kendi istatistiklerini görebilir
router.get('/stats/:restaurantId', scanController.getScanStats);

// Admin tüm istatistikleri görebilir
router.get('/all', authorize('ADMIN'), scanController.getAllScansStats);

module.exports = router;
