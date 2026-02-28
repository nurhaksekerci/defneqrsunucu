const express = require('express');
const router = express.Router();
const restaurantController = require('../controllers/restaurant.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { checkRestaurantLimitMiddleware } = require('../middleware/planLimit.middleware');
const {
  slugParamValidation,
  uuidParamValidation,
  createRestaurantValidation,
  updateRestaurantValidation
} = require('../middleware/validation.middleware');

// Public routes
router.get('/slug/:slug', slugParamValidation, restaurantController.getRestaurantBySlug);
router.get('/public-slugs', restaurantController.getPublicSlugs); // For sitemap.xml (SEO)

// Protected routes
router.use(authenticate);

router.get('/my', restaurantController.getMyRestaurants);
router.get('/', authorize('ADMIN', 'STAFF'), restaurantController.getAllRestaurants);
router.get('/:id', uuidParamValidation('id'), restaurantController.getRestaurantById);
router.post('/', authorize('RESTAURANT_OWNER', 'ADMIN'), checkRestaurantLimitMiddleware, createRestaurantValidation, restaurantController.createRestaurant);
router.put('/:id', updateRestaurantValidation, restaurantController.updateRestaurant);
router.delete('/:id', uuidParamValidation('id'), restaurantController.deleteRestaurant);

module.exports = router;
