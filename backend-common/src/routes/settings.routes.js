const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settings.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { updateSettingsValidation } = require('../middleware/validation.middleware');

router.get('/', settingsController.getSettings);
router.put('/', authenticate, authorize('ADMIN'), updateSettingsValidation, settingsController.updateSettings);

module.exports = router;
