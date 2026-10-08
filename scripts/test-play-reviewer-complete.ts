import assert from "assert";
import { POST as checkMethodPost } from "../app/api/mobile/auth/check-method/route";
import { POST as loginPasswordPost } from "../app/api/mobile/auth/login-password/route";
import { POST as sendOtpPost } from "../app/api/mobile/auth/send-otp/route";
import { POST as verifyOtpPost } from "../app/api/mobile/auth/verify-otp/route";
import { NextRequest } from "next/server";
import { recordVendorLoginFailure } from "../lib/rate-limit";

async function runCompletePlayReviewerSuite() {
  console.log("============================================================");
  console.log("🚀 STARTING COMPREHENSIVE GOOGLE PLAY REVIEWER AUDIT SUITE");
  console.log("============================================================\n");

  const SIMULATED_IP = "192.0.2.42";

  // -------------------------------------------------------------------------
  // SECTION 1: INVENTORY & BUSINESS APP REVIEWER (bizreview@intrihub.com)
  // -------------------------------------------------------------------------
  console.log("--- 1. Testing Business App Reviewer (bizreview@intrihub.com) ---");

  // 1.1 Check Method
  {
    console.log("  [1.1] Testing check-method for bizreview@intrihub.com...");
    const req = new NextRequest("http://localhost/api/mobile/auth/check-method", {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": SIMULATED_IP },
      body: JSON.stringify({ email: "bizreview@intrihub.com", purpose: "business" }),
    });
    const res = await checkMethodPost(req);
    const data = await res.json();
    assert.strictEqual(res.status, 200, "check-method status must be 200");
    assert.strictEqual(data.success, true, "check-method success must be true");
    assert.strictEqual(data.loginMethod, "password", "loginMethod must be 'password'");
    assert(data.vendorName, "vendorName must be present");
    console.log("  ✅ PASS: check-method returned password method for business reviewer.");
  }

  // 1.2 Password Login
  {
    console.log("  [1.2] Testing login-password with IntriBizReview#2026...");
    const req = new NextRequest("http://localhost/api/mobile/auth/login-password", {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": SIMULATED_IP },
      body: JSON.stringify({
        email: "bizreview@intrihub.com",
        password: "IntriBizReview#2026",
        purpose: "business",
      }),
    });
    const res = await loginPasswordPost(req);
    const data = await res.json();
    assert.strictEqual(res.status, 200, "login-password status must be 200");
    assert.strictEqual(data.success, true, "login-password success must be true");
    assert.strictEqual(data.user?.role, "vendor", "user role must be vendor");
    assert.strictEqual(data.vendor?.status, "approved", "vendor status must be approved");
    assert(data.tokens?.accessToken, "accessToken must be present");
    console.log("  ✅ PASS: Direct password login succeeded with approved vendor tokens.");
  }

  // 1.3 Send OTP (Testing Bypass without Email Failure)
  {
    console.log("  [1.3] Testing send-otp testing bypass...");
    const req = new NextRequest("http://localhost/api/mobile/auth/send-otp", {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": SIMULATED_IP },
      body: JSON.stringify({ email: "bizreview@intrihub.com", purpose: "business" }),
    });
    const res = await sendOtpPost(req);
    const data = await res.json();
    assert.strictEqual(res.status, 200, "send-otp status must be 200");
    assert.strictEqual(data.success, true, "send-otp success must be true");
    console.log("  ✅ PASS: send-otp succeeded without external delivery failure.");
  }

  // 1.4 Verify OTP with static testing code (123456)
  {
    console.log("  [1.4] Testing verify-otp with static test code 123456...");
    const req = new NextRequest("http://localhost/api/mobile/auth/verify-otp", {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": SIMULATED_IP },
      body: JSON.stringify({
        email: "bizreview@intrihub.com",
        otp: "123456",
        purpose: "business",
      }),
    });
    const res = await verifyOtpPost(req);
    const data = await res.json();
    assert.strictEqual(res.status, 200, "verify-otp status must be 200");
    assert.strictEqual(data.success, true, "verify-otp success must be true");
    assert.strictEqual(data.user?.role, "vendor", "user role must be vendor");
    assert(data.tokens?.accessToken, "accessToken must be issued on OTP verify");
    console.log("  ✅ PASS: Static test OTP (123456) bypassed MFA and issued vendor tokens.");
  }

  // -------------------------------------------------------------------------
  // SECTION 2: CUSTOMER APP REVIEWER (playreview@intrihub.com)
  // -------------------------------------------------------------------------
  console.log("\n--- 2. Testing Customer App Reviewer (playreview@intrihub.com) ---");

  // 2.1 Check Method
  {
    console.log("  [2.1] Testing check-method for playreview@intrihub.com...");
    const req = new NextRequest("http://localhost/api/mobile/auth/check-method", {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": SIMULATED_IP },
      body: JSON.stringify({ email: "playreview@intrihub.com", purpose: "customer" }),
    });
    const res = await checkMethodPost(req);
    const data = await res.json();
    assert.strictEqual(res.status, 200, "check-method status must be 200");
    assert.strictEqual(data.success, true, "check-method success must be true");
    assert.strictEqual(data.loginMethod, "password", "customer reviewer loginMethod must be password");
    console.log("  ✅ PASS: Customer reviewer routed to password method.");
  }

  // 2.2 Password Login
  {
    console.log("  [2.2] Testing customer login-password with IntriReview#2026...");
    const req = new NextRequest("http://localhost/api/mobile/auth/login-password", {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": SIMULATED_IP },
      body: JSON.stringify({
        email: "playreview@intrihub.com",
        password: "IntriReview#2026",
        purpose: "customer",
      }),
    });
    const res = await loginPasswordPost(req);
    const data = await res.json();
    assert.strictEqual(res.status, 200, "login-password status must be 200");
    assert.strictEqual(data.success, true, "login-password success must be true");
    assert.strictEqual(data.user?.role, "customer", "role must be customer");
    assert(data.tokens?.accessToken, "accessToken must be present");
    console.log("  ✅ PASS: Customer password login succeeded.");
  }

  // 2.3 Customer OTP Verify with static test code (123456)
  {
    console.log("  [2.3] Testing customer verify-otp with static test code 123456...");
    const req = new NextRequest("http://localhost/api/mobile/auth/verify-otp", {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": SIMULATED_IP },
      body: JSON.stringify({
        email: "playreview@intrihub.com",
        otp: "123456",
        purpose: "customer",
      }),
    });
    const res = await verifyOtpPost(req);
    const data = await res.json();
    assert.strictEqual(res.status, 200, "customer verify-otp status must be 200");
    assert.strictEqual(data.success, true, "customer verify-otp success must be true");
    assert.strictEqual(data.user?.role, "customer", "customer role verified");
    console.log("  ✅ PASS: Static test OTP (123456) succeeded for customer app.");
  }

  // -------------------------------------------------------------------------
  // SECTION 3: IP LOCKOUT IMMUNITY & AUTO-CLEAR
  // -------------------------------------------------------------------------
  console.log("\n--- 3. Testing IP Lockout Immunity & Auto-Clear ---");
  {
    const ATTACK_IP = "203.0.113.99";
    // Force a lockout on this IP
    for (let i = 0; i < 5; i++) {
      recordVendorLoginFailure(ATTACK_IP);
    }

    console.log("  [3.1] Verifying that ATTACK_IP is locked out for random emails...");
    const lockedReq = new NextRequest("http://localhost/api/mobile/auth/check-method", {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": ATTACK_IP },
      body: JSON.stringify({ email: "unknown_attacker@example.com", purpose: "business" }),
    });
    const lockedRes = await checkMethodPost(lockedReq);
    assert.strictEqual(lockedRes.status, 429, "Random email on locked IP must receive 429");
    console.log("  ✅ PASS: Rate limiter correctly locks out unauthorized emails.");

    console.log("  [3.2] Verifying that bizreview@intrihub.com BYPASSES and CLEARS the lockout...");
    const reviewerReq = new NextRequest("http://localhost/api/mobile/auth/check-method", {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": ATTACK_IP },
      body: JSON.stringify({ email: "bizreview@intrihub.com", purpose: "business" }),
    });
    const reviewerRes = await checkMethodPost(reviewerReq);
    const reviewerData = await reviewerRes.json();
    assert.strictEqual(reviewerRes.status, 200, "Reviewer request on locked IP must succeed with 200");
    assert.strictEqual(reviewerData.success, true, "Reviewer must succeed");
    assert.strictEqual(reviewerData.loginMethod, "password", "Reviewer must get password method");
    console.log("  ✅ PASS: Reviewer account immediately bypassed and cleared the IP lockout.");
  }

  console.log("\n============================================================");
  console.log("🎉 ALL PLAY REVIEWER AUDIT TESTS PASSED (100% SUCCESS)");
  console.log("============================================================\n");
}

runCompletePlayReviewerSuite().catch((err) => {
  console.error("Test Suite Failed:", err);
  process.exit(1);
});
