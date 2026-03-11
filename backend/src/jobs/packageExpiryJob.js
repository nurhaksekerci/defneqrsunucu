/**
 * Paket Bitiş Uyarı Job
 * Süresi yaklaşan paketler için müşteriye SMS gönderir (7 gün kala)
 */
const prisma = require('../config/database');
const logger = require('../utils/logger');
const { sendSmsAndLog } = require('../utils/smsService');

const WARNING_DAYS = 7;

async function runPackageExpiryJob() {
  const now = new Date();
  const future = new Date(now);
  future.setDate(future.getDate() + WARNING_DAYS);

  const packages = await prisma.customerPackage.findMany({
    where: {
      isDeleted: false,
      remainingSessions: { gt: 0 },
      expiresAt: { gte: now, lte: future },
      expiryWarningSentAt: null
    },
    include: {
      business: true,
      customer: true,
      service: true,
    },
  });

  for (const pkg of packages) {
    try {
      const daysLeft = Math.ceil((new Date(pkg.expiresAt) - now) / (24 * 60 * 60 * 1000));
      const message = [
        pkg.business.name,
        `Sayın ${pkg.customer.fullName},`,
        `${pkg.service.name} paketinizde ${pkg.remainingSessions} seans kaldı.`,
        `Paket süreniz ${daysLeft} gün içinde dolacak.`,
      ].join('\n');

      const smsResult = await sendSmsAndLog({
        businessId: pkg.businessId,
        phone: pkg.customer.phone,
        message: message.slice(0, 160),
      });

      if (smsResult.success) {
        await prisma.customerPackage.update({
          where: { id: pkg.id },
          data: { expiryWarningSentAt: new Date() },
        });
        logger.info('Paket bitiş uyarısı gönderildi', {
          packageId: pkg.id,
          customer: pkg.customer.fullName,
        });
      }
    } catch (err) {
      logger.error('Paket bitiş uyarısı gönderilemedi', {
        packageId: pkg.id,
        error: err.message,
      });
    }
  }
}

let intervalId = null;

function startPackageExpiryJob() {
  const INTERVAL_MS = 24 * 60 * 60 * 1000; // Günde 1 kez

  runPackageExpiryJob().catch((err) => {
    logger.error('Paket bitiş job ilk çalıştırma hatası', { error: err.message });
  });

  intervalId = setInterval(() => {
    runPackageExpiryJob().catch((err) => {
      logger.error('Paket bitiş job hatası', { error: err.message });
    });
  }, INTERVAL_MS);

  logger.info('[Package Expiry] Job başlatıldı (günde 1 kez)');
}

module.exports = {
  startPackageExpiryJob,
  runPackageExpiryJob,
};
