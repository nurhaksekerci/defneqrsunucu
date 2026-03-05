/**
 * Password validation utility
 */

/**
 * Şifre karmaşıklık kuralları:
 * - En az 8 karakter
 * - En az 1 büyük harf
 * - En az 1 küçük harf
 * - En az 1 rakam
 * - En az 1 özel karakter (. - _ @ $ ! % * ? & vb.)
 */
const specialCharRegex = /[^a-zA-Z0-9]/;

/**
 * Validate password complexity
 * @param {string} password - Password to validate
 * @returns {object} - { valid: boolean, message: string }
 */
exports.validatePassword = (password) => {
  if (!password) {
    return {
      valid: false,
      message: 'Şifre gereklidir'
    };
  }

  if (password.length < 8) {
    return {
      valid: false,
      message: 'Şifre en az 8 karakter olmalıdır'
    };
  }

  if (!/[a-z]/.test(password)) {
    return {
      valid: false,
      message: 'Şifre en az bir küçük harf içermelidir'
    };
  }

  if (!/[A-Z]/.test(password)) {
    return {
      valid: false,
      message: 'Şifre en az bir büyük harf içermelidir'
    };
  }

  if (!/\d/.test(password)) {
    return {
      valid: false,
      message: 'Şifre en az bir rakam içermelidir'
    };
  }

  if (!specialCharRegex.test(password)) {
    return {
      valid: false,
      message: 'Şifre en az bir özel karakter (. - _ @ $ ! % * ? & vb.) içermelidir'
    };
  }

  return {
    valid: true,
    message: 'Şifre geçerli'
  };
};

/**
 * Get password strength level
 * @param {string} password
 * @returns {string} - weak, medium, strong
 */
exports.getPasswordStrength = (password) => {
  let strength = 0;

  if (password.length >= 8) strength++;
  if (password.length >= 12) strength++;
  if (/[a-z]/.test(password)) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/\d/.test(password)) strength++;
  if (specialCharRegex.test(password)) strength++;
  if (password.length >= 16) strength++;

  if (strength <= 2) return 'weak';
  if (strength <= 4) return 'medium';
  return 'strong';
};
