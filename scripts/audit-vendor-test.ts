import { prisma } from "../lib/prisma";
import { generateMobileTokens } from "../lib/mobile-auth";

async function runVendorAudit() {
  console.log("=== VENDOR PLATFORM AUDIT TEST ===");

  // 1. Fetch all vendors
  const vendors = await prisma.vendor.findMany({
    include: {
      owner: true,
      _count: {
        select: { products: true, splits: true },
      },
    },
  });

  console.log(`Found ${vendors.length} vendors in database:`);
  for (const v of vendors) {
    console.log(`- [${v.status}] ${v.businessName} (ID: ${v.id})`);
    console.log(`  Contact Email: ${v.contactEmail}, Owner Email: ${v.owner?.email || "none"}`);
    console.log(`  Products: ${v._count.products}, Order Splits: ${v._count.splits}`);
  }

  // 2. Test Vendor Auth Token Generation
  const approvedVendor = vendors.find((v) => v.status === "approved" && v.owner);
  if (approvedVendor && approvedVendor.owner) {
    console.log(`\nTesting auth for approved vendor owner: ${approvedVendor.owner.email}`);
    const tokens = generateMobileTokens({
      id: approvedVendor.owner.id,
      email: approvedVendor.owner.email || "",
      phone: approvedVendor.owner.phone || "",
      name: approvedVendor.owner.name || "",
      role: approvedVendor.owner.role,
    });
    console.log(`Generated access token successfully (len: ${tokens.accessToken.length})`);
  }

  // 3. Check FCM push tokens
  const fcmTokens = await prisma.deviceToken.findMany({
    include: { user: true },
  });
  console.log(`\nRegistered FCM Device Tokens in DB: ${fcmTokens.length}`);
  for (const dt of fcmTokens) {
    console.log(`- Token for user ${dt.user?.name || dt.userId} (Role: ${dt.user?.role}): platform=${dt.platform}`);
  }

  // 4. Check Vendor Products
  const products = await prisma.product.findMany({
    where: { vendorId: { not: null } },
    take: 5,
    select: { id: true, name: true, vendorId: true, status: true, approvalStatus: true },
  });
  console.log(`\nSample Vendor Products (${products.length}):`);
  console.log(JSON.stringify(products, null, 2));

  // 5. Check Vendor Order Splits
  const splits = await prisma.vendorOrderSplit.findMany({
    take: 5,
    select: { id: true, vendorId: true, subtotal: true, vendorPayoutAmount: true, fulfillmentStatus: true },
  });
  console.log(`\nSample Vendor Order Splits (${splits.length}):`);
  console.log(JSON.stringify(splits, null, 2));
}

runVendorAudit()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
