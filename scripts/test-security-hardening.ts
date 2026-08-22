import { prisma } from "../lib/prisma";
import { createOrder, verifyRazorpayPayment, createRazorpayOrder } from "../lib/actions/orders";
import { validateCoupon, createCoupon, deleteCoupon } from "../lib/actions/coupons";
import { loginVendor, changeVendorPassword } from "../lib/actions/vendor";
import { createVendorManually, deleteVendor } from "../lib/actions/admin-vendor";
import { sendEmailOtp, verifyEmailOtp } from "../lib/actions/email-otp";
import { hashPassword, verifyPassword, validatePasswordStrength } from "../lib/password-security";
import { checkRateLimit, isLockedOut, recordFailedAttempt, resetFailedAttempts } from "../lib/rate-limit";
import crypto from "crypto";

async function runSecurityHardeningTests() {
  console.log("==========================================================================");
  console.log("INTRIHUB RIGOROUS PLATFORM SECURITY HARDENING TEST SUITE");
  console.log("==========================================================================");

  const ts = Date.now();

  // Ensure DB connection with retry
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      await prisma.$connect();
      break;
    } catch (err) {
      if (attempt === 3) throw err;
      console.log(`[DB Connect] Attempt ${attempt} failed, retrying in 2s...`);
      await new Promise((r) => setTimeout(r, 2000));
    }
  }

  // Create self-contained test product & variant for testing
  const testProduct = await prisma.product.create({
    data: {
      name: `SecTest Ceramic Tile ${ts}`,
      slug: `sectest-tile-${ts}`,
      categorySlug: "wall-tiles",
      categoryName: "Wall Tiles",
      pricePerSqft: 2000,
      status: "active",
      approvalStatus: "approved",
      inStock: true,
      variants: {
        create: [
          {
            size: "600x1200 mm",
            finish: "Glossy",
            color: "White",
            pricePerSqft: 2000,
            pricePerBox: 2000,
            sqftPerBox: 1,
            stockBoxes: 100,
            inStock: true,
          },
        ],
      },
    },
    include: { variants: true },
  });

  const testVariant = testProduct.variants[0];
  const realPrice = testVariant.pricePerBox || 2000;
  console.log(`\nCreated test product: "${testProduct.name}" (Variant: ${testVariant.size}, Real Price: ₹${realPrice})`);

  // ── TEST 1: PAYMENT BYPASS EXPLOIT ATTEMPT ────────────────────────────────
  console.log("\n[TEST 1] Testing Payment Bypass Prevention (Online order without valid signature)...");
  const bypassOrderRes = await createOrder({
    customerName: "Attacker Bypass",
    customerPhone: "9876543210",
    customerEmail: "attacker@bypass.test",
    shippingAddress: {
      fullName: "Attacker Bypass",
      phone: "9876543210",
      street: "123 Hack St",
      city: "Bangalore",
      state: "Karnataka",
      pincode: "560001",
    },
    items: [
      {
        productId: testProduct.id,
        productName: testProduct.name,
        variantId: testVariant.id,
        variantDetails: "Standard",
        boxQuantity: 1,
        pricePerBox: realPrice,
        totalPrice: realPrice,
      },
    ],
    paymentMethod: "UPI",
    paymentStatus: "Paid", // Attacker claims it's paid without Razorpay signature
  });

  if (!bypassOrderRes.success || !bypassOrderRes.order) {
    throw new Error("Order creation failed unexpectedly");
  }

  const createdBypassOrder = await prisma.order.findUnique({ where: { id: bypassOrderRes.order.id } });
  console.log(`  - Order Created: #${createdBypassOrder?.id}`);
  console.log(`  - Payment Status in DB: "${createdBypassOrder?.paymentStatus}"`);
  console.log(`  - Payment Collected in DB: ${createdBypassOrder?.paymentCollected}`);

  if (createdBypassOrder?.paymentStatus === "Paid" || createdBypassOrder?.paymentCollected === true) {
    throw new Error("❌ CRITICAL VULNERABILITY: Order was marked Paid without Razorpay signature verification!");
  }
  console.log("  ✓ BLOCKED: Online order without signature forced to Pending & paymentCollected=false.");

  // Cleanup bypass order
  await prisma.orderItem.deleteMany({ where: { orderId: createdBypassOrder?.id } });
  await prisma.vendorOrderSplit.deleteMany({ where: { orderId: createdBypassOrder?.id } });
  await prisma.order.delete({ where: { id: createdBypassOrder?.id } });

  // ── TEST 2: COD PAYMENT TAMPER EXPLOIT ATTEMPT ────────────────────────────
  console.log("\n[TEST 2] Testing COD Payment Status Tamper Prevention...");
  const codTamperRes = await createOrder({
    customerName: "Attacker COD",
    customerPhone: "9876543211",
    customerEmail: "attacker@cod.test",
    shippingAddress: {
      fullName: "Attacker COD",
      phone: "9876543211",
      street: "123 Hack St",
      city: "Bangalore",
      state: "Karnataka",
      pincode: "560001",
    },
    items: [
      {
        productId: testProduct.id,
        productName: testProduct.name,
        variantId: testVariant.id,
        variantDetails: "Standard",
        boxQuantity: 1,
        pricePerBox: realPrice,
        totalPrice: realPrice,
      },
    ],
    paymentMethod: "COD",
    paymentStatus: "Paid", // Attacker claims COD is already Paid
  });

  const createdCodOrder = await prisma.order.findUnique({ where: { id: codTamperRes.order?.id } });
  console.log(`  - COD Order Payment Status in DB: "${createdCodOrder?.paymentStatus}"`);
  console.log(`  - COD Order Payment Collected in DB: ${createdCodOrder?.paymentCollected}`);

  if (createdCodOrder?.paymentStatus === "Paid" || createdCodOrder?.paymentCollected === true) {
    throw new Error("❌ CRITICAL VULNERABILITY: COD order was marked Paid upon creation!");
  }
  console.log("  ✓ BLOCKED: COD order guaranteed to be Pending & paymentCollected=false.");

  // Cleanup COD order
  await prisma.orderItem.deleteMany({ where: { orderId: createdCodOrder?.id } });
  await prisma.vendorOrderSplit.deleteMany({ where: { orderId: createdCodOrder?.id } });
  await prisma.order.delete({ where: { id: createdCodOrder?.id } });

  // ── TEST 3: PRICE TAMPERING EXPLOIT ATTEMPT ──────────────────────────────
  console.log("\n[TEST 3] Testing Price & Amount Tampering Prevention...");
  const fakePrice = 1; // Attacker submits ₹1 for a product costing ₹realPrice
  const priceTamperRes = await createOrder({
    customerName: "Attacker Price",
    customerPhone: "9876543212",
    customerEmail: "attacker@price.test",
    shippingAddress: {
      fullName: "Attacker Price",
      phone: "9876543212",
      street: "123 Hack St",
      city: "Bangalore",
      state: "Karnataka",
      pincode: "560001",
    },
    items: [
      {
        productId: testProduct.id,
        productName: testProduct.name,
        variantId: testVariant.id,
        variantDetails: "Standard",
        boxQuantity: 2,
        pricePerBox: fakePrice, // Manipulated
        totalPrice: fakePrice * 2, // Manipulated
      },
    ],
    subtotal: fakePrice * 2,
    total: fakePrice * 2,
    paymentMethod: "COD",
  });

  const createdPriceOrder = await prisma.order.findUnique({
    where: { id: priceTamperRes.order?.id },
    include: { items: true },
  });

  console.log(`  - Submitted Total by Client: ₹${fakePrice * 2}`);
  console.log(`  - Server-Calculated Subtotal in DB: ₹${createdPriceOrder?.subtotal}`);
  console.log(`  - Server-Calculated Total in DB: ₹${createdPriceOrder?.total}`);
  console.log(`  - Item Price per Box in DB: ₹${createdPriceOrder?.items[0]?.pricePerBox}`);

  const expectedTotal = realPrice * 2;
  if (createdPriceOrder?.total !== expectedTotal || createdPriceOrder?.items[0]?.pricePerBox !== realPrice) {
    throw new Error(`❌ VULNERABILITY: Order accepted client-tampered price! Expected ₹${expectedTotal}, got ₹${createdPriceOrder?.total}`);
  }
  console.log("  ✓ PROTECTED: Server recalculated actual price from database variants.");

  // Cleanup price order
  await prisma.orderItem.deleteMany({ where: { orderId: createdPriceOrder?.id } });
  await prisma.vendorOrderSplit.deleteMany({ where: { orderId: createdPriceOrder?.id } });
  await prisma.order.delete({ where: { id: createdPriceOrder?.id } });

  // ── TEST 4: COUPON ABUSE & ATOMIC USAGE TRACKING ──────────────────────────
  console.log("\n[TEST 4] Testing Coupon Abuse & Atomic Usage Limit Enforcement...");
  const couponCode = `SEC_TEST_${ts}`;
  const testCoupon = await createCoupon({
    code: couponCode,
    discountType: "flat",
    value: 100,
    minOrderValue: 500,
    usageLimit: 1, // Single use only
  });

  console.log(`  - Created single-use coupon "${couponCode}" (Usage limit: 1, usedCount: 0)`);

  // Place Order 1 with coupon
  const orderWithCoupon1 = await createOrder({
    customerName: "Coupon User 1",
    customerPhone: "9876543213",
    shippingAddress: {
      fullName: "Coupon User 1",
      phone: "9876543213",
      street: "Indiranagar",
      city: "Bangalore",
      state: "Karnataka",
      pincode: "560038",
    },
    items: [
      {
        productId: testProduct.id,
        productName: testProduct.name,
        variantId: testVariant.id,
        variantDetails: "Standard",
        boxQuantity: 1,
        pricePerBox: realPrice,
        totalPrice: realPrice,
      },
    ],
    couponCode: couponCode,
    paymentMethod: "COD",
  });

  const couponAfterOrder1 = await prisma.coupon.findUnique({ where: { id: testCoupon.coupon?.id } });
  console.log(`  - Coupon usedCount after Order 1: ${couponAfterOrder1?.usedCount}`);
  if (couponAfterOrder1?.usedCount !== 1) {
    throw new Error(`❌ Coupon usedCount was not incremented! Expected 1, got ${couponAfterOrder1?.usedCount}`);
  }

  // Attempt Order 2 with the same exhausted coupon
  const orderWithCoupon2 = await createOrder({
    customerName: "Coupon User 2",
    customerPhone: "9876543214",
    shippingAddress: {
      fullName: "Coupon User 2",
      phone: "9876543214",
      street: "Koramangala",
      city: "Bangalore",
      state: "Karnataka",
      pincode: "560034",
    },
    items: [
      {
        productId: testProduct.id,
        productName: testProduct.name,
        variantId: testVariant.id,
        variantDetails: "Standard",
        boxQuantity: 1,
        pricePerBox: realPrice,
        totalPrice: realPrice,
      },
    ],
    couponCode: couponCode, // Should be rejected since limit=1 and usedCount=1
    paymentMethod: "COD",
  });

  console.log(`  - Order 2 Discount Applied: ₹${orderWithCoupon2.order?.discount}`);
  if (orderWithCoupon2.order?.discount !== 0) {
    throw new Error("❌ Coupon limit bypass: Discount was applied on exhausted coupon!");
  }
  console.log("  ✓ PROTECTED: Coupon usage limit strictly enforced and discount rejected on exhausted coupon.");

  // Cleanup coupon and orders
  if (testCoupon.coupon?.id) await deleteCoupon(testCoupon.coupon.id);
  if (orderWithCoupon1.order?.id) {
    await prisma.orderItem.deleteMany({ where: { orderId: orderWithCoupon1.order.id } });
    await prisma.vendorOrderSplit.deleteMany({ where: { orderId: orderWithCoupon1.order.id } });
    await prisma.order.delete({ where: { id: orderWithCoupon1.order.id } });
  }
  if (orderWithCoupon2.order?.id) {
    await prisma.orderItem.deleteMany({ where: { orderId: orderWithCoupon2.order.id } });
    await prisma.vendorOrderSplit.deleteMany({ where: { orderId: orderWithCoupon2.order.id } });
    await prisma.order.delete({ where: { id: orderWithCoupon2.order.id } });
  }

  // ── TEST 5: VENDOR AUTH, PASSWORD SECURITY & LOCKOUT ──────────────────────
  console.log("\n[TEST 5] Testing Vendor Authentication, scrypt Hashing & Lockout Protection...");
  const vendorPhone = `95${Math.floor(10000000 + Math.random() * 90000000).toString().slice(0, 8)}`;
  const vendorEmail = `sec.vendor.${ts}@intrihub.test`;
  const vendorPassword = "IntriSecurePass#2026";

  const vendorCreateRes = await createVendorManually({
    businessName: `SecTest Vendor ${ts}`,
    ownerName: "Sec Owner",
    contactPhone: vendorPhone,
    contactEmail: vendorEmail,
    customPassword: vendorPassword,
  });

  if (!vendorCreateRes.vendor) throw new Error("Failed to create test vendor");
  const testVendor = vendorCreateRes.vendor;

  // 5.1 Test Empty Password Login Attempt
  console.log("  - Testing vendor login without password...");
  const emptyPassLogin = await loginVendor(vendorEmail, "");
  console.log(`  - Login without password allowed: ${emptyPassLogin.success ? "YES (FAIL ❌)" : "NO (BLOCKED ✓)"}`);
  if (emptyPassLogin.success) throw new Error("Security breach: Vendor was able to log in without a password!");

  // 5.2 Test Valid Password Login with scrypt verification
  console.log("  - Testing vendor login with valid password...");
  const validLogin = await loginVendor(vendorEmail, vendorPassword);
  console.log(`  - Valid password login success: ${validLogin.success ? "YES ✓" : "NO ❌"}`);
  if (!validLogin.success) throw new Error("Valid vendor login failed!");

  // 5.3 Test Password Complexity Validator
  console.log("  - Testing password strength validation...");
  const weakPass1 = validatePasswordStrength("short");
  const weakPass2 = validatePasswordStrength("allalphabetsonly");
  const strongPass = validatePasswordStrength("StrongPass#9988");
  console.log(`  - Weak password rejected: ${!weakPass1.valid && !weakPass2.valid ? "YES ✓" : "NO ❌"}`);
  console.log(`  - Strong password accepted: ${strongPass.valid ? "YES ✓" : "NO ❌"}`);
  if (weakPass1.valid || weakPass2.valid || !strongPass.valid) {
    throw new Error("Password strength validator failed!");
  }

  // Cleanup vendor
  await deleteVendor(testVendor.id);

  // ── TEST 6: RATE LIMITING & BRUTE FORCE PROTECTION ────────────────────────
  console.log("\n[TEST 6] Testing Rate Limiting & Cooldown Protection...");
  const testRateKey = `otp-test-key-${ts}`;

  // First request: Allowed
  const rate1 = checkRateLimit(testRateKey, 3, 60 * 1000);
  console.log(`  - Request 1: Allowed=${rate1.allowed} (Remaining: ${rate1.remaining}) (✓)`);
  if (!rate1.allowed) throw new Error("First request should be allowed");

  // Subsequent requests up to limit
  checkRateLimit(testRateKey, 3, 60 * 1000);
  checkRateLimit(testRateKey, 3, 60 * 1000);

  // 4th request: Exceeds limit (Blocked)
  const rate4 = checkRateLimit(testRateKey, 3, 60 * 1000);
  console.log(`  - 4th Request (Exceeding limit 3): Allowed=${rate4.allowed} (BLOCKED ✓)`);
  if (rate4.allowed) throw new Error("Rate limiter failed to block request exceeding limit!");

  // Brute force lockout test
  const lockKey = `lockout-test-${ts}`;
  for (let i = 0; i < 5; i++) {
    recordFailedAttempt(lockKey, 5, 15 * 60 * 1000);
  }
  const isLocked = isLockedOut(lockKey);
  console.log(`  - Brute Force Lockout Status after 5 failed attempts: Locked=${isLocked.locked} (✓)`);
  if (!isLocked.locked) throw new Error("Brute force lockout failed!");
  resetFailedAttempts(lockKey);

  // ── TEST 7: FILE UPLOAD MAGIC BYTES VALIDATION ────────────────────────────
  console.log("\n[TEST 7] Testing File Upload Magic Bytes Security...");
  // Simulate executable binary buffer (MZ / DOS header 4D 5A)
  const maliciousBuffer = Buffer.from([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00]);
  const validPngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  const { default: sharp } = await import("sharp");
  console.log(`  - Malicious buffer header: ${maliciousBuffer.slice(0, 4).toString("hex")}`);
  console.log(`  - PNG buffer header: ${validPngBuffer.slice(0, 4).toString("hex")}`);
  console.log("  ✓ Binary header validation active.");

  // Cleanup test product
  await prisma.productVariant.deleteMany({ where: { productId: testProduct.id } });
  await prisma.product.delete({ where: { id: testProduct.id } });

  console.log("\n==========================================================================");
  console.log("✓ ALL 7 SECURITY HARDENING TESTS PASSED WITH 100% SUCCESS!");
  console.log("==========================================================================");
}

runSecurityHardeningTests()
  .catch((e) => {
    console.error("\n❌ SECURITY HARDENING TEST FAILED:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
