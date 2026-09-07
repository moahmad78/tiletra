import { prisma } from "../lib/prisma";

async function cleanupStaleGscRedirects() {
  console.log("==========================================================================");
  console.log("CLEANING STALE GSC REDIRECTS FOR LIVE CANONICAL PRODUCTS");
  console.log("==========================================================================\n");

  const liveProductPaths = [
    "/product/solid-pine-wood-core-flush-door-7x3",
    "/product/moroccan-heritage-pattern-kitchen",
  ];

  for (const p of liveProductPaths) {
    await prisma.redirect.deleteMany({
      where: { fromPath: p },
    });
    console.log(`✓ Removed stale redirect (if any) for live product: ${p}`);
  }

  console.log("\n==========================================================================");
  console.log("🎉 REDIRECT TABLE CLEAN & SYNCHRONIZED FOR LIVE PRODUCTS! ✓");
  console.log("==========================================================================");
}

cleanupStaleGscRedirects()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
