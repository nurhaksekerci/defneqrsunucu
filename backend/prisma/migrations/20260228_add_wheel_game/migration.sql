-- CreateTable
CREATE TABLE IF NOT EXISTS "wheel_game_settings" (
    "id" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "title" TEXT NOT NULL DEFAULT 'Şansını Dene!',
    "description" TEXT,
    "segments" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "wheel_game_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "wheel_spins" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "prizeType" TEXT NOT NULL,
    "prizeValue" JSONB NOT NULL,
    "spunAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "wheel_spins_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "wheel_spins_userId_idx" ON "wheel_spins"("userId");
CREATE INDEX IF NOT EXISTS "wheel_spins_spunAt_idx" ON "wheel_spins"("spunAt");

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'wheel_spins_userId_fkey'
    ) THEN
        ALTER TABLE "wheel_spins" ADD CONSTRAINT "wheel_spins_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- Seed default wheel settings
INSERT INTO "wheel_game_settings" ("id", "isEnabled", "title", "description", "segments", "createdAt", "updatedAt")
SELECT 
    gen_random_uuid()::text,
    true,
    'Şansını Dene!',
    'Günde 1 kez çevir, Premium deneme süresi kazan!',
    '[
        {"label":"1 Gün Premium","type":"subscription_days","value":1,"color":"#ef4444"},
        {"label":"Tekrar Dene","type":"message","value":"","color":"#f59e0b"},
        {"label":"3 Gün Premium","type":"subscription_days","value":3,"color":"#10b981"},
        {"label":"Premium''a Geç","type":"message","value":"","color":"#6366f1"},
        {"label":"5 Gün Premium","type":"subscription_days","value":5,"color":"#ec4899"},
        {"label":"Şanslısın!","type":"message","value":"","color":"#8b5cf6"}
    ]'::jsonb,
    NOW(),
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM "wheel_game_settings" LIMIT 1);
