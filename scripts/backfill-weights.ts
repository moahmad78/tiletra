import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function backfillProductWeights() {
  console.log("Starting product weight & bulky flag backfill (F8)...");

  const products = await prisma.product.findMany({
    select: { id: true, name: true, categorySlug: true, weightKg: true, isBulky: true },
  });

  console.log(`Found ${products.length} products to evaluate.`);

  let updatedCount = 0;

  for (const product of products) {
    let targetWeight = product.weightKg;
    let isBulky = product.isBulky;

    const lowerName = product.name.toLowerCase();
    const lowerCat = (product.categorySlug || "").toLowerCase();

    // Determine weight if not set
    if (!targetWeight || targetWeight <= 0) {
      if (lowerCat.includes("tile") || lowerName.includes("tile")) {
        targetWeight = 24.0; // standard box of 4 vitrified tiles ~ 24kg
      } else if (lowerCat.includes("granite") || lowerCat.includes("marble") || lowerName.includes("granite")) {
        targetWeight = 45.0; // granite slab piece ~ 45kg
      } else if (lowerCat.includes("cement") || lowerName.includes("cement") || lowerName.includes("sand")) {
        targetWeight = 50.0; // 50kg bag
      } else if (lowerCat.includes("paint") || lowerName.includes("paint") || lowerName.includes("emulsion")) {
        targetWeight = 20.0; // 20L paint bucket ~ 20kg
      } else if (lowerCat.includes("pipe") || lowerName.includes("pipe") || lowerName.includes("plywood") || lowerName.includes("door")) {
        targetWeight = 15.0;
      } else if (lowerCat.includes("electrical") || lowerName.includes("switch") || lowerName.includes("wire")) {
        targetWeight = 1.5;
      } else if (lowerCat.includes("hardware") || lowerCat.includes("tools")) {
        targetWeight = 2.0;
      } else {
        targetWeight = 5.0; // default fallback
      }
    }

    // Determine isBulky
    if (
      lowerName.includes("plywood") ||
      lowerName.includes("pipe") ||
      lowerName.includes("door") ||
      lowerName.includes("sheet") ||
      lowerName.includes("panel") ||
      lowerName.includes("ceiling") ||
      lowerCat.includes("plywood") ||
      lowerCat.includes("pipes")
    ) {
      isBulky = true;
    }

    await prisma.product.update({
      where: { id: product.id },
      data: {
        weightKg: targetWeight,
        isBulky,
      },
    });

    updatedCount++;
  }

  console.log(`✅ Backfill complete! Updated ${updatedCount} products with weights and bulky flags.`);
}

backfillProductWeights()
  .catch((e) => {
    console.error("Backfill failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
