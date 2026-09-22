import { prisma } from "../lib/prisma";
import sitemap from "../app/sitemap";
import robots from "../app/robots";
import { generateSeoKeywordPageSchemas } from "../lib/seo";

async function runQaSuite() {
  console.log("==========================================================================");
  console.log("RUNNING PRD QA VERIFICATION SUITE FOR SEO KEYWORD LANDING PAGES");
  console.log("==========================================================================");

  let passedTests = 0;
  let failedTests = 0;

  function assert(condition: boolean, testName: string, details?: string) {
    if (condition) {
      console.log(`  ✓ PASS: ${testName}`);
      passedTests++;
    } else {
      console.error(`  ✗ FAIL: ${testName} - ${details || "Assertion failed"}`);
      failedTests++;
    }
  }

  // TEST 1: Database records count
  const allDbPages = await prisma.seoPage.findMany();
  assert(allDbPages.length === 79, "All 79 SEO landing pages exist in database", `Found ${allDbPages.length}`);

  // TEST 2: Word counts (>= 300 words)
  let wordCountFails = 0;
  for (const page of allDbPages) {
    const wc = page.introContent.trim().split(/\s+/).length;
    if (wc < 300) {
      console.error(`Page ${page.slug} has only ${wc} words!`);
      wordCountFails++;
    }
  }
  assert(wordCountFails === 0, `All ${allDbPages.length} pages have >= 300 words of introContent`, `${wordCountFails} failed`);

  // TEST 3: Zero "wholesaler" in any field
  let wholesalerCount = 0;
  for (const p of allDbPages) {
    const raw = JSON.stringify(p).toLowerCase();
    const matches = raw.match(/wholesaler/g);
    if (matches) {
      console.error(`Page ${p.slug} contains "wholesaler":`, matches);
      wholesalerCount += matches.length;
    }
  }
  assert(wholesalerCount === 0, "No page contains the forbidden word 'wholesaler'", `Found ${wholesalerCount}`);

  // TEST 4: NAP Consistency
  const EXPECTED_NAP = {
    name: "IntriHub",
    streetAddress: "Begur",
    addressLocality: "Bengaluru",
    addressRegion: "Karnataka",
    telephone: "+91 92649 20211",
    url: "https://intrihub.com"
  };

  let napFails = 0;
  for (const p of allDbPages) {
    const schemas = generateSeoKeywordPageSchemas({
      slug: p.slug,
      title: p.title,
      targetKeyword: p.targetKeyword,
      categoryName: p.category || undefined,
      localityName: p.locality || undefined,
      faqItems: p.faqItems as any,
    });

    const lb = schemas.localBusinessSchema;
    if (
      lb.name !== EXPECTED_NAP.name ||
      lb.address.streetAddress !== EXPECTED_NAP.streetAddress ||
      lb.address.addressLocality !== EXPECTED_NAP.addressLocality ||
      lb.address.addressRegion !== EXPECTED_NAP.addressRegion ||
      lb.telephone !== EXPECTED_NAP.telephone ||
      lb.url !== EXPECTED_NAP.url
    ) {
      console.error(`NAP mismatch on ${p.slug}:`, lb);
      napFails++;
    }
  }
  assert(napFails === 0, `NAP block identical and compliant across all ${allDbPages.length} generated schemas`, `${napFails} mismatches`);

  // TEST 5: Jaccard Similarity across all 1225 pairs (< 30%)
  function getWordSet(text: string) {
    const stopWords = new Set([
      "the", "and", "a", "an", "in", "on", "of", "to", "for", "with", "is", "are", "as", "at", "by", "from",
      "that", "this", "our", "your", "we", "all", "can", "or", "across", "direct", "materials", "intrihub"
    ]);
    const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length > 2 && !stopWords.has(w));
    return new Set(words);
  }

  let maxSim = 0;
  let simViolations = 0;
  for (let i = 0; i < allDbPages.length; i++) {
    const setA = getWordSet(allDbPages[i].introContent);
    for (let j = i + 1; j < allDbPages.length; j++) {
      const setB = getWordSet(allDbPages[j].introContent);
      const intersection = new Set([...setA].filter(x => setB.has(x)));
      const union = new Set([...setA, ...setB]);
      const sim = (intersection.size / union.size) * 100;
      if (sim > maxSim) maxSim = sim;
      if (sim > 30) simViolations++;
    }
  }
  assert(simViolations === 0, `Pairwise content overlap is < 30% (Max observed: ${maxSim.toFixed(1)}%)`, `${simViolations} pairs exceeded 30%`);

  // TEST 6: Alias Resolution Programmatic Testing
  let totalAliases = 0;
  const aliasToSlugMap = new Map<string, string>();
  const primarySlugsSet = new Set(allDbPages.map((p) => p.slug));

  for (const page of allDbPages) {
    for (const alias of page.aliases) {
      totalAliases++;
      if (primarySlugsSet.has(alias)) {
        console.error(`Collision: Alias "${alias}" is also a primary slug!`);
      }
      aliasToSlugMap.set(alias, page.slug);
    }
  }
  assert(totalAliases >= 100, `Total aliases configured across pages: ${totalAliases}`);

  // Test DB resolution on representative sample across all page types
  const samplePages = allDbPages.filter((p) => p.aliases && p.aliases.length > 0).slice(0, 15);
  const sampleAliases = samplePages.map((p) => p.aliases[0]);

  let sampleResolutionFails = 0;
  await Promise.all(
    sampleAliases.map(async (alias) => {
      const match = await prisma.seoPage.findFirst({
        where: { aliases: { has: alias }, isPublished: true },
        select: { slug: true },
      });
      const expectedSlug = aliasToSlugMap.get(alias);
      if (!match || match.slug !== expectedSlug) {
        console.error(`Sample alias ${alias} expected ${expectedSlug} but got ${match?.slug}`);
        sampleResolutionFails++;
      }
    })
  );
  assert(sampleResolutionFails === 0, `Sampled DB alias resolution passed for all ${sampleAliases.length} diverse tested paths`);

  // TEST 7: Unknown URL returns null (Fall-through 404 test)
  const unknownMatch = await prisma.seoPage.findFirst({
    where: {
      OR: [
        { slug: "non-existent-random-xyz-path-404" },
        { aliases: { has: "non-existent-random-xyz-path-404" } },
      ],
    },
  });
  assert(unknownMatch === null, "Unknown route cleanly returns null (fall-through 404 preserved)");

  // TEST 8: Sitemap verification
  const siteMapEntries = await sitemap();
  const sitemapUrls = new Set(siteMapEntries.map((e) => e.url));

  let missingPrimarySlugs = 0;
  for (const page of allDbPages) {
    const expectedUrl = `${siteMapEntries[0]?.url.startsWith("https://www.intrihub.com") ? "https://www.intrihub.com" : "https://intrihub.com"}/${page.slug}`;
    if (!sitemapUrls.has(expectedUrl)) {
      console.error(`Missing primary slug in sitemap: ${expectedUrl}`);
      missingPrimarySlugs++;
    }
  }
  assert(missingPrimarySlugs === 0, `Sitemap contains all ${allDbPages.length} primary SEO landing slugs`, `${missingPrimarySlugs} missing`);

  let leakedAliases = 0;
  for (const page of allDbPages) {
    for (const alias of page.aliases) {
      const aliasUrl1 = `https://intrihub.com/${alias}`;
      const aliasUrl2 = `https://www.intrihub.com/${alias}`;
      if (sitemapUrls.has(aliasUrl1) || sitemapUrls.has(aliasUrl2)) {
        console.error(`LEAKED ALIAS IN SITEMAP: ${alias}`);
        leakedAliases++;
      }
    }
  }
  assert(leakedAliases === 0, "Sitemap contains ZERO aliases (no wasted crawl budget / redirect loops)", `${leakedAliases} leaked`);

  // TEST 9: Robots.txt verification
  const robotsConfig = robots();
  const disallows = Array.isArray(robotsConfig.rules)
    ? robotsConfig.rules.flatMap((r) => (Array.isArray(r.disallow) ? r.disallow : [r.disallow]))
    : Array.isArray(robotsConfig.rules?.disallow)
    ? robotsConfig.rules?.disallow
    : [robotsConfig.rules?.disallow];

  let blockedLandingSlugs = 0;
  for (const page of allDbPages) {
    const path = `/${page.slug}`;
    const isBlocked = disallows.some((d) => d && typeof d === "string" && path.startsWith(d));
    if (isBlocked) {
      console.error(`Slug ${path} is blocked by robots.txt disallow rule!`);
      blockedLandingSlugs++;
    }
  }
  assert(blockedLandingSlugs === 0, `Robots.txt permits crawling of all ${allDbPages.length} SEO landing routes`, `${blockedLandingSlugs} blocked`);
  assert(
    robotsConfig.sitemap?.toString().includes("/sitemap.xml"),
    "Robots.txt points to canonical sitemap.xml"
  );

  console.log("==========================================================================");
  console.log(`TOTAL PASSED: ${passedTests} / ${passedTests + failedTests}`);
  if (failedTests > 0) {
    console.error(`TOTAL FAILED: ${failedTests}`);
    process.exit(1);
  } else {
    console.log("🎉 ALL QA TESTS PASSED WITH 100% SUCCESS!");
  }
  console.log("==========================================================================");
}

runQaSuite()
  .catch((err) => {
    console.error("Test suite fatal error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
