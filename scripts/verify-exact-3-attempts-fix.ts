import {
  checkAdminLoginLockout,
  recordAdminLoginFailure,
  resetAdminLoginLockout,
  checkVendorLoginLockout,
  recordVendorLoginFailure,
  resetVendorLoginLockout,
  isLockedOut,
  recordFailedAttempt,
} from "../lib/rate-limit";
import {
  sendAdminWebOtp,
  checkVendorLoginMethod,
} from "../lib/actions/web-portal-auth";

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${msg}`);
    process.exit(1);
  }
  console.log(`  ✓ ${msg}`);
}

async function runRigorousVerification() {
  console.log("==========================================================================");
  console.log("EXACT 3-ATTEMPT LOGIN LOCKOUT VERIFICATION TEST SUITE");
  console.log("==========================================================================\n");

  const testIpAdmin = "198.51.100.21";
  const testIpVendor = "198.51.100.22";

  // Reset clean state
  resetAdminLoginLockout(testIpAdmin);
  resetVendorLoginLockout(testIpVendor);
  resetAdminLoginLockout("127.0.0.1");
  resetVendorLoginLockout("127.0.0.1");

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. ADMIN 3-ATTEMPT RIGOROUS SEQUENCE
  // ─────────────────────────────────────────────────────────────────────────────
  console.log("[TEST 1] Admin Login 3-Attempt Threshold Verification:");

  // Check 0:
  const adminInit = checkAdminLoginLockout(testIpAdmin);
  assert(!adminInit.locked, "Initial state: Admin is NOT locked");
  assert(adminInit.remainingAttempts === 3, "Initial remaining attempts === 3");

  // Attempt 1:
  const adminAtt1 = recordAdminLoginFailure(testIpAdmin);
  assert(!adminAtt1.locked, "Admin Attempt 1: NOT locked (must not lock on 1st attempt)");
  assert(adminAtt1.remainingAttempts === 2, "Admin Attempt 1: Exactly 2 remaining attempts");

  // Attempt 2:
  const adminAtt2 = recordAdminLoginFailure(testIpAdmin);
  assert(!adminAtt2.locked, "Admin Attempt 2: NOT locked (must not lock on 2nd attempt)");
  assert(adminAtt2.remainingAttempts === 1, "Admin Attempt 2: Exactly 1 remaining attempt");

  // Attempt 3:
  const adminAtt3 = recordAdminLoginFailure(testIpAdmin);
  assert(adminAtt3.locked === true, "Admin Attempt 3: LOCKED OUT on 3rd attempt");
  assert(adminAtt3.remainingAttempts === 0, "Admin Attempt 3: Exactly 0 remaining attempts");
  assert((adminAtt3.retryAfterSeconds || 0) > 890, "Admin Attempt 3: 15-minute timer (900s) active");

  // Attempt 4 while locked:
  const adminAtt4 = checkAdminLoginLockout(testIpAdmin);
  assert(adminAtt4.locked === true, "Check while locked: Still locked out");

  // Reset on successful login
  resetAdminLoginLockout(testIpAdmin);
  const adminAfterSuccess = checkAdminLoginLockout(testIpAdmin);
  assert(!adminAfterSuccess.locked, "Successful login resets admin lockout to unlocked");
  assert(adminAfterSuccess.remainingAttempts === 3, "Successful login resets remaining attempts to 3");

  console.log("\n--------------------------------------------------------------------------\n");

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. VENDOR 3-ATTEMPT RIGOROUS SEQUENCE
  // ─────────────────────────────────────────────────────────────────────────────
  console.log("[TEST 2] Vendor Login 3-Attempt Threshold Verification:");

  // Check 0:
  const vendorInit = checkVendorLoginLockout(testIpVendor);
  assert(!vendorInit.locked, "Initial state: Vendor is NOT locked");
  assert(vendorInit.remainingAttempts === 3, "Initial remaining attempts === 3");

  // Attempt 1:
  const vendorAtt1 = recordVendorLoginFailure(testIpVendor);
  assert(!vendorAtt1.locked, "Vendor Attempt 1: NOT locked (must not lock on 1st attempt)");
  assert(vendorAtt1.remainingAttempts === 2, "Vendor Attempt 1: Exactly 2 remaining attempts");

  // Attempt 2:
  const vendorAtt2 = recordVendorLoginFailure(testIpVendor);
  assert(!vendorAtt2.locked, "Vendor Attempt 2: NOT locked (must not lock on 2nd attempt)");
  assert(vendorAtt2.remainingAttempts === 1, "Vendor Attempt 2: Exactly 1 remaining attempt");

  // Attempt 3:
  const vendorAtt3 = recordVendorLoginFailure(testIpVendor);
  assert(vendorAtt3.locked === true, "Vendor Attempt 3: LOCKED OUT on 3rd attempt");
  assert(vendorAtt3.remainingAttempts === 0, "Vendor Attempt 3: Exactly 0 remaining attempts");
  assert((vendorAtt3.retryAfterSeconds || 0) > 890, "Vendor Attempt 3: 15-minute timer (900s) active");

  // Reset on successful login
  resetVendorLoginLockout(testIpVendor);
  const vendorAfterSuccess = checkVendorLoginLockout(testIpVendor);
  assert(!vendorAfterSuccess.locked, "Successful login resets vendor lockout to unlocked");
  assert(vendorAfterSuccess.remainingAttempts === 3, "Successful login resets remaining attempts to 3");

  console.log("\n--------------------------------------------------------------------------\n");

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. LOCKOUT EXPIRATION VERIFICATION
  // ─────────────────────────────────────────────────────────────────────────────
  console.log("[TEST 3] Lockout Expiration Verification (Simulating >15 Minutes):");
  const expireKey = "test_expire_ip:198.51.100.99";
  // Trigger 3 failures with a short 50ms lockout for test simulation
  recordFailedAttempt(expireKey, 3, 50);
  recordFailedAttempt(expireKey, 3, 50);
  recordFailedAttempt(expireKey, 3, 50);
  const lockCheckImmediate = isLockedOut(expireKey);
  assert(lockCheckImmediate.locked === true, "Immediate check: locked on 3rd failure");

  // Wait 60ms for lockout to expire
  await new Promise((resolve) => setTimeout(resolve, 60));
  const lockCheckExpired = isLockedOut(expireKey);
  assert(!lockCheckExpired.locked, "After duration elapsed: Lockout automatically expires");
  assert(lockCheckExpired.remainingAttempts === 3, "After expiration: Fresh 3 attempts restored");

  console.log("\n==========================================================================");
  console.log("🎉 ALL EXACT 3-ATTEMPT LOGIN LOCKOUT TESTS PASSED WITH 100% SUCCESS! ✓");
  console.log("==========================================================================");
}

runRigorousVerification().catch((e) => {
  console.error(e);
  process.exit(1);
});
