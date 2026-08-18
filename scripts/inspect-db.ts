import { prisma } from "../lib/prisma";

async function inspectDb() {
  const catCount = await prisma.category.count();
  const prodCount = await prisma.product.count();
  console.log(`DB Counts -> Categories: ${catCount}, Products: ${prodCount}`);

  const products = await prisma.product.findMany({
    include: { variants: true },
    take: 20,
  });

  for (const p of products) {
    console.log(`Product: ${p.name} | slug: ${p.slug} | categorySlug: ${p.categorySlug} | categoryId: ${p.categoryId}`);
  }
}

inspectDb()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
