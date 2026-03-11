const prisma = require('../config/database');
const crypto = require('crypto');
const { addRecurrence } = require('../utils/recurrenceHelper');

const ensureBusinessAccess = async (userId, businessId) => {
  const business = await prisma.appointmentBusiness.findFirst({
    where: { id: businessId, ownerId: userId, isDeleted: false }
  });
  if (!business) return null;
  return business;
};

/**
 * Müsait saat dilimlerini döndürür (personel + hizmet + tarih seçildiğinde)
 * Çalışma saatleri ve mevcut randevulara göre dolu slotlar hariç tutulur
 */
exports.getAvailableSlots = async (req, res, next) => {
  try {
    const { id: businessId } = req.params;
    const { staffId, serviceId, date } = req.query;
    const business = await ensureBusinessAccess(req.user.id, businessId);
    if (!business) {
      return res.status(404).json({ success: false, message: 'İşletme bulunamadı' });
    }
    if (!staffId || !serviceId || !date) {
      return res.status(400).json({ success: false, message: 'staffId, serviceId ve date zorunludur' });
    }
    const [service, staff] = await Promise.all([
      prisma.appointmentService.findFirst({ where: { id: serviceId, businessId, isDeleted: false } }),
      prisma.appointmentStaff.findFirst({ where: { id: staffId, businessId, isDeleted: false } })
    ]);
    if (!service) return res.status(400).json({ success: false, message: 'Hizmet bulunamadı' });
    if (!staff) return res.status(400).json({ success: false, message: 'Personel bulunamadı' });

    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    const dayOfWeek = targetDate.getDay(); // 0=Pazar, 1=Pazartesi, ...

    // Çalışma saatleri: önce personel bazlı, yoksa işletme bazlı, yoksa varsayılan 09:00-18:00
    let startTime = '09:00';
    let endTime = '18:00';
    let isClosed = false;

    const staffHours = await prisma.appointmentWorkingHours.findFirst({
      where: { businessId, staffId, dayOfWeek }
    });
    const businessHours = await prisma.appointmentWorkingHours.findFirst({
      where: { businessId, staffId: null, dayOfWeek }
    });
    const wh = staffHours || businessHours;
    if (wh) {
      isClosed = wh.isClosed;
      if (!isClosed) {
        startTime = wh.startTime;
        endTime = wh.endTime;
      }
    }

    if (isClosed) {
      return res.json({ success: true, data: [] });
    }

    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    const dayStart = new Date(targetDate);
    dayStart.setHours(startH, startM, 0, 0);
    const dayEnd = new Date(targetDate);
    dayEnd.setHours(endH, endM, 0, 0);

    const durationMs = service.duration * 60 * 1000;

    // O gün personelin randevuları (iptal hariç) - çalışma saatleri ile örtüşenler
    const appointments = await prisma.appointment.findMany({
      where: {
        businessId,
        staffId,
        status: { notIn: ['CANCELLED'] },
        startAt: { lt: dayEnd },
        endAt: { gt: dayStart }
      },
      select: { startAt: true, endAt: true }
    });

    const slots = [];
    const slotInterval = 15; // 15 dakika aralıklarla slot üret
    let current = new Date(dayStart);

    while (current.getTime() + durationMs <= dayEnd.getTime()) {
      const slotStart = new Date(current);
      const slotEnd = new Date(current.getTime() + durationMs);

      const overlaps = appointments.some((a) => {
        const appStart = new Date(a.startAt);
        const appEnd = new Date(a.endAt);
        return slotStart < appEnd && slotEnd > appStart;
      });

      if (!overlaps) {
        const timeStr = slotStart.toTimeString().slice(0, 5);
        slots.push({ start: timeStr, end: slotEnd.toTimeString().slice(0, 5) });
      }

      current.setMinutes(current.getMinutes() + slotInterval);
    }

    res.json({ success: true, data: slots });
  } catch (error) {
    next(error);
  }
};

exports.getAppointments = async (req, res, next) => {
  try {
    const { id: businessId } = req.params;
    const { start, end } = req.query;
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Oturum gerekli' });
    }
    const business = await ensureBusinessAccess(userId, businessId);
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
    const logger = require('../utils/logger');
    logger.error('getAppointments hatası', {
      error: error.message,
      code: error.code,
      businessId: req.params?.id,
      stack: error.stack
    });
    next(error);
  }
};

exports.createAppointment = async (req, res, next) => {
  try {
    const { id: businessId } = req.params;
    const { staffId, serviceId, customerId, startAt, notes, recurrenceType, recurrenceEndDate } = req.body;
    const business = await ensureBusinessAccess(req.user.id, businessId);
    if (!business) {
      return res.status(404).json({ success: false, message: 'İşletme bulunamadı' });
    }
    if (!staffId || !serviceId || !customerId || !startAt) {
      return res.status(400).json({ success: false, message: 'Personel, hizmet, müşteri ve başlangıç saati zorunludur' });
    }
    const [service, staff, customer] = await Promise.all([
      prisma.appointmentService.findFirst({ where: { id: serviceId, businessId, isDeleted: false } }),
      prisma.appointmentStaff.findFirst({ where: { id: staffId, businessId, isDeleted: false } }),
      prisma.appointmentCustomer.findFirst({ where: { id: customerId, businessId, isDeleted: false } })
    ]);
    if (!service) {
      return res.status(400).json({ success: false, message: 'Hizmet bulunamadı' });
    }
    if (!staff) {
      return res.status(400).json({ success: false, message: 'Personel bulunamadı' });
    }
    if (!customer) {
      return res.status(400).json({ success: false, message: 'Müşteri bulunamadı' });
    }
    const start = new Date(startAt);
    const end = new Date(start.getTime() + service.duration * 60 * 1000);
    const validRecurrence = ['WEEKLY', 'BIWEEKLY', 'MONTHLY'].includes(recurrenceType);
    const seriesId = validRecurrence ? (crypto.randomUUID?.() || `series-${Date.now()}`) : null;
    const recEnd = validRecurrence && recurrenceEndDate ? new Date(recurrenceEndDate) : null;

    const appointment = await prisma.appointment.create({
      data: {
        businessId,
        staffId,
        serviceId,
        customerId,
        startAt: start,
        endAt: end,
        notes: notes?.trim() || null,
        seriesId,
        recurrenceType: validRecurrence ? recurrenceType : null,
        recurrenceEndDate: recEnd
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
    const { staffId, serviceId, startAt, status, notes, usePackageId } = req.body;
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

    if (status === 'COMPLETED' && usePackageId) {
      const pkg = await prisma.customerPackage.findFirst({
        where: {
          id: usePackageId,
          businessId,
          isDeleted: false,
          customerId: existing.customerId,
          serviceId: existing.serviceId,
          remainingSessions: { gt: 0 }
        }
      });
      if (pkg) {
        const expired = pkg.expiresAt && new Date(pkg.expiresAt) < new Date();
        if (!expired) {
          await prisma.$transaction([
            prisma.packageUsage.create({
              data: { packageId: pkg.id, appointmentId }
            }),
            prisma.customerPackage.update({
              where: { id: pkg.id },
              data: { remainingSessions: { decrement: 1 } }
            })
          ]);
        }
      }
    }

    if (status === 'COMPLETED' && existing.seriesId && existing.recurrenceType && existing.recurrenceEndDate) {
      const nextStart = addRecurrence(appointment.startAt, existing.recurrenceType);
      if (nextStart && nextStart <= new Date(existing.recurrenceEndDate)) {
        const nextEnd = new Date(nextStart.getTime() + existing.service.duration * 60 * 1000);
        const conflict = await prisma.appointment.findFirst({
          where: {
            businessId,
            staffId: appointment.staffId,
            status: { notIn: ['CANCELLED'] },
            startAt: { lt: nextEnd },
            endAt: { gt: nextStart }
          }
        });
        if (!conflict) {
          await prisma.appointment.create({
            data: {
              businessId,
              staffId: appointment.staffId,
              serviceId: appointment.serviceId,
              customerId: appointment.customerId,
              startAt: nextStart,
              endAt: nextEnd,
              notes: existing.notes,
              seriesId: existing.seriesId,
              recurrenceType: existing.recurrenceType,
              recurrenceEndDate: existing.recurrenceEndDate
            }
          });
        }
      }
    }

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
