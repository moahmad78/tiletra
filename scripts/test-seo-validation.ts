import { getCanonicalUrl, generateOrganizationSchema, generateWebSiteSchema, generateBreadcrumbSchema, generateProductSchema, BASE_SITE_URL } from "../lib/seo";
import robots from "../app/robots";
import sitemap from "../app/sitemap";
import { prisma } from "../lib/prisma";

async function runSeoTests() {
  console.log("==========================================");
  console.log("🔍 RUNNING INTRIHUB SEO INTEGRATION TESTS");
  console.log("==========================================\n");

  let passed = 0;
  let failed = 0;

  // 1. Test Canonical Formatter
  try {
    const url1 = getCanonicalUrl("/shop/lighting?sort=price-low&color=warm");
    const url2 = getCanonicalUrl("product/12w-led-downlight/");
    if (url1 === `${BASE_SITE_URL}/shop/lighting` && url2 === `${BASE_SITE_URL}/product/12w-led-downlight`) {
      console.log("✅ [1] Canonical URL Formatter: PASSED (Strips query params, trailing slashes, enforces domain)");
      passed++;
    } else {
      console.log("❌ [1] Canonical URL Formatter: FAILED", { url1, url2 });
      failed++;
    }
  } catch (e) {
    console.log("❌ [1] Canonical URL Formatter: ERROR", e);
    failed++;
  }

  // 2. Test Organization Schema
  try {
    const orgSchema = generateOrganizationSchema();
    if (orgSchema["@type"] === "Organization" && orgSchema.name === "Intrihub" && orgSchema.logo && orgSchema.founder?.name === "Sahil Sheikh") {
      console.log("✅ [2] Organization Schema.org: PASSED (Valid Schema.org Organization structure)");
      passed++;
    } else {
      console.log("❌ [2] Organization Schema: FAILED", orgSchema);
      failed++;
    }
  } catch (e) {
    console.log("❌ [2] Organization Schema: ERROR", e);
    failed++;
  }

  // 3. Test WebSite Schema & SearchAction
  try {
    const wsSchema = generateWebSiteSchema();
    if (wsSchema["@type"] === "WebSite" && wsSchema.potentialAction?.["@type"] === "SearchAction") {
      console.log("✅ [3] WebSite Schema & SearchAction: PASSED (Valid SearchAction query template)");
      passed++;
    } else {
      console.log("❌ [3] WebSite Schema: FAILED", wsSchema);
      failed++;
    }
  } catch (e) {
    console.log("❌ [3] WebSite Schema: ERROR", e);
    failed++;
  }

  // 4. Test Product Schema
  try {
    const prodSchema = generateProductSchema({
      id: "prod-123",
      name: "12W LED Panel Light",
      slug: "12w-led-panel-light",
      description: "Energy efficient LED panel light",
      price: 499,
      inStock: true,
      categoryName: "Lighting",
      brand: "Intrihub Essentials",
    });

    if (
      prodSchema["@type"] === "Product" &&
      prodSchema.offers.price === 499 &&
      prodSchema.offers.availability === "https://schema.org/InStock" &&
      prodSchema.offers.priceCurrency === "INR"
    ) {
      console.log("✅ [4] Product Schema.org: PASSED (Valid Offer, INR currency, genuine availability)");
      passed++;
    } else {
      console.log("❌ [4] Product Schema: FAILED", prodSchema);
      failed++;
    }
  } catch (e) {
    console.log("❌ [4] Product Schema: ERROR", e);
    failed++;
  }

  // 5. Test Breadcrumb Schema
  try {
    const bcSchema = generateBreadcrumbSchema([
      { name: "Home", url: "/" },
      { name: "Lighting", url: "/shop/lighting" },
      { name: "12W LED Panel Light", url: "/product/12w-led-panel-light" },
    ]);

    if (bcSchema["@type"] === "BreadcrumbList" && bcSchema.itemListElement.length === 3) {
      console.log("✅ [5] BreadcrumbList Schema: PASSED (3-level hierarchy matched)");
      passed++;
    } else {
      console.log("❌ [5] BreadcrumbList Schema: FAILED", bcSchema);
      failed++;
    }
  } catch (e) {
    console.log("❌ [5] BreadcrumbList Schema: ERROR", e);
    failed++;
  }

  // 6. Test Robots.txt rules
  try {
    const robotsRules = robots();
    const rules = Array.isArray(robotsRules.rules) ? robotsRules.rules[0] : robotsRules.rules;
    const disallow = Array.isArray(rules?.disallow) ? rules?.disallow : [rules?.disallow];
    
    if (
      robotsRules.sitemap === `${BASE_SITE_URL}/sitemap.xml` &&
      disallow.includes("/cart") &&
      disallow.includes("/checkout") &&
      disallow.includes("/admin/") &&
      disallow.includes("/vendor/")
    ) {
      console.log("✅ [6] Robots.txt Directives: PASSED (Sitemap reference & private route disallows)");
      passed++;
    } else {
      console.log("❌ [6] Robots.txt Directives: FAILED", robotsRules);
      failed++;
    }
  } catch (e) {
    console.log("❌ [6] Robots.txt Directives: ERROR", e);
    failed++;
  }

  // 7. Test Dynamic Sitemap Generation
  try {
    const sitemapEntries = await sitemap();
    const urls = sitemapEntries.map((e) => e.url);

    const hasHomepage = urls.includes(`${BASE_SITE_URL}`);
    const hasShop = urls.includes(`${BASE_SITE_URL}/shop`);
    const hasAbout = urls.includes(`${BASE_SITE_URL}/about`);
    const hasPrivateCart = urls.some((u) => u.includes("/cart") || u.includes("/checkout") || u.includes("/admin"));

    if (hasHomepage && hasShop && hasAbout && !hasPrivateCart && sitemapEntries.length > 5) {
      console.log(`✅ [7] Dynamic Sitemap: PASSED (Generated ${sitemapEntries.length} canonical URLs with zero private routes)`);
      passed++;
    } else {
      console.log("❌ [7] Dynamic Sitemap: FAILED", { total: sitemapEntries.length, hasHomepage, hasPrivateCart });
      failed++;
    }
  } catch (e) {
    console.log("❌ [7] Dynamic Sitemap: ERROR", e);
    failed++;
  }

  console.log("\n==========================================");
  console.log(`🏁 TEST SUMMARY: ${passed} PASSED | ${failed} FAILED`);
  console.log("==========================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runSeoTests()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
