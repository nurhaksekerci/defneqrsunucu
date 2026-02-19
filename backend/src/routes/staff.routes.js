const express = require('express');
const router = express.Router();
const staffController = require('../controllers/staff.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

// Tüm route'lar authentication gerektiriyor
router.use(authenticate);

// Sadece ADMIN ve RESTAURANT_OWNER yetkili
router.use(authorize(['ADMIN', 'RESTAURANT_OWNER']));

// Restorana ait personel listele
router.get('/:restaurantId/staff', staffController.getRestaurantStaff);

// Yeni personel ekle
router.post('/:restaurantId/staff', staffController.createStaff);

// Personel güncelle
router.put('/:restaurantId/staff/:staffId', staffController.updateStaff);

// Personel sil (soft delete)
router.delete('/:restaurantId/staff/:staffId', staffController.deleteStaff);

module.exports = router;
