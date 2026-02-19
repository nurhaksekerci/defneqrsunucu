const { authenticate, authorize } = require('../auth.middleware');
const { verifyAccessToken } = require('../../utils/jwt');

// Mock JWT utils
jest.mock('../../utils/jwt');

describe('Auth Middleware - Unit Tests', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      headers: {},
      cookies: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('authenticate middleware', () => {
    it('should authenticate valid token from Authorization header', () => {
      const mockUser = { id: 'user-123', email: 'test@example.com', role: 'USER' };
      req.headers.authorization = 'Bearer valid-token';
      verifyAccessToken.mockReturnValue(mockUser);

      authenticate(req, res, next);

      expect(verifyAccessToken).toHaveBeenCalledWith('valid-token');
      expect(req.user).toEqual(mockUser);
      expect(next).toHaveBeenCalled();
    });

    it('should authenticate valid token from cookie', () => {
      const mockUser = { id: 'user-123', email: 'test@example.com', role: 'USER' };
      req.cookies.accessToken = 'valid-token';
      verifyAccessToken.mockReturnValue(mockUser);

      authenticate(req, res, next);

      expect(verifyAccessToken).toHaveBeenCalledWith('valid-token');
      expect(req.user).toEqual(mockUser);
      expect(next).toHaveBeenCalled();
    });

    it('should reject request without token', () => {
      authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('token')
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject invalid token', () => {
      req.headers.authorization = 'Bearer invalid-token';
      verifyAccessToken.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle expired token', () => {
      req.headers.authorization = 'Bearer expired-token';
      const error = new Error('Token expired');
      error.name = 'TokenExpiredError';
      verifyAccessToken.mockImplementation(() => {
        throw error;
      });

      authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('expired')
        })
      );
    });
  });

  describe('authorize middleware', () => {
    it('should allow user with correct role', () => {
      req.user = { id: 'user-123', role: 'ADMIN' };
      const authorizeAdmin = authorize(['ADMIN']);

      authorizeAdmin(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should allow user with any of multiple allowed roles', () => {
      req.user = { id: 'user-123', role: 'MANAGER' };
      const authorizeMultiple = authorize(['ADMIN', 'MANAGER']);

      authorizeMultiple(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should reject user without required role', () => {
      req.user = { id: 'user-123', role: 'USER' };
      const authorizeAdmin = authorize(['ADMIN']);

      authorizeAdmin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('yetkisi')
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject request without user object', () => {
      const authorizeAdmin = authorize(['ADMIN']);

      authorizeAdmin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });
  });
});
