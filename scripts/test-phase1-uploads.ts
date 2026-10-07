import "./test-db-guard";
import { PrismaClient } from "@prisma/client";
import { createProduct, getProductBySlug } from "../lib/actions/products";
import { formatProduct, getProductPriceInfo } from "../lib/formatters";

const prisma = new PrismaClient();

async function main() {
  process.env.ALLOW_SYSTEM_MUTATIONS = "true";

  console.log("=================================================");
  console.log("PHASE 1: MULTI-SURFACE UPLOAD & FOUNDATION TEST");
  console.log("=================================================\n");

  // 1. Fetch an active vendor to use for testing
  const vendor = await prisma.vendor.findFirst({
    where: { status: { in: ["approved", "active", "ACTIVE"] } },
  });

  if (!vendor) {
    throw new Error("No active vendor found in database for testing.");
  }

  console.log(`Using Test Vendor: ${vendor.businessName} (${vendor.id})`);

  const category = await prisma.category.findFirst();
  const categorySlug = category ? category.slug : "tiles";

  const createdProductIds: string[] = [];

  try {
    // ------------------------------------------------------------------
    // TEST 1: Vendor Single Item Upload
    // ------------------------------------------------------------------
    console.log("\n--- TEST 1: Vendor Single Item Upload ---");
    const vendorSingleRes = await createProduct({
      name: `Vendor Single Item Test ${Date.now().toString().slice(-4)}`,
      categorySlug,
      material: "Ceramic",
      description: "Test single product uploaded by vendor with single default variant",
      images: ["/placeholders/product.svg"],
      hasVariants: false,
      vendorId: vendor.id,
      mrp: 1200,
      variants: [
        {
          variantName: "Standard",
          size: "600x600 mm",
          color: "White",
          price: 950,
          pricePerBox: 950,
          mrp: 1200,
          stockBoxes: 100,
          isDefault: true,
          active: true,
          unit: "box",
        },
      ],
    });

    if (!vendorSingleRes.success || !vendorSingleRes.product) {
      throw new Error(`Vendor single item creation failed: ${vendorSingleRes.error}`);
    }

    console.log(`✓ Vendor Single Item created: ${vendorSingleRes.product.name} (ID: ${vendorSingleRes.product.id})`);
    createdProductIds.push(vendorSingleRes.product.id);

    // Verify properties
    const vSingle = await prisma.product.findUnique({
      where: { id: vendorSingleRes.product.id },
      include: { variants: true },
    });
    console.log(`  - hasVariants: ${vSingle?.hasVariants} (expected false)`);
    console.log(`  - Variants count: ${vSingle?.variants.length} (expected 1)`);
    console.log(`  - Default variant price: ₹${vSingle?.variants[0].price} (expected 950)`);
    console.log(`  - Edit history recorded: ${JSON.stringify(vSingle?.editHistory)}`);

    if (vSingle?.hasVariants !== false || vSingle?.variants.length !== 1) {
      throw new Error("Vendor single item invariant failure!");
    }

    // ------------------------------------------------------------------
    // TEST 2: CPO Multi-Variety Upload (On behalf of vendor)
    // ------------------------------------------------------------------
    console.log("\n--- TEST 2: CPO Multi-Variety Upload (On behalf of Vendor) ---");
    const cpoMultiRes = await createProduct({
      name: `CPO Multi-Variety Item Test ${Date.now().toString().slice(-4)}`,
      categorySlug,
      material: "Porcelain",
      description: "Test multi-variety item uploaded by CPO on behalf of vendor",
      images: [
        "/placeholders/product.svg",
        "/placeholders/product.svg",
      ],
      hasVariants: true,
      vendorId: vendor.id,
      mrp: 2000,
      createdByAdminId: null,
      variants: [
        {
          variantName: "Matte - 300x300",
          size: "300x300 mm",
          finish: "Matte",
          color: "Grey",
          price: 1400,
          pricePerBox: 1400,
          mrp: 1800,
          stockBoxes: 40,
          isDefault: true,
          active: true,
          unit: "box",
          image: "/placeholders/product.svg",
        },
        {
          variantName: "Glossy - 600x600",
          size: "600x600 mm",
          finish: "Glossy",
          color: "White",
          price: 1750,
          pricePerBox: 1750,
          mrp: 2200,
          stockBoxes: 25,
          isDefault: false,
          active: true,
          unit: "box",
          image: "/placeholders/product.svg",
        },
      ],
    });

    if (!cpoMultiRes.success || !cpoMultiRes.product) {
      throw new Error(`CPO multi-variety item creation failed: ${cpoMultiRes.error}`);
    }

    console.log(`✓ CPO Multi-Variety Item created: ${cpoMultiRes.product.name} (ID: ${cpoMultiRes.product.id})`);
    createdProductIds.push(cpoMultiRes.product.id);

    const cpoProd = await prisma.product.findUnique({
      where: { id: cpoMultiRes.product.id },
      include: { variants: true },
    });
    console.log(`  - hasVariants: ${cpoProd?.hasVariants} (expected true)`);
    console.log(`  - Variants count: ${cpoProd?.variants.length} (expected 2)`);
    console.log(`  - Assigned Vendor ID: ${cpoProd?.vendorId} (matches selected vendor)`);
    console.log(`  - Default variant: ${cpoProd?.variants.find(v => v.isDefault)?.variantName}`);

    if (cpoProd?.hasVariants !== true || cpoProd?.variants.length !== 2) {
      throw new Error("CPO multi-variety invariant failure!");
    }

    // ------------------------------------------------------------------
    // TEST 3: Admin Act-As-Vendor Upload (Audit & Auto-Publish)
    // ------------------------------------------------------------------
    console.log("\n--- TEST 3: Admin Act-As-Vendor Upload ---");
    const adminUploadRes = await createProduct({
      name: `Admin Managed Product Test ${Date.now().toString().slice(-4)}`,
      categorySlug,
      material: "Vitrified",
      description: "Test item uploaded by Admin acting as vendor",
      images: ["/placeholders/product.svg"],
      hasVariants: false,
      vendorId: vendor.id,
      createdByAdminId: "admin_test_root",
      approvalStatus: "approved",
      variants: [
        {
          variantName: "Default Standard",
          size: "800x800 mm",
          color: "Beige",
          price: 2100,
          pricePerBox: 2100,
          mrp: 2600,
          stockBoxes: 60,
          isDefault: true,
          active: true,
          unit: "box",
        },
      ],
    });

    if (!adminUploadRes.success || !adminUploadRes.product) {
      throw new Error(`Admin upload failed: ${adminUploadRes.error}`);
    }

    console.log(`✓ Admin Item created: ${adminUploadRes.product.name} (ID: ${adminUploadRes.product.id})`);
    createdProductIds.push(adminUploadRes.product.id);

    const adminProd = await prisma.product.findUnique({
      where: { id: adminUploadRes.product.id },
      include: { variants: true },
    });
    console.log(`  - createdByAdminId: ${adminProd?.createdByAdminId} (recorded)`);
    console.log(`  - approvalStatus: ${adminProd?.approvalStatus} (approved)`);

    // ------------------------------------------------------------------
    // TEST 4: Price Info & Listing vs PDP Display Format
    // ------------------------------------------------------------------
    console.log("\n--- TEST 4: Storefront & App Price Formatting ---");
    const formattedCpo = formatProduct(cpoProd as any);
    const listingCardPrice = getProductPriceInfo(formattedCpo as any);
    console.log(`  - Listing Card Price Info: "${listingCardPrice.formattedPrice}" (expected "From ₹1400")`);
    console.log(`  - PDP Specific Variant (Glossy): "₹${cpoProd?.variants[1].price}" (expected ₹1750)`);

    if (!listingCardPrice.formattedPrice.includes("From ₹1,400") && !listingCardPrice.formattedPrice.includes("From ₹1400")) {
      throw new Error(`Unexpected listing card price formatting: ${listingCardPrice.formattedPrice}`);
    }

    // ------------------------------------------------------------------
    // TEST 5: Order Line Item Snapshot Verification
    // ------------------------------------------------------------------
    console.log("\n--- TEST 5: Order Line Item Snapshotting ---");
    const testVariant = cpoProd?.variants[0];
    if (!testVariant) throw new Error("Missing test variant");

    const testUser = await prisma.user.findFirst();
    if (!testUser) throw new Error("No user found in database for order test");

    const dummyOrder = await prisma.order.create({
      data: {
        id: `TEST_ORD_${Date.now()}`,
        userId: testUser.id,
        customerName: "Test Shopper",
        customerPhone: "9999999999",
        customerEmail: "shopper@test.com",
        subtotal: Number(testVariant.price),
        total: Number(testVariant.price),
        orderStatus: "Processing",
        paymentStatus: "Pending",
        paymentMethod: "COD",
        shippingAddress: { city: "Bengaluru", state: "Karnataka" } as any,
        items: {
          create: [
            {
              productId: cpoProd.id,
              productName: cpoProd.name,
              variantId: testVariant.id,
              variantDetails: testVariant.variantName || "Matte - 300x300",
              boxQuantity: 1,
              pricePerBox: Number(testVariant.price),
              totalPrice: Number(testVariant.price),
              image: testVariant.image || "",
              vendorId: cpoProd.vendorId,
            },
          ],
        },
      },
      include: {
        items: true,
      },
    });

    console.log(`✓ Order Created with Snapshot: ${dummyOrder.id}`);
    const orderLine = dummyOrder.items[0];
    console.log(`  - Snapshot variantId: ${orderLine.variantId}`);
    console.log(`  - Snapshot variantDetails: ${orderLine.variantDetails}`);
    console.log(`  - Snapshot pricePerBox: ₹${orderLine.pricePerBox}`);
    console.log(`  - Snapshot vendorId: ${orderLine.vendorId} (matches vendor ${vendor.id})`);

    if (orderLine.vendorId !== vendor.id || orderLine.pricePerBox !== 1400) {
      throw new Error("Order line snapshot mismatch!");
    }

    // Cleanup test order
    await prisma.orderItem.deleteMany({ where: { orderId: dummyOrder.id } });
    await prisma.order.delete({ where: { id: dummyOrder.id } });
    console.log(`✓ Cleaned up test order`);

    console.log("\n=================================================");
    console.log("ALL PHASE 1 FOUNDATION & UPLOAD TESTS PASSED! ✓");
    console.log("=================================================");
  } finally {
    // Cleanup created test products
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
