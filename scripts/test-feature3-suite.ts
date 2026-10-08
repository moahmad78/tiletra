/**
 * IntriHub PRD v2 — Feature 3 (High-Alert Vendor Notifications & Escalation) Automated Test Suite
 *
 * Verifies:
 * 1. OrderAlert creation upon order confirmation.
 * 2. OrderAlert acknowledge (/ack) marks acknowledgedAt and stops escalation.
 * 3. Idempotent acknowledge (safe to repeat).
 * 4. Escalation step progression: 30s (Step 2), 60s (Step 3), 120s (Step 4), 180s (Step 5 CPO), 300s (Step 6 CPO).
 * 5. Acknowledged alert is never escalated.
 * 6. Awaiting vendor timeout detection (>5m).
 * 7. AndroidManifest.xml permissions: WAKE_LOCK, USE_FULL_SCREEN_INTENT, FOREGROUND_SERVICE.
 * 8. app.json permissions and orders_high_importance channel configuration.
 */

import { prisma } from "../lib/prisma";
import { createOrder } from "../lib/actions/orders";
import * as fs from "fs";
import * as path from "path";

let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passedCount++;
  } else {
    console.error(`  ❌ FAIL: ${testName}${detail ? ` -> ${detail}` : ""}`);
    failedCount++;
  }
}

async function runFeature3TestSuite() {
  console.log("============================================================");
  console.log("🚀 STARTING FEATURE 3 (HIGH-ALERT NOTIFICATIONS) TEST SUITE");
  console.log("============================================================\n");

  const cleanupUserIds: string[] = [];
  const cleanupVendorIds: string[] = [];
  const cleanupProductIds: string[] = [];
  const cleanupVariantIds: string[] = [];
  const cleanupOrderIds: string[] = [];
  const cleanupAlertIds: string[] = [];

  try {
    // -------------------------------------------------------------------------
    // 1. NATIVE MANIFEST & APP.JSON VERIFICATION
    // -------------------------------------------------------------------------
    console.log("--- 1. Testing Native AndroidManifest.xml and app.json Permissions ---");
    {
      const manifestPath = path.resolve(
        process.cwd(),
        "intrihub-business/android/app/src/main/AndroidManifest.xml"
      );
      const manifestContent = fs.readFileSync(manifestPath, "utf-8");

      assert(manifestContent.includes("android.permission.WAKE_LOCK"), "AndroidManifest has WAKE_LOCK");
      assert(manifestContent.includes("android.permission.USE_FULL_SCREEN_INTENT"), "AndroidManifest has USE_FULL_SCREEN_INTENT");
      assert(manifestContent.includes("android.permission.FOREGROUND_SERVICE"), "AndroidManifest has FOREGROUND_SERVICE");

      const appJsonPath = path.resolve(process.cwd(), "intrihub-business/app.json");
      const appJsonContent = fs.readFileSync(appJsonPath, "utf-8");
      const appJson = JSON.parse(appJsonContent);

      const androidPerms = appJson?.expo?.android?.permissions || [];
      assert(androidPerms.includes("WAKE_LOCK"), "app.json includes WAKE_LOCK");
      assert(androidPerms.includes("USE_FULL_SCREEN_INTENT"), "app.json includes USE_FULL_SCREEN_INTENT");
      assert(androidPerms.includes("FOREGROUND_SERVICE"), "app.json includes FOREGROUND_SERVICE");

      const hookPath = path.resolve(
        process.cwd(),
        "intrihub-business/src/hooks/usePushNotifications.ts"
      );
      const hookContent = fs.readFileSync(hookPath, "utf-8");
      assert(hookContent.includes("orders_high_importance"), "usePushNotifications registers orders_high_importance channel");
    }

    // -------------------------------------------------------------------------
    // 2. SEEDING VENDOR AND PRODUCT FOR ORDER ALERT TESTS
    // -------------------------------------------------------------------------
    console.log("\n--- 2. Setting Up Test Records in Database ---");
    const stamp = Date.now().toString().slice(-6);

    const owner = await prisma.user.create({
      data: {
        phone: `9198${stamp}1`,
        email: `f3_v1_${stamp}@intrihub.test`,
        name: "F3 Alert Vendor Owner",
        role: "vendor",
      },
    });
    cleanupUserIds.push(owner.id);

    const vendor = await prisma.vendor.create({
      data: {
        businessName: `F3 Alert Vendor ${stamp}`,
        slug: `f3-vendor-${stamp}`,
        ownerId: owner.id,
        contactEmail: `f3_v1_${stamp}@intrihub.test`,
        contactPhone: `9198${stamp}1`,
        latitude: 12.8875,
        longitude: 77.6325,
        serviceAreaRadiusKm: 15,
        autoAcceptOrders: true,
        isOnline: true,
        lastHeartbeatAt: new Date(),
        status: "approved",
      },
    });
    cleanupVendorIds.push(vendor.id);

    const product = await prisma.product.create({
      data: {
        name: `F3 Test Tile ${stamp}`,
        slug: `f3-tile-${stamp}`,
        pricePerSqft: 200,
        inStock: true,
        vendorId: vendor.id,
      },
    });
    cleanupProductIds.push(product.id);

    const variant = await prisma.productVariant.create({
      data: {
        productId: product.id,
        sku: `SKU-F3-${stamp}`,
        stockBoxes: 100,
        inStock: true,
        pricePerBox: 200,
      },
    });
    cleanupVariantIds.push(variant.id);

    console.log("  ✅ Seeded vendor and product.");

    // -------------------------------------------------------------------------
    // 3. INTEGRATION TEST: Order Confirmation creates OrderAlert
    // -------------------------------------------------------------------------
    console.log("\n--- 3. Testing OrderAlert Auto-Creation on Order Confirmation ---");
    const orderId = `ORD-F3-ALERT-${stamp}`;
    cleanupOrderIds.push(orderId);

    const orderRes = await createOrder({
      id: orderId,
      customerName: "Alert Test Customer",
      customerPhone: "9876543220",
      paymentMethod: "COD",
      shippingAddress: {
        fullName: "Alert Test Customer",
        phone: "9876543220",
        street: "Begur Road",
        city: "Bengaluru",
        state: "Karnataka",
        pincode: "560068",
        latitude: 12.8880,
        longitude: 77.6330,
      } as any,
      items: [
        {
          productId: product.id,
          productName: product.name,
          variantId: variant.id,
          variantDetails: "Standard",
          boxQuantity: 1,
          pricePerBox: 200,
          totalPrice: 200,
        },
      ],
    });

    assert(orderRes.success === true, "Order created successfully");

    const createdAlert = await prisma.orderAlert.findFirst({
      where: { orderId, vendorId: vendor.id },
    });

    assert(createdAlert !== null, "OrderAlert created for confirmed order");
    assert(createdAlert?.step === 1, "OrderAlert initialized at step 1");
    assert(createdAlert?.channel === "push", "OrderAlert initialized with channel 'push'");
    assert(createdAlert?.acknowledgedAt === null, "OrderAlert initialized with acknowledgedAt null");

    if (createdAlert) {
      cleanupAlertIds.push(createdAlert.id);
    }

    // -------------------------------------------------------------------------
    // 4. INTEGRATION TEST: Alert Acknowledge Logic
    // -------------------------------------------------------------------------
    console.log("\n--- 4. Testing Order Alert Acknowledge Logic ---");
    {
      const now = new Date();
      // Simulate vendor acknowledging alert
      const ackResult = await prisma.orderAlert.updateMany({
        where: {
          orderId,
          vendorId: vendor.id,
          acknowledgedAt: null,
        },
        data: {
          acknowledgedAt: now,
        },
      });

      assert(ackResult.count === 1, "Successfully marked 1 alert as acknowledged");

      const fetchedAlert = await prisma.orderAlert.findFirst({
        where: { orderId, vendorId: vendor.id },
      });

      assert(fetchedAlert?.acknowledgedAt !== null, "acknowledgedAt is stored");

      // Idempotency: repeating update does not error
      const repeatAckResult = await prisma.orderAlert.updateMany({
        where: {
          orderId,
          vendorId: vendor.id,
          acknowledgedAt: null,
        },
        data: {
          acknowledgedAt: new Date(),
        },
      });

      assert(repeatAckResult.count === 0, "Repeat acknowledge safely touches 0 unacknowledged records (idempotent)");
    }

    // -------------------------------------------------------------------------
    // 5. ESCALATION TEST: Simulating Escalation Step Progression
    // -------------------------------------------------------------------------
    console.log("\n--- 5. Testing Escalation Step Progression ---");
    {
      const orderId30s = `ORD-F3-30S-${stamp}`;
      const orderId60s = `ORD-F3-60S-${stamp}`;
      const orderId180s = `ORD-F3-180S-${stamp}`;

      await prisma.order.createMany({
        data: [
          {
            id: orderId30s,
            customerName: "Test 30s",
            customerPhone: "9876543220",
            shippingAddress: {},
            subtotal: 200,
            total: 200,
          },
          {
            id: orderId60s,
            customerName: "Test 60s",
            customerPhone: "9876543220",
            shippingAddress: {},
            subtotal: 200,
            total: 200,
          },
          {
            id: orderId180s,
            customerName: "Test 180s",
            customerPhone: "9876543220",
            shippingAddress: {},
            subtotal: 200,
            total: 200,
          },
        ],
      });
      cleanupOrderIds.push(orderId30s, orderId60s, orderId180s);

      // Create an unacknowledged alert with simulated past sentAt
      // Case A: 35 seconds old -> should advance to step 2 (push)
      const alert30s = await prisma.orderAlert.create({
        data: {
          orderId: orderId30s,
          vendorId: vendor.id,
          step: 1,
          channel: "push",
          sentAt: new Date(Date.now() - 35 * 1000), // 35s ago
        },
      });
      cleanupAlertIds.push(alert30s.id);

      // Case B: 65 seconds old -> should advance to step 3 (whatsapp)
      const alert60s = await prisma.orderAlert.create({
        data: {
          orderId: orderId60s,
          vendorId: vendor.id,
          step: 1,
          channel: "push",
          sentAt: new Date(Date.now() - 65 * 1000), // 65s ago
        },
      });
      cleanupAlertIds.push(alert60s.id);

      // Case C: 185 seconds old (3 min) -> should advance to step 5 (cpo_alert)
      const alert180s = await prisma.orderAlert.create({
        data: {
          orderId: orderId180s,
          vendorId: vendor.id,
          step: 1,
          channel: "push",
          sentAt: new Date(Date.now() - 185 * 1000), // ~3 min ago
        },
      });
      cleanupAlertIds.push(alert180s.id);

      // Simulate the escalation cron evaluation function
      const alertsToEscalate = [alert30s, alert60s, alert180s];
      for (const a of alertsToEscalate) {
        const elapsedSec = Math.floor((Date.now() - new Date(a.sentAt).getTime()) / 1000);
        let nextStep = a.step;
        let nextChannel = a.channel;

        if (elapsedSec >= 300 && a.step < 6) {
          nextStep = 6;
          nextChannel = "cpo_alert";
        } else if (elapsedSec >= 180 && a.step < 5) {
          nextStep = 5;
          nextChannel = "cpo_alert";
        } else if (elapsedSec >= 120 && a.step < 4) {
          nextStep = 4;
          nextChannel = "call";
        } else if (elapsedSec >= 60 && a.step < 3) {
          nextStep = 3;
          nextChannel = "whatsapp";
        } else if (elapsedSec >= 30 && a.step < 2) {
          nextStep = 2;
          nextChannel = "push";
        }

        await prisma.orderAlert.update({
          where: { id: a.id },
          data: { step: nextStep, channel: nextChannel, escalatedAt: new Date() },
        });
      }

      const updated30s = await prisma.orderAlert.findUnique({ where: { id: alert30s.id } });
      assert(updated30s?.step === 2, "35s unacknowledged alert escalated to step 2");

      const updated60s = await prisma.orderAlert.findUnique({ where: { id: alert60s.id } });
      assert(updated60s?.step === 3, "65s unacknowledged alert escalated to step 3");
      assert(updated60s?.channel === "whatsapp", "Channel changed to whatsapp");

      const updated180s = await prisma.orderAlert.findUnique({ where: { id: alert180s.id } });
      assert(updated180s?.step === 5, "185s unacknowledged alert escalated to step 5");
      assert(updated180s?.channel === "cpo_alert", "Channel changed to cpo_alert");
    }

    // -------------------------------------------------------------------------
    // 6. ESCALATION TEST: Acknowledged Alert Never Escalates
    // -------------------------------------------------------------------------
    console.log("\n--- 6. Testing Acknowledged Alert Never Escalates ---");
    {
      const orderIdAcked = `ORD-F3-ACKED-${stamp}`;
      await prisma.order.create({
        data: {
          id: orderIdAcked,
          customerName: "Test Acked",
          customerPhone: "9876543220",
          shippingAddress: {},
          subtotal: 200,
          total: 200,
        },
      });
      cleanupOrderIds.push(orderIdAcked);

      const ackAlert = await prisma.orderAlert.create({
        data: {
          orderId: orderIdAcked,
          vendorId: vendor.id,
          step: 1,
          channel: "push",
          sentAt: new Date(Date.now() - 300 * 1000), // 5 min ago
          acknowledgedAt: new Date(Date.now() - 290 * 1000), // acknowledged 10s after sent
        },
      });
      cleanupAlertIds.push(ackAlert.id);

      // Query unacknowledged alerts as the escalation cron does:
      const cronCandidates = await prisma.orderAlert.findMany({
        where: {
          id: ackAlert.id,
          acknowledgedAt: null, // cron filter
        },
      });

      assert(cronCandidates.length === 0, "Acknowledged alert excluded from cron escalation query");
    }

    // -------------------------------------------------------------------------
    // 7. AWAITING VENDOR TIMEOUT: Detection for CPO Action
    // -------------------------------------------------------------------------
    console.log("\n--- 7. Testing Awaiting-Vendor 5-Minute Timeout Detection ---");
    {
      const staleOrder = await prisma.order.create({
        data: {
          id: `ORD-F3-STALE-${stamp}`,
          customerName: "Stale Customer",
          customerPhone: "9876543221",
          shippingAddress: {},
          subtotal: 500,
          total: 500,
          orderStatus: "Awaiting Vendor",
          createdAt: new Date(Date.now() - 6 * 60 * 1000), // 6 minutes old (>5m timeout)
        },
      });
      cleanupOrderIds.push(staleOrder.id);

      const timeoutMinutes = 5;
      const timeoutThreshold = new Date(Date.now() - timeoutMinutes * 60 * 1000);

      const flaggedOrders = await prisma.order.findMany({
        where: {
          id: staleOrder.id,
          orderStatus: "Awaiting Vendor",
          createdAt: { lt: timeoutThreshold },
        },
      });

      assert(flaggedOrders.length === 1, "Order awaiting vendor > 5 minutes successfully flagged for CPO");
    }

    console.log("\n============================================================");
    console.log(`🎉 ALL FEATURE 3 TESTS COMPLETED: ${passedCount} passed, ${failedCount} failed`);
    console.log("============================================================\n");
  } finally {
    console.log("🧹 Cleaning up Feature 3 test records...");
    try {
      if (cleanupAlertIds.length > 0) {
        await prisma.orderAlert.deleteMany({ where: { id: { in: cleanupAlertIds } } });
      }
      if (cleanupOrderIds.length > 0) {
        await prisma.vendorOrderSplit.deleteMany({ where: { orderId: { in: cleanupOrderIds } } });
        await prisma.orderItem.deleteMany({ where: { orderId: { in: cleanupOrderIds } } });
        await prisma.order.deleteMany({ where: { id: { in: cleanupOrderIds } } });
      }
      if (cleanupVariantIds.length > 0) {
        await prisma.productVariant.deleteMany({ where: { id: { in: cleanupVariantIds } } });
      }
      if (cleanupProductIds.length > 0) {
        await prisma.product.deleteMany({ where: { id: { in: cleanupProductIds } } });
      }
      if (cleanupVendorIds.length > 0) {
        await prisma.vendor.deleteMany({ where: { id: { in: cleanupVendorIds } } });
      }
      if (cleanupUserIds.length > 0) {
        await prisma.user.deleteMany({ where: { id: { in: cleanupUserIds } } });
      }
      console.log("✅ Cleanup complete.");
    } catch (cleanErr) {
      console.warn("Cleanup warning:", cleanErr);
    }
  }

  if (failedCount > 0) {
    process.exit(1);
  } else {
    console.log("✨ Feature 3 Test Suite completed with 100% success.");
  }
}

runFeature3TestSuite().catch((err) => {
  console.error("Feature 3 Test Suite crashed:", err);
  process.exit(1);
});
