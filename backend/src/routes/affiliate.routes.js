const express = require('express');
const router = express.Router();
const affiliateController = require('../controllers/affiliate.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { body } = require('express-validator');

// Affiliate başvuru validation
const applyAffiliateValidation = [
  body('bankName')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Banka adı en fazla 100 karakter olabilir'),
  body('accountHolder')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Hesap sahibi en fazla 100 karakter olabilir'),
  body('iban')
    .optional()
    .trim()
    .isLength({ max: 34 }).withMessage('IBAN en fazla 34 karakter olabilir')
];

// User routes (authenticated)
router.use(authenticate);

router.post('/apply', applyAffiliateValidation, affiliateController.applyForAffiliate);
router.get('/me', affiliateController.getMyAffiliateInfo);
router.get('/me/link', affiliateController.getMyReferralLink);
router.get('/me/referrals', affiliateController.getMyReferrals);
router.get('/me/commissions', affiliateController.getMyCommissions);
router.put('/me/bank-info', affiliateController.updateBankInfo);

// Admin routes
router.get('/all', authorize('ADMIN'), affiliateController.getAllAffiliates);
router.get('/pending-rewards', authorize('ADMIN'), affiliateController.getPendingReferralRewards);
router.post('/approve-all-rewards', authorize('ADMIN'), affiliateController.approveAllPendingReferralRewards);
router.post('/referrals/:id/approve-reward', authorize('ADMIN'), affiliateController.approveReferralReward);
router.put('/:id/status', authorize('ADMIN'), affiliateController.updateAffiliateStatus);
router.get('/stats', authorize('ADMIN'), affiliateController.getAffiliateStats);

// Admin - Settings
router.get('/settings', authorize('ADMIN'), affiliateController.getAffiliateSettings);
router.put('/settings', authorize('ADMIN'), affiliateController.updateAffiliateSettings);

// Admin - Payouts
router.post('/payouts', authorize('ADMIN'), affiliateController.createPayout);
router.get('/payouts', authorize('ADMIN'), affiliateController.getAllPayouts);
router.put('/payouts/:id', authorize('ADMIN'), affiliateController.updatePayoutStatus);

module.exports = router;
