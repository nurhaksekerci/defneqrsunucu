const prisma = require('../config/database');

// Referral tracking middleware
// Kayıt sırasında referral code'u kontrol eder ve cookie'ye kaydeder
exports.trackReferral = async (req, res, next) => {
  try {
    const { ref } = req.query;

    if (ref) {
      // Affiliate settings kontrol et
      const settings = await prisma.affiliateSettings.findFirst();
      if (!settings || !settings.isEnabled) {
        return next();
      }

      // Referral code geçerli mi kontrol et
      const affiliate = await prisma.affiliatePartner.findUnique({
        where: { 
          referralCode: ref.toUpperCase(),
          status: 'ACTIVE'
        }
      });

      if (affiliate) {
        // Cookie'ye kaydet (30 gün varsayılan)
        const cookieDuration = settings.cookieDuration || 30;
        res.cookie('referral_code', ref.toUpperCase(), {
          maxAge: cookieDuration * 24 * 60 * 60 * 1000, // Gün -> ms
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax'
        });

        console.log('✅ Referral tracked:', {
          code: ref.toUpperCase(),
          affiliateId: affiliate.id,
          cookieDuration: `${cookieDuration} days`
        });
      }
    }

    next();
  } catch (error) {
    console.error('❌ Referral tracking error:', error);
    next(); // Hata olsa bile devam et
  }
};

// Kayıt sırasında referral oluştur
exports.createReferral = async (userId, ipAddress, userAgent) => {
  try {
    const settings = await prisma.affiliateSettings.findFirst();
    if (!settings || !settings.isEnabled) {
      return null;
    }

    // Cookie'den referral code'u al (bu fonksiyonu çağıran yerde req.cookies.referral_code kullanılmalı)
    // Bu fonksiyon artık parametreden referralCode alacak
    return null; // Controller içinden çağrılacak
  } catch (error) {
    console.error('❌ Create referral error:', error);
    return null;
  }
};

// Helper: Referral code'dan referral oluştur
exports.processReferral = async (referralCode, userId, ipAddress, userAgent) => {
  try {
    if (!referralCode) return null;

    const settings = await prisma.affiliateSettings.findFirst();
    if (!settings || !settings.isEnabled) {
      return null;
    }

    const affiliate = await prisma.affiliatePartner.findUnique({
      where: { 
        referralCode: referralCode.toUpperCase(),
        status: 'ACTIVE'
      }
    });

    if (!affiliate) {
      console.log('⚠️  Invalid referral code:', referralCode);
      return null;
    }

    // Kendi referral linki ile kayıt olamaz
    if (affiliate.userId === userId) {
      console.log('⚠️  User tried to use own referral code');
      return null;
    }

    // Daha önce bu kullanıcı için referral oluşturulmuş mu?
    const existingReferral = await prisma.referral.findFirst({
      where: {
        affiliateId: affiliate.id,
        referredUserId: userId
      }
    });

    if (existingReferral) {
      console.log('⚠️  Referral already exists for this user');
      return existingReferral;
    }

    // Yeni referral oluştur
    const referral = await prisma.$transaction(async (tx) => {
      const newReferral = await tx.referral.create({
        data: {
          affiliateId: affiliate.id,
          referredUserId: userId,
          ipAddress,
          userAgent
        }
      });

      // Affiliate istatistiklerini güncelle
      await tx.affiliatePartner.update({
        where: { id: affiliate.id },
        data: {
          totalReferrals: { increment: 1 }
        }
      });

      return newReferral;
    });

    console.log('✅ Referral created:', {
      affiliateId: affiliate.id,
      referredUserId: userId,
      referralCode: referralCode.toUpperCase()
    });

    return referral;
  } catch (error) {
    console.error('❌ Process referral error:', error);
    return null;
  }
};

// Helper: Referral için abonelik süresini uzat (Restoran sahipleri için)
exports.extendSubscriptionForReferral = async (referredUserId, affiliateId, daysToAdd) => {
  try {
    const settings = await prisma.affiliateSettings.findFirst();
    if (!settings || !settings.isEnabled) {
      return null;
    }

    const days = daysToAdd ?? settings.daysPerReferral ?? settings.daysPerReferralPaid ?? 7;
    if (!days || days < 1) return null;

    // Affiliate'in aktif aboneliğini bul
    const activeSubscription = await prisma.subscription.findFirst({
      where: {
        user: {
          affiliatePartner: {
            id: affiliateId
          }
        },
        status: 'ACTIVE',
        endDate: {
          gte: new Date()
        }
      },
      orderBy: { endDate: 'desc' }
    });

    if (!activeSubscription) {
      console.log('⚠️  Affiliate has no active subscription to extend');
      return null;
    }

    // Abonelik süresini uzat
    const newEndDate = new Date(activeSubscription.endDate);
    newEndDate.setDate(newEndDate.getDate() + days);

    const updatedSubscription = await prisma.subscription.update({
      where: { id: activeSubscription.id },
      data: {
        endDate: newEndDate
      }
    });

    console.log('✅ Subscription extended for referral:', {
      affiliateId,
      referredUserId,
      daysAdded: days,
      newEndDate: newEndDate.toISOString()
    });

    return updatedSubscription;
  } catch (error) {
    console.error('❌ Extend subscription error:', error);
    return null;
  }
};

// Helper: Abonelik oluşturulduğunda komisyon oluştur (Sadece ödenen affiliate'ler için)
exports.createCommission = async (referredUserId, subscriptionId, subscriptionAmount) => {
  try {
    const settings = await prisma.affiliateSettings.findFirst();
    if (!settings || !settings.isEnabled) {
      return null;
    }

    // Aboneliğin plan tipini al (FREE vs PAID)
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: { plan: true }
    });
    const isPaidPlan = subscription?.plan?.type && !['FREE'].includes(subscription.plan.type);

    // Bu kullanıcı bir referral mı?
    const referral = await prisma.referral.findFirst({
      where: { referredUserId },
      include: { affiliate: { include: { user: true } } }
    });

    if (!referral || referral.affiliate.status !== 'ACTIVE') {
      return null;
    }

    // Restoran sahibi ise gün kazanır (para komisyonu yok)
    if (referral.affiliate.user.role === 'RESTAURANT_OWNER') {
      const daysFree = settings.daysPerReferralFree ?? settings.daysPerReferral ?? 7;
      const daysPaid = settings.daysPerReferralPaid ?? settings.daysPerReferral ?? 14;

      if (isPaidPlan) {
        // Ücretli plan: otomatik onay, hemen gün ekle
        await exports.extendSubscriptionForReferral(referredUserId, referral.affiliateId, daysPaid);
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
      } else {
        // Ücretsiz plan: admin onayı gerekli, gün eklenmez
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
    }

    // Diğer affiliate'ler (ödenen) için para komisyonu - sadece ücretli abonelikte
    if (!isPaidPlan) {
      return null;
    }
    const commissionAmount = (subscriptionAmount * settings.commissionRate) / 100;

    const commission = await prisma.$transaction(async (tx) => {
      // Komisyon oluştur
      const newCommission = await tx.affiliateCommission.create({
        data: {
          affiliateId: referral.affiliateId,
          referredUserId,
          subscriptionId,
          amount: commissionAmount,
          percentage: settings.commissionRate,
          subscriptionAmount
        }
      });

      // Referral'ı güncelle (ilk abonelik)
      if (!referral.hasSubscribed) {
        await tx.referral.update({
          where: { id: referral.id },
          data: {
            hasSubscribed: true,
            firstSubscription: new Date()
          }
        });
      }

      // Affiliate istatistiklerini güncelle
      await tx.affiliatePartner.update({
        where: { id: referral.affiliateId },
        data: {
          totalEarnings: { increment: commissionAmount },
          pendingEarnings: { increment: commissionAmount }
        }
      });

      return newCommission;
    });

    console.log('✅ Commission created:', {
      affiliateId: referral.affiliateId,
      amount: commissionAmount,
      subscriptionId
    });

    return commission;
  } catch (error) {
    console.error('❌ Create commission error:', error);
    return null;
  }
};
