const express = require('express');
const router = express.Router();
const promoCodeController = require('../controllers/promoCode.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { body } = require('express-validator');
const { handleValidationErrors } = require('../middleware/validation.middleware');

const createPromoCodeValidation = [
  body('code')
    .trim()
    .notEmpty()
    .withMessage('Kod gereklidir')
    .isLength({ min: 3, max: 50 })
    .withMessage('Kod 3-50 karakter arasında olmalıdır')
    .matches(/^[A-Z0-9_-]+$/i)
    .withMessage('Kod sadece harf, rakam, tire ve alt çizgi içerebilir'),
  body('type').isIn(['PERCENTAGE', 'FIXED', 'FREE_TRIAL']).withMessage('Geçersiz kod tipi'),
  body('discountValue').isFloat({ min: 0 }).withMessage('İndirim değeri 0 veya daha büyük olmalıdır'),
  body('maxUses').optional().isInt({ min: 1 }).withMessage('Maksimum kullanım 1 veya daha büyük olmalıdır'),
  body('validFrom').optional().isISO8601().withMessage('Geçerli tarih formatı değil'),
  body('validUntil').optional().isISO8601().withMessage('Geçerli tarih formatı değil'),
  body('description').optional().trim().isLength({ max: 500 }).withMessage('Açıklama en fazla 500 karakter olabilir'),
  handleValidationErrors,
];

router.get('/validate/:code', authenticate, promoCodeController.validatePromoCode);
router.post('/apply', authenticate, promoCodeController.applyPromoCode);
router.get('/my-usages', authenticate, promoCodeController.getMyPromoCodeUsages);

router.use(authenticate);
router.use(authorize('ADMIN'));

router.post('/', createPromoCodeValidation, promoCodeController.createPromoCode);
router.get('/', promoCodeController.getAllPromoCodes);
router.get('/:id/usages', promoCodeController.getPromoCodeUsages);
router.put('/:id', promoCodeController.updatePromoCode);
router.delete('/:id', promoCodeController.deletePromoCode);

module.exports = router;
