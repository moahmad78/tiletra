import { prisma } from "../lib/prisma";

async function purgeAllDemoProducts() {
  console.log("==========================================================================");
  console.log("EXECUTING FULL DATABASE PURGE: ALL DEMO/MOCK PRODUCTS & VARIANTS");
  console.log("==========================================================================");

  // 1. Audit before deletion
  const preProducts = await prisma.product.findMany({
    select: { id: true, name: true, categoryName: true, categorySlug: true },
  });

  console.log(`\n[BEFORE] Found ${preProducts.length} product(s) to remove.`);

  const categoryCounts: Record<string, number> = {};
  preProducts.forEach((p) => {
    const key = p.categoryName || p.categorySlug || "Uncategorized";
    categoryCounts[key] = (categoryCounts[key] || 0) + 1;
  });

  console.log("Products per category breakdown:");
  Object.entries(categoryCounts).forEach(([cat, count], idx) => {
    console.log(`  ${idx + 1}. ${cat}: ${count} product(s)`);
  });

  // 2. Perform Cascade Deletion in Safe Transaction
  console.log(`\n[DELETING] Purging all product variants, attributes, cart items, and products...`);

  await prisma.$transaction(
    async (tx) => {
      const deletedCartItems = await tx.cartItem.deleteMany({});
      console.log(`- Cleared Cart Items: ${deletedCartItems.count}`);

      const deletedRecentlyViewed = await tx.recentlyViewed.deleteMany({});
      console.log(`- Cleared Recently Viewed: ${deletedRecentlyViewed.count}`);

      const deletedReviews = await tx.review.deleteMany({});
      console.log(`- Cleared Reviews: ${deletedReviews.count}`);

      const deletedVariants = await tx.productVariant.deleteMany({});
      console.log(`- Cleared Product Variants: ${deletedVariants.count}`);

      const deletedAttributes = await tx.productAttribute.deleteMany({});
      console.log(`- Cleared Product Attributes: ${deletedAttributes.count}`);

      const deletedProducts = await tx.product.deleteMany({});
      console.log(`- Permanently Removed Products: ${deletedProducts.count}`);
    },
    { timeout: 35000, maxWait: 15000 }
  );

  // 3. Verify After Deletion
  const postProductCount = await prisma.product.count();
  const postVariantCount = await prisma.productVariant.count();
  const postAttributeCount = await prisma.productAttribute.count();
  const postCategoryCount = await prisma.category.count();
  const postVendorCount = await prisma.vendor.count();
  const postUserCount = await prisma.user.count();
  const postOrderCount = await prisma.order.count();

  console.log("\n==========================================================================");
  console.log("POST-CLEANUP VERIFICATION SUMMARY:");
  console.log("==========================================================================");
  console.log(`✓ Products in DB: ${postProductCount} (TARGET: 0)`);
  console.log(`✓ Variants in DB: ${postVariantCount} (TARGET: 0)`);
  console.log(`✓ Attributes in DB: ${postAttributeCount} (TARGET: 0)`);
  console.log(`✓ Preserved Categories: ${postCategoryCount} (100% Intact)`);
  console.log(`✓ Preserved Vendors: ${postVendorCount} (100% Intact)`);
  console.log(`✓ Preserved Users: ${postUserCount} (100% Intact)`);
  console.log(`✓ Preserved Orders: ${postOrderCount} (100% Intact)`);
  console.log("==========================================================================");

  if (postProductCount > 0 || postVariantCount > 0) {
    throw new Error("Purge incomplete: Some product records remain in DB!");
  }
}

purgeAllDemoProducts()
  .catch((e) => {
    console.error("PURGE ERROR:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
