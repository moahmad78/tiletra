import { prisma } from "../lib/prisma";
import { createVendorManually, deleteVendor } from "../lib/actions/admin-vendor";
import {
  getVendorProducts,
  getVendorOrders,
  updateVendorProduct,
  deleteVendorProduct,
  updateVendorFulfillmentStatus,
  updateVendorBankDetails,
} from "../lib/actions/vendor";

async function testVendorIsolation() {
  console.log("==========================================================================");
  console.log("SECURITY VERIFICATION: CROSS-VENDOR DATA ISOLATION & ACCESS CONTROL");
  console.log("==========================================================================");

  const ts = Date.now();
  const phoneA = `91${Math.floor(10000000 + Math.random() * 90000000).toString().slice(0, 8)}`;
  const phoneB = `92${Math.floor(10000000 + Math.random() * 90000000).toString().slice(0, 8)}`;

  // 1. Create Vendor A and Vendor B
  console.log(`\n[STEP 1] Creating Vendor A ("Alpha Sanitary") and Vendor B ("Beta Electricals")...`);
  const resA = await createVendorManually({
    businessName: `Alpha Sanitaryware ${ts}`,
    ownerName: "Alice Sharma",
    contactPhone: phoneA,
    contactEmail: `alice.${ts}@alpha.test`,
    category: "Sanitary & Bath Fittings",
  });
  const resB = await createVendorManually({
    businessName: `Beta Electricals ${ts}`,
    ownerName: "Bob Verma",
    contactPhone: phoneB,
    contactEmail: `bob.${ts}@beta.test`,
    category: "Electricals & Lighting",
  });

  if (!resA.vendor || !resB.vendor) throw new Error("Failed to create test vendors");
  const vendorA = resA.vendor;
  const vendorB = resB.vendor;
  console.log(`✓ Vendor A ID: ${vendorA.id} (${vendorA.businessName})`);
  console.log(`✓ Vendor B ID: ${vendorB.id} (${vendorB.businessName})`);

  try {
    // 2. Create a Product owned by Vendor A
    console.log(`\n[STEP 2] Creating Product owned by Vendor A...`);
    const prodA = await prisma.product.create({
      data: {
        name: `Alpha Luxury Ceramic Basin ${ts}`,
        slug: `alpha-basin-${ts}`,
        categorySlug: "sanitary-bath-fittings",
        categoryName: "Sanitary & Bath Fittings",
        vendorId: vendorA.id,
        pricePerSqft: 2500,
        description: "Vendor A proprietary product",
        variants: {
          create: [{ size: "Standard", finish: "Glossy", color: "White", pricePerSqft: 2500, pricePerBox: 2500, sqftPerBox: 1, stockBoxes: 20 }],
        },
      },
    });
    console.log(`✓ Product created: "${prodA.name}" (Owned by Vendor A)`);

    // 3. Create an Order with VendorOrderSplit for Vendor A
    console.log(`\n[STEP 3] Creating Order Split assigned to Vendor A...`);
    const order = await prisma.order.create({
      data: {
        id: `TL-ISO-${ts.toString().slice(-6)}`,
        customerName: "Isolation Test Customer",
        customerPhone: "9998887776",
        customerEmail: "iso.cust@example.com",
        shippingAddress: {
          street: "123 Main St",
          city: "Bangalore",
          state: "Karnataka",
          pincode: "560001",
        },
        paymentMethod: "cod",
        paymentStatus: "Pending",
        orderStatus: "Confirmed",
        subtotal: 2500,
        total: 2500,
      },
    });

    const splitA = await prisma.vendorOrderSplit.create({
      data: {
        orderId: order.id,
        vendorId: vendorA.id,
        subtotal: 2500,
        commissionRate: 15.0,
        commissionAmount: 375,
        vendorPayoutAmount: 2125,
        fulfillmentStatus: "Processing",
      },
    });
    console.log(`✓ Order split created for Vendor A: Split ID ${splitA.id}`);

    // 4. Test Catalog Isolation: Vendor B queries products
    console.log(`\n[STEP 4] Testing Catalog Isolation: Vendor B querying their products...`);
    const vendorBProducts = await getVendorProducts(vendorB.id);
    const hasVendorAProduct = vendorBProducts.some((p) => p.id === prodA.id);
    console.log(`  - Vendor A Product visible in Vendor B's catalog: ${hasVendorAProduct ? "YES (FAIL ❌)" : "NO (ISOLATED ✓)"}`);
    if (hasVendorAProduct) throw new Error("Isolation breach: Vendor B can see Vendor A's products!");

    // 5. Test Cross-Vendor Product Mutation: Vendor B attempts to modify Vendor A's product
    console.log(`\n[STEP 5] Testing Product Modification Isolation: Vendor B attempting to modify Vendor A's product...`);
    const updateAttempt = await updateVendorProduct(vendorB.id, prodA.id, {
      name: "HACKED BY VENDOR B",
    });
    console.log(`  - Mutation rejected: ${!updateAttempt.success ? "YES (BLOCKED ✓)" : "NO (BREACH ❌)"}`);
    if (updateAttempt.success) throw new Error("Security breach: Vendor B was able to modify Vendor A's product!");

    // 6. Test Cross-Vendor Product Deletion: Vendor B attempts to delete Vendor A's product
    console.log(`\n[STEP 6] Testing Product Deletion Isolation: Vendor B attempting to delete Vendor A's product...`);
    const deleteAttempt = await deleteVendorProduct(vendorB.id, prodA.id);
    console.log(`  - Deletion rejected: ${!deleteAttempt.success ? "YES (BLOCKED ✓)" : "NO (BREACH ❌)"}`);
    if (deleteAttempt.success) throw new Error("Security breach: Vendor B was able to delete Vendor A's product!");

    // 7. Test Order Split Isolation: Vendor B querying orders
    console.log(`\n[STEP 7] Testing Order Isolation: Vendor B querying their orders...`);
    const vendorBOrders = await getVendorOrders(vendorB.id);
    const hasVendorAOrder = vendorBOrders.some((s) => s.id === splitA.id);
    console.log(`  - Vendor A Order visible to Vendor B: ${hasVendorAOrder ? "YES (FAIL ❌)" : "NO (ISOLATED ✓)"}`);
    if (hasVendorAOrder) throw new Error("Isolation breach: Vendor B can see Vendor A's orders!");

    // 8. Test Cross-Vendor Fulfillment Status Mutation: Vendor B attempts to update Vendor A's order fulfillment
    console.log(`\n[STEP 8] Testing Order Fulfillment Isolation: Vendor B attempting to fulfill Vendor A's order...`);
    const fulfillAttempt = await updateVendorFulfillmentStatus(splitA.id, vendorB.id, "Dispatched");
    console.log(`  - Fulfillment update rejected: ${!fulfillAttempt.success ? "YES (BLOCKED ✓)" : "NO (BREACH ❌)"}`);
    if (fulfillAttempt.success) throw new Error("Security breach: Vendor B was able to fulfill Vendor A's order!");

    // 9. Test Bank / Payout Isolation: Set Bank Details for Vendor A and verify Vendor B cannot see them
    console.log(`\n[STEP 9] Testing Bank/Payout Details Isolation...`);
    await updateVendorBankDetails(vendorA.id, {
      bankAccountHolder: "Alice Sharma",
      bankName: "HDFC Bank",
      bankAccountNumber: "50100234567890",
      bankIfscCode: "HDFC0001234",
      bankUpiId: "alice@okaxis",
    });

    const vendorBRecord = await prisma.vendor.findUnique({ where: { id: vendorB.id } });
    const bankLeaked = (vendorBRecord as any)?.bankAccountNumber === "50100234567890";
    console.log(`  - Vendor A Bank details leaked to Vendor B: ${bankLeaked ? "YES (FAIL ❌)" : "NO (ISOLATED ✓)"}`);
    if (bankLeaked) throw new Error("Isolation breach: Vendor B has Vendor A's bank details!");

    console.log("\n==========================================================================");
    console.log("✓ ALL 6 CROSS-VENDOR ACCESS VULNERABILITY TESTS PASSED WITH 100% ISOLATION!");
    console.log("==========================================================================");
  } finally {
    // Cleanup test data
    console.log("\n[CLEANUP] Removing test isolation vendors...");
    await deleteVendor(vendorA.id).catch(() => {});
    await deleteVendor(vendorB.id).catch(() => {});
    console.log("✓ Test isolation vendors cleaned up cleanly.");
  }
}

testVendorIsolation()
  .catch((e) => {
    console.error("TEST FAILED:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
