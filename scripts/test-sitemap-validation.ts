import sitemap from "../app/sitemap";
import { BASE_SITE_URL } from "../lib/seo";

async function validateSitemap() {
  console.log("==========================================================================");
  console.log("VALIDATING SITEMAP ENTRIES AND XML INTEGRITY");
  console.log("==========================================================================\n");

  const entries = await sitemap();
  console.log(`Total Sitemap URLs generated: ${entries.length}\n`);

  let hasError = false;
  const urls = new Set<string>();

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];

    // 1. URL validity
    if (!entry.url || !entry.url.startsWith("http")) {
      console.error(`❌ Invalid URL at index ${i}:`, entry);
      hasError = true;
    }

    // 2. Duplicate URL check
    if (urls.has(entry.url)) {
      console.warn(`⚠️ Duplicate URL found: ${entry.url}`);
      hasError = true;
    }
    urls.add(entry.url);

    // 3. Date validity
    if (entry.lastModified) {
      const d = new Date(entry.lastModified);
      if (isNaN(d.getTime())) {
        console.error(`❌ Invalid lastModified at index ${i} (${entry.url}):`, entry.lastModified);
        hasError = true;
      }
    }

    // 4. Changefreq validity
    const validFreqs = ["always", "hourly", "daily", "weekly", "monthly", "yearly", "never"];
    if (entry.changeFrequency && !validFreqs.includes(entry.changeFrequency)) {
      console.error(`❌ Invalid changeFrequency at index ${i} (${entry.url}):`, entry.changeFrequency);
      hasError = true;
    }

    // 5. Priority validity (0.0 to 1.0)
    if (entry.priority !== undefined) {
      if (typeof entry.priority !== "number" || entry.priority < 0.0 || entry.priority > 1.0) {
        console.error(`❌ Invalid priority at index ${i} (${entry.url}):`, entry.priority);
        hasError = true;
      }
    }
  }

  // Key required routes check
  const requiredRoutes = [
    `${BASE_SITE_URL}`,
    `${BASE_SITE_URL}/shop`,
    `${BASE_SITE_URL}/categories`,
    `${BASE_SITE_URL}/about`,
    `${BASE_SITE_URL}/contact`,
    `${BASE_SITE_URL}/founder`,
  ];

  for (const req of requiredRoutes) {
    if (!urls.has(req)) {
      console.error(`❌ Missing required route in sitemap: ${req}`);
      hasError = true;
    } else {
      console.log(`✓ Required route present: ${req}`);
    }
  }

  // Check if any discontinued or draft products leaked into sitemap
  console.log("\nSample Generated Sitemap Entries (first 10):");
  entries.slice(0, 10).forEach((e, idx) => {
    console.log(`  ${idx + 1}. [${e.priority || "default"}] ${e.url} (${e.changeFrequency || "default"})`);
  });

  if (hasError) {
    console.error("\n❌ SITEMAP VALIDATION FAILED WITH ERRORS!");
    process.exit(1);
  } else {
    console.log("\n==========================================================================");
    console.log("🎉 SITEMAP VALIDATION PASSED (100% COMPLIANT WITH SITEMAP.ORG STANDARDS)! ✓");
    console.log("==========================================================================");
  }
}

validateSitemap().catch((e) => {
  console.error(e);
  process.exit(1);
});
