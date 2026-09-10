import assert from "assert";
import { POST as checkMethodPost } from "../app/api/mobile/auth/check-method/route";
import { POST as loginPasswordPost } from "../app/api/mobile/auth/login-password/route";
import { NextRequest } from "next/server";

async function runTests() {
  console.log("=== STARTING GOOGLE PLAY REVIEWER AUTHENTICATION AUDIT SUITE ===\n");

  // TEST 1: Check Method for Reviewer Email
  console.log("[TEST 1] Testing check-method for playreview@intrihub.com...");
  const req1 = new NextRequest("http://localhost/api/mobile/auth/check-method", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: "playreview@intrihub.com", purpose: "customer" }),
  });
  const res1 = await checkMethodPost(req1);
  const data1 = await res1.json();
  console.log("  Result:", data1);
  assert.strictEqual(res1.status, 200, "Status must be 200");
  assert.strictEqual(data1.success, true, "Success must be true");
  assert.strictEqual(data1.loginMethod, "password", "Reviewer must receive 'password' method");
  console.log("✓ TEST 1 PASSED: Reviewer email correctly routed to Password step.\n");

  // TEST 2: Check Method for Normal Customer (Must remain OTP)
  console.log("[TEST 2] Testing check-method for regular customer email (regular@example.com)...");
  const req2 = new NextRequest("http://localhost/api/mobile/auth/check-method", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: "regular@example.com", purpose: "customer" }),
  });
  const res2 = await checkMethodPost(req2);
  const data2 = await res2.json();
  console.log("  Result:", data2);
  assert.strictEqual(res2.status, 200, "Status must be 200");
  assert.strictEqual(data2.loginMethod, "otp", "Regular customer must receive 'otp' method");
  console.log("✓ TEST 2 PASSED: Normal customers remain on Email OTP flow.\n");

  // TEST 3: Invalid Password Attempt
  console.log("[TEST 3] Testing login-password with invalid password...");
  const req3 = new NextRequest("http://localhost/api/mobile/auth/login-password", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      email: "playreview@intrihub.com",
      password: "WrongPassword123",
      purpose: "customer",
    }),
  });
  const res3 = await loginPasswordPost(req3);
  const data3 = await res3.json();
  console.log("  Result:", data3);
  assert.strictEqual(res3.status, 401, "Invalid password must return 401");
  assert.strictEqual(data3.success, false, "Success must be false on bad password");
  console.log("✓ TEST 3 PASSED: Incorrect password properly rejected.\n");

  // TEST 4: Valid Reviewer Password Login
  console.log("[TEST 4] Testing login-password with correct credentials...");
  const req4 = new NextRequest("http://localhost/api/mobile/auth/login-password", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      email: "playreview@intrihub.com",
      password: "IntriReview#2026",
      purpose: "customer",
    }),
  });
  const res4 = await loginPasswordPost(req4);
  const data4 = await res4.json();
  console.log("  Result User:", data4.user?.name, "Role:", data4.user?.role);
  console.log("  Tokens Issued:", Boolean(data4.tokens?.accessToken));
  console.log("  Addresses Count:", data4.user?.addresses?.length);

  assert.strictEqual(res4.status, 200, "Valid login must return 200");
  assert.strictEqual(data4.success, true, "Success must be true");
  assert.strictEqual(data4.user.role, "customer", "User role MUST be customer");
  assert.strictEqual(data4.user.email, "playreview@intrihub.com", "Email must match");
  assert(data4.tokens?.accessToken, "Access token must be present");
  assert(data4.user?.addresses?.length > 0, "Default address must be loaded");
  console.log("✓ TEST 4 PASSED: Reviewer authenticated successfully with full tokens and customer profile.\n");

  // TEST 5: Repeated Logins (Ensuring Reusability & No Lockout)
  console.log("[TEST 5] Testing repeated logins for reusability...");
  for (let i = 1; i <= 3; i++) {
    const reqLoop = new NextRequest("http://localhost/api/mobile/auth/login-password", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: "playreview@intrihub.com",
        password: "IntriReview#2026",
        purpose: "customer",
      }),
    });
    const resLoop = await loginPasswordPost(reqLoop);
    assert.strictEqual(resLoop.status, 200, `Repeated login ${i} must succeed`);
  }
  console.log("✓ TEST 5 PASSED: Reusable credentials confirmed. No session or lockout failure.\n");

  console.log("===============================================================");
  console.log("ALL 5 BACKEND REVIEWER AUTHENTICATION TESTS PASSED SUCCESSFULLY!");
  console.log("===============================================================\n");
}

runTests().catch((e) => {
  console.error("Test failed:", e);
  process.exit(1);
});
