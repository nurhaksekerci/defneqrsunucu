const express = require('express');
const router = express.Router();
const tableController = require('../controllers/table.controller');
const { authenticate } = require('../middleware/auth.middleware');
const {
  uuidParamValidation,
  createTableValidation
} = require('../middleware/validation.middleware');

// Protected routes
router.use(authenticate);

router.get('/', tableController.getTables);
router.post('/', createTableValidation, tableController.createTable);
router.post('/bulk', tableController.createBulkTables);
router.post('/delete-all', tableController.deleteAllTables);
router.put('/:id', uuidParamValidation('id'), tableController.updateTable);
router.delete('/:id', uuidParamValidation('id'), tableController.deleteTable);

module.exports = router;
