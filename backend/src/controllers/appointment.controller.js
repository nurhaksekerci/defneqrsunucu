const prisma = require('../config/database');

const ensureBusinessAccess = async (userId, businessId) => {
  const business = await prisma.appointmentBusiness.findFirst({
    where: { id: businessId, ownerId: userId, isDeleted: false }
  });
  if (!business) return null;
  return business;
};

exports.getAppointments = async (req, res, next) => {
  try {
    const { id: businessId } = req.params;
    const { start, end } = req.query;
    const business = await ensureBusinessAccess(req.user.id, businessId);
    if (!business) {
      return res.status(404).json({ success: false, message: 'İşletme bulunamadı' });
    }
    const where = { businessId };
    if (start && end) {
      where.startAt = {
        gte: new Date(start),
        lte: new Date(end)
      };
    }
    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        staff: { select: { id: true, fullName: true, color: true } },
        service: { select: { id: true, name: true, duration: true, price: true } },
        customer: { select: { id: true, fullName: true, phone: true } }
      },
      orderBy: { startAt: 'asc' }
    });
    res.json({ success: true, data: appointments });
  } catch (error) {
    next(error);
  }
};

exports.createAppointment = async (req, res, next) => {
  try {
    const { id: businessId } = req.params;
    const { staffId, serviceId, customerId, startAt, notes } = req.body;
    const business = await ensureBusinessAccess(req.user.id, businessId);
    if (!business) {
      return res.status(404).json({ success: false, message: 'İşletme bulunamadı' });
    }
    if (!staffId || !serviceId || !customerId || !startAt) {
      return res.status(400).json({ success: false, message: 'Personel, hizmet, müşteri ve başlangıç saati zorunludur' });
    }
    const service = await prisma.appointmentService.findFirst({
      where: { id: serviceId, businessId, isDeleted: false }
    });
    if (!service) {
      return res.status(400).json({ success: false, message: 'Hizmet bulunamadı' });
    }
    const start = new Date(startAt);
    const end = new Date(start.getTime() + service.duration * 60 * 1000);
    const appointment = await prisma.appointment.create({
      data: {
        businessId,
        staffId,
        serviceId,
        customerId,
        startAt: start,
        endAt: end,
        notes: notes?.trim() || null
      },
      include: {
        staff: { select: { id: true, fullName: true, color: true } },
        service: { select: { id: true, name: true, duration: true, price: true } },
        customer: { select: { id: true, fullName: true, phone: true } }
      }
    });
    res.status(201).json({ success: true, data: appointment });
  } catch (error) {
    next(error);
  }
};

exports.updateAppointment = async (req, res, next) => {
  try {
    const { id: businessId, appointmentId } = req.params;
    const { staffId, serviceId, startAt, status, notes } = req.body;
    const business = await ensureBusinessAccess(req.user.id, businessId);
    if (!business) {
      return res.status(404).json({ success: false, message: 'İşletme bulunamadı' });
    }
    const existing = await prisma.appointment.findFirst({
      where: { id: appointmentId, businessId },
      include: { service: true }
    });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Randevu bulunamadı' });
    }
    const updateData = {};
    if (staffId) updateData.staffId = staffId;
    if (serviceId) {
      const svc = await prisma.appointmentService.findFirst({ where: { id: serviceId, businessId, isDeleted: false } });
      if (svc) updateData.serviceId = serviceId;
    }
    if (startAt) {
      const start = new Date(startAt);
      let duration = existing.service.duration;
      if (updateData.serviceId) {
        const svc = await prisma.appointmentService.findUnique({ where: { id: updateData.serviceId } });
        if (svc) duration = svc.duration;
      }
      updateData.startAt = start;
      updateData.endAt = new Date(start.getTime() + duration * 60 * 1000);
    }
    if (status) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes?.trim() || null;
    const appointment = await prisma.appointment.update({
      where: { id: appointmentId },
      data: updateData,
      include: {
        staff: { select: { id: true, fullName: true, color: true } },
        service: { select: { id: true, name: true, duration: true, price: true } },
        customer: { select: { id: true, fullName: true, phone: true } }
      }
    });
    res.json({ success: true, data: appointment });
  } catch (error) {
    next(error);
  }
};

exports.deleteAppointment = async (req, res, next) => {
  try {
    const { id: businessId, appointmentId } = req.params;
    const business = await ensureBusinessAccess(req.user.id, businessId);
    if (!business) {
      return res.status(404).json({ success: false, message: 'İşletme bulunamadı' });
    }
    const existing = await prisma.appointment.findFirst({
      where: { id: appointmentId, businessId }
    });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Randevu bulunamadı' });
    }
    await prisma.appointment.delete({ where: { id: appointmentId } });
    res.json({ success: true, message: 'Randevu silindi' });
  } catch (error) {
    next(error);
  }
};
