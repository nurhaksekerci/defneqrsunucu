const prisma = require('../config/database');
const { fetchUsersFromCommon } = require('../utils/commonService');
const { extendSubscriptionForReferral, processReferral } = require('../utils/referralHelper');
const crypto = require('crypto');

// Referans kodu talep et (daha önce affiliate ile kaydolup referral oluşmamış kullanıcılar için)
exports.claimReferral = async (req, res, next) => {
  try {
    const { referralCode } = req.body || {};
    const code = typeof referralCode === 'string' ? referralCode.trim().toUpperCase() : '';
    if (!code) {
      return res.status(400).json({ success: false, message: 'Referans kodu gerekli' });
    }

    const settings = await prisma.affiliateSettings.findFirst();
    if (!settings || !settings.isEnabled || !settings.referralDiscountPercent || settings.referralDiscountPercent <= 0) {
      return res.status(400).json({ success: false, message: 'Referans indirimi şu an aktif değil' });
    }

    const userId = req.user.id;
    const referral = await processReferral(code, userId, req.ip, req.headers['user-agent']);

    if (!referral) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz veya kullanılamayan referans kodu. Kendi kodunuzu kullanamazsınız.'
      });
    }

    res.json({
      success: true,
      message: `%${settings.referralDiscountPercent} indirim uygulandı`,
      data: { hasDiscount: true, discountPercent: settings.referralDiscountPercent }
    });
  } catch (error) {
    next(error);
  }
};

// Affiliate başvurusu yap
exports.applyForAffiliate = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const existing = await prisma.affiliatePartner.findUnique({
      where: { userId }
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Zaten bir affiliate başvurunuz mevcut',
        data: existing
      });
    }

    let referralCode;
    let isUnique = false;
    while (!isUnique) {
      referralCode = crypto.randomBytes(4).toString('hex').toUpperCase();
      const existingCode = await prisma.affiliatePartner.findUnique({
        where: { referralCode }
      });
      if (!existingCode) isUnique = true;
    }

    const { bankName, accountHolder, iban } = req.body;

    const affiliate = await prisma.affiliatePartner.create({
      data: {
        userId,
        referralCode,
        bankName,
        accountHolder,
        iban,
        status: 'PENDING'
      }
    });

    res.status(201).json({
      success: true,
      message: 'Affiliate başvurunuz alındı. Onay bekliyor.',
      data: affiliate
    });
  } catch (error) {
    next(error);
  }
};

// Davet edilen kullanıcı indirimi (checkout için - affiliate link ile gelen kullanıcılar)
exports.getReferralDiscount = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const settings = await prisma.affiliateSettings.findFirst();
    if (!settings || !settings.isEnabled || !settings.referralDiscountPercent || settings.referralDiscountPercent <= 0) {
      return res.json({ success: true, data: { hasDiscount: false } });
    }

    const referral = await prisma.referral.findFirst({
      where: { referredUserId: userId }
    });

    if (!referral) {
      return res.json({ success: true, data: { hasDiscount: false } });
    }

    res.json({
      success: true,
      data: {
        hasDiscount: true,
        discountPercent: settings.referralDiscountPercent
      }
    });
  } catch (error) {
    next(error);
  }
};

// Kendi affiliate bilgilerini getir
exports.getMyAffiliateInfo = async (req, res, next) => {
  try {
    const affiliate = await prisma.affiliatePartner.findUnique({
      where: { userId: req.user.id },
      include: {
        _count: {
          select: {
            referrals: true,
            commissions: true
          }
        }
      }
    });

    if (!affiliate) {
      return res.status(404).json({
        success: false,
        message: 'Affiliate partner kaydınız bulunamadı'
      });
    }

    const stats = {
      totalReferrals: affiliate.totalReferrals,
      activeReferrals: await prisma.referral.count({
        where: {
          affiliateId: affiliate.id,
          hasSubscribed: true
        }
      }),
      totalEarnings: affiliate.totalEarnings,
      pendingEarnings: affiliate.pendingEarnings,
      paidEarnings: affiliate.paidEarnings,
      unpaidCommissions: await prisma.affiliateCommission.count({
        where: {
          affiliateId: affiliate.id,
          isPaid: false
        }
      })
    };

    res.json({
      success: true,
      data: {
        ...affiliate,
        stats
      }
    });
  } catch (error) {
    next(error);
  }
};

// Kendi referral linkini getir
exports.getMyReferralLink = async (req, res, next) => {
  try {
    const affiliate = await prisma.affiliatePartner.findUnique({
      where: { userId: req.user.id }
    });

    if (!affiliate) {
      return res.status(404).json({
        success: false,
        message: 'Affiliate partner kaydınız bulunamadı'
      });
    }

    if (affiliate.status !== 'ACTIVE') {
      return res.status(403).json({
        success: false,
        message: 'Affiliate hesabınız aktif değil'
      });
    }

    const frontendUrl = process.env.FRONTEND_URL || 'https://defneqr.com';
    const referralLink = `${frontendUrl}/auth/register?ref=${affiliate.referralCode}`;

    res.json({
      success: true,
      data: {
        referralCode: affiliate.referralCode,
        referralLink
      }
    });
  } catch (error) {
    next(error);
  }
};

// Kendi referrallarını listele
exports.getMyReferrals = async (req, res, next) => {
  try {
    const affiliate = await prisma.affiliatePartner.findUnique({
      where: { userId: req.user.id }
    });

    if (!affiliate) {
      return res.status(404).json({
        success: false,
        message: 'Affiliate partner kaydınız bulunamadı'
      });
    }

    const settings = await prisma.affiliateSettings.findFirst();
    const daysFree = settings?.daysPerReferralFree ?? settings?.daysPerReferral ?? 7;
    const daysPaid = settings?.daysPerReferralPaid ?? settings?.daysPerReferral ?? 14;
    const commissionRate = settings?.commissionRate ?? 10;

    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [referrals, total] = await Promise.all([
      prisma.referral.findMany({
        where: { affiliateId: affiliate.id },
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.referral.count({ where: { affiliateId: affiliate.id } })
    ]);

    const referredUserIds = referrals.map((r) => r.referredUserId);
    const commissionsMap = referredUserIds.length
      ? await prisma.affiliateCommission
          .findMany({
            where: {
              affiliateId: affiliate.id,
              referredUserId: { in: referredUserIds }
            }
          })
          .then((list) => Object.fromEntries(list.map((c) => [c.referredUserId, c])))
      : {};

    // Plan bilgisi için Subscription sorgusu (User model yok)
    const subscriptionsByUser = referredUserIds.length
      ? await prisma.subscription
          .findMany({
            where: { userId: { in: referredUserIds } },
            orderBy: { createdAt: 'desc' },
            include: { plan: true }
          })
          .then((list) => {
            const map = {};
            for (const s of list) {
              if (!map[s.userId]) map[s.userId] = s;
            }
            return map;
          })
      : {};

    // Restoran sahibi mi? (ownerId ile kontrol - User model yok)
    const isRestaurantOwner = await prisma.restaurant.count({
      where: { ownerId: affiliate.userId, isDeleted: false }
    }) > 0;

    const data = referrals.map((r) => {
      const sub = subscriptionsByUser[r.referredUserId];
      const plan = sub?.plan;
      const planName = plan?.name ?? '-';
      const planType = plan?.type ?? null;
      const isPaidPlan = planType && planType !== 'FREE';

      let reward = '-';
      if (isRestaurantOwner) {
        if (!r.hasSubscribed) {
          reward = `Henüz abone değil (${daysFree} gün kazanacaksınız)`;
        } else if (r.pendingDaysApproval) {
          reward = `${daysFree} gün (admin onayı bekliyor)`;
        } else if (r.daysAwarded != null) {
          reward = `${r.daysAwarded} gün`;
        } else {
          reward = isPaidPlan ? `${daysPaid} gün` : `${daysFree} gün (onay bekliyor)`;
        }
      } else {
        const comm = commissionsMap[r.referredUserId];
        if (comm) {
          reward = `₺${comm.amount.toFixed(2)} komisyon`;
        } else if (r.hasSubscribed && isPaidPlan) {
          reward = `%${commissionRate} komisyon (bekleniyor)`;
        } else if (!r.hasSubscribed) {
          reward = 'Henüz abone değil';
        } else {
          reward = '-';
        }
      }

      return {
        ...r,
        planName,
        planType: planType ?? 'NONE',
        reward
      };
    });

    res.json({
      success: true,
      data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    next(error);
  }
};

// Kendi komisyonlarını listele
exports.getMyCommissions = async (req, res, next) => {
  try {
    const affiliate = await prisma.affiliatePartner.findUnique({
      where: { userId: req.user.id }
    });

    if (!affiliate) {
      return res.status(404).json({
        success: false,
        message: 'Affiliate partner kaydınız bulunamadı'
      });
    }

    const { page = 1, limit = 20, isPaid } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = { affiliateId: affiliate.id };
    if (isPaid !== undefined) {
      where.isPaid = isPaid === 'true';
    }

    const [commissions, total] = await Promise.all([
      prisma.affiliateCommission.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.affiliateCommission.count({ where })
    ]);

    res.json({
      success: true,
      data: commissions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    next(error);
  }
};

// Banka bilgilerini güncelle
exports.updateBankInfo = async (req, res, next) => {
  try {
    const { bankName, accountHolder, iban } = req.body;

    const affiliate = await prisma.affiliatePartner.update({
      where: { userId: req.user.id },
      data: {
        bankName,
        accountHolder,
        iban
      }
    });

    res.json({
      success: true,
      message: 'Banka bilgileriniz güncellendi',
      data: affiliate
    });
  } catch (error) {
    next(error);
  }
};

// === ADMIN ROUTES ===

// Tüm affiliate partnerları listele (Admin)
exports.getAllAffiliates = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (status) {
      where.status = status;
    }

    const [affiliates, total] = await Promise.all([
      prisma.affiliatePartner.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              referrals: true,
              commissions: true
            }
          }
        }
      }),
      prisma.affiliatePartner.count({ where })
    ]);

    // Enrich with user (fullName, email) from backend-common
    const userIds = [...new Set(affiliates.map((a) => a.userId))];
    const usersById = await fetchUsersFromCommon(userIds, req.headers.authorization);

    const enriched = affiliates.map((a) => {
      const user = usersById[a.userId];
      return {
        ...a,
        user: user ? { id: user.id, fullName: user.fullName, email: user.email } : undefined
      };
    });

    res.json({
      success: true,
      data: enriched,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    next(error);
  }
};

// Affiliate başvurusunu onayla/reddet (Admin)
exports.updateAffiliateStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const affiliate = await prisma.affiliatePartner.update({
      where: { id },
      data: {
        status,
        approvedBy: status === 'ACTIVE' ? req.user.id : null,
        approvedAt: status === 'ACTIVE' ? new Date() : null
      }
    });

    res.json({
      success: true,
      message: `Affiliate ${status === 'ACTIVE' ? 'onaylandı' : 'güncellendi'}`,
      data: affiliate
    });
  } catch (error) {
    next(error);
  }
};

// Affiliate şartlarını getir (Kullanıcılar için - sadece okuma)
exports.getAffiliateTerms = async (req, res, next) => {
  try {
    let settings = await prisma.affiliateSettings.findFirst();

    if (!settings) {
      settings = await prisma.affiliateSettings.create({
        data: {}
      });
    }

    res.json({
      success: true,
      data: {
        commissionRate: settings.commissionRate,
        minimumPayout: settings.minimumPayout,
        cookieDuration: settings.cookieDuration,
        daysPerReferralFree: settings.daysPerReferralFree ?? settings.daysPerReferral ?? 7,
        daysPerReferralPaid: settings.daysPerReferralPaid ?? settings.daysPerReferral ?? 14,
        referralDiscountPercent: settings.referralDiscountPercent ?? 0,
        requireApproval: settings.requireApproval
      }
    });
  } catch (error) {
    next(error);
  }
};

// Affiliate ayarlarını getir (Admin)
exports.getAffiliateSettings = async (req, res, next) => {
  try {
    let settings = await prisma.affiliateSettings.findFirst();

    if (!settings) {
      settings = await prisma.affiliateSettings.create({
        data: {}
      });
    }

    res.json({
      success: true,
      data: {
        ...settings,
        daysPerReferralFree: settings.daysPerReferralFree ?? settings.daysPerReferral ?? 7,
        daysPerReferralPaid: settings.daysPerReferralPaid ?? settings.daysPerReferral ?? 14
      }
    });
  } catch (error) {
    next(error);
  }
};

// Affiliate ayarlarını güncelle (Admin)
exports.updateAffiliateSettings = async (req, res, next) => {
  try {
    const {
      commissionRate,
      minimumPayout,
      isEnabled,
      requireApproval,
      cookieDuration,
      daysPerReferral,
      daysPerReferralFree,
      daysPerReferralPaid,
      referralDiscountPercent
    } = req.body;

    const data = {};
    if (commissionRate !== undefined) data.commissionRate = commissionRate;
    if (minimumPayout !== undefined) data.minimumPayout = minimumPayout;
    if (isEnabled !== undefined) data.isEnabled = isEnabled;
    if (requireApproval !== undefined) data.requireApproval = requireApproval;
    if (cookieDuration !== undefined) data.cookieDuration = cookieDuration;
    if (daysPerReferral !== undefined) data.daysPerReferral = daysPerReferral;
    if (daysPerReferralFree !== undefined) data.daysPerReferralFree = daysPerReferralFree;
    if (daysPerReferralPaid !== undefined) data.daysPerReferralPaid = daysPerReferralPaid;
    if (referralDiscountPercent !== undefined) data.referralDiscountPercent = referralDiscountPercent;

    let settings = await prisma.affiliateSettings.findFirst();

    if (!settings) {
      settings = await prisma.affiliateSettings.create({
        data: { ...data }
      });
    } else {
      settings = await prisma.affiliateSettings.update({
        where: { id: settings.id },
        data
      });
    }

    res.json({
      success: true,
      message: 'Affiliate ayarları güncellendi',
      data: settings
    });
  } catch (error) {
    next(error);
  }
};

// Bekleyen referral ödüllerini listele (Admin - ücretsiz plan onayları)
exports.getPendingReferralRewards = async (req, res, next) => {
  try {
    const referrals = await prisma.referral.findMany({
      where: {
        hasSubscribed: true,
        pendingDaysApproval: true
      },
      include: {
        affiliate: true
      },
      orderBy: { firstSubscription: 'asc' }
    });

    const referredUserIds = referrals.map((r) => r.referredUserId);
    const affiliateUserIds = [...new Set(referrals.map((r) => r.affiliate?.userId).filter(Boolean))];
    const allUserIds = [...new Set([...referredUserIds, ...affiliateUserIds])];

    const [restaurantsByOwner, usersById] = await Promise.all([
      referredUserIds.length
        ? prisma.restaurant
            .findMany({
              where: { ownerId: { in: referredUserIds }, isDeleted: false },
              orderBy: { createdAt: 'desc' },
              select: { ownerId: true, slug: true, name: true }
            })
            .then((list) => {
              const map = {};
              for (const r of list) {
                if (!map[r.ownerId]) map[r.ownerId] = r;
              }
              return map;
            })
        : {},
      allUserIds.length ? fetchUsersFromCommon(allUserIds, req.headers.authorization) : {}
    ]);

    const settings = await prisma.affiliateSettings.findFirst();
    const daysToAward = settings?.daysPerReferralFree ?? 7;
    const requireApproval = settings?.requireApproval ?? true;
    const siteUrl = process.env.FRONTEND_URL || 'https://defneqr.com';

    const payload = {
      data: referrals.map((r) => {
        const restaurant = restaurantsByOwner[r.referredUserId];
        const referredUser = usersById[r.referredUserId];
        const affiliateUser = usersById[r.affiliate?.userId];
        return {
          ...r,
          daysToAward,
          restaurantSlug: restaurant?.slug ?? null,
          restaurantName: restaurant?.name ?? null,
          restaurantUrl: restaurant ? `${siteUrl}/${restaurant.slug}/menu` : null,
          referredUser: referredUser ? { fullName: referredUser.fullName, email: referredUser.email } : { fullName: '—', email: '—' },
          affiliate: {
            ...r.affiliate,
            user: affiliateUser ? { fullName: affiliateUser.fullName, email: affiliateUser.email } : { fullName: '—', email: '—' }
          }
        };
      }),
      requireApproval
    };
    res.json({ success: true, data: payload.data, requireApproval: payload.requireApproval });
  } catch (error) {
    console.error('❌ getPendingReferralRewards error:', error?.message || error);
    if (error?.code === 'P2021' || error?.message?.includes('column') || error?.message?.includes('does not exist')) {
      return res.status(503).json({
        success: false,
        message: 'Veritabanı migration gerekli. Lütfen "npx prisma migrate deploy" çalıştırın.'
      });
    }
    next(error);
  }
};

// Referral ödülünü onayla (Admin - ücretsiz plan için manuel onay)
exports.approveReferralReward = async (req, res, next) => {
  try {
    const { id } = req.params;
    const referral = await prisma.referral.findUnique({
      where: { id },
      include: { affiliate: true }
    });

    if (!referral || !referral.pendingDaysApproval) {
      return res.status(404).json({
        success: false,
        message: 'Onay bekleyen referral bulunamadı'
      });
    }

    const settings = await prisma.affiliateSettings.findFirst();
    const daysToAdd = settings?.daysPerReferralFree ?? settings?.daysPerReferral ?? 7;

    await extendSubscriptionForReferral(referral.referredUserId, referral.affiliateId, daysToAdd);

    await prisma.referral.update({
      where: { id },
      data: {
        pendingDaysApproval: false,
        daysAwarded: daysToAdd
      }
    });

    res.json({
      success: true,
      message: `${daysToAdd} gün ödülü onaylandı`,
      data: { referralId: id, daysAwarded: daysToAdd }
    });
  } catch (error) {
    next(error);
  }
};

// Referral ödülünü reddet (Admin - açıklama zorunlu)
exports.rejectReferralReward = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const trimmedReason = typeof reason === 'string' ? reason.trim() : '';
    if (!trimmedReason) {
      return res.status(400).json({
        success: false,
        message: 'Red açıklaması zorunludur'
      });
    }

    const referral = await prisma.referral.findUnique({
      where: { id }
    });

    if (!referral || !referral.pendingDaysApproval) {
      return res.status(404).json({
        success: false,
        message: 'Onay bekleyen referral bulunamadı'
      });
    }

    await prisma.referral.update({
      where: { id },
      data: {
        pendingDaysApproval: false,
        daysAwarded: null,
        rejectionReason: trimmedReason
      }
    });

    res.json({
      success: true,
      message: 'Referral ödülü reddedildi',
      data: { referralId: id }
    });
  } catch (error) {
    next(error);
  }
};

// Tüm bekleyen referral ödüllerini toplu onayla (Admin)
exports.approveAllPendingReferralRewards = async (req, res, next) => {
  try {
    const referrals = await prisma.referral.findMany({
      where: { hasSubscribed: true, pendingDaysApproval: true },
      include: { affiliate: true }
    });

    const settings = await prisma.affiliateSettings.findFirst();
    const daysToAdd = settings?.daysPerReferralFree ?? settings?.daysPerReferral ?? 7;

    let approved = 0;

    for (const r of referrals) {
      await extendSubscriptionForReferral(r.referredUserId, r.affiliateId, daysToAdd);
      await prisma.referral.update({
        where: { id: r.id },
        data: { pendingDaysApproval: false, daysAwarded: daysToAdd }
      });
      approved++;
    }

    res.json({
      success: true,
      message: `${approved} referral ödülü onaylandı`,
      data: { approvedCount: approved, daysAwarded: daysToAdd }
    });
  } catch (error) {
    next(error);
  }
};

// Ödeme oluştur (Admin)
exports.createPayout = async (req, res, next) => {
  try {
    const { affiliateId, commissionIds, method, notes } = req.body;

    const affiliate = await prisma.affiliatePartner.findUnique({
      where: { id: affiliateId }
    });

    if (!affiliate) {
      return res.status(404).json({
        success: false,
        message: 'Affiliate partner bulunamadı'
      });
    }

    const commissions = await prisma.affiliateCommission.findMany({
      where: {
        id: { in: commissionIds },
        affiliateId,
        isPaid: false
      }
    });

    if (commissions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Ödenecek komisyon bulunamadı'
      });
    }

    const totalAmount = commissions.reduce((sum, c) => sum + c.amount, 0);

    const payout = await prisma.$transaction(async (tx) => {
      const newPayout = await tx.affiliatePayout.create({
        data: {
          affiliateId,
          amount: totalAmount,
          commissionIds: commissionIds,
          method,
          bankName: affiliate.bankName,
          accountHolder: affiliate.accountHolder,
          iban: affiliate.iban,
          notes,
          status: 'PENDING',
          processedBy: req.user.id
        }
      });

      await tx.affiliateCommission.updateMany({
        where: {
          id: { in: commissionIds }
        },
        data: {
          isPaid: true,
          paidAt: new Date(),
          payoutId: newPayout.id
        }
      });

      await tx.affiliatePartner.update({
        where: { id: affiliateId },
        data: {
          pendingEarnings: { decrement: totalAmount },
          paidEarnings: { increment: totalAmount }
        }
      });

      return newPayout;
    });

    res.status(201).json({
      success: true,
      message: 'Ödeme talebi oluşturuldu',
      data: payout
    });
  } catch (error) {
    next(error);
  }
};

// Ödemeyi tamamla/iptal et (Admin)
exports.updatePayoutStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, transactionId } = req.body;

    const payout = await prisma.affiliatePayout.update({
      where: { id },
      data: {
        status,
        transactionId,
        processedBy: req.user.id,
        processedAt: new Date()
      }
    });

    res.json({
      success: true,
      message: 'Ödeme durumu güncellendi',
      data: payout
    });
  } catch (error) {
    next(error);
  }
};

// Tüm ödemeleri listele (Admin)
exports.getAllPayouts = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (status) {
      where.status = status;
    }

    const [payouts, total] = await Promise.all([
      prisma.affiliatePayout.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          affiliate: true
        }
      }),
      prisma.affiliatePayout.count({ where })
    ]);

    res.json({
      success: true,
      data: payouts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    next(error);
  }
};

// Affiliate istatistikleri (Admin - genel bakış)
exports.getAffiliateStats = async (req, res, next) => {
  try {
    const [
      totalAffiliates,
      activeAffiliates,
      pendingAffiliates,
      totalReferrals,
      totalCommissions,
      unpaidCommissions,
      totalEarnings
    ] = await Promise.all([
      prisma.affiliatePartner.count(),
      prisma.affiliatePartner.count({ where: { status: 'ACTIVE' } }),
      prisma.affiliatePartner.count({ where: { status: 'PENDING' } }),
      prisma.referral.count(),
      prisma.affiliateCommission.count(),
      prisma.affiliateCommission.count({ where: { isPaid: false } }),
      prisma.affiliateCommission.aggregate({
        _sum: { amount: true }
      })
    ]);

    res.json({
      success: true,
      data: {
        totalAffiliates,
        activeAffiliates,
        pendingAffiliates,
        totalReferrals,
        totalCommissions,
        unpaidCommissions,
        totalEarnings: totalEarnings._sum.amount || 0
      }
    });
  } catch (error) {
    next(error);
  }
};
