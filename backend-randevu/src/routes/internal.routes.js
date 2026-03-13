/**
 * Internal API - backend-common'dan cascade delete için çağrılır
 */
const express = require('express');
const router = express.Router();
const prisma = require('../config/database');

function requireInternalSecret(req, res, next) {
  const secret = process.env.BACKEND_INTERNAL_SECRET;
  if (!secret || req.headers['x-internal-secret'] !== secret) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
  next();
}

// DELETE /api/internal/users/:userId - Kullanıcıya ait işletmeleri sil
router.delete('/users/:userId', requireInternalSecret, async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ success: false, message: 'userId gerekli' });
    }

    const result = await prisma.appointmentBusiness.deleteMany({
      where: { ownerId: userId }
    });

    res.json({
      success: true,
      message: `${result.count} işletme silindi`,
      data: { businessesDeleted: result.count }
    });
  } catch (err) {
    console.error('Internal randevu cascade delete error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
