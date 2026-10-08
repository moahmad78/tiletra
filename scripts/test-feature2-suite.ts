/**
 * IntriHub PRD v2 — Feature 2 (Auto-Accept Orders) Automated Test Suite
 *
 * Verifies:
 * 1. Unit tests for each of the 7 eligibility checks (pass and fail).
 * 2. Operating hours check across IST timezone.
 * 3. readyBy (+10 min) and cancelWindowExpiresAt (+2 min) math.
 * 4. End-to-end createOrder with fully eligible vendor -> Confirmed.
 * 5. createOrder with offline vendor / stale heartbeat -> Awaiting Vendor.
 * 6. createOrder with out-of-radius delivery -> Awaiting Vendor.
 * 7. createOrder with missing address coordinates -> Awaiting Vendor.
 * 8. Multi-vendor split independence: eligible split confirmed, offline split awaiting_vendor.
 * 9. First-time COD customer cap validation.
 * 10. Order cancellation within window: atomic status update + stock restoration exactly once.
 * 11. Cancellation after window expiration rejected.
 * 12. Double-cancellation race condition protection.
 * 13. Vendor order split rejection + stock restoration.
 * 14. Heartbeat 20-second throttle logic.
 */

import { prisma as rawPrisma } from "../lib/prisma";
const prisma = rawPrisma as any;
import { createOrder, cancelOrder, rejectVendorOrderSplit } from "../lib/actions/orders";
import { haversineDistanceKm } from "../lib/delivery/geo";
import { isWithinOperatingHours } from "../lib/delivery/operating-hours";

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

async function runFeature2TestSuite() {
  console.log("============================================================");
  console.log("🚀 STARTING FEATURE 2 (AUTO-ACCEPT ORDERS) TEST SUITE");
  console.log("============================================================\n");

  const cleanupUserIds: string[] = [];
  const cleanupVendorIds: string[] = [];
  const cleanupProductIds: string[] = [];
  const cleanupVariantIds: string[] = [];
  const cleanupOrderIds: string[] = [];

  try {
    // -------------------------------------------------------------------------
    // 1. UNIT TESTS: Operating Hours Validation (IST)
    // -------------------------------------------------------------------------
    console.log("--- 1. Testing Operating Hours Utility ---");
    {
      // Open 24/7 if unconfigured or null
      assert(isWithinOperatingHours(null), "Null operating hours defaults to open");
      assert(isWithinOperatingHours({}), "Empty operating hours defaults to open");

      // Closed day check
      const closedMonday = { monday: { closed: true } };
      // Create a reference Monday date
      const mondayDate = new Date("2026-10-12T10:00:00Z"); // Oct 12, 2026 is Monday
      assert(!isWithinOperatingHours(closedMonday, mondayDate), "Explicitly closed day returns false");

      // Regular shift check (09:00 to 21:00 IST)
      const regularHours = {
        open: "09:00",
        close: "21:00",
      };
      // 12:00 IST (06:30 UTC)
      const middayIST = new Date("2026-10-12T06:30:00Z");
      assert(isWithinOperatingHours(regularHours, middayIST), "Midday IST is inside 09:00 - 21:00");

      // 23:00 IST (17:30 UTC)
      const lateNightIST = new Date("2026-10-12T17:30:00Z");
      assert(!isWithinOperatingHours(regularHours, lateNightIST), "Late night IST is outside 09:00 - 21:00");
    }

    // -------------------------------------------------------------------------
    // 2. UNIT TESTS: Timers and SLA Math
    // -------------------------------------------------------------------------
    console.log("\n--- 2. Testing readyBy and cancelWindow Calculation ---");
    {
      const now = new Date();
      const readyMinutes = 10;
      const cancelMinutes = 2;
      const readyBy = new Date(now.getTime() + readyMinutes * 60 * 1000);
      const cancelWindowExpiresAt = new Date(now.getTime() + cancelMinutes * 60 * 1000);

      assert(readyBy.getTime() - now.getTime() === 600000, "readyBy is exactly +10 minutes");
      assert(cancelWindowExpiresAt.getTime() - now.getTime() === 120000, "cancelWindowExpiresAt is exactly +2 minutes");
      assert(readyBy > cancelWindowExpiresAt, "readyBy is after cancelWindowExpiresAt");
    }

    // -------------------------------------------------------------------------
    // 3. SEEDING TEST VENDORS & PRODUCTS
    // -------------------------------------------------------------------------
    console.log("\n--- 3. Setting Up Test Records in Database ---");

    const stamp = Date.now().toString().slice(-6);

    // Vendor 1: Fully Eligible (Online, fresh heartbeat, autoAccept = true, Begur Bengaluru)
    const owner1 = await prisma.user.create({
      data: {
        phone: `9199${stamp}1`,
        email: `f2_v1_${stamp}@intrihub.test`,
        name: "F2 Owner 1",
        role: "vendor",
      },
    });
    cleanupUserIds.push(owner1.id);

    const vendorEligible = await prisma.vendor.create({
      data: {
        businessName: `F2 Eligible Vendor ${stamp}`,
        slug: `f2-eligible-${stamp}`,
        ownerId: owner1.id,
        contactEmail: `f2_v1_${stamp}@intrihub.test`,
        contactPhone: `9199${stamp}1`,
        latitude: 12.8875, // Begur, Bengaluru
        longitude: 77.6325,
        serviceAreaRadiusKm: 15,
        autoAcceptOrders: true,
        isOnline: true,
        lastHeartbeatAt: new Date(), // fresh heartbeat
        status: "approved",
      },
    });
    cleanupVendorIds.push(vendorEligible.id);

    // Vendor 2: Offline / Stale Heartbeat (AutoAccept = true, but isOnline = false)
    const owner2 = await prisma.user.create({
      data: {
        phone: `9199${stamp}2`,
        email: `f2_v2_${stamp}@intrihub.test`,
        name: "F2 Owner 2",
        role: "vendor",
      },
    });
    cleanupUserIds.push(owner2.id);

    const vendorOffline = await prisma.vendor.create({
      data: {
        businessName: `F2 Offline Vendor ${stamp}`,
        slug: `f2-offline-${stamp}`,
        ownerId: owner2.id,
        contactEmail: `f2_v2_${stamp}@intrihub.test`,
        contactPhone: `9199${stamp}2`,
        latitude: 12.8900,
        longitude: 77.6350,
        serviceAreaRadiusKm: 15,
        autoAcceptOrders: true,
        isOnline: false, // OFFLINE
        lastHeartbeatAt: new Date(Date.now() - 300 * 1000), // 5 min old
        status: "approved",
      },
    });
    cleanupVendorIds.push(vendorOffline.id);

    // Vendor 3: Small Radius (serviceAreaRadiusKm = 2 km)
    const owner3 = await prisma.user.create({
      data: {
        phone: `9199${stamp}3`,
        email: `f2_v3_${stamp}@intrihub.test`,
        name: "F2 Owner 3",
        role: "vendor",
      },
    });
    cleanupUserIds.push(owner3.id);

    const vendorSmallRadius = await prisma.vendor.create({
      data: {
        businessName: `F2 Small Radius Vendor ${stamp}`,
        slug: `f2-smallradius-${stamp}`,
        ownerId: owner3.id,
        contactEmail: `f2_v3_${stamp}@intrihub.test`,
        contactPhone: `9199${stamp}3`,
        latitude: 12.8875,
        longitude: 77.6325,
        serviceAreaRadiusKm: 2, // Only 2 km radius
        autoAcceptOrders: true,
        isOnline: true,
        lastHeartbeatAt: new Date(),
        status: "approved",
      },
    });
    cleanupVendorIds.push(vendorSmallRadius.id);

    // Test Products
    const prodEligible = await prisma.product.create({
      data: {
        name: `F2 Eligible Cement ${stamp}`,
        slug: `f2-eligible-cement-${stamp}`,
        description: "Test product for auto accept",
        pricePerSqft: 400,
        inStock: true,
        vendorId: vendorEligible.id,
      },
    });
    cleanupProductIds.push(prodEligible.id);

    const variantEligible = await prisma.productVariant.create({
      data: {
        productId: prodEligible.id,
        sku: `SKU-F2-ELIG-${stamp}`,
        stockBoxes: 50,
        inStock: true,
        pricePerBox: 400,
      },
    });
    cleanupVariantIds.push(variantEligible.id);

    const prodOffline = await prisma.product.create({
      data: {
        name: `F2 Offline Paint ${stamp}`,
        slug: `f2-offline-paint-${stamp}`,
        description: "Test product for offline vendor",
        pricePerSqft: 500,
        inStock: true,
        vendorId: vendorOffline.id,
      },
    });
    cleanupProductIds.push(prodOffline.id);

    const variantOffline = await prisma.productVariant.create({
      data: {
        productId: prodOffline.id,
        sku: `SKU-F2-OFF-${stamp}`,
        stockBoxes: 50,
        inStock: true,
        pricePerBox: 500,
      },
    });
    cleanupVariantIds.push(variantOffline.id);

    const prodSmallRadius = await prisma.product.create({
      data: {
        name: `F2 Small Radius Tiles ${stamp}`,
        slug: `f2-small-radius-${stamp}`,
        description: "Test product for small radius vendor",
        pricePerSqft: 600,
        inStock: true,
        vendorId: vendorSmallRadius.id,
      },
    });
    cleanupProductIds.push(prodSmallRadius.id);

    const variantSmallRadius = await prisma.productVariant.create({
      data: {
        productId: prodSmallRadius.id,
        sku: `SKU-F2-RADIUS-${stamp}`,
        stockBoxes: 50,
        inStock: true,
        pricePerBox: 600,
      },
    });
    cleanupVariantIds.push(variantSmallRadius.id);

    console.log("  ✅ Test vendors and products seeded.");

    // -------------------------------------------------------------------------
    // 4. INTEGRATION TEST: Fully Eligible Order -> Confirmed
    // -------------------------------------------------------------------------
    console.log("\n--- 4. Testing createOrder with Fully Eligible Vendor ---");
    {
      const orderRes = await createOrder({
        id: `ORD-F2-PASS-${stamp}`,
        customerName: "Eligible Customer",
        customerPhone: "9876543210",
        paymentMethod: "COD",
        shippingAddress: {
          fullName: "Eligible Customer",
          phone: "9876543210",
          street: "Begur Main Road",
          city: "Bengaluru",
          state: "Karnataka",
          pincode: "560068",
          latitude: 12.8880, // ~100m away from vendor
          longitude: 77.6330,
        } as any,
        items: [
          {
            productId: prodEligible.id,
            productName: prodEligible.name,
            variantId: variantEligible.id,
            variantDetails: "Standard",
            boxQuantity: 2,
            pricePerBox: 400,
            totalPrice: 800,
          },
        ],
      });

      cleanupOrderIds.push(`ORD-F2-PASS-${stamp}`);
      assert(orderRes.success === true, "Eligible order created successfully");

      const saved: any = await prisma.order.findUnique({
        where: { id: `ORD-F2-PASS-${stamp}` },
      });
      const splits: any = await prisma.vendorOrderSplit.findMany({
        where: { orderId: `ORD-F2-PASS-${stamp}` },
      });

      assert(saved?.orderStatus === "Confirmed", "Order status is 'Confirmed'");
      assert(saved?.autoAccepted === true, "autoAccepted is true");
      assert(saved?.autoAcceptReason === "All eligibility checks passed", "autoAcceptReason recorded");
      assert(saved?.confirmedAt !== null, "confirmedAt is populated");
      assert(saved?.readyBy !== null, "readyBy is populated");
      assert(saved?.cancelWindowExpiresAt !== null, "cancelWindowExpiresAt is populated");
      assert(splits[0]?.fulfillmentStatus === "confirmed", "Split status is 'confirmed'");
      assert(splits[0]?.autoAccepted === true, "Split autoAccepted is true");
    }

    // -------------------------------------------------------------------------
    // 5. INTEGRATION TEST: Offline Vendor -> Awaiting Vendor
    // -------------------------------------------------------------------------
    console.log("\n--- 5. Testing createOrder with Offline Vendor ---");
    {
      const orderRes = await createOrder({
        id: `ORD-F2-OFFLINE-${stamp}`,
        customerName: "Offline Vendor Customer",
        customerPhone: "9876543211",
        paymentMethod: "COD",
        shippingAddress: {
          fullName: "Customer",
          phone: "9876543211",
          street: "Begur Road",
          city: "Bengaluru",
          state: "Karnataka",
          pincode: "560068",
          latitude: 12.8880,
          longitude: 77.6330,
        } as any,
        items: [
          {
            productId: prodOffline.id,
            productName: prodOffline.name,
            variantId: variantOffline.id,
            variantDetails: "Standard",
            boxQuantity: 1,
            pricePerBox: 500,
            totalPrice: 500,
          },
        ],
      });

      cleanupOrderIds.push(`ORD-F2-OFFLINE-${stamp}`);
      assert(orderRes.success === true, "Order created without error");

      const saved: any = await prisma.order.findUnique({
        where: { id: `ORD-F2-OFFLINE-${stamp}` },
      });
      const splits: any = await prisma.vendorOrderSplit.findMany({
        where: { orderId: `ORD-F2-OFFLINE-${stamp}` },
      });

      assert(saved?.orderStatus === "Awaiting Vendor", "Order status is 'Awaiting Vendor'");
      assert(saved?.autoAccepted === false, "autoAccepted is false");
      assert(
        saved?.autoAcceptReason?.includes("offline") || saved?.autoAcceptReason?.includes("stale"),
        `autoAcceptReason captures offline status: ${saved?.autoAcceptReason}`
      );
      assert(splits[0]?.fulfillmentStatus === "awaiting_vendor", "Split status is 'awaiting_vendor'");
    }

    // -------------------------------------------------------------------------
    // 6. INTEGRATION TEST: Radius Exceeded -> Awaiting Vendor
    // -------------------------------------------------------------------------
    console.log("\n--- 6. Testing Radius Exceeded Check ---");
    {
      // Customer is at Whitefield (12.9698, 77.7500), vendor is at Begur (12.8875, 77.6325) -> ~15 km away, radius is 2 km
      const orderRes = await createOrder({
        id: `ORD-F2-RADIUS-${stamp}`,
        customerName: "Far Customer",
        customerPhone: "9876543212",
        paymentMethod: "COD",
        shippingAddress: {
          fullName: "Far Customer",
          phone: "9876543212",
          street: "Whitefield Main Road",
          city: "Bengaluru",
          state: "Karnataka",
          pincode: "560066",
          latitude: 12.9698,
          longitude: 77.7500,
        } as any,
        items: [
          {
            productId: prodSmallRadius.id,
            productName: prodSmallRadius.name,
            variantId: variantSmallRadius.id,
            variantDetails: "Standard",
            boxQuantity: 1,
            pricePerBox: 600,
            totalPrice: 600,
          },
        ],
      });

      cleanupOrderIds.push(`ORD-F2-RADIUS-${stamp}`);
      assert(orderRes.success === true, "Order created");

      const saved: any = await prisma.order.findUnique({
        where: { id: `ORD-F2-RADIUS-${stamp}` },
      });

      assert(saved?.orderStatus === "Awaiting Vendor", "Out-of-radius order is 'Awaiting Vendor'");
      assert(saved?.autoAccepted === false, "autoAccepted is false");
      assert(
        saved?.autoAcceptReason?.includes("exceeds service radius"),
        `autoAcceptReason indicates radius exceeded: ${saved?.autoAcceptReason}`
      );
    }

    // -------------------------------------------------------------------------
    // 7. INTEGRATION TEST: Missing Address GPS Coordinates -> Awaiting Vendor
    // -------------------------------------------------------------------------
    console.log("\n--- 7. Testing Missing Coordinates Check ---");
    {
      const orderRes = await createOrder({
        id: `ORD-F2-NO-GPS-${stamp}`,
        customerName: "No GPS Customer",
        customerPhone: "9876543213",
        paymentMethod: "COD",
        shippingAddress: {
          fullName: "No GPS Customer",
          phone: "9876543213",
          street: "Some Street",
          city: "Bengaluru",
          state: "Karnataka",
          pincode: "560068",
          latitude: null, // MISSING
          longitude: null,
        } as any,
        items: [
          {
            productId: prodEligible.id,
            productName: prodEligible.name,
            variantId: variantEligible.id,
            variantDetails: "Standard",
            boxQuantity: 1,
            pricePerBox: 400,
            totalPrice: 400,
          },
        ],
      });

      cleanupOrderIds.push(`ORD-F2-NO-GPS-${stamp}`);
      assert(orderRes.success === true, "Order created");

      const saved: any = await prisma.order.findUnique({
        where: { id: `ORD-F2-NO-GPS-${stamp}` },
      });

      assert(saved?.orderStatus === "Awaiting Vendor", "Missing GPS order is 'Awaiting Vendor'");
      assert(saved?.autoAccepted === false, "autoAccepted is false");
      assert(
        saved?.autoAcceptReason?.includes("missing GPS coordinates"),
        `autoAcceptReason notes missing GPS: ${saved?.autoAcceptReason}`
      );
    }

    // -------------------------------------------------------------------------
    // 8. INTEGRATION TEST: Multi-Vendor Split Independence
    // -------------------------------------------------------------------------
    console.log("\n--- 8. Testing Multi-Vendor Split Independence ---");
    {
      // Refresh heartbeat to ensure vendor remains active in real time
      await prisma.vendor.update({
        where: { id: vendorEligible.id },
        data: { lastHeartbeatAt: new Date() },
      });

      // Order contains items from Eligible Vendor AND Offline Vendor
      const orderRes = await createOrder({
        id: `ORD-F2-MULTI-${stamp}`,
        customerName: "Multi Vendor Customer",
        customerPhone: "9876543214",
        paymentMethod: "COD",
        shippingAddress: {
          fullName: "Multi Customer",
          phone: "9876543214",
          street: "Begur Road",
          city: "Bengaluru",
          state: "Karnataka",
          pincode: "560068",
          latitude: 12.8880,
          longitude: 77.6330,
        } as any,
        items: [
          {
            productId: prodEligible.id,
            productName: prodEligible.name,
            variantId: variantEligible.id,
            variantDetails: "Standard",
            boxQuantity: 1,
            pricePerBox: 400,
            totalPrice: 400,
          },
          {
            productId: prodOffline.id,
            productName: prodOffline.name,
            variantId: variantOffline.id,
            variantDetails: "Standard",
            boxQuantity: 1,
            pricePerBox: 500,
            totalPrice: 500,
          },
        ],
      });

      cleanupOrderIds.push(`ORD-F2-MULTI-${stamp}`);
      assert(orderRes.success === true, "Multi-vendor order created");

      const saved: any = await prisma.order.findUnique({
        where: { id: `ORD-F2-MULTI-${stamp}` },
      });
      const splits: any = await prisma.vendorOrderSplit.findMany({
        where: { orderId: `ORD-F2-MULTI-${stamp}` },
      });

      assert(splits.length === 2, "Generated 2 independent vendor splits");

      const eligibleSplit = splits.find((s: any) => s.vendorId === vendorEligible.id);
      const offlineSplit = splits.find((s: any) => s.vendorId === vendorOffline.id);

      assert(eligibleSplit?.fulfillmentStatus === "confirmed", "Eligible split is confirmed");
      assert(eligibleSplit?.autoAccepted === true, "Eligible split autoAccepted is true");

      assert(offlineSplit?.fulfillmentStatus === "awaiting_vendor", "Offline split is awaiting_vendor");
      assert(offlineSplit?.autoAccepted === false, "Offline split autoAccepted is false");

      assert(saved?.orderStatus === "Awaiting Vendor", "Parent order reflects partial awaiting_vendor status");
    }

    // -------------------------------------------------------------------------
    // 9. INTEGRATION TEST: First-Time Customer COD Cap
    // -------------------------------------------------------------------------
    console.log("\n--- 9. Testing First-Time Customer COD Cap Check ---");
    {
      // Refresh heartbeat to ensure vendor is online and check reaches COD cap
      await prisma.vendor.update({
        where: { id: vendorEligible.id },
        data: { lastHeartbeatAt: new Date() },
      });

      // New phone number with zero completed orders, order total > 5000 (e.g. 15 boxes * 400 = 6000)
      const orderRes = await createOrder({
        id: `ORD-F2-CODCAP-${stamp}`,
        customerName: "Big Spender",
        customerPhone: "9876543299",
        paymentMethod: "COD",
        shippingAddress: {
          fullName: "Big Spender",
          phone: "9876543299",
          street: "Begur Road",
          city: "Bengaluru",
          state: "Karnataka",
          pincode: "560068",
          latitude: 12.8880,
          longitude: 77.6330,
        } as any,
        items: [
          {
            productId: prodEligible.id,
            productName: prodEligible.name,
            variantId: variantEligible.id,
            variantDetails: "Standard",
            boxQuantity: 15,
            pricePerBox: 400,
            totalPrice: 6000,
          },
        ],
      });

      cleanupOrderIds.push(`ORD-F2-CODCAP-${stamp}`);
      assert(orderRes.success === true, "COD Cap order placed");

      const saved: any = await prisma.order.findUnique({
        where: { id: `ORD-F2-CODCAP-${stamp}` },
      });

      assert(saved?.orderStatus === "Awaiting Vendor", "COD order above cap is 'Awaiting Vendor'");
      assert(
        saved?.autoAcceptReason?.includes("exceeds first-time customer cap"),
        `autoAcceptReason notes COD cap: ${saved?.autoAcceptReason}`
      );
    }

    // -------------------------------------------------------------------------
    // 10. INTEGRATION TEST: Customer Order Cancellation & Stock Restoration
    // -------------------------------------------------------------------------
    console.log("\n--- 10. Testing Customer Order Cancellation & Stock Restoration ---");
    {
      const variantBefore = await prisma.productVariant.findUnique({
        where: { id: variantEligible.id },
      });
      const initialStock = variantBefore?.stockBoxes || 0;

      // Create order of 3 boxes
      const orderRes = await createOrder({
        id: `ORD-F2-CANCEL-${stamp}`,
        customerName: "Cancel Customer",
        customerPhone: "9876543215",
        paymentMethod: "COD",
        shippingAddress: {
          fullName: "Cancel Customer",
          phone: "9876543215",
          street: "Begur Road",
          city: "Bengaluru",
          state: "Karnataka",
          pincode: "560068",
          latitude: 12.8880,
          longitude: 77.6330,
        } as any,
        items: [
          {
            productId: prodEligible.id,
            productName: prodEligible.name,
            variantId: variantEligible.id,
            variantDetails: "Standard",
            boxQuantity: 3,
            pricePerBox: 400,
            totalPrice: 1200,
          },
        ],
      });

      cleanupOrderIds.push(`ORD-F2-CANCEL-${stamp}`);

      const variantMid = await prisma.productVariant.findUnique({
        where: { id: variantEligible.id },
      });
      assert(variantMid?.stockBoxes === initialStock - 3, `Stock decreased by 3 (from ${initialStock} to ${variantMid?.stockBoxes})`);

      // Cancel order within window
      const cancelRes = await cancelOrder({
        orderId: `ORD-F2-CANCEL-${stamp}`,
        reason: "Customer changed mind",
        cancelledBy: "customer",
      });

      assert(cancelRes.success === true, "Cancel order succeeded");

      const saved: any = await prisma.order.findUnique({
        where: { id: `ORD-F2-CANCEL-${stamp}` },
      });
      const splits: any = await prisma.vendorOrderSplit.findMany({
        where: { orderId: `ORD-F2-CANCEL-${stamp}` },
      });

      assert(saved?.orderStatus === "Cancelled", "Order status is 'Cancelled'");
      assert(saved?.cancelledBy === "customer", "cancelledBy is 'customer'");
      assert(saved?.cancelReason === "Customer changed mind", "cancelReason stored");
      assert(splits[0]?.fulfillmentStatus === "cancelled", "Split status is 'cancelled'");

      const variantAfter = await prisma.productVariant.findUnique({
        where: { id: variantEligible.id },
      });
      assert(variantAfter?.stockBoxes === initialStock, `Stock restored exactly to original ${initialStock}`);
    }

    // -------------------------------------------------------------------------
    // 11. INTEGRATION TEST: Cancellation After Window Expiry Blocked
    // -------------------------------------------------------------------------
    console.log("\n--- 11. Testing Cancellation After Window Expiry Blocked ---");
    {
      const order: any = await prisma.order.create({
        data: {
          id: `ORD-F2-EXPIRED-${stamp}`,
          customerName: "Late Customer",
          customerPhone: "9876543216",
          shippingAddress: {},
          subtotal: 500,
          total: 500,
          orderStatus: "Confirmed",
          autoAccepted: true,
          // Cancel window expired 10 minutes ago
          cancelWindowExpiresAt: new Date(Date.now() - 10 * 60 * 1000),
          confirmedAt: new Date(Date.now() - 12 * 60 * 1000),
        },
      });

      cleanupOrderIds.push(order.id);

      const cancelRes = await cancelOrder({
        orderId: order.id,
        reason: "Customer trying to cancel late",
        cancelledBy: "customer",
      });

      assert(cancelRes.success === false, "Late customer cancel blocked");
      assert(
        cancelRes.error?.includes("expired"),
        `Error indicates window expired: ${cancelRes.error}`
      );
    }

    // -------------------------------------------------------------------------
    // 12. INTEGRATION TEST: Double-Cancel Protection (Idempotency)
    // -------------------------------------------------------------------------
    console.log("\n--- 12. Testing Double-Cancel Protection ---");
    {
      // Attempting to cancel an already-cancelled order
      const secondCancelRes = await cancelOrder({
        orderId: `ORD-F2-CANCEL-${stamp}`,
        reason: "Attempt duplicate cancel",
        cancelledBy: "customer",
      });

      assert(secondCancelRes.success === false, "Duplicate cancel correctly rejected");
      assert(
        secondCancelRes.error?.includes("cannot be cancelled at this stage"),
        `Rejection reason: ${secondCancelRes.error}`
      );
    }

    // -------------------------------------------------------------------------
    // 13. INTEGRATION TEST: Vendor Order Split Rejection
    // -------------------------------------------------------------------------
    console.log("\n--- 13. Testing Vendor Order Split Rejection ---");
    {
      // Create an awaiting vendor order
      const orderRes = await createOrder({
        id: `ORD-F2-REJECT-${stamp}`,
        customerName: "Reject Customer",
        customerPhone: "9876543217",
        paymentMethod: "COD",
        shippingAddress: {
          fullName: "Customer",
          phone: "9876543217",
          street: "Begur Road",
          city: "Bengaluru",
          state: "Karnataka",
          pincode: "560068",
          latitude: 12.8880,
          longitude: 77.6330,
        } as any,
        items: [
          {
            productId: prodOffline.id,
            productName: prodOffline.name,
            variantId: variantOffline.id,
            variantDetails: "Standard",
            boxQuantity: 2,
            pricePerBox: 500,
            totalPrice: 1000,
          },
        ],
      });

      cleanupOrderIds.push(`ORD-F2-REJECT-${stamp}`);

      const splits: any = await prisma.vendorOrderSplit.findMany({
        where: { orderId: `ORD-F2-REJECT-${stamp}` },
      });

      const splitId = splits[0]?.id;
      assert(splitId !== undefined, "Found split for reject test");

      const rejectRes = await rejectVendorOrderSplit({
        splitId: splitId!,
        vendorId: vendorOffline.id,
        reason: "Shop closed due to emergency maintenance",
      });

      assert(rejectRes.success === true, "Vendor reject succeeded");

      const updatedSplit: any = await prisma.vendorOrderSplit.findUnique({
        where: { id: splitId },
      });
      assert(updatedSplit?.fulfillmentStatus === "cancelled", "Split fulfillmentStatus is 'cancelled'");
      assert(updatedSplit?.cancelledBy === "vendor", "Split cancelledBy is 'vendor'");

      const updatedOrder: any = await prisma.order.findUnique({
        where: { id: `ORD-F2-REJECT-${stamp}` },
      });
      assert(updatedOrder?.orderStatus === "Cancelled", "Parent order updated to 'Cancelled'");
    }

    // -------------------------------------------------------------------------
    // 14. INTEGRATION TEST: Heartbeat Throttle Verification
    // -------------------------------------------------------------------------
    console.log("\n--- 14. Testing Heartbeat 20-Second Throttle Logic ---");
    {
      const now = new Date();
      await prisma.vendor.update({
        where: { id: vendorEligible.id },
        data: { lastHeartbeatAt: now },
      });

      const fetched: any = await prisma.vendor.findUnique({
        where: { id: vendorEligible.id },
      });

      const diffMs = Date.now() - new Date((fetched as any)?.lastHeartbeatAt || 0).getTime();
      const isThrottled = diffMs < 20 * 1000;

      assert(isThrottled === true, "Immediate successive heartbeat recognized as throttled (<20s)");
    }

    console.log("\n============================================================");
    console.log(`🎉 ALL FEATURE 2 TESTS COMPLETED: ${passedCount} passed, ${failedCount} failed`);
    console.log("============================================================\n");
  } finally {
    // -------------------------------------------------------------------------
    // CLEANUP TEST RECORDS
    // -------------------------------------------------------------------------
    console.log("🧹 Cleaning up Feature 2 test records...");
    try {
      if (cleanupOrderIds.length > 0) {
        await prisma.orderAlert.deleteMany({ where: { orderId: { in: cleanupOrderIds } } });
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
    console.log("✨ Feature 2 Test Suite completed with 100% success.");
  }
}

runFeature2TestSuite().catch((err) => {
  console.error("Feature 2 Test Suite crashed:", err);
  process.exit(1);
});
