-- AlterTable
ALTER TABLE "system_settings" ADD COLUMN     "enableGoogleAuth" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "maintenanceMode" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "siteDescription" TEXT NOT NULL DEFAULT 'QR Menü ve Restoran Yönetim Sistemi',
ADD COLUMN     "siteName" TEXT NOT NULL DEFAULT 'DijitalMenu',
ADD COLUMN     "supportEmail" TEXT NOT NULL DEFAULT 'destek@dijitalmenu.com';
