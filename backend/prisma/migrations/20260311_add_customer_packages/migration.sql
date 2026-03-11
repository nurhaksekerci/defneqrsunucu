-- CreateTable
CREATE TABLE "customer_packages" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "totalSessions" INTEGER NOT NULL,
    "remainingSessions" INTEGER NOT NULL,
    "purchasedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "expiryWarningSentAt" TIMESTAMP(3),
    "notes" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "customer_packages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "package_usages" (
    "id" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "usedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "package_usages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "customer_packages_businessId_idx" ON "customer_packages"("businessId");
CREATE INDEX "customer_packages_customerId_idx" ON "customer_packages"("customerId");
CREATE INDEX "customer_packages_serviceId_idx" ON "customer_packages"("serviceId");
CREATE INDEX "customer_packages_expiresAt_idx" ON "customer_packages"("expiresAt");
CREATE INDEX "customer_packages_isDeleted_idx" ON "customer_packages"("isDeleted");

-- CreateIndex
CREATE UNIQUE INDEX "package_usages_appointmentId_key" ON "package_usages"("appointmentId");
CREATE INDEX "package_usages_packageId_idx" ON "package_usages"("packageId");
CREATE INDEX "package_usages_appointmentId_idx" ON "package_usages"("appointmentId");

-- AddForeignKey
ALTER TABLE "customer_packages" ADD CONSTRAINT "customer_packages_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "appointment_businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "customer_packages" ADD CONSTRAINT "customer_packages_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "appointment_customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "customer_packages" ADD CONSTRAINT "customer_packages_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "appointment_services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_usages" ADD CONSTRAINT "package_usages_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "customer_packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "package_usages" ADD CONSTRAINT "package_usages_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
