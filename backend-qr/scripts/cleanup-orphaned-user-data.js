/**
 * Yetim (orphan) kayıtları temizler: backend-common'da silinmiş kullanıcılara ait
 * backend-qr verilerini (affiliate, restoran, abonelik vb.) siler.
 *
 * Çalıştırma:
 *   cd backend-qr && node scripts/cleanup-orphaned-user-data.js
 *   # veya Docker ile:
 *   docker compose exec backend-qr node scripts/cleanup-orphaned-user-data.js
 *
 * --dry-run: Sadece listele, silme yapma
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const prisma = require('../src/config/database');
const { cascadeDeleteUser } = require('../src/services/userCascadeDelete');

const isDryRun = process.argv.includes('--dry-run');

async function getExistingUserIds(userIds) {
  if (userIds.length === 0) return new Set();
  const commonUrl = process.env.BACKEND_COMMON_URL || 'http://backend-common:5001';
  const secret = process.env.BACKEND_INTERNAL_SECRET;
  const url = `${commonUrl}/api/internal/service/users-by-ids?ids=${userIds.join(',')}`;
  try {
    const res = await fetch(url, {
      headers: secret ? { 'X-Internal-Secret': secret } : {}
    });
    if (!res.ok) {
      console.warn('backend-common users-by-ids failed:', res.status);
      return new Set(userIds);
    }
    const json = await res.json();
    const data = json.data || {};
    return new Set(Object.keys(data));
  } catch (err) {
    console.warn('backend-common fetch error:', err?.message);
    return new Set(userIds);
  }
}

async function main() {
  console.log('🔍 Yetim kullanıcı verileri taranıyor...');
  if (isDryRun) console.log('   (--dry-run: Sadece listeleme, silme yapılmayacak)\n');

  try {
    const [affiliates, restaurants, subscriptions] = await Promise.all([
      prisma.affiliatePartner.findMany({ select: { userId: true } }),
      prisma.restaurant.findMany({ select: { ownerId: true } }),
      prisma.subscription.findMany({ select: { userId: true } })
    ]);

    const allUserIds = new Set();
    affiliates.forEach((a) => allUserIds.add(a.userId));
    restaurants.forEach((r) => allUserIds.add(r.ownerId));
    subscriptions.forEach((s) => allUserIds.add(s.userId));

    const userIds = [...allUserIds];
    if (userIds.length === 0) {
      console.log('✓ backend-qr\'da userId referansı bulunamadı.');
      return;
    }

    const existingIds = await getExistingUserIds(userIds);
    const orphanedIds = userIds.filter((id) => !existingIds.has(id));

    if (orphanedIds.length === 0) {
      console.log('✓ Yetim kayıt yok. Tüm userId\'ler backend-common\'da mevcut.');
      return;
    }

    console.log(`\n⚠️  ${orphanedIds.length} yetim userId tespit edildi:`);
    orphanedIds.forEach((id) => console.log(`   - ${id}`));

    if (isDryRun) {
      console.log('\n--dry-run: Silme yapılmadı. Gerçek silme için script\'i --dry-run olmadan çalıştırın.');
      return;
    }

    let deleted = 0;
    for (const userId of orphanedIds) {
      try {
        const result = await cascadeDeleteUser(userId);
        const total =
          (result.affiliatePartner || 0) +
          (result.referrals || 0) +
          (result.restaurants || 0) +
          (result.subscriptions || 0);
        if (total > 0) {
          console.log(
            `   ✓ ${userId}: affiliate=${result.affiliatePartner || 0}, referrals=${result.referrals || 0}, restaurants=${result.restaurants || 0}, subscriptions=${result.subscriptions || 0}`
          );
          deleted++;
        }
      } catch (err) {
        console.error(`   ✗ ${userId}: ${err.message}`);
      }
    }

    console.log(`\n✅ ${deleted} yetim kullanıcı verisi temizlendi.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error('Hata:', e);
  process.exit(1);
});
