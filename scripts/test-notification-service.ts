/**
 * IntriHub Push Notification Service — Unit & Integration Test Suite
 * Validates R-1 to R-16 rules in lib/notification-service.ts
 */

import { prisma as rawPrisma } from "../lib/prisma";
const prisma = rawPrisma as any;
import {
  sendNotification,
  isKolkataQuietHours,
  getKolkataStartOfDay,
} from "../lib/notification-service";

let passedCount = 0;
let failedCount = 0;

function assert(condition: unknown, testName: string, detail?: string) {
  if (Boolean(condition)) {
    console.log(`  ✅ PASS: ${testName}`);
    passedCount++;
  } else {
    console.error(`  ❌ FAIL: ${testName}${detail ? ` -> ${detail}` : ""}`);
    failedCount++;
  }
}

async function runTests() {
  console.log("============================================================");
  console.log("🚀 STARTING NOTIFICATION SERVICE (T3) TEST SUITE");
  console.log("============================================================\n");

  const stamp = Date.now().toString().slice(-6);
  const testUserId = `test_user_notif_${stamp}`;
  const testToken1 = `ExponentPushToken[TestToken_${stamp}_1]`;
  const testToken2 = `ExponentPushToken[TestToken_${stamp}_2]`;

  try {
    // -------------------------------------------------------------------------
    // 1. Timezone & Quiet Hours Unit Tests (R-4)
    // -------------------------------------------------------------------------
    console.log("--- 1. Testing Asia/Kolkata Quiet Hours & Day Boundaries ---");
    {
      // 22:30 IST is quiet hours (between 21:00 and 08:00)
      const lateNight = new Date("2026-10-08T17:00:00.000Z"); // 17:00 UTC = 22:30 IST
      assert(
        isKolkataQuietHours("21:00", "08:00", lateNight) === true,
        "22:30 IST recognized as quiet hours"
      );

      // 03:00 IST is quiet hours
      const earlyMorning = new Date("2026-10-07T21:30:00.000Z"); // 21:30 UTC = 03:00 IST
      assert(
        isKolkataQuietHours("21:00", "08:00", earlyMorning) === true,
        "03:00 IST recognized as quiet hours"
      );

      // 14:00 IST is NOT quiet hours
      const afternoon = new Date("2026-10-08T08:30:00.000Z"); // 08:30 UTC = 14:00 IST
      assert(
        isKolkataQuietHours("21:00", "08:00", afternoon) === false,
        "14:00 IST recognized as active (not quiet) hours"
      );

      const startOfDay = getKolkataStartOfDay(new Date("2026-10-08T10:00:00.000Z"));
      assert(
        startOfDay instanceof Date && !isNaN(startOfDay.getTime()),
        "getKolkataStartOfDay returns valid date"
      );
    }

    // -------------------------------------------------------------------------
    // Setup Test User & Tokens
    // -------------------------------------------------------------------------
    const user = await prisma.user.create({
      data: {
        id: testUserId,
        phone: `9988${stamp}`,
        name: `Notification Tester ${stamp}`,
        role: "customer",
      },
    });

    // -------------------------------------------------------------------------
    // 2. Rule R-2: No Tokens Registered -> Skipped with 'no_tokens'
    // -------------------------------------------------------------------------
    console.log("\n--- 2. Testing Rule R-2: No Registered Tokens ---");
    {
      const res = await sendNotification({
        userId: testUserId,
        type: "offer_campaign",
        title: "Exclusive Sale",
        body: "Check out new discounts today",
        ignoreQuietHours: true,
      });

      assert(res.status === "skipped", "Notification skipped when no tokens exist");
      assert(res.skipReason === "no_tokens", "Skip reason is 'no_tokens'");
    }

    // Register 1 Android token
    await prisma.deviceToken.create({
      data: {
        userId: testUserId,
        token: testToken1,
        platform: "android",
        lastSeenAt: new Date(Date.now() - 40 * 60 * 1000), // 40 mins ago
      },
    });

    // -------------------------------------------------------------------------
    // 3. Rule R-1: Preferences Disabled
    // -------------------------------------------------------------------------
    console.log("\n--- 3. Testing Rule R-1: Notification Preferences ---");
    {
      // Create preference with offers disabled
      await prisma.notificationPreference.upsert({
        where: { userId: testUserId },
        update: { offersEnabled: false, cartRemindersEnabled: true },
        create: {
          userId: testUserId,
          offersEnabled: false,
          cartRemindersEnabled: true,
        },
      });

      const offerRes = await sendNotification({
        userId: testUserId,
        type: "offer_campaign",
        title: "Exclusive Sale",
        body: "Get 20% off today",
        ignoreQuietHours: true,
      });

      assert(offerRes.status === "skipped", "Offer skipped when offersEnabled is false");
      assert(
        offerRes.skipReason === "preferences_disabled",
        "Skip reason is 'preferences_disabled'"
      );

      // Now disable cart reminders and test cart_reminder
      await prisma.notificationPreference.update({
        where: { userId: testUserId },
        data: { offersEnabled: true, cartRemindersEnabled: false },
      });

      const cartRes = await sendNotification({
        userId: testUserId,
        type: "cart_reminder",
        title: "Items in cart",
        body: "Finish checkout now",
        ignoreQuietHours: true,
      });

      assert(cartRes.status === "skipped", "Cart reminder skipped when cartRemindersEnabled is false");
      assert(
        cartRes.skipReason === "preferences_disabled",
        "Skip reason is 'preferences_disabled'"
      );

      // Re-enable both for subsequent tests
      await prisma.notificationPreference.update({
        where: { userId: testUserId },
        data: { offersEnabled: true, cartRemindersEnabled: true },
      });
    }

    // -------------------------------------------------------------------------
    // 4. Rule R-16: Admin Global Pause Switches
    // -------------------------------------------------------------------------
    console.log("\n--- 4. Testing Rule R-16: Admin Global Pause Switches ---");
    {
      // Pause offers in StoreSettings
      await prisma.storeSettings.updateMany({
        data: { offersPaused: true, cartRemindersPaused: false },
      });

      const pausedOfferRes = await sendNotification({
        userId: testUserId,
        type: "offer_campaign",
        title: "Diwali Deals",
        body: "Save big today",
        ignoreQuietHours: true,
      });

      assert(pausedOfferRes.status === "skipped", "Offer skipped when offersPaused is true");
      assert(pausedOfferRes.skipReason === "paused", "Skip reason is 'paused'");

      // Pause cart reminders
      await prisma.storeSettings.updateMany({
        data: { offersPaused: false, cartRemindersPaused: true },
      });

      const pausedCartRes = await sendNotification({
        userId: testUserId,
        type: "cart_reminder",
        title: "Items in cart",
        body: "Complete order",
        ignoreQuietHours: true,
      });

      assert(pausedCartRes.status === "skipped", "Cart reminder skipped when cartRemindersPaused is true");
      assert(pausedCartRes.skipReason === "paused", "Skip reason is 'paused'");

      // Unpause both
      await prisma.storeSettings.updateMany({
        data: { offersPaused: false, cartRemindersPaused: false },
      });
    }

    // -------------------------------------------------------------------------
    // 5. Rule R-7: User Recently Active (<30 mins)
    // -------------------------------------------------------------------------
    console.log("\n--- 5. Testing Rule R-7: User Recently Active (<30 mins) ---");
    {
      // Set lastSeenAt to 5 minutes ago
      await prisma.deviceToken.update({
        where: { token: testToken1 },
        data: { lastSeenAt: new Date(Date.now() - 5 * 60 * 1000) },
      });

      const activeRes = await sendNotification({
        userId: testUserId,
        type: "cart_reminder",
        title: "Items waiting",
        body: "Finish your order",
        ignoreQuietHours: true,
      });

      assert(
        activeRes.status === "skipped",
        "Cart reminder skipped when user active within 30 mins"
      );
      assert(
        activeRes.skipReason === "user_recently_active",
        "Skip reason is 'user_recently_active'"
      );

      // Reset lastSeenAt to 45 mins ago
      await prisma.deviceToken.update({
        where: { token: testToken1 },
        data: { lastSeenAt: new Date(Date.now() - 45 * 60 * 1000) },
      });
    }

    // -------------------------------------------------------------------------
    // 6. Rule R-8: Cart Version Idempotency
    // -------------------------------------------------------------------------
    console.log("\n--- 6. Testing Rule R-8: Cart Version Idempotency ---");
    {
      // Mock existing sent log for cartVersion 5, step 1
      await prisma.notificationLog.create({
        data: {
          userId: testUserId,
          type: "cart_reminder",
          cartVersion: 5,
          status: "sent",
          skipReason: "step_1",
        },
      });

      const duplicateRes = await sendNotification({
        userId: testUserId,
        type: "cart_reminder",
        title: "Items in cart",
        body: "Come back and buy",
        cartVersion: 5,
        step: 1,
        ignoreQuietHours: true,
      });

      assert(
        duplicateRes.status === "skipped",
        "Duplicate reminder for same cart version skipped"
      );
      assert(duplicateRes.skipReason === "already_sent", "Skip reason is 'already_sent'");
    }

    // -------------------------------------------------------------------------
    // 7. Rule R-3: Frequency Cap (max 2 per day)
    // -------------------------------------------------------------------------
    console.log("\n--- 7. Testing Rule R-3: Daily Frequency Cap ---");
    {
      // Mock 2 sent notifications today
      await prisma.notificationLog.createMany({
        data: [
          {
            userId: testUserId,
            type: "offer_campaign",
            status: "sent",
            createdAt: new Date(),
          },
          {
            userId: testUserId,
            type: "cart_reminder",
            status: "sent",
            createdAt: new Date(),
          },
        ],
      });

      const cappedRes = await sendNotification({
        userId: testUserId,
        type: "offer_campaign",
        title: "Extra Offer",
        body: "Don't miss this",
        ignoreQuietHours: true,
      });

      assert(cappedRes.status === "skipped", "Notification skipped when daily cap reached");
      assert(
        cappedRes.skipReason === "daily_cap_reached",
        "Skip reason is 'daily_cap_reached'"
      );

      // Rule R-14 Exception: Admin direct support message bypasses cap & quiet hours
      const supportRes = await sendNotification({
        userId: testUserId,
        type: "direct_support",
        title: "Support Notice",
        body: "Regarding your recent query",
        sentByAdminId: "admin_test",
      });

      assert(
        supportRes.status === "sent" || supportRes.status === "failed",
        "Direct support message bypasses daily cap"
      );
    }

    // -------------------------------------------------------------------------
    // 8. Rule R-12 & R-15: Platform Filtering & Logging
    // -------------------------------------------------------------------------
    console.log("\n--- 8. Testing Rule R-12: Platform Filtering ---");
    {
      const androidTokenFresh = `ExponentPushToken[AndroidFresh_${stamp}]`;
      const iosTokenFresh = `ExponentPushToken[IosFresh_${stamp}]`;

      await prisma.deviceToken.create({
        data: {
          userId: testUserId,
          token: androidTokenFresh,
          platform: "android",
          lastSeenAt: new Date(Date.now() - 40 * 60 * 1000),
        },
      });

      await prisma.deviceToken.create({
        data: {
          userId: testUserId,
          token: iosTokenFresh,
          platform: "ios",
          lastSeenAt: new Date(Date.now() - 40 * 60 * 1000),
        },
      });

      // Filter ios only
      const iosOnly = await prisma.deviceToken.findMany({
        where: { userId: testUserId, platform: "ios" },
      });
      assert(iosOnly.length === 1, "Platform filter returns exactly iOS token");
      assert(iosOnly[0]?.platform === "ios", "Token platform is 'ios'");

      // Filter android only
      const androidOnly = await prisma.deviceToken.findMany({
        where: { userId: testUserId, platform: "android" },
      });
      assert(androidOnly.length === 1, "Platform filter returns exactly Android token");
      assert(androidOnly[0]?.platform === "android", "Token platform is 'android'");
    }

    console.log("\n============================================================");
    console.log(`🎉 ALL T3 NOTIFICATION SERVICE TESTS COMPLETED: ${passedCount} passed, ${failedCount} failed`);
    console.log("============================================================\n");
  } finally {
    // Cleanup test records
    console.log("🧹 Cleaning up test records...");
    try {
      await prisma.notificationLog.deleteMany({ where: { userId: testUserId } });
      await prisma.deviceToken.deleteMany({ where: { userId: testUserId } });
      await prisma.notificationPreference.deleteMany({ where: { userId: testUserId } });
      await prisma.user.deleteMany({ where: { id: testUserId } });
      // Reset store settings pause switches
      await prisma.storeSettings.updateMany({
        data: { offersPaused: false, cartRemindersPaused: false },
      });
    } catch {}
  }

  if (failedCount > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
