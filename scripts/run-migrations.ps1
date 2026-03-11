# Migration script - GitHub'a migration'lar commit edilmemiş olabilir
# Bu script migration'ları uygular
#
# Kullanım:
#   .\scripts\run-migrations.ps1              # Docker ile (compose)
#   .\scripts\run-migrations.ps1 local        # DATABASE_URL ile lokal
#   .\scripts\run-migrations.ps1 standalone   # One-off container (backend kapalıyken)

param(
    [Parameter(Position=0)]
    [ValidateSet("docker", "standalone", "local")]
    [string]$Mode = "docker"
)

$ErrorActionPreference = "Stop"
$ProjectDir = Split-Path -Parent $PSScriptRoot
Set-Location $ProjectDir

Write-Host "`n📋 Migration modu: $Mode`n" -ForegroundColor Cyan

$MigrationsDir = "backend/prisma/migrations"
if (-not (Test-Path $MigrationsDir)) {
    Write-Host "❌ Hata: $MigrationsDir bulunamadı" -ForegroundColor Red
    exit 1
}

$MigrationCount = (Get-ChildItem -Path $MigrationsDir -Recurse -Filter "migration.sql" -ErrorAction SilentlyContinue | Measure-Object).Count
Write-Host "📁 Toplam $MigrationCount migration dosyası bulundu`n" -ForegroundColor Gray

switch ($Mode) {
    "docker" {
        Write-Host "🔄 Docker Compose ile migration uygulanıyor..." -ForegroundColor Cyan
        $backendRunning = docker compose ps backend 2>$null | Select-String "Up"
        if ($backendRunning) {
            docker compose exec backend npx prisma migrate deploy
        } else {
            Write-Host "⚠️  Backend container çalışmıyor. 'standalone' modunu deneyin:" -ForegroundColor Yellow
            Write-Host "   .\scripts\run-migrations.ps1 standalone" -ForegroundColor Yellow
            exit 1
        }
    }
    "standalone" {
        Write-Host "🔄 One-off container ile migration uygulanıyor..." -ForegroundColor Cyan
        docker compose run --rm backend npx prisma migrate deploy
    }
    "local" {
        if (-not $env:DATABASE_URL) {
            Write-Host "❌ DATABASE_URL tanımlı değil. .env dosyasını kontrol edin." -ForegroundColor Red
            exit 1
        }
        Write-Host "🔄 Lokal ortamda migration uygulanıyor..." -ForegroundColor Cyan
        Push-Location backend
        npx prisma migrate deploy
        Pop-Location
    }
}

Write-Host "`n✅ Migration tamamlandı" -ForegroundColor Green
