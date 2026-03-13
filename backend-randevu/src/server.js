const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// Use DATABASE_URL_RANDEVU for db-randevu when available
if (process.env.DATABASE_URL_RANDEVU && !process.env.DATABASE_URL) {
  process.env.DATABASE_URL = process.env.DATABASE_URL_RANDEVU;
}

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');

const logger = require('./utils/logger');
const {
  errorHandler,
  notFoundHandler,
  setupGracefulShutdown,
} = require('./middleware/errorHandler.middleware');

const app = express();
const PORT = process.env.PORT || 5003;

app.set('trust proxy', 1);

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false,
}));

app.use(cors({
  origin: [
    'https://admin.defneqr.com',
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'https://www.defneqr.com',
    'https://defneqr.com',
    'http://localhost:3000',
    'https://randevu.defneqr.com',
    'http://randevu.defneqr.com',
    'https://defnerandevu.com',
    'https://www.defnerandevu.com',
    'http://localhost:3001',
    'http://localhost:3002',
  ],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Project', 'X-Internal-Secret'],
}));

app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev', { stream: logger.stream }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 1000,
  message: 'Çok fazla istek gönderildi, lütfen bir süre bekleyin.',
});
app.use('/api/', limiter);

// Routes
app.use('/api/businesses', require('./routes/business.routes'));
app.use('/api/internal', require('./routes/internal.routes'));

app.get('/health', async (req, res) => {
  try {
    const prisma = require('./config/database');
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ status: 'ok', service: 'backend-randevu' });
  } catch (err) {
    res.status(503).json({ status: 'error', message: err.message });
  }
});

app.use(notFoundHandler);
app.use(errorHandler);

const server = app.listen(PORT, () => {
  logger.info('backend-randevu started', { port: PORT, environment: process.env.NODE_ENV || 'development' });
});

setupGracefulShutdown(server);

module.exports = app;
