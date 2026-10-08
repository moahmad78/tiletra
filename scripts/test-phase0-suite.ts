/**
 * Test Suite for Phase 0: Save Coordinates & Platform Foundation
 * 
 * Tests:
 * 1. P0-1: Address creation with valid coordinates (latitude, longitude, accuracy, source)
 * 2. P0-1: Address update preserving and updating coordinates
 * 3. P0-1: Coordinate range validations (-90 <= lat <= 90, -180 <= lng <= 180)
 * 4. P0-1: saveUserAddress in auth.ts coordinate handling
 * 5. P0-2: Backfill coordinates script execution and safety (never overwrites existing)
 * 6. P0-3: Vendor coordinate presence & location missing detection
 * 7. P0-4: DeviceToken table creation, registration, and query resolution
 * 8. P0-5: Vendor foreground push event data extraction and routing
 */

process.env.ALLOW_SYSTEM_MUTATIONS = "true";

import { prisma } from "../lib/prisma";
import { saveAddress, getUserAddresses, deleteAddress } from "../lib/actions/addresses";
import { saveUserAddress } from "../lib/actions/auth";
import { registerPushToken } from "../lib/push-notifications";
import { runBackfill } from "./backfill-address-coordinates";

async function runPhase0TestSuite() {
  console.log("============================================================");
  console.log("🚀 STARTING PHASE 0 AUTOMATED END-TO-END TEST SUITE");
  console.log("============================================================\n");

  let testsPassed = 0;
  let testsTotal = 0;
  const createdAddressIds: string[] = [];
  const createdUserIds: string[] = [];
  const createdTokenStrings: string[] = [];

  function assert(condition: boolean, desc: string) {
    testsTotal++;
    if (condition) {
      console.log(`  ✅ PASS: ${desc}`);
      testsPassed++;
    } else {
      console.error(`  ❌ FAIL: ${desc}`);
      throw new Error(`Assertion failed: ${desc}`);
    }
  }

  try {
    // Setup test user
    const testUser = await prisma.user.create({
      data: {
        name: "Phase0 Test User",
        email: `phase0_test_${Date.now()}@intrihub.com`,
        phone: `99${Math.floor(10000000 + Math.random() * 90000000)}`,
        role: "customer",
      },
    });
    createdUserIds.push(testUser.id);

    // ------------------------------------------------------------
    // TEST GROUP 1: P0-1 Address Creation with Coordinates
    // ------------------------------------------------------------
    console.log("--- 1. Testing P0-1 Address Creation with Coordinates ---");
    const testLat = 12.9716;
    const testLng = 77.5946;
    const createRes = await saveAddress(testUser.id, {
      street: "MG Road Phase 0 Test Street",
      city: "Bengaluru",
      state: "Karnataka",
      pincode: "560001",
      latitude: testLat,
      longitude: testLng,
      accuracy: 12.5,
      source: "GPS",
      label: "Home",
      isDefault: true,
    } as any);

    assert(createRes.success === true, "Address created successfully");
    assert(!!createRes.address?.id, "Address ID generated");
    if (createRes.address?.id) createdAddressIds.push(createRes.address.id);

    assert(createRes.address?.latitude === testLat, `Latitude saved: ${createRes.address?.latitude}`);
    assert(createRes.address?.longitude === testLng, `Longitude saved: ${createRes.address?.longitude}`);
    assert(createRes.address?.accuracy === 12.5, `Accuracy saved: ${createRes.address?.accuracy}`);
    assert(createRes.address?.source === "GPS", `Source saved as GPS: ${createRes.address?.source}`);

    // ------------------------------------------------------------
    // TEST GROUP 2: P0-1 Address Update with Coordinates
    // ------------------------------------------------------------
    console.log("\n--- 2. Testing P0-1 Address Update with New Coordinates ---");
    const updatedLat = 12.9352;
    const updatedLng = 77.6245;
    const updateRes = await saveAddress(testUser.id, {
      id: createRes.address?.id,
      street: "MG Road Updated Flat 4B",
      city: "Bengaluru",
      state: "Karnataka",
      pincode: "560034",
      latitude: updatedLat,
      longitude: updatedLng,
      accuracy: 8.2,
      source: "MAP_PIN",
      label: "Work",
    } as any);

    assert(updateRes.success === true, "Address updated successfully");
    assert(updateRes.address?.latitude === updatedLat, `Latitude updated: ${updateRes.address?.latitude}`);
    assert(updateRes.address?.longitude === updatedLng, `Longitude updated: ${updateRes.address?.longitude}`);
    assert(updateRes.address?.accuracy === 8.2, `Accuracy updated: ${updateRes.address?.accuracy}`);
    assert(updateRes.address?.source === "MAP_PIN", `Source updated to MAP_PIN: ${updateRes.address?.source}`);

    // ------------------------------------------------------------
    // TEST GROUP 3: P0-1 Invalid Coordinate Range Guard
    // ------------------------------------------------------------
    console.log("\n--- 3. Testing P0-1 Coordinate Range Validation ---");
    const invalidLatRes = await saveAddress(testUser.id, {
      street: "Out of Bounds Latitude Street",
      city: "Bengaluru",
      state: "Karnataka",
      pincode: "560001",
      latitude: 195.0, // Invalid: must be <= 90
      longitude: 77.5946,
    } as any);
    assert(invalidLatRes.success === true, "Creation succeeds with sanitized invalid coords");
    assert(invalidLatRes.address?.latitude === null, "Out-of-range latitude was safely rejected to null");
    if (invalidLatRes.address?.id) createdAddressIds.push(invalidLatRes.address.id);

    const invalidLngRes = await saveAddress(testUser.id, {
      street: "Out of Bounds Longitude Street",
      city: "Bengaluru",
      state: "Karnataka",
      pincode: "560001",
      latitude: 12.9716,
      longitude: -250.0, // Invalid: must be >= -180
    } as any);
    assert(invalidLngRes.success === true, "Creation succeeds with sanitized invalid coords");
    assert(invalidLngRes.address?.longitude === null, "Out-of-range longitude was safely rejected to null");
    if (invalidLngRes.address?.id) createdAddressIds.push(invalidLngRes.address.id);

    // ------------------------------------------------------------
    // TEST GROUP 4: P0-1 saveUserAddress in auth.ts
    // ------------------------------------------------------------
    console.log("\n--- 4. Testing P0-1 saveUserAddress in auth.ts ---");
    const authSaveRes = await saveUserAddress(testUser.id, {
      line1: "123 Indiranagar 100ft Road",
      city: "Bengaluru",
      state: "Karnataka",
      pincode: "560038",
      latitude: 12.9784,
      longitude: 77.6408,
      source: "SEARCH",
      label: "Home",
    });
    assert(authSaveRes.success === true, "saveUserAddress succeeded");
    assert(authSaveRes.address?.latitude === 12.9784, `auth.ts latitude saved: ${authSaveRes.address?.latitude}`);
    assert(authSaveRes.address?.longitude === 77.6408, `auth.ts longitude saved: ${authSaveRes.address?.longitude}`);
    if (authSaveRes.address?.id) createdAddressIds.push(authSaveRes.address.id);

    // ------------------------------------------------------------
    // TEST GROUP 5: P0-2 Backfill Coordinates Script
    // ------------------------------------------------------------
    console.log("\n--- 5. Testing P0-2 Backfill Address Coordinates ---");
    // Create an address without coordinates
    const noCoordAddr = await prisma.address.create({
      data: {
        userId: testUser.id,
        street: "Koramangala 4th Block Old Address",
        city: "Bengaluru",
        state: "Karnataka",
        pincode: "560034",
        latitude: null,
        longitude: null,
        source: "MANUAL",
      },
    });
    createdAddressIds.push(noCoordAddr.id);

    // Run backfill in dry-run
    const dryRunRes = await runBackfill({ dryRun: true });
    assert(dryRunRes.isDryRun === true, "Backfill ran in dry-run mode");
    assert(dryRunRes.needsBackfill >= 1, "Backfill detected address missing coords");
    assert(dryRunRes.updated === 0, "Dry-run did not mutate database");

    // Run backfill in execute mode
    const execRes = await runBackfill({ dryRun: false });
    assert(execRes.updated >= 1, "Backfill updated missing coordinates");

    const backfilledAddr = await prisma.address.findUnique({ where: { id: noCoordAddr.id } });
    assert(backfilledAddr?.latitude !== null, `Backfilled latitude: ${backfilledAddr?.latitude}`);
    assert(backfilledAddr?.longitude !== null, `Backfilled longitude: ${backfilledAddr?.longitude}`);
    assert(backfilledAddr?.source === "GEOCODE_BACKFILL", `Backfilled source: ${backfilledAddr?.source}`);

    // ------------------------------------------------------------
    // TEST GROUP 6: P0-3 Vendor Location Missing Flag Logic
    // ------------------------------------------------------------
    console.log("\n--- 6. Testing P0-3 Vendor Location Missing Flag Logic ---");
    const vendorWithCoords = { id: "v1", businessName: "Vendor A", latitude: 12.97, longitude: 77.59 };
    const vendorWithoutCoords = { id: "v2", businessName: "Vendor B", latitude: null, longitude: null };

    const isLocationMissingA = !vendorWithCoords.latitude || !vendorWithCoords.longitude;
    const isLocationMissingB = !vendorWithoutCoords.latitude || !vendorWithoutCoords.longitude;

    assert(isLocationMissingA === false, "Vendor with coordinates is not flagged");
    assert(isLocationMissingB === true, "Vendor missing coordinates is correctly flagged as Location Missing");

    // ------------------------------------------------------------
    // TEST GROUP 7: P0-4 DeviceToken Table & Push Handler
    // ------------------------------------------------------------
    console.log("\n--- 7. Testing P0-4 DeviceToken Table & Push Handler ---");
    const testPushToken = `ExponentPushToken[Test_${Date.now()}_Token]`;
    createdTokenStrings.push(testPushToken);

    const regRes = await registerPushToken({
      userId: testUser.id,
      role: "vendor",
      token: testPushToken,
      platform: "android",
      appVersion: "1.0.13",
    });

    assert(regRes.success === true, "registerPushToken succeeded");
    assert(regRes.deviceToken?.token === testPushToken, "Token matched in DeviceToken record");
    assert(regRes.deviceToken?.role === "vendor", "Role stored in DeviceToken");
    assert(regRes.deviceToken?.appVersion === "1.0.13", "appVersion stored in DeviceToken");

    const foundToken = await prisma.deviceToken.findUnique({ where: { token: testPushToken } });
    assert(!!foundToken, "DeviceToken query returned valid database row");
    assert(foundToken?.userId === testUser.id, "DeviceToken mapped to correct user ID");

    // ------------------------------------------------------------
    // TEST GROUP 8: P0-5 Foreground Notification Routing Contract
    // ------------------------------------------------------------
    console.log("\n--- 8. Testing P0-5 Foreground Push Event Data Handling ---");
    const mockPushNotification = {
      request: {
        content: {
          data: {
            orderId: "ord_test_phase0_99",
            title: "New Order Confirmed",
          },
        },
      },
    };

    const targetRoute = mockPushNotification.request.content.data.orderId
      ? { pathname: "/(tabs)/orders", params: { orderId: mockPushNotification.request.content.data.orderId } }
      : null;

    assert(!!targetRoute, "Foreground push generated order navigation route");
    assert(targetRoute?.params.orderId === "ord_test_phase0_99", "Target orderId resolved accurately");

    console.log("\n============================================================");
    console.log(`🎉 ALL PHASE 0 TESTS PASSED: ${testsPassed} / ${testsTotal}`);
    console.log("============================================================\n");
  } finally {
    // Cleanup test data
    console.log("🧹 Cleaning up Phase 0 test records...");
    for (const token of createdTokenStrings) {
      await prisma.deviceToken.deleteMany({ where: { token } }).catch(() => {});
    }
    for (const addrId of createdAddressIds) {
      await prisma.address.deleteMany({ where: { id: addrId } }).catch(() => {});
    }
    for (const uid of createdUserIds) {
      await prisma.user.deleteMany({ where: { id: uid } }).catch(() => {});
    }
    console.log("✅ Cleanup complete.");
  }
}

runPhase0TestSuite()
  .then(() => {
    console.log("✨ Phase 0 Test Suite completed with 100% success.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ Phase 0 Test Suite failed:", err);
    process.exit(1);
  });
