-- AlterTable
ALTER TABLE "appointments" ADD COLUMN "seriesId" TEXT;
ALTER TABLE "appointments" ADD COLUMN "recurrenceType" TEXT;
ALTER TABLE "appointments" ADD COLUMN "recurrenceEndDate" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "appointments_seriesId_idx" ON "appointments"("seriesId");
