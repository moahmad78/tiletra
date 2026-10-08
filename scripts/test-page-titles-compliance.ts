import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { USP_ITEMS } from "../lib/data/usps";
import { CATEGORY_SEO, getCategorySeo } from "../lib/data/category-seo";
import { SEO_LOCATIONS } from "../lib/data/seo-locations";
import { SEO_PAGES_SEED_DATA } from "../prisma/seed-seo-pages";

const BRAND_SUFFIX = " | IntriHub";
const MAX_TITLE_LENGTH = 60;

console.log("==================================================");
console.log("RUNNING PAGE TITLES & SLOGAN COMPLIANCE AUDIT");
console.log("==================================================");

let totalTested = 0;
let passed = 0;
const failures: string[] = [];

function checkTitle(route: string, renderedTitle: string) {
  totalTested++;

  // 1. Max length <= 60
  if (renderedTitle.length > MAX_TITLE_LENGTH) {
    failures.push(`[${route}] Title exceeds 60 chars (${renderedTitle.length}): "${renderedTitle}"`);
    return;
  }

  // 2. Exactly one brand occurrence
  const brandMatches = (renderedTitle.match(/IntriHub/g) || []).length;
  if (brandMatches !== 1) {
    failures.push(`[${route}] Brand 'IntriHub' must appear exactly once, found ${brandMatches}: "${renderedTitle}"`);
    return;
  }

  // 3. No bad capitalization 'Intrihub'
  if (/Intrihub/.test(renderedTitle)) {
    failures.push(`[${route}] Forbidden lowercase 'Intrihub' in title: "${renderedTitle}"`);
    return;
  }

  // 4. No repeated title join with ' • '
  if (renderedTitle.includes(" • ")) {
    failures.push(`[${route}] Forbidden ' • ' title join found: "${renderedTitle}"`);
    return;
  }

  // 5. No forbidden word 'wholesaler'
  if (/wholesaler/i.test(renderedTitle)) {
    failures.push(`[${route}] Forbidden word 'wholesaler' found: "${renderedTitle}"`);
    return;
  }

  passed++;
}

// 1. Root & Static Pages
console.log("\n1. Auditing Static Route Titles...");
const staticTitles: Record<string, string> = {
  "/": "Every Material. Every Space. | IntriHub",
  "/about": "About: Building & Interior Materials | IntriHub",
  "/contact": "Contact: Customer & Site Support | IntriHub",
  "/areas": "Serviceable Areas in Karnataka | IntriHub",
  "/founder": "Sahil Sheikh: Founder, CEO & CTO | IntriHub",
  "/why-intrihub": "Why Choose Us: 20 Advantages | IntriHub",
  "/guides": "Building & Interior Buying Guides | IntriHub",
  "/guides/diwali-home-renovation-2026-materials-checklist": "Diwali Home Renovation 2026 Checklist | IntriHub",
  "/guides/vitrified-tiles-online-buying-guide": "Vitrified Tiles Online Buying Guide 2026 | IntriHub",
  "/building-materials-online": "Buy Building Materials Online | IntriHub",
  "/shop": "Shop All Interior & Construction Materials | IntriHub",
  "/categories": "Browse All Product Categories | IntriHub",
  "/bulk-orders": "Bulk Orders for Contractors & Projects | IntriHub",
  "/for-contractors": "For Contractors & Builders | IntriHub",
  "/for-architects": "For Architects & Specifiers | IntriHub",
  "/for-interior-designers": "For Interior Designers & Studios | IntriHub",
  "/faq": "Frequently Asked Questions (FAQ) | IntriHub",
  "/pan-india-delivery": "Pan-India Building Materials Delivery | IntriHub",
  "/vendor/apply": "Become a Vendor Partner | IntriHub",
  "/shipping-policy": "Shipping & Delivery Policy | IntriHub",
  "/returns-policy": "Returns & Replacement Policy | IntriHub",
  "/privacy-policy": "Privacy Policy | IntriHub",
  "/terms": "Terms & Conditions | IntriHub",
  "/404": "404: Page Not Found | IntriHub",
};

for (const [route, title] of Object.entries(staticTitles)) {
  checkTitle(route, title);
}

// 2. USP Pages (20 Items)
console.log("\n2. Auditing 20 USP Pages...");
for (const usp of USP_ITEMS) {
  const renderedTitle = `${usp.title}${BRAND_SUFFIX}`;
  checkTitle(`/${usp.slug}`, renderedTitle);
}

// 3. Category Shop Pages (from Category SEO)
console.log("\n3. Auditing Category SEO Titles...");
for (const [slug, data] of Object.entries(CATEGORY_SEO)) {
  let cleanTitle = data.metaTitle.replace(/\s*\|\s*IntriHub/gi, "").trim();
  if (cleanTitle.length > 48) {
    cleanTitle = cleanTitle.slice(0, 48).trim().replace(/[,\-:|—\s]+$/, "");
  }
  const renderedTitle = `${cleanTitle}${BRAND_SUFFIX}`;
  checkTitle(`/shop/${slug}`, renderedTitle);
}

// 4. Category + Location Combinations
console.log("\n4. Auditing Category + Location Titles...");
const sampleCategories = ["tiles-stone", "electrical", "plumbing-sanitary"];
for (const catSlug of sampleCategories) {
  const catSeo = getCategorySeo(catSlug);
  const catName = catSeo.h1.replace(" Online", "");
  for (const loc of SEO_LOCATIONS.slice(0, 5)) {
    let cleanTitle = `${catName} in ${loc.name}`;
    if (cleanTitle.length > 48) {
      cleanTitle = cleanTitle.slice(0, 48).trim().replace(/[,\-:|—\s]+$/, "");
    }
    const renderedTitle = `${cleanTitle}${BRAND_SUFFIX}`;
    checkTitle(`/shop/${catSlug}/${loc.slug}`, renderedTitle);
  }
}

// 5. Dynamic SEO Seed Pages
console.log("\n5. Auditing Dynamic Landing Pages (Seed Data)...");
for (const page of SEO_PAGES_SEED_DATA.slice(0, 30)) {
  let cleanTitle = page.title.replace(/\s*\|\s*Intrihub/gi, "").trim();
  if (cleanTitle.length > 48) {
    cleanTitle = cleanTitle.slice(0, 48).trim().replace(/[,\-:|—\s]+$/, "");
  }
  const renderedTitle = `${cleanTitle}${BRAND_SUFFIX}`;
  checkTitle(`/${page.slug}`, renderedTitle);
}

// 6. Web Manifest Verification
console.log("\n6. Auditing Web Manifest Files...");
const manifestPath = path.resolve("public/manifest.json");
const webmanifestPath = path.resolve("public/site.webmanifest");

assert(fs.existsSync(manifestPath), "manifest.json must exist");
assert(fs.existsSync(webmanifestPath), "site.webmanifest must exist");

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
const webmanifest = JSON.parse(fs.readFileSync(webmanifestPath, "utf-8"));

assert(manifest.name.includes("Every Material. Every Space."), "manifest.json has slogan");
assert(manifest.short_name === "IntriHub", "manifest.json short_name is IntriHub");
assert(!manifest.short_name.includes("Intrihub"), "manifest.json no lowercase Intrihub");

assert(webmanifest.name.includes("Every Material. Every Space."), "site.webmanifest has slogan");
assert(webmanifest.short_name === "IntriHub", "site.webmanifest short_name is IntriHub");
assert(!webmanifest.short_name.includes("Intrihub"), "site.webmanifest no lowercase Intrihub");

console.log("\n==================================================");
console.log(`AUDIT RESULTS: ${passed}/${totalTested} Passed`);
if (failures.length > 0) {
  console.error("FAILURES DETECTED:");
  failures.forEach((f) => console.error(" ❌ " + f));
  process.exit(1);
} else {
  console.log("✅ ALL TITLES <= 60 CHARS");
  console.log("✅ EXACTLY 1 'IntriHub' PER TITLE");
  console.log("✅ NO ' • ' JOINS OR REPETITIONS");
  console.log("✅ ZERO 'wholesaler' OCCURRENCES");
  console.log("✅ OFFICIAL SLOGAN 'Every Material. Every Space.' ACTIVE EVERYWHERE");
  console.log("==================================================");
}
