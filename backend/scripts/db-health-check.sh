#!/bin/bash

# Database Health Check Script
# Monitors database performance, size, and potential issues

set -e

# Configuration
DB_USER="${DB_USER:-postgres}"
DB_NAME="${DB_NAME:-dijitalmenu}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   Database Health Check - Defne Qr${NC}"
echo -e "${BLUE}========================================${NC}"
echo "Date: $(date)"
echo "Database: $DB_NAME@$DB_HOST:$DB_PORT"
echo ""

# 1. Database Size
echo -e "${GREEN}1. Database Size${NC}"
echo "----------------------------------------"
psql -U $DB_USER -h $DB_HOST -p $DB_PORT -d $DB_NAME -c "
    SELECT 
        pg_size_pretty(pg_database_size('$DB_NAME')) as total_size,
        (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public') as table_count;
"
echo ""

# 2. Top 10 Largest Tables
echo -e "${GREEN}2. Largest Tables (Top 10)${NC}"
echo "----------------------------------------"
psql -U $DB_USER -h $DB_HOST -p $DB_PORT -d $DB_NAME -c "
    SELECT 
        schemaname || '.' || tablename as table_name,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
        pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) as indexes_size,
        n_live_tup as row_count
    FROM pg_tables
    LEFT JOIN pg_stat_user_tables ON pg_tables.tablename = pg_stat_user_tables.tablename
    WHERE schemaname = 'public'
    ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
    LIMIT 10;
"
echo ""

# 3. Index Usage Statistics
echo -e "${GREEN}3. Index Usage (Top 10 Most Used)${NC}"
echo "----------------------------------------"
psql -U $DB_USER -h $DB_HOST -p $DB_PORT -d $DB_NAME -c "
    SELECT 
        schemaname || '.' || tablename as table_name,
        indexname,
        idx_scan as scans,
        idx_tup_read as tuples_read,
        pg_size_pretty(pg_relation_size(indexrelid)) as size
    FROM pg_stat_user_indexes
    WHERE schemaname = 'public'
    ORDER BY idx_scan DESC
    LIMIT 10;
"
echo ""

# 4. Unused Indexes
echo -e "${YELLOW}4. Unused Indexes (Consider Dropping)${NC}"
echo "----------------------------------------"
UNUSED=$(psql -U $DB_USER -h $DB_HOST -p $DB_PORT -d $DB_NAME -t -c "
    SELECT COUNT(*) 
    FROM pg_stat_user_indexes
    WHERE schemaname = 'public' 
    AND idx_scan = 0
    AND indexrelname NOT LIKE '%_pkey';
")

if [ "$UNUSED" -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Found $UNUSED unused indexes:${NC}"
    psql -U $DB_USER -h $DB_HOST -p $DB_PORT -d $DB_NAME -c "
        SELECT 
            schemaname || '.' || tablename as table_name,
            indexname,
            pg_size_pretty(pg_relation_size(indexrelid)) as size
        FROM pg_stat_user_indexes
        WHERE schemaname = 'public' 
        AND idx_scan = 0
        AND indexrelname NOT LIKE '%_pkey'
        ORDER BY pg_relation_size(indexrelid) DESC;
    "
else
    echo -e "${GREEN}✅ All indexes are being used${NC}"
fi
echo ""

# 5. Active Connections
echo -e "${GREEN}5. Active Database Connections${NC}"
echo "----------------------------------------"
psql -U $DB_USER -h $DB_HOST -p $DB_PORT -d $DB_NAME -c "
    SELECT 
        datname,
        count(*) as active_connections,
        count(*) FILTER (WHERE state = 'active') as executing,
        count(*) FILTER (WHERE state = 'idle') as idle,
        max(backend_start) as oldest_connection
    FROM pg_stat_activity
    WHERE datname = '$DB_NAME'
    GROUP BY datname;
"
echo ""

# 6. Long Running Queries
echo -e "${YELLOW}6. Long Running Queries (>10s)${NC}"
echo "----------------------------------------"
LONG_QUERIES=$(psql -U $DB_USER -h $DB_HOST -p $DB_PORT -d $DB_NAME -t -c "
    SELECT COUNT(*)
    FROM pg_stat_activity
    WHERE (now() - pg_stat_activity.query_start) > interval '10 seconds'
    AND state != 'idle'
    AND datname = '$DB_NAME';
")

if [ "$LONG_QUERIES" -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Found $LONG_QUERIES long-running queries:${NC}"
    psql -U $DB_USER -h $DB_HOST -p $DB_PORT -d $DB_NAME -c "
        SELECT 
            pid,
            now() - pg_stat_activity.query_start AS duration,
            state,
            LEFT(query, 100) as query_preview
        FROM pg_stat_activity
        WHERE (now() - pg_stat_activity.query_start) > interval '10 seconds'
        AND state != 'idle'
        AND datname = '$DB_NAME'
        ORDER BY duration DESC;
    "
else
    echo -e "${GREEN}✅ No long-running queries detected${NC}"
fi
echo ""

# 7. Dead Tuples (Need VACUUM?)
echo -e "${GREEN}7. Dead Tuples Analysis${NC}"
echo "----------------------------------------"
psql -U $DB_USER -h $DB_HOST -p $DB_PORT -d $DB_NAME -c "
    SELECT 
        schemaname || '.' || tablename as table_name,
        n_live_tup as live_tuples,
        n_dead_tup as dead_tuples,
        CASE 
            WHEN n_live_tup + n_dead_tup > 0 
            THEN round(n_dead_tup::numeric / (n_live_tup + n_dead_tup) * 100, 2)
            ELSE 0
        END as dead_ratio_percent,
        last_autovacuum,
        last_autoanalyze
    FROM pg_stat_user_tables
    WHERE schemaname = 'public'
    AND n_dead_tup > 0
    ORDER BY n_dead_tup DESC
    LIMIT 10;
"

NEED_VACUUM=$(psql -U $DB_USER -h $DB_HOST -p $DB_PORT -d $DB_NAME -t -c "
    SELECT COUNT(*)
    FROM pg_stat_user_tables
    WHERE schemaname = 'public'
    AND n_dead_tup::numeric / NULLIF(n_live_tup + n_dead_tup, 0) > 0.2;
")

if [ "$NEED_VACUUM" -gt 0 ]; then
    echo ""
    echo -e "${YELLOW}⚠️  WARNING: $NEED_VACUUM tables have >20% dead tuples${NC}"
    echo -e "${YELLOW}   Recommendation: Run VACUUM ANALYZE${NC}"
fi
echo ""

# 8. Table Bloat
echo -e "${GREEN}8. Table Bloat Estimation${NC}"
echo "----------------------------------------"
psql -U $DB_USER -h $DB_HOST -p $DB_PORT -d $DB_NAME -c "
    SELECT 
        schemaname || '.' || tablename as table_name,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
        n_dead_tup as dead_tuples,
        last_vacuum,
        last_autovacuum
    FROM pg_stat_user_tables
    LEFT JOIN pg_tables ON pg_stat_user_tables.tablename = pg_tables.tablename
    WHERE schemaname = 'public'
    ORDER BY n_dead_tup DESC
    LIMIT 10;
"
echo ""

# 9. Recent Errors (if available)
echo -e "${GREEN}9. Database Log Analysis${NC}"
echo "----------------------------------------"
LOG_FILE="/var/log/postgresql/postgresql.log"

if [ -f "$LOG_FILE" ]; then
    ERROR_COUNT=$(grep -c "ERROR" "$LOG_FILE" 2>/dev/null | tail -1000 || echo "0")
    WARNING_COUNT=$(grep -c "WARNING" "$LOG_FILE" 2>/dev/null | tail -1000 || echo "0")
    
    echo "Recent log entries (last 1000 lines):"
    echo "  - Errors: $ERROR_COUNT"
    echo "  - Warnings: $WARNING_COUNT"
    
    if [ "$ERROR_COUNT" -gt 0 ]; then
        echo ""
        echo -e "${RED}Recent Errors:${NC}"
        grep "ERROR" "$LOG_FILE" | tail -5
    fi
else
    echo "Log file not found: $LOG_FILE"
fi
echo ""

# 10. Connection Pool Status
echo -e "${GREEN}10. Connection Pool Status${NC}"
echo "----------------------------------------"
psql -U $DB_USER -h $DB_HOST -p $DB_PORT -d $DB_NAME -c "
    SELECT 
        max_conn,
        used,
        res_for_super,
        max_conn - used - res_for_super as available
    FROM 
        (SELECT COUNT(*) used FROM pg_stat_activity) t1,
        (SELECT setting::int res_for_super FROM pg_settings WHERE name = 'superuser_reserved_connections') t2,
        (SELECT setting::int max_conn FROM pg_settings WHERE name = 'max_connections') t3;
"
echo ""

# Summary
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   Health Check Summary${NC}"
echo -e "${BLUE}========================================${NC}"

DB_SIZE=$(psql -U $DB_USER -h $DB_HOST -p $DB_PORT -d $DB_NAME -t -c "SELECT pg_size_pretty(pg_database_size('$DB_NAME'))")
TABLE_COUNT=$(psql -U $DB_USER -h $DB_HOST -p $DB_PORT -d $DB_NAME -t -c "SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public'")
INDEX_COUNT=$(psql -U $DB_USER -h $DB_HOST -p $DB_PORT -d $DB_NAME -t -c "SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public'")
ACTIVE_CONN=$(psql -U $DB_USER -h $DB_HOST -p $DB_PORT -d $DB_NAME -t -c "SELECT COUNT(*) FROM pg_stat_activity WHERE datname = '$DB_NAME'")

echo "Database Size: $DB_SIZE"
echo "Tables: $TABLE_COUNT"
echo "Indexes: $INDEX_COUNT"
echo "Active Connections: $ACTIVE_CONN"

if [ "$NEED_VACUUM" -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Action Required: Run VACUUM ANALYZE on $NEED_VACUUM tables${NC}"
fi

if [ "$UNUSED" -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Optimization Opportunity: $UNUSED unused indexes detected${NC}"
fi

if [ "$LONG_QUERIES" -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Performance Warning: $LONG_QUERIES long-running queries detected${NC}"
fi

echo ""
echo -e "${GREEN}✅ Health check completed${NC}"

exit 0
