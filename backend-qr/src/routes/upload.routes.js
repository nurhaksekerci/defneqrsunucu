const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
const { upload, handleUploadError } = require('../middleware/upload.middleware');
const { authenticate } = require('../middleware/auth.middleware');

const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: 'Çok fazla dosya yükleme isteği. Lütfen 15 dakika sonra tekrar deneyin.',
});

router.post(
  '/image',
  authenticate,
  uploadLimiter,
  upload.single('image'),
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Dosya yüklenemedi' });
    }

    const backendBaseUrl = process.env.NEXT_PUBLIC_API_URL
      ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api$/, '')
      : `${req.protocol}://${req.get('host')}`;
    const fileUrl = `${backendBaseUrl}/uploads/${req.file.filename}`;

    res.json({
      success: true,
      message: 'Dosya başarıyla yüklendi',
      data: {
        filename: req.file.filename,
        url: fileUrl,
        path: `/uploads/${req.file.filename}`,
        size: req.file.size,
        mimetype: req.file.mimetype,
      },
    });
  }
);

router.use(handleUploadError);

module.exports = router;
