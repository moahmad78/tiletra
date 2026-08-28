import { prisma } from "../lib/prisma";

async function main() {
  const [products, orders, vendors, categories, users, reviews, coupons, banners] = await Promise.all([
    prisma.product.count(),
    prisma.order.count(),
    prisma.vendor.count(),
    prisma.category.count(),
    prisma.user.count(),
    prisma.review.count(),
    prisma.coupon.count(),
    prisma.offerBanner.count(),
  ]);

  console.log("Database Record Counts in PostgreSQL:");
  console.log({
    products,
    orders,
    vendors,
    categories,
    users,
    reviews,
    coupons,
    banners,
  });
}

main().finally(() => prisma.$disconnect());
