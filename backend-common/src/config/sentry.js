const Sentry = require('@sentry/node');
const logger = require('../utils/logger');

function initializeSentry(app) {
  if (!process.env.SENTRY_DSN) {
    logger.warn('Sentry DSN not configured - Error tracking disabled');
    return;
  }

  try {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV || 'development',
      tracesSampleRate: process.env.SENTRY_TRACES_SAMPLE_RATE
        ? parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE)
        : 0.1,
      integrations: [
        new Sentry.Integrations.Http({ tracing: true }),
        new Sentry.Integrations.Express({ app })
      ],
      release: process.env.SENTRY_RELEASE || 'backend-common@1.0.0',
      beforeSend(event, hint) {
        if (process.env.NODE_ENV === 'development' && !process.env.SENTRY_FORCE_DEV) {
          return null;
        }
        if (event.request?.headers) {
          delete event.request.headers.authorization;
          delete event.request.headers.cookie;
        }
        if (event.request?.data) {
          ['password', 'token', 'secret', 'apiKey'].forEach(field => {
            if (event.request.data[field]) event.request.data[field] = '[REDACTED]';
          });
        }
        return event;
      },
      ignoreErrors: ['ResizeObserver loop limit exceeded', 'Non-Error promise rejection captured', 'ValidationError', 'Too Many Requests']
    });
    logger.info('Sentry initialized', { environment: process.env.NODE_ENV });
  } catch (error) {
    logger.error('Failed to initialize Sentry', error);
  }
}

function captureException(error, context = {}) {
  if (!process.env.SENTRY_DSN) return;

  Sentry.withScope((scope) => {
    if (context.user) {
      scope.setUser({
        id: context.user.id,
        email: context.user.email,
        username: context.user.username,
        role: context.user.role
      });
    }
    if (context.req) {
      scope.setContext('request', {
        method: context.req.method,
        url: context.req.originalUrl,
        ip: context.req.ip
      });
    }
    if (context.extra) {
      Object.keys(context.extra).forEach(key => scope.setExtra(key, context.extra[key]));
    }
    if (context.tags) {
      Object.keys(context.tags).forEach(key => scope.setTag(key, context.tags[key]));
    }
    if (context.level) scope.setLevel(context.level);
    Sentry.captureException(error);
  });
}

function requestHandler() {
  if (!process.env.SENTRY_DSN) return (req, res, next) => next();
  return Sentry.Handlers.requestHandler();
}

function tracingHandler() {
  if (!process.env.SENTRY_DSN) return (req, res, next) => next();
  return Sentry.Handlers.tracingHandler();
}

function errorHandler() {
  if (!process.env.SENTRY_DSN) return (req, res, next) => next();
  return Sentry.Handlers.errorHandler({
    shouldHandleError(error) {
      return error.status >= 500;
    }
  });
}

module.exports = {
  initializeSentry,
  captureException,
  requestHandler,
  tracingHandler,
  errorHandler
};
