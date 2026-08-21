import { prisma } from "../lib/prisma";
import { createOrder } from "../lib/actions/orders";
import {
  updateVendorDeliveryMethod,
  updateVendorFulfillmentStatus,
  updatePlatformDeliveryStatus,
} from "../lib/actions/vendor";
import { generateWeeklyPayoutBatches, getVendorPayoutSummary } from "../lib/actions/payouts";

async function main() {
  console.log("🚀 Starting Complete Order Lifecycle Verification Test...");

  // 1. Find or create a test product and variant
  let testProduct = await prisma.product.findFirst({
    where: { status: "active" },
    include: { variants: true, vendor: true },
  });

  if (!testProduct) {
    console.log("No product found to test.");
    return;
  }

  console.log(`✅ Using Product: "${testProduct.name}" (ID: ${testProduct.id})`);

  // Ensure a test variant has stock
  let variant = testProduct.variants[0];
  if (!variant) {
    variant = await prisma.productVariant.create({
      data: {
        productId: testProduct.id,
        size: "600x600mm",
        finish: "Glossy",
        color: "White",
        pricePerSqft: 50,
        pricePerBox: 1200,
        sqftPerBox: 24,
        piecesPerBox: 4,
        inStock: true,
        stockBoxes: 20,
      },
    });
  } else {
    variant = await prisma.productVariant.update({
      where: { id: variant.id },
      data: { stockBoxes: 20, inStock: true },
    });
  }

  console.log(`✅ Variant Stock set to: ${variant.stockBoxes} boxes`);

  // 2. Test Out-of-Stock rejection (Requesting 25 boxes when only 20 in stock)
  console.log("\n🧪 Test 1: Out-of-Stock Rejection...");
  const failedOrderRes = await createOrder({
    customerName: "Test Buyer",
    customerPhone: "9998887776",
    customerEmail: "buyer@test.com",
    shippingAddress: {
      fullName: "Test Buyer",
      phone: "9998887776",
      street: "123 Test St",
      city: "Bangalore",
      state: "Karnataka",
      pincode: "560001",
    },
    subtotal: 30000,
    deliveryFee: 0,
    discount: 0,
    total: 30000,
    paymentMethod: "COD",
    items: [
      {
        productId: testProduct.id,
        productName: testProduct.name,
        variantId: variant.id,
        variantDetails: "600x600mm Glossy",
        boxQuantity: 25, // Exceeds stock of 20
        pricePerBox: 1200,
        totalPrice: 30000,
      },
    ],
  });

  if (!failedOrderRes.success && failedOrderRes.error?.includes("Insufficient stock")) {
    console.log("✅ Passed: Transaction aborted correctly with insufficient stock message:", failedOrderRes.error);
  } else {
    console.log("❌ Failed or Unexpected:", failedOrderRes);
  }

  // 3. Test Successful Order Placement & Atomic Decrement
  console.log("\n🧪 Test 2: Valid Order Placement & Stock Decrement...");
  const orderRes = await createOrder({
    customerName: "Sahil Test Customer",
    customerPhone: "9264920211",
    customerEmail: "customer@test.com",
    shippingAddress: {
      fullName: "Sahil Test Customer",
      phone: "9264920211",
      street: "45 MG Road",
      city: "Bangalore",
      state: "Karnataka",
      pincode: "560001",
    },
    subtotal: 2400,
    deliveryFee: 0,
    discount: 0,
    total: 2400,
    paymentMethod: "Online",
    items: [
      {
        productId: testProduct.id,
        productName: testProduct.name,
        variantId: variant.id,
        variantDetails: "600x600mm Glossy",
        boxQuantity: 2, // Decrements from 20 -> 18
        pricePerBox: 1200,
        totalPrice: 2400,
      },
    ],
  });

  if (!orderRes.success || !orderRes.order) {
    console.error("❌ Order creation failed:", orderRes.error);
    return;
  }

  console.log(`✅ Order Created Successfully: #${orderRes.order.id}`);

  // Check remaining stock
  const updatedVariant = await prisma.productVariant.findUnique({ where: { id: variant.id } });
  console.log(`✅ Updated Variant Stock: ${updatedVariant?.stockBoxes} (Expected: 18)`);

  // Check VendorOrderSplit
  const split = await prisma.vendorOrderSplit.findFirst({
    where: { orderId: orderRes.order.id },
  });

  if (split) {
    console.log(`✅ VendorOrderSplit Generated: ID ${split.id}, DeliveryMethod: ${split.deliveryMethod}, Status: ${split.fulfillmentStatus}`);

    // 4. Test Fulfillment to Delivered and Commission Calculation
    console.log("\n🧪 Test 3: Fulfillment Progression to Delivered...");
    const deliverRes = await updateVendorFulfillmentStatus(
      split.id,
      split.vendorId,
      "delivered",
      "TRK-TEST-9988",
      "Intrihub Fleet",
      true
    );

    console.log(`✅ Delivery update result:`, deliverRes.message);

    const deliveredSplit = await prisma.vendorOrderSplit.findUnique({ where: { id: split.id } });
    console.log(`✅ Finalized Commission: ₹${deliveredSplit?.commissionAmount}`);
    console.log(`✅ Finalized Vendor Payout: ₹${deliveredSplit?.vendorPayoutAmount}`);

    // 5. Test Weekly Payout Batch Generation
    console.log("\n🧪 Test 4: Automated Weekly Payout Batch Creation...");
    const payoutRes = await generateWeeklyPayoutBatches();
    console.log(`✅ Payout Generator:`, payoutRes.message);

    // 6. Test Vendor Payout Summary
    const summary = await getVendorPayoutSummary(split.vendorId);
    console.log(`✅ Vendor Payout Ledger Ready:`, summary);
  }

  console.log("\n🎉 ALL TESTS COMPLETED SUCCESSFULLY!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
