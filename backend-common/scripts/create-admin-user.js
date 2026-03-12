/**
 * Admin kullanıcısı oluşturur
 *
 * Sunucuda (Docker):
 *   docker compose exec backend-common node scripts/create-admin-user.js
 *
 * Lokal:
 *   cd backend-common && node scripts/create-admin-user.js
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const ADMIN_EMAIL = 'admin@defneqr.com';
const ADMIN_PASSWORD = 'admin123';
const ADMIN_FULLNAME = 'Sistem Yöneticisi';

async function main() {
  const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);

  const existing = await prisma.user.findUnique({
    where: { email: ADMIN_EMAIL }
  });

  if (existing) {
    await prisma.user.update({
      where: { email: ADMIN_EMAIL },
      data: {
        password: hashedPassword,
        role: 'ADMIN',
        isDeleted: false
      }
    });
    console.log(`✓ Admin hesabı güncellendi: ${ADMIN_EMAIL}`);
  } else {
    await prisma.user.create({
      data: {
        email: ADMIN_EMAIL,
        fullName: ADMIN_FULLNAME,
        password: hashedPassword,
        role: 'ADMIN'
      }
    });
    console.log(`✓ Admin hesabı oluşturuldu: ${ADMIN_EMAIL}`);
  }

  console.log(`  Şifre: ${ADMIN_PASSWORD}`);
  console.log(`  Giriş: https://defneqr.com/auth/login veya https://admin.defneqr.com/auth/login`);
}

main()
  .catch((e) => {
    console.error('Hata:', e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
