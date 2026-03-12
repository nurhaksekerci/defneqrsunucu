const { param, validationResult } = require('express-validator');

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

exports.uuidParamValidation = (paramName = 'id') => [
  param(paramName)
    .isUUID().withMessage(`Geçersiz ${paramName}`),

  handleValidationErrors
];
