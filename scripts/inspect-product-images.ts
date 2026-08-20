import { prisma } from "../lib/prisma";

async function main() {
  const products = await prisma.product.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      images: true,
    },
  });

  console.log(`Found ${products.length} products in DB:`);
  products.forEach((p, idx) => {
    console.log(`\n[${idx + 1}] ID: ${p.id} | Name: ${p.name}`);
    console.log(`    Images:`, JSON.stringify(p.images));
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
