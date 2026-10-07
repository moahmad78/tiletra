import "./test-db-guard";
import { setTestCookie, clearTestCookies } from "./mock-next-headers";
import { prisma } from "../lib/prisma";
import { createProduct, updateProduct } from "../lib/actions/products";
import { createCategory, getCategories, deleteCategory } from "../lib/actions/categories";
import { generateCpoSessionToken } from "../lib/cpo/auth";
import { CPO_SESSION_COOKIE } from "../lib/config/cpo-permissions";
import { POST as uploadPostRoute } from "../app/api/upload/route";
import { NextRequest } from "next/server";

// Ensure isolated test execution
process.env.NODE_ENV = "test";
process.env.ALLOW_SYSTEM_MUTATIONS = "false";

const VENDOR_A_ID = "cmt1fsk96000c1pr8uyb3dho0"; // Tiletra
const VENDOR_B_ID = "cmuur1wni0002l2046yft2c96"; // RAY ENTERPRISES

async function runTestSuite() {
  console.log("================================================================================");
  console.log("   CPO ALTERNATING VENDORS, UPLOADS & CUSTOM CATEGORIES TEST SUITE");
  console.log("================================================================================\n");

  const createdProductIds: string[] = [];
  const createdCategoryIds: string[] = [];

  const cpoUser = await prisma.user.findFirst({
    where: { role: { in: ["cpo", "admin"] } },
  });
  if (!cpoUser) {
    throw new Error("No CPO/Admin user found in test database!");
  }
  console.log(`Authenticated CPO Actor: ${cpoUser.email} (${cpoUser.id})\n`);

  // Generate verified HMAC token for CPO session
  const cpoToken = await generateCpoSessionToken(cpoUser.id, cpoUser.email || "cpo@intrihub.com");

  try {
    // --------------------------------------------------------------------------
    // SUITE 1: Alternating Vendor Creation (Vendor A -> Vendor B -> Vendor A)
    // --------------------------------------------------------------------------
    console.log("--- 1. CPO Alternating Vendor Product Creation ---");

    // 1a: CPO selects Vendor A (Tiletra)
    clearTestCookies();
    setTestCookie(CPO_SESSION_COOKIE, cpoToken);
    console.log("  [Step 1a] CPO selects Vendor A (Tiletra) and adds item...");
    const resA1 = await createProduct({
      name: `CPO Alt Test Product A1 - ${Date.now()}`,
      categorySlug: "vitrified-tiles",
      material: "Ceramic",
      description: "Test product for Vendor A under alternating CPO workflow",
      images: ["/test/product-a1.webp"],
      vendorId: VENDOR_A_ID,
      variants: [{ size: "600x1200mm", pricePerBox: 1250 }],
    });
    if (!resA1.success || !resA1.product) {
      throw new Error(`Failed to create product for Vendor A: ${resA1.error}`);
    }
    if (resA1.product.vendorId !== VENDOR_A_ID) {
      throw new Error(`Vendor mismatch: Expected ${VENDOR_A_ID}, got ${resA1.product.vendorId}`);
    }
    createdProductIds.push(resA1.product.id);
    console.log(`  ✔ [PASS] Product A1 (${resA1.product.id}) correctly landed under Vendor A (${VENDOR_A_ID}).`);

    // 1b: CPO switches to Vendor B (Ray Enterprises)
    console.log("  [Step 1b] CPO switches dropdown to Vendor B (Ray Enterprises) and adds item...");
    const resB1 = await createProduct({
      name: `CPO Alt Test Product B1 - ${Date.now()}`,
      categorySlug: "vitrified-tiles",
      material: "Granite",
      description: "Test product for Vendor B under alternating CPO workflow",
      images: ["/test/product-b1.webp"],
      vendorId: VENDOR_B_ID,
      variants: [{ size: "600x600mm", pricePerBox: 980 }],
    });
    if (!resB1.success || !resB1.product) {
      throw new Error(`Failed to create product for Vendor B: ${resB1.error}`);
    }
    if (resB1.product.vendorId !== VENDOR_B_ID) {
      throw new Error(`Vendor mismatch: Expected ${VENDOR_B_ID}, got ${resB1.product.vendorId}`);
    }
    createdProductIds.push(resB1.product.id);
    console.log(`  ✔ [PASS] Product B1 (${resB1.product.id}) correctly landed under Vendor B (${VENDOR_B_ID}).`);

    // 1c: CPO switches back to Vendor A (Tiletra)
    console.log("  [Step 1c] CPO switches dropdown back to Vendor A (Tiletra) and adds item...");
    const resA2 = await createProduct({
      name: `CPO Alt Test Product A2 - ${Date.now()}`,
      categorySlug: "vitrified-tiles",
      material: "Porcelain",
      description: "Second test product for Vendor A to confirm no sticky state",
      images: ["/test/product-a2.webp"],
      vendorId: VENDOR_A_ID,
      variants: [{ size: "800x1600mm", pricePerBox: 2400 }],
    });
    if (!resA2.success || !resA2.product) {
      throw new Error(`Failed to create product for Vendor A (round 2): ${resA2.error}`);
    }
    if (resA2.product.vendorId !== VENDOR_A_ID) {
      throw new Error(`Vendor mismatch: Expected ${VENDOR_A_ID}, got ${resA2.product.vendorId}`);
    }
    createdProductIds.push(resA2.product.id);
    console.log(`  ✔ [PASS] Product A2 (${resA2.product.id}) correctly landed under Vendor A (${VENDOR_A_ID}).`);

    // --------------------------------------------------------------------------
    // SUITE 2: Missing Vendor Selection Blocks Add Item
    // --------------------------------------------------------------------------
    console.log("\n--- 2. Missing Vendor Selection Blocks Add Item ---");
    const resNoVendor = await createProduct({
      name: "CPO Test Product Without Vendor",
      categorySlug: "vitrified-tiles",
      material: "Ceramic",
      description: "Should fail because vendorId is missing",
      images: ["/test/product-fail.webp"],
      vendorId: "", // Empty vendor
      variants: [{ size: "600x600mm", pricePerBox: 500 }],
    });
    if (resNoVendor.success) {
      throw new Error("Add Item should have been BLOCKED when vendorId is empty!");
    }
    console.log(`  ✔ [PASS] Add Item correctly blocked without vendor: "${resNoVendor.error}"`);

    // --------------------------------------------------------------------------
    // SUITE 3: Image Upload from CPO New, Edit, and Re-upload
    // --------------------------------------------------------------------------
    console.log("\n--- 3. Image Upload API with Vendor Scoping ---");

    // 3a: Upload without vendorId is rejected
    const dummyPngBytes = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      "base64"
    );
    const blob1 = new Blob([dummyPngBytes], { type: "image/png" });

    const formNoVendor = new FormData();
    formNoVendor.append("file", blob1, "test-asset.png");

    const reqNoVendor = new NextRequest("http://localhost:3000/api/upload", {
      method: "POST",
      body: formNoVendor,
      headers: {
        "x-cpo-token": cpoToken,
      },
    });

    const uploadResNoVendor = await uploadPostRoute(reqNoVendor);
    const jsonNoVendor = await uploadResNoVendor.json();
    if (uploadResNoVendor.status !== 400 || jsonNoVendor.success !== false) {
      throw new Error(`Upload without vendorId should be rejected with 400. Got status: ${uploadResNoVendor.status}`);
    }
    console.log(`  ✔ [PASS] Upload without vendorId rejected: "${jsonNoVendor.error}"`);

    // 3b: CPO New Upload with Vendor A
    const formVendorA = new FormData();
    formVendorA.append("file", blob1, "test-vendora-asset.png");
    formVendorA.append("vendorId", VENDOR_A_ID);

    const reqVendorA = new NextRequest("http://localhost:3000/api/upload", {
      method: "POST",
      body: formVendorA,
      headers: {
        "x-cpo-token": cpoToken,
      },
    });

    const uploadResA = await uploadPostRoute(reqVendorA);
    const jsonA = await uploadResA.json();
    if (!jsonA.success || !jsonA.urls || jsonA.urls.length === 0) {
      throw new Error(`CPO Upload for Vendor A failed: ${JSON.stringify(jsonA)}`);
    }
    const uploadedUrlA = jsonA.urls[0];
    if (!uploadedUrlA.includes(VENDOR_A_ID)) {
      throw new Error(`Uploaded file path does not contain vendorId: ${uploadedUrlA}`);
    }
    console.log(`  ✔ [PASS] CPO New Upload succeeded under Vendor A: ${uploadedUrlA}`);

    // 3c: CPO Edit and Re-upload for Product A1 with Vendor A
    const formReupload = new FormData();
    formReupload.append("file", blob1, "reupload-vendora-asset.png");
    formReupload.append("vendorId", VENDOR_A_ID);

    const reqReupload = new NextRequest("http://localhost:3000/api/upload", {
      method: "POST",
      body: formReupload,
      headers: {
        "x-cpo-token": cpoToken,
      },
    });

    const uploadResRe = await uploadPostRoute(reqReupload);
    const jsonRe = await uploadResRe.json();
    if (!jsonRe.success || !jsonRe.urls || jsonRe.urls.length === 0) {
      throw new Error(`CPO Re-upload for Vendor A failed: ${JSON.stringify(jsonRe)}`);
    }
    const reuploadedUrl = jsonRe.urls[0];
    console.log(`  ✔ [PASS] CPO Re-upload succeeded: ${reuploadedUrl}`);

    // Update Product A1 with the re-uploaded image
    const updateRes = await updateProduct(resA1.product.id, {
      images: [reuploadedUrl],
    });
    if (!updateRes.success || !updateRes.product) {
      throw new Error(`Failed to update product images: ${updateRes.error}`);
    }
    console.log(`  ✔ [PASS] Product A1 updated with re-uploaded image: ${updateRes.product.images[0]}`);

    // --------------------------------------------------------------------------
    // SUITE 4: Custom Category and Custom Sub-Category Save & Reappear
    // --------------------------------------------------------------------------
    console.log("\n--- 4. Custom Category & Custom Sub-category Persistence ---");
    const testCatSlug = `custom-test-cat-${Date.now()}`;
    const testCatName = `Custom Test Category ${Date.now().toString().slice(-4)}`;

    // 4a: Create custom parent category
    const catRes = await createCategory({
      name: testCatName,
      slug: testCatSlug,
      description: "Custom category created via CPO workflow",
    });
    if (!catRes.success || !catRes.category) {
      throw new Error(`Failed to create custom category: ${catRes.error}`);
    }
    createdCategoryIds.push(catRes.category.id);
    console.log(`  ✔ [PASS] Custom Parent Category created: "${catRes.category.name}" (${catRes.category.id})`);

    // 4b: Create custom sub-category attached to the new parent
    const testSubSlug = `custom-test-subcat-${Date.now()}`;
    const testSubName = `Custom Test Subcat ${Date.now().toString().slice(-4)}`;
    const subRes = await createCategory({
      name: testSubName,
      slug: testSubSlug,
      description: "Custom sub-category attached to test parent",
      parentId: catRes.category.id,
    });
    if (!subRes.success || !subRes.category) {
      throw new Error(`Failed to create custom sub-category: ${subRes.error}`);
    }
    createdCategoryIds.push(subRes.category.id);
    console.log(`  ✔ [PASS] Custom Sub-category created: "${subRes.category.name}" (${subRes.category.id})`);

    // 4c: Verify both reappear in getCategories()
    const allCategories = await getCategories();
    const fetchedParent = allCategories.find((c) => c.id === catRes.category.id);
    if (!fetchedParent) {
      throw new Error("Created custom parent category not found in getCategories() list!");
    }
    const fetchedSub = fetchedParent.children?.find((ch: any) => ch.id === subRes.category.id);
    if (!fetchedSub) {
      throw new Error("Created custom sub-category not found under parent children in getCategories() list!");
    }
    console.log(`  ✔ [PASS] Verified custom category and sub-category reappear in catalog hierarchy.`);

    console.log("\n================================================================================");
    console.log("   ALL CPO WORKFLOW & SECURITY TESTS PASSED PERFECTLY!");
    console.log("================================================================================\n");
  } finally {
    // Cleanup products and categories created during test
    console.log("Cleaning up test products and categories...");
    if (createdProductIds.length > 0) {
      await prisma.productVariant.deleteMany({
        where: { productId: { in: createdProductIds } },
      });
      await prisma.product.deleteMany({
        where: { id: { in: createdProductIds } },
      });
      console.log(`Cleaned up ${createdProductIds.length} test products.`);
    }

    if (createdCategoryIds.length > 0) {
      for (const catId of createdCategoryIds.reverse()) {
        await prisma.category.deleteMany({
          where: { id: catId },
        });
      }
      console.log(`Cleaned up ${createdCategoryIds.length} test categories.`);
    }
  }
}

runTestSuite().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
