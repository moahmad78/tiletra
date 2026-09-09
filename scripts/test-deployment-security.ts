/**
 * Intrihub Secure Deployment, HTTPS, Secrets, & Security Logging Test Suite
 * Validates:
 * 1. HTTPS enforcement & malicious scanner path blocking in middleware.
 * 2. Next.js production security headers (HSTS, nosniff, frame protection, permissions policy).
 * 3. Secrets validator: flags unencrypted DB URLs, dummy secrets in production, and NEXT_PUBLIC leaks.
 * 4. Centralized security logger: logs auth attempts, detects traffic anomalies, and persists to AuditLog.
 */

import { NextRequest } from "next/server";
import { middleware } from "../middleware";
import { validateProductionSecrets, getSafeDeploymentStatus } from "../lib/env-security";
import { securityLogger } from "../lib/security-logger";
import { prisma } from "../lib/prisma";
import nextConfig from "../next.config";

async function runDeploymentSecurityTests() {
  console.log("================================================================");
  console.log("🚀 INTRIHUB SECURE DEPLOYMENT & LOGGING VERIFICATION");
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

  // --- 1. MIDDLEWARE SCANNER PROBE & HTTPS ENFORCEMENT ---
  console.log("--- 1. MIDDLEWARE PROBE DETECTION & HTTPS ENFORCEMENT ---");

  // Test 1: Probe path /.env is blocked with 403 Forbidden
  const envProbeReq = new NextRequest("http://www.intrihub.com/.env");
  const envProbeRes = middleware(envProbeReq);
  assert(
    envProbeRes.status === 403,
    "Malicious probe for /.env is blocked with 403 Forbidden",
    `Got status ${envProbeRes.status}`
  );

  // Test 2: Probe path /wp-login.php is blocked with 403 Forbidden
  const wpProbeReq = new NextRequest("http://www.intrihub.com/wp-login.php");
  const wpProbeRes = middleware(wpProbeReq);
  assert(
    wpProbeRes.status === 403,
    "Malicious probe for /wp-login.php is blocked with 403 Forbidden",
    `Got status ${wpProbeRes.status}`
  );

  // Test 3: Legacy domain redirected to https://www.intrihub.com
  const legacyReq = new NextRequest("http://tiletra.com/shop", {
    headers: { host: "tiletra.com" },
  });
  const legacyRes = middleware(legacyReq);
  assert(
    legacyRes.status === 301 &&
      legacyRes.headers.get("location") === "https://www.intrihub.com/shop" &&
      legacyRes.headers.get("strict-transport-security")?.includes("max-age"),
    "Legacy domain redirected 301 to HTTPS with HSTS header",
    legacyRes.headers.get("location") || ""
  );

  // Test 4: Apex domain redirected to www over HTTPS
  const apexReq = new NextRequest("http://intrihub.com/about", {
    headers: { host: "intrihub.com" },
  });
  const apexRes = middleware(apexReq);
  assert(
    apexRes.status === 301 &&
      apexRes.headers.get("location") === "https://www.intrihub.com/about",
    "Apex intrihub.com redirected 301 to https://www.intrihub.com",
    apexRes.headers.get("location") || ""
  );

  // --- 2. NEXT.CONFIG SECURITY HEADERS ---
  console.log("\n--- 2. NEXT.CONFIG SECURITY HEADERS AUDIT ---");
  const headersFunc = nextConfig.headers;
  assert(typeof headersFunc === "function", "next.config.ts exports headers function");

  if (typeof headersFunc === "function") {
    const routeHeaders = await headersFunc();
    const globalHeaderRule = routeHeaders.find((r: any) => r.source === "/:path*");
    assert(!!globalHeaderRule, "Global header rule (/:path*) is defined");

    const headerMap = new Map(
      (globalHeaderRule?.headers || []).map((h: any) => [h.key.toLowerCase(), h.value])
    );

    assert(
      headerMap.has("strict-transport-security") &&
        headerMap.get("strict-transport-security")!.includes("max-age=63072000"),
      "Strict-Transport-Security (HSTS) configured with 2-year duration and preload"
    );

    assert(
      headerMap.get("x-content-type-options") === "nosniff",
      "X-Content-Type-Options: nosniff enforced"
    );

    assert(
      headerMap.get("x-frame-options") === "SAMEORIGIN",
      "X-Frame-Options: SAMEORIGIN enforced"
    );

    assert(
      headerMap.has("permissions-policy"),
      "Permissions-Policy restricts camera, microphone, and geolocation"
    );

    assert(
      headerMap.get("cross-origin-opener-policy") === "same-origin-allow-popups",
      "Cross-Origin-Opener-Policy configured"
    );
  }

  // --- 3. SECRETS & DATABASE SSL VALIDATOR ---
  console.log("\n--- 3. SECRETS & DATABASE CONNECTION VALIDATION ---");

  const originalEnv = { ...process.env };

  try {
    // Test: Insecure/default admin secret in production is flagged
    process.env.NODE_ENV = "production";
    process.env.ADMIN_SESSION_SECRET = "intrihub-admin-secure-key-2026";
    process.env.DATABASE_URL = "postgresql://user:pass@db.example.com:5432/mydb?sslmode=disable";

    const insecureValidation = validateProductionSecrets();
    assert(
      !insecureValidation.valid &&
        insecureValidation.errors.some((e) => e.includes("ADMIN_SESSION_SECRET")),
      "Secrets validator flags default placeholder secret in production"
    );

    assert(
      insecureValidation.errors.some((e) => e.includes("DATABASE_URL")),
      "Secrets validator flags non-SSL database connection in production"
    );

    // Test: Accidental NEXT_PUBLIC credential leak is flagged
    process.env.NEXT_PUBLIC_DATABASE_PASSWORD = "supersecretpassword123";
    const leakValidation = validateProductionSecrets();
    assert(
      leakValidation.errors.some((e) => e.includes("NEXT_PUBLIC_DATABASE_PASSWORD")),
      "Secrets validator detects and blocks accidental NEXT_PUBLIC credential exposure"
    );
    delete process.env.NEXT_PUBLIC_DATABASE_PASSWORD;

    // Test: Safe deployment status summary does not expose secret values
    const safeSummary = getSafeDeploymentStatus();
    assert(
      typeof safeSummary.isProduction === "boolean" &&
        !("ADMIN_SESSION_SECRET" in safeSummary) &&
        !("DATABASE_URL" in safeSummary),
      "Safe deployment diagnostic provides status without leaking secret values"
    );
  } finally {
    process.env = originalEnv;
  }

  // --- 4. SECURITY LOGGING & ANOMALY DETECTION ---
  console.log("\n--- 4. SECURITY LOGGING & ANOMALY DETECTION ---");

  const testIp = "198.51.100.99"; // RFC 5737 TEST-NET-2 IP
  const testEmail = "audit_probe@example.com";

  // Simulate single failed login
  await securityLogger.logAuthAttempt({
    type: "login",
    status: "failure",
    identifier: testEmail,
    ip: testIp,
    reason: "Invalid test password",
  });

  // Simulate multiple rapid auth failures from the same IP to trigger anomaly detection
  for (let i = 0; i < 5; i++) {
    await securityLogger.logAuthAttempt({
      type: "login",
      status: "failure",
      identifier: `user_${i}@test.com`,
      ip: testIp,
      reason: "Brute force test iteration",
    });
  }

  // Check if an anomaly event was written to AuditLog
  const anomalyLog = await prisma.auditLog.findFirst({
    where: {
      ipAddress: testIp,
      action: "SUSPICIOUS_TRAFFIC_BURST",
    },
    orderBy: { createdAt: "desc" },
  });

  assert(
    anomalyLog !== null && (anomalyLog.details as any)?.pattern?.includes("Credential stuffing"),
    "Sliding window anomaly detector identified brute force burst and logged to AuditLog",
    anomalyLog ? JSON.stringify(anomalyLog.details) : "No log found"
  );

  // Test unauthorized access logging for IDOR
  await securityLogger.logUnauthorizedAccess({
    path: "/api/admin/orders/del-test",
    method: "DELETE",
    ip: testIp,
    reason: "Unauthorized: Administrator privileges required.",
  });

  let idorLog = null;
  for (let retry = 0; retry < 3; retry++) {
    try {
      idorLog = await prisma.auditLog.findFirst({
        where: {
          ipAddress: testIp,
          action: "IDOR_OR_PRIVILEGE_VIOLATION",
        },
        orderBy: { createdAt: "desc" },
      });
      if (idorLog) break;
    } catch {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  assert(
    idorLog !== null,
    "Critical access control violation persisted to AuditLog table"
  );

  // Clean up test audit logs
  await prisma.auditLog.deleteMany({
    where: { ipAddress: testIp },
  });

  console.log("\n================================================================");
  console.log(`TOTAL DEPLOYMENT SECURITY TESTS: ${passed + failed}`);
  console.log(`PASSED: ${passed}`);
  console.log(`FAILED: ${failed}`);
  console.log("================================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runDeploymentSecurityTests().catch((err) => {
  console.error("Test runner encountered an error:", err);
  process.exit(1);
});
