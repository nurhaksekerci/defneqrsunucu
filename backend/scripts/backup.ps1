# Defne Qr Database Backup Script (Windows PowerShell)
# Usage: .\scripts\backup.ps1 -Type [full|pre-migration|verify|restore|list|stats]

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet('full', 'pre-migration', 'verify', 'restore', 'cleanup', 'list', 'stats')]
    [string]$Type,
    
    [Parameter(Mandatory=$false)]
    [string]$Option
)

# Configuration
$DB_USER = if ($env:DB_USER) { $env:DB_USER } else { "postgres" }
$DB_NAME = if ($env:DB_NAME) { $env:DB_NAME } else { "dijitalmenu" }
$DB_HOST = if ($env:DB_HOST) { $env:DB_HOST } else { "localhost" }
$DB_PORT = if ($env:DB_PORT) { $env:DB_PORT } else { "5432" }
$BACKUP_DIR = if ($env:BACKUP_DIR) { $env:BACKUP_DIR } else { ".\backups" }
$DATE = Get-Date -Format "yyyyMMdd"
$TIMESTAMP = Get-Date -Format "HHmmss"

function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Green
}

function Write-Warn {
    param([string]$Message)
    Write-Host "[WARN] $Message" -ForegroundColor Yellow
}

function Write-Error-Custom {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

function Write-Step {
    param([string]$Message)
    Write-Host "[STEP] $Message" -ForegroundColor Blue
}

function Full-Backup {
    Write-Step "Starting full database backup..."
    
    $BackupPath = "$BACKUP_DIR\daily\dijitalmenu_${DATE}_${TIMESTAMP}.dump"
    New-Item -Path "$BACKUP_DIR\daily" -ItemType Directory -Force | Out-Null
    
    Write-Info "Database: $DB_NAME@${DB_HOST}:${DB_PORT}"
    Write-Info "Output: $BackupPath"
    
    # Set PostgreSQL password (if needed)
    if ($env:PGPASSWORD) {
        $env:PGPASSWORD = $env:PGPASSWORD
    }
    
    # Run pg_dump
    & pg_dump `
        -U $DB_USER `
        -h $DB_HOST `
        -p $DB_PORT `
        -d $DB_NAME `
        -F c `
        -b `
        -v `
        -Z 9 `
        -f $BackupPath
    
    if ($LASTEXITCODE -eq 0) {
        $Size = (Get-Item $BackupPath).Length / 1MB
        Write-Info "✅ Backup completed: $BackupPath"
        Write-Info "Size: $([math]::Round($Size, 2)) MB"
        
        Verify-Backup -BackupFile $BackupPath
    } else {
        Write-Error-Custom "❌ Backup failed!"
        exit 1
    }
}

function Pre-Migration-Backup {
    param([string]$MigrationName)
    
    if (-not $MigrationName) {
        Write-Error-Custom "Migration name required"
        exit 1
    }
    
    Write-Step "Creating pre-migration backup for: $MigrationName"
    
    $BackupPath = "$BACKUP_DIR\migrations\$DATE\pre_${MigrationName}_${TIMESTAMP}.dump"
    New-Item -Path "$BACKUP_DIR\migrations\$DATE" -ItemType Directory -Force | Out-Null
    
    & pg_dump `
        -U $DB_USER `
        -h $DB_HOST `
        -p $DB_PORT `
        -d $DB_NAME `
        -F c `
        -b `
        -v `
        -Z 9 `
        -f $BackupPath
    
    # Save metadata
    $MetadataPath = "$BACKUP_DIR\migrations\$DATE\info_${MigrationName}.txt"
    $DbSize = & psql -U $DB_USER -h $DB_HOST -p $DB_PORT -d $DB_NAME -t -c "SELECT pg_size_pretty(pg_database_size('$DB_NAME'))"
    
    @"
Migration: $MigrationName
Timestamp: $(Get-Date)
Database: $DB_NAME@${DB_HOST}:${DB_PORT}
Database Size: $DbSize
"@ | Out-File -FilePath $MetadataPath -Encoding UTF8
    
    Write-Info "✅ Pre-migration backup completed: $BackupPath"
    Write-Info "Metadata: $MetadataPath"
}

function Verify-Backup {
    param([string]$BackupFile)
    
    Write-Step "Verifying backup: $(Split-Path -Leaf $BackupFile)"
    
    if (-not (Test-Path $BackupFile)) {
        Write-Error-Custom "Backup file not found: $BackupFile"
        exit 1
    }
    
    # Check file size
    $FileSize = (Get-Item $BackupFile).Length
    if ($FileSize -lt 1024) {
        Write-Error-Custom "Backup file too small (< 1KB), likely corrupted"
        exit 1
    }
    
    # Verify backup contents
    & pg_restore --list $BackupFile > $null 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Info "✅ Backup verification successful"
    } else {
        Write-Error-Custom "❌ Backup verification failed!"
        exit 1
    }
}

function Restore-Backup {
    param([string]$BackupFile)
    
    if (-not $BackupFile) {
        Write-Error-Custom "Backup file required"
        exit 1
    }
    
    if (-not (Test-Path $BackupFile)) {
        Write-Error-Custom "Backup file not found: $BackupFile"
        exit 1
    }
    
    Write-Warn "⚠️  WARNING: This will REPLACE the current database!"
    Write-Warn "Database: $DB_NAME@${DB_HOST}:${DB_PORT}"
    Write-Warn "Backup: $BackupFile"
    Write-Host ""
    $Confirm = Read-Host "Are you sure you want to continue? (type 'yes' to confirm)"
    
    if ($Confirm -ne "yes") {
        Write-Info "Restore cancelled"
        exit 0
    }
    
    Write-Step "Restoring database from backup..."
    
    # Create safety backup
    Write-Info "Creating safety backup of current state..."
    $SafetyBackup = "$BACKUP_DIR\safety\pre_restore_${DATE}_${TIMESTAMP}.dump"
    New-Item -Path "$BACKUP_DIR\safety" -ItemType Directory -Force | Out-Null
    
    & pg_dump `
        -U $DB_USER `
        -h $DB_HOST `
        -p $DB_PORT `
        -d $DB_NAME `
        -F c `
        -f $SafetyBackup
    
    Write-Info "Safety backup: $SafetyBackup"
    
    # Restore
    & pg_restore `
        --clean `
        --if-exists `
        --no-owner `
        --no-acl `
        -U $DB_USER `
        -h $DB_HOST `
        -p $DB_PORT `
        -d $DB_NAME `
        -v `
        $BackupFile
    
    if ($LASTEXITCODE -eq 0) {
        Write-Info "✅ Database restored successfully"
    } else {
        Write-Error-Custom "❌ Restore failed!"
        exit 1
    }
}

function Cleanup-Old-Backups {
    param([int]$RetentionDays = 30)
    
    Write-Step "Cleaning up backups older than $RetentionDays days..."
    
    $CutoffDate = (Get-Date).AddDays(-$RetentionDays)
    $DeletedCount = 0
    
    Get-ChildItem -Path "$BACKUP_DIR\daily" -Filter "*.dump" -File | Where-Object {
        $_.LastWriteTime -lt $CutoffDate
    } | ForEach-Object {
        Remove-Item $_.FullName -Force
        $DeletedCount++
    }
    
    Write-Info "✅ Deleted $DeletedCount old backups"
}

function List-Backups {
    Write-Step "Available Backups:"
    Write-Host ""
    
    Write-Host "Daily Backups:" -ForegroundColor Cyan
    Get-ChildItem -Path "$BACKUP_DIR\daily" -Filter "*.dump" -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending | Select-Object -First 10 | ForEach-Object {
        $Size = [math]::Round($_.Length / 1MB, 2)
        Write-Host "  - $($_.Name) [$Size MB] - $($_.LastWriteTime)"
    }
    
    Write-Host ""
    Write-Host "Migration Backups:" -ForegroundColor Cyan
    Get-ChildItem -Path "$BACKUP_DIR\migrations" -Filter "*.dump" -Recurse -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending | Select-Object -First 10 | ForEach-Object {
        $Size = [math]::Round($_.Length / 1MB, 2)
        Write-Host "  - $($_.Name) [$Size MB] - $($_.LastWriteTime)"
    }
}

function Database-Stats {
    Write-Step "Database Statistics:"
    Write-Host ""
    
    # Database size
    Write-Host "Database Size:" -ForegroundColor Cyan
    & psql -U $DB_USER -h $DB_HOST -p $DB_PORT -d $DB_NAME -c "SELECT pg_size_pretty(pg_database_size('$DB_NAME')) as size;"
    
    # Table counts
    Write-Host ""
    Write-Host "Table Row Counts:" -ForegroundColor Cyan
    & psql -U $DB_USER -h $DB_HOST -p $DB_PORT -d $DB_NAME -c @"
        SELECT 
            schemaname || '.' || tablename as table_name,
            n_live_tup as rows,
            pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
        FROM pg_stat_user_tables
        WHERE schemaname = 'public'
        ORDER BY n_live_tup DESC;
"@
    
    # Index count
    Write-Host ""
    Write-Host "Index Count:" -ForegroundColor Cyan
    & psql -U $DB_USER -h $DB_HOST -p $DB_PORT -d $DB_NAME -c "SELECT COUNT(*) as total_indexes FROM pg_indexes WHERE schemaname = 'public';"
}

# Execute command
switch ($Type) {
    'full' {
        Full-Backup
        Cleanup-Old-Backups -RetentionDays 30
    }
    'pre-migration' {
        if (-not $Option) {
            Write-Error-Custom "Migration name required: .\backup.ps1 -Type pre-migration -Option <migration_name>"
            exit 1
        }
        Pre-Migration-Backup -MigrationName $Option
    }
    'verify' {
        if (-not $Option) {
            Write-Error-Custom "Backup file required: .\backup.ps1 -Type verify -Option <backup_file>"
            exit 1
        }
        Verify-Backup -BackupFile $Option
    }
    'restore' {
        if (-not $Option) {
            Write-Error-Custom "Backup file required: .\backup.ps1 -Type restore -Option <backup_file>"
            exit 1
        }
        Restore-Backup -BackupFile $Option
    }
    'cleanup' {
        $Days = if ($Option) { [int]$Option } else { 30 }
        Cleanup-Old-Backups -RetentionDays $Days
    }
    'list' {
        List-Backups
    }
    'stats' {
        Database-Stats
    }
}

exit 0
