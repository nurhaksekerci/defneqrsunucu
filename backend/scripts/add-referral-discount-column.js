#!/usr/bin/env node
/**
 * Affiliate davet edilen kullanıcı indirimi sütununu ekler.
 * docker compose exec backend node scripts/add-referral-discount-column.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "affiliate_settings" 
      ADD COLUMN IF NOT EXISTS "referralDiscountPercent" DOUBLE PRECISION NOT NULL DEFAULT 0;
    `);
    console.log('✓ referralDiscountPercent sütunu eklendi');
  } catch (err) {
    console.error('Hata:', err.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
