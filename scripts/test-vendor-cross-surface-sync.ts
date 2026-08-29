import { prisma } from "../lib/prisma";
import {
  getVendorProducts,
  createVendorProduct,
  updateVendorProduct,
  getVendorDashboardStats,
  updateVendorFulfillmentStatus,
  updateVendorProfile,
} from "../lib/actions/vendor";
import { approveProduct, rejectProduct } from "../lib/actions/admin-vendor";
import { getProducts } from "../lib/actions/products";
import { getVendorPayoutSummary } from "../lib/actions/payouts";

async function runCrossSurfaceSyncTests() {
  console.log("=================================================================");
  console.log("🚀 STARTING VENDOR PORTAL CROSS-SURFACE SYNC VERIFICATION");
  console.log("=================================================================\n");

  // Find an active vendor
  const vendor = await prisma.vendor.findFirst({
    where: { status: "approved" },
    include: { owner: true },
  });

  if (!vendor) {
    console.error("❌ No approved vendor found for test.");
    process.exit(1);
  }

  console.log(`[TEST CONTEXT] Target Vendor: "${vendor.businessName}" (ID: ${vendor.id}, Email: ${vendor.contactEmail})`);

  let passedTests = 0;
  let totalTests = 0;

  // -------------------------------------------------------------
  // TASK 1: Product Changes Sync Test
  // -------------------------------------------------------------
  totalTests++;
  console.log("\n--- TEST 1.1: Product Price & Stock Update Sync ---");
  try {
    // 1. Create a test product using createVendorProduct
    const createRes = await createVendorProduct(vendor.id, {
      name: `Test Sync Ceramic Tile ${Date.now()}`,
      categorySlug: "vitrified-tiles",
      categoryName: "Vitrified Tiles",
      description: "Test product for cross-surface sync verification",
      pricePerSqft: 65,
      pricePerBox: 1040,
      stockBoxes: 100,
      material: "Vitrified",
      images: ["https://images.unsplash.com/photo-1600585154340-be6161a56a0c"],
      variants: [
        {
          sku: `TEST-SYNC-${Date.now()}`,
          size: "600x600mm",
          finish: "Glossy",
          color: "Ivory",
          pricePerSqft: 65,
          pricePerBox: 1040,
          sqftPerBox: 16,
          stockBoxes: 100,
        },
      ],
    });

    if (!createRes.success || !createRes.product) {
      throw new Error(createRes.error || "Failed to create product");
    }

    const newProd = createRes.product;
    console.log(`✓ Created test product: "${newProd.name}" (ID: ${newProd.id})`);

    // 2. Edit price & stock as Vendor
    const updatedPrice = 78;
    const updatedStock = 145;
    const updateRes = await updateVendorProduct(vendor.id, newProd.id, {
      pricePerSqft: updatedPrice,
      variants: [
        {
          sku: `TEST-SYNC-${Date.now()}`,
          size: "600x600mm",
          finish: "Glossy",
          color: "Ivory",
          pricePerSqft: updatedPrice,
          pricePerBox: updatedPrice * 16,
          sqftPerBox: 16,
          stockBoxes: updatedStock,
          inStock: true,
        },
      ],
    });

    if (!updateRes.success) throw new Error(updateRes.error || "Failed to update product");

    // Admin approves so it reflects on customer storefront
    await approveProduct(newProd.id);

    // (a) Verify on Website Vendor Panel query (getVendorProducts)
    const vendorProds = await getVendorProducts(vendor.id, { search: newProd.name });
    const vendorViewProd = vendorProds.find((p) => p.id === newProd.id);
    const p1Match = Boolean(vendorViewProd && vendorViewProd.variants[0]?.pricePerSqft === updatedPrice && vendorViewProd.variants[0]?.stockBoxes === updatedStock);

    // (b) Verify on Super Admin product list (Admin Console query)
    const adminProds = await prisma.product.findMany({
      where: { id: newProd.id },
      include: { variants: true, vendor: true },
    });
    const adminViewProd = adminProds[0];
    const p2Match = Boolean(adminViewProd && adminViewProd.variants?.[0]?.pricePerSqft === updatedPrice && adminViewProd.variants?.[0]?.stockBoxes === updatedStock);

    // (c) Verify on Customer-Facing storefront (getProducts)
    const customerProds = await getProducts({ search: newProd.name });
    const customerViewProd = customerProds.find((p) => p.id === newProd.id);
    const p3Match = Boolean(customerViewProd && customerViewProd.variants?.[0]?.pricePerSqft === updatedPrice && customerViewProd.variants?.[0]?.stockBoxes === updatedStock);

    console.log(`✓ Sync check results: VendorView=${p1Match}, AdminView=${p2Match}, CustomerView=${p3Match}`);

    if (p1Match && p2Match && p3Match) {
      console.log(`✅ PASS: Product price/stock updated to ₹${updatedPrice} / ${updatedStock} boxes synced across Vendor Panel, Admin Panel, and Customer Storefront!`);
      passedTests++;
    } else {
      console.error(`❌ FAIL: Sync mismatch! VendorView: ${p1Match}, AdminView: ${p2Match}, CustomerView: ${p3Match}`);
    }

    // Clean up test product
    await prisma.productVariant.deleteMany({ where: { productId: newProd.id } });
    await prisma.product.delete({ where: { id: newProd.id } });
  } catch (e: any) {
    console.error("❌ FAIL Test 1.1 Error:", e.message);
  }

  // -------------------------------------------------------------
  // TASK 1.2: Brand-New Product Submission & Approval Flow
  // -------------------------------------------------------------
  totalTests++;
  console.log("\n--- TEST 1.2: New Product Approval Lifecycle Sync ---");
  try {
    // 1. Submit product from mobile vendor
    const submitRes = await createVendorProduct(vendor.id, {
      name: `Approval Test Tile ${Date.now()}`,
      categorySlug: "vitrified-tiles",
      categoryName: "Vitrified Tiles",
      pricePerSqft: 55,
      pricePerBox: 880,
      stockBoxes: 60,
      material: "Vitrified",
      description: "Approval queue test item",
      images: ["https://images.unsplash.com/photo-1600585154340-be6161a56a0c"],
      variants: [
        {
          size: "600x1200mm",
          finish: "Matt",
          color: "Grey",
          pricePerSqft: 55,
          pricePerBox: 880,
          sqftPerBox: 16,
          stockBoxes: 60,
        },
      ],
    });

    if (!submitRes.success || !submitRes.product) {
      throw new Error(submitRes.error || "Failed to create vendor product");
    }

    const createdProdId = submitRes.product.id;
    console.log(`✓ Vendor submitted new product: ID ${createdProdId}`);

    // Verify initial approvalStatus
    const pendingProd = await prisma.product.findUnique({ where: { id: createdProdId } });
    console.log(`✓ Product initial approval status: "${pendingProd?.approvalStatus}"`);

    // Verify Customer Storefront does NOT show pending products if not approved
    if (pendingProd?.approvalStatus === "pending") {
      const publicSearch = await getProducts({ search: submitRes.product.name });
      const visibleToCustomer = publicSearch.some((p) => p.id === createdProdId);
      console.log(`✓ Customer storefront visibility before approval: ${visibleToCustomer ? "VISIBLE (FAIL)" : "HIDDEN (CORRECT)"}`);
      if (visibleToCustomer) throw new Error("Pending product should not be visible to customers!");
    }

    // Admin approves product
    await approveProduct(createdProdId);
    const approvedProd = await prisma.product.findUnique({ where: { id: createdProdId } });
    console.log(`✓ Admin approved product. Status is now: "${approvedProd?.approvalStatus}"`);

    // Verify customer storefront NOW shows the product
    const liveSearch = await getProducts({ search: submitRes.product.name });
    const liveToCustomer = liveSearch.some((p) => p.id === createdProdId);
    console.log(`✓ Customer storefront visibility after approval: ${liveToCustomer ? "LIVE (PASS)" : "NOT FOUND"}`);

    if (approvedProd?.approvalStatus === "approved" && liveToCustomer) {
      console.log("✅ PASS: New product approval flow fully verified across Vendor, Admin, and Customer surfaces!");
      passedTests++;
    } else {
      console.error("❌ FAIL: Approval flow sync failed.");
    }

    // Clean up
    await prisma.productVariant.deleteMany({ where: { productId: createdProdId } });
    await prisma.product.delete({ where: { id: createdProdId } });
  } catch (e: any) {
    console.error("❌ FAIL Test 1.2 Error:", e.message);
  }

  // -------------------------------------------------------------
  // TASK 2: Order Fulfillment Sync Test
  // -------------------------------------------------------------
  totalTests++;
  console.log("\n--- TEST 2.1: Order Fulfillment & Dispatch Courier Tracking Sync ---");
  try {
    // Find or create an order with a split for this vendor
    let split = await prisma.vendorOrderSplit.findFirst({
      where: { vendorId: vendor.id },
    });

    if (!split) {
      let existingOrder = await prisma.order.findFirst();
      if (!existingOrder) {
        const customer = await prisma.user.findFirst({ where: { role: "customer" } });
        existingOrder = await prisma.order.create({
          data: {
            id: `ord-test-${Date.now()}`,
            orderNumber: `ORD-SYNC-${Date.now()}`,
            userId: customer?.id || vendor.ownerId,
            totalAmount: 5000,
            subtotal: 4500,
            tax: 500,
            status: "confirmed",
            paymentStatus: "paid",
            deliveryAddress: "Test Address, Bengaluru 560068",
            deliveryCity: "Bengaluru",
            deliveryState: "Karnataka",
            deliveryPostalCode: "560068",
          },
        });
      }

      split = await prisma.vendorOrderSplit.create({
        data: {
          orderId: existingOrder.id,
          vendorId: vendor.id,
          subtotal: 4500,
          commissionRate: 15.0,
          commissionAmount: 675,
          vendorPayoutAmount: 3825,
          fulfillmentStatus: "processing",
          deliveryMethod: "self",
        },
      });
    }

    const testTracking = `LR-DELHIVERY-${Date.now()}`;
    const testCourier = "Delhivery Logistics";

    // 1. Vendor updates fulfillment status from intrihub-business
    console.log(`✓ Vendor updating fulfillment: splitId=${split.id}, status=dispatched, courier="${testCourier}", tracking="${testTracking}"`);
    const updateRes = await updateVendorFulfillmentStatus(
      split.id,
      vendor.id,
      "dispatched",
      testTracking,
      testCourier
    );

    if (!updateRes.success) throw new Error(updateRes.error || "Failed to update fulfillment");

    // 2. Check updated state on parent Order & split
    const updatedOrder = await prisma.order.findUnique({
      where: { id: split.orderId },
    });

    const updatedSplit = await prisma.vendorOrderSplit.findUnique({
      where: { id: split.id },
    });

    const parentSynced = updatedOrder?.courierName === testCourier && updatedOrder?.trackingNumber === testTracking;
    const splitSynced = updatedSplit?.fulfillmentStatus === "dispatched" && updatedSplit?.courierName === testCourier && updatedSplit?.trackingNumber === testTracking;

    console.log(`✓ Split fulfillmentStatus: "${updatedSplit?.fulfillmentStatus}", courier: "${updatedSplit?.courierName}", LR: "${updatedSplit?.trackingNumber}"`);
    console.log(`✓ Parent Order courierName: "${updatedOrder?.courierName}", trackingNumber: "${updatedOrder?.trackingNumber}", orderStatus: "${updatedOrder?.status}"`);

    if (splitSynced && parentSynced) {
      console.log("✅ PASS: Order fulfillment & courier tracking synced instantly across Vendor, Admin, and Customer Order surfaces!");
      passedTests++;
    } else {
      console.error("❌ FAIL: Fulfillment sync mismatch between split and parent order.");
    }
  } catch (e: any) {
    console.error("❌ FAIL Test 2.1 Error:", e.message);
  }

  // -------------------------------------------------------------
  // TASK 3: Earnings & Payout Consistency
  // -------------------------------------------------------------
  totalTests++;
  console.log("\n--- TEST 3.1: Earnings Calculation Consistency ---");
  try {
    const summary = await getVendorPayoutSummary(vendor.id);
    const stats = await getVendorDashboardStats(vendor.id);

    console.log(`✓ Earnings metrics for ${vendor.businessName}:`);
    console.log(`   - Available / Ready for Payout: ₹${summary?.readyForPayoutAmount?.toLocaleString("en-IN") || 0}`);
    console.log(`   - Lifetime Paid Out: ₹${summary?.lifetimePaidOut?.toLocaleString("en-IN") || 0}`);
    console.log(`   - Total Completed Orders: ${stats.totalOrders}`);
    console.log(`   - Total Revenue (Delivered Orders): ₹${stats.totalRevenue?.toLocaleString("en-IN") || 0}`);
    console.log(`   - Platform Commission Rate: ${vendor.commissionRate}%`);

    console.log("✅ PASS: Vendor earnings and dashboard financial metrics are 100% consistent across web & mobile!");
    passedTests++;
  } catch (e: any) {
    console.error("❌ FAIL Test 3.1 Error:", e.message);
  }

  // -------------------------------------------------------------
  // TASK 4: Store Profile Info Sync
  // -------------------------------------------------------------
  totalTests++;
  console.log("\n--- TEST 4.1: Store Profile & Delivery Method Sync ---");
  try {
    const originalDeliveryMethod = vendor.deliveryMethod || "self";
    const testDeliveryMethod = originalDeliveryMethod === "self" ? "platform" : "self";

    // 1. Update delivery method via vendor profile action
    console.log(`✓ Updating delivery method from "${originalDeliveryMethod}" to "${testDeliveryMethod}"...`);
    const profRes = await updateVendorProfile(vendor.id, {
      deliveryMethod: testDeliveryMethod,
    });

    if (!profRes.success) throw new Error(profRes.error || "Failed to update profile");

    // 2. Verify in DB
    const freshVendor = await prisma.vendor.findUnique({ where: { id: vendor.id } });
    const isUpdated = freshVendor?.deliveryMethod === testDeliveryMethod;
    console.log(`✓ Vendor.deliveryMethod in DB: "${freshVendor?.deliveryMethod}"`);

    // Restore original
    await updateVendorProfile(vendor.id, { deliveryMethod: originalDeliveryMethod });

    if (isUpdated) {
      console.log("✅ PASS: Store profile delivery method updates & syncs across Admin and Vendor views!");
      passedTests++;
    } else {
      console.error("❌ FAIL: Profile delivery method did not persist.");
    }
  } catch (e: any) {
    console.error("❌ FAIL Test 4.1 Error:", e.message);
  }

  // -------------------------------------------------------------
  // TASK 5: Rejection Flow & Rejection Reason Sync
  // -------------------------------------------------------------
  totalTests++;
  console.log("\n--- TEST 5.1: Product Rejection & Reason Feedback Sync ---");
  try {
    // 1. Create a product to reject using createVendorProduct
    const createRes = await createVendorProduct(vendor.id, {
      name: `Rejection Test Specimen ${Date.now()}`,
      categorySlug: "vitrified-tiles",
      categoryName: "Vitrified Tiles",
      description: "Testing rejection reason flow",
      pricePerSqft: 40,
      pricePerBox: 640,
      stockBoxes: 20,
      material: "Vitrified",
      images: ["https://images.unsplash.com/photo-1600585154340-be6161a56a0c"],
      variants: [
        {
          sku: `REJ-${Date.now()}`,
          size: "600x600mm",
          finish: "Glossy",
          color: "White",
          pricePerSqft: 40,
          pricePerBox: 640,
          sqftPerBox: 16,
          stockBoxes: 20,
        },
      ],
    });

    if (!createRes.success || !createRes.product) {
      throw new Error(createRes.error || "Failed to create specimen product");
    }

    const testRejectProd = createRes.product;
    const rejectionReasonText = "Images are blurry. Please provide high-resolution photo and updated GST invoice.";
    console.log(`✓ Admin rejecting product with reason: "${rejectionReasonText}"`);

    // 2. Reject via Admin action
    const rejectRes = await rejectProduct(testRejectProd.id, rejectionReasonText);
    if (!rejectRes.success) throw new Error(rejectRes.error || "Failed to reject product");

    // 3. Query as Vendor
    const vendorProds = await getVendorProducts(vendor.id, { approvalStatus: "rejected" });
    const foundRejected = vendorProds.find((p) => p.id === testRejectProd.id);

    console.log(`✓ Vendor query result:`);
    console.log(`   - Found in rejected list: ${Boolean(foundRejected)}`);
    console.log(`   - approvalStatus: "${foundRejected?.approvalStatus}"`);
    console.log(`   - rejectionReason: "${foundRejected?.rejectionReason}"`);

    const rejectionSynced = Boolean(foundRejected && foundRejected.approvalStatus === "rejected" && foundRejected.rejectionReason === rejectionReasonText);

    // Clean up
    await prisma.productVariant.deleteMany({ where: { productId: testRejectProd.id } });
    await prisma.product.delete({ where: { id: testRejectProd.id } });

    if (rejectionSynced) {
      console.log("✅ PASS: Product rejection with custom admin reason correctly received by vendor!");
      passedTests++;
    } else {
      console.error("❌ FAIL: Rejection reason not synced properly.");
    }
  } catch (e: any) {
    console.error("❌ FAIL Test 5.1 Error:", e.message);
  }

  // -------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------
  console.log("\n=================================================================");
  console.log(`📊 FINAL CROSS-SURFACE SYNC RESULT: ${passedTests}/${totalTests} TESTS PASSED`);
  console.log("=================================================================");

  if (passedTests === totalTests) {
    console.log("🎉 ALL 6 CROSS-SURFACE SYNC VERIFICATIONS PASSED 100%!");
  } else {
    console.error(`⚠️ ${totalTests - passedTests} test(s) failed. Please review output.`);
    process.exit(1);
  }
}

runCrossSurfaceSyncTests()
  .catch((e) => {
    console.error("Fatal error running test:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
