const express = require('express');
const router = express.Router();
const businessController = require('../controllers/business.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { uuidParamValidation } = require('../middleware/validation.middleware');

// Sadece DefneRandevu projesinden erişim
const requireRandevuProject = (req, res, next) => {
  if (req.project !== 'defnerandevu') {
    return res.status(403).json({
      success: false,
      message: 'Bu API sadece DefneRandevu üzerinden erişilebilir'
    });
  }
  next();
};

// Public - slug ile işletme (randevu alma sayfası)
router.get('/slug/:slug', requireRandevuProject, businessController.getBusinessBySlug);

// Protected
router.use(authenticate);
router.use(requireRandevuProject);

router.get('/my', businessController.getMyBusinesses);
router.get('/:id', uuidParamValidation('id'), businessController.getBusinessById);
router.post('/', businessController.createBusiness);
router.put('/:id', uuidParamValidation('id'), businessController.updateBusiness);
router.delete('/:id', uuidParamValidation('id'), businessController.deleteBusiness);

module.exports = router;
