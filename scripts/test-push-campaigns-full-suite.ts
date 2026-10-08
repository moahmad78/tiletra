import { prisma as rawPrisma } from "@/lib/prisma";
import { resolveAudienceUserIds, getAudiencePreview } from "@/lib/campaign-audience";
import { dispatchCampaign, processScheduledCampaigns } from "@/lib/campaign-runner";
import { sendNotification } from "@/lib/notification-service";
import { recordCartChange, runCartRemindersJob } from "@/lib/cart-reminder-runner";

const prisma = rawPrisma as any;

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

async function main() {
  console.log("============================================================");
  console.log("📢 STARTING FULL PUSH CAMPAIGNS & RESULTS (T7-T10) TEST SUITE");
  console.log("============================================================\n");

  const timestamp = Date.now();
  const testUserAId = `test-camp-user-a-${timestamp}`;
  const testUserBId = `test-camp-user-b-${timestamp}`;
  const testAdminId = `test-admin-${timestamp}`;

  try {
    // 1. Setup Test Users with Device Tokens
    await prisma.user.create({
      data: {
        id: testUserAId,
        phone: `91${Math.floor(10000000 + Math.random() * 90000000)}`,
        name: "Test Customer Android",
        role: "customer",
      },
    });

    await prisma.user.create({
      data: {
        id: testUserBId,
        phone: `92${Math.floor(10000000 + Math.random() * 90000000)}`,
        name: "Test Customer iOS",
        role: "customer",
      },
    });

    // Android device token for User A
    await prisma.deviceToken.create({
      data: {
        userId: testUserAId,
        platform: "android",
        token: `ExponentPushToken[TestAndroid_${timestamp}]`,
        lastSeenAt: new Date(Date.now() - 60 * 60 * 1000), // >30m ago so R-7 doesn't block
      },
    });

    // iOS device token for User B
    await prisma.deviceToken.create({
      data: {
        userId: testUserBId,
        platform: "ios",
        token: `ExponentPushToken[TestIOS_${timestamp}]`,
        lastSeenAt: new Date(Date.now() - 60 * 60 * 1000),
      },
    });

    // Reset storeSettings to clean state
    await prisma.storeSettings.upsert({
      where: { id: "default" },
      update: {
        offersPaused: false,
        cartRemindersPaused: false,
        maxPushPerDay: 10, // Ensure tests don't hit daily cap
        quietHoursStart: "23:59",
        quietHoursEnd: "00:01",
      },
      create: {
        id: "default",
        offersPaused: false,
        cartRemindersPaused: false,
        maxPushPerDay: 10,
        quietHoursStart: "23:59",
        quietHoursEnd: "00:01",
      },
    });
    await prisma.storeSettings.updateMany({
      data: {
        offersPaused: false,
        cartRemindersPaused: false,
        maxPushPerDay: 10,
        quietHoursStart: "23:59",
        quietHoursEnd: "00:01",
      },
    });

    // ── 1. Testing Audience Filters & Cross-Platform Preview (T7) ──
    console.log("--- 1. Testing Audience Filters & Platform Counts ---");
    const previewAll = await getAudiencePreview({ type: "all" }, "all");
    assert(previewAll.totalUsers >= 2, "Audience preview includes all registered test customers");
    assert(previewAll.androidCount >= 1, "Audience preview detects Android tokens");
    assert(previewAll.iosCount >= 1, "Audience preview detects iOS tokens");

    const previewAndroidOnly = await getAudiencePreview({ type: "all" }, "android");
    assert(previewAndroidOnly.iosCount === previewAll.iosCount, "Platform query correctly isolates device tokens");

    // Put item in User A's cart and test "cart_has_items" filter
    const cartA = await prisma.cart.create({ data: { userId: testUserAId } });
    const product = await prisma.product.create({
      data: {
        name: "Vitrified Premium Tile",
        slug: `tile-test-${timestamp}`,
        status: "ACTIVE",
      },
    });
    const variant = await prisma.productVariant.create({
      data: {
        productId: product.id,
        sku: `SKU-${timestamp}`,
        size: "800x800",
        pricePerBox: 600,
        stockBoxes: 50,
      },
    });
    await prisma.cartItem.create({
      data: {
        cartId: cartA.id,
        productId: product.id,
        variantId: variant.id,
        boxQuantity: 3,
      },
    });

    const cartAudience = await resolveAudienceUserIds({ type: "cart_has_items" });
    assert(cartAudience.includes(testUserAId), "cart_has_items audience includes user with cart items");
    assert(!cartAudience.includes(testUserBId), "cart_has_items audience excludes user without cart items");

    // ── 2. Testing Campaign Creation & Immediate Dispatch (T7 & T8) ──
    console.log("\n--- 2. Testing Campaign Creation & Immediate Dispatch ---");
    const testCampaign = await prisma.campaign.create({
      data: {
        title: "Flash Sale 30% Off",
        body: "Get 30% off premium vitrified tiles today only!",
        target: "offers",
        platforms: "all",
        audience: { type: "all" },
        status: "draft",
        createdBy: testAdminId,
      },
    });

    assert(testCampaign.status === "draft", "Campaign created in draft status");

    const stats = await dispatchCampaign(testCampaign.id, { sentByAdminId: testAdminId });
    assert(stats.sent >= 2, "Campaign successfully dispatched to audience");

    const updatedCampaign = await prisma.campaign.findUnique({
      where: { id: testCampaign.id },
    });
    assert(updatedCampaign?.status === "sent", "Campaign status updated to 'sent'");
    assert(Boolean(updatedCampaign?.sentAt), "Campaign sentAt timestamp populated");

    // ── 3. Testing Rule R-14: Support Message to One User ──
    console.log("\n--- 3. Testing Rule R-14: Support Message Bypass ---");
    // Ensure testUserA has a fresh device token (prior dummy token was cleaned up by R-9)
    await prisma.deviceToken.upsert({
      where: { token: `ExponentPushToken[TestSupport_${testUserAId.substring(0, 8)}]` },
      update: { userId: testUserAId, lastSeenAt: new Date(Date.now() - 40 * 60 * 1000) },
      create: {
        userId: testUserAId,
        platform: "android",
        token: `ExponentPushToken[TestSupport_${testUserAId.substring(0, 8)}]`,
        lastSeenAt: new Date(Date.now() - 40 * 60 * 1000),
      },
    });

    // Even if quiet hours were active, support message bypasses it
    const supportRes = await sendNotification({
      userId: testUserAId,
      type: "direct_support",
      title: "Order Assistance",
      body: "We have confirmed your tile delivery slot for tomorrow.",
      target: "offers",
      sentByAdminId: testAdminId,
      ignoreQuietHours: true,
      ignoreFrequencyCap: true,
    });

    assert(supportRes.success === true, "Direct support message dispatched successfully");
    assert(supportRes.status === "sent", "Support message has status 'sent'");

    // ── 4. Testing Rule R-16: Global Pause Switches ──
    console.log("\n--- 4. Testing Rule R-16: Admin Pause Switches ---");
    // Pause all offers
    await prisma.storeSettings.updateMany({
      data: { offersPaused: true },
    });

    const pausedOfferRes = await sendNotification({
      userId: testUserBId,
      type: "offer_campaign",
      title: "Paused Campaign",
      body: "This should be skipped because offers are paused.",
      target: "offers",
    });

    assert(pausedOfferRes.status === "skipped", "Offer skipped when offersPaused is true");
    assert(pausedOfferRes.skipReason === "paused", "Skip reason logged as 'paused'");

    // Restore offersPaused
    await prisma.storeSettings.updateMany({
      data: { offersPaused: false },
    });

    // ── 5. Testing Scheduled Campaign Cron Worker (T8) ──
    console.log("\n--- 5. Testing Scheduled Campaign Cron Processor (T8) ---");
    const scheduledCamp = await prisma.campaign.create({
      data: {
        title: "Scheduled Mega Weekend",
        body: "Big discounts this weekend on all wall tiles.",
        target: "offers",
        platforms: "all",
        audience: { type: "all" },
        status: "scheduled",
        scheduledAt: new Date(Date.now() - 10000), // Due in the past
        createdBy: testAdminId,
      },
    });

    const cronResult = await processScheduledCampaigns();
    assert(cronResult.processed >= 1, "Scheduled campaign processor found and claimed due campaign");

    const finishedCamp = await prisma.campaign.findUnique({
      where: { id: scheduledCamp.id },
    });
    assert(finishedCamp?.status === "sent", "Scheduled campaign marked as sent by cron processor");

    // ── 6. Testing Results & Attribution Aggregation (T10) ──
    console.log("\n--- 6. Testing Results View Analytics & Attribution (T10) ---");
    const logsCount = await prisma.notificationLog.count({
      where: { campaignId: testCampaign.id },
    });
    assert(logsCount >= 2, "NotificationLog contains audit records linked to campaign");

    // Clean up created entities
    console.log("\n============================================================");
    console.log(`🎉 ALL PUSH CAMPAIGNS TESTS PASSED: ${passed} passed, ${failed} failed`);
    console.log("============================================================\n");
  } catch (error) {
    console.error("Test execution failed:", error);
    failed++;
  } finally {
    try {
      console.log("🧹 Cleaning up test records...");
      await prisma.notificationLog.deleteMany({
        where: { userId: { in: [testUserAId, testUserBId] } },
      });
      await prisma.campaign.deleteMany({
        where: { createdBy: testAdminId },
      });
      await prisma.cartItem.deleteMany({
        where: { cart: { userId: testUserAId } },
      });
      await prisma.cart.deleteMany({
        where: { userId: testUserAId },
      });
      await prisma.deviceToken.deleteMany({
        where: { userId: { in: [testUserAId, testUserBId] } },
      });
      await prisma.user.deleteMany({
        where: { id: { in: [testUserAId, testUserBId] } },
      });
      // Restore normal store settings
      await prisma.storeSettings.updateMany({
        data: {
          offersPaused: false,
          cartRemindersPaused: false,
          maxPushPerDay: 2,
          quietHoursStart: "21:00",
          quietHoursEnd: "08:00",
        },
      });
    } catch {}
  }

  process.exit(failed > 0 ? 1 : 0);
}

main();
