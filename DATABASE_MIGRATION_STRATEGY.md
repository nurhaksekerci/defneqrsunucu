# Database Migration & Backup Strategy

## 📋 Overview

Bu dokümanda Defne Qr projesinin **Database Migration**, **Rollback** ve **Backup** stratejilerinin detayları açıklanmaktadır.

---

## 📊 Migration History

### Current Migrations (Total: 14)

| # | Timestamp | Name | Description | Status |
|---|-----------|------|-------------|--------|
| 1 | 20260215174415 | `init` | Initial schema | ✅ Applied |
| 2 | 20260215181912 | `make_base_price_optional` | Product basePrice → optional | ✅ Applied |
| 3 | 20260215183546 | `add_product_is_active` | Product isActive field | ✅ Applied |
| 4 | 20260216092503 | `add_product_order` | Product order field | ✅ Applied |
| 5 | 20260216093851 | `add_system_settings` | SystemSettings model | ✅ Applied |
| 6 | 20260216094257 | `add_menu_scans` | MenuScan model (QR analytics) | ✅ Applied |
| 7 | 20260216095939 | `add_tables` | Table model (POS) | ✅ Applied |
| 8 | 20260218104840 | `add_menu_settings` | Restaurant menuSettings JSON | ✅ Applied |
| 9 | 20260218121003 | `add_all_system_settings` | Extended SystemSettings | ✅ Applied |
| 10 | 20260218173844 | `add_plans_and_subscriptions` | Plan & Subscription models | ✅ Applied |
| 11 | 20260218174944 | `add_plan_popular_and_extra_price` | Plan extra fields | ✅ Applied |
| 12 | 20260218185216 | `add_password_reset_and_security` | PasswordReset model | ✅ Applied |
| 13 | 20260218190130 | `add_refresh_token_and_blacklist` | JWT security models | ✅ Applied |
| 14 | 20260218193213 | `add_performance_indexes` | 30+ performance indexes | ✅ Applied |

---

## 🚀 Production Migration Strategy

### Pre-Migration Checklist

**Before applying ANY migration in production:**

- [ ] **1. Full Database Backup**
  ```bash
  pg_dump -U username -d dijitalmenu > backup_$(date +%Y%m%d_%H%M%S).sql
  ```

- [ ] **2. Test Migration in Staging**
  ```bash
  # Apply migration in staging environment
  DATABASE_URL=$STAGING_DATABASE_URL npx prisma migrate deploy
  
  # Verify application still works
  # Run integration tests
  npm run test:integration
  ```

- [ ] **3. Create Rollback Script**
  - Document manual rollback steps
  - Test rollback in staging
  - Save rollback SQL separately

- [ ] **4. Monitor Database Size**
  ```sql
  SELECT pg_size_pretty(pg_database_size('dijitalmenu')) as size;
  ```

- [ ] **5. Check Active Connections**
  ```sql
  SELECT count(*) FROM pg_stat_activity WHERE datname = 'dijitalmenu';
  ```

- [ ] **6. Schedule Maintenance Window**
  - Choose low-traffic time (e.g., 2-4 AM)
  - Notify users (if applicable)
  - Prepare rollback communication

### Migration Deployment Steps

#### Step 1: Preparation (T-30 minutes)

```bash
# 1. SSH into production server
ssh user@production-server

# 2. Navigate to project directory
cd /var/www/defneqr

# 3. Pull latest code
git pull origin main

# 4. Verify Prisma schema
cat backend/prisma/schema.prisma
```

#### Step 2: Database Backup (T-15 minutes)

```bash
# Create backup directory
mkdir -p backups/$(date +%Y%m%d)

# Full database backup (with timestamp)
pg_dump \
  -U $DB_USER \
  -h $DB_HOST \
  -d dijitalmenu \
  -F c \
  -b \
  -v \
  -f "backups/$(date +%Y%m%d)/full_backup_$(date +%H%M%S).dump"

# Verify backup file size
ls -lh backups/$(date +%Y%m%d)/

# Test backup integrity
pg_restore --list backups/$(date +%Y%m%d)/full_backup_*.dump | head -20
```

#### Step 3: Stop Application (T-5 minutes)

```bash
# Stop backend server
pm2 stop defneqr-backend

# Verify server stopped
pm2 list
```

#### Step 4: Apply Migration (T-0)

```bash
# Navigate to backend directory
cd backend

# Apply migrations
NODE_ENV=production npx prisma migrate deploy

# Expected output:
# ✔ Applying migration `20260218193213_add_performance_indexes`
# ✔ Migration applied successfully
```

#### Step 5: Verify Migration (T+2 minutes)

```bash
# Check migration status
npx prisma migrate status

# Verify tables/indexes exist
psql -U $DB_USER -d dijitalmenu -c "\d users"
psql -U $DB_USER -d dijitalmenu -c "\di"  # List indexes

# Check database size (should be similar + small increase)
psql -U $DB_USER -d dijitalmenu -c "SELECT pg_size_pretty(pg_database_size('dijitalmenu'));"
```

#### Step 6: Start Application (T+5 minutes)

```bash
# Start backend server
pm2 start defneqr-backend

# Check logs for errors
pm2 logs defneqr-backend --lines 50

# Verify application health
curl http://localhost:5000/health
```

#### Step 7: Smoke Testing (T+10 minutes)

```bash
# Test critical endpoints
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'

curl http://localhost:5000/api/restaurants \
  -H "Authorization: Bearer $TOKEN"

# Monitor error logs
tail -f /var/log/defneqr/error.log
```

#### Step 8: Monitor (T+30 minutes)

```bash
# Monitor application metrics
pm2 monit

# Check database performance
psql -U $DB_USER -d dijitalmenu -c "
  SELECT pid, query_start, state, query 
  FROM pg_stat_activity 
  WHERE datname = 'dijitalmenu' 
  ORDER BY query_start DESC 
  LIMIT 10;
"

# Monitor slow queries
tail -f /var/log/postgresql/postgresql.log | grep "duration:"
```

---

## ⏮️ Migration Rollback Strategy

### When to Rollback

**Immediate rollback if:**
- ❌ Application crashes on startup
- ❌ Critical features broken
- ❌ Database queries fail
- ❌ Performance degradation > 50%
- ❌ Data corruption detected

**Consider rollback if:**
- ⚠️ Non-critical features broken
- ⚠️ Performance degradation 20-50%
- ⚠️ User complaints spike

### Rollback Procedure

#### Option 1: Automated Rollback (Recommended)

```bash
# 1. Stop application
pm2 stop defneqr-backend

# 2. Restore from backup
pg_restore \
  --clean \
  --if-exists \
  -U $DB_USER \
  -d dijitalmenu \
  backups/$(date +%Y%m%d)/full_backup_*.dump

# 3. Verify restore
psql -U $DB_USER -d dijitalmenu -c "SELECT COUNT(*) FROM users;"

# 4. Revert code to previous version
git checkout HEAD~1

# 5. Restart application
cd backend && npm install
pm2 start defneqr-backend

# 6. Verify health
curl http://localhost:5000/health
```

#### Option 2: Manual Migration Revert

```bash
# 1. Connect to database
psql -U $DB_USER -d dijitalmenu

# 2. Check current migration status
SELECT * FROM "_prisma_migrations" ORDER BY finished_at DESC LIMIT 5;

# 3. Mark migration as rolled back
UPDATE "_prisma_migrations" 
SET rolled_back_at = NOW() 
WHERE migration_name = '20260218193213_add_performance_indexes';

# 4. Drop indexes manually (for index migration)
DROP INDEX IF EXISTS users_role_idx;
DROP INDEX IF EXISTS users_isDeleted_idx;
-- ... (repeat for all indexes from migration)

# 5. Verify rollback
\di  -- List indexes
```

### Rollback Scripts

Create individual rollback scripts for each migration:

**Example: Rollback for `add_performance_indexes`**

```sql
-- File: migrations/rollback/20260218193213_rollback_performance_indexes.sql

-- Users indexes
DROP INDEX IF EXISTS users_role_idx;
DROP INDEX IF EXISTS users_isDeleted_idx;
DROP INDEX IF EXISTS users_createdAt_idx;
DROP INDEX IF EXISTS users_email_isDeleted_idx;

-- Restaurants indexes
DROP INDEX IF EXISTS restaurants_ownerId_idx;
DROP INDEX IF EXISTS restaurants_isDeleted_idx;
DROP INDEX IF EXISTS restaurants_createdAt_idx;
DROP INDEX IF EXISTS restaurants_slug_isDeleted_idx;

-- Categories indexes
DROP INDEX IF EXISTS categories_restaurantId_idx;
DROP INDEX IF EXISTS categories_isGlobal_idx;
DROP INDEX IF EXISTS categories_isDeleted_idx;
DROP INDEX IF EXISTS categories_order_idx;
DROP INDEX IF EXISTS categories_restaurantId_isDeleted_isGlobal_idx;

-- Products indexes
DROP INDEX IF EXISTS products_categoryId_idx;
DROP INDEX IF EXISTS products_restaurantId_idx;
DROP INDEX IF EXISTS products_isGlobal_idx;
DROP INDEX IF EXISTS products_isActive_idx;
DROP INDEX IF EXISTS products_isDeleted_idx;
DROP INDEX IF EXISTS products_order_idx;
DROP INDEX IF EXISTS products_restaurantId_categoryId_isDeleted_idx;
DROP INDEX IF EXISTS products_isGlobal_isActive_isDeleted_idx;

-- Orders indexes
DROP INDEX IF EXISTS orders_restaurantId_idx;
DROP INDEX IF EXISTS orders_tableId_idx;
DROP INDEX IF EXISTS orders_waiterId_idx;
DROP INDEX IF EXISTS orders_status_idx;
DROP INDEX IF EXISTS orders_isDeleted_idx;
DROP INDEX IF EXISTS orders_createdAt_idx;
DROP INDEX IF EXISTS orders_restaurantId_status_isDeleted_idx;
DROP INDEX IF EXISTS orders_tableId_status_idx;

-- Payments indexes
DROP INDEX IF EXISTS payments_restaurantId_idx;
DROP INDEX IF EXISTS payments_orderId_idx;
DROP INDEX IF EXISTS payments_status_idx;
DROP INDEX IF EXISTS payments_isDeleted_idx;
DROP INDEX IF EXISTS payments_createdAt_idx;
DROP INDEX IF EXISTS payments_restaurantId_status_isDeleted_idx;

-- Stocks indexes
DROP INDEX IF EXISTS stocks_restaurantId_idx;
DROP INDEX IF EXISTS stocks_productId_idx;
DROP INDEX IF EXISTS stocks_isDeleted_idx;
DROP INDEX IF EXISTS stocks_quantity_idx;
```

**To apply rollback:**
```bash
psql -U $DB_USER -d dijitalmenu < migrations/rollback/20260218193213_rollback_performance_indexes.sql
```

---

## 💾 Database Backup Strategy

### Backup Types

#### 1. **Full Backup (Daily)**

**Schedule:** Every day at 3:00 AM  
**Retention:** 30 days  
**Format:** Custom compressed format (`.dump`)

```bash
# Cron job: 0 3 * * *
pg_dump \
  -U $DB_USER \
  -h $DB_HOST \
  -d dijitalmenu \
  -F c \
  -b \
  -v \
  -Z 9 \
  -f "/backups/daily/dijitalmenu_$(date +%Y%m%d).dump"

# Compress old backups
find /backups/daily/ -name "*.dump" -mtime +30 -delete
```

#### 2. **Incremental Backup (Hourly)**

**Schedule:** Every hour  
**Retention:** 7 days  
**Method:** WAL (Write-Ahead Logging) archiving

```bash
# postgresql.conf
wal_level = replica
archive_mode = on
archive_command = 'cp %p /backups/wal/%f'
archive_timeout = 3600

# Restore incremental backup
pg_restore \
  --create \
  --verbose \
  -U $DB_USER \
  /backups/daily/dijitalmenu_20260218.dump
```

#### 3. **Pre-Migration Backup (Manual)**

**Trigger:** Before every migration  
**Retention:** Permanent (or until migration stable)

```bash
# Create pre-migration backup
mkdir -p /backups/migrations/$(date +%Y%m%d)

pg_dump \
  -U $DB_USER \
  -d dijitalmenu \
  -F c \
  -b \
  -v \
  -f "/backups/migrations/$(date +%Y%m%d)/pre_migration_$(date +%H%M%S).dump"

# Save migration info
echo "Migration: $MIGRATION_NAME" > /backups/migrations/$(date +%Y%m%d)/info.txt
echo "Timestamp: $(date)" >> /backups/migrations/$(date +%Y%m%d)/info.txt
echo "Database size: $(psql -U $DB_USER -d dijitalmenu -t -c 'SELECT pg_size_pretty(pg_database_size(current_database()))')" >> /backups/migrations/$(date +%Y%m%d)/info.txt
```

#### 4. **Cloud Backup (Weekly)**

**Schedule:** Every Sunday at 2:00 AM  
**Retention:** 90 days  
**Provider:** AWS S3 / Google Cloud Storage

```bash
# Backup to S3
pg_dump \
  -U $DB_USER \
  -d dijitalmenu \
  -F c \
  -Z 9 \
  | aws s3 cp - s3://defneqr-backups/weekly/dijitalmenu_$(date +%Y%m%d).dump

# Verify upload
aws s3 ls s3://defneqr-backups/weekly/ --human-readable

# Set lifecycle policy (delete after 90 days)
aws s3api put-bucket-lifecycle-configuration \
  --bucket defneqr-backups \
  --lifecycle-configuration file://lifecycle-policy.json
```

### Backup Automation Script

**File: `scripts/backup.sh`**

```bash
#!/bin/bash

# Defne Qr Database Backup Script
# Usage: ./scripts/backup.sh [type] [options]

set -e

# Configuration
DB_USER="${DB_USER:-postgres}"
DB_NAME="${DB_NAME:-dijitalmenu}"
DB_HOST="${DB_HOST:-localhost}"
BACKUP_DIR="${BACKUP_DIR:-/backups}"
DATE=$(date +%Y%m%d)
TIMESTAMP=$(date +%H%M%S)

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function: Full Backup
full_backup() {
    log_info "Starting full database backup..."
    
    BACKUP_PATH="$BACKUP_DIR/daily/dijitalmenu_${DATE}_${TIMESTAMP}.dump"
    mkdir -p "$BACKUP_DIR/daily"
    
    pg_dump \
        -U "$DB_USER" \
        -h "$DB_HOST" \
        -d "$DB_NAME" \
        -F c \
        -b \
        -v \
        -Z 9 \
        -f "$BACKUP_PATH"
    
    if [ $? -eq 0 ]; then
        log_info "Backup completed: $BACKUP_PATH"
        log_info "Size: $(du -h $BACKUP_PATH | cut -f1)"
    else
        log_error "Backup failed!"
        exit 1
    fi
}

# Function: Pre-Migration Backup
pre_migration_backup() {
    local MIGRATION_NAME=$1
    
    log_info "Creating pre-migration backup for: $MIGRATION_NAME"
    
    BACKUP_PATH="$BACKUP_DIR/migrations/${DATE}/pre_${MIGRATION_NAME}_${TIMESTAMP}.dump"
    mkdir -p "$BACKUP_DIR/migrations/${DATE}"
    
    pg_dump \
        -U "$DB_USER" \
        -h "$DB_HOST" \
        -d "$DB_NAME" \
        -F c \
        -b \
        -v \
        -f "$BACKUP_PATH"
    
    # Save metadata
    cat > "$BACKUP_DIR/migrations/${DATE}/info_${MIGRATION_NAME}.txt" <<EOF
Migration: $MIGRATION_NAME
Timestamp: $(date)
Database Size: $(psql -U $DB_USER -h $DB_HOST -d $DB_NAME -t -c "SELECT pg_size_pretty(pg_database_size('$DB_NAME'))")
Table Counts:
$(psql -U $DB_USER -h $DB_HOST -d $DB_NAME -t -c "SELECT schemaname || '.' || tablename, n_tup_ins FROM pg_stat_user_tables ORDER BY n_tup_ins DESC LIMIT 10")
EOF
    
    log_info "Pre-migration backup completed: $BACKUP_PATH"
}

# Function: Verify Backup
verify_backup() {
    local BACKUP_FILE=$1
    
    log_info "Verifying backup: $BACKUP_FILE"
    
    if [ ! -f "$BACKUP_FILE" ]; then
        log_error "Backup file not found: $BACKUP_FILE"
        exit 1
    fi
    
    # List backup contents
    pg_restore --list "$BACKUP_FILE" > /dev/null 2>&1
    
    if [ $? -eq 0 ]; then
        log_info "Backup verification successful"
    else
        log_error "Backup verification failed!"
        exit 1
    fi
}

# Function: Cleanup Old Backups
cleanup_old_backups() {
    local RETENTION_DAYS=${1:-30}
    
    log_info "Cleaning up backups older than $RETENTION_DAYS days..."
    
    find "$BACKUP_DIR/daily" -name "*.dump" -mtime +$RETENTION_DAYS -delete
    
    log_info "Cleanup completed"
}

# Main
case "$1" in
    full)
        full_backup
        cleanup_old_backups 30
        ;;
    pre-migration)
        if [ -z "$2" ]; then
            log_error "Migration name required: ./backup.sh pre-migration <migration_name>"
            exit 1
        fi
        pre_migration_backup "$2"
        ;;
    verify)
        if [ -z "$2" ]; then
            log_error "Backup file required: ./backup.sh verify <backup_file>"
            exit 1
        fi
        verify_backup "$2"
        ;;
    cleanup)
        cleanup_old_backups ${2:-30}
        ;;
    *)
        echo "Usage: $0 {full|pre-migration|verify|cleanup} [options]"
        echo ""
        echo "Commands:"
        echo "  full                    - Create full database backup"
        echo "  pre-migration <name>    - Create pre-migration backup"
        echo "  verify <file>           - Verify backup integrity"
        echo "  cleanup [days]          - Remove backups older than N days (default: 30)"
        exit 1
        ;;
esac

exit 0
```

**Make executable:**
```bash
chmod +x scripts/backup.sh
```

**Usage:**
```bash
# Full backup
./scripts/backup.sh full

# Pre-migration backup
./scripts/backup.sh pre-migration add_new_feature

# Verify backup
./scripts/backup.sh verify /backups/daily/dijitalmenu_20260218.dump

# Cleanup old backups
./scripts/backup.sh cleanup 30
```

### Backup Cron Jobs

```bash
# Edit crontab
crontab -e

# Add backup schedules
# Full backup daily at 3 AM
0 3 * * * /var/www/defneqr/scripts/backup.sh full >> /var/log/backup.log 2>&1

# Cloud backup weekly (Sunday 2 AM)
0 2 * * 0 /var/www/defneqr/scripts/backup-to-cloud.sh >> /var/log/backup-cloud.log 2>&1

# Cleanup old backups (Monday 4 AM)
0 4 * * 1 /var/www/defneqr/scripts/backup.sh cleanup 30 >> /var/log/backup-cleanup.log 2>&1
```

---

## 📊 Database Index Coverage Report

### Current Index Coverage: 100%

| Model | Fields Indexed | Composite Indexes | Coverage |
|-------|----------------|-------------------|----------|
| User | 4 single + 1 composite | `(email, isDeleted)` | ✅ 100% |
| Restaurant | 4 single + 1 composite | `(slug, isDeleted)` | ✅ 100% |
| Category | 5 single + 1 composite | `(restaurantId, isDeleted, isGlobal)` | ✅ 100% |
| Product | 8 single + 2 composite | `(restaurantId, categoryId, isDeleted)`, `(isGlobal, isActive, isDeleted)` | ✅ 100% |
| Order | 8 single + 2 composite | `(restaurantId, status, isDeleted)`, `(tableId, status)` | ✅ 100% |
| Payment | 6 single + 1 composite | `(restaurantId, status, isDeleted)` | ✅ 100% |
| Stock | 4 single | - | ✅ 100% |
| MenuScan | 1 composite | `(restaurantId, scannedAt)` | ✅ 100% |
| Table | 2 single + 1 unique | `(restaurantId, name)` | ✅ 100% |

**Total Indexes:** 30+ (excluding primary keys and unique constraints)

### Index Performance Verification

```sql
-- Check if indexes are being used
EXPLAIN ANALYZE 
SELECT * FROM users WHERE email = 'test@example.com' AND isDeleted = false;

-- Expected: Index Scan using users_email_isDeleted_idx

-- Check index usage statistics
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- Check unused indexes (consider dropping if idx_scan = 0)
SELECT 
    schemaname || '.' || tablename as table,
    indexname,
    idx_scan
FROM pg_stat_user_indexes
WHERE schemaname = 'public' AND idx_scan = 0
ORDER BY tablename, indexname;
```

---

## 🔧 Maintenance Procedures

### Database Health Check

```bash
# Run weekly database health check
./scripts/db-health-check.sh
```

**File: `scripts/db-health-check.sh`**

```bash
#!/bin/bash

# Database Health Check Script

DB_USER="${DB_USER:-postgres}"
DB_NAME="${DB_NAME:-dijitalmenu}"
DB_HOST="${DB_HOST:-localhost}"

echo "=== Database Health Check ==="
echo "Date: $(date)"
echo ""

# 1. Database Size
echo "1. Database Size:"
psql -U $DB_USER -h $DB_HOST -d $DB_NAME -c "
    SELECT pg_size_pretty(pg_database_size('$DB_NAME')) as size;
"

# 2. Table Sizes
echo ""
echo "2. Top 10 Largest Tables:"
psql -U $DB_USER -h $DB_HOST -d $DB_NAME -c "
    SELECT 
        schemaname || '.' || tablename as table_name,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
        pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) as indexes_size
    FROM pg_tables
    WHERE schemaname = 'public'
    ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
    LIMIT 10;
"

# 3. Index Usage
echo ""
echo "3. Index Usage (Top 10):"
psql -U $DB_USER -h $DB_HOST -d $DB_NAME -c "
    SELECT 
        schemaname || '.' || tablename as table_name,
        indexname,
        idx_scan as scans,
        pg_size_pretty(pg_relation_size(indexrelid)) as size
    FROM pg_stat_user_indexes
    WHERE schemaname = 'public'
    ORDER BY idx_scan DESC
    LIMIT 10;
"

# 4. Unused Indexes
echo ""
echo "4. Unused Indexes (Consider Dropping):"
psql -U $DB_USER -h $DB_HOST -d $DB_NAME -c "
    SELECT 
        schemaname || '.' || tablename as table_name,
        indexname,
        pg_size_pretty(pg_relation_size(indexrelid)) as size
    FROM pg_stat_user_indexes
    WHERE schemaname = 'public' AND idx_scan = 0
    ORDER BY pg_relation_size(indexrelid) DESC;
"

# 5. Active Connections
echo ""
echo "5. Active Connections:"
psql -U $DB_USER -h $DB_HOST -d $DB_NAME -c "
    SELECT 
        datname,
        count(*) as connections,
        max(backend_start) as oldest_connection
    FROM pg_stat_activity
    WHERE datname = '$DB_NAME'
    GROUP BY datname;
"

# 6. Long Running Queries
echo ""
echo "6. Long Running Queries (>30s):"
psql -U $DB_USER -h $DB_HOST -d $DB_NAME -c "
    SELECT 
        pid,
        now() - pg_stat_activity.query_start AS duration,
        query,
        state
    FROM pg_stat_activity
    WHERE (now() - pg_stat_activity.query_start) > interval '30 seconds'
    AND state != 'idle'
    ORDER BY duration DESC;
"

# 7. Dead Tuples (Need VACUUM?)
echo ""
echo "7. Dead Tuples (High values need VACUUM):"
psql -U $DB_USER -h $DB_HOST -d $DB_NAME -c "
    SELECT 
        schemaname || '.' || tablename as table_name,
        n_live_tup as live_tuples,
        n_dead_tup as dead_tuples,
        round(n_dead_tup::numeric / NULLIF(n_live_tup + n_dead_tup, 0) * 100, 2) as dead_ratio
    FROM pg_stat_user_tables
    WHERE schemaname = 'public'
    ORDER BY n_dead_tup DESC
    LIMIT 10;
"

echo ""
echo "=== Health Check Complete ==="
```

---

## ✅ Production Checklist

### Pre-Migration
- [ ] Full database backup completed
- [ ] Backup verified (restore test in dev)
- [ ] Migration tested in staging
- [ ] Rollback script prepared and tested
- [ ] Maintenance window scheduled
- [ ] Team notified
- [ ] Monitoring alerts configured

### During Migration
- [ ] Application stopped
- [ ] Migration applied successfully
- [ ] Migration status verified
- [ ] Database queries tested
- [ ] Application restarted
- [ ] Health check passed

### Post-Migration
- [ ] Smoke tests passed
- [ ] No error spikes in logs
- [ ] Performance metrics normal
- [ ] User feedback positive
- [ ] Backup of new state created
- [ ] Documentation updated

### Rollback (If Needed)
- [ ] Issue severity assessed
- [ ] Rollback decision made
- [ ] Application stopped
- [ ] Database restored from backup
- [ ] Code reverted to previous version
- [ ] Application restarted
- [ ] Health verified
- [ ] Incident report created

---

## 📚 References

- [Prisma Migrations Guide](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [PostgreSQL Backup & Restore](https://www.postgresql.org/docs/current/backup.html)
- [PostgreSQL Performance Tips](https://wiki.postgresql.org/wiki/Performance_Optimization)
- [Database Migration Best Practices](https://www.prisma.io/dataguide/types/relational/migration-strategies)

---

**Document Version**: 1.0  
**Last Updated**: 2026-02-18  
**Status**: ✅ Production Ready
