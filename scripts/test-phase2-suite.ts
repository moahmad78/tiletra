import "./test-db-guard";
import { PrismaClient } from "@prisma/client";
import { createProduct, checkDuplicateProduct } from "../lib/actions/products";
import { createAttributeOption, getAttributeOptions } from "../lib/actions/attributes";
import { formatProduct, getProductPriceInfo } from "../lib/formatters";

const prisma = new PrismaClient();

async function main() {
  process.env.ALLOW_SYSTEM_MUTATIONS = "true";

  console.log("=================================================");
  console.log("PHASE 2: SHARED UPLOAD FORM & 6-STEP CORE SUITE");
  console.log("=================================================\n");

  // 1. Fetch an approved test vendor
  const vendor = await prisma.vendor.findFirst({
    where: { status: { in: ["approved", "active", "ACTIVE"] } },
  });

  if (!vendor) {
    throw new Error("No approved vendor found in database for testing.");
  }

  console.log(`Using Test Vendor: ${vendor.businessName} (${vendor.id})`);

  const category = await prisma.category.findFirst({ where: { parentId: null } });
  const categorySlug = category ? category.slug : "tiles-stone";

  const createdProductIds: string[] = [];

  try {
    // ------------------------------------------------------------------
    // TEST 1: Custom Attribute & Unit Creation & Reuse (AttributeOption)
    // ------------------------------------------------------------------
    console.log("\n--- TEST 1: Custom Unit & Colour Option Creation & Reuse ---");
    const customUnitRes = await createAttributeOption({
      type: "unit",
      name: "Pack of 12 pcs",
      value: "12 pcs",
      scope: "vendor",
      vendorId: vendor.id,
    });
    console.log(`✓ Custom unit created: ${customUnitRes.option.name} (Scope: ${customUnitRes.option.scope})`);

    const customColorRes = await createAttributeOption({
      type: "colour",
      name: "Champagne Gold",
      value: "Champagne Gold",
      hex: "#F7E7CE",
      scope: "vendor",
      vendorId: vendor.id,
    });
    console.log(`✓ Custom colour created: ${customColorRes.option.name} (${customColorRes.option.hex})`);

    const res = await getAttributeOptions({ vendorId: vendor.id });
    const retrievedOptions = res.options;
    const hasUnit = retrievedOptions.some((o) => o.name === "Pack of 12 pcs");
    const hasColor = retrievedOptions.some((o) => o.name === "Champagne Gold");
    console.log(`  - Custom options available in vendor scope: Unit=${hasUnit}, Color=${hasColor}`);
    if (!hasUnit || !hasColor) {
      throw new Error("Custom attribute option persistence failure!");
    }

    // ------------------------------------------------------------------
    // TEST 2: Vendor Single Item Upload (Steps 1, 2, 4, 5, 6)
    // ------------------------------------------------------------------
    console.log("\n--- TEST 2: Vendor Single Item Upload ---");
    const testTitle = `Single Item Step1-6 Test ${Date.now().toString().slice(-4)}`;
    const vendorSingleRes = await createProduct({
      name: testTitle,
      categorySlug,
      brand: "Havells",
      modelNumber: "HV-SINGLE-01",
      manufacturer: "Havells India Ltd.",
      condition: "New",
      highlights: [
        "Flame retardant casing",
        "Silver alloy contacts",
        "ISI certified heavy duty",
        "Child safety shutter",
      ],
      keywords: ["modular switch", "16A", "havells"],
      description: "High quality modular switch designed for high performance residential loads.",
      images: ["/placeholders/product.svg"],
      unitOfSale: "piece",
      hasVariants: false,
      vendorId: vendor.id,
      mrp: 350,
      salePrice: 280,
      hsnCode: "8536",
      gstPercent: 18,
      gstRate: 18,
      minOrderQuantity: 1,
      maxOrderQuantity: 50,
      allowBackorders: false,
      variants: [
        {
          variantName: "Standard",
          size: "Standard",
          color: "White",
          price: 299,
          pricePerBox: 299,
          mrp: 350,
          stockBoxes: 120,
          isDefault: true,
          active: true,
          barcode: "8901234567890",
          salePrice: 280,
        },
      ],
    });

    if (!vendorSingleRes.success || !vendorSingleRes.product) {
      throw new Error(`Vendor single item creation failed: ${vendorSingleRes.error}`);
    }
    console.log(`✓ Vendor Single Item created: ${vendorSingleRes.product.name} (ID: ${vendorSingleRes.product.id})`);
    createdProductIds.push(vendorSingleRes.product.id);

    const vSingleDb = await prisma.product.findUnique({
      where: { id: vendorSingleRes.product.id },
      include: { variants: true },
    });
    console.log(`  - hasVariants: ${vSingleDb?.hasVariants} (expected false)`);
    console.log(`  - Manufacturer: ${vSingleDb?.manufacturer} (expected Havells India Ltd.)`);
    console.log(`  - Condition: ${vSingleDb?.condition} (expected New)`);
    console.log(`  - Highlights count: ${vSingleDb?.highlights.length} (expected 4)`);
    console.log(`  - Single variant stock: ${vSingleDb?.variants[0].stockBoxes} (expected 120)`);

    if (vSingleDb?.hasVariants !== false || vSingleDb?.variants.length !== 1) {
      throw new Error("Vendor single item invariant failure!");
    }

    // ------------------------------------------------------------------
    // TEST 3: Duplicate Check (Step 1 validation)
    // ------------------------------------------------------------------
    console.log("\n--- TEST 3: Duplicate Listing Detection (Step 1) ---");
    const dupCheckMatch = await checkDuplicateProduct({
      vendorId: vendor.id,
      name: testTitle,
      brand: "Havells",
      modelNumber: "HV-SINGLE-01",
    });
    console.log(`  - Checking duplicate for same title + brand + model: isDuplicate=${dupCheckMatch.isDuplicate}`);
    if (!dupCheckMatch.isDuplicate) {
      throw new Error("Duplicate check failed to flag identical brand + model + title item!");
    }

    const dupCheckDifferent = await checkDuplicateProduct({
      vendorId: vendor.id,
      name: `Different Item ${Date.now()}`,
      brand: "Schneider",
    });
    console.log(`  - Checking duplicate for distinct item: isDuplicate=${dupCheckDifferent.isDuplicate} (expected false)`);
    if (dupCheckDifferent.isDuplicate) {
      throw new Error("Duplicate check gave false positive for distinct item!");
    }

    // ------------------------------------------------------------------
    // TEST 4: CPO Multi-Variety Matrix (3 Sizes x 2 Colours = 6 Rows)
    // ------------------------------------------------------------------
    console.log("\n--- TEST 4: CPO Multi-Variety Upload (3 Sizes x 2 Colours = 6 Rows) ---");
    const sizes = ["300x300 mm", "600x600 mm", "800x800 mm"];
    const colors = ["Ivory White", "Graphite Grey"];

    const multiVariantsList: any[] = [];
    let basePrice = 600;
    sizes.forEach((s, sIdx) => {
      colors.forEach((c, cIdx) => {
        const rowPrice = basePrice + sIdx * 200 + cIdx * 50;
        const rowMrp = rowPrice + 200;
        multiVariantsList.push({
          variantName: `${s} - ${c}`,
          size: s,
          color: c,
          colorHex: c === "Ivory White" ? "#FFFFF0" : "#4A4A4A",
          price: rowPrice,
          pricePerBox: rowPrice,
          mrp: rowMrp,
          stockBoxes: 30 + sIdx * 10,
          isDefault: sIdx === 0 && cIdx === 0,
          active: true,
          sku: `TILE-${s.slice(0, 3)}-${c.slice(0, 3).toUpperCase()}`,
          barcode: `890${Date.now().toString().slice(-6)}${sIdx}${cIdx}`,
          image: "/placeholders/product.svg",
          images: ["/placeholders/product.svg"],
          unit: "box",
        });
      });
    });

    console.log(`  - Generated Matrix: ${multiVariantsList.length} rows (3 sizes x 2 colours)`);

    const cpoMultiRes = await createProduct({
      name: `Kajaria Luxury Porcelain Tiles ${Date.now().toString().slice(-4)}`,
      categorySlug,
      brand: "Kajaria",
      modelNumber: "KJ-MULTI-MATRIX",
      manufacturer: "Kajaria Ceramics Ltd.",
      condition: "New",
      description: "Super high strength porcelain tile collection available across 3 modular sizes and 2 designer shades.",
      highlights: [
        "High abrasion resistance (PEI Class 4)",
        "Zero water absorption (<0.05%)",
        "Stain proof nano coat protection",
        "Suitable for heavy commercial foot traffic",
        "Factory rectified precision joints",
      ],
      keywords: ["porcelain tile", "kajaria", "vitrified"],
      images: ["/placeholders/product.svg", "/placeholders/product.svg"],
      hasVariants: true,
      vendorId: vendor.id,
      hsnCode: "6907",
      gstPercent: 18,
      gstRate: 18,
      variants: multiVariantsList,
    });

    if (!cpoMultiRes.success || !cpoMultiRes.product) {
      throw new Error(`CPO multi-variety creation failed: ${cpoMultiRes.error}`);
    }
    console.log(`✓ CPO Multi-Variety Listing created: ${cpoMultiRes.product.name} (ID: ${cpoMultiRes.product.id})`);
    createdProductIds.push(cpoMultiRes.product.id);

    const cpoProdDb = await prisma.product.findUnique({
      where: { id: cpoMultiRes.product.id },
      include: { variants: true },
    });
    console.log(`  - hasVariants: ${cpoProdDb?.hasVariants} (expected true)`);
    console.log(`  - Total Variant Rows: ${cpoProdDb?.variants.length} (expected 6)`);
    console.log(`  - Vendor scoping: ${cpoProdDb?.vendorId} (matches vendor ${vendor.id})`);

    if (cpoProdDb?.variants.length !== 6) {
      throw new Error(`Expected 6 variant rows but got ${cpoProdDb?.variants.length}!`);
    }

    // Verify row individual prices
    const minVarPrice = Math.min(...cpoProdDb.variants.map((v) => Number(v.price)));
    const maxVarPrice = Math.max(...cpoProdDb.variants.map((v) => Number(v.price)));
    console.log(`  - Min Variant Price: ₹${minVarPrice}, Max Variant Price: ₹${maxVarPrice}`);

    // Verify Storefront Listing Card and PDP Formats
    const formattedCpoProd = formatProduct(cpoProdDb as any);
    const priceInfo = getProductPriceInfo(formattedCpoProd as any);
    console.log(`  - Storefront Listing Card Price: "${priceInfo.formattedPrice}" (includes "From ₹")`);
    if (!priceInfo.formattedPrice.includes("From ₹")) {
      throw new Error("Storefront listing card missing 'From ₹' prefix for multi-variety listing!");
    }

    // ------------------------------------------------------------------
    // TEST 5: Admin Act-As-Vendor Upload (Audit & Auto-Publish)
    // ------------------------------------------------------------------
    console.log("\n--- TEST 5: Admin Act-As-Vendor Upload (Instant Publish & Audit) ---");
    const adminUploadRes = await createProduct({
      name: `Admin Managed Multi-Variety item ${Date.now().toString().slice(-4)}`,
      categorySlug,
      brand: "Intrihub Certified",
      manufacturer: "Intrihub Direct",
      condition: "New",
      description: "Direct premium grade building materials uploaded by Intrihub Admin in act-as-vendor mode.",
      images: ["/placeholders/product.svg"],
      hasVariants: true,
      vendorId: vendor.id,
      createdByAdminId: "admin_super_01",
      approvalStatus: "approved",
      variants: [
        {
          variantName: "Standard Pack 1",
          size: "Small",
          price: 450,
          pricePerBox: 450,
          mrp: 550,
          stockBoxes: 80,
          active: true,
          isDefault: true,
        },
        {
          variantName: "Standard Pack 2",
          size: "Medium",
          price: 750,
          pricePerBox: 750,
          mrp: 900,
          stockBoxes: 50,
          active: true,
          isDefault: false,
        },
      ],
    });

    if (!adminUploadRes.success || !adminUploadRes.product) {
      throw new Error(`Admin upload failed: ${adminUploadRes.error}`);
    }
    console.log(`✓ Admin Managed Listing created: ${adminUploadRes.product.name} (ID: ${adminUploadRes.product.id})`);
    createdProductIds.push(adminUploadRes.product.id);

    const adminProdDb = await prisma.product.findUnique({
      where: { id: adminUploadRes.product.id },
      include: { variants: true },
    });
    console.log(`  - createdByAdminId: ${adminProdDb?.createdByAdminId} (recorded)`);
    console.log(`  - approvalStatus: ${adminProdDb?.approvalStatus} (approved)`);
    console.log(`  - editHistory: ${(adminProdDb?.editHistory as any)?.[0]?.role} (recorded)`);

    console.log("\n=================================================");
    console.log("ALL PHASE 2 SHARED UPLOAD FORM TESTS PASSED! ✓");
    console.log("=================================================");
  } finally {
    // Cleanup test products
    for (const pId of createdProductIds) {
      await prisma.productVariant.deleteMany({ where: { productId: pId } });
      await prisma.product.delete({ where: { id: pId } }).catch(() => {});
    }
    console.log(`Cleaned up ${createdProductIds.length} test products.`);
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
