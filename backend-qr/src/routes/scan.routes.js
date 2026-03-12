const express = require('express');
const router = express.Router();
const scanController = require('../controllers/scan.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.post('/record/:slug', scanController.recordScan);

router.use(authenticate);

router.get('/stats/:restaurantId', scanController.getScanStats);
router.get('/all', authorize('ADMIN'), scanController.getAllScansStats);

module.exports = router;
