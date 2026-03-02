#!/usr/bin/env node
/**
 * Çark oyunu tablolarını oluşturur.
 * docker compose exec backend node scripts/add-wheel-tables.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "wheel_game_settings" (
        "id" TEXT NOT NULL,
        "isEnabled" BOOLEAN NOT NULL DEFAULT true,
        "title" TEXT NOT NULL DEFAULT 'Şansını Dene!',
        "description" TEXT,
        "segments" JSONB NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "wheel_game_settings_pkey" PRIMARY KEY ("id")
      );
    `);
    console.log('✓ wheel_game_settings tablosu oluşturuldu');

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "wheel_spins" (
        "id" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "prizeType" TEXT NOT NULL,
        "prizeValue" JSONB NOT NULL,
        "spunAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "wheel_spins_pkey" PRIMARY KEY ("id")
      );
    `);
    console.log('✓ wheel_spins tablosu oluşturuldu');

    await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "wheel_spins_userId_idx" ON "wheel_spins"("userId")');
    await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "wheel_spins_spunAt_idx" ON "wheel_spins"("spunAt")');
    console.log('✓ İndeksler oluşturuldu');

    const [row] = await prisma.$queryRawUnsafe('SELECT COUNT(*)::int as c FROM "wheel_game_settings"');
    if (Number(row?.c ?? 1) === 0) {
      const { randomUUID } = require('crypto');
      const segments = JSON.stringify([
        { label: '1 Gün Premium', type: 'subscription_days', value: 1, color: '#ef4444' },
        { label: 'Tekrar Dene', type: 'message', value: '', color: '#f59e0b' },
        { label: '3 Gün Premium', type: 'subscription_days', value: 3, color: '#10b981' },
        { label: "Premium'a Geç", type: 'message', value: '', color: '#6366f1' },
        { label: '5 Gün Premium', type: 'subscription_days', value: 5, color: '#ec4899' },
        { label: 'Şanslısın!', type: 'message', value: '', color: '#8b5cf6' }
      ]).replace(/'/g, "''");
      const id = randomUUID();
      await prisma.$executeRawUnsafe(`
        INSERT INTO "wheel_game_settings" ("id", "isEnabled", "title", "description", "segments", "createdAt", "updatedAt")
        VALUES ('${id}', true, 'Şansını Dene!', 'Günde 1 kez çevir, Premium deneme süresi kazan!', '${segments}'::jsonb, NOW(), NOW())
      `);
    }
    console.log('✓ Varsayılan ayarlar eklendi');
  } catch (err) {
    console.error('Hata:', err.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
