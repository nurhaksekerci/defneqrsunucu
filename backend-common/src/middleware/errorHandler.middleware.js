const logger = require('../utils/logger');
const { captureException } = require('../config/sentry');

class AppError extends Error {
  constructor(message, statusCode, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404);
  }
}

function formatErrorResponse(error, includeStack = false) {
  const response = {
    success: false,
    error: {
      message: error.message || 'Internal Server Error',
      type: error.name || 'Error',
      statusCode: error.statusCode || 500
    }
  };
  if (error.errors && Array.isArray(error.errors)) {
    response.error.details = error.errors;
  }
  if (error.code) response.error.code = error.code;
  if (includeStack && error.stack) response.error.stack = error.stack;
  return response;
}

function shouldLogError(error) {
  if (!error.statusCode || error.statusCode >= 500) return true;
  if (error.isOperational) return false;
  return true;
}

function shouldSendToSentry(error) {
  if (error.isOperational) return false;
  if (error.statusCode && error.statusCode < 500 && error.statusCode !== 429) return false;
  return true;
}

function errorHandler(err, req, res, next) {
  err.statusCode = err.statusCode || 500;
  err.message = err.message || 'Internal Server Error';

  if (shouldLogError(err)) {
    logger.error('Application Error', {
      message: err.message,
      stack: err.stack,
      method: req.method,
      url: req.originalUrl,
      userId: req.user?.id
    });
  }

  if (shouldSendToSentry(err)) {
    captureException(err, {
      user: req.user,
      req,
      extra: { body: req.body, params: req.params, query: req.query },
      tags: { method: req.method, statusCode: err.statusCode }
    });
  }

  if (err.code && err.code.startsWith('P')) {
    return handlePrismaError(err, req, res);
  }

  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json(formatErrorResponse({ message: 'Invalid or expired token', statusCode: 401 }, false));
  }

  if (err.name === 'ValidationError') {
    return res.status(400).json(formatErrorResponse(err, false));
  }

  const includeStack = process.env.NODE_ENV === 'development';
  res.status(err.statusCode).json(formatErrorResponse(err, includeStack));
}

function handlePrismaError(err, req, res) {
  let message = 'Database operation failed';
  let statusCode = 500;
  switch (err.code) {
    case 'P2002': message = 'A record with this value already exists'; statusCode = 409; break;
    case 'P2025': message = 'Record not found'; statusCode = 404; break;
    case 'P2003': message = 'Related record not found'; statusCode = 400; break;
    case 'P2014': message = 'Invalid ID provided'; statusCode = 400; break;
    default: message = process.env.NODE_ENV === 'development' ? err.message : 'Database operation failed';
  }
  res.status(statusCode).json({
    success: false,
    error: { message, type: 'DatabaseError', statusCode, ...(process.env.NODE_ENV === 'development' && { code: err.code }) }
  });
}

function notFoundHandler(req, res, next) {
  next(new NotFoundError(`Route ${req.originalUrl} not found`));
}

function handleUnhandledRejection() {
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Promise Rejection', {
      reason: reason instanceof Error ? reason.message : reason,
      stack: reason instanceof Error ? reason.stack : undefined
    });
    if (reason instanceof Error) captureException(reason, { tags: { type: 'unhandledRejection' } });
  });
}

function handleUncaughtException() {
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception - Shutting down...', { error: error.message, stack: error.stack });
    captureException(error, { tags: { type: 'uncaughtException' }, level: 'fatal' });
    setTimeout(() => process.exit(1), 1000);
  });
}

function setupGracefulShutdown(server) {
  const shutdown = (signal) => {
    logger.info(`${signal} received. Starting graceful shutdown...`);
    server.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 30000);
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

module.exports = {
  AppError,
  NotFoundError,
  errorHandler,
  notFoundHandler,
  handleUnhandledRejection,
  handleUncaughtException,
  setupGracefulShutdown
};
