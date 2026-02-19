#!/bin/bash

# Defne Qr Database Backup Script
# Usage: ./scripts/backup.sh [type] [options]

set -e

# Configuration
DB_USER="${DB_USER:-postgres}"
DB_NAME="${DB_NAME:-dijitalmenu}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
DATE=$(date +%Y%m%d)
TIMESTAMP=$(date +%H%M%S)

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Function: Full Backup
full_backup() {
    log_step "Starting full database backup..."
    
    BACKUP_PATH="$BACKUP_DIR/daily/dijitalmenu_${DATE}_${TIMESTAMP}.dump"
    mkdir -p "$BACKUP_DIR/daily"
    
    log_info "Database: $DB_NAME@$DB_HOST:$DB_PORT"
    log_info "Output: $BACKUP_PATH"
    
    pg_dump \
        -U "$DB_USER" \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -d "$DB_NAME" \
        -F c \
        -b \
        -v \
        -Z 9 \
        -f "$BACKUP_PATH"
    
    if [ $? -eq 0 ]; then
        log_info "✅ Backup completed: $BACKUP_PATH"
        log_info "Size: $(du -h $BACKUP_PATH | cut -f1)"
        
        # Verify backup
        verify_backup "$BACKUP_PATH"
    else
        log_error "❌ Backup failed!"
        exit 1
    fi
}

# Function: Pre-Migration Backup
pre_migration_backup() {
    local MIGRATION_NAME=$1
    
    if [ -z "$MIGRATION_NAME" ]; then
        log_error "Migration name required"
        exit 1
    fi
    
    log_step "Creating pre-migration backup for: $MIGRATION_NAME"
    
    BACKUP_PATH="$BACKUP_DIR/migrations/${DATE}/pre_${MIGRATION_NAME}_${TIMESTAMP}.dump"
    mkdir -p "$BACKUP_DIR/migrations/${DATE}"
    
    pg_dump \
        -U "$DB_USER" \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -d "$DB_NAME" \
        -F c \
        -b \
        -v \
        -Z 9 \
        -f "$BACKUP_PATH"
    
    # Save metadata
    cat > "$BACKUP_DIR/migrations/${DATE}/info_${MIGRATION_NAME}.txt" <<EOF
Migration: $MIGRATION_NAME
Timestamp: $(date)
Database: $DB_NAME@$DB_HOST:$DB_PORT
Database Size: $(psql -U $DB_USER -h $DB_HOST -p $DB_PORT -d $DB_NAME -t -c "SELECT pg_size_pretty(pg_database_size('$DB_NAME'))")

Table Row Counts:
$(psql -U $DB_USER -h $DB_HOST -p $DB_PORT -d $DB_NAME -t -c "
    SELECT 
        schemaname || '.' || tablename as table_name,
        n_live_tup as rows
    FROM pg_stat_user_tables
    WHERE schemaname = 'public'
    ORDER BY n_live_tup DESC;
")

Index Count: $(psql -U $DB_USER -h $DB_HOST -p $DB_PORT -d $DB_NAME -t -c "SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public'")
EOF
    
    log_info "✅ Pre-migration backup completed: $BACKUP_PATH"
    log_info "Metadata: $BACKUP_DIR/migrations/${DATE}/info_${MIGRATION_NAME}.txt"
}

# Function: Verify Backup
verify_backup() {
    local BACKUP_FILE=$1
    
    log_step "Verifying backup: $(basename $BACKUP_FILE)"
    
    if [ ! -f "$BACKUP_FILE" ]; then
        log_error "Backup file not found: $BACKUP_FILE"
        exit 1
    fi
    
    # Check file size
    FILE_SIZE=$(stat -f%z "$BACKUP_FILE" 2>/dev/null || stat -c%s "$BACKUP_FILE" 2>/dev/null)
    if [ "$FILE_SIZE" -lt 1024 ]; then
        log_error "Backup file too small (< 1KB), likely corrupted"
        exit 1
    fi
    
    # List backup contents
    pg_restore --list "$BACKUP_FILE" > /dev/null 2>&1
    
    if [ $? -eq 0 ]; then
        log_info "✅ Backup verification successful"
        
        # Count objects in backup
        OBJECT_COUNT=$(pg_restore --list "$BACKUP_FILE" | grep -c "TABLE DATA" || echo "0")
        log_info "Tables in backup: $OBJECT_COUNT"
    else
        log_error "❌ Backup verification failed!"
        exit 1
    fi
}

# Function: Cleanup Old Backups
cleanup_old_backups() {
    local RETENTION_DAYS=${1:-30}
    
    log_step "Cleaning up backups older than $RETENTION_DAYS days..."
    
    DELETED_COUNT=$(find "$BACKUP_DIR/daily" -name "*.dump" -mtime +$RETENTION_DAYS -delete -print | wc -l)
    
    log_info "✅ Deleted $DELETED_COUNT old backups"
}

# Function: Restore Backup
restore_backup() {
    local BACKUP_FILE=$1
    
    if [ -z "$BACKUP_FILE" ]; then
        log_error "Backup file required"
        exit 1
    fi
    
    if [ ! -f "$BACKUP_FILE" ]; then
        log_error "Backup file not found: $BACKUP_FILE"
        exit 1
    fi
    
    log_warn "⚠️  WARNING: This will REPLACE the current database!"
    log_warn "Database: $DB_NAME@$DB_HOST:$DB_PORT"
    log_warn "Backup: $BACKUP_FILE"
    echo ""
    read -p "Are you sure you want to continue? (type 'yes' to confirm): " CONFIRM
    
    if [ "$CONFIRM" != "yes" ]; then
        log_info "Restore cancelled"
        exit 0
    fi
    
    log_step "Restoring database from backup..."
    
    # Create safety backup before restore
    log_info "Creating safety backup of current state..."
    SAFETY_BACKUP="$BACKUP_DIR/safety/pre_restore_${DATE}_${TIMESTAMP}.dump"
    mkdir -p "$BACKUP_DIR/safety"
    
    pg_dump \
        -U "$DB_USER" \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -d "$DB_NAME" \
        -F c \
        -f "$SAFETY_BACKUP"
    
    log_info "Safety backup: $SAFETY_BACKUP"
    
    # Restore from backup
    pg_restore \
        --clean \
        --if-exists \
        --no-owner \
        --no-acl \
        -U "$DB_USER" \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -d "$DB_NAME" \
        -v \
        "$BACKUP_FILE"
    
    if [ $? -eq 0 ]; then
        log_info "✅ Database restored successfully"
        
        # Verify restore
        log_info "Verifying restore..."
        psql -U "$DB_USER" -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" -c "SELECT COUNT(*) FROM users;" > /dev/null
        
        if [ $? -eq 0 ]; then
            log_info "✅ Restore verification successful"
        else
            log_error "❌ Restore verification failed!"
            log_warn "Safety backup available at: $SAFETY_BACKUP"
        fi
    else
        log_error "❌ Restore failed!"
        exit 1
    fi
}

# Function: List Backups
list_backups() {
    log_step "Available Backups:"
    echo ""
    
    echo "Daily Backups:"
    find "$BACKUP_DIR/daily" -name "*.dump" -type f -printf "%T@ %p\n" 2>/dev/null | sort -nr | head -10 | while read timestamp file; do
        SIZE=$(du -h "$file" | cut -f1)
        DATE=$(date -d @${timestamp%.*} "+%Y-%m-%d %H:%M:%S" 2>/dev/null || date -r ${timestamp%.*} "+%Y-%m-%d %H:%M:%S")
        echo "  - $(basename $file) [$SIZE] - $DATE"
    done
    
    echo ""
    echo "Migration Backups:"
    find "$BACKUP_DIR/migrations" -name "*.dump" -type f -printf "%T@ %p\n" 2>/dev/null | sort -nr | head -10 | while read timestamp file; do
        SIZE=$(du -h "$file" | cut -f1)
        DATE=$(date -d @${timestamp%.*} "+%Y-%m-%d %H:%M:%S" 2>/dev/null || date -r ${timestamp%.*} "+%Y-%m-%d %H:%M:%S")
        echo "  - $(basename $file) [$SIZE] - $DATE"
    done
}

# Function: Database Stats
db_stats() {
    log_step "Database Statistics:"
    echo ""
    
    # Database size
    echo "Database Size:"
    psql -U "$DB_USER" -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" -c "
        SELECT pg_size_pretty(pg_database_size('$DB_NAME')) as size;
    "
    
    # Table counts
    echo ""
    echo "Table Row Counts:"
    psql -U "$DB_USER" -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" -c "
        SELECT 
            schemaname || '.' || tablename as table_name,
            n_live_tup as rows,
            pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
        FROM pg_stat_user_tables
        WHERE schemaname = 'public'
        ORDER BY n_live_tup DESC;
    "
    
    # Index count
    echo ""
    echo "Index Count:"
    psql -U "$DB_USER" -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" -c "
        SELECT COUNT(*) as total_indexes 
        FROM pg_indexes 
        WHERE schemaname = 'public';
    "
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
    restore)
        if [ -z "$2" ]; then
            log_error "Backup file required: ./backup.sh restore <backup_file>"
            exit 1
        fi
        restore_backup "$2"
        ;;
    cleanup)
        cleanup_old_backups ${2:-30}
        ;;
    list)
        list_backups
        ;;
    stats)
        db_stats
        ;;
    *)
        echo "Usage: $0 {full|pre-migration|verify|restore|cleanup|list|stats} [options]"
        echo ""
        echo "Commands:"
        echo "  full                    - Create full database backup"
        echo "  pre-migration <name>    - Create pre-migration backup"
        echo "  verify <file>           - Verify backup integrity"
        echo "  restore <file>          - Restore database from backup"
        echo "  cleanup [days]          - Remove backups older than N days (default: 30)"
        echo "  list                    - List available backups"
        echo "  stats                   - Show database statistics"
        echo ""
        echo "Examples:"
        echo "  $0 full"
        echo "  $0 pre-migration add_new_feature"
        echo "  $0 verify backups/daily/dijitalmenu_20260218.dump"
        echo "  $0 restore backups/daily/dijitalmenu_20260218.dump"
        echo "  $0 list"
        exit 1
        ;;
esac

exit 0
