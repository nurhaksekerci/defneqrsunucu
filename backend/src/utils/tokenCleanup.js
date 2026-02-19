const tokenManager = require('./tokenManager');

/**
 * Scheduled task to clean up expired tokens
 * Should run periodically (e.g., every hour or daily)
 */
const cleanupExpiredTokens = async () => {
  try {
    console.log('[Token Cleanup] Starting cleanup of expired tokens...');
    
    const result = await tokenManager.cleanupExpiredTokens();
    
    console.log('[Token Cleanup] Cleanup completed:', {
      expiredRefreshTokens: result.refreshTokens,
      expiredBlacklistedTokens: result.blacklist,
      timestamp: new Date().toISOString()
    });
    
    return result;
  } catch (error) {
    console.error('[Token Cleanup] Cleanup failed:', error);
    return { refreshTokens: 0, blacklist: 0 };
  }
};

/**
 * Start periodic cleanup (runs every hour)
 * Call this in your server.js during initialization
 */
const startPeriodicCleanup = () => {
  // Run immediately on startup
  cleanupExpiredTokens();
  
  // Then run every hour
  const CLEANUP_INTERVAL = 60 * 60 * 1000; // 1 hour in milliseconds
  setInterval(cleanupExpiredTokens, CLEANUP_INTERVAL);
  
  console.log('[Token Cleanup] Periodic cleanup scheduled (every 1 hour)');
};

module.exports = {
  cleanupExpiredTokens,
  startPeriodicCleanup
};
