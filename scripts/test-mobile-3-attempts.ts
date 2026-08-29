import {
  checkVendorLoginLockout,
  recordVendorLoginFailure,
  resetVendorLoginLockout,
} from "../lib/rate-limit";

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${msg}`);
    process.exit(1);
  }
  console.log(`  ✓ ${msg}`);
}

async function testMobileLockoutSequence() {
  console.log("==========================================================================");
  console.log("MOBILE APP (INTRIHUB-BUSINESS) 3-ATTEMPT LOCKOUT SEQUENCE VERIFICATION");
  console.log("==========================================================================\n");

  const mobileIp = "198.51.100.77";
  resetVendorLoginLockout(mobileIp);

  // Check 0:
  const initCheck = checkVendorLoginLockout(mobileIp);
  assert(!initCheck.locked, "Mobile initial state: NOT locked");
  assert(initCheck.remainingAttempts === 3, "Mobile initial remaining attempts === 3");

  // Attempt 1: check-method with unapproved vendor
  const att1 = recordVendorLoginFailure(mobileIp);
  assert(!att1.locked, "Mobile Attempt 1: NOT locked (shows rejection state without lockout)");
  assert(att1.remainingAttempts === 2, "Mobile Attempt 1: Exactly 2 remaining attempts");

  // Attempt 2: second invalid attempt
  const att2 = recordVendorLoginFailure(mobileIp);
  assert(!att2.locked, "Mobile Attempt 2: NOT locked yet");
  assert(att2.remainingAttempts === 1, "Mobile Attempt 2: Exactly 1 remaining attempt");

  // Attempt 3: third invalid attempt
  const att3 = recordVendorLoginFailure(mobileIp);
  assert(att3.locked === true, "Mobile Attempt 3: NOW LOCKED OUT (15 minutes)");
  assert(att3.remainingAttempts === 0, "Mobile Attempt 3: Exactly 0 remaining attempts");
  assert((att3.retryAfterSeconds || 0) > 890, "Mobile Attempt 3: 15-minute retry timer active");

  // Success resets
  resetVendorLoginLockout(mobileIp);
  const afterReset = checkVendorLoginLockout(mobileIp);
  assert(!afterReset.locked, "Successful login resets mobile lockout to unlocked");
  assert(afterReset.remainingAttempts === 3, "Successful login resets remaining attempts to 3");

  console.log("\n==========================================================================");
  console.log("🎉 ALL MOBILE (INTRIHUB-BUSINESS) 3-ATTEMPT TESTS PASSED! ✓");
  console.log("==========================================================================");
}

testMobileLockoutSequence().catch(console.error);
