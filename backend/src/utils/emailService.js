/**
 * SMTP Email Servisi
 * Natro kurumsal mail (destek@defneqr.com) ile mail gönderimi
 */
const nodemailer = require('nodemailer');
const logger = require('./logger');

let transporter = null;

/**
 * SMTP transporter oluştur (singleton)
 */
function getTransporter() {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    logger.warn('SMTP yapılandırması eksik. Email gönderilemez.', { hasHost: !!host, hasUser: !!user, hasPass: !!pass });
    return null;
  }

  try {
    transporter = nodemailer.createTransport({
      host,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user,
        pass
      }
    });
    logger.info('SMTP transporter başarıyla oluşturuldu');
  } catch (error) {
    logger.error('SMTP transporter oluşturulamadı:', error);
    return null;
  }

  return transporter;
}

/**
 * Email gönder
 * @param {Object} options - { to, subject, text, html }
 * @returns {Promise<boolean>} - Başarılı ise true
 */
async function sendEmail({ to, subject, text, html }) {
  const transport = getTransporter();
  if (!transport) return false;

  const from = process.env.SMTP_FROM || process.env.SMTP_USER || 'destek@defneqr.com';

  try {
    await transport.sendMail({
      from: `"Defne Qr" <${from}>`,
      to,
      subject,
      text: text || (html ? html.replace(/<[^>]*>/g, '') : ''),
      html: html || text
    });
    logger.info('Email gönderildi', { to, subject });
    return true;
  } catch (error) {
    logger.error('Email gönderilemedi', { to, subject, error: error.message, stack: error.stack });
    return false;
  }
}

/**
 * Şifre sıfırlama emaili gönder
 */
async function sendPasswordResetEmail(to, resetLink, userName = 'Kullanıcı') {
  const subject = 'Defne Qr - Şifre Sıfırlama';
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 24px; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; background: #dc2626; color: white !important; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 16px 0; font-weight: bold; }
    .footer { margin-top: 20px; font-size: 12px; color: #6b7280; }
    .link { word-break: break-all; color: #2563eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔐 Şifre Sıfırlama</h1>
    </div>
    <div class="content">
      <p>Merhaba ${userName},</p>
      <p>Defne Qr hesabınız için şifre sıfırlama talebinde bulundunuz.</p>
      <p>Aşağıdaki butona tıklayarak şifrenizi sıfırlayabilirsiniz:</p>
      <p style="text-align: center;">
        <a href="${resetLink}" class="button">Şifremi Sıfırla</a>
      </p>
      <p>Veya bu linki tarayıcınıza kopyalayın:</p>
      <p class="link">${resetLink}</p>
      <p><strong>Bu link 1 saat geçerlidir.</strong></p>
      <p>Eğer bu talebi siz yapmadıysanız, bu emaili görmezden gelebilirsiniz.</p>
      <div class="footer">
        <p>Defne Qr - QR Menü ve Dijital Menü Sistemi</p>
        <p>destek@defneqr.com</p>
      </div>
    </div>
  </div>
</body>
</html>
  `;

  return sendEmail({ to, subject, html });
}

module.exports = {
  sendEmail,
  sendPasswordResetEmail,
  getTransporter
};
