const prisma = require('../config/database');

const ensureBusinessAccess = async (userId, businessId) => {
  const business = await prisma.appointmentBusiness.findFirst({
    where: { id: businessId, ownerId: userId, isDeleted: false }
  });
  if (!business) return null;
  return business;
};

exports.getCustomers = async (req, res, next) => {
  try {
    const { id: businessId } = req.params;
    const { q } = req.query;
    const business = await ensureBusinessAccess(req.user.id, businessId);
    if (!business) {
      return res.status(404).json({ success: false, message: 'İşletme bulunamadı' });
    }
    const where = { businessId, isDeleted: false };
    if (q && String(q).trim()) {
      const search = String(q).trim();
      const searchDigits = search.replace(/\D/g, '');
      const conditions = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
      ];
      if (searchDigits.length >= 3 && searchDigits !== search) {
        conditions.push({ phone: { contains: searchDigits } });
      }
      where.OR = conditions;
    }
    const customers = await prisma.appointmentCustomer.findMany({
      where,
      orderBy: { fullName: 'asc' }
    });
    res.json({ success: true, data: customers });
  } catch (error) {
    next(error);
  }
};

exports.getCustomerDetail = async (req, res, next) => {
  try {
    const { id: businessId, customerId } = req.params;
    const business = await ensureBusinessAccess(req.user.id, businessId);
    if (!business) {
      return res.status(404).json({ success: false, message: 'İşletme bulunamadı' });
    }
    const customer = await prisma.appointmentCustomer.findFirst({
      where: { id: customerId, businessId, isDeleted: false }
    });
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Müşteri bulunamadı' });
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);

    const [appointments, receivables, packages, financeEntries] = await Promise.all([
      prisma.appointment.findMany({
        where: { businessId, customerId, status: { notIn: ['CANCELLED'] } },
        include: {
          staff: { select: { id: true, fullName: true } },
          service: { select: { id: true, name: true, duration: true, price: true } },
        },
        orderBy: { startAt: 'desc' },
        take: 100,
      }),
      prisma.receivable.findMany({
        where: { businessId, customerId, isDeleted: false },
        include: { payments: { orderBy: { paidAt: 'desc' } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.customerPackage.findMany({
        where: { businessId, customerId, isDeleted: false, remainingSessions: { gt: 0 } },
        include: { service: { select: { id: true, name: true } } },
      }),
      prisma.financeEntry.findMany({
        where: {
          businessId,
          isDeleted: false,
          appointment: { customerId },
        },
        include: { appointment: { select: { id: true, startAt: true, status: true } } },
        orderBy: { date: 'desc' },
        take: 50,
      }),
    ]);

    const receivablesWithRemaining = receivables.map((r) => {
      const paid = r.payments.reduce((s, p) => s + Number(p.amount), 0);
      const total = Number(r.totalAmount);
      return {
        ...r,
        paidAmount: paid,
        remainingAmount: total - paid,
        status: total - paid <= 0 ? 'PAID' : paid > 0 ? 'PARTIAL' : 'PENDING',
      };
    });

    const totalDebt = receivablesWithRemaining.reduce((s, r) => s + (r.remainingAmount > 0 ? r.remainingAmount : 0), 0);

    const upcomingAppointments = appointments.filter((a) => new Date(a.startAt) >= todayStart);
    const pastAppointments = appointments.filter((a) => new Date(a.startAt) < todayStart);

    res.json({
      success: true,
      data: {
        customer,
        upcomingAppointments: upcomingAppointments.slice(0, 20),
        pastAppointments: pastAppointments.slice(0, 30),
        receivables: receivablesWithRemaining,
        totalDebt,
        packages,
        financeEntries,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.createCustomer = async (req, res, next) => {
  try {
    const { id: businessId } = req.params;
    const { fullName, phone, email } = req.body;
    const business = await ensureBusinessAccess(req.user.id, businessId);
    if (!business) {
      return res.status(404).json({ success: false, message: 'İşletme bulunamadı' });
    }
    if (!fullName?.trim() || !phone?.trim()) {
      return res.status(400).json({ success: false, message: 'Ad soyad ve telefon zorunludur' });
    }
    const customer = await prisma.appointmentCustomer.create({
      data: {
        businessId,
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: email?.trim() || null
      }
    });
    res.status(201).json({ success: true, data: customer });
  } catch (error) {
    next(error);
  }
};
