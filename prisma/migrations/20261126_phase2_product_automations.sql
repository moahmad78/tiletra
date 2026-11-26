-- Phase 2 Additive Migration: Product Automations (Back in Stock & Price Drop)
-- Strictly additive, safe for production

ALTER TABLE "StoreSettings" ADD COLUMN IF NOT EXISTS "backInStockEnabled" BOOLEAN DEFAULT true;
ALTER TABLE "StoreSettings" ADD COLUMN IF NOT EXISTS "priceDropEnabled" BOOLEAN DEFAULT true;
ALTER TABLE "StoreSettings" ADD COLUMN IF NOT EXISTS "automationTemplates" JSONB;
