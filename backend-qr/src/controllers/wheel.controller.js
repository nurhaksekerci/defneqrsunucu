const prisma = require('../config/database');

const TZ = 'Europe/Istanbul';

function getTurkeyTodayStart() {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = formatter.formatToParts(now);
  const obj = {};
  parts.forEach((p) => {
    obj[p.type] = p.value;
  });
  return new Date(`${obj.year}-${obj.month}-${obj.day}T00:00:00+03:00`);
}

async function getUserPlan(userId) {
  const subscription = await prisma.subscription.findFirst({
    where: {
      userId,
      status: 'ACTIVE',
      endDate: { gte: new Date() },
    },
    include: { plan: true },
    orderBy: { createdAt: 'desc' },
  });
  if (subscription) return subscription.plan;
  return prisma.plan.findFirst({ where: { type: 'FREE', isActive: true } });
}

async function getWheelSettings() {
  let settings = await prisma.wheelGameSettings.findFirst({ orderBy: { createdAt: 'desc' } });
  if (!settings) {
    settings = await prisma.wheelGameSettings.create({
      data: {
        isEnabled: true,
        title: 'Şansını Dene!',
        description: 'Günde 1 kez çevir, Premium deneme süresi kazan!',
        segments: [
          { label: '1 Gün Premium', type: 'subscription_days', value: 1, color: '#ef4444' },
          { label: 'Tekrar Dene', type: 'message', value: '', color: '#f59e0b' },
          { label: '3 Gün Premium', type: 'subscription_days', value: 3, color: '#10b981' },
          { label: "Premium'a Geç", type: 'message', value: '', color: '#6366f1' },
          { label: '5 Gün Premium', type: 'subscription_days', value: 5, color: '#ec4899' },
          { label: 'Şanslısın!', type: 'message', value: '', color: '#8b5cf6' },
        ],
      },
    });
  }
  return settings;
}

exports.getConfig = async (req, res, next) => {
  try {
    const settings = await getWheelSettings();
    if (!settings.isEnabled) {
      return res.json({ success: true, data: { enabled: false } });
    }
    res.json({
      success: true,
      data: {
        enabled: true,
        title: settings.title,
        description: settings.description,
        segments: settings.segments,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.canSpin = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const settings = await getWheelSettings();
    if (!settings.isEnabled) {
      return res.json({ success: true, data: { canSpin: false, reason: 'disabled' } });
    }

    const plan = await getUserPlan(userId);
    if (!plan || plan.type !== 'FREE') {
      return res.json({ success: true, data: { canSpin: false, reason: 'premium_user' } });
    }

    const restaurantCount = await prisma.restaurant.count({
      where: { ownerId: userId, isDeleted: false },
    });
    if (restaurantCount === 0) {
      return res.json({ success: true, data: { canSpin: false, reason: 'no_restaurant' } });
    }

    const todayStart = getTurkeyTodayStart();
    const lastSpin = await prisma.wheelSpin.findFirst({
      where: { userId },
      orderBy: { spunAt: 'desc' },
    });
    if (lastSpin && new Date(lastSpin.spunAt) >= todayStart) {
      return res.json({
        success: true,
        data: {
          canSpin: false,
          reason: 'already_spun_today',
          nextSpinAt: new Date(todayStart.getTime() + 24 * 60 * 60 * 1000),
        },
      });
    }

    res.json({ success: true, data: { canSpin: true } });
  } catch (error) {
    next(error);
  }
};

exports.spin = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const settings = await getWheelSettings();
    if (!settings.isEnabled) {
      return res.status(400).json({ success: false, message: 'Çark oyunu şu an kapalı' });
    }

    const plan = await getUserPlan(userId);
    if (!plan || plan.type !== 'FREE') {
      return res.status(403).json({ success: false, message: 'Sadece ücretsiz plan kullanıcıları çevirebilir' });
    }

    const restaurantCount = await prisma.restaurant.count({
      where: { ownerId: userId, isDeleted: false },
    });
    if (restaurantCount === 0) {
      return res.status(403).json({ success: false, message: 'Çark oyunu için en az bir restoran oluşturmalısınız' });
    }

    const todayStart = getTurkeyTodayStart();
    const lastSpin = await prisma.wheelSpin.findFirst({
      where: { userId },
      orderBy: { spunAt: 'desc' },
    });
    if (lastSpin && new Date(lastSpin.spunAt) >= todayStart) {
      return res.status(400).json({ success: false, message: 'Bugün zaten çevirdiniz. Yarın tekrar deneyin.' });
    }

    const segments = Array.isArray(settings.segments) ? settings.segments : [];
    if (segments.length === 0) {
      return res.status(500).json({ success: false, message: 'Çark ayarları eksik' });
    }

    const idx = Math.floor(Math.random() * segments.length);
    const segment = segments[idx];
    const prizeType = segment.type || 'message';
    const prizeValue = segment.value ?? (segment.type === 'subscription_days' ? 1 : '');

    const wheelSpin = await prisma.wheelSpin.create({
      data: {
        userId,
        prizeType,
        prizeValue: { value: prizeValue, label: segment.label },
      },
    });

    if (prizeType === 'subscription_days' && prizeValue > 0) {
      const premiumPlan = await prisma.plan.findFirst({
        where: { type: 'PREMIUM', isActive: true },
      });
      if (premiumPlan) {
        const now = new Date();
        const endDate = new Date(now.getTime() + prizeValue * 24 * 60 * 60 * 1000);
        await prisma.subscription.create({
          data: {
            userId,
            planId: premiumPlan.id,
            startDate: now,
            endDate,
            status: 'ACTIVE',
            amount: 0,
          },
        });
      }
    }

    res.json({
      success: true,
      data: {
        prize: {
          type: prizeType,
          value: prizeValue,
          label: segment.label,
        },
        segmentIndex: idx,
        spinId: wheelSpin.id,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getSettings = async (req, res, next) => {
  try {
    const settings = await getWheelSettings();
    res.json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
};

exports.updateSettings = async (req, res, next) => {
  try {
    const { isEnabled, title, description, segments } = req.body;

    let settings = await prisma.wheelGameSettings.findFirst({ orderBy: { createdAt: 'desc' } });
    if (!settings) {
      settings = await prisma.wheelGameSettings.create({
        data: {
          isEnabled: isEnabled ?? true,
          title: title || 'Şansını Dene!',
          description: description || null,
          segments: segments || [],
        },
      });
    } else {
      settings = await prisma.wheelGameSettings.update({
        where: { id: settings.id },
        data: {
          ...(isEnabled !== undefined && { isEnabled }),
          ...(title !== undefined && { title }),
          ...(description !== undefined && { description }),
          ...(segments !== undefined && { segments }),
        },
      });
    }

    res.json({ success: true, data: settings, message: 'Çark ayarları güncellendi' });
  } catch (error) {
    next(error);
  }
};
