const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const { authenticate } = require('../middleware/auth.middleware');

// All routes protected
router.use(authenticate);

router.get('/', paymentController.getPayments);
router.post('/', paymentController.createPayment);
router.get('/daily-summary', paymentController.getDailySummary);

module.exports = router;
