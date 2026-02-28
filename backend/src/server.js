const path = require('path');
// Load environment variables from root .env file
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const session = require('express-session');
const passport = require('./config/passport');

// Logging & Error Tracking
const logger = require('./utils/logger');
const { initializeSentry, requestHandler, tracingHandler, errorHandler: sentryErrorHandler } = require('./config/sentry');
const { 
  errorHandler, 
  notFoundHandler, 
  handleUnhandledRejection, 
  handleUncaughtException 
} = require('./middleware/errorHandler.middleware');

const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy (Nginx reverse proxy için gerekli)
app.set('trust proxy', 1);

// Initialize Sentry (must be first)
initializeSentry(app);

// Setup global error handlers
handleUnhandledRejection();
handleUncaughtException();

// Sentry request handler (must be first middleware)
app.use(requestHandler());
app.use(tracingHandler());

// Serve static files FIRST (before other middleware)
const uploadsPath = path.join(__dirname, '../public/uploads');
console.log('📁 Serving static files from:', uploadsPath);
app.use('/uploads', express.static(uploadsPath));

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false // Disable CSP for development
}));
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'https://www.defneqr.com',
    'https://defneqr.com',
    'http://localhost:3000'
  ],
  credentials: true
}));

// HTTP request logging (Morgan + Winston)
const morgan = require('morgan');
const morganFormat = process.env.NODE_ENV === 'production' ? 'combined' : 'dev';
app.use(morgan(morganFormat, { stream: logger.stream }));

// Metrics middleware (Prometheus)
const { metricsMiddleware, activeRequestsMiddleware } = require('./middleware/metrics.middleware');
app.use(activeRequestsMiddleware);
app.use(metricsMiddleware());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// XSS Protection & Input Sanitization
// DISABLED: HTML entity encoding breaks URLs and JSON data
// We rely on:
// - express-validator for input validation
// - Prisma for SQL injection protection
// - Content Security Policy headers for XSS protection
// const { sanitizeRequest } = require('./middleware/sanitize.middleware');
// app.use(sanitizeRequest);

// Session configuration for OAuth
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Rate limiting (development için gevşetildi)
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 1000, // limit each IP to 1000 requests per minute
  message: 'Çok fazla istek gönderildi, lütfen bir süre bekleyin.'
});
app.use('/api/', limiter);

// Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/auth', require('./routes/oauth.routes')); // Google OAuth routes
app.use('/api/users', require('./routes/user.routes'));
app.use('/api/restaurants', require('./routes/restaurant.routes'));
app.use('/api/restaurants', require('./routes/staff.routes'));
app.use('/api/categories', require('./routes/category.routes'));
app.use('/api/products', require('./routes/product.routes'));
app.use('/api/orders', require('./routes/order.routes'));
app.use('/api/stocks', require('./routes/stock.routes'));
app.use('/api/payments', require('./routes/payment.routes'));
app.use('/api/reports', require('./routes/report.routes'));
app.use('/api/upload', require('./routes/upload.routes'));
app.use('/api/settings', require('./routes/settings.routes'));
app.use('/api/scans', require('./routes/scan.routes'));
app.use('/api/tables', require('./routes/table.routes'));
app.use('/api/plans', require('./routes/plan.routes'));
app.use('/api/subscriptions', require('./routes/subscription.routes'));
app.use('/api/promo-codes', require('./routes/promoCode.routes'));
app.use('/api/affiliates', require('./routes/affiliate.routes'));
app.use('/api/tickets', require('./routes/ticket.routes'));

// Monitoring routes (health checks & metrics)
app.use('/api', require('./routes/monitoring.routes'));

// Root-level /health (Docker, load balancer, K8s için - /api/health ile aynı)
const { quickHealthCheck } = require('./utils/healthCheck');
app.get('/health', async (req, res) => {
  const health = await quickHealthCheck();
  const statusCode = health.status === 'ok' ? 200 : 503;
  res.status(statusCode).json(health);
});

// Sentry error handler (must be before other error handlers)
app.use(sentryErrorHandler());

// 404 handler
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

// Start periodic token cleanup
const { startPeriodicCleanup } = require('./utils/tokenCleanup');
startPeriodicCleanup();

// Start query monitoring (if enabled)
const { startPeriodicLogging, queryStatsEndpoint } = require('./middleware/queryMonitoring.middleware');
startPeriodicLogging(60); // Log stats every 60 minutes

// Query stats endpoint (admin only)
const { authenticate, authorize } = require('./middleware/auth.middleware');
app.get('/api/query-stats', authenticate, authorize('ADMIN'), queryStatsEndpoint);

// Start server with monitoring and health checks
const server = app.listen(PORT, () => {
  logger.info('🚀 Server started successfully', {
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    nodeVersion: process.version,
    pid: process.pid
  });
});

// Setup graceful shutdown
const { setupGracefulShutdown } = require('./middleware/errorHandler.middleware');
setupGracefulShutdown(server);

module.exports = app;