/**
 * Randevu Hatırlatıcı Job
 * 24 saat ve 1 saat önce SMS + Email hatırlatması gönderir
 */
const prisma = require('../config/database');
const logger = require('../utils/logger');
const { sendSmsAndLog } = require('../utils/smsService');
const { sendAppointmentReminderEmail } = require('../utils/emailService');

const REMINDER_TYPES = [
  { type: '24H', hoursBefore: 24, windowMinutes: 30 },
  { type: '1H', hoursBefore: 1, windowMinutes: 30 },
];

function formatDateTR(date) {
  return date.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function formatTimeTR(date) {
  return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
}

async function runReminderJob() {
  const now = new Date();

  for (const { type, hoursBefore, windowMinutes } of REMINDER_TYPES) {
    const targetFrom = new Date(now.getTime() + (hoursBefore * 60 - windowMinutes / 2) * 60 * 1000);
    const targetTo = new Date(now.getTime() + (hoursBefore * 60 + windowMinutes / 2) * 60 * 1000);

    const appointments = await prisma.appointment.findMany({
      where: {
        startAt: { gte: targetFrom, lte: targetTo },
        status: { in: ['PENDING', 'CONFIRMED'] },
        reminders: {
          none: { channel: 'SMS', reminderType: type }
        }
      },
      include: {
        business: true,
        staff: true,
        service: true,
        customer: true,
      },
    });

    for (const apt of appointments) {
      try {
        const dateStr = formatDateTR(apt.startAt);
        const timeStr = formatTimeTR(apt.startAt);
        const businessName = apt.business.name;
        const serviceName = apt.service.name;
        const staffName = apt.staff.fullName;
        const customerName = apt.customer.fullName;
        const phone = apt.customer.phone;
        const email = apt.customer.email;
        const address = apt.business.address;

        const smsMessage = [
          `${businessName}`,
          `Sayın ${customerName},`,
          `${dateStr} saat ${timeStr} için ${serviceName} (${staffName}) randevunuz bulunmaktadır.`,
          address ? `Konum: ${address}` : '',
        ].filter(Boolean).join('\n');

        const mapsUrl = address
          ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
          : null;
        const smsWithLocation = mapsUrl ? `${smsMessage}\n${mapsUrl}` : smsMessage;

        const smsResult = await sendSmsAndLog({
          businessId: apt.businessId,
          phone,
          message: smsWithLocation.length > 160 ? smsMessage : smsWithLocation,
        });

        if (smsResult.success) {
          await prisma.appointmentReminder.create({
            data: { appointmentId: apt.id, channel: 'SMS', reminderType: type },
          }).catch(() => {});
        }

        if (email) {
          const emailSent = await sendAppointmentReminderEmail({
            to: email,
            customerName,
            businessName,
            serviceName,
            staffName,
            appointmentDate: dateStr,
            appointmentTime: timeStr,
            address,
          });

          if (emailSent) {
            await prisma.appointmentReminder.create({
              data: { appointmentId: apt.id, channel: 'EMAIL', reminderType: type },
            }).catch(() => {});
          }
        }

        logger.info('Randevu hatırlatması gönderildi', {
          appointmentId: apt.id,
          type,
          customer: customerName,
          channel: email ? 'SMS+EMAIL' : 'SMS',
        });
      } catch (err) {
        logger.error('Randevu hatırlatması gönderilemedi', {
          appointmentId: apt.id,
          type,
          error: err.message,
        });
      }
    }
  }
}

let intervalId = null;

function startAppointmentReminderJob() {
  const INTERVAL_MS = 15 * 60 * 1000;

  runReminderJob().catch((err) => {
    logger.error('Randevu hatırlatıcı ilk çalıştırma hatası', { error: err.message });
  });

  intervalId = setInterval(() => {
    runReminderJob().catch((err) => {
      logger.error('Randevu hatırlatıcı job hatası', { error: err.message });
    });
  }, INTERVAL_MS);

  logger.info('[Appointment Reminder] Job başlatıldı (her 15 dakika)');
}

function stopAppointmentReminderJob() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    logger.info('[Appointment Reminder] Job durduruldu');
  }
}

module.exports = {
  startAppointmentReminderJob,
  stopAppointmentReminderJob,
  runReminderJob,
};
