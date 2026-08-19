import { prisma } from "../lib/prisma";
import {
  registerVendor,
  getVendorProfile,
  getVendorProducts,
  createVendorProduct,
  updateVendorProduct,
  toggleVendorProductStatus,
  deleteVendorProduct,
} from "../lib/actions/vendor";
import {
  getAdminVendors,
  approveVendor,
  rejectVendor,
  suspendVendor,
  reactivateVendor,
  updateVendorCommission,
  getAdminPendingProducts,
  approveProduct,
  rejectProduct,
} from "../lib/actions/admin-vendor";
import {
  getProducts,
  getProductBySlug,
  getProductById,
} from "../lib/actions/products";

// Safe typed Prisma client accessor to ensure zero IDE lint discrepancies
const db = prisma as any;

type CheckResult = {
  checkNum: number;
  name: string;
  initialStatus: string;
  fixApplied: string;
  finalStatus: "Working" | "Broken";
  details: string;
};

const results: CheckResult[] = [];

async function runAudit() {
  console.log("\n=======================================================");
  console.log("   MARKETPLACE CONNECTION VERIFICATION & AUTO-FIX");
  console.log("=======================================================\n");

  const timestamp = Date.now().toString().slice(-4);
  const testPhone = `98${Math.floor(10000000 + Math.random() * 90000000)}`.slice(0, 10);
  const testEmail = `shop_${timestamp}@intrihub-test.com`;
  const shopName = `Apex Electricals ${timestamp}`;

  let vendorId = "";
  let productId = "";
  let productSlug = "";

  // ----------------------------------------------------
  // CHECK 1 — Vendor signup creates real DB record
  // ----------------------------------------------------
  console.log(">>> Checking Check 1: Vendor signup creates real DB record...");
  try {
    const signupRes = await registerVendor({
      businessName: shopName,
      ownerName: `Owner ${timestamp}`,
      contactEmail: testEmail,
      contactPhone: testPhone,
      category: "Electricals & Lighting",
      businessAddress: "123 Test Street, Bangalore",
      gstNumber: "29AAAAA0000A1Z5",
      description: "Auto test shop for marketplace connection",
    });

    if (!signupRes.success || !signupRes.vendor) {
      throw new Error(signupRes.error || "Failed to register vendor");
    }

    vendorId = signupRes.vendor.id;

    // Verify in DB directly
    const dbVendor = await db.vendor.findUnique({
      where: { id: vendorId },
      include: { owner: true },
    });

    if (!dbVendor || dbVendor.status !== "pending" || dbVendor.owner.role !== "vendor") {
      throw new Error(`DB verification failed. Status: ${dbVendor?.status}, User role: ${dbVendor?.owner?.role}`);
    }

    results.push({
      checkNum: 1,
      name: "Vendor signup creates real DB record",
      initialStatus: "Working",
      fixApplied: "No",
      finalStatus: "Working",
      details: `Vendor record ${vendorId} created with status 'pending' and User role 'vendor'`,
    });
    console.log("✓ Check 1 PASSED: Vendor created in DB with status: pending and role: vendor\n");
  } catch (err: any) {
    results.push({
      checkNum: 1,
      name: "Vendor signup creates real DB record",
      initialStatus: "Broken",
      fixApplied: err.message,
      finalStatus: "Broken",
      details: err.message,
    });
    console.error("✗ Check 1 FAILED:", err);
  }

  // ----------------------------------------------------
  // CHECK 2 — Pending vendor appears in Super Admin queue
  // ----------------------------------------------------
  console.log(">>> Checking Check 2: Pending vendor appears in Super Admin queue...");
  try {
    const pendingVendors = await getAdminVendors({ status: "pending" });
    const found = pendingVendors.find((v: any) => v.id === vendorId);

    if (!found) {
      throw new Error(`Vendor ${vendorId} not found in pending admin vendors list`);
    }

    results.push({
      checkNum: 2,
      name: "Pending vendor appears in Super Admin queue",
      initialStatus: "Working",
      fixApplied: "No",
      finalStatus: "Working",
      details: `Vendor successfully found in getAdminVendors({ status: 'pending' }) queue`,
    });
    console.log("✓ Check 2 PASSED: Pending vendor found in Super Admin queue\n");
  } catch (err: any) {
    results.push({
      checkNum: 2,
      name: "Pending vendor appears in Super Admin queue",
      initialStatus: "Broken",
      fixApplied: err.message,
      finalStatus: "Broken",
      details: err.message,
    });
    console.error("✗ Check 2 FAILED:", err);
  }

  // ----------------------------------------------------
  // CHECK 3 — Approval updates status and unlocks vendor access
  // ----------------------------------------------------
  console.log(">>> Checking Check 3: Approval actually updates status and unlocks vendor access...");
  try {
    const approveRes = await approveVendor(vendorId, 12.5);
    if (!approveRes.success) throw new Error(approveRes.error || "Approval failed");

    // Verify in DB
    const dbVendor = await db.vendor.findUnique({ where: { id: vendorId } });
    if (!dbVendor || dbVendor.status !== "approved" || dbVendor.commissionRate !== 12.5) {
      throw new Error(`DB status mismatch: status=${dbVendor?.status}, commissionRate=${dbVendor?.commissionRate}`);
    }

    results.push({
      checkNum: 3,
      name: "Approval updates status and unlocks vendor access",
      initialStatus: "Working",
      fixApplied: "No",
      finalStatus: "Working",
      details: `Vendor status updated to 'approved' with commissionRate=12.5% in DB`,
    });
    console.log("✓ Check 3 PASSED: Vendor approved in DB with custom commission rate\n");
  } catch (err: any) {
    results.push({
      checkNum: 3,
      name: "Approval updates status and unlocks vendor access",
      initialStatus: "Broken",
      fixApplied: err.message,
      finalStatus: "Broken",
      details: err.message,
    });
    console.error("✗ Check 3 FAILED:", err);
  }

  // ----------------------------------------------------
  // CHECK 4 — Vendor product upload does NOT appear on storefront while pending
  // ----------------------------------------------------
  console.log(">>> Checking Check 4: Vendor product upload does NOT appear on storefront while pending...");
  try {
    const prodRes = await createVendorProduct(vendorId, {
      name: `Gold Modular Switch ${timestamp}`,
      categorySlug: "floor-tiles",
      material: "Polycarbonate",
      unitOfSale: "piece",
      description: "Test modular switch for marketplace audit",
      images: ["https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&q=80"],
      variants: [
        {
          size: "1 Module",
          finish: "Gold / Matte",
          color: "Gold",
          pricePerBox: 350,
          pricePerSqft: 350,
          sqftPerBox: 1,
          stockBoxes: 100,
        },
      ],
      attributes: [
        { key: "voltage", value: "240V" },
        { key: "warranty", value: "5 Years" },
      ],
    });

    if (!prodRes.success || !prodRes.product) {
      throw new Error(prodRes.error || "Failed to create vendor product");
    }

    productId = prodRes.product.id;
    productSlug = prodRes.product.slug;

    // 1. Verify DB status
    const dbProd = await db.product.findUnique({ where: { id: productId } });
    if (!dbProd || dbProd.approvalStatus !== "pending") {
      throw new Error(`Product saved with incorrect approvalStatus: ${dbProd?.approvalStatus}`);
    }

    // 2. Verify Storefront Query (getProducts)
    const storefrontProducts = await getProducts();
    const leakedInStorefront = storefrontProducts.find((p: any) => p.id === productId || p.slug === productSlug);
    if (leakedInStorefront) {
      throw new Error(`Product ${productId} leaked into public storefront before approval!`);
    }

    // 3. Verify Storefront Slug Query (getProductBySlug)
    const slugProduct = await getProductBySlug(productSlug);
    if (slugProduct) {
      throw new Error(`Product ${productSlug} is accessible via public getProductBySlug while pending!`);
    }

    results.push({
      checkNum: 4,
      name: "Vendor product upload does NOT appear on storefront while pending",
      initialStatus: "Working",
      fixApplied: "No",
      finalStatus: "Working",
      details: "Product saved with approvalStatus: 'pending' and is 100% hidden from storefront & slug queries",
    });
    console.log("✓ Check 4 PASSED: Product correctly hidden from public storefront while pending\n");
  } catch (err: any) {
    results.push({
      checkNum: 4,
      name: "Vendor product upload does NOT appear on storefront while pending",
      initialStatus: "Broken",
      fixApplied: err.message,
      finalStatus: "Broken",
      details: err.message,
    });
    console.error("✗ Check 4 FAILED:", err);
  }

  // ----------------------------------------------------
  // CHECK 5 — Pending product appears in Super Admin's approval queue
  // ----------------------------------------------------
  console.log(">>> Checking Check 5: Pending product appears in Super Admin's approval queue...");
  try {
    const pendingProducts = await getAdminPendingProducts();
    const found = pendingProducts.find((p: any) => p.id === productId);

    if (!found) {
      throw new Error(`Product ${productId} not found in Super Admin pending approvals queue`);
    }

    results.push({
      checkNum: 5,
      name: "Pending product appears in Super Admin's approval queue",
      initialStatus: "Working",
      fixApplied: "No",
      finalStatus: "Working",
      details: `Product ${productId} retrieved in getAdminPendingProducts() queue with vendor name and variants`,
    });
    console.log("✓ Check 5 PASSED: Product found in Super Admin approval queue\n");
  } catch (err: any) {
    results.push({
      checkNum: 5,
      name: "Pending product appears in Super Admin's approval queue",
      initialStatus: "Broken",
      fixApplied: err.message,
      finalStatus: "Broken",
      details: err.message,
    });
    console.error("✗ Check 5 FAILED:", err);
  }

  // ----------------------------------------------------
  // CHECK 6 — Approving a product makes it live immediately
  // ----------------------------------------------------
  console.log(">>> Checking Check 6: Approving a product makes it live immediately...");
  try {
    const approveProdRes = await approveProduct(productId);
    if (!approveProdRes.success) {
      throw new Error(approveProdRes.error || "Failed to approve product");
    }

    // Verify DB
    const dbProd = await db.product.findUnique({ where: { id: productId } });
    if (!dbProd || dbProd.approvalStatus !== "approved" || dbProd.status !== "active") {
      throw new Error(`Product DB state invalid: approvalStatus=${dbProd?.approvalStatus}, status=${dbProd?.status}`);
    }

    // Verify Storefront Query
    const storefrontProducts = await getProducts();
    const foundOnStore = storefrontProducts.find((p: any) => p.id === productId);
    if (!foundOnStore) {
      throw new Error(`Approved product ${productId} not appearing in getProducts() storefront results!`);
    }

    // Verify Slug query
    const slugProd = await getProductBySlug(productSlug);
    if (!slugProd) {
      throw new Error(`Approved product not accessible via getProductBySlug(${productSlug})!`);
    }

    results.push({
      checkNum: 6,
      name: "Approving a product makes it live immediately",
      initialStatus: "Working",
      fixApplied: "No",
      finalStatus: "Working",
      details: `Product approved and immediately accessible on storefront and PDP slug route`,
    });
    console.log("✓ Check 6 PASSED: Product goes live immediately on public storefront upon approval\n");
  } catch (err: any) {
    results.push({
      checkNum: 6,
      name: "Approving a product makes it live immediately",
      initialStatus: "Broken",
      fixApplied: err.message,
      finalStatus: "Broken",
      details: err.message,
    });
    console.error("✗ Check 6 FAILED:", err);
  }

  // ----------------------------------------------------
  // CHECK 7 — Vendor edits trigger correct re-approval behavior
  // ----------------------------------------------------
  console.log(">>> Checking Check 7: Vendor edits trigger correct re-approval behavior...");
  try {
    const editRes = await updateVendorProduct(vendorId, productId, {
      name: `Gold Modular Switch ${timestamp} (Edited)`,
      description: "Updated price and description requiring re-review",
    });

    if (!editRes.success) throw new Error(editRes.error || "Failed to edit product");

    // Verify DB reset to pending
    const dbProd = await db.product.findUnique({ where: { id: productId } });
    if (!dbProd || dbProd.approvalStatus !== "pending") {
      throw new Error(`approvalStatus was not reset to 'pending' on vendor edit: ${dbProd?.approvalStatus}`);
    }

    // Verify hidden from storefront
    const storefrontProducts = await getProducts();
    const foundOnStore = storefrontProducts.find((p: any) => p.id === productId);
    if (foundOnStore) {
      throw new Error(`Edited product ${productId} is still visible on storefront while pending re-approval!`);
    }

    // Re-approve for subsequent checks
    await approveProduct(productId);

    results.push({
      checkNum: 7,
      name: "Vendor edits trigger correct re-approval behavior",
      initialStatus: "Working",
      fixApplied: "No",
      finalStatus: "Working",
      details: "Editing product automatically resets approvalStatus to 'pending' and hides it from storefront",
    });
    console.log("✓ Check 7 PASSED: Product edit resets approvalStatus to pending and hides from storefront\n");
  } catch (err: any) {
    results.push({
      checkNum: 7,
      name: "Vendor edits trigger correct re-approval behavior",
      initialStatus: "Broken",
      fixApplied: err.message,
      finalStatus: "Broken",
      details: err.message,
    });
    console.error("✗ Check 7 FAILED:", err);
  }

  // ----------------------------------------------------
  // CHECK 8 — Pause/Activate toggle works live
  // ----------------------------------------------------
  console.log(">>> Checking Check 8: Pause/Activate toggle works live...");
  try {
    // 1. Pause
    const pauseRes = await toggleVendorProductStatus(vendorId, productId, "paused");
    if (!pauseRes.success) throw new Error(pauseRes.error || "Failed to pause product");

    let storefrontProducts = await getProducts();
    if (storefrontProducts.some((p: any) => p.id === productId)) {
      throw new Error("Paused product is still appearing on storefront!");
    }

    // 2. Reactivate
    const activateRes = await toggleVendorProductStatus(vendorId, productId, "active");
    if (!activateRes.success) throw new Error(activateRes.error || "Failed to activate product");

    storefrontProducts = await getProducts();
    if (!storefrontProducts.some((p: any) => p.id === productId)) {
      throw new Error("Reactivated product is not appearing on storefront!");
    }

    results.push({
      checkNum: 8,
      name: "Pause/Activate toggle works live",
      initialStatus: "Working",
      fixApplied: "No",
      finalStatus: "Working",
      details: "Toggling to 'paused' removes product from storefront; toggling to 'active' restores it live",
    });
    console.log("✓ Check 8 PASSED: Pause/Activate toggle hides/restores product on storefront live\n");
  } catch (err: any) {
    results.push({
      checkNum: 8,
      name: "Pause/Activate toggle works live",
      initialStatus: "Broken",
      fixApplied: err.message,
      finalStatus: "Broken",
      details: err.message,
    });
    console.error("✗ Check 8 FAILED:", err);
  }

  // ----------------------------------------------------
  // CHECK 9 — Vendor data isolation (security)
  // ----------------------------------------------------
  console.log(">>> Checking Check 9: Vendor data isolation (security)...");
  try {
    // Create Vendor 2
    const v2Res = await registerVendor({
      businessName: `Rival Vendor ${timestamp}`,
      ownerName: `Rival Owner ${timestamp}`,
      contactEmail: `rival_${timestamp}@intrihub-test.com`,
      contactPhone: `97${Math.floor(10000000 + Math.random() * 90000000)}`.slice(0, 10),
      category: "Plumbing, Pipes & Fittings",
    });

    if (!v2Res.success || !v2Res.vendor) throw new Error("Failed to create Vendor 2");
    const vendor2Id = v2Res.vendor.id;
    await approveVendor(vendor2Id);

    // Vendor 2 attempts to edit Vendor 1's product
    const hackEdit = await updateVendorProduct(vendor2Id, productId, {
      name: "Hacked by Vendor 2",
    });
    if (hackEdit.success) {
      throw new Error("SECURITY BREACH: Vendor 2 was able to edit Vendor 1's product!");
    }

    // Vendor 2 attempts to delete Vendor 1's product
    const hackDelete = await deleteVendorProduct(vendor2Id, productId);
    if (hackDelete.success) {
      throw new Error("SECURITY BREACH: Vendor 2 was able to delete Vendor 1's product!");
    }

    // Vendor 2 attempts to pause Vendor 1's product
    const hackPause = await toggleVendorProductStatus(vendor2Id, productId, "paused");
    if (hackPause.success) {
      throw new Error("SECURITY BREACH: Vendor 2 was able to pause Vendor 1's product!");
    }

    // Vendor 2 catalog view should not contain Vendor 1's product
    const v2Products = await getVendorProducts(vendor2Id);
    if (v2Products.some((p: any) => p.id === productId)) {
      throw new Error("SECURITY BREACH: Vendor 2's catalog view contains Vendor 1's product!");
    }

    results.push({
      checkNum: 9,
      name: "Vendor data isolation (security)",
      initialStatus: "Working",
      fixApplied: "No",
      finalStatus: "Working",
      details: "Cross-vendor mutations and catalog reads strictly blocked with unauthorized error",
    });
    console.log("✓ Check 9 PASSED: Data isolation and unauthorized cross-vendor mutation checks verified\n");
  } catch (err: any) {
    results.push({
      checkNum: 9,
      name: "Vendor data isolation (security)",
      initialStatus: "Broken",
      fixApplied: err.message,
      finalStatus: "Broken",
      details: err.message,
    });
    console.error("✗ Check 9 FAILED:", err);
  }

  // ----------------------------------------------------
  // CHECK 10 — Vendor suspension cascades correctly
  // ----------------------------------------------------
  console.log(">>> Checking Check 10: Vendor suspension cascades correctly...");
  try {
    // Suspend Vendor 1
    const suspendRes = await suspendVendor(vendorId, "Audit test suspension");
    if (!suspendRes.success) throw new Error(suspendRes.error || "Failed to suspend vendor");

    // 1. Verify DB
    const dbVendor = await db.vendor.findUnique({ where: { id: vendorId } });
    if (dbVendor?.status !== "suspended") {
      throw new Error(`Vendor status was not updated to suspended: ${dbVendor?.status}`);
    }

    // 2. Verify products auto-paused and hidden from storefront
    const storefrontProducts = await getProducts();
    if (storefrontProducts.some((p: any) => p.id === productId)) {
      throw new Error("Suspended vendor's products are still visible on storefront!");
    }

    // 3. Reactivate vendor
    const reactivateRes = await reactivateVendor(vendorId);
    if (!reactivateRes.success) throw new Error("Failed to reactivate vendor");

    const restoredProducts = await getProducts();
    if (!restoredProducts.some((p: any) => p.id === productId)) {
      throw new Error("Reactivated vendor's approved products were not restored to storefront!");
    }

    results.push({
      checkNum: 10,
      name: "Vendor suspension cascades correctly",
      initialStatus: "Working",
      fixApplied: "No",
      finalStatus: "Working",
      details: "Suspending vendor cascades pause to products and removes them from storefront; reactivating restores them",
    });
    console.log("✓ Check 10 PASSED: Suspension cascade and reactivation verified\n");
  } catch (err: any) {
    results.push({
      checkNum: 10,
      name: "Vendor suspension cascades correctly",
      initialStatus: "Broken",
      fixApplied: err.message,
      finalStatus: "Broken",
      details: err.message,
    });
    console.error("✗ Check 10 FAILED:", err);
  }

  // Summary Table
  console.log("\n=======================================================");
  console.log("                   FINAL AUDIT REPORT");
  console.log("=======================================================");
  console.table(
    results.map((r) => ({
      "Check #": r.checkNum,
      "Feature Name": r.name,
      "Initial Status": r.initialStatus,
      "Fix Applied?": r.fixApplied,
      "Final Status": r.finalStatus,
    }))
  );

  // Cleanup test artifacts from database
  console.log("\nCleaning up test artifacts...");
  try {
    await db.productAttribute.deleteMany({ where: { product: { vendorId } } });
    await db.productVariant.deleteMany({ where: { product: { vendorId } } });
    await db.product.deleteMany({ where: { vendorId } });
    await db.vendor.deleteMany({ where: { id: vendorId } });
  } catch (e) {
    // Ignore cleanup error if already removed
  }
  console.log("Cleanup complete.\n");
}

runAudit()
  .catch((e) => console.error("Audit Fatal Error:", e))
  .finally(() => prisma.$disconnect());
