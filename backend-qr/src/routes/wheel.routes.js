const express = require('express');
const router = express.Router();
const wheelController = require('../controllers/wheel.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.get('/config', wheelController.getConfig);

router.use(authenticate);

router.get('/can-spin', wheelController.canSpin);
router.post('/spin', wheelController.spin);

router.get('/settings', authorize('ADMIN'), wheelController.getSettings);
router.put('/settings', authorize('ADMIN'), wheelController.updateSettings);

module.exports = router;
