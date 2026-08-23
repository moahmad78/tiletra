import { prisma } from "../lib/prisma";
import { formatProduct } from "../lib/formatters";

async function main() {
  console.log("🚀 Testing & Seeding Smart Category-Aware Calculator Data...");

  // ── 1. Update Categories with calculatorType ──
  const categoryUpdates = [
    { slug: "tiles-stone", name: "Tiles & Stone", calculatorType: "area_to_boxes" },
    { slug: "floor-tiles", name: "Floor Tiles", calculatorType: "area_to_boxes" },
    { slug: "wall-tiles", name: "Wall Tiles", calculatorType: "area_to_boxes" },
    { slug: "paint-finishes", name: "Paint & Finishes", calculatorType: "area_to_volume" },
    { slug: "paints", name: "Paints", calculatorType: "area_to_volume" },
    { slug: "electrical", name: "Electrical", calculatorType: "length_to_units" },
    { slug: "electrical-wires", name: "Wires & Cables", calculatorType: "length_to_units" },
    { slug: "hardware", name: "Hardware & Fittings", calculatorType: "none" },
  ];

  for (const cat of categoryUpdates) {
    try {
      await prisma.category.upsert({
        where: { slug: cat.slug },
        update: { calculatorType: cat.calculatorType, name: cat.name },
        create: {
          name: cat.name,
          slug: cat.slug,
          calculatorType: cat.calculatorType,
          description: `${cat.name} collection.`,
          image: `/placeholders/category.svg`,
        },
      });
      console.log(`✅ Category [${cat.slug}] -> calculatorType: "${cat.calculatorType}"`);
    } catch (e: any) {
      console.warn(`Note: Could not upsert category ${cat.slug}: ${e.message}`);
    }
  }

  // ── 2. Create / Update Paint Test Product (Area -> Volume) ──
  const paintSlug = "asian-paints-royale-luxury-emulsion";
  const paintProd = await prisma.product.upsert({
    where: { slug: paintSlug },
    update: {
      categorySlug: "paint-finishes",
      categoryName: "Paint & Finishes",
      coverageRate: 120, // 120 sq.ft per litre per coat
      wastageFactor: 1.1, // 10% extra
      unitOfSale: "litre",
    },
    create: {
      name: "Asian Paints Royale Luxury Emulsion",
      slug: paintSlug,
      categorySlug: "paint-finishes",
      categoryName: "Paint & Finishes",
      unitOfSale: "litre",
      material: "Acrylic Emulsion",
      finish: "Soft Sheen",
      size: "4 Litre Can",
      pricePerSqft: 750,
      thickness: "N/A",
      usage: "Interior Walls",
      look: "Teflon Surface Protector",
      coverageRate: 120,
      wastageFactor: 1.1,
      inStock: true,
      images: ["/placeholders/product.svg"],
      description: "Asian Paints Royale Luxury Emulsion provides a soft sheen finish with Teflon surface protector for dirt resistance.",
      variants: {
        create: [
          {
            size: "1 Litre Can",
            finish: "Soft Sheen",
            color: "Brilliant White",
            unit: "litre",
            attributeLabel: "Pack Size",
            attributeValue: "1L",
            pricePerBox: 480,
            pricePerSqft: 480,
            sqftPerBox: 120,
            stockBoxes: 100,
          },
          {
            size: "4 Litre Can",
            finish: "Soft Sheen",
            color: "Brilliant White",
            unit: "litre",
            attributeLabel: "Pack Size",
            attributeValue: "4L",
            pricePerBox: 1850,
            pricePerSqft: 1850,
            sqftPerBox: 480,
            stockBoxes: 60,
          },
          {
            size: "10 Litre Bucket",
            finish: "Soft Sheen",
            color: "Brilliant White",
            unit: "litre",
            attributeLabel: "Pack Size",
            attributeValue: "10L",
            pricePerBox: 4350,
            pricePerSqft: 4350,
            sqftPerBox: 1200,
            stockBoxes: 30,
          },
          {
            size: "20 Litre Bucket",
            finish: "Soft Sheen",
            color: "Brilliant White",
            unit: "litre",
            attributeLabel: "Pack Size",
            attributeValue: "20L",
            pricePerBox: 8200,
            pricePerSqft: 8200,
            sqftPerBox: 2400,
            stockBoxes: 20,
          },
        ],
      },
    },
    include: { variants: true },
  });
  console.log(`✅ Paint product verified: "${paintProd.name}" (Coverage: ${paintProd.coverageRate} sq.ft/L, Unit: ${paintProd.unitOfSale})`);

  // ── 3. Create / Update Wire Test Product (Length -> Units) ──
  const wireSlug = "havells-lifeline-plus-2-5-wire";
  const wireProd = await prisma.product.upsert({
    where: { slug: wireSlug },
    update: {
      categorySlug: "electrical",
      categoryName: "Electrical",
      coverageRate: 90, // 90 meters per coil
      wastageFactor: 1.1, // 10% sag/wastage
      unitOfSale: "coil",
    },
    create: {
      name: "Havells LifeLine Plus 2.5 sq mm FR Wire",
      slug: wireSlug,
      categorySlug: "electrical",
      categoryName: "Electrical",
      unitOfSale: "coil",
      material: "Copper (FR PVC)",
      finish: "Standard",
      size: "90 Meter Coil",
      pricePerSqft: 2299,
      thickness: "2.5 sq mm",
      usage: "Concealed & Open House Conduit Wiring",
      look: "Havells Premium Red",
      coverageRate: 90,
      wastageFactor: 1.1,
      inStock: true,
      images: ["/placeholders/product.svg"],
      description: "Havells LifeLine Plus 100% Electrolytic Grade Copper Wire with Flame Retardant Insulation.",
      variants: {
        create: [
          {
            size: "90m Coil (Red)",
            finish: "Standard",
            color: "Red",
            unit: "coil",
            attributeLabel: "Color",
            attributeValue: "Red",
            pricePerBox: 2299,
            pricePerSqft: 2299,
            sqftPerBox: 90,
            stockBoxes: 50,
          },
          {
            size: "90m Coil (Black)",
            finish: "Standard",
            color: "Black",
            unit: "coil",
            attributeLabel: "Color",
            attributeValue: "Black",
            pricePerBox: 2299,
            pricePerSqft: 2299,
            sqftPerBox: 90,
            stockBoxes: 50,
          },
        ],
      },
    },
    include: { variants: true },
  });
  console.log(`✅ Wire product verified: "${wireProd.name}" (Coverage: ${wireProd.coverageRate} m/coil, Unit: ${wireProd.unitOfSale})`);

  // ── 4. Verify existing Tile Product (Area -> Boxes) ──
  const tileProds = await prisma.product.findMany({
    where: {
      OR: [
        { categorySlug: "floor-tiles" },
        { categorySlug: "tiles-stone" },
      ],
    },
    take: 3,
    include: { variants: true },
  });

  for (const tp of tileProds) {
    if (!tp.coverageRate) {
      await prisma.product.update({
        where: { id: tp.id },
        data: {
          coverageRate: tp.variants[0]?.sqftPerBox || 16,
          wastageFactor: 1.1,
        },
      });
      console.log(`✅ Migrated tile product "${tp.name}" -> coverageRate: ${tp.variants[0]?.sqftPerBox || 16} sq.ft/box`);
    } else {
      console.log(`✅ Tile product "${tp.name}" already has coverageRate: ${tp.coverageRate} sq.ft/box`);
    }
  }

  console.log("\n🎉 Smart Calculator Setup & Verification Complete!");
}

main()
  .catch((e) => {
    console.error("Error in test script:", e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
