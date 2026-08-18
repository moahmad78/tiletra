import { io } from "socket.io-client";
import { prisma } from "../lib/prisma";
import { createOrder, updateOrderStatus } from "../lib/actions/orders";

async function testRealtimeSockets() {
  console.log("=== 1. Connecting Sockets to Relay Server (port 4001) ===");

  const socketUrl = "http://localhost:4001";

  // Client 1: Admin Socket
  const adminSocket = io(socketUrl, { transports: ["websocket"] });
  // Client 2: Customer Socket
  const customerSocket = io(socketUrl, { transports: ["websocket"] });

  await new Promise<void>((resolve, reject) => {
    let connected = 0;
    const onConnect = () => {
      connected++;
      if (connected === 2) resolve();
    };
    adminSocket.on("connect", onConnect);
    customerSocket.on("connect", onConnect);
    adminSocket.on("connect_error", reject);
    customerSocket.on("connect_error", reject);
    setTimeout(() => reject(new Error("Socket connection timed out")), 5000);
  });

  console.log(`Sockets connected successfully. Admin: ${adminSocket.id}, Customer: ${customerSocket.id}`);

  // Join Rooms and wait for confirmation
  await Promise.all([
    new Promise<void>((res) => {
      adminSocket.emit("join-room", "admin");
      adminSocket.once("joined-room", () => res());
    }),
    new Promise<void>((res) => {
      customerSocket.emit("join-room", "phone:9876543210");
      customerSocket.once("joined-room", () => res());
    }),
  ]);

  console.log("Both admin and customer joined their respective rooms.");

  console.log("\n=== 2. Testing `new-order` Broadcast on Order Creation ===");

  const testOrderId = `TL-RT-${Date.now().toString().slice(-4)}`;
  const testPhone = "9876543210";

  // Setup Admin Listener for new-order
  const newOrderPromise = new Promise<any>((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("Admin timed out waiting for new-order socket event")), 8000);
    adminSocket.on("new-order", (data) => {
      clearTimeout(timeout);
      resolve(data);
    });
  });

  // Fetch product for order
  const product = await prisma.product.findFirst({ include: { variants: true } });
  const variant = product?.variants[0];
  if (!product || !variant) throw new Error("No products available to test order");

  // Place order via Server Action
  const orderRes = await createOrder({
    id: testOrderId,
    customerName: "Realtime Test Customer",
    customerPhone: testPhone,
    customerEmail: "realtime@test.in",
    shippingAddress: {
      fullName: "Realtime Test Customer",
      phone: testPhone,
      street: "789 Realtime Lane",
      city: "Bangalore",
      state: "Karnataka",
      pincode: "560034",
    },
    items: [
      {
        productId: product.id,
        productName: product.name,
        variantId: variant.id,
        variantDetails: `${variant.size} · ${variant.finish}`,
        boxQuantity: 3,
        pricePerBox: variant.pricePerBox,
        totalPrice: variant.pricePerBox * 3,
        image: product.images[0] || "",
      },
    ],
    subtotal: variant.pricePerBox * 3,
    deliveryFee: 0,
    discount: 0,
    total: variant.pricePerBox * 3,
    paymentMethod: "Online",
    paymentStatus: "Paid",
  });

  if (!orderRes.success) {
    throw new Error(`Order creation failed: ${orderRes.error}`);
  }

  const receivedNewOrder = await newOrderPromise;
  console.log(`✅ Admin received real-time new-order event for #${receivedNewOrder.orderId || receivedNewOrder.id} (₹${receivedNewOrder.total})!`);

  console.log("\n=== 3. Testing `order-status-updated` Broadcast on Admin Update ===");

  // Setup Customer Listener for order-status-updated
  const statusUpdatePromise = new Promise<any>((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("Customer timed out waiting for order-status-updated socket event")), 8000);
    customerSocket.on("order-status-updated", (data) => {
      clearTimeout(timeout);
      resolve(data);
    });
  });

  // Admin updates order status
  const updateRes = await updateOrderStatus(testOrderId, "Dispatched");
  if (!updateRes.success) {
    throw new Error(`Status update failed: ${updateRes.error}`);
  }

  const receivedStatusUpdate = await statusUpdatePromise;
  console.log(`✅ Customer received real-time order-status-updated event for #${receivedStatusUpdate.orderId}: "${receivedStatusUpdate.orderStatus}"!`);

  console.log("\n=== 4. Cleaning Up ===");
  await prisma.order.delete({ where: { id: testOrderId } });
  adminSocket.disconnect();
  customerSocket.disconnect();
  console.log("Cleanup finished.");

  console.log("\n🚀 ALL REAL-TIME SOCKET.IO INTEGRATION TESTS PASSED 100%! ✅");
}

testRealtimeSockets().catch((err) => {
  console.error("Realtime test failed:", err);
  process.exit(1);
});
