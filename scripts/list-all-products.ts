import { prisma } from "../lib/prisma";

async function main() {
  const products = await prisma.product.findMany({
    select: { id: true, name: true, categorySlug: true, images: true }
  });
  console.log(`Total products: ${products.length}`);
  for (const p of products) {
    console.log(`Product: "${p.name}" | category: ${p.categorySlug} | images: ${JSON.stringify(p.images)}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
