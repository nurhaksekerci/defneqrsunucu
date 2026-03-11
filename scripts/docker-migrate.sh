#!/bin/bash
# Docker ortamında Prisma migration işlemleri
# Kullanım: ./scripts/docker-migrate.sh [deploy|deploy-standalone|status|seed|backup|avatar]
#
# deploy          - Backend çalışıyorsa exec ile migration uygula
# deploy-standalone - Backend çalışmasa bile one-off container ile migration uygula

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_DIR"

# .env'den DB bilgilerini yükle (backup için)
[ -f .env ] && set -a && source .env && set +a

CMD=${1:-deploy}

case "$CMD" in
  deploy)
    echo "🔄 Migration'lar uygulanıyor (backend üzerinden)..."
    docker compose exec backend npx prisma migrate deploy
    echo "✅ Migration tamamlandı"
    ;;
  deploy-standalone)
    echo "🔄 Migration'lar uygulanıyor (one-off container)..."
    docker compose run --rm backend npx prisma migrate deploy
    echo "✅ Migration tamamlandı"
    ;;
  status)
    echo "📊 Migration durumu:"
    docker compose exec backend npx prisma migrate status
    ;;
  seed)
    echo "🌱 Seed çalıştırılıyor..."
    docker compose exec backend npx prisma db seed
    echo "✅ Seed tamamlandı"
    ;;
  backup)
    BACKUP_FILE="backup_pre_migrate_$(date +%Y%m%d_%H%M%S).sql"
    echo "💾 Yedek alınıyor: $BACKUP_FILE"
    docker compose exec -T postgres pg_dump -U "${DB_USER:-defneqr}" "${DB_NAME:-defneqr}" > "$BACKUP_FILE"
    echo "✅ Yedek alındı: $BACKUP_FILE"
    ;;
  avatar)
    echo "🔄 Avatar sütunu ekleniyor..."
    docker compose exec backend node scripts/add-user-avatar-column.js
    echo "✅ Avatar sütunu eklendi"
    ;;
  defnerandevu)
    echo "🔄 DefneRandevu şema değişiklikleri uygulanıyor..."
    docker compose exec backend node scripts/add-defnerandevu-schema.js
    echo "✅ DefneRandevu şema tamamlandı"
    ;;
  *)
    echo "Kullanım: $0 [deploy|deploy-standalone|status|seed|backup|avatar|defnerandevu]"
    echo ""
    echo "  deploy           - Migration'ları uygula (backend çalışıyor olmalı)"
    echo "  deploy-standalone - Migration'ları one-off container ile uygula (backend kapalıyken)"
    echo "  status           - Migration durumunu göster"
    echo "  seed             - Veritabanı seed çalıştır"
    echo "  backup           - Migration öncesi yedek al"
    echo "  avatar           - Users tablosuna avatar sütunu ekle (eski migration)"
    echo "  defnerandevu     - DefneRandevu şema değişiklikleri (Project, tablolar)"
    exit 1
    ;;
esac
