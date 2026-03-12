const jwt = require('jsonwebtoken');

// JWT verify - no User lookup (users live in backend-common)
// req.user = { id: decoded.userId } for ownerId checks
const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1] || req.cookies?.token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({
        success: false,
        message: 'Server configuration error'
      });
    }

    const decoded = jwt.verify(token, secret);

    if (!decoded?.userId) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    req.user = { id: decoded.userId };
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
};

module.exports = { authenticate };
