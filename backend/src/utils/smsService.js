/**
 * SMS Servisi - NetGSM API (Türkiye)
 * Randevu hatırlatmaları ve bildirimler için
 */
const logger = require('./logger');
const prisma = require('../config/database');

const NETGSM_API = 'https://api.netgsm.com.tr/sms/send/get';

/**
 * NetGSM ile SMS gönder
 * @param {Object} options - { phone, message, header? }
 * @returns {Promise<{ success: boolean, providerResponse?: string }>}
 */
async function sendSms({ phone, message, header }) {
  const usr = process.env.NETGSM_USER;
  const pwd = process.env.NETGSM_PASS;
  const defaultHeader = process.env.NETGSM_HEADER || 'DEFNERANDEVU';

  if (!usr || !pwd) {
    logger.warn('NetGSM yapılandırması eksik. SMS gönderilemez.', { hasUser: !!usr, hasPass: !!pwd });
    return { success: false, providerResponse: 'SMS yapılandırması eksik' };
  }

  const gsm = phone.replace(/\D/g, '');
  if (gsm.length < 10) {
    logger.warn('Geçersiz telefon numarası', { phone });
    return { success: false, providerResponse: 'Geçersiz telefon' };
  }

  const msgHeader = header || defaultHeader;
  const params = new URLSearchParams({
    usr,
    pwd,
    gsm,
    msg: message,
    msgheader: msgHeader,
  });

  try {
    const res = await fetch(`${NETGSM_API}?${params.toString()}`, { method: 'GET' });
    const text = await res.text();
    const code = text.trim();

    if (code.startsWith('00') || code === '0') {
      logger.info('SMS gönderildi', { phone: gsm.slice(-4) + '****', header: msgHeader });
      return { success: true, providerResponse: code };
    }

    logger.warn('SMS gönderilemedi', { phone: gsm.slice(-4) + '****', code });
    return { success: false, providerResponse: code };
  } catch (error) {
    logger.error('SMS gönderim hatası', { error: error.message });
    return { success: false, providerResponse: error.message };
  }
}

/**
 * SMS gönder ve AppointmentSmsLog'a kaydet
 */
async function sendSmsAndLog({ businessId, phone, message, header }) {
  const result = await sendSms({ phone, message, header });
  try {
    await prisma.appointmentSmsLog.create({
      data: {
        businessId,
        phone,
        message,
        smsHeader: header || process.env.NETGSM_HEADER || 'DEFNERANDEVU',
        status: result.success ? 'success' : 'failed',
        providerResponse: result.providerResponse,
      },
    });
  } catch (logErr) {
    logger.error('SMS log kaydedilemedi', { error: logErr.message });
  }
  return result;
}

module.exports = {
  sendSms,
  sendSmsAndLog,
};
