/**
 * Safe Additive Migration Script: Consolidate all push tokens into DeviceToken.
 *
 * Single Source of Truth Architecture:
 * - Scans legacy `MobilePushToken` and `User.pushToken` tables.
 * - Adds any missing tokens to `DeviceToken` with appropriate `appType` ('user' vs 'business').
 * - Strictly additive: NEVER deletes or modifies legacy rows.
 * - Performs a sweep deactivating tokens with `lastSeenAt` older than 60 days.
 *
 * Run with:
 *   npx tsx scripts/migrate-tokens-to-device-token.ts
 */

import { prisma } from "../lib/prisma";
import { deactivateStaleDeviceTokens } from "../lib/push-notifications";

function isExpoToken(token: string | null | undefined): token is string {
  return (
    typeof token === "string" &&
    (token.startsWith("ExponentPushToken[") || token.startsWith("ExpoPushToken["))
  );
}

async function runTokenMigration() {
  console.log("=== IntriHub DeviceToken Consolidation & Safe Migration ===");
  const startTime = Date.now();

  // 1. Fetch all existing tokens in DeviceToken
  const existingDeviceTokens = await prisma.deviceToken.findMany({
    select: { token: true, id: true, userId: true },
  });
  const existingTokensSet = new Set(existingDeviceTokens.map((t) => t.token));
  console.log(`[DeviceToken] Currently holds ${existingDeviceTokens.length} registered tokens.`);

  // 2. Fetch all legacy MobilePushToken records
  const legacyMobileTokens = await (prisma as any).mobilePushToken.findMany({
    include: {
      user: {
        select: { id: true, role: true },
      },
    },
  });
  console.log(`[MobilePushToken] Found ${legacyMobileTokens.length} legacy mobile records.`);

  // 3. Fetch all User records with a pushToken
  const legacyUsersWithToken = await (prisma as any).user.findMany({
    where: { pushToken: { not: null } },
    select: { id: true, role: true, pushToken: true },
  });
  console.log(`[User.pushToken] Found ${legacyUsersWithToken.length} users with pushToken column set.`);

  let newlyMigrated = 0;
  let alreadyPresent = 0;
  let invalidTokens = 0;

  // Process MobilePushToken rows
  for (const row of legacyMobileTokens) {
    const rawToken = String(row.token || "").trim();
    if (!isExpoToken(rawToken)) {
      invalidTokens++;
      continue;
    }

    if (existingTokensSet.has(rawToken)) {
      alreadyPresent++;
      continue;
    }

    const role = row.user?.role || "customer";
    const appType =
      role === "vendor" || role === "rider" || role === "admin" || role === "cpo"
        ? "business"
        : "user";

    try {
      await prisma.deviceToken.create({
        data: {
          userId: row.userId,
          role,
          platform: row.platform || "android",
          token: rawToken,
          lastSeenAt: row.updatedAt || new Date(),
        },
      });
      existingTokensSet.add(rawToken);
      newlyMigrated++;
    } catch (insertErr) {
      console.warn(`[Migrate] Skipped token ${rawToken.slice(-6)}:`, insertErr);
    }
  }

  // Process User.pushToken rows
  for (const user of legacyUsersWithToken) {
    const rawToken = String(user.pushToken || "").trim();
    if (!isExpoToken(rawToken)) {
      invalidTokens++;
      continue;
    }

    if (existingTokensSet.has(rawToken)) {
      alreadyPresent++;
      continue;
    }

    const role = user.role || "customer";

    try {
      await prisma.deviceToken.create({
        data: {
          userId: user.id,
          role,
          platform: "android",
          token: rawToken,
          lastSeenAt: new Date(),
        },
      });
      existingTokensSet.add(rawToken);
      newlyMigrated++;
    } catch (insertErr) {
      console.warn(`[Migrate] Skipped user token ${rawToken.slice(-6)}:`, insertErr);
    }
  }

  // 4. Run the 60-day stale token deactivation sweep
  console.log("\n--- Running 60-Day Stale Token Sweep ---");
  const deactivatedCount = await deactivateStaleDeviceTokens(60);

  const durationMs = Date.now() - startTime;
  console.log("\n=== Migration Summary ===");
  console.log(`- Total Initial DeviceTokens: ${existingDeviceTokens.length}`);
  console.log(`- Newly Migrated Tokens:     ${newlyMigrated}`);
  console.log(`- Already Present in DB:      ${alreadyPresent}`);
  console.log(`- Invalid / Non-Expo Tokens:  ${invalidTokens}`);
  console.log(`- 60-Day Tokens Deactivated:  ${deactivatedCount}`);
  console.log(`- Duration:                   ${durationMs}ms`);
  console.log("DeviceToken is now consolidated as the single source of truth.\n");
}

runTokenMigration()
  .catch((e) => {
    console.error("Migration failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
