-- =============================================================================
-- Safe Additive Migration: Consolidate DeviceToken as Single Source of Truth
-- IntriHub Push Notification System
-- =============================================================================

-- Step 1: Add appType column with default 'user' (user | business)
ALTER TABLE "DeviceToken" ADD COLUMN IF NOT EXISTS "appType" VARCHAR(32) NOT NULL DEFAULT 'user';

-- Step 2: Add isActive column with default true
ALTER TABLE "DeviceToken" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true;

-- Step 3: Create index on appType for fast targeted queries
CREATE INDEX IF NOT EXISTS "DeviceToken_appType_idx" ON "DeviceToken"("appType");

-- Step 4: Backfill appType on existing DeviceToken rows based on role and appVersion
UPDATE "DeviceToken"
SET "appType" = 'business'
WHERE "role" IN ('vendor', 'rider', 'admin', 'cpo')
   OR "appVersion" LIKE '1.0.%';

UPDATE "DeviceToken"
SET "appType" = 'user'
WHERE "appType" IS NULL
   OR ("role" = 'customer' AND ("appVersion" IS NULL OR "appVersion" LIKE '1.2.%'));

-- Step 5: Safe Additive Migration from MobilePushToken into DeviceToken
-- Inserts any tokens present in MobilePushToken that are missing from DeviceToken
INSERT INTO "DeviceToken" ("id", "userId", "role", "platform", "appType", "token", "isActive", "lastSeenAt", "createdAt", "updatedAt")
SELECT 
    'mig_' || substr(md5(random()::text || clock_timestamp()::text), 1, 20),
    m."userId",
    COALESCE(u."role", 'customer'),
    COALESCE(m."platform", 'android'),
    CASE WHEN COALESCE(u."role", 'customer') IN ('vendor', 'rider', 'admin', 'cpo') THEN 'business' ELSE 'user' END,
    m."token",
    true,
    COALESCE(m."updatedAt", NOW()),
    COALESCE(m."createdAt", NOW()),
    NOW()
FROM "MobilePushToken" m
LEFT JOIN "User" u ON u."id" = m."userId"
WHERE m."token" IS NOT NULL
  AND m."token" NOT IN (SELECT "token" FROM "DeviceToken")
ON CONFLICT ("token") DO NOTHING;

-- Step 6: Safe Additive Migration from User.pushToken into DeviceToken
-- Inserts any tokens present in User.pushToken that are missing from DeviceToken
INSERT INTO "DeviceToken" ("id", "userId", "role", "platform", "appType", "token", "isActive", "lastSeenAt", "createdAt", "updatedAt")
SELECT 
    'mig_usr_' || substr(md5(random()::text || clock_timestamp()::text), 1, 16),
    u."id",
    u."role",
    'android',
    CASE WHEN u."role" IN ('vendor', 'rider', 'admin', 'cpo') THEN 'business' ELSE 'user' END,
    u."pushToken",
    true,
    NOW(),
    NOW(),
    NOW()
FROM "User" u
WHERE u."pushToken" IS NOT NULL
  AND u."pushToken" NOT IN (SELECT "token" FROM "DeviceToken")
ON CONFLICT ("token") DO NOTHING;

-- Step 7: 60-Day Stale Token Deactivation Sweep
UPDATE "DeviceToken"
SET "isActive" = false
WHERE "lastSeenAt" < NOW() - INTERVAL '60 days';
