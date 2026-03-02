const express = require('express');
const router = express.Router();
const wheelController = require('../controllers/wheel.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

// GET /api/wheel/config - Çark ayarları (herkes)
router.get('/config', wheelController.getConfig);

// Auth gerektiren route'lar
router.use(authenticate);

// GET /api/wheel/can-spin - Çevirebilir mi?
router.get('/can-spin', wheelController.canSpin);

// POST /api/wheel/spin - Çarkı çevir
router.post('/spin', wheelController.spin);

// Admin: GET /api/wheel/settings
router.get('/settings', authorize('ADMIN'), wheelController.getSettings);

// Admin: PUT /api/wheel/settings
router.put('/settings', authorize('ADMIN'), wheelController.updateSettings);

module.exports = router;
