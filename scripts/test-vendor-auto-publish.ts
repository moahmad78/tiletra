import { prisma } from "../lib/prisma";
import { toggleVendorAutoPublish, createVendorProduct } from "../lib/actions/vendor";

async function main() {
  console.log("🚀 Running Test: Per-Vendor Auto-Publish Feature...\n");

  // 1. Ensure test user & vendor exist
  let testUser = await prisma.user.findFirst({
    where: { phone: "9876543210" },
  });

  if (!testUser) {
    testUser = await prisma.user.create({
      data: {
        phone: "9876543210",
        name: "Auto Publish Test Seller",
        email: "autopublish@seller.com",
        role: "vendor",
      },
    });
  }

  let vendor = await prisma.vendor.findUnique({
    where: { ownerId: testUser.id },
  });

  if (!vendor) {
    vendor = await prisma.vendor.create({
      data: {
        businessName: "Elite Quality Materials",
        slug: "elite-quality-materials",
        ownerId: testUser.id,
        contactEmail: "autopublish@seller.com",
        contactPhone: "9876543210",
        status: "approved",
        category: "Electrical",
        autoPublishEnabled: false,
      },
    });
  }

  console.log(`📌 Test Vendor: "${vendor.businessName}" (ID: ${vendor.id})`);

  // ── TEST 1: Default State (autoPublishEnabled = false) ──
  console.log("\n🧪 Test 1: Submitting product with autoPublishEnabled = FALSE (Default)...");
  await toggleVendorAutoPublish(vendor.id, false);

  const testProd1Slug = `test-wire-pending-${Date.now()}`;
  const res1 = await createVendorProduct(vendor.id, {
    name: "Anchor Standard Wire 1.5mm",
    categorySlug: "electrical",
    material: "Copper",
    description: "Standard electrical wire test submission",
    images: ["/placeholders/product.svg"],
    unitOfSale: "coil",
    coverageRate: 90,
    wastageFactor: 1.1,
    variants: [
      {
        size: "90m",
        finish: "Standard",
        color: "Red",
        pricePerBox: 1500,
        pricePerSqft: 1500,
        sqftPerBox: 90,
        stockBoxes: 20,
      },
    ],
  });

  if (!res1.success || !res1.product) {
    throw new Error(`Test 1 Failed to create product: ${res1.error}`);
  }

  const dbProd1 = await prisma.product.findUnique({ where: { id: res1.product.id } });
  console.log(`   Product ID: ${dbProd1?.id}`);
  console.log(`   approvalStatus: "${dbProd1?.approvalStatus}" (Expected: "pending")`);
  if (dbProd1?.approvalStatus !== "pending") {
    throw new Error(`❌ Test 1 Failed: Expected approvalStatus 'pending', got '${dbProd1?.approvalStatus}'`);
  }
  console.log("   ✅ Test 1 PASSED: Product correctly queued for Super Admin approval.");

  // ── TEST 2: Enable Auto-Publish (autoPublishEnabled = true) ──
  console.log("\n🧪 Test 2: Enabling auto-publish via Super Admin toggle and checking AuditLog...");
  const toggleRes = await toggleVendorAutoPublish(vendor.id, true);
  if (!toggleRes.success) {
    throw new Error(`Failed to toggle auto-publish: ${toggleRes.error}`);
  }

  // Check audit log
  const auditEntry = await prisma.auditLog.findFirst({
    where: {
      action: "VENDOR_AUTO_PUBLISH_TOGGLED",
      entityId: vendor.id,
    },
    orderBy: { createdAt: "desc" },
  });

  console.log(`   AuditLog Entry Found: Action="${auditEntry?.action}", Details=${JSON.stringify(auditEntry?.details)}`);
  if (!auditEntry) {
    throw new Error("❌ Test 2 Failed: No AuditLog entry recorded for auto-publish toggle");
  }
  console.log("   ✅ AuditLog verified.");

  console.log("   Submitting product with autoPublishEnabled = TRUE...");
  const res2 = await createVendorProduct(vendor.id, {
    name: "Havells Heavy Duty Cable 4.0mm",
    categorySlug: "electrical",
    material: "FR Copper",
    description: "Heavy duty industrial cable test submission",
    images: ["/placeholders/product.svg"],
    unitOfSale: "coil",
    coverageRate: 90,
    wastageFactor: 1.1,
    variants: [
      {
        size: "90m",
        finish: "Standard",
        color: "Blue",
        pricePerBox: 3500,
        pricePerSqft: 3500,
        sqftPerBox: 90,
        stockBoxes: 50,
      },
    ],
  });

  if (!res2.success || !res2.product) {
    throw new Error(`Test 2 Failed to create product: ${res2.error}`);
  }

  const dbProd2 = await prisma.product.findUnique({ where: { id: res2.product.id } });
  console.log(`   Product ID: ${dbProd2?.id}`);
  console.log(`   approvalStatus: "${dbProd2?.approvalStatus}" (Expected: "approved")`);
  console.log(`   status: "${dbProd2?.status}" (Expected: "active")`);
  if (dbProd2?.approvalStatus !== "approved" || dbProd2?.status !== "active") {
    throw new Error(`❌ Test 2 Failed: Expected approvalStatus 'approved' and status 'active', got approvalStatus='${dbProd2?.approvalStatus}' status='${dbProd2?.status}'`);
  }
  console.log("   ✅ Test 2 PASSED: Trusted vendor product went live INSTANTLY without approval queue.");

  // ── TEST 3: Disable Auto-Publish (autoPublishEnabled = false) ──
  console.log("\n🧪 Test 3: Disabling auto-publish and verifying immediate revocation on next submission...");
  await toggleVendorAutoPublish(vendor.id, false);

  const res3 = await createVendorProduct(vendor.id, {
    name: "Finolex 3-Core Submersible Cable",
    categorySlug: "electrical",
    material: "PVC Copper",
    description: "Submersible cable test submission after revocation",
    images: ["/placeholders/product.svg"],
    unitOfSale: "coil",
    coverageRate: 100,
    wastageFactor: 1.1,
    variants: [
      {
        size: "100m",
        finish: "Standard",
        color: "Black",
        pricePerBox: 4200,
        pricePerSqft: 4200,
        sqftPerBox: 100,
        stockBoxes: 10,
      },
    ],
  });

  if (!res3.success || !res3.product) {
    throw new Error(`Test 3 Failed to create product: ${res3.error}`);
  }

  const dbProd3 = await prisma.product.findUnique({ where: { id: res3.product.id } });
  console.log(`   Product ID: ${dbProd3?.id}`);
  console.log(`   approvalStatus: "${dbProd3?.approvalStatus}" (Expected: "pending")`);
  if (dbProd3?.approvalStatus !== "pending") {
    throw new Error(`❌ Test 3 Failed: Expected approvalStatus 'pending', got '${dbProd3?.approvalStatus}'`);
  }
  console.log("   ✅ Test 3 PASSED: Revocation took effect immediately; submission requires review again.");

  // Cleanup test products
  await prisma.product.deleteMany({
    where: {
      id: { in: [dbProd1?.id, dbProd2?.id, dbProd3?.id].filter(Boolean) as string[] },
    },
  });

  console.log("\n🎉 ALL AUTO-PUBLISH TESTS PASSED SUCCESSFULLY! Cleaned up test data.");
}

main()
  .catch((e) => {
    console.error("Test execution failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
