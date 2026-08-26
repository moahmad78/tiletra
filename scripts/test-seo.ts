import robots from "../app/robots";
import sitemap from "../app/sitemap";
import {
  BASE_SITE_URL,
  getCanonicalUrl,
  generateOrganizationSchema,
  generateWebSiteSchema,
  generateBreadcrumbSchema,
  generateProductSchema,
  generateArticleSchema,
  generateFAQSchema,
  generateItemListSchema,
} from "../lib/seo";
import { BUYING_GUIDES } from "../lib/guides-data";

async function runSeoTests() {
  console.log("==========================================");
  console.log("🚀 STARTING INTRIHUB SEO & SCHEMA AUDIT TEST");
  console.log("==========================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName}`);
      failed++;
    }
  }

  // 1. Canonical Domain Strategy
  console.log("--- 1. CANONICAL URL & BASE DOMAIN CHECKS ---");
  assert(BASE_SITE_URL === "https://www.intrihub.com", "Base site URL is https://www.intrihub.com");
  assert(getCanonicalUrl("/") === "https://www.intrihub.com", "Root canonical URL formats correctly");
  assert(
    getCanonicalUrl("/shop/floor-tiles?color=white&sort=price") === "https://www.intrihub.com/shop/floor-tiles",
    "Canonical strips query parameters (faceted navigation protection)"
  );
  assert(
    getCanonicalUrl("/Product/Marble-Tile/") === "https://www.intrihub.com/product/marble-tile",
    "Canonical normalizes trailing slashes and lowercases paths"
  );

  // 2. Robots.txt Strategy
  console.log("\n--- 2. ROBOTS.TXT DIRECTIVE CHECKS ---");
  const robotsConfig = robots();
  const disallows = Array.isArray(robotsConfig.rules)
    ? robotsConfig.rules.flatMap((r) => (Array.isArray(r.disallow) ? r.disallow : [r.disallow]))
    : Array.isArray(robotsConfig.rules?.disallow)
    ? robotsConfig.rules.disallow
    : [robotsConfig.rules?.disallow];

  assert(disallows.includes("/admin/"), "robots.txt disallows /admin/");
  assert(disallows.includes("/vendor/"), "robots.txt disallows /vendor/");
  assert(disallows.includes("/api/"), "robots.txt disallows /api/");
  assert(!disallows.includes("/cart"), "robots.txt DOES NOT disallow /cart (enables Googlebot noindex crawling)");
  assert(!disallows.includes("/checkout"), "robots.txt DOES NOT disallow /checkout (enables Googlebot noindex crawling)");
  assert(!disallows.includes("/account/"), "robots.txt DOES NOT disallow /account/ (enables Googlebot noindex crawling)");
  assert(robotsConfig.sitemap === "https://www.intrihub.com/sitemap.xml", "robots.txt links to canonical sitemap.xml");

  // 3. Sitemap Dynamic Generation
  console.log("\n--- 3. DYNAMIC SITEMAP XML GENERATION CHECKS ---");
  const sitemapEntries = await sitemap();
  assert(sitemapEntries.length > 0, `Sitemap generated ${sitemapEntries.length} indexable URLs`);

  const urls = sitemapEntries.map((e) => e.url);
  assert(urls.includes("https://www.intrihub.com"), "Sitemap includes Homepage");
  assert(urls.includes("https://www.intrihub.com/shop"), "Sitemap includes /shop");
  assert(urls.includes("https://www.intrihub.com/categories"), "Sitemap includes /categories");
  assert(urls.includes("https://www.intrihub.com/guides"), "Sitemap includes /guides");
  assert(urls.includes("https://www.intrihub.com/for-architects"), "Sitemap includes /for-architects");
  assert(urls.includes("https://www.intrihub.com/for-interior-designers"), "Sitemap includes /for-interior-designers");
  assert(urls.includes("https://www.intrihub.com/for-contractors"), "Sitemap includes /for-contractors");

  // Check no private routes in sitemap
  assert(!urls.some((u) => u.includes("/cart")), "0 /cart URLs in sitemap");
  assert(!urls.some((u) => u.includes("/checkout")), "0 /checkout URLs in sitemap");
  assert(!urls.some((u) => u.includes("/account")), "0 /account URLs in sitemap");
  assert(!urls.some((u) => u.includes("/admin")), "0 /admin URLs in sitemap");
  assert(!urls.some((u) => u.includes("/vendor")), "0 /vendor URLs in sitemap");
  assert(!urls.some((u) => u.includes("/api/")), "0 /api URLs in sitemap");

  // 4. Schema.org JSON-LD Builders
  console.log("\n--- 4. SCHEMA.ORG STRUCTURED DATA CHECKS ---");
  const org = generateOrganizationSchema();
  assert(org["@type"] === "Organization" && org.name === "Intrihub", "Valid Organization schema");
  assert(org.url === "https://www.intrihub.com", "Organization URL points to canonical domain");

  const website = generateWebSiteSchema();
  assert(website["@type"] === "WebSite" && website.potentialAction?.["@type"] === "SearchAction", "Valid WebSite schema with SearchAction");

  const breadcrumbs = generateBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Shop", url: "/shop" },
    { name: "Floor Tiles", url: "/shop/floor-tiles" },
  ]);
  assert(breadcrumbs["@type"] === "BreadcrumbList" && breadcrumbs.itemListElement.length === 3, "Valid BreadcrumbList schema with 3 levels");

  const product = generateProductSchema({
    id: "prod-1",
    name: "Classic White Vitrified Tile 600x600mm",
    slug: "classic-white-vitrified-tile-600x600mm",
    description: "Glossy finish floor tile for living spaces",
    price: 45,
    inStock: true,
  });
  assert(product["@type"] === "Product" && product.offers?.price === 45, "Valid Product schema with Offers");

  const article = generateArticleSchema({
    title: "How to Choose Tiles",
    description: "Guide to tiles",
    slug: "how-to-choose-tiles-for-home",
    publishedTime: "2026-02-15T00:00:00.000Z",
  });
  assert(article["@type"] === "Article" && article.headline === "How to Choose Tiles", "Valid Article schema for Buying Guides");

  const faqs = generateFAQSchema([
    { question: "How much tile wastage?", answer: "10% for straight lay." },
  ]);
  assert(faqs["@type"] === "FAQPage" && faqs.mainEntity.length === 1, "Valid FAQPage schema");

  const itemList = generateItemListSchema([
    { name: "Floor Tiles", url: "/shop/floor-tiles" },
    { name: "Wall Tiles", url: "/shop/wall-tiles" },
  ]);
  assert(itemList["@type"] === "ItemList" && itemList.itemListElement.length === 2, "Valid ItemList schema for categories");

  console.log("\n==========================================");
  console.log(`📊 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("==========================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runSeoTests().catch((err) => {
  console.error("SEO Audit Test Error:", err);
  process.exit(1);
});
