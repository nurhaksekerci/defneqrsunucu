-- CreateEnum
CREATE TYPE "Project" AS ENUM ('defneqr', 'defnerandevu');

-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW', 'POSTPONED');

-- AlterEnum (UserRole - add BUSINESS_OWNER, APPOINTMENT_STAFF)
ALTER TYPE "UserRole" ADD VALUE 'BUSINESS_OWNER';
ALTER TYPE "UserRole" ADD VALUE 'APPOINTMENT_STAFF';

-- AlterTable (support_tickets - add project)
ALTER TABLE "support_tickets" ADD COLUMN "project" "Project" NOT NULL DEFAULT 'defneqr';

-- CreateIndex
CREATE INDEX "support_tickets_project_idx" ON "support_tickets"("project");

-- CreateTable (DefneRandevu)
CREATE TABLE "appointment_businesses" (
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
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "appointment_businesses_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "appointment_businesses_slug_key" ON "appointment_businesses"("slug");

CREATE INDEX "appointment_businesses_ownerId_idx" ON "appointment_businesses"("ownerId");
CREATE INDEX "appointment_businesses_slug_idx" ON "appointment_businesses"("slug");
CREATE INDEX "appointment_businesses_isDeleted_idx" ON "appointment_businesses"("isDeleted");

CREATE TABLE "appointment_staff" (
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
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "appointment_staff_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "appointment_staff_businessId_idx" ON "appointment_staff"("businessId");
CREATE INDEX "appointment_staff_isDeleted_idx" ON "appointment_staff"("isDeleted");

CREATE TABLE "appointment_services" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "description" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "appointment_services_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "appointment_services_businessId_idx" ON "appointment_services"("businessId");
CREATE INDEX "appointment_services_isDeleted_idx" ON "appointment_services"("isDeleted");

CREATE TABLE "appointment_staff_services" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "duration" INTEGER,
    "price" DECIMAL(10,2),

    CONSTRAINT "appointment_staff_services_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "appointment_staff_services_staffId_serviceId_key" ON "appointment_staff_services"("staffId", "serviceId");
CREATE INDEX "appointment_staff_services_staffId_idx" ON "appointment_staff_services"("staffId");
CREATE INDEX "appointment_staff_services_serviceId_idx" ON "appointment_staff_services"("serviceId");

CREATE TABLE "appointment_working_hours" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "staffId" TEXT,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "isClosed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "appointment_working_hours_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "appointment_working_hours_businessId_idx" ON "appointment_working_hours"("businessId");
CREATE INDEX "appointment_working_hours_staffId_idx" ON "appointment_working_hours"("staffId");
CREATE INDEX "appointment_working_hours_businessId_staffId_dayOfWeek_idx" ON "appointment_working_hours"("businessId", "staffId", "dayOfWeek");

CREATE TABLE "appointment_customers" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "appointment_customers_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "appointment_customers_businessId_idx" ON "appointment_customers"("businessId");
CREATE INDEX "appointment_customers_phone_idx" ON "appointment_customers"("phone");
CREATE INDEX "appointment_customers_isDeleted_idx" ON "appointment_customers"("isDeleted");

CREATE TABLE "appointments" (
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
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "appointments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "appointments_businessId_idx" ON "appointments"("businessId");
CREATE INDEX "appointments_staffId_idx" ON "appointments"("staffId");
CREATE INDEX "appointments_customerId_idx" ON "appointments"("customerId");
CREATE INDEX "appointments_startAt_idx" ON "appointments"("startAt");
CREATE INDEX "appointments_status_idx" ON "appointments"("status");
CREATE INDEX "appointments_businessId_startAt_idx" ON "appointments"("businessId", "startAt");

CREATE TABLE "appointment_sms_logs" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "smsHeader" TEXT,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT,
    "providerResponse" TEXT,

    CONSTRAINT "appointment_sms_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "appointment_sms_logs_businessId_idx" ON "appointment_sms_logs"("businessId");
CREATE INDEX "appointment_sms_logs_sentAt_idx" ON "appointment_sms_logs"("sentAt");

-- AddForeignKey
ALTER TABLE "appointment_businesses" ADD CONSTRAINT "appointment_businesses_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointment_staff" ADD CONSTRAINT "appointment_staff_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "appointment_businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointment_services" ADD CONSTRAINT "appointment_services_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "appointment_businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointment_staff_services" ADD CONSTRAINT "appointment_staff_services_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "appointment_staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointment_staff_services" ADD CONSTRAINT "appointment_staff_services_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "appointment_services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointment_working_hours" ADD CONSTRAINT "appointment_working_hours_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "appointment_businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointment_working_hours" ADD CONSTRAINT "appointment_working_hours_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "appointment_staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointment_customers" ADD CONSTRAINT "appointment_customers_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "appointment_businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "appointment_businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "appointment_staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "appointment_services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "appointment_customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointment_sms_logs" ADD CONSTRAINT "appointment_sms_logs_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "appointment_businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
