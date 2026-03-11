-- Ücretsiz ve ücretli planlar için ayrı gün süreleri (idempotent)
ALTER TABLE "affiliate_settings" ADD COLUMN IF NOT EXISTS "daysPerReferralFree" INTEGER DEFAULT 7;
ALTER TABLE "affiliate_settings" ADD COLUMN IF NOT EXISTS "daysPerReferralPaid" INTEGER DEFAULT 14;

UPDATE "affiliate_settings" SET "daysPerReferralFree" = COALESCE("daysPerReferralFree", 7), "daysPerReferralPaid" = COALESCE("daysPerReferralPaid", 14) WHERE "daysPerReferralFree" IS NULL OR "daysPerReferralPaid" IS NULL;

-- Ücretsiz plan için onay bekleyen referral'lar (idempotent)
ALTER TABLE "referrals" ADD COLUMN IF NOT EXISTS "pendingDaysApproval" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "referrals" ADD COLUMN IF NOT EXISTS "daysAwarded" INTEGER;
