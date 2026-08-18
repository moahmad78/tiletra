import { prisma } from "../lib/prisma";

async function checkSubcategories() {
  const tileSubSlugs = ["wall-tiles", "bathroom-tiles", "kitchen-tiles", "outdoor-tiles", "designer-tiles"];
  const tilesStone = await prisma.category.findUnique({ where: { slug: "tiles-stone" } });

  console.log("=== PARENT CATEGORY ===");
  console.log(tilesStone ? `${tilesStone.name} (${tilesStone.slug}) -> ID: ${tilesStone.id}` : "NOT FOUND");

  console.log("\n=== TILE SUBCATEGORIES STATUS IN DB ===");
  for (const slug of tileSubSlugs) {
    const cat = await prisma.category.findUnique({
      where: { slug },
      include: {
        parent: true,
        _count: { select: { products: true } },
        products: { select: { id: true, name: true } },
      },
    });

    if (cat) {
      console.log(`- ${cat.name} (${cat.slug}):`);
      console.log(`  parentId: ${cat.parentId} (Parent: ${cat.parent?.name || "NONE - TOP LEVEL"})`);
      console.log(`  order: ${cat.order}`);
      console.log(`  products attached (${cat._count.products}):`, cat.products.map(p => p.name));
    } else {
      console.log(`- ${slug}: NOT IN DB`);
    }
  }
}

checkSubcategories()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
