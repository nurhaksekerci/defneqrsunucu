# Docker ortamında Prisma migration işlemleri
# Kullanım: .\scripts\docker-migrate.ps1 [deploy|status|seed|backup|avatar]

param(
    [Parameter(Position=0)]
    [ValidateSet("deploy", "deploy-standalone", "status", "seed", "backup", "avatar", "defnerandevu")]
    [string]$Command = "deploy"
)

switch ($Command) {
    "deploy" {
        Write-Host "🔄 Migration'lar uygulanıyor..." -ForegroundColor Cyan
        docker compose exec backend npx prisma migrate deploy
        Write-Host "✅ Migration tamamlandı" -ForegroundColor Green
    }
    "deploy-standalone" {
        Write-Host "🔄 Migration'lar uygulanıyor (one-off container)..." -ForegroundColor Cyan
        docker compose run --rm backend npx prisma migrate deploy
        Write-Host "✅ Migration tamamlandı" -ForegroundColor Green
    }
    "status" {
        Write-Host "📊 Migration durumu:" -ForegroundColor Cyan
        docker compose exec backend npx prisma migrate status
    }
    "seed" {
        Write-Host "🌱 Seed çalıştırılıyor..." -ForegroundColor Cyan
        docker compose exec backend npx prisma db seed
        Write-Host "✅ Seed tamamlandı" -ForegroundColor Green
    }
    "backup" {
        $date = Get-Date -Format "yyyyMMdd_HHmmss"
        $backupFile = "backup_pre_migrate_$date.sql"
        Write-Host "💾 Yedek alınıyor: $backupFile" -ForegroundColor Cyan
        docker compose exec -T postgres pg_dump -U defneqr defneqr | Set-Content -Path $backupFile -Encoding UTF8
        Write-Host "✅ Yedek alındı: $backupFile" -ForegroundColor Green
    }
    "avatar" {
        Write-Host "🔄 Avatar sütunu ekleniyor..." -ForegroundColor Cyan
        docker compose exec backend node scripts/add-user-avatar-column.js
        Write-Host "✅ Avatar sütunu eklendi" -ForegroundColor Green
    }
    "defnerandevu" {
        Write-Host "🔄 DefneRandevu şema değişiklikleri uygulanıyor..." -ForegroundColor Cyan
        docker compose exec backend node scripts/add-defnerandevu-schema.js
        Write-Host "✅ DefneRandevu şema tamamlandı" -ForegroundColor Green
    }
}
