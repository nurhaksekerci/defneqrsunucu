const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// Use DATABASE_URL_QR for db-qr when available
if (process.env.DATABASE_URL_QR && !process.env.DATABASE_URL) {
  process.env.DATABASE_URL = process.env.DATABASE_URL_QR;
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
const PORT = process.env.PORT || 5002;

app.set('trust proxy', 1);

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false,
}));

app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'https://www.defneqr.com',
    'https://defneqr.com',
    'http://localhost:3000',
    'https://randevu.defneqr.com',
    'http://randevu.defneqr.com',
    'https://admin.defneqr.com',
    'https://defnerandevu.com',
    'https://www.defnerandevu.com',
    'http://localhost:3001',
    'http://localhost:3002',
  ],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Project'],
}));

app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev', { stream: logger.stream }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const uploadsPath = path.join(__dirname, '../public/uploads');
app.use('/uploads', express.static(uploadsPath));

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 1000,
  message: 'Çok fazla istek gönderildi, lütfen bir süre bekleyin.',
});
app.use('/api/', limiter);

// Routes
app.use('/api/restaurants', require('./routes/restaurant.routes'));
app.use('/api/categories', require('./routes/category.routes'));
app.use('/api/products', require('./routes/product.routes'));
app.use('/api/orders', require('./routes/order.routes'));
app.use('/api/stocks', require('./routes/stock.routes'));
app.use('/api/payments', require('./routes/payment.routes'));
app.use('/api/reports', require('./routes/report.routes'));
app.use('/api/upload', require('./routes/upload.routes'));
app.use('/api/scans', require('./routes/scan.routes'));
app.use('/api/tables', require('./routes/table.routes'));
app.use('/api/plans', require('./routes/plan.routes'));
app.use('/api/subscriptions', require('./routes/subscription.routes'));
app.use('/api/promo-codes', require('./routes/promoCode.routes'));
app.use('/api/affiliates', require('./routes/affiliate.routes'));
app.use('/api/wheel', require('./routes/wheel.routes'));
app.use('/api/internal/admin', require('./routes/admin.routes'));

app.get('/health', async (req, res) => {
  try {
    const prisma = require('./config/database');
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ status: 'ok', service: 'backend-qr' });
  } catch (err) {
    res.status(503).json({ status: 'error', message: err.message });
  }
});

app.use(notFoundHandler);
app.use(errorHandler);

const server = app.listen(PORT, () => {
  logger.info('backend-qr started', { port: PORT, environment: process.env.NODE_ENV || 'development' });
});

setupGracefulShutdown(server);

module.exports = app;
