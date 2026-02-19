const request = require('supertest');
const express = require('express');
const path = require('path');
const fs = require('fs');
const uploadRoutes = require('../routes/upload.routes');

// Mock authentication
jest.mock('../middleware/auth.middleware', () => ({
  authenticate: (req, res, next) => {
    req.user = { id: 'test-user-123' };
    next();
  }
}));

// Create test app
const createTestApp = () => {
  const app = express();
  app.use('/api/upload', uploadRoutes);
  
  app.use((err, req, res, next) => {
    res.status(err.status || 500).json({
      success: false,
      message: err.message
    });
  });
  
  return app;
};

describe('Upload API - Integration Tests', () => {
  let app;

  beforeAll(() => {
    app = createTestApp();
  });

  describe('POST /api/upload/image', () => {
    it('should reject upload without file', async () => {
      const response = await request(app)
        .post('/api/upload/image')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Dosya');
    });

    it('should reject non-image files', async () => {
      const testFile = Buffer.from('test content');
      
      const response = await request(app)
        .post('/api/upload/image')
        .attach('image', testFile, 'test.txt')
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject oversized files', async () => {
      // Create a buffer larger than MAX_FILE_SIZE (5MB)
      const largeFile = Buffer.alloc(6 * 1024 * 1024);
      
      const response = await request(app)
        .post('/api/upload/image')
        .attach('image', largeFile, 'large.jpg');

      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it('should validate file extension', async () => {
      const testFile = Buffer.from('test');
      
      const response = await request(app)
        .post('/api/upload/image')
        .attach('image', testFile, 'test.exe');

      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });
});
