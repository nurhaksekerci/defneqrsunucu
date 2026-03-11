-- Affiliate davet edilen kullanıcılar için indirim oranı
ALTER TABLE "affiliate_settings" ADD COLUMN IF NOT EXISTS "referralDiscountPercent" DOUBLE PRECISION NOT NULL DEFAULT 0;
