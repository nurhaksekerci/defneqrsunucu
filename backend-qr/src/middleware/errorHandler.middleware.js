const logger = require('../utils/logger');

function errorHandler(err, req, res, next) {
  err.statusCode = err.statusCode || 500;
  err.message = err.message || 'Internal Server Error';

  if (err.statusCode >= 500) {
    logger.error('Application Error', { error: err.message, stack: err.stack });
  }

  if (err.code && err.code.startsWith('P')) {
    let message = 'Database operation failed';
    let statusCode = 500;
    switch (err.code) {
      case 'P2002': message = 'A record with this value already exists'; statusCode = 409; break;
      case 'P2025': message = 'Record not found'; statusCode = 404; break;
      case 'P2003': message = 'Related record not found'; statusCode = 400; break;
      default: break;
    }
    return res.status(statusCode).json({ success: false, error: { message, statusCode } });
  }

  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({ success: false, error: { message: 'Invalid or expired token', statusCode: 401 } });
  }

  res.status(err.statusCode).json({
    success: false,
    error: { message: err.message, statusCode: err.statusCode },
  });
}

function notFoundHandler(req, res, next) {
  res.status(404).json({ success: false, error: { message: `Route ${req.originalUrl} not found`, statusCode: 404 } });
}

function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

function setupGracefulShutdown(server) {
  const shutdown = (signal) => {
    logger.info(`${signal} received. Shutting down...`);
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 30000);
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

module.exports = { errorHandler, notFoundHandler, asyncHandler, setupGracefulShutdown };
