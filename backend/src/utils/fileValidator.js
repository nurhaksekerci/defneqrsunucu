const fs = require('fs');
const path = require('path');

/**
 * File magic numbers (file signatures) for validation
 * Bu sayede dosya uzantısı değiştirilse bile gerçek dosya tipini tespit edebiliriz
 */
const FILE_SIGNATURES = {
  'image/jpeg': [
    { signature: [0xFF, 0xD8, 0xFF], offset: 0 },
  ],
  'image/png': [
    { signature: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A], offset: 0 },
  ],
  'image/gif': [
    { signature: [0x47, 0x49, 0x46, 0x38, 0x37, 0x61], offset: 0 }, // GIF87a
    { signature: [0x47, 0x49, 0x46, 0x38, 0x39, 0x61], offset: 0 }, // GIF89a
  ],
  'image/webp': [
    { signature: [0x52, 0x49, 0x46, 0x46], offset: 0 }, // RIFF
    { signature: [0x57, 0x45, 0x42, 0x50], offset: 8 }, // WEBP
  ],
};

/**
 * Check file magic number against known signatures
 * @param {Buffer} buffer - File buffer
 * @param {string} mimeType - Expected MIME type
 * @returns {boolean}
 */
const checkMagicNumber = (buffer, mimeType) => {
  const signatures = FILE_SIGNATURES[mimeType];
  
  if (!signatures) {
    return false;
  }

  for (const sig of signatures) {
    const { signature, offset } = sig;
    let match = true;
    
    for (let i = 0; i < signature.length; i++) {
      if (buffer[offset + i] !== signature[i]) {
        match = false;
        break;
      }
    }
    
    if (match) {
      return true;
    }
  }
  
  return false;
};

/**
 * Validate uploaded file content
 * @param {string} filePath - Path to uploaded file
 * @param {string} mimeType - Expected MIME type
 * @returns {Promise<{valid: boolean, message: string}>}
 */
exports.validateFileContent = async (filePath, mimeType) => {
  try {
    // Read first 12 bytes for magic number check
    const buffer = Buffer.alloc(12);
    const fd = fs.openSync(filePath, 'r');
    fs.readSync(fd, buffer, 0, 12, 0);
    fs.closeSync(fd);

    // Check magic number
    const isValid = checkMagicNumber(buffer, mimeType);

    if (!isValid) {
      return {
        valid: false,
        message: 'Dosya içeriği geçersiz. Gerçek bir resim dosyası yükleyin.'
      };
    }

    return {
      valid: true,
      message: 'Dosya geçerli'
    };
  } catch (error) {
    console.error('File validation error:', error);
    return {
      valid: false,
      message: 'Dosya doğrulanamadı'
    };
  }
};

/**
 * Sanitize filename to prevent path traversal attacks
 * @param {string} filename - Original filename
 * @returns {string} - Sanitized filename
 */
exports.sanitizeFilename = (filename) => {
  // Remove path separators and dangerous characters
  return filename
    .replace(/[\/\\]/g, '') // Remove path separators
    .replace(/\.\./g, '') // Remove parent directory references
    .replace(/[^\w\s.-]/g, '') // Remove special characters except . - _
    .trim()
    .substring(0, 255); // Limit length
};

/**
 * Check if file size is within limits
 * @param {number} fileSize - File size in bytes
 * @param {number} maxSize - Max allowed size in bytes
 * @returns {boolean}
 */
exports.isFileSizeValid = (fileSize, maxSize = 5 * 1024 * 1024) => {
  return fileSize > 0 && fileSize <= maxSize;
};

/**
 * Get file extension from filename
 * @param {string} filename
 * @returns {string}
 */
exports.getFileExtension = (filename) => {
  return path.extname(filename).toLowerCase();
};

/**
 * Check if extension is allowed
 * @param {string} extension - File extension (e.g., '.jpg')
 * @returns {boolean}
 */
exports.isExtensionAllowed = (extension) => {
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  return allowedExtensions.includes(extension.toLowerCase());
};

/**
 * Comprehensive file validation
 * @param {object} file - Multer file object
 * @param {string} filePath - Path to uploaded file
 * @returns {Promise<{valid: boolean, message: string}>}
 */
exports.validateUploadedFile = async (file, filePath) => {
  try {
    // 1. Check file size
    if (!exports.isFileSizeValid(file.size)) {
      return {
        valid: false,
        message: 'Dosya boyutu çok büyük (max 5MB)'
      };
    }

    // 2. Check extension
    const extension = exports.getFileExtension(file.originalname);
    if (!exports.isExtensionAllowed(extension)) {
      return {
        valid: false,
        message: 'Geçersiz dosya uzantısı'
      };
    }

    // 3. Check magic number (file content)
    const contentValidation = await exports.validateFileContent(filePath, file.mimetype);
    if (!contentValidation.valid) {
      return contentValidation;
    }

    return {
      valid: true,
      message: 'Dosya geçerli'
    };
  } catch (error) {
    console.error('File validation error:', error);
    return {
      valid: false,
      message: 'Dosya doğrulanamadı'
    };
  }
};

/**
 * Calculate file hash (for duplicate detection)
 * @param {string} filePath
 * @returns {Promise<string>}
 */
exports.calculateFileHash = (filePath) => {
  return new Promise((resolve, reject) => {
    const crypto = require('crypto');
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);

    stream.on('data', (data) => hash.update(data));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
};
