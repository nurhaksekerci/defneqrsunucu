const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { sanitizeFilename, isExtensionAllowed } = require('../utils/fileValidator');

// Uploads klasörünü oluştur
const uploadDir = path.join(__dirname, '../../public/uploads');
console.log('📁 Upload directory:', uploadDir);

// Ensure upload directory exists and is writable
if (!fs.existsSync(uploadDir)) {
  try {
    fs.mkdirSync(uploadDir, { recursive: true, mode: 0o755 });
    console.log('✅ Upload directory created');
  } catch (error) {
    console.error('❌ Failed to create upload directory:', error);
    throw new Error('Upload directory initialization failed');
  }
} else {
  console.log('✅ Upload directory exists');
}

// Verify directory is writable
try {
  fs.accessSync(uploadDir, fs.constants.W_OK);
  console.log('✅ Upload directory is writable');
} catch (error) {
  console.error('❌ Upload directory is not writable:', error);
  throw new Error('Upload directory is not writable');
}

// Storage konfigürasyonu
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Path traversal koruması - sadece uploadDir içine yazabilir
    const safePath = path.resolve(uploadDir);
    cb(null, safePath);
  },
  filename: (req, file, cb) => {
    try {
      // Sanitize original filename
      const sanitized = sanitizeFilename(file.originalname);
      const ext = path.extname(sanitized).toLowerCase();
      
      // Validate extension
      if (!isExtensionAllowed(ext)) {
        return cb(new Error('Geçersiz dosya uzantısı'));
      }
      
      // Türkçe karakter sorununu önlemek için sadece timestamp ve random sayı kullan
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      
      // Güvenli dosya adı: image-timestamp-random.ext
      const filename = `image-${uniqueSuffix}${ext}`;
      
      // Final path traversal check
      const finalPath = path.join(uploadDir, filename);
      if (!finalPath.startsWith(uploadDir)) {
        return cb(new Error('Path traversal attempt detected'));
      }
      
      cb(null, filename);
    } catch (error) {
      cb(error);
    }
  }
});

// File filter - sadece resim dosyaları (SIKI KONTROL)
const fileFilter = (req, file, cb) => {
  try {
    // 1. MIME type whitelist
    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'image/webp'
    ];
    
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return cb(new Error('Geçersiz dosya tipi. Sadece resim dosyaları kabul edilir.'));
    }

    // 2. Extension whitelist
    const ext = path.extname(file.originalname).toLowerCase();
    if (!isExtensionAllowed(ext)) {
      return cb(new Error('Geçersiz dosya uzantısı'));
    }

    // 3. Filename length check
    if (file.originalname.length > 255) {
      return cb(new Error('Dosya adı çok uzun'));
    }

    // 4. Sanitize and validate filename
    const sanitized = sanitizeFilename(file.originalname);
    if (!sanitized || sanitized.length === 0) {
      return cb(new Error('Geçersiz dosya adı'));
    }

    cb(null, true);
  } catch (error) {
    cb(error);
  }
};

// Multer konfigürasyonu
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
    files: 1, // Tek seferde max 1 dosya
    fields: 10, // Max 10 field
    parts: 20 // Max 20 parts
  }
});

/**
 * Error handler middleware for multer
 */
const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    // Multer specific errors
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'Dosya boyutu çok büyük. Maksimum 5MB yükleyebilirsiniz.'
      });
    }
    
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Tek seferde en fazla 1 dosya yükleyebilirsiniz.'
      });
    }
    
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Beklenmeyen dosya alanı.'
      });
    }

    return res.status(400).json({
      success: false,
      message: `Dosya yükleme hatası: ${error.message}`
    });
  }
  
  // Other errors
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Dosya yükleme başarısız'
    });
  }

  next();
};

module.exports = { upload, handleUploadError };
