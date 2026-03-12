const express = require('express');
const router = express.Router();
const stockController = require('../controllers/stock.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { uuidParamValidation } = require('../middleware/validation.middleware');

router.use(authenticate);

router.get('/', stockController.getStocks);
router.post('/', stockController.upsertStock);
router.put('/:id', uuidParamValidation('id'), stockController.updateStockQuantity);
router.delete('/:id', uuidParamValidation('id'), stockController.deleteStock);

module.exports = router;
