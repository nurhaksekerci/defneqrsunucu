const jwt = require('jsonwebtoken');
const prisma = require('../config/database');
const tokenManager = require('../utils/tokenManager');

// Token doğrulama middleware
const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1] || req.cookies.token;
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Verify token (includes blacklist check)
    const decoded = await tokenManager.verifyAccessToken(token);
    
    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or revoked token'
      });
    }
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId, isDeleted: false },
      select: {
        id: true,
        email: true,
        username: true,
        fullName: true,
        role: true
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
};

// Rol bazlı yetkilendirme middleware
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.'
      });
    }

    next();
  };
};

module.exports = { authenticate, authorize };
