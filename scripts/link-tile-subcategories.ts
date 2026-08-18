import { prisma } from "../lib/prisma";

async function linkTileSubcategories() {
  const tilesStone = await prisma.category.findUnique({ where: { slug: "tiles-stone" } });
  if (!tilesStone) return;

  const tileSubSlugs = ["wall-tiles", "bathroom-tiles", "kitchen-tiles", "outdoor-tiles", "designer-tiles"];

  for (const slug of tileSubSlugs) {
    const sub = await prisma.category.findUnique({ where: { slug } });
    if (sub) {
      await prisma.category.update({
        where: { slug },
        data: {
          parentId: tilesStone.id,
          order: 30 + tileSubSlugs.indexOf(slug),
        },
      });
      console.log(`Linked ${sub.name} (${slug}) as subcategory under Tiles & Stone`);
    }
  }
}

linkTileSubcategories()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
