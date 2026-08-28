import { prisma } from "../lib/prisma";
import { createProduct, getProductBySlug, getProducts } from "../lib/actions/products";
import { UNIVERSAL_UOM_OPTIONS, calculateEquivalentUnitPrice, getRecommendedUnitsForCategory } from "../lib/units";
import { resolveColour, MANAGED_COLOURS } from "../lib/colours";

async function main() {
  console.log("==================================================================");
  console.log("🧪 TESTING INTRIHUB UNIVERSAL PRODUCT, UOM, & VARIANT ENGINE");
  console.log("==================================================================");

  // 1. Verify UOM categories & recommendations
  console.log("\n1️⃣ Verifying UOM Engine & Conversions...");
  console.log(`Total universal UOMs available: ${UNIVERSAL_UOM_OPTIONS.length}`);
  
  const tileUnits = getRecommendedUnitsForCategory("tiles-stone");
  console.log(`Tile recommended units: ${tileUnits.map(u => u.value).join(", ")}`);

  const paintUnits = getRecommendedUnitsForCategory("paint-finishes");
  console.log(`Paint recommended units: ${paintUnits.map(u => u.value).join(", ")}`);

  const eqTile = calculateEquivalentUnitPrice(1350, 4.5, "sqft");
  console.log(`Equivalent price test (₹1,350/Box @ 4.5 sqft/box) -> ${eqTile?.formatted}`);
  if (eqTile?.price !== 300) throw new Error("Equivalent price calculation mismatch");

  // 2. Verify Colour Resolution
  console.log("\n2️⃣ Verifying Colour & Swatch Resolution...");
  const alaska = resolveColour("Alaska White");
  console.log(`Custom colour 'Alaska White' -> Hex: ${alaska.hexCode}, Text: ${alaska.textColor}`);

  const gold = resolveColour("Gold");
  console.log(`Managed colour 'Gold' -> Hex: ${gold.hexCode}, Standard: ${gold.isStandard}`);

  // 3. Create Sample Vitrified Tile with B2B Tiers
  console.log("\n3️⃣ Creating Vitrified Tile with Universal Packaging & Tiers...");
  const tileResult = await createProduct({
    name: "Intrihub Royal Statuario Vitrified Tile",
    categorySlug: "tiles-stone",
    categoryName: "Tiles & Stone",
    material: "Vitrified",
    description: "High gloss double charge vitrified tile with Italian Statuario marble texture.",
    images: ["/placeholders/product.svg"],
    unitOfSale: "box",
    sellingUnit: "box",
    baseUnit: "sqft",
    conversionRatio: 15.5,
    coverageRate: 15.5,
    piecesPerUnit: 4,
    weightKg: 28,
    minOrderQuantity: 1,
    grade: "Premium Grade A",
    hsnCode: "6907",
    gstPercent: 18,
    priceTiers: [
      { minQuantity: 1, maxQuantity: 9, price: 1350 },
      { minQuantity: 10, maxQuantity: 49, price: 1280 },
      { minQuantity: 50, price: 1200 },
    ],
    variants: [
      {
        size: "600x600mm",
        finish: "Glossy",
        color: "White",
        colorHex: "#FFFFFF",
        pricePerBox: 1350,
        pricePerSqft: 87,
        sqftPerBox: 15.5,
        piecesPerBox: 4,
        stockBoxes: 150,
      },
      {
        size: "600x1200mm",
        finish: "Polished",
        color: "White",
        colorHex: "#FFFFFF",
        pricePerBox: 2400,
        pricePerSqft: 96,
        sqftPerBox: 25,
        piecesPerBox: 2,
        stockBoxes: 80,
      },
    ],
  });

  if (!tileResult.success || !tileResult.product) {
    throw new Error(`Tile creation failed: ${tileResult.error}`);
  }
  console.log(`✅ Created Tile Product: ${tileResult.product.name} (Slug: ${tileResult.product.slug})`);
  console.log(`   Selling Unit: ${tileResult.product.sellingUnit}, Base Unit: ${tileResult.product.baseUnit}`);
  console.log(`   Variants Count: ${tileResult.product.variants.length}`);

  // 4. Fetch & Validate Product Hydration
  console.log("\n4️⃣ Validating Product Retrieval & Hydration...");
  const fetched = await getProductBySlug(tileResult.product.slug, { includeAllStatuses: true });
  if (!fetched) throw new Error("Product retrieval failed");
  console.log(`✅ Retrieved from DB: ${fetched.name}`);
  console.log(`   Primary Variant: ${fetched.variants[0].size}, Color: ${fetched.variants[0].color}, Hex: ${fetched.variants[0].colorHex}`);

  console.log("\n🎉 ALL UNIVERSAL PRODUCT ENGINE TESTS PASSED SUCCESSFULLY!\n");
}

main()
  .catch((e) => {
    console.error("❌ Test failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
