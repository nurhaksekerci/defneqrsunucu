const prisma = require('../config/database');

/**
 * Müşterilerin online randevu oluşturması (public - auth gerekmez)
 */
exports.createPublicBooking = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const { staffId, serviceId, fullName, phone, email, startAt, notes } = req.body;

    if (!staffId || !serviceId || !fullName?.trim() || !phone?.trim() || !startAt) {
      return res.status(400).json({
        success: false,
        message: 'Personel, hizmet, ad soyad, telefon ve randevu saati zorunludur.'
      });
    }

    const business = await prisma.appointmentBusiness.findFirst({
      where: { slug, isDeleted: false },
      include: {
        staff: { where: { id: staffId, isActive: true, isDeleted: false } },
        services: { where: { id: serviceId, isDeleted: false } }
      }
    });

    if (!business) {
      return res.status(404).json({ success: false, message: 'İşletme bulunamadı' });
    }

    if (!business.staff?.length) {
      return res.status(400).json({ success: false, message: 'Geçersiz personel seçimi' });
    }
    if (!business.services?.length) {
      return res.status(400).json({ success: false, message: 'Geçersiz hizmet seçimi' });
    }

    const service = business.services[0];
    const start = new Date(startAt);
    const end = new Date(start.getTime() + service.duration * 60 * 1000);

    let customer = await prisma.appointmentCustomer.findFirst({
      where: { businessId: business.id, phone: phone.trim(), isDeleted: false }
    });

    if (!customer) {
      customer = await prisma.appointmentCustomer.create({
        data: {
          businessId: business.id,
          fullName: fullName.trim(),
          phone: phone.trim(),
          email: email?.trim() || null
        }
      });
    } else {
      await prisma.appointmentCustomer.update({
        where: { id: customer.id },
        data: { fullName: fullName.trim(), email: email?.trim() || customer.email }
      });
    }

    const appointment = await prisma.appointment.create({
      data: {
        businessId: business.id,
        staffId,
        serviceId,
        customerId: customer.id,
        startAt: start,
        endAt: end,
        notes: notes?.trim() || null,
        status: 'PENDING'
      },
      include: {
        staff: { select: { id: true, fullName: true } },
        service: { select: { id: true, name: true, duration: true, price: true } },
        customer: { select: { id: true, fullName: true, phone: true } }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Randevunuz başarıyla oluşturuldu.',
      data: appointment
    });
  } catch (error) {
    next(error);
  }
};
