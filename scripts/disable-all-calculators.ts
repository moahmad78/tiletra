import { prisma } from "../lib/prisma";

async function main() {
  console.log("🛠️ Disabling all category calculators in the database...");

  const result = await prisma.category.updateMany({
    data: {
      calculatorType: "none",
      calculatorInputType: "none",
    },
  });

  console.log(`✅ Updated ${result.count} categories in the database to calculatorType: "none", calculatorInputType: "none"`);

  const allCategories = await prisma.category.findMany({
    select: { id: true, name: true, slug: true, calculatorType: true, calculatorInputType: true },
  });

  console.log(`Current DB state (${allCategories.length} categories):`);
  for (const c of allCategories) {
    console.log(`- [${c.slug}] calc: ${c.calculatorType}, input: ${c.calculatorInputType}`);
  }
}

main()
  .catch((e) => {
    console.error("Error disabling calculators:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
