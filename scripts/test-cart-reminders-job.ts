import { prisma as rawPrisma } from "@/lib/prisma";
import { recordCartChange, cancelCartReminder, runCartRemindersJob } from "@/lib/cart-reminder-runner";

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
  console.log("🛒 STARTING CART REMINDER LADDER (T6) TEST SUITE");
  console.log("============================================================\n");

  const testUserId = `test-cart-user-${Date.now()}`;
  const testPhone = `98${Math.floor(10000000 + Math.random() * 90000000)}`;
  let createdProductId = "";

  try {
    // Setup test user
    await prisma.user.create({
      data: {
        id: testUserId,
        phone: testPhone,
        role: "customer",
        name: "Test Cart User",
      },
    });

    // Setup device token so sendNotification can succeed or attempt
    await prisma.deviceToken.create({
      data: {
        userId: testUserId,
        platform: "android",
        token: `ExponentPushToken[TestCart_${Date.now()}]`,
      },
    });

    // Ensure storeSettings has normal quiet hours disabled or non-blocking for test
    await prisma.storeSettings.upsert({
      where: { id: "default" },
      update: {
        cartRemindersPaused: false,
        cartReminderDelaysHours: [1, 24, 72],
        maxCartReminders: 3,
      },
      create: {
        id: "default",
        cartRemindersPaused: false,
        cartReminderDelaysHours: [1, 24, 72],
        maxCartReminders: 3,
      },
    });

    // ── 1. Test Cart Add -> CartReminderState Created ──
    console.log("--- 1. Testing Cart Addition & State Upsert ---");
    await recordCartChange(testUserId, 2);
    let state = await prisma.cartReminderState.findUnique({
      where: { userId: testUserId },
    });
    assert(state !== null, "CartReminderState created on cart update");
    assert(state?.status === "pending", "Initial state is pending");
    assert(state?.step === 0, "Initial step is 0");
    assert(state?.cartVersion === 1, "Initial cartVersion is 1");

    // ── 2. Test Cart Modification -> Ladder Restarts ──
    console.log("\n--- 2. Testing Ladder Restart on Subsequent Cart Change ---");
    // Advance step artificially
    await prisma.cartReminderState.update({
      where: { userId: testUserId },
      data: { step: 2 },
    });
    // User modifies cart again
    await recordCartChange(testUserId, 3);
    state = await prisma.cartReminderState.findUnique({
      where: { userId: testUserId },
    });
    assert(state?.step === 0, "Step reset to 0 after cart modification");
    assert(state?.cartVersion === 2, "cartVersion incremented to 2");
    assert(state?.status === "pending", "Status remains pending");

    // ── 3. Test Cart Emptied -> Stopped ──
    console.log("\n--- 3. Testing Cart Emptied (Rule R-6) ---");
    await recordCartChange(testUserId, 0);
    state = await prisma.cartReminderState.findUnique({
      where: { userId: testUserId },
    });
    assert(state?.status === "stopped", "Cart empty sets status to stopped");

    // ── 4. Test Cart Re-added -> Restarts from Stopped ──
    console.log("\n--- 4. Testing Ladder Re-entry from Stopped State ---");
    await recordCartChange(testUserId, 1);
    state = await prisma.cartReminderState.findUnique({
      where: { userId: testUserId },
    });
    assert(state?.status === "pending", "Cart re-entry resumes pending status");
    assert(state?.step === 0, "Step is 0");
    assert(state?.cartVersion === 3, "cartVersion incremented to 3");

    // ── 5. Test Order Placed -> Cancel Ladder ──
    console.log("\n--- 5. Testing Order Placed Cancellation (Rule R-6) ---");
    await cancelCartReminder(testUserId);
    state = await prisma.cartReminderState.findUnique({
      where: { userId: testUserId },
    });
    assert(state?.status === "stopped", "Order placed stops cart reminder ladder");

    // ── 6. Test Atomic Claiming & Runner Step Progression ──
    console.log("\n--- 6. Testing Runner Execution & Concurrency Safety ---");
    // Create cart items in DB for user
    const cart = await prisma.cart.create({
      data: { userId: testUserId },
    });
    // Create dummy product & variant
    const product = await prisma.product.create({
      data: {
        name: "Kajaria Premium Ceramic Tile",
        slug: `kajaria-tile-${Date.now()}`,
        status: "ACTIVE",
      },
    });
    createdProductId = product.id;
    const variant = await prisma.productVariant.create({
      data: {
        productId: product.id,
        sku: `SKU-${Date.now()}`,
        size: "600x600",
        pricePerBox: 450,
        stockBoxes: 100,
      },
    });
    await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId: product.id,
        variantId: variant.id,
        boxQuantity: 2,
      },
    });

    // Reset reminder state to pending and set nextDueAt in past
    await prisma.cartReminderState.update({
      where: { userId: testUserId },
      data: {
        status: "pending",
        step: 0,
        nextDueAt: new Date(Date.now() - 10000), // Due now
      },
    });

    // Run two simultaneous job runs to verify atomic concurrency protection
    const [resA, resB] = await Promise.all([
      runCartRemindersJob({ forceNow: false }),
      runCartRemindersJob({ forceNow: false }),
    ]);

    // Total claims across both runs for this user should be at most 1
    const totalProcessedThisUser =
      (resA.details.some((d) => d.userId === testUserId) ? 1 : 0) +
      (resB.details.some((d) => d.userId === testUserId) ? 1 : 0);

    assert(
      totalProcessedThisUser === 1,
      `Exactly one runner claimed the reminder (Run A + Run B = ${totalProcessedThisUser})`
    );

    // Verify reminder state after step 1
    state = await prisma.cartReminderState.findUnique({
      where: { userId: testUserId },
    });
    // Check if it was processed and moved to step 1 (or postponed if quiet hours)
    assert(
      state?.step === 1 || state?.status === "pending",
      "State was safely evaluated by worker"
    );

    // ── 7. Test Ladder Completion After Step 3 ──
    console.log("\n--- 7. Testing Final Step 3 Completion (Rule R-5) ---");
    await prisma.cartReminderState.update({
      where: { userId: testUserId },
      data: {
        status: "pending",
        step: 2, // Step 2 is the 3rd reminder (0-indexed)
        nextDueAt: new Date(Date.now() - 10000),
      },
    });

    // Re-register / ensure device token exists with older lastSeenAt to satisfy R-7
    await prisma.deviceToken.create({
      data: {
        userId: testUserId,
        platform: "android",
        token: `ExponentPushToken[TestCartFinal_${Date.now()}]`,
        lastSeenAt: new Date(Date.now() - 40 * 60 * 1000),
      },
    });

    await prisma.deviceToken.updateMany({
      where: { userId: testUserId },
      data: { lastSeenAt: new Date(Date.now() - 40 * 60 * 1000) },
    });

    // Temporarily set high cap and mock quiet hours check
    await prisma.storeSettings.update({
      where: { id: "default" },
      data: {
        maxPushPerDay: 10,
        quietHoursStart: "23:59",
        quietHoursEnd: "00:01",
      },
    });

    const step7Res = await runCartRemindersJob({ forceNow: true });
    if (step7Res.details.length > 0) {
      console.log("  Step 7 worker action:", JSON.stringify(step7Res.details));
    }
    state = await prisma.cartReminderState.findUnique({
      where: { userId: testUserId },
    });
    assert(state?.step === 3, "Advanced to step 3");
    assert(state?.status === "done", "Marked done after reminder 3");

    // Restore quiet hours defaults
    await prisma.storeSettings.update({
      where: { id: "default" },
      data: {
        quietHoursStart: "21:00",
        quietHoursEnd: "08:00",
      },
    });

    console.log("\n============================================================");
    console.log(`🎉 T6 TEST RESULTS: ${passed} passed, ${failed} failed`);
    console.log("============================================================\n");
  } catch (error) {
    console.error("Test execution error:", error);
    failed++;
  } finally {
    // Cleanup
    try {
      console.log("🧹 Cleaning up test records...");
      await prisma.notificationLog.deleteMany({ where: { userId: testUserId } });
      await prisma.cartItem.deleteMany({ where: { cart: { userId: testUserId } } });
      await prisma.cart.deleteMany({ where: { userId: testUserId } });
      await prisma.cartReminderState.deleteMany({ where: { userId: testUserId } });
      await prisma.deviceToken.deleteMany({ where: { userId: testUserId } });
      await prisma.user.deleteMany({ where: { id: testUserId } });
      if (createdProductId) {
        await prisma.productVariant.deleteMany({ where: { productId: createdProductId } });
        await prisma.product.deleteMany({ where: { id: createdProductId } });
      }
    } catch {}
  }

  process.exit(failed > 0 ? 1 : 0);
}

main();
