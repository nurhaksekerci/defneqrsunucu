-- CreateTable
CREATE TABLE "menu_scans" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "scannedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "menu_scans_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "menu_scans_restaurantId_scannedAt_idx" ON "menu_scans"("restaurantId", "scannedAt");

-- AddForeignKey
ALTER TABLE "menu_scans" ADD CONSTRAINT "menu_scans_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
