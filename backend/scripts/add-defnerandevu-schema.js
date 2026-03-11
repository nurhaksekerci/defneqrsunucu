#!/usr/bin/env node
/**
 * DefneRandevu şema değişikliklerini uygular.
 * Project enum, support_tickets.project, DefneRandevu tabloları.
 * prisma migrate deploy başarısız olursa veya manuel uygulama gerekiyorsa bu script'i çalıştırın.
 *
 * Docker ile çalıştırma:
 *   docker compose exec backend node scripts/add-defnerandevu-schema.js
 *
 * Yerel:
 *   node scripts/add-defnerandevu-schema.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runSql(sql, desc) {
  try {
    await prisma.$executeRawUnsafe(sql);
    console.log(`✓ ${desc}`);
    return true;
  } catch (err) {
    if (err.code === '42710' || err.code === '42P07' || err.message?.includes('already exists')) {
      console.log(`○ ${desc} (zaten mevcut)`);
      return true;
    }
    throw err;
  }
}

async function main() {
  console.log('🔄 DefneRandevu şema değişiklikleri uygulanıyor...\n');

  // 1. Project enum
  await runSql(
    `DO $$ BEGIN CREATE TYPE "Project" AS ENUM ('defneqr', 'defnerandevu'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
    'Project enum'
  );

  // 2. AppointmentStatus enum
  await runSql(
    `DO $$ BEGIN CREATE TYPE "AppointmentStatus" AS ENUM ('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW', 'POSTPONED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
    'AppointmentStatus enum'
  );

  // 3. UserRole - BUSINESS_OWNER, APPOINTMENT_STAFF (PostgreSQL ADD VALUE doesn't support IF NOT EXISTS)
  try {
    await prisma.$executeRawUnsafe(`ALTER TYPE "UserRole" ADD VALUE 'BUSINESS_OWNER'`);
    console.log('✓ UserRole BUSINESS_OWNER');
  } catch (e) {
    if (e.code !== '42710') throw e;
    console.log('○ UserRole BUSINESS_OWNER (zaten mevcut)');
  }
  try {
    await prisma.$executeRawUnsafe(`ALTER TYPE "UserRole" ADD VALUE 'APPOINTMENT_STAFF'`);
    console.log('✓ UserRole APPOINTMENT_STAFF');
  } catch (e) {
    if (e.code !== '42710') throw e;
    console.log('○ UserRole APPOINTMENT_STAFF (zaten mevcut)');
  }

  // 4. support_tickets.project
  await runSql(
    `ALTER TABLE "support_tickets" ADD COLUMN IF NOT EXISTS "project" "Project" NOT NULL DEFAULT 'defneqr'`,
    'support_tickets.project'
  );

  // 5. Index (IF NOT EXISTS for PostgreSQL 9.5+)
  try {
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "support_tickets_project_idx" ON "support_tickets"("project")`);
    console.log('✓ support_tickets_project_idx');
  } catch (e) {
    if (e.code === '42P07') console.log('○ support_tickets_project_idx (zaten mevcut)');
    else throw e;
  }

  // 6. DefneRandevu tabloları - migration SQL'den çalıştır
  const steps = [
    [
      `CREATE TABLE IF NOT EXISTS "appointment_businesses" (
        "id" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "slug" TEXT NOT NULL,
        "description" TEXT,
        "address" TEXT,
        "phone" TEXT,
        "logo" TEXT,
        "ownerId" TEXT NOT NULL,
        "isDeleted" BOOLEAN NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "deletedAt" TIMESTAMP(3),
        CONSTRAINT "appointment_businesses_pkey" PRIMARY KEY ("id")
      )`,
      'appointment_businesses'
    ],
    [
      `CREATE UNIQUE INDEX IF NOT EXISTS "appointment_businesses_slug_key" ON "appointment_businesses"("slug")`,
      'appointment_businesses slug index'
    ],
    [
      `CREATE TABLE IF NOT EXISTS "appointment_staff" (
        "id" TEXT NOT NULL,
        "businessId" TEXT NOT NULL,
        "fullName" TEXT NOT NULL,
        "phone" TEXT,
        "specialty" TEXT,
        "color" TEXT,
        "notes" TEXT,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "isDeleted" BOOLEAN NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "deletedAt" TIMESTAMP(3),
        CONSTRAINT "appointment_staff_pkey" PRIMARY KEY ("id")
      )`,
      'appointment_staff'
    ],
    [
      `CREATE TABLE IF NOT EXISTS "appointment_services" (
        "id" TEXT NOT NULL,
        "businessId" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "duration" INTEGER NOT NULL,
        "price" DECIMAL(10,2) NOT NULL,
        "description" TEXT,
        "isDeleted" BOOLEAN NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "deletedAt" TIMESTAMP(3),
        CONSTRAINT "appointment_services_pkey" PRIMARY KEY ("id")
      )`,
      'appointment_services'
    ],
    [
      `CREATE TABLE IF NOT EXISTS "appointment_staff_services" (
        "id" TEXT NOT NULL,
        "staffId" TEXT NOT NULL,
        "serviceId" TEXT NOT NULL,
        "duration" INTEGER,
        "price" DECIMAL(10,2),
        CONSTRAINT "appointment_staff_services_pkey" PRIMARY KEY ("id")
      )`,
      'appointment_staff_services'
    ],
    [
      `CREATE TABLE IF NOT EXISTS "appointment_working_hours" (
        "id" TEXT NOT NULL,
        "businessId" TEXT NOT NULL,
        "staffId" TEXT,
        "dayOfWeek" INTEGER NOT NULL,
        "startTime" TEXT NOT NULL,
        "endTime" TEXT NOT NULL,
        "isClosed" BOOLEAN NOT NULL DEFAULT false,
        CONSTRAINT "appointment_working_hours_pkey" PRIMARY KEY ("id")
      )`,
      'appointment_working_hours'
    ],
    [
      `CREATE TABLE IF NOT EXISTS "appointment_customers" (
        "id" TEXT NOT NULL,
        "businessId" TEXT NOT NULL,
        "fullName" TEXT NOT NULL,
        "phone" TEXT NOT NULL,
        "email" TEXT,
        "isDeleted" BOOLEAN NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "deletedAt" TIMESTAMP(3),
        CONSTRAINT "appointment_customers_pkey" PRIMARY KEY ("id")
      )`,
      'appointment_customers'
    ],
    [
      `CREATE TABLE IF NOT EXISTS "appointments" (
        "id" TEXT NOT NULL,
        "businessId" TEXT NOT NULL,
        "staffId" TEXT NOT NULL,
        "serviceId" TEXT NOT NULL,
        "customerId" TEXT NOT NULL,
        "startAt" TIMESTAMP(3) NOT NULL,
        "endAt" TIMESTAMP(3) NOT NULL,
        "status" "AppointmentStatus" NOT NULL DEFAULT 'PENDING',
        "notes" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "appointments_pkey" PRIMARY KEY ("id")
      )`,
      'appointments'
    ],
    [
      `CREATE TABLE IF NOT EXISTS "appointment_sms_logs" (
        "id" TEXT NOT NULL,
        "businessId" TEXT NOT NULL,
        "phone" TEXT NOT NULL,
        "message" TEXT NOT NULL,
        "smsHeader" TEXT,
        "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "status" TEXT,
        "providerResponse" TEXT,
        CONSTRAINT "appointment_sms_logs_pkey" PRIMARY KEY ("id")
      )`,
      'appointment_sms_logs'
    ]
  ];

  for (const [sql, desc] of steps) {
    await runSql(sql, desc);
  }

  // Foreign keys - sadece yoksa ekle
  const fkStatements = [
    ['appointment_businesses', 'ownerId', 'users'],
    ['appointment_staff', 'businessId', 'appointment_businesses'],
    ['appointment_services', 'businessId', 'appointment_businesses'],
    ['appointment_staff_services', 'staffId', 'appointment_staff'],
    ['appointment_staff_services', 'serviceId', 'appointment_services'],
    ['appointment_working_hours', 'businessId', 'appointment_businesses'],
    ['appointment_working_hours', 'staffId', 'appointment_staff'],
    ['appointment_customers', 'businessId', 'appointment_businesses'],
    ['appointments', 'businessId', 'appointment_businesses'],
    ['appointments', 'staffId', 'appointment_staff'],
    ['appointments', 'serviceId', 'appointment_services'],
    ['appointments', 'customerId', 'appointment_customers'],
    ['appointment_sms_logs', 'businessId', 'appointment_businesses']
  ];

  for (const [table, col, ref] of fkStatements) {
    const fkName = `${table}_${col}_fkey`;
    try {
      const exists = await prisma.$queryRawUnsafe(
        `SELECT 1 FROM pg_constraint WHERE conname = '${fkName}'`
      );
      if (!exists || exists.length === 0) {
        const refTable = ref === 'users' ? 'users' : ref;
        const onDel = ref === 'users' ? 'RESTRICT' : 'CASCADE';
        await prisma.$executeRawUnsafe(
          `ALTER TABLE "${table}" ADD CONSTRAINT "${fkName}" FOREIGN KEY ("${col}") REFERENCES "${refTable}"("id") ON DELETE ${onDel} ON UPDATE CASCADE`
        );
        console.log(`✓ FK ${fkName}`);
      } else {
        console.log(`○ FK ${fkName} (zaten mevcut)`);
      }
    } catch (e) {
      if (e.code === '42710') console.log(`○ FK ${fkName} (zaten mevcut)`);
      else throw e;
    }
  }

  // Unique constraint staffId+serviceId
  try {
    await prisma.$executeRawUnsafe(
      `CREATE UNIQUE INDEX IF NOT EXISTS "appointment_staff_services_staffId_serviceId_key" ON "appointment_staff_services"("staffId", "serviceId")`
    );
    console.log('✓ appointment_staff_services unique');
  } catch (e) {
    if (e.code === '42P07') console.log('○ appointment_staff_services unique (zaten mevcut)');
    else throw e;
  }

  console.log('\n✅ DefneRandevu şema değişiklikleri tamamlandı.');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ Hata:', err.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
