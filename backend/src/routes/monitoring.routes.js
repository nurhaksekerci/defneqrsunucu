const express = require('express');
const router = express.Router();
const { getMetrics, getMetricsJSON } = require('../utils/metrics');
const {
  performHealthCheck,
  quickHealthCheck,
  readinessCheck
} = require('../utils/healthCheck');
const { authenticate, authorize } = require('../middleware/auth.middleware');

/**
 * GET /health
 * Quick health check (liveness probe)
 * Public endpoint
 */
router.get('/health', async (req, res) => {
  const health = await quickHealthCheck();
  const statusCode = health.status === 'ok' ? 200 : 503;
  res.status(statusCode).json(health);
});

/**
 * GET /health/detailed
 * Detailed health check
 * Protected endpoint (admin only)
 */
router.get('/health/detailed', authenticate, authorize('ADMIN'), async (req, res) => {
  const health = await performHealthCheck();
  const statusCode = health.status === 'healthy' ? 200 : 
                     health.status === 'warning' ? 200 : 503;
  res.status(statusCode).json(health);
});

/**
 * GET /health/ready
 * Readiness probe (Kubernetes-style)
 * Public endpoint
 */
router.get('/health/ready', async (req, res) => {
  const readiness = await readinessCheck();
  const statusCode = readiness.status === 'ready' ? 200 : 503;
  res.status(statusCode).json(readiness);
});

/**
 * GET /health/live
 * Liveness probe (Kubernetes-style)
 * Public endpoint
 */
router.get('/health/live', async (req, res) => {
  // Simple check - if we can respond, we're alive
  res.json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime())
  });
});

/**
 * GET /metrics
 * Prometheus metrics endpoint
 * Protected in production, open in development
 */
router.get('/metrics', async (req, res) => {
  // In production, protect this endpoint
  // In development, allow access for easy testing
  if (process.env.NODE_ENV === 'production' && process.env.METRICS_PUBLIC !== 'true') {
    // Check for basic auth or API key
    const authHeader = req.headers.authorization;
    const metricsToken = process.env.METRICS_TOKEN;
    
    if (metricsToken) {
      if (!authHeader || authHeader !== `Bearer ${metricsToken}`) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized access to metrics'
        });
      }
    }
  }
  
  try {
    const metrics = await getMetrics();
    res.set('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
    res.send(metrics);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve metrics',
      error: error.message
    });
  }
});

/**
 * GET /metrics/json
 * Metrics in JSON format
 * Protected endpoint (admin only)
 */
router.get('/metrics/json', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const metrics = await getMetricsJSON();
    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve metrics',
      error: error.message
    });
  }
});

module.exports = router;
