const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');
const { authenticate } = require('../middleware/auth.middleware');
const {
  createProductValidation,
  updateProductValidation,
  uuidParamValidation
} = require('../middleware/validation.middleware');

// Public routes
router.get('/', productController.getProducts);
router.get('/:id', uuidParamValidation('id'), productController.getProductById);

// Protected routes
router.use(authenticate);

router.post('/', createProductValidation, productController.createProduct);
router.post('/copy-global', productController.copyGlobalProducts);
router.post('/reorder', productController.reorderProducts);
router.put('/:id', updateProductValidation, productController.updateProduct);
router.delete('/:id', uuidParamValidation('id'), productController.deleteProduct);

module.exports = router;
