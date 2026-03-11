#!/bin/bash
# Migration script - GitHub'a migration'lar commit edilmemiş olabilir
# Bu script: 1) Migration'ları kontrol eder 2) Uygular
#
# Kullanım:
#   ./scripts/run-migrations.sh              # Docker ile (compose)
#   ./scripts/run-migrations.sh local        # DATABASE_URL ile lokal
#   ./scripts/run-migrations.sh standalone  # One-off container (backend kapalıyken)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_DIR"

MODE=${1:-docker}

echo "📋 Migration modu: $MODE"
echo ""

# Migration dosyalarının varlığını kontrol et
MIGRATIONS_DIR="backend/prisma/migrations"
if [ ! -d "$MIGRATIONS_DIR" ]; then
  echo "❌ Hata: $MIGRATIONS_DIR bulunamadı"
  exit 1
fi

MIGRATION_COUNT=$(find "$MIGRATIONS_DIR" -name "migration.sql" 2>/dev/null | wc -l)
echo "📁 Toplam $MIGRATION_COUNT migration dosyası bulundu"
echo ""

case "$MODE" in
  docker)
    echo "🔄 Docker Compose ile migration uygulanıyor..."
    if docker compose ps backend 2>/dev/null | grep -q "Up"; then
      docker compose exec backend npx prisma migrate deploy
    else
      echo "⚠️  Backend container çalışmıyor. 'standalone' modunu deneyin:"
      echo "   ./scripts/run-migrations.sh standalone"
      exit 1
    fi
    ;;
  standalone)
    echo "🔄 One-off container ile migration uygulanıyor..."
    docker compose run --rm backend npx prisma migrate deploy
    ;;
  local)
    if [ -z "$DATABASE_URL" ]; then
      echo "❌ DATABASE_URL tanımlı değil. .env dosyasını kontrol edin."
      exit 1
    fi
    echo "🔄 Lokal ortamda migration uygulanıyor..."
    cd backend
    npx prisma migrate deploy
    cd ..
    ;;
  *)
    echo "Kullanım: $0 [docker|standalone|local]"
    echo ""
    echo "  docker     - Backend container üzerinden (varsayılan)"
    echo "  standalone - One-off container (backend kapalıyken)"
    echo "  local      - DATABASE_URL ile lokal (Docker yok)"
    exit 1
    ;;
esac

echo ""
echo "✅ Migration tamamlandı"
