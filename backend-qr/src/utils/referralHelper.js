/**
 * Referral yardımcıları - oluşturma, abonelik uzatma
 */
const prisma = require('../config/database');

async function extendSubscriptionForReferral(referredUserId, affiliateId, daysToAdd) {
  try {
    const settings = await prisma.affiliateSettings.findFirst();
    if (!settings || !settings.isEnabled) return null;

    const days = daysToAdd ?? settings.daysPerReferral ?? settings.daysPerReferralPaid ?? 7;
    if (!days || days < 1) return null;

    const affiliate = await prisma.affiliatePartner.findUnique({
      where: { id: affiliateId },
      select: { userId: true }
    });
    if (!affiliate) return null;

    const activeSubscription = await prisma.subscription.findFirst({
      where: {
        userId: affiliate.userId,
        status: 'ACTIVE',
        endDate: { gte: new Date() }
      },
      orderBy: { endDate: 'desc' }
    });

    if (!activeSubscription) return null;

    const newEndDate = new Date(activeSubscription.endDate);
    newEndDate.setDate(newEndDate.getDate() + days);

    return prisma.subscription.update({
      where: { id: activeSubscription.id },
      data: { endDate: newEndDate }
    });
  } catch (error) {
    console.error('❌ extendSubscriptionForReferral error:', error);
    return null;
  }
}

async function processReferral(referralCode, userId, ipAddress, userAgent) {
  try {
    if (!referralCode || typeof referralCode !== 'string') return null;

    const settings = await prisma.affiliateSettings.findFirst();
    if (!settings || !settings.isEnabled) return null;

    const affiliate = await prisma.affiliatePartner.findUnique({
      where: { referralCode: referralCode.toUpperCase().trim(), status: 'ACTIVE' }
    });

    if (!affiliate) return null;
    if (affiliate.userId === userId) return null;

    const existing = await prisma.referral.findFirst({
      where: { affiliateId: affiliate.id, referredUserId: userId }
    });
    if (existing) return existing;

    const referral = await prisma.$transaction(async (tx) => {
      const newRef = await tx.referral.create({
        data: {
          affiliateId: affiliate.id,
          referredUserId: userId,
          ipAddress: ipAddress || null,
          userAgent: userAgent || null
        }
      });
      await tx.affiliatePartner.update({
        where: { id: affiliate.id },
        data: { totalReferrals: { increment: 1 } }
      });
      return newRef;
    });

    return referral;
  } catch (err) {
    console.error('❌ processReferral error:', err?.message || err);
    return null;
  }
}

module.exports = { processReferral, extendSubscriptionForReferral };
