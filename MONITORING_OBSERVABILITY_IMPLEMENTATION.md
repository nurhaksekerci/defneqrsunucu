# Monitoring & Observability Implementation

## 📋 Overview

Defne Qr projesine production-ready **Monitoring**, **Observability**, **Health Checks** ve **Metrics** sistemleri entegre edilmiştir.

---

## 🎯 Implemented Features

### ✅ 1. Prometheus Metrics

**Location:** `backend/src/utils/metrics.js`

#### Metrics Categories:

**HTTP Metrics:**
- `defneqr_http_request_duration_seconds` - Request duration histogram
- `defneqr_http_requests_total` - Total HTTP requests counter
- `defneqr_http_response_size_bytes` - Response size histogram
- `defneqr_http_active_requests` - Active requests gauge

**Database Metrics:**
- `defneqr_db_query_duration_seconds` - Query duration histogram
- `defneqr_db_queries_total` - Total queries counter
- `defneqr_db_connection_pool_size` - Connection pool gauge

**Business Metrics:**
- `defneqr_user_registrations_total` - User registrations by provider
- `defneqr_login_attempts_total` - Login attempts (success/failed)
- `defneqr_qr_scans_total` - QR menu scans by restaurant
- `defneqr_orders_total` - Orders by restaurant and status
- `defneqr_order_value` - Order value distribution
- `defneqr_active_restaurants` - Active restaurants gauge
- `defneqr_active_users` - Active users gauge
- `defneqr_file_uploads_total` - File uploads (success/failed)

**Error Metrics:**
- `defneqr_errors_total` - Application errors by type and severity

**System Metrics (Default):**
- `defneqr_process_cpu_user_seconds_total` - CPU usage
- `defneqr_process_resident_memory_bytes` - Memory usage
- `defneqr_nodejs_eventloop_lag_seconds` - Event loop lag
- `defneqr_nodejs_heap_size_total_bytes` - Heap size
- And 20+ more default Node.js metrics

#### Endpoints:

**Prometheus Format (for scraping):**
```
GET /metrics
Authorization: Bearer <METRICS_TOKEN> (in production)
Content-Type: text/plain; version=0.0.4
```

**JSON Format (for admin dashboard):**
```
GET /metrics/json
Authorization: Bearer <accessToken>
Role: ADMIN
```

#### Example Metrics Output:

```prometheus
# HELP defneqr_http_request_duration_seconds Duration of HTTP requests in seconds
# TYPE defneqr_http_request_duration_seconds histogram
defneqr_http_request_duration_seconds_bucket{le="0.01",method="GET",route="/api/restaurants",status_code="200"} 45
defneqr_http_request_duration_seconds_bucket{le="0.05",method="GET",route="/api/restaurants",status_code="200"} 150
defneqr_http_request_duration_seconds_sum{method="GET",route="/api/restaurants",status_code="200"} 12.5
defneqr_http_request_duration_seconds_count{method="GET",route="/api/restaurants",status_code="200"} 200

# HELP defneqr_user_registrations_total Total number of user registrations
# TYPE defneqr_user_registrations_total counter
defneqr_user_registrations_total{provider="email"} 45
defneqr_user_registrations_total{provider="google"} 23

# HELP defneqr_qr_scans_total Total number of QR menu scans
# TYPE defneqr_qr_scans_total counter
defneqr_qr_scans_total{restaurant_id="550e8400-e29b-41d4-a716-446655440000"} 1234
```

---

### ✅ 2. Enhanced Health Checks

**Location:** `backend/src/utils/healthCheck.js`

#### Health Check Endpoints:

**1. Quick Health Check (Liveness Probe)**
```
GET /health
Public endpoint
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-02-19T10:00:00.000Z",
  "uptime": "120 minutes"
}
```

**2. Detailed Health Check**
```
GET /health/detailed
Protected: Admin only
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-02-19T10:00:00.000Z",
  "duration": "45ms",
  "application": {
    "name": "Defne Qr API",
    "version": "1.0.0",
    "environment": "production",
    "nodeVersion": "v22.17.0",
    "uptime": "120 minutes"
  },
  "checks": {
    "database": {
      "status": "healthy",
      "message": "Database connection successful",
      "responseTime": "12ms",
      "details": {
        "connected": true,
        "queryExecuted": true
      }
    },
    "databasePool": {
      "status": "healthy",
      "message": "Database pool status",
      "details": {
        "total": 10,
        "idle": 5,
        "active": 5
      }
    },
    "system": {
      "status": "healthy",
      "message": "System resources",
      "details": {
        "memory": {
          "total": "16.00 GB",
          "free": "8.50 GB",
          "used": "7.50 GB",
          "usagePercent": "46.88%"
        },
        "cpu": {
          "user": "25.50s",
          "system": "5.20s",
          "percent": "30.70%"
        },
        "process": {
          "uptime": "120 minutes",
          "pid": 12345,
          "nodeVersion": "v22.17.0",
          "platform": "win32",
          "arch": "x64"
        },
        "system": {
          "hostname": "server-1",
          "cpuCores": 8,
          "loadAverage": [1.5, 1.2, 1.1]
        }
      }
    },
    "externalServices": {
      "status": "info",
      "message": "3 external services configured",
      "details": [
        {
          "name": "Sentry",
          "status": "configured",
          "details": {
            "dsn": "https://abc123..."
          }
        },
        {
          "name": "Email (SMTP)",
          "status": "configured",
          "details": {
            "host": "smtp.gmail.com",
            "port": "587"
          }
        },
        {
          "name": "Google OAuth",
          "status": "configured"
        }
      ]
    }
  }
}
```

**3. Readiness Probe (Kubernetes-style)**
```
GET /health/ready
Public endpoint
```

**Response (Ready):**
```json
{
  "status": "ready",
  "timestamp": "2026-02-19T10:00:00.000Z"
}
```

**Response (Not Ready):**
```json
{
  "status": "not_ready",
  "reason": "High memory usage",
  "details": {
    "memoryUsage": "96.50%"
  }
}
```

**4. Liveness Probe (Kubernetes-style)**
```
GET /health/live
Public endpoint
```

**Response:**
```json
{
  "status": "alive",
  "timestamp": "2026-02-19T10:00:00.000Z",
  "uptime": 7200
}
```

---

### ✅ 3. Response Time Tracking

**Location:** `backend/src/middleware/metrics.middleware.js`

#### Features:
- Automatic response time measurement for all HTTP requests
- Integration with Prometheus histograms
- Active request tracking (gauge metric)
- Response size tracking

#### Implementation:
```javascript
const { metricsMiddleware, activeRequestsMiddleware } = require('./middleware/metrics.middleware');

app.use(activeRequestsMiddleware);   // Track active requests
app.use(metricsMiddleware());        // Measure response time
```

#### Metrics Collected:
- Request duration (buckets: 10ms, 50ms, 100ms, 500ms, 1s, 2s, 5s, 10s)
- Active requests (current count)
- Response size distribution

---

### ✅ 4. Business Metrics Integration

Business metrics are automatically recorded in controllers:

#### Auth Controller:
- `recordUserRegistration('email')` - New user registers
- `recordLoginAttempt('success', 'email')` - Successful login
- `recordLoginAttempt('failed', 'email')` - Failed login
- `recordLoginAttempt('success', 'google')` - Google OAuth login

#### Scan Controller:
- `recordQrScan(restaurantId)` - QR menu scanned

#### Order Controller:
- `recordOrder(restaurantId, 'PENDING', totalAmount)` - New order created

#### Upload Route:
- `recordFileUpload('image', 'success')` - Image uploaded
- `recordFileUpload('file', 'success')` - File uploaded

---

## 📊 Prometheus Integration

### Prometheus Configuration

**prometheus.yml:**
```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'defneqr-api'
    static_configs:
      - targets: ['localhost:5000']
    metrics_path: '/metrics'
    # If METRICS_TOKEN is set:
    authorization:
      type: Bearer
      credentials: 'your-metrics-token-here'
```

### Running Prometheus

**Docker:**
```bash
docker run -d \
  --name prometheus \
  -p 9090:9090 \
  -v $(pwd)/prometheus.yml:/etc/prometheus/prometheus.yml \
  prom/prometheus
```

**Access Prometheus UI:**
```
http://localhost:9090
```

### Example Queries:

**1. Request Rate (requests per second)**
```promql
rate(defneqr_http_requests_total[5m])
```

**2. Average Response Time**
```promql
rate(defneqr_http_request_duration_seconds_sum[5m]) /
rate(defneqr_http_request_duration_seconds_count[5m])
```

**3. Error Rate**
```promql
rate(defneqr_http_requests_total{status_code=~"5.."}[5m])
```

**4. QR Scans per Hour**
```promql
increase(defneqr_qr_scans_total[1h])
```

**5. Memory Usage**
```promql
defneqr_process_resident_memory_bytes / 1024 / 1024
```

---

## 📈 Grafana Dashboard

### Setting Up Grafana

**1. Install Grafana:**
```bash
docker run -d \
  --name=grafana \
  -p 3001:3000 \
  grafana/grafana
```

**2. Access Grafana:**
```
http://localhost:3001
Default credentials: admin/admin
```

**3. Add Prometheus Data Source:**
- Configuration → Data Sources → Add data source
- Select "Prometheus"
- URL: `http://prometheus:9090` (if using Docker network)
- Save & Test

### Recommended Dashboard Panels:

**1. Request Rate**
- Query: `rate(defneqr_http_requests_total[5m])`
- Visualization: Graph (Time series)

**2. Response Time (p50, p95, p99)**
- Query: `histogram_quantile(0.50, rate(defneqr_http_request_duration_seconds_bucket[5m]))`
- Query: `histogram_quantile(0.95, rate(defneqr_http_request_duration_seconds_bucket[5m]))`
- Query: `histogram_quantile(0.99, rate(defneqr_http_request_duration_seconds_bucket[5m]))`
- Visualization: Graph (Time series)

**3. Error Rate**
- Query: `rate(defneqr_http_requests_total{status_code=~"5.."}[5m])`
- Visualization: Graph (Time series) with alert threshold

**4. Active Requests**
- Query: `defneqr_http_active_requests`
- Visualization: Gauge

**5. Memory Usage**
- Query: `defneqr_process_resident_memory_bytes / 1024 / 1024 / 1024`
- Visualization: Gauge with thresholds

**6. QR Scans Today**
- Query: `increase(defneqr_qr_scans_total[24h])`
- Visualization: Bar chart by restaurant

**7. Login Success Rate**
- Query: `rate(defneqr_login_attempts_total{status="success"}[5m]) / rate(defneqr_login_attempts_total[5m])`
- Visualization: Graph with percentage

**8. Order Value Distribution**
- Query: `histogram_quantile(0.50, rate(defneqr_order_value_bucket[1h]))`
- Visualization: Heatmap

---

## 🔍 Uptime Monitoring

### External Uptime Monitoring Services

**1. UptimeRobot (Free)**
- Website: https://uptimerobot.com
- Features:
  - 50 monitors (free tier)
  - 5-minute intervals
  - Email/SMS alerts
  - Status pages
- Setup:
  ```
  Monitor Type: HTTP(s)
  URL: https://api.defneqr.com/health
  Interval: 5 minutes
  Alert Contacts: your-email@domain.com
  ```

**2. Pingdom (Paid)**
- Website: https://www.pingdom.com
- Features:
  - Multi-location monitoring
  - Real user monitoring
  - Transaction monitoring
  - Detailed reports
- Setup:
  ```
  Check Type: Uptime
  URL: https://api.defneqr.com/health
  Check Interval: 1 minute
  Locations: Multiple (US, EU, Asia)
  ```

**3. StatusCake (Free/Paid)**
- Website: https://www.statuscake.com
- Features:
  - Unlimited tests (free tier)
  - 5-minute intervals (free tier)
  - Page speed monitoring
  - SSL monitoring
- Setup:
  ```
  Test Type: HTTP
  URL: https://api.defneqr.com/health
  Check Rate: 5 minutes
  ```

**4. Better Uptime (Paid)**
- Website: https://betteruptime.com
- Features:
  - Beautiful status pages
  - Incident management
  - On-call scheduling
  - Phone call alerts
- Setup:
  ```
  Monitor URL: https://api.defneqr.com/health
  Check Frequency: 30 seconds
  ```

**5. Freshping (Free)**
- Website: https://www.freshworks.com/website-monitoring/
- Features:
  - 50 monitors (free)
  - 1-minute intervals
  - Global locations
  - Status pages
- Setup:
  ```
  Monitor Name: Defne Qr API
  URL: https://api.defneqr.com/health
  Check Frequency: 1 minute
  ```

### Self-Hosted Uptime Monitoring

**Uptime Kuma (Recommended for Self-Hosting)**

```bash
# Docker installation
docker run -d \
  --name uptime-kuma \
  -p 3002:3001 \
  -v uptime-kuma:/app/data \
  louislam/uptime-kuma:1
```

**Access:** `http://localhost:3002`

**Features:**
- Beautiful UI
- Multiple monitor types (HTTP, TCP, Ping, DNS, etc.)
- Status pages
- Notifications (Email, Slack, Discord, etc.)
- Multi-language support
- Self-hosted (full control)

**Setup:**
1. Create admin account
2. Add new monitor:
   - Type: HTTP(s)
   - URL: `https://api.defneqr.com/health`
   - Heartbeat Interval: 60 seconds
   - Retries: 3
   - Expected Status Code: 200
3. Add notifications (Email, Slack, etc.)
4. Create status page (optional)

---

## 🚨 Alerting Rules

### Prometheus Alerting Rules

**alerting-rules.yml:**
```yaml
groups:
  - name: defneqr_alerts
    interval: 30s
    rules:
      # High error rate
      - alert: HighErrorRate
        expr: rate(defneqr_http_requests_total{status_code=~"5.."}[5m]) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value }} req/s"
      
      # Slow response time
      - alert: SlowResponseTime
        expr: histogram_quantile(0.95, rate(defneqr_http_request_duration_seconds_bucket[5m])) > 2
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "95th percentile response time is high"
          description: "Response time: {{ $value }}s"
      
      # Database connection issues
      - alert: DatabaseDown
        expr: up{job="defneqr-api"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Database is down"
          description: "Cannot connect to database"
      
      # High memory usage
      - alert: HighMemoryUsage
        expr: (defneqr_process_resident_memory_bytes / defneqr_nodejs_heap_size_total_bytes) > 0.9
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Memory usage is high"
          description: "Memory usage: {{ $value | humanizePercentage }}"
```

### Grafana Alerts

**Configure in Grafana UI:**
1. Edit panel → Alert tab
2. Set condition (e.g., `avg() OF query(A, 5m, now) IS ABOVE 100`)
3. Add notification channel
4. Test alert

---

## 📊 Monitoring Best Practices

### 1. Golden Signals

Monitor the "Four Golden Signals":

**Latency:** Response time
```promql
histogram_quantile(0.95, rate(defneqr_http_request_duration_seconds_bucket[5m]))
```

**Traffic:** Request rate
```promql
rate(defneqr_http_requests_total[5m])
```

**Errors:** Error rate
```promql
rate(defneqr_http_requests_total{status_code=~"5.."}[5m])
```

**Saturation:** Resource usage
```promql
defneqr_process_resident_memory_bytes / defneqr_nodejs_heap_size_total_bytes
```

### 2. SLI/SLO/SLA

**Service Level Indicators (SLI):**
- Availability: % of time service is available
- Response time: 95th percentile < 500ms
- Error rate: < 1% of requests

**Service Level Objectives (SLO):**
- 99.9% uptime (43 minutes downtime per month)
- 95% of requests < 500ms
- Error rate < 0.1%

**Service Level Agreements (SLA):**
- 99.5% uptime guaranteed
- Response time < 1s (95th percentile)
- < 24 hour response time for critical issues

### 3. Alert Fatigue Prevention

- Set appropriate thresholds
- Use `for:` clause to avoid flapping
- Group related alerts
- Use severity levels
- Test alerts before deploying

### 4. Dashboard Organization

**Operational Dashboard:**
- Request rate
- Response time
- Error rate
- Active users
- System resources

**Business Dashboard:**
- QR scans
- User registrations
- Orders
- Revenue

**Debugging Dashboard:**
- Slow queries
- Error logs
- Stack traces
- Request traces

---

## 🔧 Configuration

### Environment Variables

```env
# Monitoring & Metrics
METRICS_PUBLIC=false                              # Allow public access to metrics (dev only)
METRICS_TOKEN=your-metrics-token-here            # Token for Prometheus scraping
```

### Securing Metrics Endpoint

**Production:**
```javascript
// In production, metrics endpoint requires authentication
if (process.env.NODE_ENV === 'production' && process.env.METRICS_PUBLIC !== 'true') {
  const authHeader = req.headers.authorization;
  const metricsToken = process.env.METRICS_TOKEN;
  
  if (!authHeader || authHeader !== `Bearer ${metricsToken}`) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
}
```

**Development:**
```javascript
// In development, metrics are publicly accessible
// Visit: http://localhost:5000/metrics
```

---

## 📚 File Structure

```
backend/
├── src/
│   ├── utils/
│   │   ├── metrics.js              # Prometheus metrics
│   │   └── healthCheck.js          # Health check utilities
│   ├── middleware/
│   │   └── metrics.middleware.js   # Metrics middleware
│   ├── routes/
│   │   └── monitoring.routes.js    # Health & metrics routes
│   └── controllers/
│       ├── auth.controller.js      # (+ metrics)
│       ├── scan.controller.js      # (+ metrics)
│       ├── order.controller.js     # (+ metrics)
│       └── oauth.controller.js     # (+ metrics)
└── .env.example                    # (+ monitoring config)
```

---

## 🧪 Testing

### Test Health Endpoints

```bash
# Quick health check
curl http://localhost:5000/health

# Detailed health check (requires admin token)
curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  http://localhost:5000/health/detailed

# Readiness probe
curl http://localhost:5000/health/ready

# Liveness probe
curl http://localhost:5000/health/live
```

### Test Metrics Endpoint

```bash
# Get metrics (Prometheus format)
curl http://localhost:5000/metrics

# With authentication (production)
curl -H "Authorization: Bearer YOUR_METRICS_TOKEN" \
  https://api.defneqr.com/metrics

# Get metrics (JSON format, requires admin token)
curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  http://localhost:5000/metrics/json
```

### Generate Load for Testing

```bash
# Install Apache Bench
apt-get install apache2-utils

# Generate 1000 requests with 10 concurrent connections
ab -n 1000 -c 10 http://localhost:5000/health

# Watch metrics update in real-time
watch -n 1 'curl -s http://localhost:5000/metrics | grep defneqr_http'
```

---

## ✅ Production Checklist

### Before Deployment:
- [ ] Set `METRICS_TOKEN` in production
- [ ] Set `METRICS_PUBLIC=false` in production
- [ ] Configure Prometheus scraping
- [ ] Set up Grafana dashboards
- [ ] Configure external uptime monitoring
- [ ] Set up alert rules
- [ ] Configure alert notifications (email, Slack, etc.)
- [ ] Test health check endpoints
- [ ] Test metrics collection
- [ ] Document SLI/SLO/SLA

### After Deployment:
- [ ] Verify Prometheus is scraping metrics
- [ ] Verify Grafana dashboards are working
- [ ] Verify uptime monitoring is active
- [ ] Verify alerts are being received
- [ ] Set up on-call rotation (if applicable)
- [ ] Create runbooks for common issues

---

## 📖 Additional Resources

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [Google SRE Book](https://sre.google/sre-book/table-of-contents/)
- [The Four Golden Signals](https://sre.google/sre-book/monitoring-distributed-systems/)
- [Node.js Best Practices - Monitoring](https://github.com/goldbergyoni/nodebestpractices#6-production-best-practices)

---

**Document Version:** 1.0  
**Last Updated:** 2026-02-19  
**Status:** ✅ Production Ready
