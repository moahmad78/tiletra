import assert from "assert";
import robots from "../app/robots";
import sitemap from "../app/sitemap";
import { middleware } from "../middleware";
import { NextRequest } from "next/server";

async function runTests() {
  console.log("==========================================================================");
  console.log("RUNNING GSC 'CRAWLED - CURRENTLY NOT INDEXED' TECHNICAL VERIFICATION SUITE");
  console.log("==========================================================================");

  // 1. Robots.txt Validation
  console.log("\n[TEST 1] robots.ts Directives Verification:");
  const robotsConfig = robots();
  const disallows = Array.isArray(robotsConfig.rules)
    ? robotsConfig.rules.flatMap((r) => (Array.isArray(r.disallow) ? r.disallow : [r.disallow]))
    : Array.isArray(robotsConfig.rules?.disallow)
    ? robotsConfig.rules.disallow
    : [robotsConfig.rules?.disallow];
  const allows = Array.isArray(robotsConfig.rules)
    ? robotsConfig.rules.flatMap((r) => (Array.isArray(r.allow) ? r.allow : [r.allow]))
    : Array.isArray(robotsConfig.rules?.allow)
    ? robotsConfig.rules.allow
    : [robotsConfig.rules?.allow];

  assert(disallows.includes("/_next/static/media/"), "robots.txt must disallow /_next/static/media/");
  console.log("  ✓ robots.txt disallows /_next/static/media/");

  assert(disallows.includes("/favicon.ico?*"), "robots.txt must disallow /favicon.ico?*");
  console.log("  ✓ robots.txt disallows /favicon.ico?*");

  assert(!disallows.includes("/*search_term_string*"), "robots.txt must NOT disallow search_term_string (lets 301 redirect execute)");
  assert(!disallows.includes("/*%7Bsearch_term_string%7D*"), "robots.txt must NOT disallow %7Bsearch_term_string%7D (lets 301 redirect execute)");
  console.log("  ✓ robots.txt does NOT block search_term_string (allowing Googlebot to receive 301 redirect to /shop)");

  assert(allows.includes("/favicon.ico$"), "robots.txt must restrict favicon allow to /favicon.ico$");
  console.log("  ✓ robots.txt allows exact /favicon.ico$");

  // 2. Middleware Redirect Validation
  console.log("\n[TEST 2] middleware.ts Request Interception & 301 Redirects:");

  // 2a. search_term_string encoded
  const req1 = new NextRequest("https://www.intrihub.com/shop?q=%7Bsearch_term_string%7D");
  const res1 = middleware(req1);
  assert.strictEqual(res1.status, 301, "Encoded search_term_string must return 301");
  assert.strictEqual(res1.headers.get("location"), "https://www.intrihub.com/shop", "Must redirect to canonical /shop");
  console.log("  ✓ /shop?q=%7Bsearch_term_string%7D -> 301 https://www.intrihub.com/shop");

  // 2b. search_term_string unencoded
  const req2 = new NextRequest("https://www.intrihub.com/shop?q={search_term_string}");
  const res2 = middleware(req2);
  assert.strictEqual(res2.status, 301, "Unencoded search_term_string must return 301");
  assert.strictEqual(res2.headers.get("location"), "https://www.intrihub.com/shop", "Must redirect to canonical /shop");
  console.log("  ✓ /shop?q={search_term_string} -> 301 https://www.intrihub.com/shop");

  // 2c. favicon with query string
  const req3 = new NextRequest("https://www.intrihub.com/favicon.ico?favicon.0psal-f-3fefc.ico");
  const res3 = middleware(req3);
  assert.strictEqual(res3.status, 301, "Favicon with query params must return 301");
  assert.strictEqual(res3.headers.get("location"), "https://www.intrihub.com/favicon.ico", "Must redirect to canonical /favicon.ico");
  console.log("  ✓ /favicon.ico?favicon.0psal-f-3fefc.ico -> 301 https://www.intrihub.com/favicon.ico");

  // 2d. Clean favicon
  const req4 = new NextRequest("https://www.intrihub.com/favicon.ico");
  const res4 = middleware(req4);
  assert.strictEqual(res4.status, 200, "Clean /favicon.ico must proceed normally (status 200/next)");
  console.log("  ✓ /favicon.ico -> 200 OK (passes through to static file)");

  // 2e. Clean shop page
  const req5 = new NextRequest("https://www.intrihub.com/shop");
  const res5 = middleware(req5);
  assert.strictEqual(res5.status, 200, "Clean /shop must proceed normally");
  console.log("  ✓ /shop -> 200 OK (passes through)");

  // 3. Sitemap Cleanliness Validation
  console.log("\n[TEST 3] sitemap.ts Static Asset Exclusion:");
  const sitemapEntries = await sitemap();
  const urls = sitemapEntries.map((e) => e.url);

  const staticAssetLeaks = urls.filter((u) =>
    u.includes(".woff") ||
    u.includes(".woff2") ||
    u.includes(".ttf") ||
    u.includes(".ico") ||
    u.includes(".png") ||
    u.includes(".svg") ||
    u.includes("_next") ||
    u.includes("search_term_string")
  );

  assert.strictEqual(staticAssetLeaks.length, 0, `Sitemap must contain NO static assets. Found: ${staticAssetLeaks.join(", ")}`);
  console.log(`  ✓ Sitemap contains 0 static assets across all ${urls.length} entries`);

  console.log("\n==========================================================================");
  console.log("🎉 ALL GSC TECHNICAL AUDIT CHECKS PASSED PERFECTLY!");
  console.log("==========================================================================");
}

runTests().catch((err) => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
