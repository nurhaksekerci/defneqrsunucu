const jwt = require('jsonwebtoken');
const config = require('../config');

const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1] || req.cookies.token;
    if (!token) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = { id: decoded.userId };
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

const authorize = (...roles) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    try {
      const axios = require('axios');
      const { data } = await axios.get(`${config.commonUrl}/api/auth/me`, {
        headers: { Authorization: `Bearer ${req.headers.authorization?.split(' ')[1] || req.cookies.token}` }
      });
      if (!data?.data?.role || !roles.includes(data.data.role)) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }
      req.user = data.data;
      next();
    } catch (err) {
      if (err.response?.status === 401) return res.status(401).json({ success: false, message: 'Invalid token' });
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
  };
};

module.exports = { authenticate, authorize };
