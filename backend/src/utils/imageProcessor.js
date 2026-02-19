const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;

/**
 * Image optimization configuration
 */
const IMAGE_CONFIG = {
  // Quality settings
  jpeg: {
    quality: parseInt(process.env.IMAGE_JPEG_QUALITY) || 85,
  },
  webp: {
    quality: parseInt(process.env.IMAGE_WEBP_QUALITY) || 85,
  },
  png: {
    compressionLevel: parseInt(process.env.IMAGE_PNG_COMPRESSION) || 8,
  },

  // Size configurations
  sizes: {
    thumbnail: {
      width: 200,
      height: 200,
      fit: 'cover',
    },
    medium: {
      width: 800,
      height: 800,
      fit: 'inside',
    },
    large: {
      width: 1920,
      height: 1920,
      fit: 'inside',
    },
  },

  // Default resize for uploads (medium)
  defaultResize: {
    width: parseInt(process.env.IMAGE_MAX_WIDTH) || 1200,
    height: parseInt(process.env.IMAGE_MAX_HEIGHT) || 1200,
    fit: 'inside',
    withoutEnlargement: true,
  },

  // Enable/disable features
  enableWebP: process.env.ENABLE_WEBP_CONVERSION !== 'false', // true by default
  enableThumbnail: process.env.ENABLE_THUMBNAIL_GENERATION === 'true',
};

/**
 * Process and optimize an uploaded image
 * @param {string} inputPath - Path to the original image
 * @param {string} outputDir - Directory to save processed images
 * @param {string} filename - Base filename (without extension)
 * @returns {Promise<object>} - Object with paths to processed images
 */
exports.processUploadedImage = async (inputPath, outputDir, filename) => {
  try {
    const results = {
      original: path.basename(inputPath),
      optimized: null,
      webp: null,
      thumbnail: null,
      metadata: null,
    };

    // Get image metadata
    const image = sharp(inputPath);
    const metadata = await image.metadata();
    
    results.metadata = {
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      size: metadata.size,
    };

    // Determine output format (keep original or convert)
    const ext = path.extname(filename).toLowerCase();
    const baseName = path.basename(filename, ext);

    // 1. Create optimized version (resized if needed)
    const optimizedPath = path.join(outputDir, `${baseName}-optimized${ext}`);
    
    let pipeline = sharp(inputPath);
    
    // Resize if image is too large
    if (metadata.width > IMAGE_CONFIG.defaultResize.width || 
        metadata.height > IMAGE_CONFIG.defaultResize.height) {
      pipeline = pipeline.resize(IMAGE_CONFIG.defaultResize);
    }

    // Apply format-specific optimization
    switch (metadata.format) {
      case 'jpeg':
      case 'jpg':
        await pipeline
          .jpeg(IMAGE_CONFIG.jpeg)
          .toFile(optimizedPath);
        break;
      case 'png':
        await pipeline
          .png(IMAGE_CONFIG.png)
          .toFile(optimizedPath);
        break;
      case 'webp':
        await pipeline
          .webp(IMAGE_CONFIG.webp)
          .toFile(optimizedPath);
        break;
      default:
        // For other formats, just copy
        await fs.copyFile(inputPath, optimizedPath);
    }

    results.optimized = path.basename(optimizedPath);

    // 2. Generate WebP version (if enabled and not already webp)
    if (IMAGE_CONFIG.enableWebP && metadata.format !== 'webp') {
      const webpPath = path.join(outputDir, `${baseName}.webp`);
      
      await sharp(inputPath)
        .resize(IMAGE_CONFIG.defaultResize)
        .webp(IMAGE_CONFIG.webp)
        .toFile(webpPath);
      
      results.webp = path.basename(webpPath);
    }

    // 3. Generate thumbnail (if enabled)
    if (IMAGE_CONFIG.enableThumbnail) {
      const thumbnailPath = path.join(outputDir, `${baseName}-thumb${ext}`);
      
      await sharp(inputPath)
        .resize(IMAGE_CONFIG.sizes.thumbnail)
        .toFile(thumbnailPath);
      
      results.thumbnail = path.basename(thumbnailPath);
    }

    // 4. Delete original file (keep only optimized versions)
    if (process.env.DELETE_ORIGINAL_UPLOADS === 'true') {
      await fs.unlink(inputPath);
    }

    return results;

  } catch (error) {
    console.error('Image processing error:', error);
    throw new Error(`Failed to process image: ${error.message}`);
  }
};

/**
 * Resize image to specific dimensions
 * @param {string} inputPath - Path to the image
 * @param {string} outputPath - Path to save resized image
 * @param {object} options - Resize options (width, height, fit)
 */
exports.resizeImage = async (inputPath, outputPath, options = {}) => {
  const { width, height, fit = 'inside' } = options;

  await sharp(inputPath)
    .resize({ width, height, fit, withoutEnlargement: true })
    .toFile(outputPath);
};

/**
 * Convert image to WebP format
 * @param {string} inputPath - Path to the image
 * @param {string} outputPath - Path to save WebP image
 * @param {number} quality - WebP quality (1-100)
 */
exports.convertToWebP = async (inputPath, outputPath, quality = 85) => {
  await sharp(inputPath)
    .webp({ quality })
    .toFile(outputPath);
};

/**
 * Generate multiple sizes of an image
 * @param {string} inputPath - Path to the image
 * @param {string} outputDir - Directory to save resized images
 * @param {string} baseName - Base filename
 * @returns {Promise<object>} - Object with paths to all generated sizes
 */
exports.generateImageSizes = async (inputPath, outputDir, baseName) => {
  const results = {};

  for (const [sizeName, config] of Object.entries(IMAGE_CONFIG.sizes)) {
    const outputPath = path.join(outputDir, `${baseName}-${sizeName}.jpg`);
    
    await sharp(inputPath)
      .resize(config)
      .jpeg(IMAGE_CONFIG.jpeg)
      .toFile(outputPath);
    
    results[sizeName] = path.basename(outputPath);
  }

  return results;
};

/**
 * Get image metadata without processing
 * @param {string} imagePath - Path to the image
 * @returns {Promise<object>} - Image metadata
 */
exports.getImageMetadata = async (imagePath) => {
  const metadata = await sharp(imagePath).metadata();
  
  return {
    width: metadata.width,
    height: metadata.height,
    format: metadata.format,
    size: metadata.size,
    space: metadata.space,
    channels: metadata.channels,
    hasAlpha: metadata.hasAlpha,
  };
};

/**
 * Compress image without resizing
 * @param {string} inputPath - Path to the image
 * @param {string} outputPath - Path to save compressed image
 */
exports.compressImage = async (inputPath, outputPath) => {
  const metadata = await sharp(inputPath).metadata();

  switch (metadata.format) {
    case 'jpeg':
    case 'jpg':
      await sharp(inputPath)
        .jpeg(IMAGE_CONFIG.jpeg)
        .toFile(outputPath);
      break;
    case 'png':
      await sharp(inputPath)
        .png(IMAGE_CONFIG.png)
        .toFile(outputPath);
      break;
    case 'webp':
      await sharp(inputPath)
        .webp(IMAGE_CONFIG.webp)
        .toFile(outputPath);
      break;
    default:
      throw new Error(`Unsupported image format: ${metadata.format}`);
  }
};

/**
 * Calculate file size reduction
 * @param {string} originalPath - Path to original file
 * @param {string} optimizedPath - Path to optimized file
 * @returns {Promise<object>} - Size comparison
 */
exports.calculateSizeReduction = async (originalPath, optimizedPath) => {
  const originalStats = await fs.stat(originalPath);
  const optimizedStats = await fs.stat(optimizedPath);

  const originalSize = originalStats.size;
  const optimizedSize = optimizedStats.size;
  const reduction = originalSize - optimizedSize;
  const reductionPercent = ((reduction / originalSize) * 100).toFixed(2);

  return {
    originalSize,
    optimizedSize,
    reduction,
    reductionPercent: parseFloat(reductionPercent),
  };
};

module.exports = {
  ...exports,
  IMAGE_CONFIG,
};
