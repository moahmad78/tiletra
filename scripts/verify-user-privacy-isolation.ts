import { prisma } from "../lib/prisma";
import { upsertCustomerUser, getDbUser, getDbUserByEmail, saveUserAddress, updateUserPhoneInDb } from "../lib/actions/auth";
import { getCustomerOrders, createOrder } from "../lib/actions/orders";

async function verifyUserPrivacyIsolation() {
  console.log("==========================================================================");
  console.log("TEST SUITE: RIGOROUS MULTI-USER PRIVACY, PROFILE, ADDRESS & ORDER ISOLATION");
  console.log("==========================================================================");

  const timestamp = Date.now();
  const userAEmail = `test.user.a.${timestamp}@gmail.com`;
  const userAPhone = "9844112233";
  const userBEmail = `test.user.b.${timestamp}@gmail.com`;

  // ── 1. Create Fresh User A ──────────────────────────────────────────────
  console.log(`\n[STEP 1] Creating Fresh User A (${userAEmail})...`);
  const userARes = await upsertCustomerUser({
    email: userAEmail,
    phone: userAPhone,
    name: "Aarav Sharma",
  });
  if (!userARes.success || !userARes.user) {
    throw new Error(`Failed to create User A: ${userARes.error}`);
  }
  const userA = userARes.user;
  console.log(`✓ User A created (ID: ${userA.id}, Name: ${userA.name}, Phone: ${userA.phone})`);

  // Add Address for User A
  console.log("[STEP 1.1] Adding saved delivery address for User A...");
  const addrARes = await saveUserAddress(userA.id, {
    line1: "Flat 101, Palm Heights",
    line2: "100 Feet Road, Indiranagar",
    city: "Bangalore",
    state: "Karnataka",
    pincode: "560038",
    label: "Home",
    isDefault: true,
  });
  if (!addrARes.success || !addrARes.address) throw new Error("Failed to save address for User A");
  console.log(`✓ Address added for User A: ${addrARes.address.street}, ${addrARes.address.city}`);

  // Place Order for User A
  console.log("[STEP 1.2] Placing Order 1 for User A...");
  const sampleProduct = await prisma.product.findFirst({ where: { status: "active" } });
  if (!sampleProduct) throw new Error("No active product found for order test");

  const orderARes = await createOrder({
    customerName: "Aarav Sharma",
    customerPhone: userAPhone,
    customerEmail: userAEmail,
    shippingAddress: {
      fullName: "Aarav Sharma",
      phone: userAPhone,
      street: "Flat 101, Palm Heights, Indiranagar",
      city: "Bangalore",
      state: "Karnataka",
      pincode: "560038",
    },
    subtotal: 1440,
    deliveryFee: 0,
    discount: 0,
    total: 1440,
    paymentMethod: "UPI",
    paymentStatus: "Paid",
    items: [
      {
        productId: sampleProduct.id,
        productName: sampleProduct.name,
        variantId: "default",
        variantDetails: "Standard",
        boxQuantity: 20,
        pricePerBox: 72,
        totalPrice: 1440,
      },
    ],
  });
  if (!orderARes.success || !orderARes.order) throw new Error("Failed to create Order for User A");
  const orderA = orderARes.order;
  console.log(`✓ Order placed for User A: #${orderA.id}`);

  // Verify User A has 1 address and 1 order
  const dbUserA = await getDbUser(userA.id);
  const ordersA = await getCustomerOrders({ userId: userA.id, phone: userAPhone, email: userAEmail });
  console.log(`- User A DB Addresses Count: ${dbUserA?.addresses?.length}`);
  console.log(`- User A Orders Count: ${ordersA.length}`);
  if (dbUserA?.addresses?.length !== 1) throw new Error("User A should have exactly 1 address");
  if (ordersA.length !== 1) throw new Error("User A should have exactly 1 order");

  // ── 2. Simulate Brand New User B Login (Google OAuth / Fresh Email) ──────────
  console.log(`\n[STEP 2] Simulating Login of Genuinely FRESH User B (${userBEmail})...`);
  const syntheticPhoneB = `google_${userBEmail.replace(/[^a-z0-9]/gi, "_")}`;
  const userBRecord = await prisma.user.create({
    data: {
      email: userBEmail,
      phone: syntheticPhoneB,
      name: "Diya Patel",
      emailVerified: true,
      phoneVerified: false,
      authProvider: "google",
      role: "customer",
    },
    include: { addresses: true },
  });
  console.log(`✓ User B created in DB (ID: ${userBRecord.id}, Email: ${userBRecord.email})`);

  // Verify User B isolation (A -> B Check)
  console.log("\n[STEP 2.1] Verifying ZERO LEAKAGE for User B from User A...");
  const dbUserB = await getDbUser(userBRecord.id);
  const userBByEmail = await getDbUserByEmail(userBEmail);
  const ordersB = await getCustomerOrders({
    userId: userBRecord.id,
    phone: userBRecord.phone, // synthetic phone
    email: userBEmail,
  });

  console.log(`- User B DB Addresses: ${dbUserB?.addresses?.length} (Expected: 0)`);
  console.log(`- User B DB Phone: ${dbUserB?.phone} (Synthetic, Not verified: ${dbUserB?.phoneVerified})`);
  console.log(`- User B Orders: ${ordersB.length} (Expected: 0)`);

  if (dbUserB?.addresses?.length !== 0) {
    throw new Error(`CRITICAL LEAK: User B has ${dbUserB?.addresses?.length} addresses! Expected 0.`);
  }
  if (ordersB.length !== 0) {
    throw new Error(`CRITICAL LEAK: User B sees ${ordersB.length} orders belonging to other users!`);
  }
  if (userBByEmail?.addresses?.length !== 0) {
    throw new Error(`CRITICAL LEAK: User B query by email returned addresses!`);
  }
  console.log("✓ PASSED: User B sees ZERO addresses and ZERO orders from User A!");

  // ── 3. Add Unique Address and Order for User B (B -> A Check) ─────────────
  console.log("\n[STEP 3] Adding Address & Order for User B...");
  const userBRealPhone = "9844556677";
  await updateUserPhoneInDb(userBRecord.id, userBRealPhone, userBEmail);

  const addrBRes = await saveUserAddress(userBRecord.id, {
    line1: "Villa 5, Green Meadows",
    line2: "Channasandra Main Road, Whitefield",
    city: "Bangalore",
    state: "Karnataka",
    pincode: "560066",
    label: "Work",
    isDefault: true,
  });
  if (!addrBRes.success || !addrBRes.address) throw new Error("Failed to save address for User B");
  console.log(`✓ Address added for User B: ${addrBRes.address.street}`);

  const orderBRes = await createOrder({
    customerName: "Diya Patel",
    customerPhone: userBRealPhone,
    customerEmail: userBEmail,
    shippingAddress: {
      fullName: "Diya Patel",
      phone: userBRealPhone,
      street: "Villa 5, Green Meadows, Whitefield",
      city: "Bangalore",
      state: "Karnataka",
      pincode: "560066",
    },
    subtotal: 900,
    deliveryFee: 0,
    discount: 0,
    total: 900,
    paymentMethod: "UPI",
    paymentStatus: "Paid",
    items: [
      {
        productId: sampleProduct.id,
        productName: sampleProduct.name,
        variantId: "default",
        variantDetails: "Standard",
        boxQuantity: 10,
        pricePerBox: 90,
        totalPrice: 900,
      },
    ],
  });
  if (!orderBRes.success || !orderBRes.order) throw new Error("Failed to create Order for User B");
  const orderB = orderBRes.order;
  console.log(`✓ Order placed for User B: #${orderB.id}`);

  // ── 4. Verify Bidirectional Strict Isolation (A then B, and B then A) ───────
  console.log("\n[STEP 4] Verifying Bidirectional Strict Isolation (A <-> B)...");
  const recheckUserA = await getDbUser(userA.id);
  const recheckOrdersA = await getCustomerOrders({ userId: userA.id, phone: userAPhone, email: userAEmail });

  const recheckUserB = await getDbUser(userBRecord.id);
  const recheckOrdersB = await getCustomerOrders({ userId: userBRecord.id, phone: userBRealPhone, email: userBEmail });

  console.log(`- User A Addresses: ${recheckUserA?.addresses?.map((a) => a.street).join(", ")}`);
  console.log(`- User A Orders: ${recheckOrdersA.map((o) => `#${o.id} (${o.customerEmail})`).join(", ")}`);

  console.log(`- User B Addresses: ${recheckUserB?.addresses?.map((a) => a.street).join(", ")}`);
  console.log(`- User B Orders: ${recheckOrdersB.map((o) => `#${o.id} (${o.customerEmail})`).join(", ")}`);

  // Assertions
  if (recheckUserA?.addresses?.length !== 1 || !recheckUserA.addresses[0].street.includes("Palm Heights")) {
    throw new Error("User A address corrupted or polluted by User B!");
  }
  if (recheckOrdersA.length !== 1 || recheckOrdersA[0].id !== orderA.id) {
    throw new Error("User A orders corrupted or contains User B order!");
  }

  if (recheckUserB?.addresses?.length !== 1 || !recheckUserB.addresses[0].street.includes("Green Meadows")) {
    throw new Error("User B address corrupted or contains User A address!");
  }
  if (recheckOrdersB.length !== 1 || recheckOrdersB[0].id !== orderB.id) {
    throw new Error("User B orders corrupted or contains User A order!");
  }

  console.log("\n==========================================================================");
  console.log("✓ ALL STRICT USER PRIVACY, ADDRESS & ORDER ISOLATION CHECKS PASSED 100%!");
  console.log("==========================================================================");

  // Clean up test data
  console.log("\nCleaning up test artifacts...");
  await prisma.orderItem.deleteMany({ where: { orderId: { in: [orderA.id, orderB.id] } } });
  await prisma.order.deleteMany({ where: { id: { in: [orderA.id, orderB.id] } } });
  await prisma.address.deleteMany({ where: { userId: { in: [userA.id, userBRecord.id] } } });
  await prisma.user.deleteMany({ where: { id: { in: [userA.id, userBRecord.id] } } });
  console.log("✓ Test users & test orders cleaned up successfully.");
}

verifyUserPrivacyIsolation()
  .catch((err) => {
    console.error("ISOLATION TEST FAILED:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
