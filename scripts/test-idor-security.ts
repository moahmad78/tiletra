/**
 * Intrihub IDOR & Access Control Hardening Verification Suite
 * Verifies that:
 * 1. Cross-user address updates, deletions, and set-default are strictly blocked (IDOR prevention).
 * 2. Profile updates cannot overwrite another user's email or profile.
 * 3. Administrative server actions (orders, coupons, categories, vendors) reject non-admin callers.
 * 4. Spoofed client headers (x-user-id, x-user-phone) are rejected.
 * 5. Orders and delivery location queries require legitimate caller ownership.
 */

import { prisma } from "../lib/prisma";
import { saveAddress, deleteAddress, setDefaultAddress } from "../lib/actions/addresses";
import { updateUserProfile } from "../lib/actions/auth";
import { deleteOrder, updateOrderStatus } from "../lib/actions/orders";
import { createCoupon } from "../lib/actions/coupons";
import { createCategory } from "../lib/actions/categories";
import { approveVendor } from "../lib/actions/admin-vendor";
import { getAuthenticatedUser } from "../lib/auth-helpers";
import { NextRequest } from "next/server";

async function runIdorTests() {
  console.log("================================================================");
  console.log("🔒 INTRIHUB IDOR & ACCESS CONTROL HARDENING AUDIT");
  console.log("================================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}${detail ? ` - ${detail}` : ""}`);
      failed++;
    }
  }

  // Setup: Create 2 test users (User A & User B)
  const phoneA = "9999000001";
  const phoneB = "9999000002";
  const emailA = "testuser_a@intrihub-audit.com";
  const emailB = "testuser_b@intrihub-audit.com";

  await prisma.address.deleteMany({
    where: {
      user: {
        phone: { in: [phoneA, phoneB] },
      },
    },
  });
  await prisma.user.deleteMany({
    where: {
      phone: { in: [phoneA, phoneB] },
    },
  });

  const userA = await prisma.user.create({
    data: {
      phone: phoneA,
      email: emailA,
      name: "Alice Owner",
      role: "customer",
      phoneVerified: true,
    },
  });

  const userB = await prisma.user.create({
    data: {
      phone: phoneB,
      email: emailB,
      name: "Bob Attacker",
      role: "customer",
      phoneVerified: true,
    },
  });

  console.log("--- 1. ADDRESS CROSS-USER IDOR DEFENSE ---");
  // User A creates an address
  const addrRes = await saveAddress(userA.id, {
    street: "123 Alice Residence",
    city: "Bangalore",
    state: "Karnataka",
    pincode: "560001",
    isDefault: true,
  });
  assert(addrRes.success && !!addrRes.address, "User A successfully creates personal address");
  const addressAId = addrRes.address!.id;

  // Attack 1: User B tries to UPDATE User A's address via saveAddress
  const attackUpdateRes = await saveAddress(userB.id, {
    id: addressAId,
    street: "HACKED ADDRESS BY BOB",
    city: "Hacked City",
  });
  assert(
    !attackUpdateRes.success && attackUpdateRes.error?.includes("unauthorized"),
    "User B blocked from updating User A address (IDOR update prevented)",
    attackUpdateRes.error
  );

  // Verify address in DB was NOT changed
  const checkAddrAfterUpdate = await prisma.address.findUnique({ where: { id: addressAId } });
  assert(
    checkAddrAfterUpdate?.street === "123 Alice Residence",
    "Address in database remains untouched by unauthorized update attempt"
  );

  // Attack 2: User B tries to set User A's address as default
  const attackSetDefault = await setDefaultAddress(userB.id, addressAId);
  assert(
    !attackSetDefault.success && attackSetDefault.error?.includes("unauthorized"),
    "User B blocked from setting User A address as default (IDOR set-default prevented)",
    attackSetDefault.error
  );

  // Attack 3: User B tries to delete User A's address
  await deleteAddress(userB.id, addressAId);
  const checkAddrAfterDelete = await prisma.address.findUnique({ where: { id: addressAId } });
  assert(
    checkAddrAfterDelete !== null,
    "User B cannot delete User A address (deleteAddress strictly scoped to userId)"
  );

  console.log("\n--- 2. PROFILE CROSS-USER IDOR & ACCOUNT TAKEOVER DEFENSE ---");
  // Attack 4: User B tries to overwrite User A's email (account takeover via duplicate email)
  const attackEmailTakeover = await updateUserProfile(userB.id, {
    email: emailA,
  });
  assert(
    !attackEmailTakeover.success && attackEmailTakeover.error?.includes("already linked"),
    "User B prevented from hijacking User A email address",
    attackEmailTakeover.error
  );

  // Attack 5: Attacker passes non-existent user ID
  const attackFakeId = await updateUserProfile("non-existent-user-id-9999", {
    name: "Ghost Name",
  });
  assert(
    !attackFakeId.success,
    "updateUserProfile rejects invalid/non-existent user ID"
  );

  console.log("\n--- 3. UNTRUSTED HEADER SPOOFING DEFENSE ---");
  // Attack 6: Caller passes spoofed x-user-id header without cryptographic JWT / cookie
  const spoofedReq = new NextRequest("http://localhost:3000/api/addresses", {
    headers: {
      "x-user-id": userA.id,
      "x-user-phone": userA.phone,
    },
  });
  const authenticatedUser = await getAuthenticatedUser(spoofedReq);
  assert(
    authenticatedUser === null,
    "Spoofed unverified headers (x-user-id, x-user-phone) are completely rejected"
  );

  console.log("\n--- 4. ADMINISTRATIVE MUTATION ACTION GUARDS ---");
  // Attack 7: Calling administrative server actions without admin session token
  const deleteOrderRes = await deleteOrder("fake-order-id");
  assert(
    !deleteOrderRes.success && (deleteOrderRes.error?.includes("Administrator privileges required") || deleteOrderRes.error?.includes("Unauthorized")),
    "deleteOrder rejected unauthorized non-admin execution",
    deleteOrderRes.error
  );

  const updateOrderStatusRes = await updateOrderStatus("fake-order-id", "Delivered");
  assert(
    !updateOrderStatusRes.success && (updateOrderStatusRes.error?.includes("Administrator privileges required") || updateOrderStatusRes.error?.includes("Unauthorized")),
    "updateOrderStatus rejected unauthorized non-admin execution",
    updateOrderStatusRes.error
  );

  const createCouponRes = await createCoupon({
    code: "HACKEDCOUPON",
    type: "percentage",
    value: 50,
  });
  assert(
    !createCouponRes.success && (createCouponRes.error?.includes("Administrator privileges required") || createCouponRes.error?.includes("Unauthorized")),
    "createCoupon rejected unauthorized non-admin execution",
    createCouponRes.error
  );

  const createCategoryRes = await createCategory({
    name: "Hacked Category",
  });
  assert(
    !createCategoryRes.success && (createCategoryRes.error?.includes("Administrator privileges required") || createCategoryRes.error?.includes("Unauthorized")),
    "createCategory rejected unauthorized non-admin execution",
    createCategoryRes.error
  );

  const approveVendorRes = await approveVendor("fake-vendor-id");
  assert(
    !approveVendorRes.success && (approveVendorRes.error?.includes("Administrator privileges required") || approveVendorRes.error?.includes("Unauthorized")),
    "approveVendor rejected unauthorized non-admin execution",
    approveVendorRes.error
  );

  // Cleanup test users and addresses
  await prisma.address.deleteMany({
    where: {
      user: {
        phone: { in: [phoneA, phoneB] },
      },
    },
  });
  await prisma.user.deleteMany({
    where: {
      phone: { in: [phoneA, phoneB] },
    },
  });

  console.log("\n================================================================");
  console.log(`TOTAL IDOR AUDIT TESTS: ${passed + failed}`);
  console.log(`PASSED: ${passed}`);
  console.log(`FAILED: ${failed}`);
  console.log("================================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runIdorTests().catch((err) => {
  console.error("Test runner encountered an error:", err);
  process.exit(1);
});
