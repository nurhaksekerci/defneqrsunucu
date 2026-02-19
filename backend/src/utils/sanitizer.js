const validator = require('validator');

/**
 * Sanitize HTML content to prevent XSS attacks
 * Uses validator.escape for server-side HTML entity encoding
 * @param {string} dirty - Potentially dangerous HTML
 * @returns {string} - Clean HTML
 */
exports.sanitizeHtml = (dirty) => {
  if (!dirty || typeof dirty !== 'string') {
    return dirty;
  }
  
  // Use validator.escape instead of DOMPurify for server-side
  // This converts < > & " ' to HTML entities
  return validator.escape(dirty)
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '') // Remove iframe tags
    .substring(0, 10000); // Prevent extremely long strings
};

/**
 * Sanitize object recursively (for request body/query)
 * @param {any} obj - Object to sanitize
 * @returns {any} - Sanitized object
 */
exports.sanitizeObject = (obj) => {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    return exports.sanitizeHtml(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(item => exports.sanitizeObject(item));
  }

  if (typeof obj === 'object') {
    const sanitized = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        sanitized[key] = exports.sanitizeObject(obj[key]);
      }
    }
    return sanitized;
  }

  return obj;
};

/**
 * Validate and sanitize email
 * @param {string} email
 * @returns {string|null}
 */
exports.sanitizeEmail = (email) => {
  if (!email || typeof email !== 'string') {
    return null;
  }
  
  const normalized = validator.normalizeEmail(email);
  
  if (!normalized || !validator.isEmail(normalized)) {
    return null;
  }
  
  return normalized;
};

/**
 * Sanitize URL
 * @param {string} url
 * @returns {string|null}
 */
exports.sanitizeUrl = (url) => {
  if (!url || typeof url !== 'string') {
    return null;
  }
  
  // Remove whitespace
  url = url.trim();
  
  // Validate URL
  if (!validator.isURL(url, {
    protocols: ['http', 'https'],
    require_protocol: true
  })) {
    return null;
  }
  
  return url;
};

/**
 * Escape special characters for SQL (paranoid mode)
 * Note: Prisma already handles this, but this is extra safety
 * @param {string} str
 * @returns {string}
 */
exports.escapeSql = (str) => {
  if (!str || typeof str !== 'string') {
    return str;
  }
  
  return validator.escape(str);
};

/**
 * Remove MongoDB query operators (NoSQL injection prevention)
 * @param {object} obj
 * @returns {object}
 */
exports.sanitizeMongoOperators = (obj) => {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => exports.sanitizeMongoOperators(item));
  }

  if (typeof obj === 'object') {
    const sanitized = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key) && !key.startsWith('$')) {
        sanitized[key] = exports.sanitizeMongoOperators(obj[key]);
      }
    }
    return sanitized;
  }

  return obj;
};

/**
 * Sanitize filename (for file uploads)
 * @param {string} filename
 * @returns {string}
 */
exports.sanitizeFilename = (filename) => {
  if (!filename || typeof filename !== 'string') {
    return '';
  }
  
  return filename
    .replace(/[\/\\]/g, '') // Remove path separators
    .replace(/\.\./g, '') // Remove parent directory references
    .replace(/[^\w\s.-]/g, '') // Keep only alphanumeric, space, dot, dash
    .trim()
    .substring(0, 255); // Max length
};

/**
 * Validate and sanitize phone number
 * @param {string} phone
 * @returns {string|null}
 */
exports.sanitizePhone = (phone) => {
  if (!phone || typeof phone !== 'string') {
    return null;
  }
  
  // Remove all non-digit characters except +
  phone = phone.replace(/[^\d+]/g, '');
  
  // Basic validation (can be enhanced)
  if (phone.length < 10 || phone.length > 15) {
    return null;
  }
  
  return phone;
};
