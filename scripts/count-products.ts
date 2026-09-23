import { prisma } from "../lib/prisma";

async function main() {
  const totalInDb = await prisma.product.count();
  const activeInDb = await prisma.product.count({
    where: { status: "active", approvalStatus: "approved" },
  });
  const byCategory = await prisma.product.groupBy({
    by: ["categorySlug"],
    _count: true,
    where: { status: "active", approvalStatus: "approved" },
  });
  console.log("Total products in DB:", totalInDb);
  console.log("Active & Approved in DB:", activeInDb);
  console.log("By category count breakdown:");
  for (const c of byCategory) {
    console.log(` - ${c.categorySlug}: ${c._count}`);
  }
  const statusBreakdown = await prisma.product.groupBy({
    by: ["status", "approvalStatus"],
    _count: true,
  });
  console.log("Status Breakdown in DB:", statusBreakdown);
}
main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
