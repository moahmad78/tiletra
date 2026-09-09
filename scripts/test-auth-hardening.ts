import assert from "assert";
import crypto from "crypto";
import {
  generateAdminSessionToken,
  verifyAdminSessionToken,
  generateVendorSessionToken,
  verifyVendorSessionToken,
} from "../lib/server-auth";
import { hashPassword, verifyPassword, validatePasswordStrength } from "../lib/password-security";
import { checkRateLimit, isLockedOut, recordFailedAttempt, resetFailedAttempts } from "../lib/rate-limit";

async function runAuthHardeningTestSuite() {
  console.log("==================================================================");
  console.log("🔒 INTRIHUB AUTHENTICATION SECURITY HARDENING VERIFICATION");
  console.log("==================================================================");

  let passedCount = 0;

  // --- 1. Admin Session Token & Forgery Protection ---
  console.log("\n--- 1. Admin Session Token & Forgery Protection ---");
  {
    const adminId = "admin-test-123";
    const email = "admin@intrihub.com";

    // Valid token
    const token = generateAdminSessionToken(adminId, email);
    assert.ok(token && token.includes("."), "Admin token must be a signed dot-delimited string");

    const verified = verifyAdminSessionToken(token);
    assert.strictEqual(verified.valid, true, "Valid admin token must verify successfully");
    assert.strictEqual(verified.email, email, "Token email must match admin email");
    assert.strictEqual(verified.adminId, adminId, "Token adminId must match");
    console.log("  ✓ Valid HMAC-signed admin session token verifies cleanly");
    passedCount++;

    // Forged token: altered payload
    const [payload, sig] = token.split(".");
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    decoded.email = "attacker@evil.com";
    const forgedPayload = Buffer.from(JSON.stringify(decoded)).toString("base64url");
    const forgedToken = `${forgedPayload}.${sig}`;

    const forgedCheck = verifyAdminSessionToken(forgedToken);
    assert.strictEqual(forgedCheck.valid, false, "Forged admin token must be rejected");
    console.log("  ✓ Tampered admin session token rejected (signature mismatch)");
    passedCount++;

    // Expired token
    const expiredPayload = JSON.stringify({
      adminId,
      email,
      exp: Date.now() - 1000,
    });
    const b64Exp = Buffer.from(expiredPayload).toString("base64url");
    const adminSecret =
      process.env.ADMIN_SESSION_SECRET ||
      process.env.JWT_SECRET ||
      process.env.NEXTAUTH_SECRET ||
      "intrihub-admin-secure-key-2026";
    const expSig = crypto.createHmac("sha256", adminSecret).update(b64Exp).digest("base64url");
    const expiredToken = `${b64Exp}.${expSig}`;

    const expCheck = verifyAdminSessionToken(expiredToken);
    assert.strictEqual(expCheck.valid, false, "Expired admin session must be rejected");
    console.log("  ✓ Expired admin session token rejected automatically");
    passedCount++;
  }

  // --- 2. Vendor Session Token & IDOR Protection ---
  console.log("\n--- 2. Vendor Session Token & Signature Verification ---");
  {
    const vendorId = "vendor-abc-123";
    const ownerId = "owner-xyz-789";
    const email = "vendor@intrihub.com";

    const vToken = generateVendorSessionToken(vendorId, ownerId, email);
    assert.ok(vToken && vToken.includes("."), "Vendor token must be signed dot-delimited string");

    const vVerified = verifyVendorSessionToken(vToken);
    assert.strictEqual(vVerified.valid, true, "Valid vendor token must verify");
    assert.strictEqual(vVerified.vendorId, vendorId, "vendorId must match");
    assert.strictEqual(vVerified.ownerId, ownerId, "ownerId must match");
    console.log("  ✓ Valid HMAC-signed vendor session token verifies cleanly");
    passedCount++;

    // Tampered vendor token
    const [vPay, vSig] = vToken.split(".");
    const tamperedPayload = Buffer.from(
      JSON.stringify({ vendorId: "other-vendor", ownerId, email, exp: Date.now() + 100000 })
    ).toString("base64url");
    const tamperedVToken = `${tamperedPayload}.${vSig}`;

    const vTamperedCheck = verifyVendorSessionToken(tamperedVToken);
    assert.strictEqual(vTamperedCheck.valid, false, "Tampered vendor token must be rejected");
    console.log("  ✓ Tampered vendor token rejected (IDOR prevented)");
    passedCount++;
  }

  // --- 3. Secure Password Hashing Standards ---
  console.log("\n--- 3. Secure Password Hashing Standards ---");
  {
    const password = "SuperSecureVendorPassword2026!";
    const hash = hashPassword(password);

    assert.ok(hash.startsWith("scrypt:"), "Password must be hashed using salted scrypt");
    const parts = hash.split(":");
    assert.strictEqual(parts.length, 3, "Scrypt hash must contain scrypt:salt:derivedKey");
    assert.strictEqual(parts[1].length, 32, "Salt must be 16 bytes hex (32 chars)");

    const matches = verifyPassword(password, hash);
    assert.strictEqual(matches, true, "Legitimate password must verify against scrypt hash");

    const wrongMatches = verifyPassword("WrongPassword123!", hash);
    assert.strictEqual(wrongMatches, false, "Incorrect password must return false");

    console.log("  ✓ Passwords hashed using cryptographically salted scrypt with constant-time verification");
    passedCount++;
  }

  // --- 4. Password Strength & Length Bounds ---
  console.log("\n--- 4. Password Strength & Length Bounds ---");
  {
    const weak = validatePasswordStrength("weak");
    assert.strictEqual(weak.valid, false, "Short password (<8 chars) must be rejected");

    const lettersOnly = validatePasswordStrength("onlylettershere");
    assert.strictEqual(lettersOnly.valid, false, "Password without numbers/special chars must be rejected");

    const good = validatePasswordStrength("SecureP@ssw0rd");
    assert.strictEqual(good.valid, true, "Strong password must be accepted");

    const oversized = "A".repeat(150);
    const overCheck = validatePasswordStrength(oversized);
    assert.strictEqual(overCheck.valid, false, "Oversized password (>128 chars) must be rejected immediately");

    console.log("  ✓ Password policy validates minimum complexity and enforces hard 128-char limit");
    passedCount++;
  }

  // --- 5. Rate Limiting & Account Lockout ---
  console.log("\n--- 5. Rate Limiting & Account Lockout ---");
  {
    const testKey = `test-ip-${Date.now()}`;
    resetFailedAttempts(testKey);

    // Initial state: not locked
    const initStatus = isLockedOut(testKey);
    assert.strictEqual(initStatus.locked, false, "Initial state must not be locked");
    assert.strictEqual(initStatus.remainingAttempts, 3, "Must have 3 remaining attempts");

    // Fail 1
    const fail1 = recordFailedAttempt(testKey, 3, 15 * 60 * 1000);
    assert.strictEqual(fail1.locked, false, "Attempt 1 should not lock");
    assert.strictEqual(fail1.remainingAttempts, 2);

    // Fail 2
    const fail2 = recordFailedAttempt(testKey, 3, 15 * 60 * 1000);
    assert.strictEqual(fail2.locked, false, "Attempt 2 should not lock");
    assert.strictEqual(fail2.remainingAttempts, 1);

    // Fail 3 -> Lockout
    const fail3 = recordFailedAttempt(testKey, 3, 15 * 60 * 1000);
    assert.strictEqual(fail3.locked, true, "Attempt 3 must trigger security lockout");
    assert.strictEqual(fail3.remainingAttempts, 0);

    // Check status while locked
    const lockedStatus = isLockedOut(testKey);
    assert.strictEqual(lockedStatus.locked, true, "isLockedOut must report true");

    // Reset lockout
    resetFailedAttempts(testKey);
    const resetStatus = isLockedOut(testKey);
    assert.strictEqual(resetStatus.locked, false, "After reset, account must be unlocked");

    console.log("  ✓ Brute-force lockout triggers after exactly 3 failed attempts (15-min lockout)");
    passedCount++;
  }

  console.log("\n==================================================================");
  console.log(`🎉 ALL ${passedCount} AUTHENTICATION HARDENING TESTS PASSED!`);
  console.log("==================================================================");
}

runAuthHardeningTestSuite().catch((err) => {
  console.error("Test failure:", err);
  process.exit(1);
});
