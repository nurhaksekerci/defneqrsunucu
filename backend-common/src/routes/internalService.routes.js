/**
 * Servisler arası internal API - sadece BACKEND_INTERNAL_SECRET ile erişilebilir.
 * User JWT gerekmez (backend-qr, backend-admin gibi servislerden çağrılır).
 */
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');

const internalSecret = process.env.BACKEND_INTERNAL_SECRET;

const internalAuth = (req, res, next) => {
  const secret = req.headers['x-internal-secret'];
  if (!internalSecret || secret !== internalSecret) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
  next();
};

router.use(internalAuth);
router.get('/users-by-ids', adminController.getUsersByIds);

module.exports = router;
