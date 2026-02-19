import { getImageUrl } from '../imageHelper';

describe('imageHelper', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('getImageUrl', () => {
    it('should return undefined for null or undefined input', () => {
      expect(getImageUrl(null)).toBeUndefined();
      expect(getImageUrl(undefined)).toBeUndefined();
    });

    it('should return full URL as-is', () => {
      const fullUrl = 'https://example.com/image.jpg';
      expect(getImageUrl(fullUrl)).toBe(fullUrl);
    });

    it('should return http URL as-is', () => {
      const httpUrl = 'http://example.com/image.jpg';
      expect(getImageUrl(httpUrl)).toBe(httpUrl);
    });

    it('should construct URL for relative path starting with /uploads/', () => {
      process.env.NEXT_PUBLIC_API_URL = 'https://api.defneqr.com/api';
      const relativePath = '/uploads/image-123.jpg';
      const expected = 'https://api.defneqr.com/uploads/image-123.jpg';
      
      expect(getImageUrl(relativePath)).toBe(expected);
    });

    it('should use localhost when NEXT_PUBLIC_API_URL is not set', () => {
      delete process.env.NEXT_PUBLIC_API_URL;
      const relativePath = '/uploads/image.jpg';
      
      expect(getImageUrl(relativePath)).toBe('http://localhost:5000/uploads/image.jpg');
    });

    it('should remove trailing /api from NEXT_PUBLIC_API_URL', () => {
      process.env.NEXT_PUBLIC_API_URL = 'https://api.defneqr.com/api';
      const relativePath = '/uploads/test.jpg';
      
      const result = getImageUrl(relativePath);
      expect(result).not.toContain('/api/uploads');
      expect(result).toBe('https://api.defneqr.com/uploads/test.jpg');
    });

    it('should not remove "api" from subdomain', () => {
      process.env.NEXT_PUBLIC_API_URL = 'https://api.defneqr.com/api';
      const relativePath = '/uploads/test.jpg';
      
      const result = getImageUrl(relativePath);
      expect(result).toContain('api.defneqr.com');
      expect(result).toBe('https://api.defneqr.com/uploads/test.jpg');
    });

    it('should return path as-is for non-uploads paths', () => {
      const customPath = '/custom/path/image.jpg';
      expect(getImageUrl(customPath)).toBe(customPath);
    });
  });
});
