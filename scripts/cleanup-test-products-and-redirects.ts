import { prisma } from "../lib/prisma";
import { createRedirect } from "../lib/redirects";

async function main() {
  console.log("==========================================================================");
  console.log("PERMANENT TEST PRODUCT CLEANUP & 301 REDIRECT SYNC");
  console.log("==========================================================================\n");

  // 1. Delete SecTest Ceramic Tile 1788938498982 and any other test products
  const testProducts = await prisma.product.findMany({
    where: {
      OR: [
        { slug: { contains: "test", mode: "insensitive" } },
        { name: { contains: "test", mode: "insensitive" } },
        { slug: { contains: "1786797496480" } },
        { slug: { contains: "1788938498982" } },
      ],
    },
    select: { id: true, name: true, slug: true },
  });

  console.log(`Found ${testProducts.length} leftover test product(s) in DB:`);
  for (const p of testProducts) {
    console.log(`  - [${p.id}] ${p.name} (slug: ${p.slug})`);
  }

  const testIds = testProducts.map((p) => p.id);
  if (testIds.length > 0) {
    await prisma.cartItem.deleteMany({ where: { productId: { in: testIds } } });
    await prisma.orderItem.deleteMany({ where: { productId: { in: testIds } } });
    await prisma.review.deleteMany({ where: { productId: { in: testIds } } });
    await prisma.recentlyViewed.deleteMany({ where: { productId: { in: testIds } } });
    await prisma.productAttribute.deleteMany({ where: { productId: { in: testIds } } });
    await prisma.productVariant.deleteMany({ where: { productId: { in: testIds } } });
    const res = await prisma.product.deleteMany({ where: { id: { in: testIds } } });
    console.log(`✓ Successfully purged ${res.count} test product(s) and all linked records from PostgreSQL DB.\n`);
  }

  // 2. Set up Permanent 301 Redirects for GSC reported 404s and cleaned test products
  const redirectsToSync = [
    { from: "/product/test-marble-tile-1786797496480", to: "/shop/tiles-stone" },
    { from: "/product/sectest-tile-1788938498982", to: "/shop/tiles-stone" },
    { from: "/shop/outdoor-tiles", to: "/shop/tiles-stone" },
    { from: "/inspiration", to: "/shop" },
    { from: "/designs", to: "/shop" },
  ];

  console.log("Syncing 301 Permanent Redirects into DB Redirect table:");
  for (const r of redirectsToSync) {
    const record = await createRedirect(r.from, r.to, 301);
    console.log(`  ✓ 301: ${r.from} -> ${r.to}`);
  }

  // 3. Verify total redirects in DB
  const totalRedirects = await prisma.redirect.count();
  console.log(`\nTotal registered 301 redirects in database: ${totalRedirects}`);

  // 4. Verify no test products remain
  const remainingTestProducts = await prisma.product.count({
    where: {
      OR: [
        { slug: { contains: "test", mode: "insensitive" } },
        { name: { contains: "test", mode: "insensitive" } },
      ],
    },
  });
  console.log(`Remaining test products in DB: ${remainingTestProducts} (TARGET: 0)`);

  console.log("\n==========================================================================");
  console.log("🎉 DATABASE PURGE & REDIRECT SYNC COMPLETED SUCCESSFULLY!");
  console.log("==========================================================================");
}

main()
  .catch((e) => {
    console.error("Cleanup error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
