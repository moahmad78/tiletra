/**
 * Intrihub Abuse Protection, Bot Mitigation & Rate Limiting Test Suite
 * Verifies:
 * 1. Bot & scraper blocking on API endpoints (python-requests, curl, scrapy).
 * 2. Multi-tier API rate limiting in middleware (standard, sensitive, strict).
 * 3. Account creation rate limiting (max 5 accounts per hour per IP) & honeypot trapping.
 * 4. AI generation rate limiting (5 req/10m for guests, prompt validation, 429 responses).
 * 5. Login brute-force and account lockout protection.
 */

import { NextRequest } from "next/server";
import { middleware } from "../middleware";
import {
  checkApiRateLimit,
  checkAiRateLimit,
  checkAccountCreationRateLimit,
  checkAccountBruteForce,
  recordAccountLoginFailure,
  resetAccountLoginLockout,
} from "../lib/rate-limit";
import { submitVendorApplication } from "../lib/actions/vendor-application";
import { POST as handleAiGenerate } from "../app/api/ai/generate/route";

async function runAbuseProtectionTests() {
  console.log("================================================================");
  console.log("🛡️ INTRIHUB ABUSE PROTECTION & RATE LIMITING AUDIT");
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

  // --- 1. BOT & SCRAPER DEFENSE ---
  console.log("--- 1. BOT & SCRAPER USER-AGENT MITIGATION ---");

  const scraperAgents = [
    "python-requests/2.31.0",
    "Scrapy/2.11.0 (+https://scrapy.org)",
    "curl/7.88.1",
    "Go-http-client/1.1",
    "bytespider",
  ];

  for (const agent of scraperAgents) {
    const req = new NextRequest("http://www.intrihub.com/api/products", {
      headers: {
        "user-agent": agent,
        "x-forwarded-for": "198.51.100.44",
      },
    });
    const res = middleware(req);
    assert(
      res.status === 403,
      `Scraper User-Agent "${agent.split("/")[0]}" blocked from /api/products with 403 Forbidden`,
      `Got status ${res.status}`
    );
  }

  // Standard mobile/web User-Agent is permitted
  const legitReq = new NextRequest("http://www.intrihub.com/api/products", {
    headers: {
      "user-agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15",
      "x-forwarded-for": "198.51.100.45",
    },
  });
  const legitRes = middleware(legitReq);
  assert(
    legitRes.status !== 403,
    "Legitimate browser User-Agent is permitted through middleware",
    `Got status ${legitRes.status}`
  );

  // --- 2. MULTI-TIER API RATE LIMITING ---
  console.log("\n--- 2. MULTI-TIER API RATE LIMITING ---");

  const testIp = "198.51.100.80";

  // Test standard tier (100 req / min)
  const initialRate = checkApiRateLimit(testIp, "standard");
  assert(
    initialRate.allowed && initialRate.limit === 100,
    "Standard API tier allows requests and configures 100 req/min limit"
  );

  // Test sensitive tier (20 req / min)
  const sensitiveRate = checkApiRateLimit(testIp, "sensitive");
  assert(
    sensitiveRate.allowed && sensitiveRate.limit === 20,
    "Sensitive API tier (checkout/orders) configures 20 req/min limit"
  );

  // Test strict tier (5 req / min)
  const strictRate = checkApiRateLimit(testIp, "strict");
  assert(
    strictRate.allowed && strictRate.limit === 5,
    "Strict API tier (auth/passwords) configures 5 req/min limit"
  );

  // Simulate rate limit exhaustion on strict tier
  const spamIp = "198.51.100.88";
  for (let i = 0; i < 5; i++) {
    checkApiRateLimit(spamIp, "strict");
  }
  const exhaustedRate = checkApiRateLimit(spamIp, "strict");
  assert(
    !exhaustedRate.allowed && exhaustedRate.remaining === 0,
    "Strict API rate limiter blocks calls after 5 requests with remaining=0"
  );

  // Test middleware rate limit response headers on 429
  const spamReq = new NextRequest("http://www.intrihub.com/api/admin/auth/login", {
    headers: {
      "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      "x-forwarded-for": spamIp,
    },
  });
  const spamRes = middleware(spamReq);
  assert(
    spamRes.status === 429 &&
      spamRes.headers.has("Retry-After") &&
      spamRes.headers.get("X-RateLimit-Remaining") === "0",
    "Middleware returns 429 Too Many Requests with Retry-After and X-RateLimit headers",
    `Got status ${spamRes.status}`
  );

  // --- 3. ACCOUNT CREATION & HONEYPOT PROTECTION ---
  console.log("\n--- 3. ACCOUNT CREATION & HONEYPOT PROTECTION ---");

  const regIp = "198.51.100.92";
  for (let i = 0; i < 5; i++) {
    const check = checkAccountCreationRateLimit(regIp);
    assert(check.allowed, `Account creation attempt ${i + 1} of 5 allowed`);
  }
  const blockedReg = checkAccountCreationRateLimit(regIp);
  assert(
    !blockedReg.allowed,
    "Account creation rate limiter blocks 6th registration from same IP within 1 hour"
  );

  // Test Bot Honeypot Trapping in Vendor Application
  const botApplication = await submitVendorApplication({
    businessName: "Bot Spammer LLC",
    ownerName: "Automated Script",
    phone: "9876543210",
    email: "bot@spammer.com",
    category: "Tiles",
    website_url_hp: "http://spam-link.ru/payload", // Honeypot field populated
  });
  assert(
    botApplication.success && botApplication.applicationId === "bot_filtered",
    "Bot honeypot traps and silently neutralizes automated submission",
    botApplication.applicationId
  );

  // --- 4. AI GENERATION RATE LIMITING & VALIDATION ---
  console.log("\n--- 4. AI GENERATION RATE LIMITING & ENDPOINT ---");

  const aiIp = "198.51.100.95";

  // Test 1: Empty / too short prompt is rejected with 400
  const shortAiReq = new NextRequest("http://localhost:3000/api/ai/generate", {
    method: "POST",
    headers: { "x-forwarded-for": aiIp },
    body: JSON.stringify({ prompt: "hi" }),
  });
  const shortAiRes = await handleAiGenerate(shortAiReq);
  assert(
    shortAiRes.status === 400,
    "AI endpoint rejects prompt shorter than 5 characters with 400 Bad Request"
  );

  // Test 2: Valid prompt succeeds and returns recommendation with rate limit headers
  const validAiReq = new NextRequest("http://localhost:3000/api/ai/generate", {
    method: "POST",
    headers: { "x-forwarded-for": aiIp },
    body: JSON.stringify({
      prompt: "Luxury master bathroom with Italian marble look vitrified tiles",
      roomType: "bathroom",
      style: "luxury",
    }),
  });
  const validAiRes = await handleAiGenerate(validAiReq);
  const validAiData = await validAiRes.json();
  assert(
    validAiRes.status === 200 &&
      validAiData.success === true &&
      typeof validAiData.recommendation === "string" &&
      validAiRes.headers.has("X-RateLimit-Remaining"),
    "AI generation request returns recommendations and rate limit metadata"
  );

  // Test 3: Exhausting AI rate limit (5 for guests) returns 429
  for (let i = 0; i < 4; i++) {
    checkAiRateLimit(aiIp, false);
  }
  const exhaustedAiReq = new NextRequest("http://localhost:3000/api/ai/generate", {
    method: "POST",
    headers: { "x-forwarded-for": aiIp },
    body: JSON.stringify({
      prompt: "Flooring for terrace balcony with anti-skid wooden planks",
    }),
  });
  const exhaustedAiRes = await handleAiGenerate(exhaustedAiReq);
  assert(
    exhaustedAiRes.status === 429,
    "AI endpoint returns 429 Too Many Requests when guest rate limit (5/10m) is exceeded",
    `Got status ${exhaustedAiRes.status}`
  );

  // --- 5. LOGIN BRUTE-FORCE & ACCOUNT LOCKOUT ---
  console.log("\n--- 5. LOGIN BRUTE-FORCE & ACCOUNT LOCKOUT ---");

  const testAccount = "victim_account@example.com";
  resetAccountLoginLockout(testAccount);

  for (let i = 1; i <= 4; i++) {
    const attempt = recordAccountLoginFailure(testAccount);
    assert(!attempt.locked && attempt.remainingAttempts === 5 - i, `Failed attempt ${i}/5 recorded`);
  }

  // 5th failed attempt triggers lockout
  const lockoutAttempt = recordAccountLoginFailure(testAccount);
  assert(
    lockoutAttempt.locked && lockoutAttempt.remainingAttempts === 0,
    "5th consecutive failed login triggers 15-minute account lockout"
  );

  const activeLockout = checkAccountBruteForce(testAccount);
  assert(
    activeLockout.locked && (activeLockout.retryAfterSeconds || 0) > 800,
    "Account lockout remains active with positive retryAfterSeconds countdown"
  );

  resetAccountLoginLockout(testAccount);
  const clearedLockout = checkAccountBruteForce(testAccount);
  assert(
    !clearedLockout.locked,
    "Account lockout is successfully cleared upon successful authentication"
  );

  console.log("\n================================================================");
  console.log(`TOTAL ABUSE PROTECTION TESTS: ${passed + failed}`);
  console.log(`PASSED: ${passed}`);
  console.log(`FAILED: ${failed}`);
  console.log("================================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runAbuseProtectionTests().catch((err) => {
  console.error("Test runner encountered an error:", err);
  process.exit(1);
});
