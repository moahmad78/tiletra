import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Starting live order creation for testing ring alert on vendor@intrihub.com...");

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

  console.log(`✓ Found Vendor: ${vendor.businessName} (Vendor ID: ${vendor.id}, User ID: ${vendor.ownerId})`);

  const product = vendor.products[0];
  const variant = product?.variants?.[0];
  const productName = product?.name || "Roff T16 Cera Tile & Ceramic Cleaner ₹140";
  const variantDetails = variant ? `${variant.size} • ${variant.finish || "Standard"}` : "Standard Box";
  const unitPrice = variant?.pricePerBox || variant?.price || product?.pricePerSqft || 149;
  const quantity = 2;
  const subtotal = unitPrice * quantity; // 149 * 2 = 298
  const deliveryFee = 150;
  const total = subtotal + deliveryFee;

  // 2. Generate new unique Order ID
  const randomSuffix = Math.floor(100000 + Math.random() * 900000);
  const orderId = `ORD-2026-${randomSuffix}`;
  const splitId = `SPLIT-${randomSuffix}`;

  // 3. Create Order in Database
  const order = await prisma.order.create({
    data: {
      id: orderId,
      customerName: "Mohammad Ahmad (Live Test Customer)",
      customerPhone: "9876543210",
      customerEmail: "live.test@intrihub.com",
      shippingAddress: {
        street: "Flat 402, Lotus Residency, 100ft Road",
        city: "Bengaluru",
        state: "Karnataka",
        pincode: "560038",
      },
      subtotal,
      deliveryFee,
      discount: 0,
      total,
      paymentMethod: "COD",
      paymentStatus: "Pending",
      orderStatus: "Processing",
      estimatedDelivery: "Within 45 Minutes",
      deliveryName: "Mohammad Ahmad (Live Test Customer)",
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
            image: variant?.image || "/images/products/prod-roff-t16-cera-tile-ceramic-cleaner-140-6189-0.webp",
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
      fulfillmentStatus: "pending_vendor_approval",
      autoAccepted: false,
    },
  });

  console.log(`✓ Created Order in DB: ${order.id} (Split ID: ${split.id}) - Subtotal: ₹${subtotal}, Total: ₹${order.total}`);

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
    splitId: split.id,
    vendorId: vendor.id,
    customerName: order.customerName,
    customerPhone: "+91 98765 43210",
    total: subtotal,
    totalAmount: subtotal,
    itemsCount: 1,
    items: [
      {
        productName,
        variantDetails,
        quantity,
        pricePerBox: unitPrice,
      },
    ],
    isAutoAccepted: false,
    requiresManualApproval: true,
    warning: "100ft Road, Indiranagar, Bengaluru",
    createdAt: order.createdAt,
  };

  const socketEndpoints = [
    "http://127.0.0.1:4000/emit",
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
      await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: "new-order",
          rooms: vendorRooms,
          data: vendorAlertData,
        }),
      });
      if (res.ok) {
        console.log(`✓ [order-alert & new-order] emitted successfully to ${endpoint}`);
        emitted = true;
        break;
      }
    } catch (err: any) {
      console.warn(`Endpoint ${endpoint} failed:`, err?.message);
    }
  }

  if (!emitted) {
    console.warn("⚠️ Warning: Could not connect to socket endpoint.");
  }

  // 5. Dispatch Mobile Push Notification to Minimized / Background Devices
  try {
    const { notifyVendorPush } = await import("../lib/push-notifications");
    await notifyVendorPush({
      userId: vendor.ownerId,
      vendorId: vendor.id,
      title: "New Customer Order! 🛍️",
      body: `Order #${order.id} received for ₹${subtotal} (${productName} x${quantity}). Tap to review & accept.`,
      orderId: order.id,
      totalAmount: subtotal,
      requiresManualApproval: true,
      isNewOrder: true,
      data: {
        orderId: order.id,
        splitId: split.id,
        customerName: order.customerName,
        total: subtotal,
      },
    });
    console.log("✓ Push notification dispatched to vendor devices (for background/minimized phone)!");
  } catch (pushErr: any) {
    console.warn("Push notification warning:", pushErr.message);
  }

  console.log("\n🎉 TEST ORDER DISPATCHED SUCCESSFULLY!");
  console.log(`Order ID: ${order.id}`);
  console.log(`Split ID: ${split.id}`);
  console.log(`Product: ${productName} (x${quantity})`);
  console.log(`Subtotal: ₹${subtotal}`);
  console.log(`Target Vendor: ${vendor.businessName} (${vendor.contactEmail})`);
  console.log(`Target Rooms:`, vendorRooms);
}

main()
  .catch((e) => {
    console.error("❌ Error dispatching test order:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
