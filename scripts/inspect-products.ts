import { prisma } from "../lib/prisma";

async function cleanupTestProducts() {
  console.log("==========================================");
  console.log("TASK 1: PERMANENT DEMO/TEST PRODUCT CLEANUP");
  console.log("==========================================");

  const beforeProducts = await prisma.product.findMany({
    select: { id: true, name: true, slug: true, vendorId: true },
  });
  console.log(`Total Products Before Cleanup: ${beforeProducts.length}`);

  // Test products to delete
  const testSlugs = [
    "test-marble-tile-1786797496480",
  ];

  // Also any test products matching "test" or created during test suite
  const testProducts = await prisma.product.findMany({
    where: {
      OR: [
        { slug: { in: testSlugs } },
        { name: { contains: "Automated Test" } },
        { slug: { startsWith: "schneider-switch-pack-" } },
        { slug: { startsWith: "brass-door-handles-lock-" } },
      ],
    },
    include: { variants: true, attributes: true, orderItems: true },
  });

  console.log(`Found ${testProducts.length} test product(s) to remove:`);
  for (const p of testProducts) {
    console.log(`- "${p.name}" (ID: ${p.id}, Slug: ${p.slug})`);
  }

  const testProductIds = testProducts.map((p) => p.id);

  if (testProductIds.length > 0) {
    // Delete linked order items, variants, attributes, and products
    await prisma.cartItem.deleteMany({ where: { productId: { in: testProductIds } } });
    await prisma.orderItem.deleteMany({ where: { productId: { in: testProductIds } } });
    await prisma.productAttribute.deleteMany({ where: { productId: { in: testProductIds } } });
    await prisma.productVariant.deleteMany({ where: { productId: { in: testProductIds } } });
    const res = await prisma.product.deleteMany({ where: { id: { in: testProductIds } } });
    console.log(`\n✓ Deleted ${res.count} test product row(s) and their linked records.`);
  }

  // Verify remaining real products
  const remaining = await prisma.product.findMany({
    include: { vendor: true },
    orderBy: { createdAt: "asc" },
  });

  console.log("\n==========================================");
  console.log(`REMAINING REAL CATALOG PRODUCTS (${remaining.length} ITEMS):`);
  console.log("==========================================");
  remaining.forEach((p, idx) => {
    console.log(`${idx + 1}. "${p.name}" (Category: ${p.categoryName || p.categorySlug}, Price: ₹${p.pricePerSqft})`);
  });
}

cleanupTestProducts()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
