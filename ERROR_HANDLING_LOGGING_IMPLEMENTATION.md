# Error Handling & Logging Implementation

## 📋 Overview

Defne Qr projesine production-ready **Error Handling**, **Structured Logging**, **Error Tracking** ve **Critical Alerting** sistemleri entegre edilmiştir.

---

## 🎯 Implemented Features

### ✅ 1. Structured Logging (Winston)

**Location:** `backend/src/utils/logger.js`

#### Features:
- **Multi-level logging:** error, warn, info, http, debug
- **Colorized console output** (development)
- **JSON structured logs** (production)
- **Daily log rotation** (14 days retention)
- **Separate error logs** (30 days retention)
- **HTTP request logs** (7 days retention)
- **Performance logging**
- **Security event logging**

#### Log Levels:
```javascript
{
  error: 0,   // Critical errors that need immediate attention
  warn: 1,    // Warning messages
  info: 2,    // General informational messages
  http: 3,    // HTTP requests/responses
  debug: 4    // Detailed debug information
}
```

#### Helper Functions:
```javascript
logger.logError(message, error, metadata)      // Error with stack trace
logger.logRequest(req, metadata)               // HTTP request
logger.logResponse(req, res, duration, meta)   // HTTP response
logger.logAuth(action, userId, metadata)       // Authentication events
logger.logDatabase(action, model, metadata)    // Database operations
logger.logSecurity(event, severity, metadata)  // Security events
logger.logPerformance(operation, duration)     // Performance metrics
```

#### Log Files:
```
backend/logs/
├── combined-2026-02-18.log    # All logs (14 days)
├── error-2026-02-18.log       # Error logs only (30 days)
└── http-2026-02-18.log        # HTTP logs (7 days)
```

#### Configuration:
```env
LOG_LEVEL=info                 # Minimum log level
ENABLE_FILE_LOGGING=false      # Enable file logging (auto-enabled in production)
```

---

### ✅ 2. Error Tracking (Sentry)

**Location:** `backend/src/config/sentry.js`

#### Features:
- **Automatic error capture** (5xx errors)
- **Performance monitoring** (transaction tracing)
- **Profiling** (code-level performance insights)
- **User context tracking**
- **Request context tracking**
- **Release tracking**
- **Sensitive data filtering** (passwords, tokens, secrets)
- **Custom error ignoring** (validation errors, rate limits)

#### Integration Points:
1. **Request Handler:** Captures request context
2. **Tracing Handler:** Performance monitoring
3. **Error Handler:** Automatic error reporting

#### Sentry Dashboard Features:
- Real-time error alerts
- Error grouping and deduplication
- Stack trace analysis
- Breadcrumb trail
- Performance bottleneck detection
- Release comparison

#### Configuration:
```env
SENTRY_DSN=https://your-key@o123456.ingest.sentry.io/123456
SENTRY_TRACES_SAMPLE_RATE=0.1      # 10% of transactions
SENTRY_PROFILES_SAMPLE_RATE=0.1    # 10% of transactions
SENTRY_RELEASE=defneqr@1.0.0       # Release version
SENTRY_FORCE_DEV=false             # Force Sentry in development
```

#### Usage Example:
```javascript
const { captureException, captureMessage } = require('../config/sentry');

// Capture exception
try {
  // risky operation
} catch (error) {
  captureException(error, {
    user: req.user,
    req,
    extra: { orderId: '123' },
    tags: { feature: 'checkout' }
  });
}

// Capture message
captureMessage('Payment processing started', 'info', {
  extra: { amount: 100, currency: 'TRY' }
});
```

---

### ✅ 3. Enhanced Error Handler

**Location:** `backend/src/middleware/errorHandler.middleware.js`

#### Custom Error Classes:
```javascript
AppError               // Base error class
ValidationError        // 400 - Validation failed
AuthenticationError    // 401 - Authentication required
AuthorizationError     // 403 - Insufficient permissions
NotFoundError          // 404 - Resource not found
ConflictError          // 409 - Resource conflict
RateLimitError         // 429 - Too many requests
DatabaseError          // 500 - Database error
```

#### Features:
- **Automatic error classification**
- **Prisma error handling** (P2002, P2025, etc.)
- **JWT error handling**
- **Multer error handling** (file uploads)
- **Stack trace hiding** (production)
- **Structured error responses**
- **Automatic Sentry reporting**
- **Operational vs Programming errors**

#### Error Response Format:
```json
{
  "success": false,
  "error": {
    "message": "User not found",
    "type": "NotFoundError",
    "statusCode": 404,
    "code": "USER_NOT_FOUND",
    "details": [] // For validation errors
  }
}
```

#### Usage Example:
```javascript
const { NotFoundError, asyncHandler } = require('../middleware/errorHandler.middleware');

// Async route handler (auto error handling)
router.get('/users/:id', asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.params.id } });
  
  if (!user) {
    throw new NotFoundError('User');
  }
  
  res.json({ success: true, data: user });
}));
```

#### Global Error Handlers:
```javascript
handleUnhandledRejection()   // Catches unhandled promise rejections
handleUncaughtException()    // Catches uncaught exceptions
setupGracefulShutdown(server) // Graceful shutdown on SIGTERM/SIGINT
```

---

### ✅ 4. Critical Alerting System

**Location:** `backend/src/utils/alerting.js`

#### Alert Channels:
1. **Email** (via SMTP)
2. **Webhook** (Slack, Discord, Teams, etc.)

#### Alert Types:
```javascript
alerts.criticalError(error, context)           // Critical application errors
alerts.databaseError(error, operation)         // Database failures
alerts.highErrorRate(count, timeWindow)        // Error rate spike
alerts.performanceDegradation(metric, value)   // Performance issues
alerts.securityIncident(incident, details)     // Security events
alerts.serviceDown(serviceName, error)         // Service unavailable
alerts.diskSpaceWarning(usage, threshold)      // Low disk space
```

#### Email Alerts:
- HTML formatted emails
- Severity color coding
- Stack traces (for errors)
- Environment info
- Timestamp

#### Webhook Alerts:
- Slack-compatible format
- Works with Discord, Teams, etc.
- Rich attachments
- Severity indicators

#### Configuration:
```env
# Email Alerts
ALERT_EMAIL_ENABLED=true
ALERT_EMAIL_FROM=alerts@defneqr.com
ALERT_EMAIL_TO=admin@defneqr.com,ops@defneqr.com

# SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Webhook (Slack, Discord, etc.)
ALERT_WEBHOOK_ENABLED=true
ALERT_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL

# Thresholds
ALERT_ERROR_RATE_THRESHOLD=10          # errors per minute
ALERT_RESPONSE_TIME_THRESHOLD=5000     # milliseconds
ALERT_CPU_USAGE_THRESHOLD=90           # percentage
ALERT_MEMORY_USAGE_THRESHOLD=90        # percentage
```

#### Usage Example:
```javascript
const { alerts } = require('../utils/alerting');

// Critical error
try {
  await processPayment(order);
} catch (error) {
  await alerts.criticalError(error, {
    url: req.originalUrl,
    userId: req.user.id,
    orderId: order.id
  });
  throw error;
}

// High error rate (automatic)
// Tracks errors automatically and sends alert when threshold exceeded
```

---

## 📊 Log Monitoring

### Real-time Log Viewing

**Development:**
```bash
# View all logs
tail -f logs/combined-*.log

# View error logs only
tail -f logs/error-*.log

# View HTTP logs
tail -f logs/http-*.log
```

**Production:**
```bash
# Using PM2
pm2 logs defneqr-backend

# Using journalctl (systemd)
journalctl -u defneqr-backend -f

# Using Docker
docker logs -f defneqr-backend
```

### Log Analysis

**Find errors in last hour:**
```bash
find logs/ -name "error-*.log" -mmin -60 -exec cat {} \; | grep '"level":"error"'
```

**Count errors by type:**
```bash
cat logs/error-*.log | jq '.error.type' | sort | uniq -c | sort -rn
```

**Find slow requests (>5s):**
```bash
cat logs/http-*.log | jq 'select(.duration | tonumber > 5000)' | jq '.url'
```

### Centralized Logging (Future)

For production, consider integrating with:
- **ELK Stack** (Elasticsearch, Logstash, Kibana)
- **AWS CloudWatch Logs**
- **Google Cloud Logging**
- **Datadog**
- **New Relic**

---

## 🔔 Setting Up Alerts

### Email Alerts (Gmail Example)

1. **Enable 2-Step Verification** in your Gmail account
2. **Generate App Password:**
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" and "Other"
   - Copy the generated password

3. **Configure Environment:**
```env
ALERT_EMAIL_ENABLED=true
ALERT_EMAIL_FROM=alerts@yourdomain.com
ALERT_EMAIL_TO=admin@yourdomain.com

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=generated-app-password
```

### Slack Webhook

1. **Create Slack App:**
   - Go to: https://api.slack.com/apps
   - Create new app
   - Enable Incoming Webhooks
   - Add webhook to workspace
   - Copy webhook URL

2. **Configure Environment:**
```env
ALERT_WEBHOOK_ENABLED=true
ALERT_WEBHOOK_URL=https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX
```

### Discord Webhook

1. **Create Discord Webhook:**
   - Server Settings → Integrations → Webhooks
   - Create webhook
   - Copy webhook URL

2. **Configure Environment:**
```env
ALERT_WEBHOOK_ENABLED=true
ALERT_WEBHOOK_URL=https://discord.com/api/webhooks/123456789/xxxxxxxxxxxx
```

---

## 🚀 Sentry Setup

### 1. Create Sentry Account

1. Go to: https://sentry.io/
2. Sign up for free account
3. Create new project (Node.js/Express)
4. Copy DSN (Data Source Name)

### 2. Configure Environment

```env
SENTRY_DSN=https://abc123@o123456.ingest.sentry.io/123456
SENTRY_TRACES_SAMPLE_RATE=0.1
SENTRY_PROFILES_SAMPLE_RATE=0.1
SENTRY_RELEASE=defneqr@1.0.0
```

### 3. Deploy with Release Tracking

```bash
# Set release version
export SENTRY_RELEASE="defneqr@$(git rev-parse --short HEAD)"

# Deploy
npm run build
pm2 restart defneqr-backend

# Create Sentry release
sentry-cli releases new $SENTRY_RELEASE
sentry-cli releases set-commits $SENTRY_RELEASE --auto
sentry-cli releases finalize $SENTRY_RELEASE
```

### 4. Verify Integration

Trigger a test error:
```javascript
// Add temporary test endpoint
app.get('/debug-sentry', () => {
  throw new Error('Sentry test error');
});
```

Visit: `http://localhost:5000/debug-sentry`

Check Sentry dashboard for the error.

---

## 📈 Performance Monitoring

### Request Duration Logging

All HTTP requests are automatically logged with duration:

```json
{
  "level": "http",
  "message": "HTTP Response",
  "method": "POST",
  "url": "/api/orders",
  "statusCode": 201,
  "duration": "245ms",
  "userId": "123e4567-e89b-12d3-a456-426614174000",
  "timestamp": "2026-02-18 22:30:15"
}
```

### Slow Query Detection

Queries exceeding threshold are automatically logged:

```javascript
logger.logPerformance('Database Query', duration, {
  model: 'Order',
  operation: 'findMany',
  query: 'SELECT * FROM orders WHERE ...'
});
```

### Custom Performance Tracking

```javascript
const startTime = Date.now();

// Your operation
await processOrder(order);

const duration = Date.now() - startTime;
logger.logPerformance('Order Processing', duration, { orderId: order.id });
```

---

## 🔒 Security Logging

All security events are automatically logged:

### Authentication Events
```javascript
logger.logAuth('login_success', user.id, { ip: req.ip });
logger.logAuth('login_failed', email, { ip: req.ip, reason: 'invalid_password' });
logger.logAuth('token_refresh', user.id);
logger.logAuth('logout', user.id);
```

### Security Incidents
```javascript
logger.logSecurity('brute_force_attempt', 'warn', {
  ip: req.ip,
  attempts: 5,
  timeWindow: '1 minute'
});

logger.logSecurity('sql_injection_attempt', 'error', {
  ip: req.ip,
  payload: req.body
});

logger.logSecurity('unauthorized_access', 'warn', {
  userId: req.user.id,
  resource: '/admin/settings',
  requiredRole: 'ADMIN',
  userRole: 'USER'
});
```

---

## 🧪 Testing Error Handling

### Test Endpoints (Development Only)

Add these temporary test endpoints in development:

```javascript
if (process.env.NODE_ENV === 'development') {
  // Test error types
  app.get('/test/error/validation', (req, res) => {
    throw new ValidationError('Invalid input', [
      { field: 'email', message: 'Email is required' }
    ]);
  });

  app.get('/test/error/auth', (req, res) => {
    throw new AuthenticationError('Invalid token');
  });

  app.get('/test/error/notfound', (req, res) => {
    throw new NotFoundError('User');
  });

  app.get('/test/error/server', (req, res) => {
    throw new Error('Unexpected server error');
  });

  // Test alerting
  app.get('/test/alert/critical', async (req, res) => {
    await alerts.criticalError(new Error('Test critical error'), {
      url: req.originalUrl
    });
    res.json({ message: 'Alert sent' });
  });
}
```

### Manual Testing

```bash
# Test validation error (400)
curl http://localhost:5000/test/error/validation

# Test authentication error (401)
curl http://localhost:5000/test/error/auth

# Test not found error (404)
curl http://localhost:5000/test/error/notfound

# Test server error (500)
curl http://localhost:5000/test/error/server

# Test critical alert
curl http://localhost:5000/test/alert/critical
```

---

## 📋 Checklist

### Development
- [x] Winston logger configured
- [x] Morgan integrated with Winston
- [x] Console logging with colors
- [x] Custom error classes
- [x] Error handler middleware
- [x] Async error handling
- [x] Stack traces visible

### Production
- [x] File logging enabled
- [x] Log rotation configured (daily)
- [x] Sentry integrated
- [x] Stack traces hidden
- [x] Email alerts configured
- [x] Webhook alerts configured
- [x] Graceful shutdown
- [x] Unhandled rejection/exception handlers
- [x] Performance monitoring
- [x] Security event logging

---

## 📚 File Structure

```
backend/
├── src/
│   ├── config/
│   │   └── sentry.js                    # Sentry configuration
│   ├── middleware/
│   │   └── errorHandler.middleware.js   # Error handling
│   ├── utils/
│   │   ├── logger.js                    # Winston logger
│   │   └── alerting.js                  # Alert system
│   └── server.js                        # Updated with new middleware
├── logs/                                # Log files (gitignored)
│   ├── combined-YYYY-MM-DD.log
│   ├── error-YYYY-MM-DD.log
│   └── http-YYYY-MM-DD.log
└── .env.example                         # Updated with new variables
```

---

## 🎓 Best Practices

### 1. Use Structured Logging
```javascript
// ❌ Bad
logger.info('User logged in');

// ✅ Good
logger.logAuth('login_success', user.id, {
  ip: req.ip,
  userAgent: req.get('user-agent'),
  timestamp: new Date().toISOString()
});
```

### 2. Don't Log Sensitive Data
```javascript
// ❌ Bad
logger.info('User created', { user });

// ✅ Good
logger.info('User created', {
  userId: user.id,
  email: user.email,
  role: user.role
  // Don't log: password, tokens, etc.
});
```

### 3. Use Appropriate Log Levels
```javascript
logger.error()   // Errors that need immediate attention
logger.warn()    // Warnings that should be investigated
logger.info()    // General informational messages
logger.http()    // HTTP requests/responses
logger.debug()   // Detailed debug information
```

### 4. Add Context to Errors
```javascript
try {
  await processPayment(order);
} catch (error) {
  logger.logError('Payment processing failed', error, {
    orderId: order.id,
    amount: order.totalAmount,
    userId: order.userId,
    paymentMethod: order.paymentMethod
  });
  throw error;
}
```

### 5. Use Custom Error Classes
```javascript
// ❌ Bad
if (!user) {
  throw new Error('User not found');
}

// ✅ Good
if (!user) {
  throw new NotFoundError('User');
}
```

---

## 🔧 Troubleshooting

### Issue: Logs not appearing in files

**Solution:**
```bash
# Check ENABLE_FILE_LOGGING
echo $ENABLE_FILE_LOGGING

# Enable file logging
export ENABLE_FILE_LOGGING=true

# Check logs directory exists
ls -la backend/logs/

# Check permissions
chmod -R 755 backend/logs/
```

### Issue: Sentry not capturing errors

**Solution:**
```bash
# Verify DSN is set
echo $SENTRY_DSN

# Check Sentry initialization logs
grep "Sentry initialized" logs/combined-*.log

# Test with debug endpoint
curl http://localhost:5000/debug-sentry
```

### Issue: Email alerts not sending

**Solution:**
```bash
# Test SMTP connection
npm install -g nodemailer-smtp-test
nodemailer-smtp-test --host=smtp.gmail.com --port=587 --user=your-email@gmail.com --pass=your-password

# Check SMTP logs
grep "Email alert" logs/combined-*.log

# Verify Gmail app password
# Regenerate if necessary at: https://myaccount.google.com/apppasswords
```

---

## 📊 Monitoring Dashboard

### Recommended Tools

**Free/Open Source:**
- **Grafana + Loki** - Log aggregation and visualization
- **Prometheus** - Metrics collection
- **Sentry** - Error tracking (free tier: 5K events/month)

**Paid:**
- **Datadog** - All-in-one monitoring
- **New Relic** - APM and error tracking
- **LogRocket** - Session replay with errors
- **PagerDuty** - Incident management

---

## ✅ Production Deployment Checklist

Before deploying to production:

- [ ] Set `NODE_ENV=production`
- [ ] Configure `SENTRY_DSN`
- [ ] Enable `ALERT_EMAIL_ENABLED` or `ALERT_WEBHOOK_ENABLED`
- [ ] Set appropriate `LOG_LEVEL` (info or warn)
- [ ] Configure SMTP for email alerts
- [ ] Test alert delivery
- [ ] Set up log rotation
- [ ] Configure log backup/archival
- [ ] Set up monitoring dashboard
- [ ] Test graceful shutdown
- [ ] Document incident response procedures

---

**Document Version:** 1.0  
**Last Updated:** 2026-02-18  
**Status:** ✅ Production Ready
