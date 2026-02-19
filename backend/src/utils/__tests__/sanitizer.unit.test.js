const validator = require('validator');

describe('Sanitizer Utils - Unit Tests', () => {
  describe('URL Sanitization', () => {
    it('should allow valid HTTPS URLs', () => {
      const validUrls = [
        'https://example.com',
        'https://api.defneqr.com/uploads/image.jpg',
        'https://sub.domain.com/path/to/file.png'
      ];

      validUrls.forEach(url => {
        expect(validator.isURL(url, { protocols: ['https', 'http'] })).toBe(true);
      });
    });

    it('should reject invalid URLs', () => {
      const invalidUrls = [
        'javascript:alert(1)',
        'data:text/html,<script>alert(1)</script>',
        'ftp://malicious.com',
        '../../../etc/passwd'
      ];

      invalidUrls.forEach(url => {
        expect(validator.isURL(url, { protocols: ['https', 'http'] })).toBe(false);
      });
    });
  });

  describe('Email Sanitization', () => {
    it('should normalize and validate emails', () => {
      const testCases = [
        { input: 'TEST@EXAMPLE.COM', expected: 'test@example.com' },
        { input: 'user+tag@example.com', expected: 'user@example.com' }
      ];

      testCases.forEach(({ input, expected }) => {
        const normalized = validator.normalizeEmail(input);
        expect(normalized).toBe(expected);
      });
    });

    it('should reject invalid emails', () => {
      const invalidEmails = [
        'not-an-email',
        '@example.com',
        'user@',
        'user space@example.com'
      ];

      invalidEmails.forEach(email => {
        expect(validator.isEmail(email)).toBe(false);
      });
    });
  });

  describe('XSS Prevention', () => {
    it('should escape HTML entities', () => {
      const testCases = [
        { input: '<script>alert(1)</script>', shouldContain: '&lt;script&gt;' },
        { input: 'Test & Co.', shouldContain: '&amp;' },
        { input: '"quoted"', shouldContain: '&quot;' }
      ];

      testCases.forEach(({ input, shouldContain }) => {
        const escaped = validator.escape(input);
        expect(escaped).toContain(shouldContain);
      });
    });
  });

  describe('Path Traversal Prevention', () => {
    it('should detect path traversal attempts', () => {
      const dangerousPatterns = [
        '../../../etc/passwd',
        '..\\..\\windows\\system32',
        '/etc/shadow',
        'C:\\Windows\\System32'
      ];

      dangerousPatterns.forEach(pattern => {
        expect(pattern).toMatch(/\.\.|\\|\/etc\/|\/windows\//i);
      });
    });
  });
});
