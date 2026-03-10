#!/usr/bin/env node
/**
 * Users tablosuna avatar sütununu ekler.
 * prisma migrate deploy "No pending migrations" döndürüyorsa veya migration uygulanmamışsa bu script'i çalıştırın.
 *
 * Kullanım (Docker):
 *   docker compose exec backend node scripts/add-user-avatar-column.js
 *
 * Kullanım (yerel):
 *   node scripts/add-user-avatar-column.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.$executeRawUnsafe(
      'ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "avatar" TEXT'
    );
    console.log('✓ avatar sütunu eklendi (veya zaten mevcut)');
  } catch (err) {
    console.error('Hata:', err.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
