#!/bin/bash
# Docker ortamında Prisma migration işlemleri
# Kullanım: ./scripts/docker-migrate.sh [deploy|status|seed|backup|avatar]

set -e

CMD=${1:-deploy}

case "$CMD" in
  deploy)
    echo "🔄 Migration'lar uygulanıyor..."
    docker compose exec backend npx prisma migrate deploy
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
    docker compose exec postgres pg_dump -U defneqr defneqr > "$BACKUP_FILE"
    echo "✅ Yedek alındı: $BACKUP_FILE"
    ;;
  avatar)
    echo "🔄 Avatar sütunu ekleniyor..."
    docker compose exec backend node scripts/add-user-avatar-column.js
    echo "✅ Avatar sütunu eklendi"
    ;;
  *)
    echo "Kullanım: $0 [deploy|status|seed|backup|avatar]"
    echo "  deploy  - Migration'ları uygula (varsayılan)"
    echo "  status  - Migration durumunu göster"
    echo "  seed    - Veritabanı seed çalıştır"
    echo "  backup  - Migration öncesi yedek al"
    echo "  avatar  - Users tablosuna avatar sütunu ekle"
    exit 1
    ;;
esac
