-- Ücretsiz ve ücretli planlar için ayrı gün süreleri (idempotent)
-- Not: information_schema.column_name lowercase döner
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='affiliate_settings' AND column_name='daysperreferralfree') THEN
    ALTER TABLE "affiliate_settings" ADD COLUMN "daysPerReferralFree" INTEGER DEFAULT 7;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='affiliate_settings' AND column_name='daysperreferralpaid') THEN
    ALTER TABLE "affiliate_settings" ADD COLUMN "daysPerReferralPaid" INTEGER DEFAULT 14;
  END IF;
END $$;

UPDATE "affiliate_settings" SET "daysPerReferralFree" = COALESCE("daysPerReferral", 7), "daysPerReferralPaid" = COALESCE("daysPerReferral", 14) WHERE "daysPerReferralFree" IS NULL OR "daysPerReferralPaid" IS NULL;

-- Ücretsiz plan için onay bekleyen referral'lar (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='referrals' AND column_name='pendingdaysapproval') THEN
    ALTER TABLE "referrals" ADD COLUMN "pendingDaysApproval" BOOLEAN NOT NULL DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='referrals' AND column_name='daysawarded') THEN
    ALTER TABLE "referrals" ADD COLUMN "daysAwarded" INTEGER;
  END IF;
END $$;
