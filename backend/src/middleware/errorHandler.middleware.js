const logger = require('../utils/logger');
const { captureException } = require('../config/sentry');

/**
 * Custom Error Classes
 */
class AppError extends Error {
  constructor(message, statusCode, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, errors = []) {
    super(message, 400);
    this.errors = errors;
  }
}

class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed') {
    super(message, 401);
  }
}

class AuthorizationError extends AppError {
  constructor(message = 'Insufficient permissions') {
    super(message, 403);
  }
}

class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404);
  }
}

class ConflictError extends AppError {
  constructor(message = 'Resource already exists') {
    super(message, 409);
  }
}

class RateLimitError extends AppError {
  constructor(message = 'Too many requests, please try again later') {
    super(message, 429);
  }
}

class DatabaseError extends AppError {
  constructor(message = 'Database operation failed', originalError) {
    super(message, 500, false);
    this.originalError = originalError;
  }
}

/**
 * Error response formatter
 */
function formatErrorResponse(error, includeStack = false) {
  const response = {
    success: false,
    error: {
      message: error.message || 'Internal Server Error',
      type: error.name || 'Error',
      statusCode: error.statusCode || 500
    }
  };

  // Add validation errors if present
  if (error.errors && Array.isArray(error.errors)) {
    response.error.details = error.errors;
  }

  // Add error code if present
  if (error.code) {
    response.error.code = error.code;
  }

  // Add stack trace in development
  if (includeStack && error.stack) {
    response.error.stack = error.stack;
  }

  return response;
}

/**
 * Determine if error should be logged
 */
function shouldLogError(error) {
  // Always log server errors (5xx)
  if (!error.statusCode || error.statusCode >= 500) {
    return true;
  }

  // Don't log operational errors (validation, auth, etc.)
  if (error.isOperational) {
    return false;
  }

  return true;
}

/**
 * Determine if error should be sent to Sentry
 */
function shouldSendToSentry(error) {
  // Don't send operational errors
  if (error.isOperational) {
    return false;
  }

  // Don't send client errors (4xx) except 429 (rate limit abuse)
  if (error.statusCode && error.statusCode < 500 && error.statusCode !== 429) {
    return false;
  }

  return true;
}

/**
 * Main error handler middleware
 */
function errorHandler(err, req, res, next) {
  // Set default values
  err.statusCode = err.statusCode || 500;
  err.message = err.message || 'Internal Server Error';

  // Log error
  if (shouldLogError(err)) {
    logger.logError('Application Error', err, {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userId: req.user?.id,
      userAgent: req.get('user-agent'),
      body: req.body,
      params: req.params,
      query: req.query
    });
  }

  // Send to Sentry
  if (shouldSendToSentry(err)) {
    captureException(err, {
      user: req.user,
      req,
      extra: {
        body: req.body,
        params: req.params,
        query: req.query
      },
      tags: {
        method: req.method,
        statusCode: err.statusCode
      }
    });
  }

  // Prisma errors
  if (err.code && err.code.startsWith('P')) {
    return handlePrismaError(err, req, res);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json(
      formatErrorResponse(
        new AuthenticationError('Invalid or expired token'),
        false
      )
    );
  }

  // Multer errors (file upload)
  if (err.name === 'MulterError') {
    return handleMulterError(err, req, res);
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json(
      formatErrorResponse(err, false)
    );
  }

  // Default error response
  const includeStack = process.env.NODE_ENV === 'development';
  res.status(err.statusCode).json(formatErrorResponse(err, includeStack));
}

/**
 * Handle Prisma errors
 */
function handlePrismaError(err, req, res) {
  logger.logError('Prisma Error', err, {
    code: err.code,
    meta: err.meta
  });

  let message = 'Database operation failed';
  let statusCode = 500;

  switch (err.code) {
    case 'P2002': // Unique constraint violation
      message = 'A record with this value already exists';
      statusCode = 409;
      break;
    case 'P2025': // Record not found
      message = 'Record not found';
      statusCode = 404;
      break;
    case 'P2003': // Foreign key constraint failed
      message = 'Related record not found';
      statusCode = 400;
      break;
    case 'P2014': // Invalid ID
      message = 'Invalid ID provided';
      statusCode = 400;
      break;
    default:
      message = process.env.NODE_ENV === 'development' 
        ? err.message 
        : 'Database operation failed';
  }

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      type: 'DatabaseError',
      statusCode,
      ...(process.env.NODE_ENV === 'development' && { code: err.code })
    }
  });
}

/**
 * Handle Multer errors
 */
function handleMulterError(err, req, res) {
  let message = 'File upload failed';

  switch (err.code) {
    case 'LIMIT_FILE_SIZE':
      message = 'File size exceeds the maximum allowed limit';
      break;
    case 'LIMIT_FILE_COUNT':
      message = 'Too many files uploaded';
      break;
    case 'LIMIT_UNEXPECTED_FILE':
      message = 'Unexpected file field';
      break;
  }

  res.status(400).json({
    success: false,
    error: {
      message,
      type: 'FileUploadError',
      statusCode: 400
    }
  });
}

/**
 * Async error wrapper
 * Wraps async route handlers to catch errors
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * 404 Not Found handler
 */
function notFoundHandler(req, res, next) {
  const error = new NotFoundError(`Route ${req.originalUrl} not found`);
  next(error);
}

/**
 * Unhandled rejection handler
 */
function handleUnhandledRejection() {
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Promise Rejection', {
      reason: reason instanceof Error ? reason.message : reason,
      stack: reason instanceof Error ? reason.stack : undefined,
      promise
    });

    // Send to Sentry
    if (reason instanceof Error) {
      captureException(reason, {
        tags: { type: 'unhandledRejection' }
      });
    }
  });
}

/**
 * Uncaught exception handler
 */
function handleUncaughtException() {
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception - Shutting down...', {
      error: error.message,
      stack: error.stack
    });

    // Send to Sentry
    captureException(error, {
      tags: { type: 'uncaughtException' },
      level: 'fatal'
    });

    // Give Sentry time to send the error
    setTimeout(() => {
      process.exit(1);
    }, 1000);
  });
}

/**
 * Graceful shutdown handler
 */
function setupGracefulShutdown(server) {
  const shutdown = (signal) => {
    logger.info(`${signal} received. Starting graceful shutdown...`);

    server.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });

    // Force shutdown after 30 seconds
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 30000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

module.exports = {
  // Error classes
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  DatabaseError,
  
  // Middleware
  errorHandler,
  asyncHandler,
  notFoundHandler,
  
  // Setup functions
  handleUnhandledRejection,
  handleUncaughtException,
  setupGracefulShutdown
};
