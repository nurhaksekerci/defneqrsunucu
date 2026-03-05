#!/usr/bin/env node
/**
 * Referral tablosuna rejectionReason sütununu ekler.
 * Migration çalışmazsa bu script ile manuel eklenebilir.
 *
 * Kullanım:
 *   node scripts/add-referral-rejection-reason.js
 *   docker compose exec backend node scripts/add-referral-rejection-reason.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "referrals" 
      ADD COLUMN IF NOT EXISTS "rejectionReason" TEXT;
    `);
    console.log('✅ rejectionReason sütunu eklendi veya zaten mevcut.');
  } catch (err) {
    console.error('❌ Hata:', err.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
