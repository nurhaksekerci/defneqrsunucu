const { sanitizeObject, sanitizeMongoOperators } = require('../utils/sanitizer');

/**
 * Global XSS sanitization middleware
 * Sanitizes all request body, query, and params
 */
exports.sanitizeRequest = (req, res, next) => {
  // Sanitize body
  if (req.body) {
    req.body = sanitizeObject(req.body);
    req.body = sanitizeMongoOperators(req.body);
  }

  // Sanitize query
  if (req.query) {
    req.query = sanitizeObject(req.query);
    req.query = sanitizeMongoOperators(req.query);
  }

  // Sanitize params
  if (req.params) {
    req.params = sanitizeObject(req.params);
    req.params = sanitizeMongoOperators(req.params);
  }

  next();
};

/**
 * Body-only sanitization (lighter)
 */
exports.sanitizeBody = (req, res, next) => {
  if (req.body) {
    req.body = sanitizeObject(req.body);
    req.body = sanitizeMongoOperators(req.body);
  }
  next();
};

/**
 * Query-only sanitization
 */
exports.sanitizeQuery = (req, res, next) => {
  if (req.query) {
    req.query = sanitizeObject(req.query);
    req.query = sanitizeMongoOperators(req.query);
  }
  next();
};
