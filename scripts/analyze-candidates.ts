import fs from "fs";

const data = JSON.parse(fs.readFileSync("scripts/db-products-dump.json", "utf8"));

console.log("=== DETAILED PRODUCT AUDIT ===");

data.forEach((p: any, idx: number) => {
  const carts = p.variants.reduce((a: number, v: any) => a + v._count.cartItems, 0);
  const vName = p.vendor ? p.vendor.businessName : "NO VENDOR";

  // Check test markers
  const testMarkers: string[] = [];
  const lowerName = p.name.toLowerCase();
  const lowerDesc = (p.description || "").toLowerCase();
  const lowerSlug = p.slug.toLowerCase();

  const testWordRegex = /\b(test|demo|sample|dummy|lorem|xxx)\b/i;
  if (testWordRegex.test(p.name) || testWordRegex.test(p.slug)) testMarkers.push("Name/slug matches test keyword");
  if (lowerName.includes("important")) testMarkers.push("Name contains 'important' (placeholder)");
  if (lowerName === "sadarali") testMarkers.push("Personal name 'SadarAli' used as product name");
  if (lowerName.includes("roff t29 master fixed  metal")) testMarkers.push("Typo/double-space test item");
  if (p.pricePerSqft <= 10) testMarkers.push("Unusually low price (<= ₹10)");
  if (vName.includes("Tiletra")) testMarkers.push("Vendor is 'Tiletra' (internal vendor)");

  console.log(`[#${idx + 1}] ID: ${p.id}`);
  console.log(`  Name: ${p.name}`);
  console.log(`  Slug: ${p.slug}`);
  console.log(`  Category: ${p.categorySlug} | Price: ₹${p.pricePerSqft} | Vendor: ${vName}`);
  console.log(`  Created: ${p.createdAt.slice(0, 19)} | Orders: ${p._count.orderItems} | Carts: ${carts} | Reviews: ${p._count.reviews}`);
  console.log(`  Images: ${JSON.stringify(p.images)}`);
  console.log(`  Markers: ${testMarkers.join("; ") || "None"}`);
  console.log("--------------------------------------------------");
});
