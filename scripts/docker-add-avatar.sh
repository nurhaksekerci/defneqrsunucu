#!/bin/bash
#
# Avatar sütununu Docker ortamında ekler.
# Proje kök dizininden çalıştırın: ./scripts/docker-add-avatar.sh
#
# Önce prisma migrate deploy denenir, başarısız olursa add-user-avatar-column.js çalıştırılır.
#

set -e

cd "$(dirname "$0")/.."

echo "🔄 Avatar sütunu ekleniyor..."

# Docker Compose ile backend container'da script çalıştır
if docker compose exec -T backend node scripts/add-user-avatar-column.js 2>/dev/null; then
  echo "✅ Avatar sütunu başarıyla eklendi."
else
  echo "❌ Hata: Backend container çalışıyor mu? 'docker compose ps' ile kontrol edin."
  echo "   Manuel çalıştırma: docker compose exec backend node scripts/add-user-avatar-column.js"
  exit 1
fi
