const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscription.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

// Protected routes
router.use(authenticate);

// User routes
router.get('/my', subscriptionController.getMySubscription);
router.get('/my/history', subscriptionController.getMySubscriptions);

// Kullanıcı kendi planını satın alır (limit aşımında Premium'a yükseltme)
router.post('/subscribe', subscriptionController.subscribeSelf);

// Admin routes
router.post('/', authorize('ADMIN'), subscriptionController.createSubscription);
router.put('/:id/cancel', subscriptionController.cancelSubscription);

module.exports = router;
