const prisma = require('../config/database');
const { Decimal } = require('@prisma/client/runtime/library');

const ensureBusinessAccess = async (userId, businessId) => {
  const business = await prisma.appointmentBusiness.findFirst({
    where: { id: businessId, ownerId: userId, isDeleted: false }
  });
  return business;
};

const toDecimal = (v) => (v != null && v !== '' ? new Decimal(Number(v)) : null);

// --- Gelir/Gider (FinanceEntry) ---

exports.getFinanceEntries = async (req, res, next) => {
  try {
    const { id: businessId } = req.params;
    const { type, start, end, limit = 100 } = req.query;
    const business = await ensureBusinessAccess(req.user.id, businessId);
    if (!business) {
      return res.status(404).json({ success: false, message: 'İşletme bulunamadı' });
    }
    const where = { businessId, isDeleted: false };
    if (type && ['INCOME', 'EXPENSE'].includes(type)) where.type = type;
    if (start && end) {
      where.date = {
        gte: new Date(start),
        lte: new Date(end)
      };
    }
    const entries = await prisma.financeEntry.findMany({
      where,
      include: {
        appointment: { select: { id: true, startAt: true, status: true } }
      },
      orderBy: { date: 'desc' },
      take: Math.min(parseInt(limit, 10) || 100, 500)
    });
    res.json({ success: true, data: entries });
  } catch (error) {
    next(error);
  }
};

exports.createFinanceEntry = async (req, res, next) => {
  try {
    const { id: businessId } = req.params;
    const { type, amount, date, category, description, appointmentId } = req.body;
    const business = await ensureBusinessAccess(req.user.id, businessId);
    if (!business) {
      return res.status(404).json({ success: false, message: 'İşletme bulunamadı' });
    }
    if (!type || !['INCOME', 'EXPENSE'].includes(type)) {
      return res.status(400).json({ success: false, message: 'Geçerli tür girin (INCOME veya EXPENSE)' });
    }
    const amt = toDecimal(amount);
    if (!amt || amt.lte(0)) {
      return res.status(400).json({ success: false, message: 'Geçerli tutar girin' });
    }
    const entryDate = date ? new Date(date) : new Date();
    const entry = await prisma.financeEntry.create({
      data: {
        businessId,
        type,
        amount: amt,
        date: entryDate,
        category: (category || '').trim() || (type === 'INCOME' ? 'Diğer' : 'Diğer'),
        description: (description || '').trim() || null,
        appointmentId: appointmentId || null
      }
    });
    res.status(201).json({ success: true, data: entry });
  } catch (error) {
    next(error);
  }
};

exports.updateFinanceEntry = async (req, res, next) => {
  try {
    const { id: businessId, entryId } = req.params;
    const { type, amount, date, category, description } = req.body;
    const business = await ensureBusinessAccess(req.user.id, businessId);
    if (!business) {
      return res.status(404).json({ success: false, message: 'İşletme bulunamadı' });
    }
    const existing = await prisma.financeEntry.findFirst({
      where: { id: entryId, businessId, isDeleted: false }
    });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Kayıt bulunamadı' });
    }
    const data = {};
    if (type && ['INCOME', 'EXPENSE'].includes(type)) data.type = type;
    const amt = toDecimal(amount);
    if (amt && amt.gt(0)) data.amount = amt;
    if (date) data.date = new Date(date);
    if (category !== undefined) data.category = (category || '').trim() || 'Diğer';
    if (description !== undefined) data.description = (description || '').trim() || null;
    const entry = await prisma.financeEntry.update({
      where: { id: entryId },
      data
    });
    res.json({ success: true, data: entry });
  } catch (error) {
    next(error);
  }
};

exports.deleteFinanceEntry = async (req, res, next) => {
  try {
    const { id: businessId, entryId } = req.params;
    const business = await ensureBusinessAccess(req.user.id, businessId);
    if (!business) {
      return res.status(404).json({ success: false, message: 'İşletme bulunamadı' });
    }
    const existing = await prisma.financeEntry.findFirst({
      where: { id: entryId, businessId, isDeleted: false }
    });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Kayıt bulunamadı' });
    }
    await prisma.financeEntry.update({
      where: { id: entryId },
      data: { isDeleted: true, deletedAt: new Date() }
    });
    res.json({ success: true, message: 'Silindi' });
  } catch (error) {
    next(error);
  }
};

// --- Özet (gelir/gider toplamları) ---
exports.getFinanceSummary = async (req, res, next) => {
  try {
    const { id: businessId } = req.params;
    const { start, end } = req.query;
    const business = await ensureBusinessAccess(req.user.id, businessId);
    if (!business) {
      return res.status(404).json({ success: false, message: 'İşletme bulunamadı' });
    }
    const now = new Date();
    const startDate = start ? new Date(start) : new Date(now.getFullYear(), now.getMonth(), 1);
    const endDate = end ? new Date(end) : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    const where = { businessId, isDeleted: false, date: { gte: startDate, lte: endDate } };
    const [incomeRows, expenseRows] = await Promise.all([
      prisma.financeEntry.aggregate({ where: { ...where, type: 'INCOME' }, _sum: { amount: true } }),
      prisma.financeEntry.aggregate({ where: { ...where, type: 'EXPENSE' }, _sum: { amount: true } })
    ]);
    const totalIncome = Number(incomeRows._sum?.amount || 0);
    const totalExpense = Number(expenseRows._sum?.amount || 0);
    const receivables = await prisma.receivable.findMany({
      where: { businessId, isDeleted: false },
      include: { customer: { select: { id: true, fullName: true, phone: true } }, payments: true }
    });
    const paidByReceivable = Object.fromEntries(
      receivables.map((r) => [r.id, r.payments.reduce((s, p) => s + Number(p.amount), 0)])
    );
    const totalReceivableAmount = receivables.reduce((s, r) => s + Number(r.totalAmount), 0);
    const totalPaidReceivable = receivables.reduce((s, r) => s + (paidByReceivable[r.id] || 0), 0);
    const totalOutstanding = totalReceivableAmount - totalPaidReceivable;
    res.json({
      success: true,
      data: {
        totalIncome,
        totalExpense,
        net: totalIncome - totalExpense,
        totalReceivable: totalReceivableAmount,
        totalPaidReceivable,
        totalOutstanding,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
};

// --- Alacaklar (Receivable) ---

exports.getReceivables = async (req, res, next) => {
  try {
    const { id: businessId } = req.params;
    const business = await ensureBusinessAccess(req.user.id, businessId);
    if (!business) {
      return res.status(404).json({ success: false, message: 'İşletme bulunamadı' });
    }
    const receivables = await prisma.receivable.findMany({
      where: { businessId, isDeleted: false },
      include: {
        customer: { select: { id: true, fullName: true, phone: true } },
        payments: { orderBy: { paidAt: 'desc' } }
      },
      orderBy: { createdAt: 'desc' }
    });
    const withRemaining = receivables.map((r) => {
      const paid = r.payments.reduce((s, p) => s + Number(p.amount), 0);
      const total = Number(r.totalAmount);
      const remaining = total - paid;
      return {
        ...r,
        paidAmount: paid,
        remainingAmount: remaining,
        status: remaining <= 0 ? 'PAID' : paid > 0 ? 'PARTIAL' : 'PENDING'
      };
    });
    res.json({ success: true, data: withRemaining });
  } catch (error) {
    next(error);
  }
};

exports.createReceivable = async (req, res, next) => {
  try {
    const { id: businessId } = req.params;
    const { customerId, totalAmount, dueDate, description } = req.body;
    const business = await ensureBusinessAccess(req.user.id, businessId);
    if (!business) {
      return res.status(404).json({ success: false, message: 'İşletme bulunamadı' });
    }
    const customer = await prisma.appointmentCustomer.findFirst({
      where: { id: customerId, businessId, isDeleted: false }
    });
    if (!customer) {
      return res.status(400).json({ success: false, message: 'Müşteri bulunamadı' });
    }
    const amt = toDecimal(totalAmount);
    if (!amt || amt.lte(0)) {
      return res.status(400).json({ success: false, message: 'Geçerli tutar girin' });
    }
    const receivable = await prisma.receivable.create({
      data: {
        businessId,
        customerId,
        totalAmount: amt,
        dueDate: dueDate ? new Date(dueDate) : null,
        description: (description || '').trim() || null
      },
      include: { customer: { select: { id: true, fullName: true, phone: true } }, payments: true }
    });
    res.status(201).json({ success: true, data: receivable });
  } catch (error) {
    next(error);
  }
};

exports.addReceivablePayment = async (req, res, next) => {
  try {
    const { id: businessId, receivableId } = req.params;
    const { amount, paidAt, notes } = req.body;
    const business = await ensureBusinessAccess(req.user.id, businessId);
    if (!business) {
      return res.status(404).json({ success: false, message: 'İşletme bulunamadı' });
    }
    const receivable = await prisma.receivable.findFirst({
      where: { id: receivableId, businessId, isDeleted: false },
      include: { payments: true }
    });
    if (!receivable) {
      return res.status(404).json({ success: false, message: 'Alacak bulunamadı' });
    }
    const paidSoFar = receivable.payments.reduce((s, p) => s + Number(p.amount), 0);
    const total = Number(receivable.totalAmount);
    const remaining = total - paidSoFar;
    const amt = toDecimal(amount);
    if (!amt || amt.lte(0)) {
      return res.status(400).json({ success: false, message: 'Geçerli tutar girin' });
    }
    if (Number(amt) > remaining) {
      return res.status(400).json({ success: false, message: 'Ödeme tutarı kalan borçtan fazla olamaz' });
    }
    const payment = await prisma.receivablePayment.create({
      data: {
        receivableId,
        amount: amt,
        paidAt: paidAt ? new Date(paidAt) : new Date(),
        notes: (notes || '').trim() || null
      }
    });
    const updated = await prisma.receivable.findUnique({
      where: { id: receivableId },
      include: { customer: { select: { id: true, fullName: true, phone: true } }, payments: true }
    });
    res.status(201).json({ success: true, data: { payment, receivable: updated } });
  } catch (error) {
    next(error);
  }
};

exports.deleteReceivable = async (req, res, next) => {
  try {
    const { id: businessId, receivableId } = req.params;
    const business = await ensureBusinessAccess(req.user.id, businessId);
    if (!business) {
      return res.status(404).json({ success: false, message: 'İşletme bulunamadı' });
    }
    const existing = await prisma.receivable.findFirst({
      where: { id: receivableId, businessId, isDeleted: false }
    });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Alacak bulunamadı' });
    }
    await prisma.receivable.update({
      where: { id: receivableId },
      data: { isDeleted: true, deletedAt: new Date() }
    });
    res.json({ success: true, message: 'Silindi' });
  } catch (error) {
    next(error);
  }
};
