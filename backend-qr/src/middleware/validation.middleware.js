const { body, param, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const firstError = errors.array()[0];
    return res.status(400).json({ success: false, message: firstError.msg, errors: errors.array() });
  }
  next();
};

exports.createRestaurantValidation = [
  body('name').trim().notEmpty().withMessage('Restoran adı gereklidir').isLength({ min: 2, max: 100 }).withMessage('Restoran adı 2-100 karakter olmalıdır'),
  body('description').optional().trim().isLength({ max: 500 }),
  body('phone').optional().trim(),
  body('address').optional().trim().isLength({ max: 200 }),
  handleValidationErrors,
];

exports.updateRestaurantValidation = [
  param('id').isUUID().withMessage('Geçersiz restoran ID'),
  body('name').optional().trim().isLength({ min: 2, max: 100 }),
  body('description').optional().trim().isLength({ max: 500 }),
  body('phone').optional().trim(),
  body('address').optional().trim().isLength({ max: 200 }),
  handleValidationErrors,
];

exports.createCategoryValidation = [
  body('name').trim().notEmpty().withMessage('Kategori adı gereklidir').isLength({ min: 2, max: 100 }),
  body('description').optional().trim().isLength({ max: 500 }),
  handleValidationErrors,
];

exports.updateCategoryValidation = [
  param('id').isUUID().withMessage('Geçersiz kategori ID'),
  body('name').optional().trim().isLength({ min: 2, max: 100 }),
  body('description').optional().trim().isLength({ max: 500 }),
  handleValidationErrors,
];

exports.createProductValidation = [
  body('name').trim().notEmpty().withMessage('Ürün adı gereklidir').isLength({ min: 2, max: 100 }),
  body('description').optional().trim().isLength({ max: 1000 }),
  body('basePrice').optional({ nullable: true }).isFloat({ min: 0 }),
  body('categoryId').notEmpty().withMessage('Kategori gereklidir').isUUID(),
  body('isActive').optional().isBoolean(),
  handleValidationErrors,
];

exports.updateProductValidation = [
  param('id').isUUID().withMessage('Geçersiz ürün ID'),
  body('name').optional().trim().isLength({ min: 2, max: 100 }),
  body('description').optional().trim().isLength({ max: 1000 }),
  body('basePrice').optional().isFloat({ min: 0 }),
  body('categoryId').optional().isUUID(),
  body('isActive').optional().isBoolean(),
  handleValidationErrors,
];

exports.createTableValidation = [
  body('name').trim().notEmpty().withMessage('Masa adı gereklidir').isLength({ min: 1, max: 20 }),
  body('restaurantId').notEmpty().withMessage('Restoran ID gereklidir').isUUID(),
  handleValidationErrors,
];

exports.uuidParamValidation = (paramName = 'id') => [
  param(paramName).isUUID().withMessage(`Geçersiz ${paramName}`),
  handleValidationErrors,
];

exports.slugParamValidation = [
  param('slug').trim().notEmpty().withMessage('Slug gereklidir').matches(/^[a-z0-9-]+$/).withMessage('Geçersiz slug formatı'),
  handleValidationErrors,
];

exports.createPlanValidation = [
  body('name').trim().notEmpty().withMessage('Plan adı gereklidir').isLength({ min: 2, max: 50 }),
  body('type').notEmpty().withMessage('Plan tipi gereklidir').isIn(['FREE', 'PREMIUM', 'CUSTOM']),
  body('price').optional().isFloat({ min: 0 }),
  body('maxRestaurants').optional().isInt({ min: 1 }),
  body('maxCategories').optional().isInt({ min: 1 }),
  body('maxProducts').optional().isInt({ min: 1 }),
  handleValidationErrors,
];

exports.updateSettingsValidation = [
  body('siteName').optional().trim().isLength({ min: 2, max: 100 }),
  body('siteDescription').optional().trim().isLength({ max: 500 }),
  body('supportEmail').optional().trim().isEmail(),
  body('maxRestaurantsPerUser').optional().isInt({ min: 1, max: 100 }),
  body('enableGoogleAuth').optional().isBoolean(),
  body('maintenanceMode').optional().isBoolean(),
  handleValidationErrors,
];

exports.handleValidationErrors = handleValidationErrors;
