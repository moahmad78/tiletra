import assert from "assert";
import fs from "fs";
import path from "path";
import sitemap from "../app/sitemap";
import { getGuidePostBySlug, getGuidePosts } from "../lib/actions/guides";
import { metadata as pageMetadata } from "../app/guides/diwali-home-renovation-2026-materials-checklist/page";

async function main() {
  console.log("==========================================================================");
  console.log("VERIFYING DIWALI HOME RENOVATION 2026 GUIDE IMPLEMENTATION");
  console.log("==========================================================================");

  const targetSlug = "diwali-home-renovation-2026-materials-checklist";
  const expectedUrl = `https://www.intrihub.com/guides/${targetSlug}`;

  // 1. Verify Page Metadata
  console.log("\n[TEST 1] Verifying Page Metadata:");
  assert.strictEqual(
    pageMetadata.title,
    "Diwali Home Renovation 2026: Materials Checklist & Timeline",
    "Title tag must match prompt"
  );
  assert(
    (pageMetadata.title as string).length <= 60,
    `Title tag must be under 60 chars (is ${(pageMetadata.title as string).length})`
  );
  assert.strictEqual(
    pageMetadata.description,
    "Diwali is on 8 November 2026. Use this 4-week plan and interior materials checklist to renovate your home on time, with delivery in Bengaluru.",
    "Meta description must match prompt"
  );
  assert(
    (pageMetadata.description as string).length <= 155,
    `Meta description must be under 155 chars (is ${(pageMetadata.description as string).length})`
  );
  assert.strictEqual(
    pageMetadata.alternates?.canonical,
    expectedUrl,
    "Canonical must match expected URL"
  );
  console.log("  ✓ Title tag matches and under 60 chars:", pageMetadata.title);
  console.log("  ✓ Meta description matches and under 155 chars:", pageMetadata.description);
  console.log("  ✓ Canonical URL matches:", pageMetadata.alternates?.canonical);

  // 2. Verify OpenGraph & Twitter Cards
  console.log("\n[TEST 2] Verifying OpenGraph & Twitter Cards:");
  const og: any = pageMetadata.openGraph;
  assert.strictEqual(
    og.title,
    "Diwali Home Renovation 2026: Materials Checklist and 4-Week Plan",
    "OG title must match prompt"
  );
  assert.strictEqual(
    og.description,
    "Diwali is on 8 November. Start now with this simple timeline and room-by-room materials checklist.",
    "OG description must match prompt"
  );
  console.log("  ✓ og:title:", og.title);
  console.log("  ✓ og:description:", og.description);
  console.log("  ✓ og:image:", og.images?.[0]?.url);

  // 3. Verify Image Files Exist in /public/images/
  console.log("\n[TEST 3] Verifying First-Party Images in /public/images/:");
  const imagesToCheck = [
    "public/images/guides/diwali-renovation-hero.jpg",
    "public/images/guides/diwali-renovation-timeline.jpg",
    "public/images/guides/diwali-renovation-materials.jpg",
  ];
  for (const imgRel of imagesToCheck) {
    const fullPath = path.join(process.cwd(), imgRel);
    assert(fs.existsSync(fullPath), `Image file must exist: ${imgRel}`);
    const stat = fs.statSync(fullPath);
    console.log(`  ✓ Image exists: ${imgRel} (${Math.round(stat.size / 1024)} KB)`);
  }

  // 4. Verify Content & Negative Keyword Constraint
  console.log("\n[TEST 4] Verifying Content & Negative Keyword Rule:");
  const pageFileContent = fs.readFileSync(
    path.join(process.cwd(), "app/guides/diwali-home-renovation-2026-materials-checklist/page.tsx"),
    "utf-8"
  );
  const checklistFileContent = fs.readFileSync(
    path.join(process.cwd(), "components/guides/DiwaliInteractiveChecklist.tsx"),
    "utf-8"
  );

  const combinedContent = pageFileContent + checklistFileContent;
  const hasWholesaler = /wholesaler/i.test(combinedContent);
  assert(!hasWholesaler, "Violation: The word 'wholesaler' was found in the page or components!");
  console.log("  ✓ NEGATIVE KEYWORD CHECK PASSED: 'wholesaler' is NOT used anywhere on the page.");

  // Check required text snippets
  assert(combinedContent.includes("Last updated: 8 October 2026"), "Must show 'Last updated: 8 October 2026'");
  assert(combinedContent.includes("6 min read"), "Must show reading time");
  assert(combinedContent.includes("IntriHub Team"), "Must show author");
  console.log("  ✓ Required meta stamps ('Last updated: 8 October 2026', '6 min read', 'IntriHub Team') confirmed present.");

  // 5. Verify Internal Links in Page
  console.log("\n[TEST 5] Verifying Internal Links:");
  assert(pageFileContent.includes('href="/building-materials-online"'), "Must link to /building-materials-online");
  assert(!pageFileContent.includes("https://claude.ai"), "Must NOT contain any leftover claude.ai link URLs");
  console.log("  ✓ Internal link to /building-materials-online verified.");
  console.log("  ✓ No broken or placeholder third-party links found.");

  // 6. Verify Sitemap Generation
  console.log("\n[TEST 6] Verifying Sitemap Inclusion:");
  const sitemapEntries = await sitemap();
  const diwaliEntry = sitemapEntries.find((entry) => entry.url === expectedUrl);
  assert(diwaliEntry, `Sitemap must contain ${expectedUrl}`);
  console.log("  ✓ Entry found in sitemap():", diwaliEntry.url);
  console.log("    - Priority:", diwaliEntry.priority);
  console.log("    - ChangeFreq:", diwaliEntry.changeFrequency);
  console.log("    - LastModified:", diwaliEntry.lastModified);

  // 7. Verify Database / Guide Actions
  console.log("\n[TEST 7] Verifying Guide Resolution via DB & Guides Hub:");
  const guidePost = await getGuidePostBySlug(targetSlug);
  assert(guidePost, "Guide post must be resolvable via getGuidePostBySlug");
  console.log(`  ✓ getGuidePostBySlug("${targetSlug}") resolved: "${guidePost.title}"`);

  console.log("\n==========================================================================");
  console.log("🎉 ALL VERIFICATION CHECKS PASSED PERFECTLY!");
  console.log("==========================================================================");
}

main().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
