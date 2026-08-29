import {
  checkAdminLoginLockout,
  recordAdminLoginFailure,
  resetAdminLoginLockout,
  checkVendorLoginLockout,
  recordVendorLoginFailure,
  resetVendorLoginLockout,
} from "../lib/rate-limit";

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ Assertion Failed: ${msg}`);
    process.exit(1);
  }
  console.log(`  ✓ ${msg}`);
}

async function runTests() {
  console.log("===============================================================");
  console.log("🔒 COMPREHENSIVE LOGIN LOCKOUT (3-ATTEMPT THRESHOLD) TEST SUITE");
  console.log("===============================================================\n");

  const testIp = "203.0.113.42";

  // ───────────────────────────────────────────────────────────────────────────
  // TEST 1: ADMIN LOGIN 3-ATTEMPT SEQUENCE
  // ───────────────────────────────────────────────────────────────────────────
  console.log("TEST 1: Admin Login - Exactly 3 Failed Attempts Trigger Lockout");
  resetAdminLoginLockout(testIp);

  // Initial check
  const adminInit = checkAdminLoginLockout(testIp);
  assert(!adminInit.locked, "Initial state: IP is not locked out");
  assert(adminInit.remainingAttempts === 3, "Initial remaining attempts is 3");

  // Attempt 1: Failed login
  const adminAtt1 = recordAdminLoginFailure(testIp);
  assert(!adminAtt1.locked, "Attempt 1: Not locked");
  assert(adminAtt1.remainingAttempts === 2, "Attempt 1: Exactly 2 remaining attempts");

  // Attempt 2: Failed login
  const adminAtt2 = recordAdminLoginFailure(testIp);
  assert(!adminAtt2.locked, "Attempt 2: Not locked");
  assert(adminAtt2.remainingAttempts === 1, "Attempt 2: Exactly 1 remaining attempt");

  // Attempt 3: Failed login (Triggers Lockout)
  const adminAtt3 = recordAdminLoginFailure(testIp);
  assert(adminAtt3.locked === true, "Attempt 3: NOW LOCKED OUT");
  assert(adminAtt3.remainingAttempts === 0, "Attempt 3: Exactly 0 remaining attempts");
  assert((adminAtt3.retryAfterSeconds || 0) > 890, "Attempt 3: 15-minute (900s) lockout duration applied");

  // Check state while locked
  const adminLockedCheck = checkAdminLoginLockout(testIp);
  assert(adminLockedCheck.locked === true, "Check while locked: Returns locked=true");
  assert((adminLockedCheck.retryAfterSeconds || 0) > 890, "Check while locked: Remaining seconds reported");

  // Reset on successful login
  resetAdminLoginLockout(testIp);
  const adminAfterReset = checkAdminLoginLockout(testIp);
  assert(!adminAfterReset.locked, "Successful login resets admin lockout to unlocked");
  assert(adminAfterReset.remainingAttempts === 3, "Successful login resets remaining attempts to 3");

  console.log("\n---------------------------------------------------------------\n");

  // ───────────────────────────────────────────────────────────────────────────
  // TEST 2: VENDOR LOGIN 3-ATTEMPT SEQUENCE
  // ───────────────────────────────────────────────────────────────────────────
  console.log("TEST 2: Vendor Login - Exactly 3 Failed Attempts Trigger Lockout");
  const vendorIp = "203.0.113.88";
  resetVendorLoginLockout(vendorIp);

  // Initial check
  const vendorInit = checkVendorLoginLockout(vendorIp);
  assert(!vendorInit.locked, "Initial state: Vendor IP is not locked out");
  assert(vendorInit.remainingAttempts === 3, "Initial remaining attempts is 3");

  // Attempt 1: Failed login (unregistered email)
  const vendorAtt1 = recordVendorLoginFailure(vendorIp);
  assert(!vendorAtt1.locked, "Vendor Attempt 1: Not locked");
  assert(vendorAtt1.remainingAttempts === 2, "Vendor Attempt 1: Exactly 2 remaining attempts");

  // Attempt 2: Failed login
  const vendorAtt2 = recordVendorLoginFailure(vendorIp);
  assert(!vendorAtt2.locked, "Vendor Attempt 2: Not locked");
  assert(vendorAtt2.remainingAttempts === 1, "Vendor Attempt 2: Exactly 1 remaining attempt");

  // Attempt 3: Failed login (Triggers Lockout)
  const vendorAtt3 = recordVendorLoginFailure(vendorIp);
  assert(vendorAtt3.locked === true, "Vendor Attempt 3: NOW LOCKED OUT");
  assert(vendorAtt3.remainingAttempts === 0, "Vendor Attempt 3: Exactly 0 remaining attempts");
  assert((vendorAtt3.retryAfterSeconds || 0) > 890, "Vendor Attempt 3: 15-minute (900s) lockout duration applied");

  // Check state while locked
  const vendorLockedCheck = checkVendorLoginLockout(vendorIp);
  assert(vendorLockedCheck.locked === true, "Vendor check while locked: Returns locked=true");

  // Reset on successful login
  resetVendorLoginLockout(vendorIp);
  const vendorAfterReset = checkVendorLoginLockout(vendorIp);
  assert(!vendorAfterReset.locked, "Successful login resets vendor lockout to unlocked");
  assert(vendorAfterReset.remainingAttempts === 3, "Successful login resets remaining attempts to 3");

  console.log("\n---------------------------------------------------------------\n");

  // ───────────────────────────────────────────────────────────────────────────
  // TEST 3: PORTAL ISOLATION TEST (Admin attempts do not lock Vendor)
  // ───────────────────────────────────────────────────────────────────────────
  console.log("TEST 3: Portal Key Isolation");
  const sharedIp = "198.51.100.1";
  resetAdminLoginLockout(sharedIp);
  resetVendorLoginLockout(sharedIp);

  // Fail 2 times on Admin
  recordAdminLoginFailure(sharedIp);
  recordAdminLoginFailure(sharedIp);

  // Vendor check on same IP should still have 3 attempts!
  const vendorIsolatedCheck = checkVendorLoginLockout(sharedIp);
  assert(!vendorIsolatedCheck.locked, "Vendor is not locked despite admin failures");
  assert(vendorIsolatedCheck.remainingAttempts === 3, "Vendor maintains clean 3 attempts independently");

  resetAdminLoginLockout(sharedIp);
  resetVendorLoginLockout(sharedIp);

  console.log("\n===============================================================");
  console.log("🎉 ALL TESTS PASSED SUCCESSFULLY!");
  console.log("===============================================================");
}

runTests().catch((err) => {
  console.error("Test execution error:", err);
  process.exit(1);
});
