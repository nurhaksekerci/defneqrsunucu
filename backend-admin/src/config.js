module.exports = {
  commonUrl: process.env.BACKEND_COMMON_URL || 'http://localhost:5001',
  qrUrl: process.env.BACKEND_QR_URL || 'http://localhost:5002',
  randevuUrl: process.env.BACKEND_RANDEVU_URL || 'http://localhost:5003',
  jwtSecret: process.env.JWT_SECRET
};
