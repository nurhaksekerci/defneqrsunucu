-- CreateEnum (idempotent)
DO $$ BEGIN
  CREATE TYPE "TicketPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "TicketStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'WAITING_CUSTOMER', 'RESOLVED', 'CLOSED');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "TicketCategory" AS ENUM ('TECHNICAL', 'BILLING', 'FEATURE_REQUEST', 'BUG_REPORT', 'GENERAL');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- CreateTable (idempotent)
CREATE TABLE IF NOT EXISTS "support_tickets" (
    "id" TEXT NOT NULL,
    "ticketNumber" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "restaurantId" TEXT,
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "TicketCategory" NOT NULL,
    "priority" "TicketPriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "TicketStatus" NOT NULL DEFAULT 'OPEN',
    "assignedToId" TEXT,
    "resolution" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "resolvedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "closedAt" TIMESTAMP(3),

    CONSTRAINT "support_tickets_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ticket_messages" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "isInternal" BOOLEAN NOT NULL DEFAULT false,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ticket_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex (idempotent)
CREATE UNIQUE INDEX IF NOT EXISTS "support_tickets_ticketNumber_key" ON "support_tickets"("ticketNumber");
CREATE INDEX IF NOT EXISTS "support_tickets_userId_idx" ON "support_tickets"("userId");
CREATE INDEX IF NOT EXISTS "support_tickets_restaurantId_idx" ON "support_tickets"("restaurantId");
CREATE INDEX IF NOT EXISTS "support_tickets_status_idx" ON "support_tickets"("status");
CREATE INDEX IF NOT EXISTS "support_tickets_priority_idx" ON "support_tickets"("priority");
CREATE INDEX IF NOT EXISTS "support_tickets_category_idx" ON "support_tickets"("category");
CREATE INDEX IF NOT EXISTS "support_tickets_assignedToId_idx" ON "support_tickets"("assignedToId");
CREATE INDEX IF NOT EXISTS "support_tickets_createdAt_idx" ON "support_tickets"("createdAt");
CREATE INDEX IF NOT EXISTS "ticket_messages_ticketId_idx" ON "ticket_messages"("ticketId");
CREATE INDEX IF NOT EXISTS "ticket_messages_authorId_idx" ON "ticket_messages"("authorId");
CREATE INDEX IF NOT EXISTS "ticket_messages_createdAt_idx" ON "ticket_messages"("createdAt");

-- AddForeignKey (idempotent)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'support_tickets_userId_fkey') THEN
    ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'support_tickets_restaurantId_fkey') THEN
    ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'support_tickets_assignedToId_fkey') THEN
    ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'support_tickets_resolvedById_fkey') THEN
    ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ticket_messages_ticketId_fkey') THEN
    ALTER TABLE "ticket_messages" ADD CONSTRAINT "ticket_messages_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "support_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ticket_messages_authorId_fkey') THEN
    ALTER TABLE "ticket_messages" ADD CONSTRAINT "ticket_messages_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;
