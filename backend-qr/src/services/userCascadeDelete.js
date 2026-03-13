/**
 * Kullanıcı silindiğinde backend-qr'daki tüm ilişkili kayıtları siler.
 * backend-common hardDeleteUser tarafından çağrılır.
 */
const prisma = require('../config/database');

async function cascadeDeleteUser(userId) {
  const results = {
    affiliatePartner: 0,
    referrals: 0,
    affiliateCommissions: 0,
    affiliatePayouts: 0,
    restaurants: 0,
    subscriptions: 0,
    promoCodeUsages: 0,
    wheelSpins: 0
  };

  await prisma.$transaction(async (tx) => {
    // 1. Affiliate: Önce referral, commission, payout; sonra affiliate
    const affiliate = await tx.affiliatePartner.findUnique({
      where: { userId },
      select: { id: true }
    });
    if (affiliate) {
      await tx.affiliateCommission.deleteMany({ where: { affiliateId: affiliate.id } });
      await tx.affiliatePayout.deleteMany({ where: { affiliateId: affiliate.id } });
      await tx.referral.deleteMany({ where: { affiliateId: affiliate.id } });
      await tx.affiliatePartner.delete({ where: { id: affiliate.id } });
      results.affiliatePartner = 1;
    }

    // 2. Referral (bu kullanıcı davet edilen olarak)
    const delReferrals = await tx.referral.deleteMany({ where: { referredUserId: userId } });
    results.referrals += delReferrals.count;

    // 3. Restoranlar ve ilişkili tüm veriler
    const restaurants = await tx.restaurant.findMany({
      where: { ownerId: userId },
      select: { id: true }
    });
    const restaurantIds = restaurants.map((r) => r.id);

    if (restaurantIds.length > 0) {
      const orders = await tx.order.findMany({
        where: { restaurantId: { in: restaurantIds } },
        select: { id: true }
      });
      const orderIds = orders.map((o) => o.id);

      if (orderIds.length > 0) {
        await tx.orderItem.deleteMany({ where: { orderId: { in: orderIds } } });
        await tx.payment.deleteMany({ where: { orderId: { in: orderIds } } });
      }
      await tx.order.deleteMany({ where: { restaurantId: { in: restaurantIds } } });
      await tx.stock.deleteMany({ where: { restaurantId: { in: restaurantIds } } });

      const categories = await tx.category.findMany({
        where: { restaurantId: { in: restaurantIds } },
        select: { id: true }
      });
      const categoryIds = categories.map((c) => c.id);
      if (categoryIds.length > 0) {
        await tx.product.deleteMany({ where: { categoryId: { in: categoryIds } } });
      }
      await tx.category.deleteMany({ where: { restaurantId: { in: restaurantIds } } });
      await tx.table.deleteMany({ where: { restaurantId: { in: restaurantIds } } });
      await tx.menuScan.deleteMany({ where: { restaurantId: { in: restaurantIds } } });
      await tx.restaurant.deleteMany({ where: { ownerId: userId } });
      results.restaurants = restaurantIds.length;
    }

    // 4. Abonelikler ve PromoCodeUsage
    const delPromo = await tx.promoCodeUsage.deleteMany({ where: { userId } });
    results.promoCodeUsages = delPromo.count;
    const delSubs = await tx.subscription.deleteMany({ where: { userId } });
    results.subscriptions = delSubs.count;

    // 5. WheelSpin
    const delWheel = await tx.wheelSpin.deleteMany({ where: { userId } });
    results.wheelSpins = delWheel.count;
  });

  return results;
}

module.exports = { cascadeDeleteUser };
