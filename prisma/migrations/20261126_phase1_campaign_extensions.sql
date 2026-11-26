-- =============================================================================
-- Phase 1 Additive Migration: Campaign Extensions, Festival Calendar, User Birthday
-- =============================================================================

-- 1. Campaign Additive Columns
ALTER TABLE "Campaign" ADD COLUMN IF NOT EXISTS "type" VARCHAR(32) NOT NULL DEFAULT 'OFFER';
ALTER TABLE "Campaign" ADD COLUMN IF NOT EXISTS "accentColor" VARCHAR(32);
ALTER TABLE "Campaign" ADD COLUMN IF NOT EXISTS "ctaLabel" VARCHAR(64);
ALTER TABLE "Campaign" ADD COLUMN IF NOT EXISTS "countdownEndsAt" TIMESTAMP(3);
ALTER TABLE "Campaign" ADD COLUMN IF NOT EXISTS "recurrence" VARCHAR(32) NOT NULL DEFAULT 'none';
ALTER TABLE "Campaign" ADD COLUMN IF NOT EXISTS "expiresAt" TIMESTAMP(3);
ALTER TABLE "Campaign" ADD COLUMN IF NOT EXISTS "appTarget" VARCHAR(32) NOT NULL DEFAULT 'both';
ALTER TABLE "Campaign" ADD COLUMN IF NOT EXISTS "popup" JSONB;
ALTER TABLE "Campaign" ADD COLUMN IF NOT EXISTS "schemaVersion" INTEGER NOT NULL DEFAULT 1;

CREATE INDEX IF NOT EXISTS "Campaign_type_idx" ON "Campaign"("type");
CREATE INDEX IF NOT EXISTS "Campaign_appTarget_idx" ON "Campaign"("appTarget");

-- 2. User Birthday Column (Optional, with Consent Note)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "birthday" TIMESTAMP(3);

-- 3. FestivalEvent Table
CREATE TABLE IF NOT EXISTS "FestivalEvent" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "template" JSONB NOT NULL,
    "autoSend" BOOLEAN NOT NULL DEFAULT true,
    "lastSentYear" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FestivalEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "FestivalEvent_date_idx" ON "FestivalEvent"("date");
