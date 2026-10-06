import { prisma } from "../lib/prisma";
import { createProduct, getProductBySlug } from "../lib/actions/products";

async function main() {
  process.env.ALLOW_SYSTEM_MUTATIONS = "true";

  console.log("=========================================================");
  console.log("  PHASE 3 UPLOAD TEST: Real Multi-Variant Live Storefront");
  console.log("=========================================================\n");

  const testSlug = `phase3-test-granite-${Date.now()}`;
  const vendor = await prisma.vendor.findFirst({
    where: { status: { in: ["approved", "active", "ACTIVE"] } },
  });

  if (!vendor) {
    throw new Error("No approved test vendor found in database.");
  }

  console.log(`1. Uploading test multi-variant item (Slug: ${testSlug}) for Vendor ${vendor.businessName}...`);
  const uploadResult = await createProduct({
      name: "Phase 3 Luxury Polished Granite Slab",
      slug: testSlug,
      categorySlug: "granite",
      categoryName: "Granite & Natural Stone",
      brand: "IntriHub Signature",
      material: "Natural Stone",
      finish: "Polished",
      unitOfSale: "sheet",
      pricePerSqft: 250,
      images: ["https://images.unsplash.com/photo-1600585154340-be6161a56a0c"],
      description: "Premium architectural granite slab tested for multi-variant storefront interactions.",
      hasVariants: true,
      vendorId: vendor.id,
      status: "active",
      approvalStatus: "approved",
      variants: [
        {
          size: "6x3 ft",
          color: "Jet Black",
          colorHex: "#111111",
          pricePerBox: 4500,
          pricePerSqft: 250,
          sqftPerBox: 18,
          stockBoxes: 30, // Normal stock
          active: true,
          image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c",
          attributeLabel: "Slab Size",
          attributeValue: "6x3 ft",
        },
        {
          size: "8x4 ft",
          color: "Jet Black",
          colorHex: "#111111",
          pricePerBox: 8000,
          pricePerSqft: 250,
          sqftPerBox: 32,
          stockBoxes: 4, // Low stock (<= 5)
          active: true,
          image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c",
          attributeLabel: "Slab Size",
          attributeValue: "8x4 ft",
        },
        {
          size: "10x5 ft",
          color: "Jet Black",
          colorHex: "#111111",
          pricePerBox: 12500,
          pricePerSqft: 250,
          sqftPerBox: 50,
          stockBoxes: 0, // Out of stock (0)
          active: true,
          image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c",
          attributeLabel: "Slab Size",
          attributeValue: "10x5 ft",
        },
        {
          size: "Custom Sizing",
          color: "Jet Black",
          colorHex: "#111111",
          pricePerBox: 15000,
          pricePerSqft: 300,
          sqftPerBox: 50,
          stockBoxes: 10,
          active: false, // Inactive combination
          image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c",
          attributeLabel: "Slab Size",
          attributeValue: "Custom Sizing",
        },
      ],
    });

  if (!uploadResult.success || !uploadResult.product) {
    console.error("Upload failed:", uploadResult.error);
    process.exit(1);
  }

  console.log(`✔ Upload succeeded! Product ID: ${uploadResult.product.id}, Slug: ${uploadResult.product.slug}`);

  console.log("\n2. Fetching product via Storefront Resolver (`getProductBySlug`)...");
  const storefrontProduct = await getProductBySlug(uploadResult.product.slug);

  if (!storefrontProduct) {
    console.error("Storefront product not found for slug:", testSlug);
    process.exit(1);
  }

  console.log(`✔ Storefront resolved: "${storefrontProduct.name}" with ${storefrontProduct.variants.length} variants.`);

  // Verify variant 1 (Normal in-stock)
  const v1 = storefrontProduct.variants.find((v) => v.attributeValue === "6x3 ft");
  console.log(`  - Variant 1 (6x3 ft): Stock = ${v1?.stockBoxes}, Active = ${v1?.active}`);
  if (!v1 || v1.stockBoxes !== 30 || v1.active !== true) throw new Error("Variant 1 mismatch");

  // Verify variant 2 (Low stock: <= 5)
  const v2 = storefrontProduct.variants.find((v) => v.attributeValue === "8x4 ft");
  console.log(`  - Variant 2 (8x4 ft): Stock = ${v2?.stockBoxes} (Should show "Only 4 left in stock")`);
  if (!v2 || v2.stockBoxes !== 4) throw new Error("Variant 2 mismatch");

  // Verify variant 3 (Out of stock: 0)
  const v3 = storefrontProduct.variants.find((v) => v.attributeValue === "10x5 ft");
  console.log(`  - Variant 3 (10x5 ft): Stock = ${v3?.stockBoxes} (Should show "Out of stock" & "Notify me")`);
  if (!v3 || v3.stockBoxes !== 0) throw new Error("Variant 3 mismatch");

  // Verify variant 4 (Inactive)
  const v4 = storefrontProduct.variants.find((v) => v.attributeValue === "Custom Sizing");
  console.log(`  - Variant 4 (Custom Sizing): Active = ${v4?.active} (Should show disabled with line-through)`);
  if (!v4 || v4.active !== false) throw new Error("Variant 4 mismatch");

  console.log("\n3. Cleaning up test product from DB...");
  await prisma.productVariant.deleteMany({ where: { productId: uploadResult.product.id } });
  await prisma.product.delete({ where: { id: uploadResult.product.id } });
  console.log("✔ Cleanup complete.");

  console.log("\n=========================================================");
  console.log("  PHASE 3 UPLOAD TEST: 100% SUCCESSFUL");
  console.log("=========================================================\n");
}

main()
  .catch((e) => {
    console.error("Upload test failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
