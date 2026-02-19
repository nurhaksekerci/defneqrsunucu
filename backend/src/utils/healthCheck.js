const prisma = require('../config/database');
const logger = require('./logger');
const os = require('os');

/**
 * Check database health
 */
async function checkDatabase() {
  const startTime = Date.now();
  
  try {
    // Simple query to check database connectivity
    await prisma.$queryRaw`SELECT 1`;
    
    const duration = Date.now() - startTime;
    
    return {
      status: 'healthy',
      message: 'Database connection successful',
      responseTime: `${duration}ms`,
      details: {
        connected: true,
        queryExecuted: true
      }
    };
  } catch (error) {
    logger.error('Database health check failed', error);
    
    return {
      status: 'unhealthy',
      message: 'Database connection failed',
      error: error.message,
      details: {
        connected: false
      }
    };
  }
}

/**
 * Check database pool status
 */
async function checkDatabasePool() {
  try {
    const metrics = await prisma.$metrics.json();
    
    const poolSize = metrics.counters.find(c => c.key === 'prisma_pool_connections_open')?.value || 0;
    const poolIdle = metrics.counters.find(c => c.key === 'prisma_pool_connections_idle')?.value || 0;
    
    return {
      status: 'healthy',
      message: 'Database pool status',
      details: {
        total: poolSize,
        idle: poolIdle,
        active: poolSize - poolIdle
      }
    };
  } catch (error) {
    return {
      status: 'unknown',
      message: 'Could not retrieve pool metrics',
      error: error.message
    };
  }
}

/**
 * Check system resources
 */
function checkSystemResources() {
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemory = totalMemory - freeMemory;
  const memoryUsagePercent = ((usedMemory / totalMemory) * 100).toFixed(2);
  
  const cpuUsage = process.cpuUsage();
  const cpuPercent = ((cpuUsage.user + cpuUsage.system) / 1000000).toFixed(2);
  
  const uptime = process.uptime();
  
  const status = memoryUsagePercent > 90 ? 'warning' : 'healthy';
  
  return {
    status,
    message: 'System resources',
    details: {
      memory: {
        total: `${(totalMemory / 1024 / 1024 / 1024).toFixed(2)} GB`,
        free: `${(freeMemory / 1024 / 1024 / 1024).toFixed(2)} GB`,
        used: `${(usedMemory / 1024 / 1024 / 1024).toFixed(2)} GB`,
        usagePercent: `${memoryUsagePercent}%`
      },
      cpu: {
        user: `${(cpuUsage.user / 1000000).toFixed(2)}s`,
        system: `${(cpuUsage.system / 1000000).toFixed(2)}s`,
        percent: `${cpuPercent}%`
      },
      process: {
        uptime: `${Math.floor(uptime / 60)} minutes`,
        pid: process.pid,
        nodeVersion: process.version,
        platform: os.platform(),
        arch: os.arch()
      },
      system: {
        hostname: os.hostname(),
        cpuCores: os.cpus().length,
        loadAverage: os.loadavg()
      }
    }
  };
}

/**
 * Check disk space (if available)
 */
function checkDiskSpace() {
  try {
    // This is a basic check, in production you might want to use a library like 'check-disk-space'
    return {
      status: 'unknown',
      message: 'Disk space monitoring not configured',
      details: {
        note: 'Consider using check-disk-space library for production'
      }
    };
  } catch (error) {
    return {
      status: 'unknown',
      message: 'Could not check disk space',
      error: error.message
    };
  }
}

/**
 * Check external services (if any)
 */
async function checkExternalServices() {
  const services = [];
  
  // Check Sentry (if configured)
  if (process.env.SENTRY_DSN) {
    services.push({
      name: 'Sentry',
      status: 'configured',
      details: {
        dsn: process.env.SENTRY_DSN.substring(0, 20) + '...'
      }
    });
  }
  
  // Check email service (if configured)
  if (process.env.SMTP_HOST) {
    services.push({
      name: 'Email (SMTP)',
      status: 'configured',
      details: {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT
      }
    });
  }
  
  // Check Google OAuth (if configured)
  if (process.env.GOOGLE_CLIENT_ID) {
    services.push({
      name: 'Google OAuth',
      status: 'configured'
    });
  }
  
  return {
    status: 'info',
    message: `${services.length} external services configured`,
    details: services
  };
}

/**
 * Get application info
 */
function getApplicationInfo() {
  return {
    name: 'Defne Qr API',
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    nodeVersion: process.version,
    uptime: `${Math.floor(process.uptime() / 60)} minutes`,
    timestamp: new Date().toISOString()
  };
}

/**
 * Perform full health check
 */
async function performHealthCheck() {
  const startTime = Date.now();
  
  try {
    // Run all checks in parallel
    const [
      databaseHealth,
      databasePoolHealth,
      systemHealth,
      diskHealth,
      externalServicesHealth
    ] = await Promise.all([
      checkDatabase(),
      checkDatabasePool(),
      Promise.resolve(checkSystemResources()),
      Promise.resolve(checkDiskSpace()),
      checkExternalServices()
    ]);
    
    // Determine overall status
    const checks = [databaseHealth, databasePoolHealth, systemHealth];
    const hasUnhealthy = checks.some(check => check.status === 'unhealthy');
    const hasWarning = checks.some(check => check.status === 'warning');
    
    let overallStatus = 'healthy';
    if (hasUnhealthy) {
      overallStatus = 'unhealthy';
    } else if (hasWarning) {
      overallStatus = 'warning';
    }
    
    const duration = Date.now() - startTime;
    
    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      duration: `${duration}ms`,
      application: getApplicationInfo(),
      checks: {
        database: databaseHealth,
        databasePool: databasePoolHealth,
        system: systemHealth,
        disk: diskHealth,
        externalServices: externalServicesHealth
      }
    };
  } catch (error) {
    logger.error('Health check failed', error);
    
    return {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
      application: getApplicationInfo()
    };
  }
}

/**
 * Quick health check (basic liveness probe)
 */
async function quickHealthCheck() {
  try {
    // Just check database connectivity
    await prisma.$queryRaw`SELECT 1`;
    
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: `${Math.floor(process.uptime() / 60)} minutes`
    };
  } catch (error) {
    return {
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error.message
    };
  }
}

/**
 * Readiness check (ready to accept traffic)
 */
async function readinessCheck() {
  try {
    // Check if database is ready
    await prisma.$queryRaw`SELECT 1`;
    
    // Check if critical resources are available
    const freeMemory = os.freemem();
    const totalMemory = os.totalmem();
    const memoryUsagePercent = ((totalMemory - freeMemory) / totalMemory) * 100;
    
    // Not ready if memory usage > 95%
    if (memoryUsagePercent > 95) {
      return {
        status: 'not_ready',
        reason: 'High memory usage',
        details: {
          memoryUsage: `${memoryUsagePercent.toFixed(2)}%`
        }
      };
    }
    
    return {
      status: 'ready',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: 'not_ready',
      reason: 'Database not available',
      error: error.message
    };
  }
}

module.exports = {
  performHealthCheck,
  quickHealthCheck,
  readinessCheck,
  checkDatabase,
  checkSystemResources,
  getApplicationInfo
};
