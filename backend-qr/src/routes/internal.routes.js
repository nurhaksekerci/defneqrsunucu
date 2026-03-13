/**
 * Internal API - backend-common gibi servislerden çağrılır (auth gerektirmez)
 */
const express = require('express');
const router = express.Router();
const { processReferral } = require('../utils/referralHelper');
const { cascadeDeleteUser } = require('../services/userCascadeDelete');

function requireInternalSecret(req, res, next) {
  const secret = process.env.BACKEND_INTERNAL_SECRET;
  if (!secret || req.headers['x-internal-secret'] !== secret) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
  next();
}

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

// DELETE /api/internal/users/:userId - Kullanıcı silindiğinde cascade (affiliate, restoranlar, abonelikler vb.)
router.delete('/users/:userId', requireInternalSecret, async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) return res.status(400).json({ success: false, message: 'userId gerekli' });
    const results = await cascadeDeleteUser(userId);
    res.json({ success: true, data: results });
  } catch (err) {
    console.error('Internal users cascade delete error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
