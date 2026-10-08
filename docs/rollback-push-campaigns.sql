-- Rollback script for T2: Push Campaigns and Cart Reminders
-- Run only if rollback is required.
-- All added fields and tables are cleanly dropped without affecting core ecommerce data.

ALTER TABLE "NotificationPreference" DROP COLUMN IF EXISTS "offersEnabled";
ALTER TABLE "NotificationPreference" DROP COLUMN IF EXISTS "cartRemindersEnabled";

ALTER TABLE "StoreSettings" DROP COLUMN IF EXISTS "maxPushPerDay";
ALTER TABLE "StoreSettings" DROP COLUMN IF EXISTS "quietHoursStart";
ALTER TABLE "StoreSettings" DROP COLUMN IF EXISTS "quietHoursEnd";
ALTER TABLE "StoreSettings" DROP COLUMN IF EXISTS "cartReminderDelaysHours";
ALTER TABLE "StoreSettings" DROP COLUMN IF EXISTS "maxCartReminders";
ALTER TABLE "StoreSettings" DROP COLUMN IF EXISTS "offersPaused";
ALTER TABLE "StoreSettings" DROP COLUMN IF EXISTS "cartRemindersPaused";

DROP TABLE IF EXISTS "NotificationLog";
DROP TABLE IF EXISTS "Campaign";
DROP TABLE IF EXISTS "CartReminderState";
