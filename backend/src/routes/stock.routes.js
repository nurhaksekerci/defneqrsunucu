const express = require('express');
const router = express.Router();
const stockController = require('../controllers/stock.controller');
const { authenticate } = require('../middleware/auth.middleware');

// All routes protected
router.use(authenticate);

router.get('/', stockController.getStocks);
router.post('/', stockController.upsertStock);
router.put('/:id', stockController.updateStockQuantity);
router.delete('/:id', stockController.deleteStock);

module.exports = router;
