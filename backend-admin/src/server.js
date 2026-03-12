const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');

const logger = require('./utils/logger');

const app = express();
const PORT = process.env.PORT || 5004;

app.set('trust proxy', 1);

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false
}));

app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'https://www.defneqr.com',
    'https://defneqr.com',
    'http://localhost:3000',
    'https://admin.defneqr.com',
    'http://localhost:3002'
  ],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Project']
}));

app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev', { stream: logger.stream }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 1000,
  message: 'Çok fazla istek gönderildi, lütfen bir süre bekleyin.'
});
app.use('/api/', limiter);

app.use('/api/admin', require('./routes/admin.routes'));

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'backend-admin' });
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Not found' });
});

app.use((err, req, res, next) => {
  logger.error('Error', { message: err.message, stack: err.stack });
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
});

const server = app.listen(PORT, () => {
  logger.info('backend-admin started', { port: PORT, environment: process.env.NODE_ENV || 'development' });
});

process.on('SIGTERM', () => {
  server.close(() => process.exit(0));
});
process.on('SIGINT', () => {
  server.close(() => process.exit(0));
});

module.exports = app;
