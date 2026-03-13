/**
 * Internal API - backend-common gibi servislerden çağrılır (auth gerektirmez)
 */
const express = require('express');
const router = express.Router();
const { processReferral } = require('../utils/referralHelper');

// POST /api/internal/referrals/process - Kayıt sonrası referral oluştur
router.post('/referrals/process', async (req, res) => {
  try {
    const { userId, referralCode, ipAddress, userAgent } = req.body || {};
    if (!userId || !referralCode) {
      return res.status(400).json({ success: false, message: 'userId ve referralCode gerekli' });
    }
    const referral = await processReferral(referralCode, userId, ipAddress, userAgent);
    res.json({ success: true, data: referral ? { id: referral.id } : null });
  } catch (err) {
    console.error('Internal referrals/process error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
