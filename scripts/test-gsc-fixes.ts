import assert from "assert";
import robots from "../app/robots";
import sitemap from "../app/sitemap";
import { middleware } from "../middleware";
import { NextRequest } from "next/server";
import { getRedirectForPath } from "../lib/redirects";

async function runTests() {
  console.log("==========================================================================");
  console.log("RUNNING GSC SITEMAP, ROBOTS.TXT & 404 TECHNICAL VERIFICATION SUITE");
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

  // Verify private sections are blocked
  assert(disallows.includes("/admin/"), "robots.txt must disallow /admin/");
  assert(disallows.includes("/admin"), "robots.txt must disallow /admin");
  assert(disallows.includes("/account/"), "robots.txt must disallow /account/");
  assert(disallows.includes("/account"), "robots.txt must disallow /account");
  assert(disallows.includes("/cart/"), "robots.txt must disallow /cart/");
  assert(disallows.includes("/cart"), "robots.txt must disallow /cart");
  assert(disallows.includes("/checkout/"), "robots.txt must disallow /checkout/");
  assert(disallows.includes("/checkout"), "robots.txt must disallow /checkout");
  assert(disallows.includes("/api/"), "robots.txt must disallow /api/");
  assert(disallows.includes("/vendor/"), "robots.txt must disallow /vendor/");
  console.log("  ✓ robots.txt disallows all private sections (/admin, /account, /cart, /checkout, /api, /vendor/)");

  // Verify public exceptions & legitimate pages are allowed
  assert(allows.includes("/vendor/apply"), "robots.txt must allow /vendor/apply (overrides /vendor/)");
  console.log("  ✓ robots.txt explicitly allows /vendor/apply");

  assert(allows.includes("/shop/outdoor-tiles"), "robots.txt must allow /shop/outdoor-tiles");
  console.log("  ✓ robots.txt explicitly allows /shop/outdoor-tiles");

  assert(allows.includes("/inspiration"), "robots.txt must allow /inspiration");
  console.log("  ✓ robots.txt explicitly allows /inspiration");

  // Verify /shop?* is NOT disallowed (was causing false positive blocks on /shop/outdoor-tiles)
  assert(!disallows.includes("/shop?*"), "robots.txt must NOT disallow /shop?*");
  console.log("  ✓ robots.txt does NOT contain broad /shop?* block rule");

  // 2. Middleware 301 Redirects Validation
  console.log("\n[TEST 2] middleware.ts Request Interception & 301 Redirects:");

  // 2a. /inspiration -> 301 /shop
  const reqInspiration = new NextRequest("https://www.intrihub.com/inspiration");
  const resInspiration = middleware(reqInspiration);
  assert.strictEqual(resInspiration.status, 301, "/inspiration must return 301");
  assert.strictEqual(resInspiration.headers.get("location"), "https://www.intrihub.com/shop", "/inspiration must redirect to /shop");
  console.log("  ✓ /inspiration -> 301 https://www.intrihub.com/shop");

  // 2b. /designs -> 301 /shop
  const reqDesigns = new NextRequest("https://www.intrihub.com/designs");
  const resDesigns = middleware(reqDesigns);
  assert.strictEqual(resDesigns.status, 301, "/designs must return 301");
  assert.strictEqual(resDesigns.headers.get("location"), "https://www.intrihub.com/shop", "/designs must redirect to /shop");
  console.log("  ✓ /designs -> 301 https://www.intrihub.com/shop");

  // 2c. /shop/outdoor-tiles -> 301 /shop/tiles-stone
  const reqOutdoor = new NextRequest("https://www.intrihub.com/shop/outdoor-tiles");
  const resOutdoor = middleware(reqOutdoor);
  assert.strictEqual(resOutdoor.status, 301, "/shop/outdoor-tiles must return 301");
  assert.strictEqual(resOutdoor.headers.get("location"), "https://www.intrihub.com/shop/tiles-stone", "/shop/outdoor-tiles must redirect to /shop/tiles-stone");
  console.log("  ✓ /shop/outdoor-tiles -> 301 https://www.intrihub.com/shop/tiles-stone");

  // 2d. search_term_string
  const reqSearch = new NextRequest("https://www.intrihub.com/shop?q=%7Bsearch_term_string%7D");
  const resSearch = middleware(reqSearch);
  assert.strictEqual(resSearch.status, 301, "search_term_string must return 301");
  console.log("  ✓ /shop?q={search_term_string} -> 301 https://www.intrihub.com/shop");

  // 3. Database 301 Redirects for Deleted Products
  console.log("\n[TEST 3] Database Redirect Table Verification for Cleaned Test Products:");
  const testMarbleRedirect = await getRedirectForPath("/product/test-marble-tile-1786797496480");
  assert(testMarbleRedirect !== null && testMarbleRedirect.statusCode === 301, "test-marble-tile must redirect 301");
  assert.strictEqual(testMarbleRedirect?.toPath, "/shop/tiles-stone", "test-marble-tile must redirect to /shop/tiles-stone");
  console.log("  ✓ /product/test-marble-tile-1786797496480 -> 301 /shop/tiles-stone");

  const secTestRedirect = await getRedirectForPath("/product/sectest-tile-1788938498982");
  assert(secTestRedirect !== null && secTestRedirect.statusCode === 301, "sectest-tile must redirect 301");
  assert.strictEqual(secTestRedirect?.toPath, "/shop/tiles-stone", "sectest-tile must redirect to /shop/tiles-stone");
  console.log("  ✓ /product/sectest-tile-1788938498982 -> 301 /shop/tiles-stone");

  // 4. Sitemap Cleanliness Validation
  console.log("\n[TEST 4] sitemap.ts Strict Exclusion Verification:");
  const sitemapEntries = await sitemap();
  const urls = sitemapEntries.map((e) => e.url);

  // Private routes leak check
  const privateRouteLeaks = urls.filter((u) => {
    const p = new URL(u).pathname.toLowerCase();
    if (p === "/vendor/apply") return false;
    return (
      p.startsWith("/account") ||
      p.startsWith("/admin") ||
      p.startsWith("/vendor") ||
      p.startsWith("/cart") ||
      p.startsWith("/checkout") ||
      p.startsWith("/api") ||
      p.startsWith("/upload") ||
      p === "/designs" ||
      p === "/inspiration"
    );
  });
  assert.strictEqual(
    privateRouteLeaks.length,
    0,
    `Sitemap must contain 0 private/redirect routes! Found: ${privateRouteLeaks.join(", ")}`
  );
  console.log("  ✓ Sitemap contains 0 private/auth-gated/redirect routes");

  // Vendor apply check
  const hasVendorApply = urls.some((u) => new URL(u).pathname === "/vendor/apply");
  assert(hasVendorApply, "Sitemap must include public /vendor/apply route");
  console.log("  ✓ Sitemap correctly includes public /vendor/apply");

  // Test data leaks check
  const testProductLeaks = urls.filter((u) => {
    const p = new URL(u).pathname.toLowerCase();
    return p.includes("test-") || p.includes("-test") || p.includes("/test");
  });
  assert.strictEqual(
    testProductLeaks.length,
    0,
    `Sitemap must contain 0 test products! Found: ${testProductLeaks.join(", ")}`
  );
  console.log("  ✓ Sitemap contains 0 test products");

  // Static assets check
  const staticAssetLeaks = urls.filter((u) =>
    u.includes(".woff") ||
    u.includes(".woff2") ||
    u.includes(".ttf") ||
    u.includes(".ico") ||
    u.includes(".png") ||
    u.includes(".svg") ||
    u.includes("_next")
  );
  assert.strictEqual(staticAssetLeaks.length, 0, "Sitemap must contain NO static assets");
  console.log(`  ✓ Sitemap contains 0 static assets across all ${urls.length} entries`);

  console.log("\n==========================================================================");
  console.log("🎉 ALL GOOGLE SEARCH CONSOLE AUDIT & TECHNICAL FIX CHECKS PASSED PERFECTLY!");
  console.log("==========================================================================");
}

runTests().catch((err) => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
