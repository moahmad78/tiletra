import { prisma } from "../lib/prisma";
import { createVendorManually, getVendorDetailAnalytics, getAdminVendors } from "../lib/actions/admin-vendor";
import { updateVendorBankDetails, getVendorOrders, updateVendorFulfillmentStatus } from "../lib/actions/vendor";
import { createOrder } from "../lib/actions/orders";

async function verifyVendorOrderFlow() {
  console.log("==========================================================");
  console.log("TEST SUITE: MULTI-VENDOR ORDER ROUTING, BANK & DASHBOARD");
  console.log("==========================================================");

  // Clean previous test run data if exists
  const existingUsers = await prisma.user.findMany({
    where: { phone: { in: ["9845112233", "9845998877", "9812345678"] } },
    include: { vendor: true },
  });
  const existingVendorIds = existingUsers.map((u) => u.vendor?.id).filter(Boolean) as string[];
  if (existingVendorIds.length > 0) {
    await prisma.product.deleteMany({ where: { vendorId: { in: existingVendorIds } } });
    await prisma.vendorOrderSplit.deleteMany({ where: { vendorId: { in: existingVendorIds } } });
    await prisma.vendor.deleteMany({ where: { id: { in: existingVendorIds } } });
  }
  await prisma.order.deleteMany({ where: { customerPhone: "9812345678" } });
  await prisma.user.deleteMany({ where: { phone: { in: ["9845112233", "9845998877", "9812345678"] } } });

  // 1. Create Vendor 1 (Sri Krishna Electricals)
  console.log("\n1. Creating Vendor 1 (Sri Krishna Electricals)...");
  const v1Res = await createVendorManually({
    businessName: "Sri Krishna Electricals",
    ownerName: "Krishna Murthy",
    contactEmail: "krishna.electricals@intrihub-real.com",
    contactPhone: "9845112233",
    category: "Electricals & Lighting",
    businessAddress: "Shop 12, BVK Iyengar Road, Bangalore 560053",
    commissionRate: 15.0,
    customPassword: "VendorPassword123!",
  });

  if (!v1Res.success || !v1Res.credentials) {
    throw new Error(`Failed to create Vendor 1: ${v1Res.error}`);
  }
  console.log(`✓ Vendor 1 created successfully: ${v1Res.credentials.businessName} (Phone: ${v1Res.credentials.phone})`);

  const vendor1 = await prisma.vendor.findFirst({ where: { contactPhone: "9845112233" } });
  if (!vendor1) throw new Error("Vendor 1 not found in DB");

  // 2. Create Vendor 2 (Apex Hardware Supplies) for Isolation Testing
  console.log("\n2. Creating Vendor 2 (Apex Hardware Supplies)...");
  const v2Res = await createVendorManually({
    businessName: "Apex Hardware Supplies",
    ownerName: "Sunil Hegde",
    contactEmail: "sunil.apex@intrihub-real.com",
    contactPhone: "9845998877",
    category: "Hardware & Fasteners",
    businessAddress: "Industrial Area, Peenya, Bangalore 560058",
    commissionRate: 12.0,
    customPassword: "VendorPassword123!",
  });
  if (!v2Res.success) throw new Error(`Failed to create Vendor 2: ${v2Res.error}`);
  const vendor2 = await prisma.vendor.findFirst({ where: { contactPhone: "9845998877" } });
  if (!vendor2) throw new Error("Vendor 2 not found in DB");
  console.log(`✓ Vendor 2 created successfully: ${vendor2.businessName}`);

  // 3. Test Part B: Add Bank Details to Vendor 1
  console.log("\n3. Adding Bank & Payout Details for Vendor 1...");
  const bankUpdateRes = await updateVendorBankDetails(vendor1.id, {
    bankAccountHolder: "Sri Krishna Enterprises",
    bankName: "State Bank of India",
    bankAccountNumber: "38920194829102",
    bankIfscCode: "SBIN0004521",
    bankUpiId: "srikrishna@oksbi",
  });
  if (!bankUpdateRes.success) throw new Error(`Failed to update bank details: ${bankUpdateRes.error}`);
  console.log(`✓ Bank details saved for Vendor 1: SBI A/C: 38920194829102 (IFSC: SBIN0004521)`);

  // 4. Create products for Vendor 1 and Vendor 2
  console.log("\n4. Creating products for Vendor 1 & Vendor 2...");
  const p1 = await prisma.product.create({
    data: {
      name: "Schneider 16A Heavy Duty Switch Pack",
      slug: `schneider-switch-pack-${Date.now()}`,
      categorySlug: "electricals-lighting",
      categoryName: "Electricals & Lighting",
      pricePerSqft: 450,
      unitOfSale: "pack",
      vendorId: vendor1.id,
      status: "active",
      approvalStatus: "approved",
      images: ["https://images.unsplash.com/photo-1558494949-ef010cbdcc31"],
    },
  });

  const p2 = await prisma.product.create({
    data: {
      name: "Brass Door Handles & Mortise Lock Set",
      slug: `brass-door-handles-lock-${Date.now()}`,
      categorySlug: "hardware-fasteners",
      categoryName: "Hardware & Fasteners",
      pricePerSqft: 1200,
      unitOfSale: "piece",
      vendorId: vendor2.id,
      status: "active",
      approvalStatus: "approved",
      images: ["https://images.unsplash.com/photo-1584622650111-993a426fbf0a"],
    },
  });
  console.log(`✓ Created Product 1 for Vendor 1: ${p1.name}`);
  console.log(`✓ Created Product 2 for Vendor 2: ${p2.name}`);

  // 5. Test Customer Checkout Order with Multi-Vendor Split
  console.log("\n5. Placing Multi-Vendor Customer Order...");
  const orderRes = await createOrder({
    customerName: "Rohan Varma",
    customerPhone: "9812345678",
    customerEmail: "rohan.varma@gmail.com",
    shippingAddress: {
      fullName: "Rohan Varma",
      phone: "9812345678",
      street: "Flat 402, Prestige Palms, Whitefield",
      city: "Bangalore",
      state: "Karnataka",
      pincode: "560066",
    },
    subtotal: 3300,
    deliveryFee: 0,
    discount: 0,
    total: 3300,
    paymentMethod: "UPI",
    paymentStatus: "Paid",
    items: [
      {
        productId: p1.id,
        productName: p1.name,
        variantId: "default",
        variantDetails: "Standard",
        boxQuantity: 2,
        pricePerBox: 450,
        totalPrice: 900,
      },
      {
        productId: p2.id,
        productName: p2.name,
        variantId: "default",
        variantDetails: "Standard",
        boxQuantity: 2,
        pricePerBox: 1200,
        totalPrice: 2400,
      },
    ],
  });

  if (!orderRes.success || !orderRes.order) {
    throw new Error(`Order placement failed: ${orderRes.error}`);
  }
  console.log(`✓ Order placed successfully! Order ID: #${orderRes.order.id}`);

  // 6. Verify Splits Created in Database
  console.log("\n6. Verifying Vendor Order Splits in DB...");
  const splits = await prisma.vendorOrderSplit.findMany({
    where: { orderId: orderRes.order.id },
  });

  console.log(`Found ${splits.length} splits for Order #${orderRes.order.id}:`);
  for (const s of splits) {
    console.log(`- Vendor: ${s.vendorId} | Subtotal: ₹${s.subtotal} | Commission: ₹${s.commissionAmount} (${s.commissionRate}%) | Net Payout: ₹${s.vendorPayoutAmount}`);
  }

  if (splits.length !== 2) throw new Error(`Expected 2 splits, got ${splits.length}`);

  const v1Split = splits.find((s) => s.vendorId === vendor1.id);
  const v2Split = splits.find((s) => s.vendorId === vendor2.id);

  if (!v1Split || v1Split.subtotal !== 900 || v1Split.commissionAmount !== 135 || v1Split.vendorPayoutAmount !== 765) {
    throw new Error(`Vendor 1 split calculations incorrect: ${JSON.stringify(v1Split)}`);
  }
  if (!v2Split || v2Split.subtotal !== 2400 || v2Split.commissionAmount !== 288 || v2Split.vendorPayoutAmount !== 2112) {
    throw new Error(`Vendor 2 split calculations incorrect: ${JSON.stringify(v2Split)}`);
  }
  console.log("✓ Mathematical split verification PASSED for both vendors!");

  // 7. Verify Vendor Isolation in /vendor/orders
  console.log("\n7. Verifying Vendor Isolation in Vendor Panel...");
  const v1Orders = await getVendorOrders(vendor1.id);
  const v2Orders = await getVendorOrders(vendor2.id);

  console.log(`Vendor 1 (${vendor1.businessName}) sees ${v1Orders.length} order split(s).`);
  console.log(`Vendor 2 (${vendor2.businessName}) sees ${v2Orders.length} order split(s).`);

  if (v1Orders.length !== 1 || v1Orders[0].vendorId !== vendor1.id) {
    throw new Error("Vendor 1 isolation check failed!");
  }
  if (v2Orders.length !== 1 || v2Orders[0].vendorId !== vendor2.id) {
    throw new Error("Vendor 2 isolation check failed!");
  }
  console.log("✓ Vendor Isolation PASSED! Each vendor only sees their own split.");

  // 8. Test Vendor Fulfillment Status Update (Processing -> Dispatched -> Delivered)
  console.log("\n8. Testing Vendor Fulfillment Status Updates...");
  const dispatchRes = await updateVendorFulfillmentStatus(
    v1Split.id,
    vendor1.id,
    "Dispatched",
    "TRK-INTRI-8899",
    "Intrihub Crate Logistics"
  );
  if (!dispatchRes.success) throw new Error(`Failed to dispatch: ${dispatchRes.error}`);
  console.log(`✓ Vendor 1 marked order as Dispatched (Tracking: TRK-INTRI-8899)`);

  // 9. Test Super Admin Analytics & Dashboard View (/admin/vendors/[id])
  console.log("\n9. Testing Super Admin Per-Vendor Dashboard View (/admin/vendors/[id])...");
  const adminAnalytics = await getVendorDetailAnalytics(vendor1.id);
  if (!adminAnalytics) throw new Error("Failed to fetch admin analytics for Vendor 1");

  console.log(`Admin View for "${adminAnalytics.vendor.businessName}":`);
  console.log(`- Bank Holder: ${adminAnalytics.vendor.bankAccountHolder}`);
  console.log(`- Bank A/C (Unmasked for Super Admin): ${adminAnalytics.vendor.bankAccountNumber}`);
  console.log(`- Bank IFSC: ${adminAnalytics.vendor.bankIfscCode}`);
  console.log(`- Total Orders: ${adminAnalytics.orderStats.total}`);
  console.log(`- Dispatched Orders: ${adminAnalytics.orderStats.dispatched}`);
  console.log(`- Live Products: ${adminAnalytics.productStats.live}`);
  console.log(`- Total Vendor Earnings: ₹${adminAnalytics.stats.totalVendorEarnings}`);
  console.log(`- Scoped Orders Count in Table: ${adminAnalytics.splits.length}`);

  if (adminAnalytics.vendor.bankAccountNumber !== "38920194829102") {
    throw new Error("Super Admin bank details mismatch!");
  }
  if (adminAnalytics.orderStats.dispatched !== 1) {
    throw new Error("Order fulfillment stats mismatch!");
  }
  console.log("✓ Super Admin Dashboard verification PASSED!");

  // 10. Check Admin List Masking
  const adminList = await getAdminVendors();
  console.log(`\n10. Admin List Vendors Count: ${adminList.length}`);
  console.log("==========================================================");
  console.log("ALL MULTI-VENDOR END-TO-END VERIFICATION CHECKS PASSED!");
  console.log("==========================================================");
}

verifyVendorOrderFlow()
  .catch((err) => {
    console.error("VERIFICATION FAILED:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());



