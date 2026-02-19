const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4
};

// Define log colors
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue'
};

// Add colors to winston
winston.addColors(colors);

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Console format (for development)
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf((info) => {
    const { timestamp, level, message, ...meta } = info;
    
    let msg = `${timestamp} [${level}]: ${message}`;
    
    // Add metadata if exists
    if (Object.keys(meta).length > 0) {
      // Remove stack from meta display (shown separately)
      const { stack, ...restMeta } = meta;
      if (Object.keys(restMeta).length > 0) {
        msg += ` ${JSON.stringify(restMeta)}`;
      }
      if (stack) {
        msg += `\n${stack}`;
      }
    }
    
    return msg;
  })
);

// Create logs directory if not exists
const logsDir = path.join(__dirname, '../../logs');
const fs = require('fs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Define transports
const transports = [
  // Console transport (always enabled)
  new winston.transports.Console({
    format: consoleFormat,
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug'
  })
];

// File transports (only in production or if explicitly enabled, can be disabled with FILE_LOGGING=false)
if (process.env.FILE_LOGGING !== 'false' && (process.env.NODE_ENV === 'production' || process.env.ENABLE_FILE_LOGGING === 'true')) {
  // All logs (combined)
  transports.push(
    new DailyRotateFile({
      filename: path.join(logsDir, 'combined-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      format: logFormat,
      level: 'debug'
    })
  );

  // Error logs only
  transports.push(
    new DailyRotateFile({
      filename: path.join(logsDir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '30d',
      format: logFormat,
      level: 'error'
    })
  );

  // HTTP logs
  transports.push(
    new DailyRotateFile({
      filename: path.join(logsDir, 'http-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '7d',
      format: logFormat,
      level: 'http'
    })
  );
}

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels,
  format: logFormat,
  transports,
  exitOnError: false
});

// Create a stream for Morgan HTTP logging
logger.stream = {
  write: (message) => {
    logger.http(message.trim());
  }
};

// Helper functions for structured logging
logger.logError = (message, error, metadata = {}) => {
  logger.error(message, {
    error: {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code
    },
    ...metadata
  });
};

logger.logRequest = (req, metadata = {}) => {
  logger.http('HTTP Request', {
    method: req.method,
    url: req.originalUrl || req.url,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('user-agent'),
    userId: req.user?.id,
    ...metadata
  });
};

logger.logResponse = (req, res, duration, metadata = {}) => {
  logger.http('HTTP Response', {
    method: req.method,
    url: req.originalUrl || req.url,
    statusCode: res.statusCode,
    duration: `${duration}ms`,
    userId: req.user?.id,
    ...metadata
  });
};

logger.logAuth = (action, userId, metadata = {}) => {
  logger.info('Auth Event', {
    action,
    userId,
    ...metadata
  });
};

logger.logDatabase = (action, model, metadata = {}) => {
  logger.debug('Database Operation', {
    action,
    model,
    ...metadata
  });
};

logger.logSecurity = (event, severity = 'warn', metadata = {}) => {
  logger[severity]('Security Event', {
    event,
    timestamp: new Date().toISOString(),
    ...metadata
  });
};

logger.logPerformance = (operation, duration, metadata = {}) => {
  const level = duration > 1000 ? 'warn' : 'info';
  logger[level]('Performance Metric', {
    operation,
    duration: `${duration}ms`,
    ...metadata
  });
};

// Log system startup
logger.info('Logger initialized', {
  environment: process.env.NODE_ENV || 'development',
  logLevel: process.env.LOG_LEVEL || 'info',
  fileLogging: process.env.FILE_LOGGING !== 'false' && (process.env.NODE_ENV === 'production' || process.env.ENABLE_FILE_LOGGING === 'true')
});

module.exports = logger;
