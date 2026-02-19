-- CreateTable
CREATE TABLE "system_settings" (
    "id" TEXT NOT NULL,
    "maxRestaurantsPerUser" INTEGER NOT NULL DEFAULT 5,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);
