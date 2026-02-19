const { body, param, query, validationResult } = require('express-validator');
const { sanitizeHtml, sanitizeEmail, sanitizeUrl, sanitizePhone } = require('../utils/sanitizer');

/**
 * Middleware to handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const firstError = errors.array()[0];
    return res.status(400).json({
      success: false,
      message: firstError.msg,
      errors: errors.array()
    });
  }
  
  next();
};

/**
 * Auth Validations
 */
exports.registerValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email gereklidir')
    .isEmail().withMessage('Geçerli bir email adresi girin')
    .normalizeEmail()
    .customSanitizer(sanitizeEmail),
  
  body('fullName')
    .trim()
    .notEmpty().withMessage('Ad Soyad gereklidir')
    .isLength({ min: 2, max: 100 }).withMessage('Ad Soyad 2-100 karakter olmalıdır')
    .customSanitizer(sanitizeHtml),
  
  body('username')
    .optional()
    .trim()
    .isLength({ min: 3, max: 30 }).withMessage('Kullanıcı adı 3-30 karakter olmalıdır')
    .matches(/^[a-zA-Z0-9_-]+$/).withMessage('Kullanıcı adı sadece harf, rakam, tire ve alt çizgi içerebilir')
    .customSanitizer(sanitizeHtml),
  
  body('password')
    .notEmpty().withMessage('Şifre gereklidir')
    .isLength({ min: 8 }).withMessage('Şifre en az 8 karakter olmalıdır'),
  
  handleValidationErrors
];

exports.loginValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email gereklidir')
    .isEmail().withMessage('Geçerli bir email adresi girin')
    .normalizeEmail(),
  
  body('password')
    .notEmpty().withMessage('Şifre gereklidir'),
  
  handleValidationErrors
];

exports.changePasswordValidation = [
  body('currentPassword')
    .notEmpty().withMessage('Mevcut şifre gereklidir'),
  
  body('newPassword')
    .notEmpty().withMessage('Yeni şifre gereklidir')
    .isLength({ min: 8 }).withMessage('Yeni şifre en az 8 karakter olmalıdır'),
  
  handleValidationErrors
];

exports.forgotPasswordValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email gereklidir')
    .isEmail().withMessage('Geçerli bir email adresi girin')
    .normalizeEmail(),
  
  handleValidationErrors
];

exports.resetPasswordValidation = [
  body('token')
    .notEmpty().withMessage('Token gereklidir')
    .isLength({ min: 10 }).withMessage('Geçersiz token'),
  
  body('newPassword')
    .notEmpty().withMessage('Yeni şifre gereklidir')
    .isLength({ min: 8 }).withMessage('Yeni şifre en az 8 karakter olmalıdır'),
  
  handleValidationErrors
];

/**
 * Restaurant Validations
 */
exports.createRestaurantValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Restoran adı gereklidir')
    .isLength({ min: 2, max: 100 }).withMessage('Restoran adı 2-100 karakter olmalıdır')
    .customSanitizer(sanitizeHtml),
  
  body('slug')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Slug 2-100 karakter olmalıdır')
    .matches(/^[a-z0-9-]+$/).withMessage('Slug sadece küçük harf, rakam ve tire içerebilir')
    .customSanitizer(sanitizeHtml),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Açıklama maksimum 500 karakter olabilir')
    .customSanitizer(sanitizeHtml),
  
  body('phone')
    .optional()
    .trim()
    .customSanitizer(sanitizePhone),
  
  body('address')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('Adres maksimum 200 karakter olabilir')
    .customSanitizer(sanitizeHtml),
  
  body('logoUrl')
    .optional()
    .trim()
    .customSanitizer(sanitizeUrl),
  
  handleValidationErrors
];

exports.updateRestaurantValidation = [
  param('id')
    .isUUID().withMessage('Geçersiz restoran ID'),
  
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Restoran adı 2-100 karakter olmalıdır')
    .customSanitizer(sanitizeHtml),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Açıklama maksimum 500 karakter olabilir')
    .customSanitizer(sanitizeHtml),
  
  body('phone')
    .optional()
    .trim()
    .customSanitizer(sanitizePhone),
  
  body('address')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('Adres maksimum 200 karakter olabilir')
    .customSanitizer(sanitizeHtml),
  
  body('logoUrl')
    .optional()
    .trim()
    .customSanitizer(sanitizeUrl),
  
  handleValidationErrors
];

/**
 * Category Validations
 */
exports.createCategoryValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Kategori adı gereklidir')
    .isLength({ min: 2, max: 100 }).withMessage('Kategori adı 2-100 karakter olmalıdır')
    .customSanitizer(sanitizeHtml),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Açıklama maksimum 500 karakter olabilir')
    .customSanitizer(sanitizeHtml),
  
  body('displayOrder')
    .optional()
    .isInt({ min: 0 }).withMessage('Sıra numarası 0 veya daha büyük olmalıdır'),
  
  body('isActive')
    .optional()
    .isBoolean().withMessage('Aktiflik durumu boolean olmalıdır'),
  
  handleValidationErrors
];

exports.updateCategoryValidation = [
  param('id')
    .isUUID().withMessage('Geçersiz kategori ID'),
  
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Kategori adı 2-100 karakter olmalıdır')
    .customSanitizer(sanitizeHtml),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Açıklama maksimum 500 karakter olabilir')
    .customSanitizer(sanitizeHtml),
  
  body('displayOrder')
    .optional()
    .isInt({ min: 0 }).withMessage('Sıra numarası 0 veya daha büyük olmalıdır'),
  
  body('isActive')
    .optional()
    .isBoolean().withMessage('Aktiflik durumu boolean olmalıdır'),
  
  handleValidationErrors
];

/**
 * Product Validations
 */
exports.createProductValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Ürün adı gereklidir')
    .isLength({ min: 2, max: 100 }).withMessage('Ürün adı 2-100 karakter olmalıdır')
    .customSanitizer(sanitizeHtml),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Açıklama maksimum 1000 karakter olabilir')
    .customSanitizer(sanitizeHtml),
  
  body('price')
    .notEmpty().withMessage('Fiyat gereklidir')
    .isFloat({ min: 0 }).withMessage('Fiyat 0 veya daha büyük olmalıdır'),
  
  body('categoryId')
    .notEmpty().withMessage('Kategori gereklidir')
    .isUUID().withMessage('Geçersiz kategori ID'),
  
  body('imageUrl')
    .optional()
    .trim()
    .customSanitizer(sanitizeUrl),
  
  body('isActive')
    .optional()
    .isBoolean().withMessage('Aktiflik durumu boolean olmalıdır'),
  
  handleValidationErrors
];

exports.updateProductValidation = [
  param('id')
    .isUUID().withMessage('Geçersiz ürün ID'),
  
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Ürün adı 2-100 karakter olmalıdır')
    .customSanitizer(sanitizeHtml),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Açıklama maksimum 1000 karakter olabilir')
    .customSanitizer(sanitizeHtml),
  
  body('price')
    .optional()
    .isFloat({ min: 0 }).withMessage('Fiyat 0 veya daha büyük olmalıdır'),
  
  body('categoryId')
    .optional()
    .isUUID().withMessage('Geçersiz kategori ID'),
  
  body('imageUrl')
    .optional()
    .trim()
    .customSanitizer(sanitizeUrl),
  
  body('isActive')
    .optional()
    .isBoolean().withMessage('Aktiflik durumu boolean olmalıdır'),
  
  handleValidationErrors
];

/**
 * Settings Validations
 */
exports.updateSettingsValidation = [
  body('siteName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Site adı 2-100 karakter olmalıdır')
    .customSanitizer(sanitizeHtml),
  
  body('siteDescription')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Açıklama maksimum 500 karakter olabilir')
    .customSanitizer(sanitizeHtml),
  
  body('supportEmail')
    .optional()
    .trim()
    .isEmail().withMessage('Geçerli bir email adresi girin')
    .normalizeEmail()
    .customSanitizer(sanitizeEmail),
  
  body('maxRestaurantsPerUser')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Maksimum restoran sayısı 1-100 arasında olmalıdır'),
  
  body('enableGoogleAuth')
    .optional()
    .isBoolean().withMessage('Google Auth boolean olmalıdır'),
  
  body('maintenanceMode')
    .optional()
    .isBoolean().withMessage('Maintenance mode boolean olmalıdır'),
  
  handleValidationErrors
];

/**
 * User Validations
 */
exports.updateUserRoleValidation = [
  param('id')
    .isUUID().withMessage('Geçersiz kullanıcı ID'),
  
  body('role')
    .notEmpty().withMessage('Rol gereklidir')
    .isIn(['ADMIN', 'STAFF', 'RESTAURANT_OWNER', 'CASHIER', 'WAITER', 'BARISTA', 'COOK'])
    .withMessage('Geçersiz rol'),
  
  handleValidationErrors
];

/**
 * Plan Validations
 */
exports.createPlanValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Plan adı gereklidir')
    .isLength({ min: 2, max: 50 }).withMessage('Plan adı 2-50 karakter olmalıdır')
    .customSanitizer(sanitizeHtml),
  
  body('type')
    .notEmpty().withMessage('Plan tipi gereklidir')
    .isIn(['FREE', 'PREMIUM', 'CUSTOM']).withMessage('Geçersiz plan tipi'),
  
  body('price')
    .notEmpty().withMessage('Fiyat gereklidir')
    .isFloat({ min: 0 }).withMessage('Fiyat 0 veya daha büyük olmalıdır'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Açıklama maksimum 500 karakter olabilir')
    .customSanitizer(sanitizeHtml),
  
  body('maxRestaurants')
    .notEmpty().withMessage('Maksimum restoran sayısı gereklidir')
    .isInt({ min: 1 }).withMessage('Maksimum restoran sayısı 1 veya daha büyük olmalıdır'),
  
  body('maxCategories')
    .notEmpty().withMessage('Maksimum kategori sayısı gereklidir')
    .isInt({ min: 1 }).withMessage('Maksimum kategori sayısı 1 veya daha büyük olmalıdır'),
  
  body('maxProducts')
    .notEmpty().withMessage('Maksimum ürün sayısı gereklidir')
    .isInt({ min: 1 }).withMessage('Maksimum ürün sayısı 1 veya daha büyük olmalıdır'),
  
  handleValidationErrors
];

/**
 * Table Validations
 */
exports.createTableValidation = [
  body('number')
    .trim()
    .notEmpty().withMessage('Masa numarası gereklidir')
    .isLength({ min: 1, max: 20 }).withMessage('Masa numarası 1-20 karakter olmalıdır')
    .customSanitizer(sanitizeHtml),
  
  body('capacity')
    .optional()
    .isInt({ min: 1, max: 50 }).withMessage('Kapasite 1-50 kişi arasında olmalıdır'),
  
  handleValidationErrors
];

/**
 * UUID Param Validation
 */
exports.uuidParamValidation = (paramName = 'id') => [
  param(paramName)
    .isUUID().withMessage(`Geçersiz ${paramName}`),
  
  handleValidationErrors
];

/**
 * Slug Param Validation
 */
exports.slugParamValidation = [
  param('slug')
    .trim()
    .notEmpty().withMessage('Slug gereklidir')
    .matches(/^[a-z0-9-]+$/).withMessage('Geçersiz slug formatı'),
  
  handleValidationErrors
];

module.exports = {
  ...exports,
  handleValidationErrors
};
