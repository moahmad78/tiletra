import "./test-db-guard";
import { setTestCookie, clearTestCookies } from "./mock-next-headers";
import { prisma } from "../lib/prisma";
import { createProduct, updateProduct, moveProductToVendor } from "../lib/actions/products";
import { generateCpoSessionToken } from "../lib/cpo/auth";
import { CPO_SESSION_COOKIE } from "../lib/config/cpo-permissions";
import { generateVendorSessionToken, VENDOR_SESSION_COOKIE } from "../lib/server-auth";

// Ensure test environment is active
process.env.NODE_ENV = "test";
process.env.ALLOW_SYSTEM_MUTATIONS = "false";

const VENDOR_A_ID = "cmt1fsk96000c1pr8uyb3dho0"; // Tiletra
const VENDOR_B_ID = "cmuur1wni0002l2046yft2c96"; // RAY ENTERPRISES

async function runTests() {
  console.log("===============================================================");
  console.log("   STEP 2 REGRESSION TESTS: VENDOR SECURITY & ISOLATION");
  console.log("===============================================================\n");

  const createdTestProductIds: string[] = [];

  const adminOrCpoUser = await prisma.user.findFirst({
    where: { role: { in: ["admin", "cpo"] } },
  });
  if (!adminOrCpoUser) {
    throw new Error("No admin/cpo user found in database for audit foreign keys!");
  }
  console.log(`Using real DB user ${adminOrCpoUser.email} (${adminOrCpoUser.id}) for CPO audit sessions.\n`);

  const vendorA = await prisma.vendor.findUnique({ where: { id: VENDOR_A_ID } });
  const vendorAEmail = vendorA?.businessEmail || "vendorA@test.com";

  try {
    // -------------------------------------------------------------
    // TEST 1: CPO creates product for Vendor A -> lands on Vendor A
    // -------------------------------------------------------------
    console.log("TEST 1: CPO creates product for Vendor A (Tiletra)...");
    clearTestCookies();
    const cpoToken = await generateCpoSessionToken(adminOrCpoUser.id, adminOrCpoUser.email || "cpo@intrihub.com");
    setTestCookie(CPO_SESSION_COOKIE, cpoToken);

    const res1 = await createProduct({
      name: "Step2 Test CPO for Tiletra",
      categorySlug: "vitrified-tiles",
      material: "Glazed Vitrified",
      description: "Automated regression test product for CPO Vendor A assignment",
      images: ["/test/image1.webp"],
      vendorId: VENDOR_A_ID,
      variants: [
        {
          size: "600x1200mm",
          finish: "Glossy",
          pricePerBox: 1200,
        },
      ],
    });

    if (!res1.success || !res1.product) {
      throw new Error(`Test 1 Failed: createProduct returned error: ${res1.error}`);
    }
    if (res1.product.vendorId !== VENDOR_A_ID) {
      throw new Error(`Test 1 Failed: Expected vendorId ${VENDOR_A_ID}, got ${res1.product.vendorId}`);
    }
    createdTestProductIds.push(res1.product.id);
    console.log(`  PASSED: Product ${res1.product.id} created under Vendor A (Tiletra).`);

    // -------------------------------------------------------------
    // TEST 2: CPO creates product for Vendor B -> lands on Vendor B
    // -------------------------------------------------------------
    console.log("\nTEST 2: CPO creates product for Vendor B (Ray Enterprises)...");
    const res2 = await createProduct({
      name: "Step2 Test CPO for Ray Enterprises",
      categorySlug: "vitrified-tiles",
      material: "Glazed Vitrified",
      description: "Automated regression test product for CPO Vendor B assignment",
      images: ["/test/image2.webp"],
      vendorId: VENDOR_B_ID,
      variants: [
        {
          size: "600x600mm",
          finish: "Matte",
          pricePerBox: 900,
        },
      ],
    });

    if (!res2.success || !res2.product) {
      throw new Error(`Test 2 Failed: createProduct returned error: ${res2.error}`);
    }
    if (res2.product.vendorId !== VENDOR_B_ID) {
      throw new Error(`Test 2 Failed: Expected vendorId ${VENDOR_B_ID}, got ${res2.product.vendorId}`);
    }
    createdTestProductIds.push(res2.product.id);
    console.log(`  PASSED: Product ${res2.product.id} created under Vendor B (Ray Enterprises).`);

    // -------------------------------------------------------------
    // TEST 3: CPO creates product without vendorId -> rejected
    // -------------------------------------------------------------
    console.log("\nTEST 3: CPO creates product without vendorId...");
    const res3 = await createProduct({
      name: "Step2 Test CPO Missing Vendor",
      categorySlug: "vitrified-tiles",
      material: "Glazed Vitrified",
      description: "Should fail because vendorId is missing",
      images: ["/test/image3.webp"],
      vendorId: "",
      variants: [],
    });

    if (res3.success) {
      throw new Error("Test 3 Failed: Product creation should have been rejected for missing vendorId!");
    }
    if (!res3.error?.includes("Vendor selection is required")) {
      throw new Error(`Test 3 Failed: Unexpected error message: ${res3.error}`);
    }
    console.log(`  PASSED: Rejected with error: "${res3.error}"`);

    // -------------------------------------------------------------
    // TEST 4: CPO creates product with invalid vendorId -> rejected
    // -------------------------------------------------------------
    console.log("\nTEST 4: CPO creates product with non-existent vendorId...");
    const res4 = await createProduct({
      name: "Step2 Test Non-existent Vendor",
      categorySlug: "vitrified-tiles",
      material: "Glazed Vitrified",
      description: "Should fail because vendor does not exist",
      images: ["/test/image4.webp"],
      vendorId: "non-existent-vendor-xyz",
      variants: [],
    });

    if (res4.success) {
      throw new Error("Test 4 Failed: Product creation should have failed for non-existent vendor!");
    }
    console.log(`  PASSED: Rejected with error: "${res4.error}"`);

    // -------------------------------------------------------------
    // TEST 5: Vendor A attempts to spoof and create under Vendor B
    // -------------------------------------------------------------
    console.log("\nTEST 5: Vendor A attempts to spoof vendorId to Vendor B...");
    clearTestCookies();
    const vendorAToken = generateVendorSessionToken(VENDOR_A_ID, vendorAEmail);
    setTestCookie(VENDOR_SESSION_COOKIE, vendorAToken);

    const res5 = await createProduct({
      name: "Step2 Test Vendor Spoof Attempt",
      categorySlug: "vitrified-tiles",
      material: "Glazed Vitrified",
      description: "Vendor A trying to pass Vendor B ID in payload",
      images: ["/test/image5.webp"],
      vendorId: VENDOR_B_ID, // Attempted spoof
      variants: [
        {
          size: "600x600mm",
          finish: "Matte",
          pricePerBox: 850,
        },
      ],
    });

    if (!res5.success || !res5.product) {
      throw new Error(`Test 5 Failed: ${res5.error}`);
    }
    if (res5.product.vendorId !== VENDOR_A_ID) {
      throw new Error(`Test 5 Failed: Spoof succeeded! Product has vendorId ${res5.product.vendorId} instead of ${VENDOR_A_ID}`);
    }
    createdTestProductIds.push(res5.product.id);
    console.log(`  PASSED: Spoofed vendorId ignored. Product forced to Vendor A (${VENDOR_A_ID}).`);

    // -------------------------------------------------------------
    // TEST 6: updateProduct cannot change vendorId
    // -------------------------------------------------------------
    console.log("\nTEST 6: updateProduct cannot change vendorId...");
    const productIdToUpdate = res1.product.id;
    // Attempt to update with vendorId = VENDOR_B_ID
    const res6 = await updateProduct(productIdToUpdate, {
      name: "Step2 Test CPO for Tiletra (Updated Title)",
      vendorId: VENDOR_B_ID, // Attempt to move via updateProduct
    });

    if (!res6.success || !res6.product) {
      throw new Error(`Test 6 Failed: updateProduct returned error: ${res6.error}`);
    }

    const verifyProductAfterUpdate = await prisma.product.findUnique({
      where: { id: productIdToUpdate },
      select: { vendorId: true, name: true },
    });

    if (verifyProductAfterUpdate?.vendorId !== VENDOR_A_ID) {
      throw new Error(`Test 6 Failed: vendorId was changed during update! Got: ${verifyProductAfterUpdate?.vendorId}`);
    }
    console.log(`  PASSED: Product updated name to "${verifyProductAfterUpdate.name}", vendorId remained securely locked at ${VENDOR_A_ID}.`);

    // -------------------------------------------------------------
    // TEST 7: moveProductToVendor Server Action (CPO only)
    // -------------------------------------------------------------
    console.log("\nTEST 7: moveProductToVendor moves product and logs audit...");
    clearTestCookies();
    const cpoToken2 = await generateCpoSessionToken(adminOrCpoUser.id, adminOrCpoUser.email || "cpo@intrihub.com");
    setTestCookie(CPO_SESSION_COOKIE, cpoToken2);

    const res7 = await moveProductToVendor({
      productId: productIdToUpdate,
      targetVendorId: VENDOR_B_ID,
      reason: "Official catalog realignment test",
    });

    if (!res7.success || !res7.product) {
      throw new Error(`Test 7 Failed: moveProductToVendor failed: ${res7.error}`);
    }
    if (res7.product.vendorId !== VENDOR_B_ID) {
      throw new Error(`Test 7 Failed: Expected vendorId ${VENDOR_B_ID}, got ${res7.product.vendorId}`);
    }

    // Verify DB editHistory
    const dbProduct = await prisma.product.findUnique({
      where: { id: productIdToUpdate },
      select: { editHistory: true },
    });
    const history = (dbProduct?.editHistory as any[]) || [];
    const moveEntry = history.find((h: any) => h.action === "PRODUCT_MOVED_TO_ANOTHER_VENDOR");
    if (!moveEntry) {
      throw new Error("Test 7 Failed: editHistory missing PRODUCT_MOVED_TO_ANOTHER_VENDOR entry!");
    }

    // Verify AdminAuditLog
    const auditLog = await prisma.adminAuditLog.findFirst({
      where: {
        entityId: productIdToUpdate,
        action: "PRODUCT_MOVED_TO_ANOTHER_VENDOR",
      },
      orderBy: { createdAt: "desc" },
    });
    if (!auditLog) {
      throw new Error("Test 7 Failed: AdminAuditLog missing record for PRODUCT_MOVED_TO_ANOTHER_VENDOR!");
    }

    console.log(`  PASSED: Product ${productIdToUpdate} moved to Vendor B (${VENDOR_B_ID}).`);
    console.log(`          editHistory entry verified: ${JSON.stringify(moveEntry.action)}`);
    console.log(`          AdminAuditLog entry verified: ID ${auditLog.id}, Action: ${auditLog.action}`);

    // -------------------------------------------------------------
    // TEST 8: moveProductToVendor validations
    // -------------------------------------------------------------
    console.log("\nTEST 8: moveProductToVendor validation checks...");
    // 8a: Move to same vendor
    const res8a = await moveProductToVendor({
      productId: productIdToUpdate,
      targetVendorId: VENDOR_B_ID,
    });
    if (res8a.success) throw new Error("Test 8a Failed: Moving to same vendor should fail!");
    console.log(`  PASSED 8a: Re-moving to same vendor rejected: "${res8a.error}"`);

    // 8b: Move by regular vendor (unauthorized)
    clearTestCookies();
    const vendorAToken2 = generateVendorSessionToken(VENDOR_A_ID, vendorAEmail);
    setTestCookie(VENDOR_SESSION_COOKIE, vendorAToken2);
    const res8b = await moveProductToVendor({
      productId: productIdToUpdate,
      targetVendorId: VENDOR_A_ID,
    });
    if (res8b.success) throw new Error("Test 8b Failed: Regular vendor should not be allowed to move product!");
    console.log(`  PASSED 8b: Regular vendor call rejected: "${res8b.error}"`);

    console.log("\n===============================================================");
    console.log("   ALL 8 REGRESSION TESTS PASSED PERFECTLY!");
    console.log("===============================================================\n");
  } finally {
    // -------------------------------------------------------------
    // CLEANUP: Clean up all test products
    // -------------------------------------------------------------
    console.log(`Cleaning up ${createdTestProductIds.length} test products from DB...`);
    if (createdTestProductIds.length > 0) {
      await prisma.productVariant.deleteMany({
        where: { productId: { in: createdTestProductIds } },
      });
      await prisma.adminAuditLog.deleteMany({
        where: { entityId: { in: createdTestProductIds } },
      });
      await prisma.product.deleteMany({
        where: { id: { in: createdTestProductIds } },
      });
    }
    console.log("Cleanup complete. Database is pristine.\n");
    await prisma.$disconnect();
  }
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
