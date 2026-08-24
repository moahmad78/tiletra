import { prisma } from "../lib/prisma";

async function main() {
  console.log("🛠️ Restricting Smart Calculator to ONLY Tiles & Stone / Granite...");

  const allCategories = await prisma.category.findMany();
  console.log(`Found ${allCategories.length} categories in database.`);

  for (const cat of allCategories) {
    const s = cat.slug.toLowerCase();
    const isTileStoneOrGranite =
      s.includes("tile") ||
      s.includes("stone") ||
      s.includes("granite") ||
      s.includes("marble");

    const targetType = isTileStoneOrGranite ? "area_to_boxes" : "none";

    if (cat.calculatorType !== targetType) {
      await prisma.category.update({
        where: { id: cat.id },
        data: { calculatorType: targetType },
      });
      console.log(`Updated [${cat.slug}] -> calculatorType: "${targetType}"`);
    } else {
      console.log(`Already [${cat.slug}] -> calculatorType: "${targetType}"`);
    }
  }

  console.log("✅ All categories updated successfully!");
}

main()
  .catch((e) => {
    console.error("Error restricting calculator:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
