/**
 * Premium abonelikleri olan hesaplara IYIKIDOGDUNDEFNE promosyon kodu kullanımı ekler.
 * Sadece henüz promosyon kodu kullanımı olmayan abonelikler işlenir.
 *
 * Docker ile çalıştırma:
 *   docker compose exec backend node scripts/add-promo-to-premium.js
 *
 * Veya yerel:
 *   node scripts/add-promo-to-premium.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const PROMO_CODE = 'IYIKIDOGDUNDEFNE';

async function main() {
  console.log('🎂 IYIKIDOGDUNDEFNE promosyon kodu - Premium hesaplara ekleniyor...\n');

  // 1. Promosyon kodunu bul veya oluştur
  let promoCode = await prisma.promoCode.findUnique({
    where: { code: PROMO_CODE }
  });

  if (!promoCode) {
    console.log(`📌 "${PROMO_CODE}" kodu bulunamadı, oluşturuluyor...`);
    promoCode = await prisma.promoCode.create({
      data: {
        code: PROMO_CODE,
        type: 'PERCENTAGE',
        discountValue: 20,
        maxUses: null,
        validFrom: new Date('2024-01-01'),
        validUntil: null,
        isActive: true,
        description: 'Doğum günü promosyonu - mevcut premium hesaplara retroaktif ekleme'
      }
    });
    console.log(`✅ Promosyon kodu oluşturuldu: ${promoCode.id}\n`);
  } else {
    console.log(`✅ Promosyon kodu bulundu: ${promoCode.id}\n`);
  }

  // 2. Premium planları bul
  const premiumPlans = await prisma.plan.findMany({
    where: { type: 'PREMIUM', isActive: true },
    select: { id: true, name: true, price: true }
  });

  if (premiumPlans.length === 0) {
    console.log('⚠️  Premium plan bulunamadı.');
    return;
  }

  const premiumPlanIds = premiumPlans.map((p) => p.id);
  console.log(`📋 Premium planlar: ${premiumPlans.map((p) => p.name).join(', ')}\n`);

  // 3. Zaten promosyon kullanımı olan abonelik ID'leri
  const subsWithPromo = await prisma.promoCodeUsage.findMany({
    where: { subscriptionId: { not: null } },
    select: { subscriptionId: true }
  });
  const excludedIds = [...new Set(subsWithPromo.map((u) => u.subscriptionId).filter(Boolean))];

  // 4. Aktif premium abonelikleri al (promosyon kullanımı olmayanlar)
  const subscriptions = await prisma.subscription.findMany({
    where: {
      planId: { in: premiumPlanIds },
      status: 'ACTIVE',
      ...(excludedIds.length > 0 ? { id: { notIn: excludedIds } } : {})
    },
    include: {
      plan: true,
      user: { select: { id: true, fullName: true, email: true } }
    },
    orderBy: { createdAt: 'desc' }
  });

  console.log(`📊 İşlenecek abonelik sayısı: ${subscriptions.length}\n`);

  if (subscriptions.length === 0) {
    console.log('✅ Zaten tüm premium aboneliklerde promosyon kodu kaydı mevcut veya işlenecek abonelik yok.');
    return;
  }

  let created = 0;
  let errors = 0;

  for (const sub of subscriptions) {
    try {
      const originalAmount = sub.plan.price;
      const finalAmount = sub.amount;
      const discountAmount = Math.max(0, originalAmount - finalAmount);

      await prisma.$transaction([
        prisma.promoCodeUsage.create({
          data: {
            promoCodeId: promoCode.id,
            userId: sub.userId,
            subscriptionId: sub.id,
            discountAmount,
            originalAmount,
            finalAmount
          }
        }),
        prisma.promoCode.update({
          where: { id: promoCode.id },
          data: { usedCount: { increment: 1 } }
        })
      ]);

      console.log(`✅ ${sub.user.fullName} (${sub.user.email}) - ${sub.plan.name}`);
      created++;
    } catch (err) {
      console.error(`❌ ${sub.user.fullName}: ${err.message}`);
      errors++;
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`✅ Oluşturulan kayıt: ${created}`);
  if (errors > 0) console.log(`❌ Hata: ${errors}`);
  console.log('='.repeat(50));
}

main()
  .then(() => {
    console.log('\n🎉 İşlem tamamlandı.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n💥 Hata:', err);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
