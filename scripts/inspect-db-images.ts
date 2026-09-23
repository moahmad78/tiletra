import { prisma } from "../lib/prisma";

async function main() {
  console.log("=== CHECKING CATEGORIES IN DB ===");
  const categories = await prisma.category.findMany({ select: { id: true, name: true, slug: true, image: true } });
  console.log(`Found ${categories.length} categories:`);
  categories.slice(0, 10).forEach(c => console.log(` - ${c.name} (${c.slug}): image = "${c.image}"`));

  console.log("\n=== CHECKING PRODUCTS IN DB ===");
  const products = await prisma.product.findMany({
    select: { id: true, name: true, slug: true, images: true, variants: { select: { image: true, swatchImage: true } } },
    take: 10
  });
  console.log(`Found ${products.length} products (sample of 10):`);
  products.forEach(p => {
    console.log(` - ${p.name} (${p.slug}): images =`, p.images, `variant images =`, p.variants.map(v => v.image));
  });

  console.log("\n=== CHECKING BANNERS IN DB ===");
  const banners = await prisma.offerBanner.findMany();
  console.log(`Found ${banners.length} banners:`);
  banners.forEach(b => {
    console.log(` - ${b.title}: image = "${b.image}"`);
  });
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
