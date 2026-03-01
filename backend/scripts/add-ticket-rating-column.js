#!/usr/bin/env node
/**
 * Ticket rating sütununu ekler.
 * prisma migrate deploy "No pending migrations" döndürüyorsa bu script'i çalıştırın.
 *
 * Kullanım (Docker):
 *   docker compose exec backend node scripts/add-ticket-rating-column.js
 *
 * Kullanım (yerel):
 *   node scripts/add-ticket-rating-column.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.$executeRawUnsafe(
      'ALTER TABLE "support_tickets" ADD COLUMN IF NOT EXISTS "rating" INTEGER'
    );
    console.log('✓ rating sütunu eklendi (veya zaten mevcut)');
  } catch (err) {
    console.error('Hata:', err.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
