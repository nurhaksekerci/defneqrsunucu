const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const fs = require('fs');
const path = require('path');
const { upload, handleUploadError } = require('../middleware/upload.middleware');
const { authenticate } = require('../middleware/auth.middleware');
const { validateUploadedFile, calculateFileHash } = require('../utils/fileValidator');
const { scanFile } = require('../utils/virusScanner');
const { processUploadedImage } = require('../utils/imageProcessor');
const { recordFileUpload } = require('../utils/metrics');

// Upload-specific rate limiting (more strict)
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Max 50 uploads per 15 minutes
  message: 'Çok fazla dosya yükleme isteği. Lütfen 15 dakika sonra tekrar deneyin.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Image upload endpoint with enhanced security
router.post('/image', 
  authenticate, 
  uploadLimiter,
  upload.single('image'),
  async (req, res) => {
    let uploadedFilePath = null;
    
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Dosya yüklenemedi'
        });
      }

      uploadedFilePath = req.file.path;

      // Comprehensive file validation (magic number check)
      const validation = await validateUploadedFile(req.file, uploadedFilePath);
      
      if (!validation.valid) {
        // Delete invalid file
        fs.unlinkSync(uploadedFilePath);
        
        return res.status(400).json({
          success: false,
          message: validation.message
        });
      }

      // Virus scanning (optional - requires ClamAV)
      const virusScanResult = await scanFile(uploadedFilePath);
      
      if (!virusScanResult.safe) {
        // Delete infected file
        fs.unlinkSync(uploadedFilePath);
        
        console.error('🦠 Virus detected in uploaded file:', {
          filename: req.file.filename,
          user: req.user.id,
          message: virusScanResult.message
        });
        
        return res.status(400).json({
          success: false,
          message: 'Dosya güvenlik kontrolünden geçemedi. Lütfen başka bir dosya deneyin.'
        });
      }

      // Calculate file hash for duplicate detection (optional)
      // const fileHash = await calculateFileHash(uploadedFilePath);
      // TODO: Check if file already exists and return existing URL

      // Security: Ensure file path is within upload directory (path traversal check)
      const safePath = path.resolve(uploadedFilePath);
      const safeUploadDir = path.resolve(path.join(__dirname, '../../public/uploads'));
      
      if (!safePath.startsWith(safeUploadDir)) {
        // Path traversal detected!
        fs.unlinkSync(uploadedFilePath);
        console.error('🚨 Path traversal attempt detected:', safePath);
        
        return res.status(403).json({
          success: false,
          message: 'Güvenlik ihlali tespit edildi'
        });
      }

      // Image Processing: Optimize, resize, and generate WebP
      let processedImages = null;
      const isImage = req.file.mimetype.startsWith('image/');
      
      if (isImage && process.env.ENABLE_IMAGE_OPTIMIZATION !== 'false') {
        try {
          const outputDir = path.dirname(uploadedFilePath);
          const filename = req.file.filename;
          
          processedImages = await processUploadedImage(uploadedFilePath, outputDir, filename);
          
          console.log('🖼️  Image optimized:', {
            original: processedImages.original,
            optimized: processedImages.optimized,
            webp: processedImages.webp,
            thumbnail: processedImages.thumbnail,
            metadata: processedImages.metadata
          });
        } catch (imageError) {
          // Image processing failed, but file is uploaded successfully
          // Log error but don't fail the upload
          console.error('Image processing warning:', imageError);
        }
      }

      // Determine which file to return (optimized or original)
      const finalFilename = (processedImages && processedImages.optimized) 
        ? processedImages.optimized 
        : req.file.filename;
      
      // Use environment variable for backend URL (for correct URL behind reverse proxy)
      const backendBaseUrl = process.env.NEXT_PUBLIC_API_URL 
        ? process.env.NEXT_PUBLIC_API_URL.replace('/api', '')
        : `${req.protocol}://${req.get('host')}`;
      const fileUrl = `${backendBaseUrl}/uploads/${finalFilename}`;
      
      // Log successful upload
      console.log('📤 File uploaded:', {
        filename: finalFilename,
        size: req.file.size,
        mimetype: req.file.mimetype,
        user: req.user.id,
        processed: processedImages ? true : false
      });
      
      // Record successful file upload metric
      const fileType = req.file.mimetype.startsWith('image/') ? 'image' : 'file';
      recordFileUpload(fileType, 'success');
      
      res.json({
        success: true,
        message: 'Dosya başarıyla yüklendi',
        data: {
          filename: finalFilename,
          url: fileUrl,
          path: `/uploads/${finalFilename}`,
          size: req.file.size,
          mimetype: req.file.mimetype,
          ...(processedImages && {
            variants: {
              optimized: processedImages.optimized ? `/uploads/${processedImages.optimized}` : null,
              webp: processedImages.webp ? `/uploads/${processedImages.webp}` : null,
              thumbnail: processedImages.thumbnail ? `/uploads/${processedImages.thumbnail}` : null,
            },
            metadata: processedImages.metadata
          })
        }
      });
    } catch (error) {
      console.error('Upload error:', error);
      
      // Clean up file on error
      if (uploadedFilePath && fs.existsSync(uploadedFilePath)) {
        try {
          fs.unlinkSync(uploadedFilePath);
        } catch (unlinkError) {
          console.error('Failed to delete file:', unlinkError);
        }
      }
      
      res.status(500).json({
        success: false,
        message: 'Dosya yüklenirken bir hata oluştu'
      });
    }
});

// Error handling for multer
router.use(handleUploadError);

module.exports = router;
