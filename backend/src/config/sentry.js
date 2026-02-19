const Sentry = require('@sentry/node');
const { ProfilingIntegration } = require('@sentry/profiling-node');
const logger = require('../utils/logger');

/**
 * Initialize Sentry for error tracking
 * @param {Express} app - Express application instance
 */
function initializeSentry(app) {
  // Only initialize if DSN is provided
  if (!process.env.SENTRY_DSN) {
    logger.warn('Sentry DSN not configured - Error tracking disabled');
    return;
  }

  try {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV || 'development',
      
      // Performance monitoring
      tracesSampleRate: process.env.SENTRY_TRACES_SAMPLE_RATE 
        ? parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE) 
        : 0.1, // 10% of transactions in production
      
      // Profiling
      profilesSampleRate: process.env.SENTRY_PROFILES_SAMPLE_RATE 
        ? parseFloat(process.env.SENTRY_PROFILES_SAMPLE_RATE) 
        : 0.1,
      
      integrations: [
        // Enable HTTP calls tracing
        new Sentry.Integrations.Http({ tracing: true }),
        
        // Enable Express.js middleware tracing
        new Sentry.Integrations.Express({ app }),
        
        // Enable profiling
        new ProfilingIntegration(),
      ],
      
      // Release tracking
      release: process.env.SENTRY_RELEASE || 'defneqr@1.0.0',
      
      // Before send hook - filter sensitive data
      beforeSend(event, hint) {
        // Don't send events in development (unless forced)
        if (process.env.NODE_ENV === 'development' && !process.env.SENTRY_FORCE_DEV) {
          return null;
        }
        
        // Remove sensitive data from request
        if (event.request) {
          // Remove authorization headers
          if (event.request.headers) {
            delete event.request.headers.authorization;
            delete event.request.headers.cookie;
          }
          
          // Remove sensitive body fields
          if (event.request.data) {
            const sensitiveFields = ['password', 'token', 'secret', 'apiKey'];
            sensitiveFields.forEach(field => {
              if (event.request.data[field]) {
                event.request.data[field] = '[REDACTED]';
              }
            });
          }
        }
        
        // Remove sensitive extra data
        if (event.extra) {
          const sensitiveKeys = ['password', 'token', 'secret', 'apiKey', 'refreshToken', 'accessToken'];
          sensitiveKeys.forEach(key => {
            if (event.extra[key]) {
              event.extra[key] = '[REDACTED]';
            }
          });
        }
        
        return event;
      },
      
      // Ignore certain errors
      ignoreErrors: [
        // Browser errors
        'ResizeObserver loop limit exceeded',
        'Non-Error promise rejection captured',
        
        // Network errors
        'NetworkError',
        'Network request failed',
        
        // Validation errors (logged but not tracked in Sentry)
        'ValidationError',
        
        // Rate limit errors (expected behavior)
        'Too Many Requests'
      ]
    });

    logger.info('✅ Sentry initialized successfully', {
      environment: process.env.NODE_ENV,
      dsn: process.env.SENTRY_DSN.substring(0, 20) + '...',
      tracesSampleRate: Sentry.getCurrentHub().getClient()?.getOptions()?.tracesSampleRate
    });
  } catch (error) {
    logger.error('Failed to initialize Sentry', error);
  }
}

/**
 * Capture exception and send to Sentry
 * @param {Error} error - Error object
 * @param {Object} context - Additional context
 */
function captureException(error, context = {}) {
  if (!process.env.SENTRY_DSN) {
    return;
  }

  Sentry.withScope((scope) => {
    // Add user context
    if (context.user) {
      scope.setUser({
        id: context.user.id,
        email: context.user.email,
        username: context.user.username,
        role: context.user.role
      });
    }

    // Add request context
    if (context.req) {
      scope.setContext('request', {
        method: context.req.method,
        url: context.req.originalUrl,
        ip: context.req.ip,
        userAgent: context.req.get('user-agent')
      });
    }

    // Add custom context
    if (context.extra) {
      Object.keys(context.extra).forEach(key => {
        scope.setExtra(key, context.extra[key]);
      });
    }

    // Set tags
    if (context.tags) {
      Object.keys(context.tags).forEach(key => {
        scope.setTag(key, context.tags[key]);
      });
    }

    // Set level
    if (context.level) {
      scope.setLevel(context.level);
    }

    Sentry.captureException(error);
  });
}

/**
 * Capture message and send to Sentry
 * @param {string} message - Message to capture
 * @param {string} level - Severity level (info, warning, error)
 * @param {Object} context - Additional context
 */
function captureMessage(message, level = 'info', context = {}) {
  if (!process.env.SENTRY_DSN) {
    return;
  }

  Sentry.withScope((scope) => {
    scope.setLevel(level);

    if (context.user) {
      scope.setUser(context.user);
    }

    if (context.extra) {
      Object.keys(context.extra).forEach(key => {
        scope.setExtra(key, context.extra[key]);
      });
    }

    if (context.tags) {
      Object.keys(context.tags).forEach(key => {
        scope.setTag(key, context.tags[key]);
      });
    }

    Sentry.captureMessage(message);
  });
}

/**
 * Get Sentry request handler middleware
 */
function requestHandler() {
  if (!process.env.SENTRY_DSN) {
    return (req, res, next) => next();
  }
  return Sentry.Handlers.requestHandler();
}

/**
 * Get Sentry tracing middleware
 */
function tracingHandler() {
  if (!process.env.SENTRY_DSN) {
    return (req, res, next) => next();
  }
  return Sentry.Handlers.tracingHandler();
}

/**
 * Get Sentry error handler middleware
 */
function errorHandler() {
  if (!process.env.SENTRY_DSN) {
    return (req, res, next) => next();
  }
  return Sentry.Handlers.errorHandler({
    shouldHandleError(error) {
      // Capture all errors with status >= 500
      return error.status >= 500;
    }
  });
}

module.exports = {
  initializeSentry,
  captureException,
  captureMessage,
  requestHandler,
  tracingHandler,
  errorHandler,
  Sentry
};
