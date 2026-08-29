import {
  generateOrganizationSchema,
  generateWebSiteSchema,
  generateBreadcrumbSchema,
  generateProductSchema,
  generateFAQSchema,
  generateItemListSchema,
  BASE_SITE_URL,
} from "../lib/seo";
import robots from "../app/robots";
import { BUYING_GUIDES } from "../lib/guides-data";
import fs from "fs";
import path from "path";

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ Assertion Failed: ${msg}`);
    process.exit(1);
  }
  console.log(`  ✓ ${msg}`);
}

async function runSeoSchemaTests() {
  console.log("==========================================================================");
  console.log("INTRIHUB TECHNICAL SEO, STRUCTURED DATA & BRAND DOMINANCE TEST SUITE");
  console.log("==========================================================================\n");

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. ORGANIZATION / ONLINESTORE SCHEMA VALIDATION (PRD Section 4.1.4 & 6.1)
  // ─────────────────────────────────────────────────────────────────────────────
  console.log("[TEST 1] Organization & OnlineStore Schema Validation:");
  const org = generateOrganizationSchema();

  assert(org["@context"] === "https://schema.org", "Org schema has valid @context");
  assert(
    Array.isArray(org["@type"])
      ? org["@type"].includes("OnlineStore") && org["@type"].includes("Organization")
      : org["@type"] === "OnlineStore" || org["@type"] === "Organization",
    "Org schema includes OnlineStore / Organization type"
  );
  assert(org.name === "IntriHub", "Org schema name is 'IntriHub'");
  assert(
    org.alternateName === "IntriHub QuickCommerce" || org.alternateName === "IntriHub Quick Commerce",
    "Org schema alternateName is 'IntriHub QuickCommerce'"
  );
  assert(!JSON.stringify(org).includes("Technologies"), "Org schema contains NO 'Technologies' references");
  assert(org.address && org.address["@type"] === "PostalAddress", "Org schema has valid PostalAddress");
  assert(org.address.addressCountry === "IN", "Org address country is IN");
  assert(org.telephone === "+91-92649-20211", "Org telephone formatted consistently (+91-92649-20211)");
  assert(org.foundingDate === "2026", "Org foundingDate is set to 2026");
  assert(Array.isArray(org.sameAs) && org.sameAs.length >= 3, "Org sameAs has live social/brand profile links");

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. WEBSITE SCHEMA VALIDATION
  // ─────────────────────────────────────────────────────────────────────────────
  console.log("\n[TEST 2] WebSite Schema Validation:");
  const website = generateWebSiteSchema();
  assert(website["@type"] === "WebSite", "WebSite schema has valid @type");
  assert(website.name === "IntriHub", "WebSite name is 'IntriHub'");
  assert(website.potentialAction?.["@type"] === "SearchAction", "WebSite has SearchAction");
  assert(!JSON.stringify(website).includes("Technologies"), "WebSite schema contains NO 'Technologies'");

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. BASELINE PRODUCT SCHEMA (0 REVIEWS) - GOOGLE MERCHANT CENTER (PRD Section 6.2)
  // ─────────────────────────────────────────────────────────────────────────────
  console.log("\n[TEST 3] Baseline Product Schema (No Reviews Yet):");
  const baselineProduct = generateProductSchema({
    id: "prod_tile_101",
    name: "Premium Vitrified Floor Tile 600x600mm",
    slug: "premium-vitrified-floor-tile-600x600mm",
    description: "Factory-direct ceramic tiles with secure pallet transit delivery via IntriHub.",
    sku: "IH-TILE-001",
    price: 450,
    inStock: true,
    categoryName: "Floor Tiles",
    brand: "IntriHub",
  });

  assert(baselineProduct["@type"] === "Product", "Product schema @type is 'Product'");
  assert(baselineProduct.name === "Premium Vitrified Floor Tile 600x600mm", "Product name is set");
  assert(baselineProduct.sku === "IH-TILE-001", "Product SKU is set");
  assert(baselineProduct.offers && baselineProduct.offers["@type"] === "Offer", "Product has valid Offer block");
  assert(baselineProduct.offers.priceCurrency === "INR", "Price currency is INR");
  assert(baselineProduct.offers.price === "450", "Price value matches");
  assert(baselineProduct.offers.availability === "https://schema.org/InStock", "Availability is InStock");

  // Google Merchant Center Offer Shipping Details
  assert(Boolean(baselineProduct.offers.shippingDetails), "Offers has shippingDetails (GMC Compliance)");
  assert(
    baselineProduct.offers.shippingDetails["@type"] === "OfferShippingDetails",
    "shippingDetails @type is 'OfferShippingDetails'"
  );
  assert(
    baselineProduct.offers.shippingDetails.shippingDestination?.addressCountry === "IN",
    "shippingDestination country is IN"
  );
  assert(
    baselineProduct.offers.shippingDetails.deliveryTime?.["@type"] === "ShippingDeliveryTime",
    "deliveryTime @type is 'ShippingDeliveryTime'"
  );

  // Google Merchant Center Return Policy
  assert(Boolean(baselineProduct.offers.hasMerchantReturnPolicy), "Offers has hasMerchantReturnPolicy (GMC Compliance)");
  assert(
    baselineProduct.offers.hasMerchantReturnPolicy["@type"] === "MerchantReturnPolicy",
    "hasMerchantReturnPolicy @type is 'MerchantReturnPolicy'"
  );
  assert(
    baselineProduct.offers.hasMerchantReturnPolicy.applicableCountry === "IN",
    "return policy applicableCountry is IN"
  );
  assert(
    baselineProduct.offers.hasMerchantReturnPolicy.merchantReturnDays === 7,
    "merchantReturnDays is 7"
  );

  // CRITICAL CONSTRAINT: Must NOT emit aggregateRating or review for 0 reviews!
  assert(
    !("aggregateRating" in baselineProduct),
    "CRITICAL PASS: aggregateRating key is completely omitted when 0 reviews exist"
  );
  assert(
    !("review" in baselineProduct),
    "CRITICAL PASS: review key is completely omitted when 0 reviews exist"
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // 4. PRODUCT SCHEMA WITH REAL GENUINE REVIEWS (PRD Section 6.3)
  // ─────────────────────────────────────────────────────────────────────────────
  console.log("\n[TEST 4] Product Schema with Real Verified Reviews (Conditional Activation):");
  const reviewedProduct = generateProductSchema({
    id: "prod_tile_102",
    name: "Italian Glazed Porcelain Tile",
    slug: "italian-glazed-porcelain-tile",
    description: "Premium vitrified porcelain tiles.",
    sku: "IH-PORC-002",
    price: 850,
    inStock: true,
    categoryName: "Floor Tiles",
    brand: "IntriHub",
    reviews: [
      {
        id: "rev_1",
        author: "Kavita Reddy",
        rating: 5,
        comment: "Exceptional quality tiles and fast direct-to-site delivery in Bangalore.",
        createdAt: "2026-08-15T10:00:00.000Z",
      },
      {
        id: "rev_2",
        author: "Manoj Kumar",
        rating: 4,
        comment: "Good finish and sturdy packaging without breakages.",
        createdAt: "2026-08-18T14:30:00.000Z",
      },
    ],
  });

  assert(Boolean(reviewedProduct.aggregateRating), "aggregateRating is present when genuine reviews exist");
  assert(reviewedProduct.aggregateRating["@type"] === "AggregateRating", "aggregateRating @type is 'AggregateRating'");
  assert(reviewedProduct.aggregateRating.ratingValue === "4.5", "Calculated real average rating is '4.5' (5+4)/2");
  assert(reviewedProduct.aggregateRating.reviewCount === "2", "Calculated real review count is '2'");
  assert(Array.isArray(reviewedProduct.review), "review is array of genuine review objects");
  assert(reviewedProduct.review.length === 2, "review array contains exactly 2 reviews");
  assert(reviewedProduct.review[0].author.name === "Kavita Reddy", "Review 1 author matches");
  assert(reviewedProduct.review[0].reviewRating.ratingValue === "5", "Review 1 rating matches");

  // ─────────────────────────────────────────────────────────────────────────────
  // 5. ROBOTS.TXT AUDIT & RULE VERIFICATION (PRD Section 5.1.1 & 6.4)
  // ─────────────────────────────────────────────────────────────────────────────
  console.log("\n[TEST 5] robots.txt Rules Verification:");
  const robotsConfig = robots();
  const disallows = Array.isArray(robotsConfig.rules)
    ? robotsConfig.rules.flatMap((r) => r.disallow || [])
    : (robotsConfig.rules as any).disallow || [];

  assert(disallows.includes("/api/"), "robots.txt disallows internal /api/");
  assert(disallows.includes("/account/"), "robots.txt disallows private /account/");
  assert(disallows.includes("/admin/"), "robots.txt disallows /admin/");
  assert(disallows.includes("/vendor/"), "robots.txt disallows /vendor/");
  assert(!disallows.includes("/shop/"), "robots.txt DOES NOT block /shop/");
  assert(!disallows.includes("/product/"), "robots.txt DOES NOT block /product/");
  assert(!disallows.includes("/guides/"), "robots.txt DOES NOT block /guides/");
  assert(
    robotsConfig.sitemap === `${BASE_SITE_URL}/sitemap.xml`,
    `robots.txt declares correct sitemap URL: ${robotsConfig.sitemap}`
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // 6. BRAND DISAMBIGUATION & E-E-A-T CONTENT DEPTH (PRD Section 4.1.5 & 4.3)
  // ─────────────────────────────────────────────────────────────────────────────
  console.log("\n[TEST 6] Brand Disambiguation & E-E-A-T Depth Verification:");
  const layoutContent = fs.readFileSync(path.join(__dirname, "../app/layout.tsx"), "utf-8");
  assert(
    layoutContent.includes("Building Materials Marketplace — Bengaluru"),
    "Homepage layout contains disambiguating title: 'IntriHub | Building Materials Marketplace — Bengaluru & Pan-India'"
  );
  assert(BUYING_GUIDES.length >= 5, `E-E-A-T Guide count is ≥ 5 (Found ${BUYING_GUIDES.length} rich guides)`);
  
  const has60MinGuide = BUYING_GUIDES.some((g) => g.slug.includes("60-minutes"));
  const hasFounderGuide = BUYING_GUIDES.some((g) => g.slug.includes("founders-note"));
  assert(has60MinGuide, "Contains dedicated 'How IntriHub Delivers in 60 Minutes' logistics guide");
  assert(hasFounderGuide, "Contains dedicated 'Founder's Note (Sahil Sheikh)' company vision guide");

  console.log("\n==========================================================================");
  console.log("🎉 ALL SEO, STRUCTURED DATA & BRAND DOMINANCE TESTS PASSED (100%)! ✓");
  console.log("==========================================================================");
}

runSeoSchemaTests().catch((e) => {
  console.error(e);
  process.exit(1);
});
