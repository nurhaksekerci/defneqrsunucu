const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const session = require('express-session');
const morgan = require('morgan');

const passport = require('./config/passport');
const logger = require('./utils/logger');
const { initializeSentry, requestHandler, tracingHandler, errorHandler: sentryErrorHandler } = require('./config/sentry');
const {
  errorHandler,
  notFoundHandler,
  handleUnhandledRejection,
  handleUncaughtException,
  setupGracefulShutdown
} = require('./middleware/errorHandler.middleware');
const { setProjectContext } = require('./middleware/project.middleware');
const { startPeriodicCleanup } = require('./utils/tokenCleanup');

const app = express();
const PORT = process.env.PORT || 5001;

app.set('trust proxy', 1);

initializeSentry(app);
handleUnhandledRejection();
handleUncaughtException();

app.use(requestHandler());
app.use(tracingHandler());

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
    'https://randevu.defneqr.com',
    'http://randevu.defneqr.com',
    'https://defnerandevu.com',
    'https://www.defnerandevu.com',
    'http://localhost:3001',
    'http://localhost:3002'
  ],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Project']
}));

app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev', { stream: logger.stream }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(setProjectContext);

app.use(session({
  secret: process.env.SESSION_SECRET || 'backend-common-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000
  }
}));

app.use(passport.initialize());
app.use(passport.session());

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 1000,
  message: 'Çok fazla istek gönderildi, lütfen bir süre bekleyin.'
});
app.use('/api/', limiter);

// Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/auth', require('./routes/oauth.routes'));
app.use('/api/tickets', require('./routes/ticket.routes'));
app.use('/api/settings', require('./routes/settings.routes'));
app.use('/api/users', require('./routes/user.routes'));
app.use('/api/internal/admin', require('./routes/admin.routes'));

app.get('/health', async (req, res) => {
  try {
    const prisma = require('./config/database');
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ status: 'ok', service: 'backend-common' });
  } catch (err) {
    res.status(503).json({ status: 'error', message: err.message });
  }
});

app.use(sentryErrorHandler());
app.use(notFoundHandler);
app.use(errorHandler);

startPeriodicCleanup();

const server = app.listen(PORT, () => {
  logger.info('backend-common started', { port: PORT, environment: process.env.NODE_ENV || 'development' });
});

setupGracefulShutdown(server);

module.exports = app;
