import { prisma } from "../lib/prisma";

async function auditProducts() {
  console.log("==========================================================================");
  console.log("AUDITING ALL PRODUCTS CURRENTLY IN POSTGRESQL DATABASE");
  console.log("==========================================================================");

  const totalProducts = await prisma.product.count();
  const totalVariants = await prisma.productVariant.count();
  const totalAttributes = await prisma.productAttribute.count();
  const totalCartItems = await prisma.cartItem.count();
  const totalReviews = await prisma.review.count();
  const totalRecentlyViewed = await prisma.recentlyViewed.count();
  const totalCategories = await prisma.category.count();
  const totalVendors = await prisma.vendor.count();
  const totalUsers = await prisma.user.count();
  const totalOrders = await prisma.order.count();

  console.log(`\nCURRENT INVENTORY SUMMARY:`);
  console.log(`- Total Products: ${totalProducts}`);
  console.log(`- Total Product Variants: ${totalVariants}`);
  console.log(`- Total Product Attributes: ${totalAttributes}`);
  console.log(`- Total Cart Items: ${totalCartItems}`);
  console.log(`- Total Reviews: ${totalReviews}`);
  console.log(`- Total Recently Viewed: ${totalRecentlyViewed}`);
  console.log(`\nPRESERVED PLATFORM DATA:`);
  console.log(`- Total Categories: ${totalCategories} (TO KEEP)`);
  console.log(`- Total Vendors: ${totalVendors} (TO KEEP)`);
  console.log(`- Total Users: ${totalUsers} (TO KEEP)`);
  console.log(`- Total Orders: ${totalOrders} (TO KEEP)`);

  const productsByCategory = await prisma.product.groupBy({
    by: ["categoryName", "categorySlug"],
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
  });

  console.log(`\nBREAKDOWN OF PRODUCTS BY CATEGORY:`);
  productsByCategory.forEach((cat, idx) => {
    console.log(`  ${idx + 1}. ${cat.categoryName || cat.categorySlug || "Uncategorized"}: ${cat._count.id} products`);
  });

  const allProducts = await prisma.product.findMany({
    select: { id: true, name: true, categoryName: true, vendorId: true, pricePerSqft: true },
  });
  console.log(`\nSAMPLE PRODUCTS LIST (${allProducts.length} items):`);
  allProducts.slice(0, 15).forEach((p, idx) => {
    console.log(`  ${idx + 1}. [${p.id}] "${p.name}" (${p.categoryName || "No Category"}, ₹${p.pricePerSqft})`);
  });
  if (allProducts.length > 15) {
    console.log(`  ... and ${allProducts.length - 15} more products.`);
  }

  console.log("==========================================================================");
}

auditProducts()
  .catch((e) => {
    console.error("Audit error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
