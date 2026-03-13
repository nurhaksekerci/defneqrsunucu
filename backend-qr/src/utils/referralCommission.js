/**
 * Abonelik oluşturulduğunda referral ödülü/komisyon işle
 * - FREE plan + requireApproval: pendingDaysApproval = true (admin onayı)
 * - FREE plan + !requireApproval: otomatik gün ekle
 * - PAID plan: otomatik gün ekle (RESTAURANT_OWNER affiliate)
 * - PAID plan: komisyon oluştur (diğer affiliate tipleri - şu an sadece RESTAURANT_OWNER var)
 */
const prisma = require('../config/database');
const { extendSubscriptionForReferral } = require('./referralHelper');

async function processReferralOnSubscription(referredUserId, subscriptionId, subscriptionAmount, planType) {
  try {
    const settings = await prisma.affiliateSettings.findFirst();
    if (!settings || !settings.isEnabled) return null;

    const referral = await prisma.referral.findFirst({
      where: { referredUserId },
      include: { affiliate: true }
    });

    if (!referral || referral.affiliate.status !== 'ACTIVE') return null;

    const isPaidPlan = planType && !['FREE'].includes(planType);
    const daysFree = settings.daysPerReferralFree ?? settings.daysPerReferral ?? 7;
    const daysPaid = settings.daysPerReferralPaid ?? settings.daysPerReferral ?? 14;
    const requireApproval = settings.requireApproval ?? true;

    // Restoran sahibi affiliate: gün kazanır (para komisyonu yok)
    if (isPaidPlan) {
      await extendSubscriptionForReferral(referredUserId, referral.affiliateId, daysPaid);
      await prisma.referral.update({
        where: { id: referral.id },
        data: {
          hasSubscribed: true,
          firstSubscription: new Date(),
          pendingDaysApproval: false,
          daysAwarded: daysPaid
        }
      });
      return { type: 'subscription_extension', daysAdded: daysPaid, autoApproved: true };
    }

    // FREE plan
    if (requireApproval) {
      await prisma.referral.update({
        where: { id: referral.id },
        data: {
          hasSubscribed: true,
          firstSubscription: new Date(),
          pendingDaysApproval: true,
          daysAwarded: null
        }
      });
      return { type: 'pending_approval', daysToAward: daysFree };
    }

    // requireApproval false: otomatik gün ekle
    await extendSubscriptionForReferral(referredUserId, referral.affiliateId, daysFree);
    await prisma.referral.update({
      where: { id: referral.id },
      data: {
        hasSubscribed: true,
        firstSubscription: new Date(),
        pendingDaysApproval: false,
        daysAwarded: daysFree
      }
    });
    return { type: 'subscription_extension', daysAdded: daysFree, autoApproved: true };
  } catch (err) {
    console.error('❌ processReferralOnSubscription error:', err?.message || err);
    return null;
  }
}

module.exports = { processReferralOnSubscription };
