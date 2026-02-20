const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/category.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { checkCategoryLimitMiddleware } = require('../middleware/planLimit.middleware');
const {
  createCategoryValidation,
  updateCategoryValidation,
  uuidParamValidation
} = require('../middleware/validation.middleware');

// Public route
router.get('/', categoryController.getCategories);

// Protected routes
router.use(authenticate);

router.post('/', checkCategoryLimitMiddleware, createCategoryValidation, categoryController.createCategory);
router.post('/copy-global', checkCategoryLimitMiddleware, categoryController.copyGlobalCategories);
router.post('/copy-category-with-products', checkCategoryLimitMiddleware, categoryController.copyGlobalCategoryWithProducts);
router.post('/reorder', categoryController.reorderCategories);
router.put('/:id', updateCategoryValidation, categoryController.updateCategory);
router.delete('/:id', uuidParamValidation('id'), categoryController.deleteCategory);

module.exports = router;
