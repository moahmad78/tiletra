/**
 * Test Suite for Phase 4, Phase 5, and Phase 6 of IntriHub Item Upload & Variant System
 * 
 * Tests:
 * 1. Category attributeSchema resolution & retrieval
 * 2. Product creation with Phase 4 fields (dimensions, shipping, returns, compliance)
 * 3. Product creation with Phase 5 fields (metaTitle, metaDescription, isFeatured, scheduledPublishDate)
 * 4. Verification that getProducts & formatProduct accurately map all Phase 4 & 5 fields
 * 5. updateProduct updating Phase 4 & 5 fields
 * 6. Phase 6: cloneProduct cloning listing into draft with copies of variants & attributes
 * 7. Phase 6: convertSingleToMultiVariant converting a single item to multi-variety
 * 8. Phase 6: bulkUpdateProducts updating multiple products at once
 * 9. Phase 6: generateProductCsvTemplate & parseCsvAndBulkCreate importing products from CSV
 */

process.env.ALLOW_SYSTEM_MUTATIONS = "true";

import "./test-db-guard";
import { prisma } from "../lib/prisma";
import {
  createProduct,
  updateProduct,
  getProducts,
  cloneProduct,
  convertSingleToMultiVariant,
  bulkUpdateProducts,
  generateProductCsvTemplate,
  parseCsvAndBulkCreate,
  hardDeleteProduct,
} from "../lib/actions/products";
import { getCategories, getCategoryBySlug } from "../lib/actions/categories";

async function runPhase456Suite() {
  console.log("============================================================");
  console.log("🚀 STARTING PHASE 4, 5, 6 COMPREHENSIVE AUTOMATED TEST SUITE");
  console.log("============================================================\n");

  const cleanupIds: string[] = [];
  let testsPassed = 0;
  let testsTotal = 0;

  function assert(condition: boolean, desc: string) {
    testsTotal++;
    if (condition) {
      console.log(`  ✅ PASS: ${desc}`);
      testsPassed++;
    } else {
      console.error(`  ❌ FAIL: ${desc}`);
      throw new Error(`Assertion failed: ${desc}`);
    }
  }

  try {
    // ------------------------------------------------------------
    // TEST GROUP 1: Category Dynamic attributeSchema
    // ------------------------------------------------------------
    console.log("--- 1. Testing Category attributeSchema Resolution ---");
    const categories = await getCategories();
    assert(categories.length > 0, `Retrieved ${categories.length} categories`);
    
    const tileCategory = await getCategoryBySlug("tiles-stone");
    assert(tileCategory !== null, "Resolved category by slug 'tiles-stone'");
    console.log("   Category attributes checked successfully.\n");

    // ------------------------------------------------------------
    // TEST GROUP 2: Product Creation with Phase 4 & Phase 5 Fields
    // ------------------------------------------------------------
    console.log("--- 2. Testing Product Creation with Phase 4 & Phase 5 Fields ---");
    const testSku = `PHASE45-TEST-${Date.now()}`;
    const createRes = await createProduct({
      name: `Test Architectural Porcelain Slab ${Date.now()}`,
      categorySlug: "tiles-stone",
      categoryName: "Tiles & Stone",
      brand: "Intrihub Studio",
      material: "Glazed Porcelain",
      description: "High performance architectural slab with nano-protective glaze.",
      unitOfSale: "box",
      mrp: 2499,
      gstPercent: 18,
      gstRate: 18,
      hsnCode: "6907",
      countryOfOrigin: "India",
      condition: "New",
      highlights: ["Nano-protective glaze", "Zero water absorption", "Suitable for heavy traffic"],
      keywords: ["porcelain slab", "large format tile", "vitrified"],
      // Phase 4 fields
      dimensions: {
        lengthCm: 120,
        widthCm: 60,
        heightCm: 1.2,
        packedWeightKg: 28.5,
      },
      inTheBox: "2 Slabs (15.5 sq.ft per box) + Corner Protectors",
      manufactureDate: "2026-01-15T00:00:00.000Z",
      expiryDate: null,
      shippingMode: "heavy",
      dispatchTimeDays: 3,
      pincodesServed: ["560001", "560002", "560038"],
      freeDeliveryAbove: 20000,
      deliveryCharge: 450,
      allowScheduledDelivery: true,
      allowCod: true,
      isFragile: true,
      isPerishable: false,
      returnPolicyDays: 10,
      replacementAllowed: true,
      warrantyType: "brand",
      warrantyDuration: "5 Years",
      returnConditions: "Must be unopened in original wooden crate packing.",
      complianceDeclarations: {
        ageRestriction: false,
        hazardous: false,
        hasBattery: false,
        isLiquid: false,
      },
      certificates: ["BIS: CM/L-9876543", "ISO 13006:2018"],
      vendorDeclaration: true,
      // Phase 5 fields
      metaTitle: "Architectural Porcelain Slab 120x60cm | IntriHub",
      metaDescription: "Buy premium architectural porcelain slabs online at IntriHub. 5-year warranty with safe pallet delivery.",
      isFeatured: true,
      status: "active",
      approvalStatus: "approved",
      // Variant
      hasVariants: false,
      variants: [
        {
          sku: testSku,
          variantName: "Standard Matte",
          size: "600x1200mm",
          finish: "Matte",
          color: "Grey",
          price: 1899,
          pricePerBox: 1899,
          pricePerSqft: 122.5,
          sqftPerBox: 15.5,
          stockBoxes: 120,
          active: true,
          isDefault: true,
        },
      ],
      attributes: [
        { key: "Material", value: "Glazed Porcelain" },
        { key: "Thickness", value: "12mm" },
        { key: "Water Absorption", value: "<0.05%" },
      ],
    });

    if (!createRes.success) {
      console.error("createProduct error:", createRes.error);
    }
    assert(createRes.success === true, `Product created successfully (ID: ${createRes.product?.id})`);
    const createdId = createRes.product!.id;
    cleanupIds.push(createdId);

    // ------------------------------------------------------------
    // TEST GROUP 3: Retrieval & Formatting Verification
    // ------------------------------------------------------------
    console.log("\n--- 3. Verifying Retrieval & Mapping of Phase 4 & Phase 5 Fields ---");
    const fetchedList = await getProducts({ includeAllStatuses: true });
    const fetched = fetchedList.find((p) => p.id === createdId);
    assert(fetched !== undefined, "Found created product in getProducts results");

    // Verify Phase 4 fields
    assert(fetched?.dimensions?.lengthCm === 120, "dimensions.lengthCm mapped correctly");
    assert(fetched?.dimensions?.packedWeightKg === 28.5, "dimensions.packedWeightKg mapped correctly");
    assert(fetched?.inTheBox === "2 Slabs (15.5 sq.ft per box) + Corner Protectors", "inTheBox mapped correctly");
    assert(fetched?.shippingMode === "heavy", "shippingMode is 'heavy'");
    assert(fetched?.dispatchTimeDays === 3, "dispatchTimeDays is 3");
    assert(Array.isArray(fetched?.pincodesServed) && fetched?.pincodesServed.includes("560001"), "pincodesServed contains '560001'");
    assert(fetched?.deliveryCharge === 450, "deliveryCharge is 450");
    assert(fetched?.isFragile === true, "isFragile is true");
    assert(fetched?.returnPolicyDays === 10, "returnPolicyDays is 10");
    assert(fetched?.warrantyDuration === "5 Years", "warrantyDuration is '5 Years'");
    assert(Array.isArray(fetched?.certificates) && fetched?.certificates.length === 2, "certificates mapped correctly");

    // Verify Phase 5 fields
    assert(fetched?.metaTitle === "Architectural Porcelain Slab 120x60cm | IntriHub", "metaTitle mapped correctly");
    assert(fetched?.isFeatured === true, "isFeatured is true");
    console.log("   Phase 4 & 5 fields verified.\n");

    // ------------------------------------------------------------
    // TEST GROUP 4: updateProduct Updating Phase 4 & 5 Fields
    // ------------------------------------------------------------
    console.log("--- 4. Testing updateProduct for Phase 4 & 5 Fields ---");
    const updateRes = await updateProduct(createdId, {
      returnPolicyDays: 15,
      dispatchTimeDays: 2,
      metaTitle: "Updated Architectural Porcelain Slab | IntriHub",
      warrantyDuration: "10 Years",
    });
    assert(updateRes.success === true, "updateProduct completed successfully");

    const afterUpdateList = await getProducts({ includeAllStatuses: true });
    const afterUpdate = afterUpdateList.find((p) => p.id === createdId);
    assert(afterUpdate?.returnPolicyDays === 15, "returnPolicyDays updated to 15");
    assert(afterUpdate?.dispatchTimeDays === 2, "dispatchTimeDays updated to 2");
    assert(afterUpdate?.warrantyDuration === "10 Years", "warrantyDuration updated to '10 Years'");
    console.log("   updateProduct verified.\n");

    // ------------------------------------------------------------
    // TEST GROUP 5: Phase 6 - cloneProduct
    // ------------------------------------------------------------
    console.log("--- 5. Testing Phase 6 cloneProduct ---");
    const cloneRes = await cloneProduct(createdId, "Cloned Architectural Porcelain Slab");
    assert(cloneRes.success === true, `Product cloned successfully (ID: ${cloneRes.product?.id})`);
    const clonedId = cloneRes.product!.id;
    cleanupIds.push(clonedId);

    const clonedProduct = (await getProducts({ includeAllStatuses: true })).find((p) => p.id === clonedId);
    assert(clonedProduct?.name === "Cloned Architectural Porcelain Slab", "Cloned product title matches");
    assert(clonedProduct?.status === "draft", "Cloned product is created as a Draft");
    assert(clonedProduct?.returnPolicyDays === 15, "Cloned product inherited returnPolicyDays");
    assert(clonedProduct?.warrantyDuration === "10 Years", "Cloned product inherited warrantyDuration");
    console.log("   cloneProduct verified.\n");

    // ------------------------------------------------------------
    // TEST GROUP 6: Phase 6 - convertSingleToMultiVariant
    // ------------------------------------------------------------
    console.log("--- 6. Testing Phase 6 convertSingleToMultiVariant ---");
    const newVariants = [
      {
        variantName: "Standard 600x600mm",
        size: "600x600mm",
        finish: "Matte",
        color: "Grey",
        price: 899,
        pricePerBox: 899,
        pricePerSqft: 112.5,
        sqftPerBox: 8,
        stockBoxes: 200,
        active: true,
        isDefault: true,
      },
      {
        variantName: "Large 600x1200mm",
        size: "600x1200mm",
        finish: "Glossy",
        color: "White",
        price: 1899,
        pricePerBox: 1899,
        pricePerSqft: 122.5,
        sqftPerBox: 15.5,
        stockBoxes: 150,
        active: true,
        isDefault: false,
      },
    ];

    const convertRes = await convertSingleToMultiVariant(createdId, newVariants);
    assert(convertRes.success === true, "Converted product to multi-variant successfully");

    const convertedProduct = (await getProducts({ includeAllStatuses: true })).find((p) => p.id === createdId);
    assert(convertedProduct?.hasVariants === true, "hasVariants is true after conversion");
    assert(convertedProduct?.variants?.length === 2, "Converted product has 2 variants");
    console.log("   convertSingleToMultiVariant verified.\n");

    // ------------------------------------------------------------
    // TEST GROUP 7: Phase 6 - bulkUpdateProducts
    // ------------------------------------------------------------
    console.log("--- 7. Testing Phase 6 bulkUpdateProducts ---");
    const bulkRes = await bulkUpdateProducts([createdId, clonedId], {
      dispatchTimeDays: 1,
      allowCod: true,
      freeDeliveryAbove: 25000,
    });
    assert(bulkRes.success === true, "bulkUpdateProducts executed successfully");
    assert(bulkRes.updatedCount === 2, "bulkUpdateProducts updated 2 products");

    const checkBulkList = await getProducts({ includeAllStatuses: true });
    const bulkItem1 = checkBulkList.find((p) => p.id === createdId);
    const bulkItem2 = checkBulkList.find((p) => p.id === clonedId);
    assert(bulkItem1?.dispatchTimeDays === 1, "Item 1 dispatchTimeDays updated to 1");
    assert(bulkItem2?.dispatchTimeDays === 1, "Item 2 dispatchTimeDays updated to 1");
    console.log("   bulkUpdateProducts verified.\n");

    // ------------------------------------------------------------
    // TEST GROUP 8: Phase 6 - CSV Template & parseCsvAndBulkCreate
    // ------------------------------------------------------------
    console.log("--- 8. Testing Phase 6 CSV Template & parseCsvAndBulkCreate ---");
    const template = await generateProductCsvTemplate();
    assert(template.includes("name,categorySlug,brand"), "CSV template contains standard headers");

    const sampleCsv = `name,categorySlug,brand,sellingPrice,mrp,stockQuantity,unitOfSale,sku,description,highlights,imageUrl,countryOfOrigin,gstRate,hsnCode,dispatchTimeDays,returnPolicyDays
"CSV Import Item 1 ${Date.now()}","tiles-stone","Somany","520","650","80","box","SOM-CSV-01","Somany premium tile","Anti-skid|Durable","https://example.com/tile1.jpg","India","18","6907","2","7"
"CSV Import Item 2 ${Date.now()}","electrical","Havells","850","999","40","coil","HAV-CSV-02","Havells pure copper wire","Flame retardant|IS 694","https://example.com/wire.jpg","India","18","8544","1","10"`;

    const csvImportRes = await parseCsvAndBulkCreate(sampleCsv);
    assert(csvImportRes.success === true, `CSV bulk created products successfully (count: ${csvImportRes.count})`);
    assert(csvImportRes.count === 2, "Imported exactly 2 items from CSV");

    // Find and register imported items for cleanup
    const afterCsvList = await getProducts({ includeAllStatuses: true });
    const imported1 = afterCsvList.find((p) => p.sku === "SOM-CSV-01");
    const imported2 = afterCsvList.find((p) => p.sku === "HAV-CSV-02");
    if (imported1) cleanupIds.push(imported1.id);
    if (imported2) cleanupIds.push(imported2.id);
    assert(imported1 !== undefined, "Found imported CSV item 1 in database");
    assert(imported2 !== undefined, "Found imported CSV item 2 in database");
    console.log("   CSV import and template verified.\n");

    // ------------------------------------------------------------
    // SUMMARY
    // ------------------------------------------------------------
    console.log("============================================================");
    console.log(`🎉 ALL TESTS PASSED: ${testsPassed} / ${testsTotal} (100% SUCCESS)`);
    console.log("============================================================");

  } finally {
    console.log(`\n🧹 Cleaning up ${cleanupIds.length} test records...`);
    for (const id of cleanupIds) {
      try {
        await hardDeleteProduct(id);
      } catch (err) {
        // ignore
      }
    }
    console.log("Clean up finished.");
  }
}

runPhase456Suite()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Test failed:", err);
    process.exit(1);
  });
