const jwt = require('jsonwebtoken');
const { generateAccessToken, generateRefreshToken, verifyAccessToken, verifyRefreshToken } = require('../jwt');

// Mock jsonwebtoken
jest.mock('jsonwebtoken');

describe('JWT Utils - Unit Tests', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    role: 'USER'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateAccessToken', () => {
    it('should generate a valid access token', () => {
      const expectedToken = 'mock-access-token';
      jwt.sign.mockReturnValue(expectedToken);

      const token = generateAccessToken(mockUser);

      expect(jwt.sign).toHaveBeenCalledWith(
        { id: mockUser.id, email: mockUser.email, role: mockUser.role },
        process.env.JWT_SECRET,
        expect.objectContaining({ expiresIn: expect.any(String) })
      );
      expect(token).toBe(expectedToken);
    });

    it('should include user id, email, and role in payload', () => {
      generateAccessToken(mockUser);
      
      const callArgs = jwt.sign.mock.calls[0];
      const payload = callArgs[0];

      expect(payload).toHaveProperty('id', mockUser.id);
      expect(payload).toHaveProperty('email', mockUser.email);
      expect(payload).toHaveProperty('role', mockUser.role);
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a valid refresh token', () => {
      const expectedToken = 'mock-refresh-token';
      jwt.sign.mockReturnValue(expectedToken);

      const token = generateRefreshToken(mockUser);

      expect(jwt.sign).toHaveBeenCalledWith(
        { id: mockUser.id },
        process.env.JWT_REFRESH_SECRET,
        expect.objectContaining({ expiresIn: expect.any(String) })
      );
      expect(token).toBe(expectedToken);
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify and decode a valid access token', () => {
      const mockToken = 'valid-access-token';
      const mockDecoded = { id: mockUser.id, email: mockUser.email, role: mockUser.role };
      jwt.verify.mockReturnValue(mockDecoded);

      const decoded = verifyAccessToken(mockToken);

      expect(jwt.verify).toHaveBeenCalledWith(mockToken, process.env.JWT_SECRET);
      expect(decoded).toEqual(mockDecoded);
    });

    it('should throw error for invalid token', () => {
      const mockToken = 'invalid-token';
      jwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      expect(() => verifyAccessToken(mockToken)).toThrow('Invalid token');
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify and decode a valid refresh token', () => {
      const mockToken = 'valid-refresh-token';
      const mockDecoded = { id: mockUser.id };
      jwt.verify.mockReturnValue(mockDecoded);

      const decoded = verifyRefreshToken(mockToken);

      expect(jwt.verify).toHaveBeenCalledWith(mockToken, process.env.JWT_REFRESH_SECRET);
      expect(decoded).toEqual(mockDecoded);
    });

    it('should throw error for expired token', () => {
      const mockToken = 'expired-token';
      jwt.verify.mockImplementation(() => {
        const error = new Error('Token expired');
        error.name = 'TokenExpiredError';
        throw error;
      });

      expect(() => verifyRefreshToken(mockToken)).toThrow('Token expired');
    });
  });
});
