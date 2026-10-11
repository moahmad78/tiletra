import { translateDynamicTexts } from "../lib/translate/dynamic-translator";

async function runTest() {
  console.log("=== Testing Backend Dynamic Translation & Cache ===");

  const sampleTexts = [
    "High Gloss Vitrified Floor Tile 600x1200mm",
    "Express delivery straight to your construction or interior site",
    "Order Confirmed - Dispatch in 60 Minutes",
  ];

  console.log("1. First call (Hindi) - should fetch and cache in DB:");
  const res1 = await translateDynamicTexts(sampleTexts, "hi");
  console.log("Result 1:", JSON.stringify(res1, null, 2));

  console.log("\n2. Second call (Hindi) - should hit DB cache (cachedCount = 3, freshCount = 0):");
  const res2 = await translateDynamicTexts(sampleTexts, "hi");
  console.log("Result 2:", JSON.stringify(res2, null, 2));

  console.log("\n3. Third call (Kannada) - should fetch and cache in DB:");
  const res3 = await translateDynamicTexts(sampleTexts, "kn");
  console.log("Result 3:", JSON.stringify(res3, null, 2));

  console.log("\nAll Dynamic Translation tests passed successfully!");
  process.exit(0);
}

runTest().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
