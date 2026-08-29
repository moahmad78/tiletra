import { prisma } from "../lib/prisma";
import {
  getProductBySlug,
  deleteProduct,
  softDeleteProduct,
  hardDeleteProduct,
} from "../lib/actions/products";
import { getRedirectForPath, createRedirect, normalizePath } from "../lib/redirects";
import sitemap from "../app/sitemap";
import robots from "../app/robots";

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ Assertion Failed: ${msg}`);
    process.exit(1);
  }
  console.log(`  ✓ ${msg}`);
}

async function runAutomatedSeoHealthTests() {
  console.log("==========================================================================");
  console.log("INTRIHUB AUTOMATED SEO HEALTH SYSTEM TEST SUITE");
  console.log("==========================================================================\n");

  const testSlugSoft = `test-soft-del-tile-${Date.now()}`;
  const testSlugHard = `test-hard-del-door-${Date.now()}`;

  try {
    // ─────────────────────────────────────────────────────────────────────────────
    // 1. SOFT DELETE TEST (PRD Section 4.1)
    // ─────────────────────────────────────────────────────────────────────────────
    console.log("[TEST 1] Product Soft-Delete & Lifecycle Behavior (Section 4.1):");
    
    // Create test product
    const productSoft = await prisma.product.create({
      data: {
        name: "Test Soft Delete Tile",
        slug: testSlugSoft,
        categorySlug: "floor-tiles",
        categoryName: "Floor Tiles",
        description: "Test tile for soft delete verification.",
        material: "Vitrified",
        pricePerSqft: 55,
        status: "active",
        approvalStatus: "approved",
      },
    });

    assert(productSoft.status === "active", "Created product with active status");

    // Perform default admin delete (which must soft-delete)
    const softDelRes = await deleteProduct(productSoft.id);
    assert(softDelRes.success === true, "deleteProduct returned success");

    const refreshedSoft = await prisma.product.findUnique({ where: { id: productSoft.id } });
    assert(refreshedSoft?.status === "discontinued", "Product status updated to 'discontinued' (NOT purged from DB)");

    // Verify getProductBySlug resolves discontinued product with 200 payload
    const resolvedProduct = await getProductBySlug(testSlugSoft);
    assert(resolvedProduct !== null, "getProductBySlug resolves discontinued product (No 404)");
    assert(resolvedProduct?.status === "discontinued", "Resolved product carries status: 'discontinued'");

    // ─────────────────────────────────────────────────────────────────────────────
    // 2. HARD DELETE WITH AUTO-REDIRECT (PRD Section 4.2 & 4.3)
    // ─────────────────────────────────────────────────────────────────────────────
    console.log("\n[TEST 2] Product Hard Delete Auto-Redirect Generation (Section 4.2):");

    const productHard = await prisma.product.create({
      data: {
        name: "Test Hard Delete Door",
        slug: testSlugHard,
        categorySlug: "doors-windows",
        categoryName: "Doors & Windows",
        description: "Test door for hard delete redirect test.",
        material: "Wood",
        pricePerSqft: 120,
        status: "active",
        approvalStatus: "approved",
      },
    });

    // Perform hard delete
    const hardDelRes = await deleteProduct(productHard.id, { hardDelete: true });
    assert(hardDelRes.success === true, "deleteProduct({ hardDelete: true }) executed successfully");

    const purgedRecord = await prisma.product.findUnique({ where: { id: productHard.id } });
    assert(purgedRecord === null, "Product is completely purged from Product table");

    // Verify 301 redirect was automatically inserted into Redirect table
    const redirectRecord = await getRedirectForPath(`/product/${testSlugHard}`);
    assert(redirectRecord !== null, "Automatic 301 redirect exists in Redirects table");
    assert(redirectRecord?.toPath === "/shop/doors-windows", "Redirect points to product's category: /shop/doors-windows");
    assert(redirectRecord?.statusCode === 301, "Redirect statusCode is 301 Permanent");

    // ─────────────────────────────────────────────────────────────────────────────
    // 3. KNOWN GSC 404s RESOLUTION (PRD Section 6, Task 10)
    // ─────────────────────────────────────────────────────────────────────────────
    console.log("\n[TEST 3] Known GSC 404s Automated Resolution (Section 6, Task 10):");

    const gscRedirect1 = await getRedirectForPath("/product/solid-pine-wood-core-flush-door-7x3");
    assert(gscRedirect1 !== null && gscRedirect1.toPath === "/shop/doors-windows", "/product/solid-pine-wood-core-flush-door-7x3 -> /shop/doors-windows (301)");

    const gscRedirect2 = await getRedirectForPath("/product/moroccan-heritage-pattern-kitchen");
    assert(gscRedirect2 !== null && gscRedirect2.toPath === "/shop/wall-surface", "/product/moroccan-heritage-pattern-kitchen -> /shop/wall-surface (301)");

    // ─────────────────────────────────────────────────────────────────────────────
    // 4. DYNAMIC SITEMAP EXCLUSION OF DISCONTINUED PRODUCTS (PRD Section 4.5)
    // ─────────────────────────────────────────────────────────────────────────────
    console.log("\n[TEST 4] Dynamic Sitemap Behavior (Section 4.5):");

    const sitemapEntries = await sitemap();
    assert(Array.isArray(sitemapEntries) && sitemapEntries.length > 0, "Sitemap returns array of URL entries");

    const sitemapUrls = sitemapEntries.map((e) => e.url);
    assert(
      !sitemapUrls.some((u) => u.includes(testSlugSoft)),
      "CRITICAL: Discontinued products are automatically excluded from sitemap.xml"
    );
    assert(
      !sitemapUrls.some((u) => u.includes(testSlugHard)),
      "CRITICAL: Hard-deleted products are excluded from sitemap.xml"
    );
    assert(
      sitemapUrls.some((u) => u.includes("/about")) && sitemapUrls.some((u) => u.includes("/contact")),
      "Sitemap includes key entity pages (/about, /contact)"
    );

    // ─────────────────────────────────────────────────────────────────────────────
    // 5. ROBOTS.TXT AUDIT (PRD Section 4.6)
    // ─────────────────────────────────────────────────────────────────────────────
    console.log("\n[TEST 5] robots.txt Rules Verification (Section 4.6):");
    const robotsConfig = robots();
    const disallows = Array.isArray(robotsConfig.rules)
      ? robotsConfig.rules.flatMap((r) => r.disallow || [])
      : (robotsConfig.rules as any).disallow || [];

    assert(!disallows.includes("/product/"), "robots.txt allows /product/ routes");
    assert(!disallows.includes("/shop/"), "robots.txt allows /shop/ routes");
    assert(disallows.includes("/admin/"), "robots.txt protects /admin/");
    assert(disallows.includes("/api/"), "robots.txt protects /api/");
    assert(Boolean(robotsConfig.sitemap), "robots.txt declares Sitemap directive");

    // Clean up test soft-deleted product
    await prisma.product.deleteMany({ where: { slug: testSlugSoft } });
    await prisma.redirect.deleteMany({ where: { fromPath: `/product/${testSlugHard}` } });

    console.log("\n==========================================================================");
    console.log("🎉 ALL AUTOMATED SEO HEALTH TESTS PASSED (100% SUCCESS)! ✓");
    console.log("==========================================================================");
  } catch (error) {
    console.error("Test execution error:", error);
    // Cleanup on failure
    await prisma.product.deleteMany({ where: { slug: { in: [testSlugSoft, testSlugHard] } } });
    await prisma.redirect.deleteMany({ where: { fromPath: { in: [`/product/${testSlugSoft}`, `/product/${testSlugHard}`] } } });
    process.exit(1);
  }
}

runAutomatedSeoHealthTests()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
