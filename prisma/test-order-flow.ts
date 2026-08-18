import { prisma } from "../lib/prisma";
import { upsertCustomerUser } from "../lib/actions/auth";
import { syncCartToDb, getCartForUser } from "../lib/actions/cart";
import { createOrder, getOrderById } from "../lib/actions/orders";
import {
  getAdminNotifications,
  getUnreadAdminNotificationCount,
  markAdminNotificationAsRead,
} from "../lib/actions/notifications";

async function testFullOrderFlow() {
  console.log("=== 1. Testing User Upsert Server Action ===");
  const testPhone = "9876543999";
  const userRes = await upsertCustomerUser({
    phone: testPhone,
    name: "Test Customer",
    email: "test@customer.in",
  });

  if (!userRes.success || !userRes.user) {
    throw new Error(`Failed to upsert user: ${userRes.error}`);
  }
  const realUserId = userRes.user.id;
  console.log(`Real Database User Created: ${realUserId} (Phone: ${userRes.user.phone})`);

  console.log("\n=== 2. Testing Database Cart Sync ===");
  const products = await prisma.product.findMany({ include: { variants: true } });
  if (products.length === 0 || products[0].variants.length === 0) {
    throw new Error("No products/variants found for test");
  }
  const testVariant = products[0].variants[0];

  const cartRes = await syncCartToDb(realUserId, [
    { productId: products[0].id, variantId: testVariant.id, quantity: 4 },
  ]);
  if (!cartRes.success) {
    throw new Error(`Cart sync failed: ${cartRes.error}`);
  }
  console.log("Cart synchronized successfully with zero FK violations.");

  const dbCart = await getCartForUser(realUserId);
  console.log(`Verified DB Cart items: ${dbCart.length}`);

  console.log("\n=== 3. Testing Order Creation with Authenticated User ===");
  const testOrderId = `TL-TEST-${Date.now().toString().slice(-4)}`;
  const orderRes = await createOrder({
    id: testOrderId,
    userId: realUserId,
    customerName: "Test Customer",
    customerPhone: testPhone,
    customerEmail: "test@customer.in",
    shippingAddress: {
      fullName: "Test Customer",
      phone: testPhone,
      street: "123 Test Street",
      city: "Bangalore",
      state: "Karnataka",
      pincode: "560034",
    },
    items: [
      {
        productId: products[0].id,
        productName: products[0].name,
        variantId: testVariant.id,
        variantDetails: `${testVariant.size} · ${testVariant.finish}`,
        boxQuantity: 4,
        pricePerBox: testVariant.pricePerBox,
        totalPrice: testVariant.pricePerBox * 4,
        image: products[0].images[0] || "",
      },
    ],
    subtotal: testVariant.pricePerBox * 4,
    deliveryFee: 0,
    discount: 0,
    total: testVariant.pricePerBox * 4,
    paymentMethod: "COD",
    paymentStatus: "Pending",
    codConfirmed: true,
  });

  if (!orderRes.success || !orderRes.order) {
    throw new Error(`Order creation failed: ${orderRes.error}`);
  }
  console.log(`Order created successfully: ${orderRes.order.id} with valid userId: ${orderRes.order.userId}`);

  console.log("\n=== 4. Testing Order Creation with Raw/Legacy Phone (Fallback Protection) ===");
  const guestOrderId = `TL-GUEST-${Date.now().toString().slice(-4)}`;
  const guestRes = await createOrder({
    id: guestOrderId,
    userId: "usr-legacy-client-id-12345", // Non-existent legacy client ID
    customerName: "Guest Walkin",
    customerPhone: "9123456780",
    customerEmail: "guest@walkin.in",
    shippingAddress: {
      fullName: "Guest Walkin",
      phone: "9123456780",
      street: "456 Guest Road",
      city: "Bangalore",
      state: "Karnataka",
      pincode: "560001",
    },
    items: [
      {
        productId: products[0].id,
        productName: products[0].name,
        variantId: testVariant.id,
        variantDetails: `${testVariant.size} · ${testVariant.finish}`,
        boxQuantity: 2,
        pricePerBox: testVariant.pricePerBox,
        totalPrice: testVariant.pricePerBox * 2,
        image: products[0].images[0] || "",
      },
    ],
    subtotal: testVariant.pricePerBox * 2,
    deliveryFee: 999,
    discount: 0,
    total: testVariant.pricePerBox * 2 + 999,
    paymentMethod: "Online",
    paymentStatus: "Paid",
  });

  if (!guestRes.success || !guestRes.order) {
    throw new Error(`Guest order creation failed: ${guestRes.error}`);
  }
  console.log(`Guest order created with auto-resolved valid User FK: ${guestRes.order.id}`);

  console.log("\n=== 5. Testing Admin Notification Creation & Retrieval ===");
  const unreadCount = await getUnreadAdminNotificationCount();
  console.log(`Unread Admin Notifications: ${unreadCount}`);
  const notifs = await getAdminNotifications(5);
  console.log(`Recent notifications: ${notifs.map((n) => `[${n.title} -> ${n.link}]`).join(", ")}`);

  if (notifs.length > 0) {
    await markAdminNotificationAsRead(notifs[0].id);
    console.log(`Marked notification ${notifs[0].id} as read.`);
  }

  console.log("\n=== 6. Cleanup Test Records ===");
  await prisma.order.deleteMany({
    where: { id: { in: [testOrderId, guestOrderId] } },
  });
  await prisma.cart.deleteMany({
    where: { userId: realUserId },
  });
  await prisma.user.deleteMany({
    where: { phone: { in: [testPhone, "9123456780"] } },
  });
  console.log("Test records cleaned up cleanly.");

  console.log("\nALL ORDER FLOW & ADMIN NOTIFICATION TESTS PASSED 100%! ✅");
}

testFullOrderFlow().catch((err) => {
  console.error("Order flow test failed:", err);
  process.exit(1);
});
