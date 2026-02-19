const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const prisma = require('../config/database');

/**
 * Generate Access Token (Short-lived)
 * @param {string} userId 
 * @returns {string} JWT token
 */
exports.generateAccessToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: '15m' } // 15 minutes - short-lived for security
  );
};

/**
 * Generate Refresh Token (Long-lived)
 * @param {string} userId 
 * @param {string} userAgent 
 * @param {string} ipAddress 
 * @returns {Promise<{token: string, expiresAt: Date}>}
 */
exports.generateRefreshToken = async (userId, userAgent = null, ipAddress = null) => {
  // Generate random token
  const token = crypto.randomBytes(40).toString('hex');
  
  // 7 days expiration
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  
  // Save to database
  await prisma.refreshToken.create({
    data: {
      userId,
      token,
      expiresAt,
      userAgent,
      ipAddress
    }
  });
  
  return { token, expiresAt };
};

/**
 * Verify and decode access token
 * @param {string} token 
 * @returns {Promise<object>} Decoded token or null
 */
exports.verifyAccessToken = async (token) => {
  try {
    // Check if token is blacklisted
    const blacklisted = await prisma.tokenBlacklist.findUnique({
      where: { token }
    });
    
    if (blacklisted) {
      return null;
    }
    
    // Verify JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
  } catch (error) {
    return null;
  }
};

/**
 * Verify refresh token
 * @param {string} token 
 * @returns {Promise<object>} Token record or null
 */
exports.verifyRefreshToken = async (token) => {
  try {
    const refreshToken = await prisma.refreshToken.findUnique({
      where: { token },
      include: { user: true }
    });
    
    if (!refreshToken) {
      return null;
    }
    
    // Check if revoked
    if (refreshToken.isRevoked) {
      return null;
    }
    
    // Check if expired
    if (new Date() > refreshToken.expiresAt) {
      return null;
    }
    
    return refreshToken;
  } catch (error) {
    return null;
  }
};

/**
 * Revoke a refresh token
 * @param {string} token 
 * @returns {Promise<boolean>}
 */
exports.revokeRefreshToken = async (token) => {
  try {
    await prisma.refreshToken.update({
      where: { token },
      data: {
        isRevoked: true,
        revokedAt: new Date()
      }
    });
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Revoke all refresh tokens for a user
 * @param {string} userId 
 * @returns {Promise<number>} Number of revoked tokens
 */
exports.revokeAllUserTokens = async (userId) => {
  try {
    const result = await prisma.refreshToken.updateMany({
      where: {
        userId,
        isRevoked: false
      },
      data: {
        isRevoked: true,
        revokedAt: new Date()
      }
    });
    return result.count;
  } catch (error) {
    return 0;
  }
};

/**
 * Add access token to blacklist
 * @param {string} token 
 * @param {string} reason 
 * @returns {Promise<boolean>}
 */
exports.blacklistAccessToken = async (token, reason = 'logout') => {
  try {
    // Decode to get expiration
    const decoded = jwt.decode(token);
    if (!decoded || !decoded.exp) {
      return false;
    }
    
    const expiresAt = new Date(decoded.exp * 1000);
    
    await prisma.tokenBlacklist.create({
      data: {
        token,
        expiresAt,
        reason
      }
    });
    
    return true;
  } catch (error) {
    console.error('Blacklist error:', error);
    return false;
  }
};

/**
 * Clean up expired tokens (should run periodically)
 * @returns {Promise<{refreshTokens: number, blacklist: number}>}
 */
exports.cleanupExpiredTokens = async () => {
  try {
    const now = new Date();
    
    // Delete expired refresh tokens
    const refreshTokens = await prisma.refreshToken.deleteMany({
      where: {
        expiresAt: { lt: now }
      }
    });
    
    // Delete expired blacklisted tokens
    const blacklist = await prisma.tokenBlacklist.deleteMany({
      where: {
        expiresAt: { lt: now }
      }
    });
    
    return {
      refreshTokens: refreshTokens.count,
      blacklist: blacklist.count
    };
  } catch (error) {
    console.error('Cleanup error:', error);
    return { refreshTokens: 0, blacklist: 0 };
  }
};

/**
 * Get user's active refresh tokens
 * @param {string} userId 
 * @returns {Promise<Array>}
 */
exports.getUserActiveSessions = async (userId) => {
  try {
    return await prisma.refreshToken.findMany({
      where: {
        userId,
        isRevoked: false,
        expiresAt: { gt: new Date() }
      },
      select: {
        id: true,
        userAgent: true,
        ipAddress: true,
        createdAt: true,
        expiresAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  } catch (error) {
    return [];
  }
};
