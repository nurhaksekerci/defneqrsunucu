const prisma = require('../config/database');
const { validationResult } = require('express-validator');

exports.createPromoCode = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    }

    const { code, type, discountValue, maxUses, validFrom, validUntil, applicablePlans, description } = req.body;

    const existingCode = await prisma.promoCode.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (existingCode) {
      return res.status(400).json({ success: false, message: 'Bu promosyon kodu zaten mevcut' });
    }

    const promoCode = await prisma.promoCode.create({
      data: {
        code: code.toUpperCase(),
        type,
        discountValue,
        maxUses: maxUses || null,
        validFrom: validFrom ? new Date(validFrom) : new Date(),
        validUntil: validUntil ? new Date(validUntil) : null,
        applicablePlans: applicablePlans || null,
        description,
        createdBy: req.user.id,
        isActive: true,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Promosyon kodu oluşturuldu',
      data: promoCode,
    });
  } catch (error) {
    next(error);
  }
};

exports.getAllPromoCodes = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, isActive, type } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (isActive !== undefined) where.isActive = isActive === 'true';
    if (type) where.type = type;

    const [promoCodes, total] = await Promise.all([
      prisma.promoCode.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { usages: true } } },
      }),
      prisma.promoCode.count({ where }),
    ]);

    res.json({
      success: true,
      data: promoCodes,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.validatePromoCode = async (req, res, next) => {
  try {
    const { code } = req.params;
    const { planId } = req.query;

    const promoCode = await prisma.promoCode.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!promoCode) {
      return res.status(404).json({ success: false, message: 'Geçersiz promosyon kodu' });
    }

    const now = new Date();

    if (!promoCode.isActive) {
      return res.status(400).json({ success: false, message: 'Bu promosyon kodu artık geçerli değil' });
    }

    if (promoCode.validFrom > now) {
      return res.status(400).json({ success: false, message: 'Bu promosyon kodu henüz geçerli değil' });
    }

    if (promoCode.validUntil && promoCode.validUntil < now) {
      return res.status(400).json({ success: false, message: 'Bu promosyon kodunun süresi dolmuş' });
    }

    if (promoCode.maxUses && promoCode.usedCount >= promoCode.maxUses) {
      return res.status(400).json({ success: false, message: 'Bu promosyon kodu kullanım limitine ulaşmış' });
    }

    if (planId && promoCode.applicablePlans) {
      const applicablePlans = promoCode.applicablePlans;
      if (!applicablePlans.includes(planId)) {
        return res.status(400).json({ success: false, message: 'Bu promosyon kodu seçtiğiniz plan için geçerli değil' });
      }
    }

    if (req.user) {
      const previousUsage = await prisma.promoCodeUsage.findFirst({
        where: { promoCodeId: promoCode.id, userId: req.user.id },
      });

      if (previousUsage) {
        return res.status(400).json({ success: false, message: 'Bu promosyon kodunu daha önce kullandınız' });
      }
    }

    res.json({
      success: true,
      message: 'Promosyon kodu geçerli',
      data: {
        code: promoCode.code,
        type: promoCode.type,
        discountValue: promoCode.discountValue,
        description: promoCode.description,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.applyPromoCode = async (req, res, next) => {
  try {
    const { code, subscriptionAmount, planId } = req.body;

    const promoCode = await prisma.promoCode.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!promoCode || !promoCode.isActive) {
      return res.status(400).json({ success: false, message: 'Geçersiz promosyon kodu' });
    }

    const now = new Date();
    if (promoCode.validFrom > now || (promoCode.validUntil && promoCode.validUntil < now)) {
      return res.status(400).json({ success: false, message: 'Bu promosyon kodu geçerli değil' });
    }

    if (promoCode.maxUses && promoCode.usedCount >= promoCode.maxUses) {
      return res.status(400).json({ success: false, message: 'Bu promosyon kodu kullanım limitine ulaşmış' });
    }

    if (planId && promoCode.applicablePlans) {
      const applicablePlans = promoCode.applicablePlans;
      if (!applicablePlans.includes(planId)) {
        return res.status(400).json({ success: false, message: 'Bu promosyon kodu seçtiğiniz plan için geçerli değil' });
      }
    }

    let discountAmount = 0;
    if (promoCode.type === 'PERCENTAGE') {
      discountAmount = (subscriptionAmount * promoCode.discountValue) / 100;
    } else if (promoCode.type === 'FIXED') {
      discountAmount = promoCode.discountValue;
    }

    const finalAmount = Math.max(0, subscriptionAmount - discountAmount);

    res.json({
      success: true,
      message: 'Promosyon kodu uygulandı',
      data: {
        originalAmount: subscriptionAmount,
        discountAmount,
        finalAmount,
        promoCodeId: promoCode.id,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.updatePromoCode = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (updates.code) {
      const existingCode = await prisma.promoCode.findFirst({
        where: { code: updates.code.toUpperCase(), NOT: { id } },
      });

      if (existingCode) {
        return res.status(400).json({ success: false, message: 'Bu promosyon kodu zaten mevcut' });
      }
      updates.code = updates.code.toUpperCase();
    }

    if (updates.validFrom) updates.validFrom = new Date(updates.validFrom);
    if (updates.validUntil) updates.validUntil = new Date(updates.validUntil);

    const promoCode = await prisma.promoCode.update({
      where: { id },
      data: updates,
    });

    res.json({
      success: true,
      message: 'Promosyon kodu güncellendi',
      data: promoCode,
    });
  } catch (error) {
    next(error);
  }
};

exports.deletePromoCode = async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.promoCode.delete({
      where: { id },
    });

    res.json({ success: true, message: 'Promosyon kodu silindi' });
  } catch (error) {
    next(error);
  }
};

exports.getPromoCodeUsages = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [usages, total] = await Promise.all([
      prisma.promoCodeUsage.findMany({
        where: { promoCodeId: id },
        skip,
        take: parseInt(limit),
        orderBy: { usedAt: 'desc' },
      }),
      prisma.promoCodeUsage.count({ where: { promoCodeId: id } }),
    ]);

    res.json({
      success: true,
      data: usages,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getMyPromoCodeUsages = async (req, res, next) => {
  try {
    const usages = await prisma.promoCodeUsage.findMany({
      where: { userId: req.user.id },
      orderBy: { usedAt: 'desc' },
      include: {
        promoCode: {
          select: { code: true, type: true, description: true },
        },
      },
    });

    res.json({ success: true, data: usages });
  } catch (error) {
    next(error);
  }
};
