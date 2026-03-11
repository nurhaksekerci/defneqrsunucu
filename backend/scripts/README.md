# Database Scripts

This directory contains database management, backup, and monitoring scripts for Defne Qr.

## 📁 Available Scripts

### 1. `backup.sh` / `backup.ps1`

Comprehensive database backup and restore utility.

**Features:**
- Full database backups
- Pre-migration backups with metadata
- Backup verification
- Database restore with safety backup
- Automatic cleanup of old backups
- List and stats commands

**Usage (Linux/Mac):**

```bash
# Make script executable
chmod +x scripts/backup.sh

# Full backup
./scripts/backup.sh full

# Pre-migration backup
./scripts/backup.sh pre-migration add_new_feature

# Verify backup integrity
./scripts/backup.sh verify backups/daily/dijitalmenu_20260218.dump

# Restore from backup
./scripts/backup.sh restore backups/daily/dijitalmenu_20260218.dump

# List available backups
./scripts/backup.sh list

# Database statistics
./scripts/backup.sh stats

# Cleanup old backups (default: 30 days)
./scripts/backup.sh cleanup 30
```

**Usage (Windows):**

```powershell
# Full backup
.\scripts\backup.ps1 -Type full

# Pre-migration backup
.\scripts\backup.ps1 -Type pre-migration -Option add_new_feature

# Verify backup
.\scripts\backup.ps1 -Type verify -Option backups\daily\dijitalmenu_20260218.dump

# Restore from backup
.\scripts\backup.ps1 -Type restore -Option backups\daily\dijitalmenu_20260218.dump

# List backups
.\scripts\backup.ps1 -Type list

# Database stats
.\scripts\backup.ps1 -Type stats

# Cleanup old backups
.\scripts\backup.ps1 -Type cleanup -Option 30
```

**Environment Variables:**
```bash
DB_USER=postgres        # Database username (default: postgres)
DB_NAME=dijitalmenu     # Database name (default: dijitalmenu)
DB_HOST=localhost       # Database host (default: localhost)
DB_PORT=5432            # Database port (default: 5432)
BACKUP_DIR=./backups    # Backup directory (default: ./backups)
PGPASSWORD=yourpass     # PostgreSQL password (optional)
```

---

### 2. `add-user-avatar-column.js`

Users tablosuna `avatar` sütununu ekler. Prisma migration uygulanmamışsa veya "No pending migrations" hatası alıyorsanız bu script'i çalıştırın.

**Docker ile çalıştırma:**
```bash
docker compose exec backend node scripts/add-user-avatar-column.js
```

**Yerel ortamda:**
```bash
cd backend
node scripts/add-user-avatar-column.js
```

---

### 3. `add-promo-to-premium.js`

Mevcut premium abonelikleri olan hesaplara **IYIKIDOGDUNDEFNE** promosyon kodu kullanımı ekler. Sadece henüz promosyon kaydı olmayan abonelikler işlenir.

**Docker ile çalıştırma:**
```bash
docker compose exec backend node scripts/add-promo-to-premium.js
```

**Yerel ortamda:**
```bash
cd backend
node scripts/add-promo-to-premium.js
```

---

### 4. `add-defnerandevu-schema.js`

DefneRandevu şema değişikliklerini uygular: Project enum, support_tickets.project, appointment_businesses ve diğer DefneRandevu tabloları. Prisma migrate deploy başarısız olursa veya manuel uygulama gerekiyorsa kullanın.

**Docker ile çalıştırma:**
```bash
docker compose exec backend node scripts/add-defnerandevu-schema.js
```

**Veya docker-migrate.sh üzerinden:**
```bash
./scripts/docker-migrate.sh defnerandevu
```

**Yerel ortamda:**
```bash
cd backend
node scripts/add-defnerandevu-schema.js
```

---

### 5. `db-health-check.sh`

Comprehensive database health monitoring script.

**Features:**
- Database size and table statistics
- Index usage analysis
- Unused index detection
- Active connections monitoring
- Long-running query detection
- Dead tuples analysis (VACUUM recommendations)
- Table bloat estimation
- Connection pool status

**Usage:**

```bash
# Make script executable
chmod +x scripts/db-health-check.sh

# Run health check
./scripts/db-health-check.sh
```

**Recommended Schedule:**
```bash
# Add to crontab for weekly health checks
0 9 * * 1 /var/www/defneqr/backend/scripts/db-health-check.sh >> /var/log/db-health.log 2>&1
```

**Output Includes:**
1. Database size and table counts
2. Top 10 largest tables
3. Index usage statistics
4. Unused indexes (consider dropping)
5. Active database connections
6. Long-running queries (>10s)
7. Dead tuples analysis
8. Table bloat estimation
9. Recent errors from logs
10. Connection pool status

---

## 🔧 Setup

### Prerequisites

**Linux/Mac:**
```bash
# Install PostgreSQL client tools
sudo apt-get install postgresql-client  # Ubuntu/Debian
brew install postgresql                  # macOS

# Verify installation
pg_dump --version
psql --version
```

**Windows:**
```powershell
# PostgreSQL client tools are included with PostgreSQL installation
# Ensure pg_dump and psql are in PATH

# Verify installation
pg_dump --version
psql --version
```

### Directory Structure

```
backend/
├── scripts/
│   ├── README.md                   # This file
│   ├── backup.sh                   # Backup script (Linux/Mac)
│   ├── backup.ps1                  # Backup script (Windows)
│   └── db-health-check.sh          # Health check script
├── backups/                        # Backup storage (auto-created)
│   ├── daily/                      # Daily full backups
│   ├── migrations/                 # Pre-migration backups
│   └── safety/                     # Safety backups before restore
└── prisma/
    └── migrations/
        └── rollback/               # Rollback scripts
```

---

## 📅 Recommended Schedules

### Production Environment

**Daily Full Backup:**
```bash
# Crontab entry (3:00 AM daily)
0 3 * * * cd /var/www/defneqr/backend && ./scripts/backup.sh full >> /var/log/backup.log 2>&1
```

**Weekly Health Check:**
```bash
# Crontab entry (9:00 AM Monday)
0 9 * * 1 cd /var/www/defneqr/backend && ./scripts/db-health-check.sh >> /var/log/db-health.log 2>&1
```

**Monthly Cleanup:**
```bash
# Crontab entry (4:00 AM 1st of month)
0 4 1 * * cd /var/www/defneqr/backend && ./scripts/backup.sh cleanup 30 >> /var/log/backup-cleanup.log 2>&1
```

### Development Environment

**Manual backups before major changes:**
```bash
./scripts/backup.sh pre-migration feature_name
```

**Weekly health checks:**
```bash
./scripts/db-health-check.sh
```

---

## 🚨 Emergency Procedures

### Database Restore

**1. Stop the application:**
```bash
pm2 stop defneqr-backend
```

**2. Restore from backup:**
```bash
./scripts/backup.sh restore backups/daily/dijitalmenu_20260218_030000.dump
```

**3. Verify restore:**
```bash
psql -U postgres -d dijitalmenu -c "SELECT COUNT(*) FROM users;"
```

**4. Restart application:**
```bash
pm2 start defneqr-backend
```

### Migration Rollback

**1. Find rollback script:**
```bash
ls prisma/migrations/rollback/
```

**2. Apply rollback:**
```bash
psql -U postgres -d dijitalmenu < prisma/migrations/rollback/20260218193213_rollback_performance_indexes.sql
```

**3. Verify rollback:**
```bash
psql -U postgres -d dijitalmenu -c "\di"  # List indexes
```

---

## 🔒 Security Notes

1. **Backup Storage:**
   - Store backups in secure location with restricted permissions
   - Encrypt backups containing sensitive data
   - Use separate storage for disaster recovery

2. **Database Credentials:**
   - Never hardcode passwords in scripts
   - Use `.pgpass` file or environment variables
   - Restrict script execution permissions (chmod 750)

3. **Log Files:**
   - Regularly rotate log files
   - Monitor logs for suspicious activity
   - Protect logs from unauthorized access

---

## 📊 Monitoring

### Key Metrics to Monitor

1. **Database Size Growth:**
   - Track daily/weekly/monthly growth
   - Set alerts for unusual spikes

2. **Backup Size:**
   - Monitor backup size trends
   - Ensure adequate storage space

3. **Query Performance:**
   - Track slow query frequency
   - Monitor average query duration

4. **Connection Pool:**
   - Watch for connection leaks
   - Monitor peak connection usage

5. **Dead Tuples:**
   - Track dead tuple ratio
   - Automate VACUUM when threshold exceeded

---

## 🆘 Troubleshooting

### Backup Fails

**Error: "pg_dump: command not found"**
```bash
# Add PostgreSQL bin to PATH
export PATH=$PATH:/usr/pgsql-14/bin
# or
export PATH=$PATH:/usr/lib/postgresql/14/bin
```

**Error: "FATAL: password authentication failed"**
```bash
# Create .pgpass file
echo "localhost:5432:dijitalmenu:postgres:yourpassword" > ~/.pgpass
chmod 600 ~/.pgpass
```

**Error: "EPERM: operation not permitted" (Windows)**
```powershell
# Stop all Node.js processes
Stop-Process -Name node -Force

# Run backup script as Administrator
```

### Restore Fails

**Error: "role 'postgres' does not exist"**
```bash
# Use --no-owner flag
pg_restore --no-owner --no-acl -U youruser -d dijitalmenu backup.dump
```

**Error: "database is being accessed by other users"**
```bash
# Disconnect all users
psql -U postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'dijitalmenu';"
```

---

## 📚 Additional Resources

- [PostgreSQL Backup Documentation](https://www.postgresql.org/docs/current/backup.html)
- [Prisma Migrate Guide](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [Database Migration Strategy](../DATABASE_MIGRATION_STRATEGY.md)
- [Production Checklist](../../PRODUCTION_CHECKLIST.md)

---

**Last Updated:** 2026-02-18  
**Version:** 1.0  
**Status:** ✅ Production Ready
