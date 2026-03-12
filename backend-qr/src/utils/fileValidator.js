const path = require('path');

exports.sanitizeFilename = (filename) => {
  return filename
    .replace(/[\/\\]/g, '')
    .replace(/\.\./g, '')
    .replace(/[^\w\s.-]/g, '')
    .trim()
    .substring(0, 255);
};

exports.isExtensionAllowed = (extension) => {
  const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  return allowed.includes(extension.toLowerCase());
};
