const { PrismaClient } = require('@prisma/client');

/**
 * Query performance monitoring configuration
 * Logs slow queries and tracks query metrics
 */

const SLOW_QUERY_THRESHOLD = parseInt(process.env.SLOW_QUERY_THRESHOLD) || 1000; // 1 second
const ENABLE_QUERY_LOGGING = process.env.ENABLE_QUERY_LOGGING === 'true';

// Query statistics
const queryStats = {
  totalQueries: 0,
  slowQueries: 0,
  queryTypes: {},
  averageTime: 0
};

/**
 * Setup Prisma query monitoring middleware
 * @param {PrismaClient} prisma
 */
exports.setupQueryMonitoring = (prisma) => {
  if (!ENABLE_QUERY_LOGGING) {
    console.log('📊 Query monitoring: Disabled (set ENABLE_QUERY_LOGGING=true to enable)');
    return;
  }

  console.log('📊 Query monitoring: Enabled');
  console.log(`⏱️  Slow query threshold: ${SLOW_QUERY_THRESHOLD}ms`);

  // Log all queries
  prisma.$use(async (params, next) => {
    const before = Date.now();
    
    try {
      const result = await next(params);
      const after = Date.now();
      const duration = after - before;

      // Update statistics
      queryStats.totalQueries++;
      queryStats.queryTypes[params.action] = (queryStats.queryTypes[params.action] || 0) + 1;
      queryStats.averageTime = ((queryStats.averageTime * (queryStats.totalQueries - 1)) + duration) / queryStats.totalQueries;

      // Log slow queries
      if (duration > SLOW_QUERY_THRESHOLD) {
        queryStats.slowQueries++;
        console.warn(`🐌 SLOW QUERY (${duration}ms):`, {
          model: params.model,
          action: params.action,
          duration: `${duration}ms`,
          args: JSON.stringify(params.args, null, 2)
        });
      } else if (process.env.LOG_ALL_QUERIES === 'true') {
        // Log all queries in verbose mode
        console.log(`📊 Query (${duration}ms):`, {
          model: params.model,
          action: params.action,
          duration: `${duration}ms`
        });
      }

      return result;
    } catch (error) {
      const after = Date.now();
      const duration = after - before;

      console.error(`❌ QUERY ERROR (${duration}ms):`, {
        model: params.model,
        action: params.action,
        duration: `${duration}ms`,
        error: error.message
      });

      throw error;
    }
  });
};

/**
 * Get query statistics
 */
exports.getQueryStats = () => {
  return {
    ...queryStats,
    averageTime: Math.round(queryStats.averageTime * 100) / 100 // 2 decimal places
  };
};

/**
 * Reset query statistics
 */
exports.resetQueryStats = () => {
  queryStats.totalQueries = 0;
  queryStats.slowQueries = 0;
  queryStats.queryTypes = {};
  queryStats.averageTime = 0;
};

/**
 * Middleware to log query stats periodically
 */
exports.startPeriodicLogging = (intervalMinutes = 60) => {
  if (!ENABLE_QUERY_LOGGING) return;

  setInterval(() => {
    if (queryStats.totalQueries > 0) {
      console.log('📊 Query Statistics:', {
        totalQueries: queryStats.totalQueries,
        slowQueries: queryStats.slowQueries,
        slowQueryPercentage: `${((queryStats.slowQueries / queryStats.totalQueries) * 100).toFixed(2)}%`,
        averageTime: `${queryStats.averageTime.toFixed(2)}ms`,
        queryTypes: queryStats.queryTypes
      });
    }
  }, intervalMinutes * 60 * 1000);
};

/**
 * Express middleware for query stats endpoint
 */
exports.queryStatsEndpoint = (req, res) => {
  res.json({
    success: true,
    data: exports.getQueryStats()
  });
};
