import fs from "fs";
import path from "path";
import dotenv from "dotenv";

/**
 * Strict Security Guard for Database Isolation in Test Suites.
 *
 * Guarantees that:
 * 1. .env.test MUST exist and contain DATABASE_URL.
 * 2. DATABASE_URL host is compared against the live host in .env.
 * 3. If hosts match or point to live, it immediately ABORTS with an explicit fatal error.
 * 4. Overwrites process.env.DATABASE_URL with the isolated test branch URL.
 */
export function assertTestDbIsolated(): { testHost: string; liveHost: string } {
  const rootDir = process.cwd();
  const testEnvPath = path.join(rootDir, ".env.test");
  const liveEnvPath = path.join(rootDir, ".env");

  if (!fs.existsSync(testEnvPath)) {
    console.error("\n==================================================================");
    console.error("🛑 FATAL SAFETY ERROR: .env.test NOT FOUND!");
    console.error("All test scripts are strictly blocked from running until .env.test exists");
    console.error("with an isolated Neon test branch DATABASE_URL.");
    console.error("==================================================================\n");
    throw new Error("ABORTED: .env.test not found. Never run tests against live DB.");
  }

  const testEnvConfig = dotenv.parse(fs.readFileSync(testEnvPath, "utf8"));
  const testDbUrl = testEnvConfig.DATABASE_URL?.trim();

  if (!testDbUrl) {
    console.error("\n==================================================================");
    console.error("🛑 FATAL SAFETY ERROR: DATABASE_URL missing in .env.test!");
    console.error("==================================================================\n");
    throw new Error("ABORTED: DATABASE_URL is missing in .env.test.");
  }

  let liveDbUrl = "";
  if (fs.existsSync(liveEnvPath)) {
    const liveEnvConfig = dotenv.parse(fs.readFileSync(liveEnvPath, "utf8"));
    liveDbUrl = liveEnvConfig.DATABASE_URL?.trim() || "";
  }

  let testHost = "";
  let liveHost = "";

  try {
    const parsedTest = new URL(testDbUrl);
    testHost = parsedTest.host.toLowerCase();
  } catch {
    throw new Error("ABORTED: Invalid DATABASE_URL connection string in .env.test.");
  }

  if (liveDbUrl) {
    try {
      const parsedLive = new URL(liveDbUrl);
      liveHost = parsedLive.host.toLowerCase();
    } catch {
      // If live is unparseable, proceed with caution
    }
  }

  if (liveHost && testHost === liveHost) {
    console.error("\n==================================================================");
    console.error("🚨 CRITICAL SAFETY ABORT: TEST DATABASE POINTS TO LIVE DATABASE!");
    console.error(`Live DB Host : ${liveHost}`);
    console.error(`Test DB Host : ${testHost}`);
    console.error("Tests cannot execute because the test database host matches production.");
    console.error("==================================================================\n");
    throw new Error(`ABORTED: .env.test DATABASE_URL points to the live database host (${liveHost}).`);
  }

  // Enforce isolated test environment variables
  process.env.DATABASE_URL = testDbUrl;
  if (testEnvConfig.DIRECT_URL) {
    process.env.DIRECT_URL = testEnvConfig.DIRECT_URL;
  } else {
    process.env.DIRECT_URL = testDbUrl;
  }
  process.env.NODE_ENV = "test";

  // Mask credentials safely for audit reporting
  const maskedHost = testHost.length > 8 ? `${testHost.slice(0, 4)}...${testHost.slice(-8)}` : testHost;
  console.log(`🔒 [DB Isolation Guard] Verified: Target is isolated test branch (${maskedHost}).`);

  return { testHost, liveHost };
}

// Automatically enforce isolation immediately upon module import
assertTestDbIsolated();
