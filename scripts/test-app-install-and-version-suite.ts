import { prisma } from "../lib/prisma";
import {
  getStoreSettings,
  updateStoreSettings,
} from "../lib/actions/settings";
import {
  isValidSemver,
  compareSemver,
  DEFAULT_APP_VERSION_SETTINGS,
} from "../lib/semver";
import * as fs from "fs";
import * as path from "path";

async function runTestSuite() {
  console.log("============================================================");
  console.log("🚀 STARTING AUDIT: SMART INSTALL PROMPT & APP UPDATE SUITE");
  console.log("============================================================\n");

  let totalTests = 0;
  let passedTests = 0;

  function assert(condition: boolean, desc: string) {
    totalTests++;
    if (condition) {
      console.log(`  ✅ PASS: ${desc}`);
      passedTests++;
    } else {
      console.error(`  ❌ FAIL: ${desc}`);
      throw new Error(`Assertion failed: ${desc}`);
    }
  }

  // --- TEST GROUP 1: Web Manifests & Digital AssetLinks ---
  console.log("--- 1. Testing Manifest & AssetLinks Verification ---");
  const siteWebmanifestPath = path.join(process.cwd(), "public", "site.webmanifest");
  const manifestJsonPath = path.join(process.cwd(), "public", "manifest.json");

  assert(fs.existsSync(siteWebmanifestPath), "public/site.webmanifest exists");
  assert(fs.existsSync(manifestJsonPath), "public/manifest.json exists");

  const siteManifest = JSON.parse(fs.readFileSync(siteWebmanifestPath, "utf-8"));
  const jsonManifest = JSON.parse(fs.readFileSync(manifestJsonPath, "utf-8"));

  assert(
    Array.isArray(siteManifest.related_applications) &&
      siteManifest.related_applications.some((app: any) => app.id === "com.intrihub.app"),
    "site.webmanifest includes related_applications for com.intrihub.app"
  );

  assert(
    Array.isArray(jsonManifest.related_applications) &&
      jsonManifest.related_applications.some((app: any) => app.id === "com.intrihub.app"),
    "manifest.json includes related_applications for com.intrihub.app"
  );

  const assetLinksPath = path.join(process.cwd(), "public", ".well-known", "assetlinks.json");
  assert(fs.existsSync(assetLinksPath), "public/.well-known/assetlinks.json exists");
  const assetLinks = JSON.parse(fs.readFileSync(assetLinksPath, "utf-8"));
  assert(
    Array.isArray(assetLinks) &&
      assetLinks[0]?.target?.package_name === "com.intrihub.app",
    "assetlinks.json targets com.intrihub.app"
  );
  assert(
    assetLinks[0]?.relation?.includes("delegate_permission/common.handle_all_urls"),
    "assetlinks.json includes handle_all_urls relation"
  );

  // --- TEST GROUP 2: SemVer Parsing & Comparison ---
  console.log("\n--- 2. Testing SemVer Engine ---");
  assert(isValidSemver("1.2.5"), "isValidSemver validates 1.2.5");
  assert(isValidSemver("1.0"), "isValidSemver validates 1.0");
  assert(!isValidSemver("v1.2.3"), "isValidSemver rejects v1.2.3 with prefix");
  assert(!isValidSemver("alpha"), "isValidSemver rejects non-numeric");

  assert(compareSemver("1.2.0", "1.2.5") === -1, "1.2.0 < 1.2.5");
  assert(compareSemver("1.2.5", "1.2.5") === 0, "1.2.5 == 1.2.5");
  assert(compareSemver("1.3.0", "1.2.5") === 1, "1.3.0 > 1.2.5");
  assert(compareSemver("1.2.10", "1.2.2") === 1, "1.2.10 > 1.2.2 (multi-digit patch)");
  assert(compareSemver("2.0.0", "1.99.99") === 1, "2.0.0 > 1.99.99");

  // --- TEST GROUP 3: StoreSettings Database Persistence ---
  console.log("\n--- 3. Testing StoreSettings DB Integration ---");
  const initialSettings = await getStoreSettings();
  assert(initialSettings !== null, "getStoreSettings() successfully queries DB");
  assert(
    typeof initialSettings?.appInstallPromptEnabled === "boolean",
    "appInstallPromptEnabled is boolean in StoreSettings"
  );
  assert(
    initialSettings?.appVersionConfig?.customer?.android?.latestVersion !== undefined,
    "appVersionConfig.customer.android is initialized"
  );

  // Test toggling appInstallPromptEnabled
  const updateRes = await updateStoreSettings({
    appInstallPromptEnabled: true,
  });
  assert(updateRes.success === true, "updateStoreSettings saves appInstallPromptEnabled");

  // --- TEST GROUP 4: Version Check Endpoint Simulation ---
  console.log("\n--- 4. Testing /api/mobile/app-version Logic ---");
  const { GET: getAppVersion } = await import("../app/api/mobile/app-version/route");

  // Scenario 4.1: Up-to-date customer app
  const reqUpToDate = new Request(
    "http://localhost:3000/api/mobile/app-version?app=customer&platform=android&installedVersion=1.2.5"
  );
  const resUpToDate = await getAppVersion(reqUpToDate as any);
  const dataUpToDate = await resUpToDate.json();
  assert(dataUpToDate.success === true, "API returns success: true");
  assert(dataUpToDate.updateAvailable === false, "No update available when version is 1.2.5");
  assert(dataUpToDate.forceUpdate === false, "No force update when version is 1.2.5");

  // Scenario 4.2: Soft update customer app
  const reqSoft = new Request(
    "http://localhost:3000/api/mobile/app-version?app=customer&platform=android&installedVersion=1.2.3"
  );
  const resSoft = await getAppVersion(reqSoft as any);
  const dataSoft = await resSoft.json();
  assert(dataSoft.updateAvailable === true, "updateAvailable is true for v1.2.3");
  assert(dataSoft.forceUpdate === false, "forceUpdate is false for v1.2.3 (>= 1.2.0)");

  // Scenario 4.3: Force update customer app
  const reqForce = new Request(
    "http://localhost:3000/api/mobile/app-version?app=customer&platform=android&installedVersion=1.1.0"
  );
  const resForce = await getAppVersion(reqForce as any);
  const dataForce = await resForce.json();
  assert(dataForce.updateAvailable === true, "updateAvailable is true for deprecated v1.1.0");
  assert(dataForce.forceUpdate === true, "forceUpdate is true for deprecated v1.1.0 (< 1.2.0)");

  // Scenario 4.4: Business app vendor policy
  const reqBiz = new Request(
    "http://localhost:3000/api/mobile/app-version?app=business&platform=android&installedVersion=1.0.12"
  );
  const resBiz = await getAppVersion(reqBiz as any);
  const dataBiz = await resBiz.json();
  assert(dataBiz.app === "business", "Returns business app configuration");
  assert(dataBiz.updateAvailable === true, "updateAvailable is true for business v1.0.12");
  assert(dataBiz.storeUrl.includes("com.intrihub.business"), "storeUrl targets vendor app");

  // --- TEST GROUP 5: Install Prompt Status API ---
  console.log("\n--- 5. Testing /api/mobile/app-install-prompt-status ---");
  const { GET: getInstallStatus } = await import(
    "../app/api/mobile/app-install-prompt-status/route"
  );
  const resStatus = await getInstallStatus();
  const dataStatus = await resStatus.json();
  assert(typeof dataStatus.enabled === "boolean", "Prompt status returns enabled boolean");

  console.log("\n============================================================");
  console.log(`🎉 ALL TESTS PASSED: ${passedTests}/${totalTests} (100% SUCCESS)`);
  console.log("============================================================\n");
}

runTestSuite()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Test Suite Failed:", err);
    process.exit(1);
  });
