-- AlterTable
ALTER TABLE "plans" ADD COLUMN     "extraRestaurantPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "isPopular" BOOLEAN NOT NULL DEFAULT false;
