import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");

const SUPPORTED_LANGUAGES = [
  "en", "hi", "kn", "te", "ta", "bn", "mr", "gu", "ml", "pa", "ur", "or"
];

const CRITICAL_KEYS_MOBILE = [
  "nav.home",
  "nav.categories",
  "nav.cart",
  "nav.orders",
  "nav.account",
  "cart.title",
  "cart.empty",
  "cart.subtotal",
  "cart.deliveryFee",
  "cart.total",
  "cart.proceedCheckout",
  "checkout.title",
  "checkout.paymentMethod",
  "checkout.placeOrder",
  "orders.title",
  "orders.noOrders",
  "account.title",
  "account.editProfile",
  "home.shopByCategory",
  "common.viewAll",
  "common.selectLanguage"
];

const CRITICAL_KEYS_BUSINESS = [
  "nav.home",
  "nav.orders",
  "nav.categories",
  "nav.account",
  "nav.language",
  "vendor.dashboard",
  "vendor.orders",
  "vendor.products",
  "vendor.earnings",
  "account.title",
  "account.editProfile",
  "account.helpSupport",
  "auth.logout",
  "common.help",
  "common.save"
];

function getNestedValue(obj, pathStr) {
  return pathStr.split(".").reduce((acc, part) => (acc && acc[part] !== undefined ? acc[part] : undefined), obj);
}

function testApp(appName, localesDir, criticalKeys) {
  console.log(`\n========================================`);
  console.log(`Testing App: ${appName}`);
  console.log(`Locales Directory: ${localesDir}`);
  console.log(`========================================`);

  let allPassed = true;
  const loadedDictionaries = {};

  // 1. Verify all 12 locale JSON files exist and are valid JSON
  for (const lang of SUPPORTED_LANGUAGES) {
    const filePath = path.join(localesDir, `${lang}.json`);
    if (!fs.existsSync(filePath)) {
      console.error(`❌ [${appName}] Missing locale file: ${lang}.json`);
      allPassed = false;
      continue;
    }

    try {
      const content = fs.readFileSync(filePath, "utf-8");
      const parsed = JSON.parse(content);
      loadedDictionaries[lang] = parsed;
      const keyCount = Object.keys(parsed).length;
      console.log(`  ✓ [${lang}] loaded successfully (${keyCount} root sections)`);
    } catch (e) {
      console.error(`❌ [${appName}] Invalid JSON syntax in ${lang}.json: ${e.message}`);
      allPassed = false;
    }
  }

  // 2. Test key lookup across all 12 languages and simulate language switching
  console.log(`\nTesting critical key resolution across all ${SUPPORTED_LANGUAGES.length} languages:`);
  for (const lang of SUPPORTED_LANGUAGES) {
    const dict = loadedDictionaries[lang];
    if (!dict) continue;

    let missing = [];
    for (const key of criticalKeys) {
      const val = getNestedValue(dict, key);
      if (!val || typeof val !== "string" || val.trim().length === 0) {
        missing.push(key);
      }
    }

    if (missing.length > 0) {
      console.warn(`  ⚠️ [${lang}] Missing or empty keys (${missing.length}): ${missing.slice(0, 5).join(", ")}${missing.length > 5 ? "..." : ""}`);
      allPassed = false;
    } else {
      console.log(`  ✓ [${lang}] All ${criticalKeys.length} critical keys resolved correctly!`);
    }
  }

  // 3. Simulate language switching state and sample translations
  console.log(`\nSimulating language switching and reactive sample outputs:`);
  const sampleKeys = criticalKeys.slice(0, 4);
  for (const lang of ["en", "hi", "kn", "te", "ta", "mr", "gu", "bn"]) {
    const dict = loadedDictionaries[lang] || {};
    const samples = sampleKeys.map((k) => `"${k}": "${getNestedValue(dict, k) || 'MISSING'}"`).join(" | ");
    console.log(`  [Switch -> ${lang}] => ${samples}`);
  }

  return allPassed;
}

const mobileLocalesDir = path.join(ROOT, "intrihub-mobile", "locales");
const businessLocalesDir = path.join(ROOT, "intrihub-business", "locales");

const mobileOk = testApp("intrihub-mobile (User App)", mobileLocalesDir, CRITICAL_KEYS_MOBILE);
const businessOk = testApp("intrihub-business (Vendor App)", businessLocalesDir, CRITICAL_KEYS_BUSINESS);

console.log(`\n========================================`);
console.log(`FINAL RESULT:`);
console.log(`  User App (intrihub-mobile):    ${mobileOk ? "PASSED ✅" : "FAILED ❌"}`);
console.log(`  Vendor App (intrihub-business): ${businessOk ? "PASSED ✅" : "FAILED ❌"}`);
console.log(`========================================\n`);

if (!mobileOk || !businessOk) {
  process.exit(1);
} else {
  process.exit(0);
}
