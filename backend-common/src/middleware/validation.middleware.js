const { body, param, validationResult } = require('express-validator');

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

exports.registerValidation = [
  body('email').trim().notEmpty().withMessage('Email gereklidir').isEmail().withMessage('Geçerli bir email adresi girin').normalizeEmail(),
  body('fullName').trim().notEmpty().withMessage('Ad Soyad gereklidir').isLength({ min: 2, max: 100 }).withMessage('Ad Soyad 2-100 karakter olmalıdır'),
  body('username').optional().trim().isLength({ min: 3, max: 30 }).withMessage('Kullanıcı adı 3-30 karakter olmalıdır').matches(/^[a-zA-Z0-9_-]+$/).withMessage('Kullanıcı adı sadece harf, rakam, tire ve alt çizgi içerebilir'),
  body('password').notEmpty().withMessage('Şifre gereklidir').isLength({ min: 8 }).withMessage('Şifre en az 8 karakter olmalıdır'),
  handleValidationErrors
];

exports.loginValidation = [
  body('email').trim().notEmpty().withMessage('Email gereklidir').isEmail().withMessage('Geçerli bir email adresi girin').normalizeEmail(),
  body('password').notEmpty().withMessage('Şifre gereklidir'),
  handleValidationErrors
];

exports.changePasswordValidation = [
  body('currentPassword').notEmpty().withMessage('Mevcut şifre gereklidir'),
  body('newPassword').notEmpty().withMessage('Yeni şifre gereklidir').isLength({ min: 8 }).withMessage('Yeni şifre en az 8 karakter olmalıdır'),
  handleValidationErrors
];

exports.forgotPasswordValidation = [
  body('email').trim().notEmpty().withMessage('Email gereklidir').isEmail().withMessage('Geçerli bir email adresi girin').normalizeEmail(),
  handleValidationErrors
];

exports.resetPasswordValidation = [
  body('token').notEmpty().withMessage('Token gereklidir').isLength({ min: 10 }).withMessage('Geçersiz token'),
  body('newPassword').notEmpty().withMessage('Yeni şifre gereklidir').isLength({ min: 8 }).withMessage('Yeni şifre en az 8 karakter olmalıdır'),
  handleValidationErrors
];

exports.updateSettingsValidation = [
  body('siteName').optional().trim().isLength({ max: 100 }),
  body('siteDescription').optional().trim().isLength({ max: 500 }),
  body('supportEmail').optional().trim().isEmail(),
  body('maxRestaurantsPerUser').optional().isInt({ min: 1, max: 100 }),
  body('enableGoogleAuth').optional().isBoolean(),
  body('maintenanceMode').optional().isBoolean(),
  handleValidationErrors
];

const TICKET_CATEGORIES = ['TECHNICAL', 'BILLING', 'FEATURE_REQUEST', 'BUG_REPORT', 'GENERAL'];
const TICKET_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
const TICKET_STATUSES = ['OPEN', 'IN_PROGRESS', 'WAITING_CUSTOMER', 'RESOLVED', 'CLOSED'];

exports.createTicketValidation = [
  body('subject').trim().notEmpty().withMessage('Konu gereklidir').isLength({ min: 3, max: 200 }).withMessage('Konu 3-200 karakter olmalıdır'),
  body('description').trim().notEmpty().withMessage('Açıklama gereklidir').isLength({ min: 10, max: 5000 }).withMessage('Açıklama 10-5000 karakter olmalıdır'),
  body('category').notEmpty().withMessage('Kategori gereklidir').isIn(TICKET_CATEGORIES).withMessage('Geçersiz kategori'),
  body('priority').optional().isIn(TICKET_PRIORITIES).withMessage('Geçersiz öncelik'),
  body('restaurantId').optional().isUUID().withMessage('Geçersiz restoran'),
  handleValidationErrors
];

exports.updateTicketValidation = [
  body('status').optional().isIn(TICKET_STATUSES).withMessage('Geçersiz durum'),
  body('priority').optional().isIn(TICKET_PRIORITIES).withMessage('Geçersiz öncelik'),
  body('assignedToId').optional().isUUID().withMessage('Geçersiz atama'),
  body('resolution').optional().trim().isLength({ max: 5000 }).withMessage('Çözüm notu maksimum 5000 karakter olabilir'),
  handleValidationErrors
];

exports.createTicketMessageValidation = [
  body('message').trim().notEmpty().withMessage('Mesaj gereklidir').isLength({ min: 1, max: 5000 }).withMessage('Mesaj 1-5000 karakter olmalıdır'),
  body('isInternal').optional().isBoolean().withMessage('isInternal boolean olmalıdır'),
  handleValidationErrors
];

exports.rateTicketValidation = [
  body('rating').notEmpty().withMessage('Değerlendirme gereklidir').isInt({ min: 1, max: 10 }).withMessage('Değerlendirme 1 ile 10 arasında olmalıdır'),
  handleValidationErrors
];

exports.uuidParamValidation = (paramName = 'id') => [
  param(paramName).isUUID().withMessage(`Geçersiz ${paramName}`),
  handleValidationErrors
];

const VALID_ROLES = ['ADMIN', 'STAFF', 'RESTAURANT_OWNER', 'BUSINESS_OWNER', 'APPOINTMENT_STAFF', 'CASHIER', 'WAITER', 'BARISTA', 'COOK'];
exports.updateUserRoleValidation = [
  body('role').notEmpty().withMessage('Rol gereklidir').isIn(VALID_ROLES).withMessage('Geçersiz rol'),
  handleValidationErrors
];
