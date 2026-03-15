-- AlterTable
ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "images" JSONB;
