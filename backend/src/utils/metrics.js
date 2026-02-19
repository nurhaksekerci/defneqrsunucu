const promClient = require('prom-client');
const logger = require('./logger');

// Create a Registry
const register = new promClient.Registry();

// Add default metrics (CPU, memory, etc.)
promClient.collectDefaultMetrics({
  register,
  prefix: 'defneqr_',
  gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5]
});

// ===========================
// HTTP Metrics
// ===========================

// HTTP request duration histogram
const httpRequestDuration = new promClient.Histogram({
  name: 'defneqr_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10]
});
register.registerMetric(httpRequestDuration);

// HTTP request counter
const httpRequestCounter = new promClient.Counter({
  name: 'defneqr_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});
register.registerMetric(httpRequestCounter);

// HTTP response size
const httpResponseSize = new promClient.Histogram({
  name: 'defneqr_http_response_size_bytes',
  help: 'Size of HTTP responses in bytes',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [100, 1000, 10000, 100000, 1000000]
});
register.registerMetric(httpResponseSize);

// Active requests gauge
const activeRequests = new promClient.Gauge({
  name: 'defneqr_http_active_requests',
  help: 'Number of active HTTP requests'
});
register.registerMetric(activeRequests);

// ===========================
// Database Metrics
// ===========================

// Database query duration
const dbQueryDuration = new promClient.Histogram({
  name: 'defneqr_db_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['model', 'operation'],
  buckets: [0.001, 0.01, 0.05, 0.1, 0.5, 1, 2, 5]
});
register.registerMetric(dbQueryDuration);

// Database query counter
const dbQueryCounter = new promClient.Counter({
  name: 'defneqr_db_queries_total',
  help: 'Total number of database queries',
  labelNames: ['model', 'operation', 'status']
});
register.registerMetric(dbQueryCounter);

// Database connection pool
const dbConnectionPool = new promClient.Gauge({
  name: 'defneqr_db_connection_pool_size',
  help: 'Number of database connections in the pool',
  labelNames: ['state']
});
register.registerMetric(dbConnectionPool);

// ===========================
// Business Metrics
// ===========================

// User registrations
const userRegistrations = new promClient.Counter({
  name: 'defneqr_user_registrations_total',
  help: 'Total number of user registrations',
  labelNames: ['provider']
});
register.registerMetric(userRegistrations);

// Login attempts
const loginAttempts = new promClient.Counter({
  name: 'defneqr_login_attempts_total',
  help: 'Total number of login attempts',
  labelNames: ['status', 'provider']
});
register.registerMetric(loginAttempts);

// QR menu scans
const qrScans = new promClient.Counter({
  name: 'defneqr_qr_scans_total',
  help: 'Total number of QR menu scans',
  labelNames: ['restaurant_id']
});
register.registerMetric(qrScans);

// Orders
const orders = new promClient.Counter({
  name: 'defneqr_orders_total',
  help: 'Total number of orders',
  labelNames: ['restaurant_id', 'status']
});
register.registerMetric(orders);

// Order value
const orderValue = new promClient.Histogram({
  name: 'defneqr_order_value',
  help: 'Order value distribution',
  labelNames: ['restaurant_id'],
  buckets: [10, 50, 100, 200, 500, 1000, 2000, 5000]
});
register.registerMetric(orderValue);

// Active restaurants
const activeRestaurants = new promClient.Gauge({
  name: 'defneqr_active_restaurants',
  help: 'Number of active restaurants'
});
register.registerMetric(activeRestaurants);

// Active users
const activeUsers = new promClient.Gauge({
  name: 'defneqr_active_users',
  help: 'Number of active users'
});
register.registerMetric(activeUsers);

// File uploads
const fileUploads = new promClient.Counter({
  name: 'defneqr_file_uploads_total',
  help: 'Total number of file uploads',
  labelNames: ['type', 'status']
});
register.registerMetric(fileUploads);

// ===========================
// Error Metrics
// ===========================

// Application errors
const applicationErrors = new promClient.Counter({
  name: 'defneqr_errors_total',
  help: 'Total number of application errors',
  labelNames: ['type', 'severity']
});
register.registerMetric(applicationErrors);

// ===========================
// Cache Metrics (Future)
// ===========================

// Cache hits/misses
const cacheOperations = new promClient.Counter({
  name: 'defneqr_cache_operations_total',
  help: 'Total number of cache operations',
  labelNames: ['operation', 'status']
});
register.registerMetric(cacheOperations);

// ===========================
// Helper Functions
// ===========================

/**
 * Record HTTP request metrics
 */
function recordHttpRequest(method, route, statusCode, duration, responseSize) {
  const labels = {
    method: method.toUpperCase(),
    route: normalizeRoute(route),
    status_code: statusCode
  };

  httpRequestDuration.observe(labels, duration / 1000); // Convert to seconds
  httpRequestCounter.inc(labels);
  
  if (responseSize) {
    // Ensure responseSize is a number
    const size = typeof responseSize === 'string' ? parseInt(responseSize, 10) : responseSize;
    if (!isNaN(size) && size > 0) {
      httpResponseSize.observe(labels, size);
    }
  }
}

/**
 * Normalize route for metrics (remove IDs)
 */
function normalizeRoute(route) {
  if (!route) return 'unknown';
  
  // Remove UUIDs
  route = route.replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, ':id');
  
  // Remove numeric IDs
  route = route.replace(/\/\d+/g, '/:id');
  
  // Remove slugs (alphanumeric with hyphens)
  route = route.replace(/\/[a-z0-9-]+(?=\/|$)/gi, '/:slug');
  
  return route;
}

/**
 * Increment active requests
 */
function incrementActiveRequests() {
  activeRequests.inc();
}

/**
 * Decrement active requests
 */
function decrementActiveRequests() {
  activeRequests.dec();
}

/**
 * Record database query
 */
function recordDbQuery(model, operation, duration, status = 'success') {
  const labels = { model, operation, status };
  
  dbQueryDuration.observe({ model, operation }, duration / 1000);
  dbQueryCounter.inc(labels);
}

/**
 * Record user registration
 */
function recordUserRegistration(provider = 'email') {
  userRegistrations.inc({ provider });
}

/**
 * Record login attempt
 */
function recordLoginAttempt(status, provider = 'email') {
  loginAttempts.inc({ status, provider });
}

/**
 * Record QR scan
 */
function recordQrScan(restaurantId) {
  qrScans.inc({ restaurant_id: restaurantId });
}

/**
 * Record order
 */
function recordOrder(restaurantId, status, value) {
  orders.inc({ restaurant_id: restaurantId, status });
  
  if (value) {
    orderValue.observe({ restaurant_id: restaurantId }, value);
  }
}

/**
 * Record file upload
 */
function recordFileUpload(type, status = 'success') {
  fileUploads.inc({ type, status });
}

/**
 * Record error
 */
function recordError(type, severity = 'error') {
  applicationErrors.inc({ type, severity });
}

/**
 * Update active restaurants count
 */
function updateActiveRestaurants(count) {
  activeRestaurants.set(count);
}

/**
 * Update active users count
 */
function updateActiveUsers(count) {
  activeUsers.set(count);
}

/**
 * Get metrics in Prometheus format
 */
async function getMetrics() {
  return register.metrics();
}

/**
 * Get metrics as JSON
 */
async function getMetricsJSON() {
  const metrics = await register.getMetricsAsJSON();
  return metrics;
}

/**
 * Reset all metrics (useful for testing)
 */
function resetMetrics() {
  register.resetMetrics();
  logger.info('Metrics reset');
}

// Initialize metrics
logger.info('Prometheus metrics initialized', {
  prefix: 'defneqr_',
  metricsCount: register.metrics().length
});

module.exports = {
  register,
  
  // HTTP
  recordHttpRequest,
  incrementActiveRequests,
  decrementActiveRequests,
  
  // Database
  recordDbQuery,
  
  // Business
  recordUserRegistration,
  recordLoginAttempt,
  recordQrScan,
  recordOrder,
  recordFileUpload,
  updateActiveRestaurants,
  updateActiveUsers,
  
  // Errors
  recordError,
  
  // Export
  getMetrics,
  getMetricsJSON,
  resetMetrics
};
