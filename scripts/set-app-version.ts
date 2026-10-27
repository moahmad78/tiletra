import { prisma } from "../lib/prisma";
import { isValidSemver, DEFAULT_APP_VERSION_SETTINGS, AppVersionSettings } from "../lib/semver";

interface CliArgs {
  app?: "customer" | "business";
  platform?: "android" | "ios";
  version?: string;
  code?: number;
  minVersion?: string;
  minCode?: number;
  force?: boolean;
  title?: string;
  message?: string;
  notes?: string[];
  showOnly?: boolean;
}

function parseArgs(args: string[]): CliArgs {
  const result: CliArgs = {
    platform: "android",
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const next = args[i + 1];

    if (arg === "--app" && next) {
      if (next === "customer" || next === "business") {
        result.app = next;
      }
      i++;
    } else if (arg === "--platform" && next) {
      if (next === "android" || next === "ios") {
        result.platform = next;
      }
      i++;
    } else if (arg === "--version" && next) {
      result.version = next.trim();
      i++;
    } else if (arg === "--code" && next) {
      result.code = parseInt(next, 10);
      i++;
    } else if (arg === "--min-version" && next) {
      result.minVersion = next.trim();
      i++;
    } else if (arg === "--min-code" && next) {
      result.minCode = parseInt(next, 10);
      i++;
    } else if (arg === "--force") {
      result.force = next === "false" ? false : true;
      if (next === "true" || next === "false") i++;
    } else if (arg === "--title" && next) {
      result.title = next;
      i++;
    } else if (arg === "--message" && next) {
      result.message = next;
      i++;
    } else if (arg === "--notes" && next) {
      result.notes = next.split(",").map((s) => s.trim()).filter(Boolean);
      i++;
    } else if (arg === "--show" || arg === "-s" || arg === "--status") {
      result.showOnly = true;
    }
  }

  return result;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  console.log("============================================================");
  console.log("📦 INTRIHUB APP VERSION CONFIGURATION UTILITY");
  console.log("============================================================\n");

  const settings = await prisma.storeSettings.findFirst({
    select: { id: true, appVersionConfig: true },
  });

  if (!settings) {
    console.error("❌ Error: StoreSettings record not found in database.");
    process.exit(1);
  }

  const currentConfig: AppVersionSettings = {
    customer: {
      android: { ...DEFAULT_APP_VERSION_SETTINGS.customer.android, ...(settings.appVersionConfig as any)?.customer?.android },
      ios: { ...DEFAULT_APP_VERSION_SETTINGS.customer.ios, ...(settings.appVersionConfig as any)?.customer?.ios },
    },
    business: {
      android: { ...DEFAULT_APP_VERSION_SETTINGS.business.android, ...(settings.appVersionConfig as any)?.business?.android },
      ios: { ...DEFAULT_APP_VERSION_SETTINGS.business.ios, ...(settings.appVersionConfig as any)?.business?.ios },
    },
  };

  // If --show or no arguments provided, display current configuration and help
  if (args.showOnly || (!args.app && !args.version && !args.code)) {
    console.log("CURRENT LIVE APP VERSION POLICIES IN DATABASE:\n");
    console.log("1. Customer App (com.intrihub.app):");
    console.log("   🤖 Android:");
    console.log(`      Latest Version     : ${currentConfig.customer.android.latestVersion}`);
    console.log(`      Version Code       : ${currentConfig.customer.android.latestVersionCode ?? "Not Set"}`);
    console.log(`      Min Version        : ${currentConfig.customer.android.minSupportedVersion}`);
    console.log(`      Min Version Code   : ${currentConfig.customer.android.minSupportedVersionCode ?? "Not Set"}`);
    console.log(`      Force Update Wall  : ${currentConfig.customer.android.forceUpdate ? "ACTIVE (Mandatory)" : "OFF (Dismissible)"}`);
    console.log(`      Store URL          : ${currentConfig.customer.android.storeUrl}`);
    console.log("   🍎 iOS:");
    console.log(`      Latest Version     : ${currentConfig.customer.ios.latestVersion}`);
    console.log(`      Version Code       : ${currentConfig.customer.ios.latestVersionCode ?? "Not Set"}`);

    console.log("\n2. Business App (com.intrihub.business):");
    console.log("   🤖 Android:");
    console.log(`      Latest Version     : ${currentConfig.business.android.latestVersion}`);
    console.log(`      Version Code       : ${currentConfig.business.android.latestVersionCode ?? "Not Set"}`);
    console.log(`      Min Version        : ${currentConfig.business.android.minSupportedVersion}`);
    console.log(`      Min Version Code   : ${currentConfig.business.android.minSupportedVersionCode ?? "Not Set"}`);
    console.log(`      Force Update Wall  : ${currentConfig.business.android.forceUpdate ? "ACTIVE (Mandatory)" : "OFF (Dismissible)"}`);
    console.log(`      Store URL          : ${currentConfig.business.android.storeUrl}`);
    console.log("   🍎 iOS:");
    console.log(`      Latest Version     : ${currentConfig.business.ios.latestVersion}`);
    console.log(`      Version Code       : ${currentConfig.business.ios.latestVersionCode ?? "Not Set"}`);

    console.log("\n------------------------------------------------------------");
    console.log("HOW TO UPDATE A VERSION POLICY (CLI USAGE):");
    console.log("------------------------------------------------------------");
    console.log("CRITICAL RULE: Take --code from Google Play Console / EAS build (not app.json)!");
    console.log("Only run this after Google Play shows 'Available on Google Play'.\n");
    console.log("Example 1: Update Customer Android App to 1.2.18 (build 37):");
    console.log('  npx tsx scripts/set-app-version.ts --app customer --version 1.2.18 --code 37\n');
    console.log("Example 2: Update Business Android App to 1.0.28 (build 36):");
    console.log('  npx tsx scripts/set-app-version.ts --app business --version 1.0.28 --code 36\n');
    console.log("Example 3: Force update (mandatory breaking update):");
    console.log('  npx tsx scripts/set-app-version.ts --app customer --version 1.2.18 --code 37 --force true --min-version 1.2.18 --min-code 37\n');
    process.exit(0);
  }

  if (!args.app) {
    console.error("❌ Error: Missing required flag --app (must be 'customer' or 'business').");
    process.exit(1);
  }

  const targetApp = args.app;
  const targetPlatform = args.platform || "android";
  const platformTarget = currentConfig[targetApp][targetPlatform];

  if (!platformTarget) {
    console.error(`❌ Error: Invalid app/platform combination: ${targetApp} ${targetPlatform}`);
    process.exit(1);
  }

  // Validate Semver if provided
  if (args.version) {
    if (!isValidSemver(args.version)) {
      console.error(`❌ Error: Invalid semver format '${args.version}'. Must be MAJOR.MINOR.PATCH (e.g., 1.2.18)`);
      process.exit(1);
    }
    platformTarget.latestVersion = args.version;
  }

  // Validate Version Code if provided
  if (args.code !== undefined) {
    if (isNaN(args.code) || args.code <= 0) {
      console.error(`❌ Error: Invalid versionCode '${args.code}'. Must be a positive integer from Play Console.`);
      process.exit(1);
    }
    platformTarget.latestVersionCode = args.code;
  }

  // Optional Min Version
  if (args.minVersion) {
    if (!isValidSemver(args.minVersion)) {
      console.error(`❌ Error: Invalid minVersion format '${args.minVersion}'. Must be MAJOR.MINOR.PATCH.`);
      process.exit(1);
    }
    platformTarget.minSupportedVersion = args.minVersion;
  }

  // Optional Min Version Code
  if (args.minCode !== undefined) {
    if (isNaN(args.minCode) || args.minCode <= 0) {
      console.error(`❌ Error: Invalid minCode '${args.minCode}'. Must be a positive integer.`);
      process.exit(1);
    }
    platformTarget.minSupportedVersionCode = args.minCode;
  }

  // Optional Force Update
  if (args.force !== undefined) {
    platformTarget.forceUpdate = args.force;
  }

  // Optional Title & Message
  if (args.title) platformTarget.title = args.title;
  if (args.message) platformTarget.message = args.message;
  if (args.notes && args.notes.length > 0) platformTarget.releaseNotes = args.notes;

  console.log(`Updating ${targetApp.toUpperCase()} (${targetPlatform})...`);
  console.log(`- Latest Version     : ${platformTarget.latestVersion}`);
  console.log(`- Version Code       : ${platformTarget.latestVersionCode}`);
  console.log(`- Min Version        : ${platformTarget.minSupportedVersion}`);
  console.log(`- Min Version Code   : ${platformTarget.minSupportedVersionCode ?? "N/A"}`);
  console.log(`- Force Update Wall  : ${platformTarget.forceUpdate ? "YES" : "NO"}`);

  // Save to DB
  await prisma.storeSettings.update({
    where: { id: settings.id },
    data: {
      appVersionConfig: currentConfig as any,
    },
  });

  // Create immutable Audit Log
  try {
    await prisma.adminAuditLog.create({
      data: {
        userId: "CLI_ADMIN_SCRIPT",
        userEmail: "system-cli@intrihub.com",
        action: "APP_VERSION_CONFIG_CLI_UPDATE",
        details: {
          app: targetApp,
          platform: targetPlatform,
          newConfig: platformTarget,
          timestamp: new Date().toISOString(),
        } as any,
      },
    });
  } catch (auditErr) {
    console.warn("⚠️ Warning: Could not write to AdminAuditLog:", auditErr);
  }

  console.log("\n✅ SUCCESS: App version configuration updated in database!");
  console.log(`Verify via API: https://www.intrihub.com/api/mobile/app-config?app=${targetApp}&platform=${targetPlatform}`);
}

main()
  .catch((err) => {
    console.error("❌ Fatal error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
