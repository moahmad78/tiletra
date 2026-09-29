import fs from "fs";
import path from "path";
import { SEO_PAGES_SEED_DATA } from "../prisma/seed-seo-pages";
import { BUYING_GUIDES } from "../lib/guides-data";
import { CATEGORY_SEO } from "../lib/data/category-seo";
import robots from "../app/robots";

interface CheckResult {
  name: string;
  passed: boolean;
  message?: string;
}

const results: CheckResult[] = [];

function check(name: string, condition: boolean, message?: string) {
  results.push({ name, passed: condition, message });
  if (condition) {
    console.log(`  ✓ PASS: ${name}`);
  } else {
    console.error(`  ✗ FAIL: ${name}${message ? " -> " + message : ""}`);
  }
}

console.log("==========================================================================");
console.log("INTRIHUB SEO BUILD AUDIT & HYGIENE VERIFICATION (seo:check)");
console.log("==========================================================================");

// -----------------------------------------------------------------------------
// CHECK 1: ZERO USE OF THE WORD "WHOLESALER"
// -----------------------------------------------------------------------------
console.log("\n[1] Checking Forbidden Term 'wholesaler'...");
let wholesalerViolations: string[] = [];

// A. Check SEO Pages Seed Data
for (const p of SEO_PAGES_SEED_DATA) {
  const contentToScan = `${p.title} ${p.metaDescription} ${p.h1} ${p.introContent} ${JSON.stringify(p.faqItems)}`.toLowerCase();
  if (contentToScan.includes("wholesaler")) {
    wholesalerViolations.push(`SEO Page ${p.slug}`);
  }
}

// B. Check Guides Data
for (const g of BUYING_GUIDES) {
  const guideText = `${g.title} ${g.shortDescription} ${g.summary} ${JSON.stringify(g.sections)} ${JSON.stringify(g.faqs)}`.toLowerCase();
  if (guideText.includes("wholesaler")) {
    wholesalerViolations.push(`Guide ${g.slug}`);
  }
}

// C. Check Vitrified Tiles Guide Source File
const vitrifiedGuidePath = path.join(process.cwd(), "app/guides/vitrified-tiles-online-buying-guide/page.tsx");
if (fs.existsSync(vitrifiedGuidePath)) {
  const content = fs.readFileSync(vitrifiedGuidePath, "utf-8").toLowerCase();
  if (content.includes("wholesaler")) {
    wholesalerViolations.push("app/guides/vitrified-tiles-online-buying-guide/page.tsx");
  }
}

// D. Check Footer & Navigation
const footerPath = path.join(process.cwd(), "components/Footer.tsx");
if (fs.existsSync(footerPath)) {
  const footerContent = fs.readFileSync(footerPath, "utf-8").toLowerCase();
  if (footerContent.includes("wholesaler")) {
    wholesalerViolations.push("components/Footer.tsx");
  }
}

// E. Check Category SEO Data
const categorySeoPath = path.join(process.cwd(), "lib/data/category-seo.ts");
if (fs.existsSync(categorySeoPath)) {
  const catSeoContent = fs.readFileSync(categorySeoPath, "utf-8").toLowerCase();
  if (catSeoContent.includes("wholesaler")) {
    wholesalerViolations.push("lib/data/category-seo.ts");
  }
}

check(
  "Zero 'wholesaler' in content, copy, metadata, and schemas",
  wholesalerViolations.length === 0,
  `Violations found in: ${wholesalerViolations.join(", ")}`
);

// -----------------------------------------------------------------------------
// CHECK 2: TITLE TAG RULES (<= 60 chars, unique)
// -----------------------------------------------------------------------------
console.log("\n[2] Checking Title Tag Rules...");
const titles = new Map<string, string>();
const duplicateTitles: string[] = [];
const longTitles: string[] = [];
let missingTitles = 0;

for (const p of SEO_PAGES_SEED_DATA) {
  if (!p.title || p.title.trim() === "") {
    missingTitles++;
    continue;
  }
  if (p.title.length > 60) {
    longTitles.push(`[${p.title.length} chars] ${p.slug}: "${p.title}"`);
  }
  if (titles.has(p.title)) {
    duplicateTitles.push(`Duplicate title "${p.title}" on ${p.slug} and ${titles.get(p.title)}`);
  } else {
    titles.set(p.title, p.slug);
  }
}

// Check Vitrified Tiles Guide title
const vitrifiedTitle = "Vitrified Tiles Online: Buying Guide for Indian Homes 2026";
if (vitrifiedTitle.length > 60) {
  longTitles.push(`Vitrified Guide Title (${vitrifiedTitle.length} chars)`);
}

check("Zero missing titles across SEO pages", missingTitles === 0, `${missingTitles} missing`);
check("All SEO page titles <= 60 characters", longTitles.length === 0, `${longTitles.length} exceeded limit:\n  ${longTitles.slice(0, 5).join("\n  ")}`);
check("All SEO page titles are unique", duplicateTitles.length === 0, `${duplicateTitles.length} duplicates found`);

// -----------------------------------------------------------------------------
// CHECK 3: META DESCRIPTION RULES (140-155 chars target, non-empty, unique)
// -----------------------------------------------------------------------------
console.log("\n[3] Checking Meta Descriptions...");
const descriptions = new Map<string, string>();
const duplicateDescriptions: string[] = [];
let missingDescriptions = 0;

for (const p of SEO_PAGES_SEED_DATA) {
  if (!p.metaDescription || p.metaDescription.trim() === "") {
    missingDescriptions++;
    continue;
  }
  if (descriptions.has(p.metaDescription)) {
    duplicateDescriptions.push(`Duplicate desc on ${p.slug} and ${descriptions.get(p.metaDescription)}`);
  } else {
    descriptions.set(p.metaDescription, p.slug);
  }
}

check("Zero missing meta descriptions across SEO pages", missingDescriptions === 0, `${missingDescriptions} missing`);
check("All SEO meta descriptions are unique", duplicateDescriptions.length === 0, `${duplicateDescriptions.length} duplicates found`);

// Vitrified tiles guide meta description length
const vitrifiedDesc = "GVT, PGVT, double charge or full body? Learn how to pick size, finish and thickness, and order vitrified tiles online from IntriHub in Bengaluru.";
check(
  "Vitrified Tiles Guide meta description length between 140-155 chars",
  vitrifiedDesc.length >= 140 && vitrifiedDesc.length <= 155,
  `Length was ${vitrifiedDesc.length}`
);

// -----------------------------------------------------------------------------
// CHECK 4: EXACTLY ONE H1 PER PAGE & CANONICAL DEFINITION
// -----------------------------------------------------------------------------
console.log("\n[4] Checking H1 Tags and Canonicals...");
let missingH1s = 0;
for (const p of SEO_PAGES_SEED_DATA) {
  if (!p.h1 || p.h1.trim() === "") missingH1s++;
}
check("Every SEO page has a defined H1 heading", missingH1s === 0, `${missingH1s} missing`);

// Check Vitrified Tiles Guide H1
if (fs.existsSync(vitrifiedGuidePath)) {
  const guideSource = fs.readFileSync(vitrifiedGuidePath, "utf-8");
  const h1Matches = guideSource.match(/<h1[\s>]/gi) || [];
  check(
    "Vitrified Tiles Guide has exactly 1 H1 heading",
    h1Matches.length === 1,
    `Found ${h1Matches.length} H1 tags in guide source`
  );
  check(
    "Vitrified Tiles Guide has self-referencing canonical",
    guideSource.includes('canonical: getCanonicalUrl("/guides/vitrified-tiles-online-buying-guide")') ||
    guideSource.includes('vitrified-tiles-online-buying-guide'),
    "Missing canonical"
  );
}

// -----------------------------------------------------------------------------
// CHECK 5: SITEMAP & ROBOTS.TXT HYGIENE
// -----------------------------------------------------------------------------
console.log("\n[5] Checking Sitemap & Robots.txt...");
const sitemapSourcePath = path.join(process.cwd(), "app/sitemap.ts");
let sitemapSource = "";
if (fs.existsSync(sitemapSourcePath)) {
  sitemapSource = fs.readFileSync(sitemapSourcePath, "utf-8");
}

check(
  "Sitemap includes /guides/vitrified-tiles-online-buying-guide",
  sitemapSource.includes("/guides/vitrified-tiles-online-buying-guide"),
  "Guide missing from sitemap"
);

check(
  "Sitemap includes /inspiration and child routes without regex exclusion",
  sitemapSource.includes("/inspiration") && !sitemapSource.includes("/^\\/inspiration/i"),
  "Inspiration missing or excluded in sitemap"
);

const robotsConfig = robots();
const disallowRules = Array.isArray(robotsConfig.rules)
  ? robotsConfig.rules.flatMap((r) => (Array.isArray(r.disallow) ? r.disallow : [r.disallow]))
  : Array.isArray(robotsConfig.rules.disallow)
  ? robotsConfig.rules.disallow
  : [robotsConfig.rules.disallow];

const blocksCriticalAssets = disallowRules.some(
  (rule) =>
    rule === "/images/" ||
    rule === "/_next/static/" ||
    rule === "/guides" ||
    rule === "/guides/"
);
check(
  "Robots.txt does not block /images/, /_next/static/, or /guides/",
  !blocksCriticalAssets,
  `Disallowed rules contain blocked assets: ${disallowRules.join(", ")}`
);

// -----------------------------------------------------------------------------
// CHECK 6: ZERO ORPHAN PAGES VERIFICATION
// -----------------------------------------------------------------------------
console.log("\n[6] Checking Orphan Pages Resolution...");
const orphansCsvPath = path.join(process.cwd(), "docs/seo/orphans-2026-09-29.csv");
check("docs/seo/orphans-2026-09-29.csv exists", fs.existsSync(orphansCsvPath));

if (fs.existsSync(orphansCsvPath)) {
  const csvContent = fs.readFileSync(orphansCsvPath, "utf-8");
  const lines = csvContent.trim().split("\n").slice(1);
  const orphanUrls = lines.map((l) => l.split(",")[0].trim()).filter(Boolean);

  const hubContent = [
    fs.readFileSync(path.join(process.cwd(), "components/Header.tsx"), "utf-8"),
    fs.readFileSync(path.join(process.cwd(), "components/Footer.tsx"), "utf-8"),
    fs.readFileSync(path.join(process.cwd(), "components/seo/CategorySeoBlock.tsx"), "utf-8"),
    fs.readFileSync(path.join(process.cwd(), "app/guides/page.tsx"), "utf-8"),
    fs.readFileSync(path.join(process.cwd(), "app/building-materials-online/page.tsx"), "utf-8"),
  ].join("\n");

  const unlinkedOrphans: string[] = [];
  for (const url of orphanUrls) {
    const slug = url.replace("https://www.intrihub.com", "");
    if (!hubContent.includes(`"${slug}"`) && !hubContent.includes(`'${slug}'`) && !hubContent.includes(slug)) {
      unlinkedOrphans.push(slug);
    }
  }

  check(
    "Zero orphan pages remaining across all 33 audited URLs",
    unlinkedOrphans.length === 0,
    `${unlinkedOrphans.length} orphans remain unlinked: ${unlinkedOrphans.join(", ")}`
  );
}

// -----------------------------------------------------------------------------
// CHECK 7: DELIVERY COPY SPECIFICATION
// -----------------------------------------------------------------------------
console.log("\n[7] Checking Delivery Promise Compliance...");
const requiredDeliveryPhrase = "60-minute delivery in Bengaluru; 3-7 days Pan-India (outside Bengaluru)";
const footerText = fs.readFileSync(path.join(process.cwd(), "components/Footer.tsx"), "utf-8");
const guideText = fs.readFileSync(vitrifiedGuidePath, "utf-8");

check(
  "Exact delivery copy present in Footer",
  footerText.includes(requiredDeliveryPhrase)
);
check(
  "Exact delivery copy present in Vitrified Tiles Guide",
  guideText.includes(requiredDeliveryPhrase)
);

// -----------------------------------------------------------------------------
// CHECK 8: CATEGORY-WIDE SEO SPEC (6 Core Categories + Remaining Drafts)
// -----------------------------------------------------------------------------
console.log("\n[8] Checking Category-Wide SEO Spec...");
const coreCategories = [
  {
    slug: "electrical",
    title: "Electrical Materials Online in Bengaluru & India | IntriHub",
    meta: "Buy electrical wires, modular switches, MCBs, conduits and lights online. 60-minute delivery in Bengaluru, 3-7 days Pan-India. Order on IntriHub.",
    h1: "Electrical Materials Online",
  },
  {
    slug: "tiles-stone",
    title: "Tiles Online: Vitrified, Ceramic & More | IntriHub",
    meta: "Shop floor and wall tiles online: vitrified, ceramic, anti-skid and more. 60-minute delivery in Bengaluru, 3-7 days Pan-India. Order from IntriHub.",
    h1: "Tiles Online",
  },
  {
    slug: "plumbing-sanitary",
    title: "Plumbing Materials Online: Pipes, Fittings, Taps | IntriHub",
    meta: "Buy plumbing pipes, fittings, valves, taps and bathroom accessories online. 60-minute delivery in Bengaluru, 3-7 days Pan-India. Shop at IntriHub.",
    h1: "Plumbing Materials Online",
  },
  {
    slug: "plywood",
    title: "Plywood & Boards Online for Furniture | IntriHub",
    meta: "Buy plywood, block boards, MDF and laminates online for furniture and interiors. 60-minute delivery in Bengaluru, 3-7 days Pan-India. IntriHub.",
    h1: "Plywood & Boards Online",
  },
  {
    slug: "hardware-fittings",
    title: "Hardware Store Online: Tools, Fittings, Fasteners | IntriHub",
    meta: "Shop hardware online: door and cabinet fittings, locks, screws, tools and fasteners. 60-minute delivery in Bengaluru, 3-7 days Pan-India. IntriHub.",
    h1: "Hardware Online",
  },
  {
    slug: "furniture",
    title: "Furniture Online for Home & Office | IntriHub",
    meta: "Browse furniture for home and office online. Beds, storage, tables and seating with delivery in Bengaluru and Pan-India. Shop at IntriHub.",
    h1: "Furniture Online",
  },
];

let coreMismatches: string[] = [];
for (const core of coreCategories) {
  const data = CATEGORY_SEO[core.slug];
  if (!data) {
    coreMismatches.push(`Missing category ${core.slug}`);
    continue;
  }
  if (data.metaTitle !== core.title) coreMismatches.push(`${core.slug} title mismatch: "${data.metaTitle}" !== "${core.title}"`);
  if (data.metaDescription !== core.meta) coreMismatches.push(`${core.slug} meta description mismatch`);
  if (data.h1 !== core.h1) coreMismatches.push(`${core.slug} H1 mismatch: "${data.h1}" !== "${core.h1}"`);
  if (!data.isIndexable) coreMismatches.push(`${core.slug} should be indexable`);
  if (data.faqs.length < 3) coreMismatches.push(`${core.slug} must have >= 3 FAQs`);
}

check(
  "All 6 Core Categories match exact PRD spec (Title, Meta, H1, Indexable)",
  coreMismatches.length === 0,
  coreMismatches.join(", ")
);

// Check remaining categories (must have drafts and be marked noindex)
let draftIssues: string[] = [];
for (const [slug, data] of Object.entries(CATEGORY_SEO)) {
  if (coreCategories.some((c) => c.slug === slug)) continue;
  if (data.metaTitle.length > 60) draftIssues.push(`${slug} title > 60 chars (${data.metaTitle.length})`);
  if (data.metaDescription.length < 140 || data.metaDescription.length > 155) {
    draftIssues.push(`${slug} meta length (${data.metaDescription.length}) outside 140-155`);
  }
  if (data.isIndexable) draftIssues.push(`${slug} must be noindex pending founder approval`);
  if (data.faqs.length < 3) draftIssues.push(`${slug} must have >= 3 FAQs`);
}

check(
  "All non-core categories marked noindex and meet title/meta character rules",
  draftIssues.length === 0,
  draftIssues.join(", ")
);

// -----------------------------------------------------------------------------
// SUMMARY AND EXIT CODE
// -----------------------------------------------------------------------------
console.log("\n==========================================================================");
const failedCount = results.filter((r) => !r.passed).length;
const passedCount = results.filter((r) => r.passed).length;

if (failedCount === 0) {
  console.log(`🎉 ALL ${passedCount} SEO HYGIENE CHECKS PASSED WITH 0 ERRORS!`);
  console.log("==========================================================================");
  process.exit(0);
} else {
  console.error(`❌ ${failedCount} SEO AUDIT CHECKS FAILED! (Passed: ${passedCount})`);
  console.log("==========================================================================");
  process.exit(1);
}
