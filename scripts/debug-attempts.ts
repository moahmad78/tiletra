import {
  checkAdminLoginLockout,
  resetAdminLoginLockout,
  checkVendorLoginLockout,
  resetVendorLoginLockout,
} from "../lib/rate-limit";
import {
  sendAdminWebOtp,
  checkVendorLoginMethod,
  sendVendorWebOtp,
} from "../lib/actions/web-portal-auth";

async function testWebsiteLoginStepByStep() {
  console.log("==========================================================================");
  console.log("DEBUGGING STEP-BY-STEP WEBSITE VENDOR & ADMIN ATTEMPT COUNTING");
  console.log("==========================================================================\n");

  const testIp = `192.168.1.${Math.floor(Math.random() * 200 + 10)}`;

  // Reset before testing
  resetAdminLoginLockout(testIp);
  resetVendorLoginLockout(testIp);

  console.log(`[TEST SETUP] Using clean test IP: ${testIp}`);

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. ADMIN LOGIN TESTS
  // ─────────────────────────────────────────────────────────────────────────────
  console.log("\n--- Testing Admin Web Login ---");

  // Attempt 1:
  const adminRes1 = await sendAdminWebOtp("wrong.admin@intrihub.com");
  console.log("Admin Attempt 1 Response:", adminRes1);

  // Attempt 2:
  const adminRes2 = await sendAdminWebOtp("wrong.admin@intrihub.com");
  console.log("Admin Attempt 2 Response:", adminRes2);

  // Attempt 3:
  const adminRes3 = await sendAdminWebOtp("wrong.admin@intrihub.com");
  console.log("Admin Attempt 3 Response:", adminRes3);

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. VENDOR LOGIN TESTS
  // ─────────────────────────────────────────────────────────────────────────────
  console.log("\n--- Testing Vendor Web Login ---");

  // Attempt 1:
  const vendorRes1 = await checkVendorLoginMethod("unregistered.vendor@example.com");
  console.log("Vendor Attempt 1 Response:", vendorRes1);

  // Attempt 2:
  const vendorRes2 = await checkVendorLoginMethod("unregistered.vendor@example.com");
  console.log("Vendor Attempt 2 Response:", vendorRes2);

  // Attempt 3:
  const vendorRes3 = await checkVendorLoginMethod("unregistered.vendor@example.com");
  console.log("Vendor Attempt 3 Response:", vendorRes3);
}

testWebsiteLoginStepByStep().catch(console.error);
