-- Affiliate davet edilen kullanıcılar için indirim oranı
ALTER TABLE "affiliate_settings" ADD COLUMN "referralDiscountPercent" DOUBLE PRECISION NOT NULL DEFAULT 0;
