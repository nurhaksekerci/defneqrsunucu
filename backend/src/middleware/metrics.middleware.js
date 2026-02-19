const responseTime = require('response-time');
const {
  recordHttpRequest,
  incrementActiveRequests,
  decrementActiveRequests
} = require('../utils/metrics');

/**
 * Metrics middleware for tracking HTTP requests
 */
function metricsMiddleware() {
  return responseTime((req, res, time) => {
    // Skip metrics endpoint itself
    if (req.path === '/metrics' || req.path === '/api/metrics') {
      return;
    }

    const route = req.route ? req.route.path : req.path;
    const method = req.method;
    const statusCode = res.statusCode;
    
    // Get response size from Content-Length header
    const responseSize = res.getHeader('Content-Length');

    // Record metrics
    recordHttpRequest(method, route, statusCode, time, responseSize);
  });
}

/**
 * Middleware to track active requests
 */
function activeRequestsMiddleware(req, res, next) {
  // Skip metrics endpoint
  if (req.path === '/metrics' || req.path === '/api/metrics') {
    return next();
  }

  // Increment on request start
  incrementActiveRequests();

  // Decrement on request end
  res.on('finish', () => {
    decrementActiveRequests();
  });

  res.on('close', () => {
    decrementActiveRequests();
  });

  next();
}

module.exports = {
  metricsMiddleware,
  activeRequestsMiddleware
};
