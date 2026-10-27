import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Starting live order creation for testing ring alert...");

  // 1. Find the target vendor
  const vendor = await prisma.vendor.findFirst({
    where: { contactEmail: "vendor@intrihub.com" },
    include: {
      owner: true,
      products: {
        where: { status: "active" },
        include: { variants: true },
        take: 1,
      },
    },
  });

  if (!vendor) {
    throw new Error("Vendor vendor@intrihub.com not found!");
  }

  console.log(`✓ Found Vendor: ${vendor.storeName} (Vendor ID: ${vendor.id}, User ID: ${vendor.ownerId})`);

  const product = vendor.products[0];
  const variant = product?.variants[0];
  const productName = product?.name || "Vitrified Premium Floor Tiles (2x2)";
  const variantDetails = variant ? `${variant.size} • ${variant.finish || "Glossy"}` : "Standard Box";
  const unitPrice = product?.price || 1450;
  const quantity = 3;
  const subtotal = unitPrice * quantity;

  // 2. Generate new unique Order ID
  const randomSuffix = Math.floor(100000 + Math.random() * 900000);
  const orderId = `ORD-2026-${randomSuffix}`;
  const splitId = `SPLIT-${randomSuffix}`;

  // 3. Create Order in Database
  const order = await prisma.order.create({
    data: {
      id: orderId,
      customerName: "Pooja Sharma",
      customerPhone: "9876543210",
      customerEmail: "pooja.test@intrihub.com",
      shippingAddress: {
        street: "Flat 402, Lotus Residency, 100ft Road",
        city: "Bengaluru",
        state: "Karnataka",
        pincode: "560038",
      },
      subtotal,
      deliveryFee: 150,
      discount: 0,
      total: subtotal + 150,
      paymentMethod: "COD",
      paymentStatus: "Pending",
      orderStatus: "Processing",
      estimatedDelivery: "Within 45 Minutes",
      deliveryName: "Pooja Sharma",
      deliveryPhone: "9876543210",
      deliveryStreet: "100ft Road, Indiranagar",
      deliveryCity: "Bengaluru",
      deliveryState: "Karnataka",
      deliveryPostalCode: "560038",
      autoAccepted: false,
      items: {
        create: [
          {
            productId: product?.id,
            productName,
            variantId: variant?.id || "VAR-DEFAULT",
            variantDetails,
            boxQuantity: quantity,
            pricePerBox: unitPrice,
            totalPrice: subtotal,
            image: product?.images?.[0] || "",
            vendorId: vendor.id,
          },
        ],
      },
    },
    include: {
      items: true,
    },
  });

  const split = await prisma.vendorOrderSplit.create({
    data: {
      id: splitId,
      orderId: order.id,
      vendorId: vendor.id,
      subtotal,
      commissionRate: 15.0,
      commissionAmount: (subtotal * 15) / 100,
      vendorPayoutAmount: subtotal - (subtotal * 15) / 100,
      fulfillmentStatus: "processing",
      autoAccepted: false,
    },
  });

  console.log(`✓ Created Order in DB: ${order.id} (Split ID: ${split.id}) - Total: ₹${order.total}`);

  // 4. Broadcast via Socket Server
  const vendorRooms = [
    `user:${vendor.ownerId}`,
    `user_${vendor.ownerId}`,
    vendor.ownerId,
    `vendor:${vendor.id}`,
    `vendor_${vendor.id}`,
    vendor.id,
    `vendor:${vendor.ownerId}`,
    "vendor:broadcast",
  ];

  const vendorAlertData = {
    orderId: order.id,
    id: order.id,
    splitId: splitId,
    vendorId: vendor.id,
    customerName: order.customerName,
    customerPhone: "+91 98765 •••••",
    total: subtotal,
    totalAmount: subtotal,
    itemsCount: 1,
    isAutoAccepted: false,
    requiresManualApproval: true,
    warning: "100ft Road, Indiranagar, Bengaluru",
    createdAt: order.createdAt,
  };

  const socketEndpoints = [
    "http://127.0.0.1:4000/emit",
    "http://127.0.0.1:4001/emit",
    "http://50.6.200.135:4000/emit",
  ];

  let emitted = false;
  for (const endpoint of socketEndpoints) {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: "order-alert",
          rooms: vendorRooms,
          data: vendorAlertData,
        }),
      });
      if (res.ok) {
        console.log(`✓ Socket alert emitted successfully to endpoint: ${endpoint}`);
        emitted = true;

        // Also emit new-order
        await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event: "new-order",
            rooms: vendorRooms,
            data: vendorAlertData,
          }),
        });
        break;
      }
    } catch {
      // try next endpoint
    }
  }

  if (!emitted) {
    console.warn("⚠️ Warning: Could not connect to local socket endpoint, trying fallback...");
  }

  console.log("\n🎉 TEST ORDER DISPATCHED SUCCESSFULLY!");
  console.log(`Order ID: ${order.id}`);
  console.log(`Target Vendor: ${vendor.storeName} (${vendor.contactEmail})`);
  console.log(`Amount: ₹${subtotal}`);
}

main()
  .catch((e) => {
    console.error("❌ Error dispatching test order:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
