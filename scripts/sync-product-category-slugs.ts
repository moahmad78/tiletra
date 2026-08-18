import { prisma } from "../lib/prisma";

async function syncProductCategorySlugs() {
  console.log("=== SYNCING ALL PRODUCT CATEGORY SLUGS & NAMES ===");

  const products = await prisma.product.findMany({
    include: {
      category: {
        include: { parent: true },
      },
    },
  });

  console.log(`Found ${products.length} products to check and sync.`);

  for (const p of products) {
    if (p.category) {
      const correctSlug = p.category.slug;
      const correctName = p.category.name;

      if (p.categorySlug !== correctSlug || p.categoryName !== correctName) {
        console.log(`Updating "${p.name}": (${p.categorySlug} -> ${correctSlug}, ${p.categoryName} -> ${correctName})`);
        await prisma.product.update({
          where: { id: p.id },
          data: {
            categorySlug: correctSlug,
            categoryName: correctName,
          },
        });
      }
    } else {
      // If categoryId is missing, match by categorySlug or map to tiles-stone
      const slugMap: Record<string, string> = {
        "floor-tiles": "tiles-stone",
        "granite": "tiles-stone",
        "wall-tiles": "wall-tiles",
        "bathroom-tiles": "bathroom-tiles",
        "kitchen-tiles": "kitchen-tiles",
        "outdoor-tiles": "outdoor-tiles",
        "designer-tiles": "designer-tiles",
        "plumbing": "plumbing-sanitary",
        "hardware": "hardware-fittings",
        "aluminum-doors": "doors-windows",
        "wallpaper": "wall-surface",
        "plywood": "plywood",
      };

      const targetSlug = slugMap[p.categorySlug] || p.categorySlug;
      const cat = await prisma.category.findUnique({ where: { slug: targetSlug } });
      if (cat) {
        console.log(`Linking orphan "${p.name}" to category ${cat.name} (${cat.slug})`);
        await prisma.product.update({
          where: { id: p.id },
          data: {
            categoryId: cat.id,
            categorySlug: cat.slug,
            categoryName: cat.name,
          },
        });
      }
    }
  }

  console.log("=== SYNC COMPLETED SUCCESSFULLY ===");
}

syncProductCategorySlugs()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
