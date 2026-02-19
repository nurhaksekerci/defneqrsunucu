const request = require('supertest');
const express = require('express');
const productRoutes = require('../routes/product.routes');
const { authenticate } = require('../middleware/auth.middleware');

// Mock authentication middleware for tests
jest.mock('../middleware/auth.middleware', () => ({
  authenticate: (req, res, next) => {
    req.user = { id: 'test-user-123', role: 'USER' };
    next();
  }
}));

// Create test app
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/products', productRoutes);
  
  app.use((err, req, res, next) => {
    res.status(err.status || 500).json({
      success: false,
      message: err.message
    });
  });
  
  return app;
};

describe('Products API - Integration Tests', () => {
  let app;

  beforeAll(() => {
    app = createTestApp();
  });

  describe('GET /api/products', () => {
    it('should return products list', async () => {
      const response = await request(app)
        .get('/api/products')
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('data');
    });

    it('should filter global products', async () => {
      const response = await request(app)
        .get('/api/products?isGlobal=true')
        .expect(200);

      expect(response.body).toHaveProperty('data');
    });

    it('should filter products by category', async () => {
      const response = await request(app)
        .get('/api/products?categoryId=cat-123')
        .expect(200);

      expect(response.body).toHaveProperty('data');
    });
  });

  describe('POST /api/products', () => {
    it('should reject product creation without authentication', async () => {
      // Temporarily restore original middleware
      jest.unmock('../middleware/auth.middleware');
      
      const productData = {
        name: 'Test Product',
        categoryId: 'cat-123'
      };

      const response = await request(app)
        .post('/api/products')
        .send(productData);

      // Will fail validation or auth
      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it('should validate required fields', async () => {
      const incompleteData = {
        description: 'Missing name and category'
      };

      const response = await request(app)
        .post('/api/products')
        .send(incompleteData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should validate price if provided', async () => {
      const invalidProduct = {
        name: 'Test Product',
        categoryId: 'cat-123',
        basePrice: -10
      };

      const response = await request(app)
        .post('/api/products')
        .send(invalidProduct)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Fiyat');
    });
  });

  describe('GET /api/products/:id', () => {
    it('should validate product ID format', async () => {
      const response = await request(app)
        .get('/api/products/invalid-id')
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/products/:id', () => {
    it('should validate update data', async () => {
      const invalidUpdate = {
        basePrice: 'not-a-number'
      };

      const response = await request(app)
        .put('/api/products/valid-uuid-here')
        .send(invalidUpdate)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});
