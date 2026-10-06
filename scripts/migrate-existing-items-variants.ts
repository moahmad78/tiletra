import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("=== CHECKING & MIGRATING ALL PRODUCTS: hasVariants & default variant ===");

  const products = await prisma.product.findMany({
    include: {
      variants: true,
    },
  });

  console.log(`Auditing ${products.length} products...`);

  let updatedCount = 0;
  let variantCreatedCount = 0;

  for (const prod of products) {
    const hasMultipleVariants = prod.variants.length > 1;
    let shouldUpdateProduct = false;
    const updateData: any = {};

    if (prod.hasVariants !== hasMultipleVariants) {
      updateData.hasVariants = hasMultipleVariants;
      shouldUpdateProduct = true;
    }

    if (prod.variants.length === 0) {
      // Create one default variant
      const defaultVariant = await prisma.productVariant.create({
        data: {
          productId: prod.id,
          variantName: "Standard",
          size: prod.size || "Standard",
          finish: prod.finish || "Standard",
          color: "Standard",
          price: prod.pricePerSqft || 100,
          pricePerBox: prod.pricePerSqft || 100,
          pricePerSqft: prod.pricePerSqft || 100,
          sqftPerBox: prod.conversionRatio ? Number(prod.conversionRatio) : 1,
          stockBoxes: 50,
          inStock: prod.inStock ?? true,
          active: true,
          isDefault: true,
          unit: prod.unitOfSale || "box",
          image: prod.images?.[0] || null,
          images: prod.images || [],
          lowStockAlert: 10,
          minOrderQuantity: prod.minOrderQuantity || 1,
        },
      });
      variantCreatedCount++;
      console.log(`[CREATED DEFAULT VARIANT] For product: ${prod.name} (${prod.id})`);
    } else {
      // Ensure at least one variant is marked isDefault
      const hasDefault = prod.variants.some((v) => v.isDefault);
      if (!hasDefault) {
        await prisma.productVariant.update({
          where: { id: prod.variants[0].id },
          data: { isDefault: true, active: true },
        });
        console.log(`[SET DEFAULT VARIANT] For product: ${prod.name} -> variant ${prod.variants[0].id}`);
      }
    }

    if (shouldUpdateProduct) {
      await prisma.product.update({
        where: { id: prod.id },
        data: updateData,
      });
      updatedCount++;
    }
  }

  console.log(`\nAudit & Migration Complete:`);
  console.log(`- Products checked: ${products.length}`);
  console.log(`- Products hasVariants updated: ${updatedCount}`);
  console.log(`- Default variants created: ${variantCreatedCount}`);
}

main()
  .catch((e) => console.error("Error migrating product variants:", e))
  .finally(async () => {
    await prisma.$disconnect();
  });
