const express = require('express');
const router = express.Router();
const planController = require('../controllers/plan.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { uuidParamValidation, createPlanValidation } = require('../middleware/validation.middleware');

router.get('/', planController.getAllPlans);
router.get('/:id', uuidParamValidation('id'), planController.getPlanById);

router.post('/', authenticate, authorize('ADMIN'), createPlanValidation, planController.createPlan);
router.put('/:id', authenticate, authorize('ADMIN'), uuidParamValidation('id'), planController.updatePlan);
router.delete('/:id', authenticate, authorize('ADMIN'), uuidParamValidation('id'), planController.deletePlan);
router.post('/seed', authenticate, authorize('ADMIN'), planController.seedPlans);

module.exports = router;
