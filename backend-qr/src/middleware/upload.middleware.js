const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { sanitizeFilename, isExtensionAllowed } = require('../utils/fileValidator');

const uploadDir = path.join(__dirname, '../../public/uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.resolve(uploadDir)),
  filename: (req, file, cb) => {
    const sanitized = sanitizeFilename(file.originalname);
    const ext = path.extname(sanitized).toLowerCase();
    if (!isExtensionAllowed(ext)) return cb(new Error('Geçersiz dosya uzantısı'));
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `image-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedMime = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedMime.includes(file.mimetype)) return cb(new Error('Geçersiz dosya tipi'));
  const ext = path.extname(file.originalname).toLowerCase();
  if (!isExtensionAllowed(ext)) return cb(new Error('Geçersiz dosya uzantısı'));
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
});

const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ success: false, message: 'Dosya boyutu çok büyük (max 5MB)' });
    if (err.code === 'LIMIT_FILE_COUNT') return res.status(400).json({ success: false, message: 'Tek seferde en fazla 1 dosya' });
  }
  if (err) return res.status(400).json({ success: false, message: err.message || 'Dosya yükleme başarısız' });
  next();
};

module.exports = { upload, handleUploadError };
