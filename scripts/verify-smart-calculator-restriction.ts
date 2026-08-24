import { getCategories, getCategoryBySlug } from "../lib/actions/categories";
import { products } from "../lib/data/products";

async function main() {
  console.log("🧪 Verifying Smart Calculator Restriction...");

  const allCategories = await getCategories();
  console.log(`\n1. Checking Category calculatorType mappings (${allCategories.length} categories):`);

  let failures = 0;
  for (const cat of allCategories) {
    const s = cat.slug.toLowerCase();
    const isTileStoneOrGranite =
      s.includes("tile") ||
      s.includes("stone") ||
      s.includes("granite") ||
      s.includes("marble");

    if (isTileStoneOrGranite) {
      if (cat.calculatorType !== "area_to_boxes") {
        console.error(`❌ Category [${cat.name} (${cat.slug})] expected "area_to_boxes", got "${cat.calculatorType}"`);
        failures++;
      } else {
        console.log(`✅ [ALLOWED] Category [${cat.name} (${cat.slug})] -> calculatorType: "${cat.calculatorType}"`);
      }
    } else {
      if (cat.calculatorType !== "none") {
        console.error(`❌ Category [${cat.name} (${cat.slug})] expected "none", got "${cat.calculatorType}"`);
        failures++;
      } else {
        console.log(`✅ [RESTRICTED] Category [${cat.name} (${cat.slug})] -> calculatorType: "${cat.calculatorType}"`);
      }
    }
  }

  if (failures === 0) {
    console.log("\n🎉 Verification SUCCESS: Smart Calculator is strictly restricted to Tiles & Stone / Granite only!");
  } else {
    console.error(`\n❌ Verification FAILED with ${failures} errors.`);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
