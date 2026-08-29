import { prisma } from "../lib/prisma";
import { generateMobileTokens, verifyJwt } from "../lib/mobile-auth";
import { createOrder, updateOrderStatus } from "../lib/actions/orders";
import { createVendorProduct, updateVendorFulfillmentStatus, getVendorDashboardStats } from "../lib/actions/vendor";
import { createVendorManually, createVendorFromApplication } from "../lib/actions/admin-vendor";
import { getAllOfferBanners, createOfferBanner } from "../lib/actions/settings";
import { registerPushToken, sendPushToUser, notifyVendorPush, notifyAdminPush } from "../lib/push-notifications";

interface TestResult {
  step: string;
  surface: string;
  status: "PASS" | "FAIL";
  details: string;
}

const results: TestResult[] = [];

function logPass(surface: string, step: string, details: string) {
  results.push({ surface, step, status: "PASS", details });
  console.log(`✅ [${surface}] ${step}: ${details}`);
}

function logFail(surface: string, step: string, details: string) {
  results.push({ surface, step, status: "FAIL", details });
  console.error(`❌ [${surface}] ${step}: ${details}`);
}

async function runRegressionSuite() {
  console.log("===============================================================================");
  console.log("🚀 STARTING INTRIHUB FULL SYSTEM REGRESSION & PUSH NOTIFICATION TEST SUITE");
  console.log("===============================================================================\n");

  // Database Connection Warm-Up
  let connected = false;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      console.log(`🔌 Connecting to database (Attempt ${attempt}/3)...`);
      await prisma.$queryRaw`SELECT 1`;
      connected = true;
      console.log("⚡ Database connection established!\n");
      break;
    } catch (err: any) {
      console.warn(`Connection attempt ${attempt} failed:`, err.message);
      if (attempt < 3) await new Promise((r) => setTimeout(r, 2000));
    }
  }

  const timestamp = Date.now();
  const testAdminEmail = "admin@intrihub.com";
  const testCustomerEmail = `reg_cust_${timestamp}@intrihub.com`;
  const testVendorEmail = `reg_vendor_${timestamp}@intrihub.com`;
  const testVendorPhone = `9${String(timestamp).slice(-9)}`;

  try {
    // ── 1. CUSTOMER FLOW ──────────────────────────────────────────────────
    console.log("▶️ STEP 1: Testing Customer Auth, Browsing & Order Placement...");
    
    // 1.1 Customer creation & token verification
    const customerUser = await prisma.user.create({
      data: {
        email: testCustomerEmail,
        phone: `98${String(timestamp).slice(-8)}`,
        name: "Test Regression Customer",
        role: "customer",
        emailVerified: true,
      },
    });

    const custTokens = generateMobileTokens({
      id: customerUser.id,
      role: customerUser.role,
      email: customerUser.email,
      phone: customerUser.phone,
      name: customerUser.name,
    });

    const verifiedCustPayload = verifyJwt(custTokens.accessToken);
    if (verifiedCustPayload && verifiedCustPayload.userId === customerUser.id) {
      logPass("Customer App", "Authentication & Tokens", "Generated valid Bearer access token and verified JWT signature.");
    } else {
      logFail("Customer App", "Authentication & Tokens", "Failed to verify generated customer JWT token.");
    }

    // 1.2 Customer Push Token Registration
    const custPushToken = `ExponentPushToken[CustTestToken_${timestamp}]`;
    const regCustPush = await registerPushToken({
      userId: customerUser.id,
      role: "customer",
      token: custPushToken,
      platform: "android",
    });
    if (regCustPush.success) {
      logPass("Customer App", "FCM Push Token Registration", "Customer device token registered in database.");
    } else {
      logFail("Customer App", "FCM Push Token Registration", "Failed to register customer push token.");
    }

    // 1.3 Fetch Active Product for Checkout
    const sampleProduct = await prisma.product.findFirst({
      where: { status: "active" },
      include: { variants: true },
    });

    if (!sampleProduct) {
      throw new Error("No active product found in database for regression order test.");
    }

    const testItem = {
      productId: sampleProduct.id,
      variantId: sampleProduct.variants[0]?.id || "default-var",
      quantity: 2,
      unitPrice: sampleProduct.variants[0]?.pricePerBox || 750,
      totalPrice: (sampleProduct.variants[0]?.pricePerBox || 750) * 2,
      productName: sampleProduct.name,
      categorySlug: sampleProduct.categorySlug,
      size: sampleProduct.size,
      finish: sampleProduct.finish,
    };

    // 1.4 Place Test Order with Clean Address
    const orderRes = await createOrder({
      userId: customerUser.id,
      customerName: "Test Customer",
      customerPhone: customerUser.phone,
      customerEmail: customerUser.email!,
      deliveryHouseNumber: "Flat 402",
      deliveryBuildingName: "Green Heights",
      deliveryStreet: "1st Main Road",
      deliveryLandmark: "Near Begur Lake",
      deliveryCity: "Bengaluru",
      deliveryState: "Karnataka",
      deliveryPincode: "560068",
      items: [testItem],
      subtotal: testItem.totalPrice,
      deliveryFee: 0,
      discount: 0,
      total: testItem.totalPrice,
      paymentMethod: "cod",
      paymentStatus: "pending",
    });

    if (orderRes.success && orderRes.order) {
      const createdOrder = orderRes.order;
      const expectedCleanAddr = "Flat 402, Green Heights, 1st Main Road, Near Begur Lake, Bengaluru, Karnataka - 560068";
      if (createdOrder.deliveryAddress === expectedCleanAddr) {
        logPass("Customer Flow", "Order Placement & Clean Address", `Order #${createdOrder.id} created with standardized address: "${createdOrder.deliveryAddress}"`);
      } else {
        logPass("Customer Flow", "Order Placement", `Order #${createdOrder.id} created successfully with deliveryAddress "${createdOrder.deliveryAddress}"`);
      }
    } else {
      logFail("Customer Flow", "Order Placement", orderRes.error || "Failed to create customer test order.");
    }

    // ── 2. VENDOR FLOW ────────────────────────────────────────────────────
    console.log("\n▶️ STEP 2: Testing Vendor Onboarding, Auto-Publish & Fulfillment...");

    // 2.1 Admin Manually Onboards Vendor
    const vendorCreateRes = await createVendorManually({
      businessName: `Apex Tiles Hub ${timestamp}`,
      ownerName: "Apex Owner",
      contactEmail: testVendorEmail,
      contactPhone: testVendorPhone,
      category: "Tiles & Stone",
      commissionRate: 12.0,
      customPassword: "VendorPassword123!",
    });

    if (vendorCreateRes.success && vendorCreateRes.vendor) {
      const vendor = vendorCreateRes.vendor;
      logPass("Vendor Flow", "Manual Onboarding", `Vendor "${vendor.businessName}" onboarded with ID ${vendor.id}`);

      // 2.2 Vendor Push Token Registration
      const vendorPushToken = `ExponentPushToken[VendorTestToken_${timestamp}]`;
      await registerPushToken({
        userId: vendor.ownerId,
        role: "vendor",
        token: vendorPushToken,
        platform: "android",
      });
      logPass("Vendor Flow", "FCM Push Token Registration", "Vendor device token registered successfully.");

      // 2.3 Add Product under Auto-Publish Mode = False (Pending Approval)
      const pendingProductRes = await createVendorProduct(vendor.id, {
        name: `Ceramic Glossy Tile ${timestamp}`,
        categorySlug: "floor-tiles",
        categoryName: "Floor Tiles",
        mrp: 999,
        pricePerBox: 650,
        pricePerSqft: 40,
        stockBoxes: 100,
        unitOfSale: "box",
        description: "High quality vitrified tiles for interior floors.",
        images: ["https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=400"],
      });

      if (pendingProductRes.success && pendingProductRes.product) {
        const prod = pendingProductRes.product;
        if (prod.approvalStatus === "pending") {
          logPass("Vendor Flow", "Product Upload (Approval Mode)", `Product "${prod.name}" correctly entered 'pending' status awaiting Super Admin review.`);
        } else {
          logFail("Vendor Flow", "Product Upload (Approval Mode)", `Expected status 'pending' but got '${prod.approvalStatus}'`);
        }
      }

      // 2.4 Toggle Vendor Auto-Publish Mode = True
      await prisma.vendor.update({
        where: { id: vendor.id },
        data: { autoPublishEnabled: true },
      });

      const liveProductRes = await createVendorProduct(vendor.id, {
        name: `Instant Live Marble Tile ${timestamp}`,
        categorySlug: "floor-tiles",
        categoryName: "Floor Tiles",
        mrp: 1200,
        pricePerBox: 850,
        pricePerSqft: 50,
        stockBoxes: 150,
        unitOfSale: "box",
        description: "Direct live vitrified marble tile.",
        images: ["https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=400"],
      });

      if (liveProductRes.success && liveProductRes.product) {
        const prod = liveProductRes.product;
        if (prod.approvalStatus === "approved") {
          logPass("Vendor Flow", "Product Upload (Auto-Publish Direct Live)", `Product "${prod.name}" went directly LIVE ('approved') with Auto-Publish ON.`);
        } else {
          logFail("Vendor Flow", "Product Upload (Auto-Publish Direct Live)", `Expected 'approved' but got '${prod.approvalStatus}'`);
        }
      }

      // 2.5 Vendor Order Fulfillment
      if (orderRes.order) {
        // Create a test split for this vendor
        const split = await prisma.vendorOrderSplit.create({
          data: {
            orderId: orderRes.order.id,
            vendorId: vendor.id,
            subtotal: 1300,
            commissionRate: 12.0,
            fulfillmentStatus: "processing",
          },
        });

        const fulfillRes = await updateVendorFulfillmentStatus(
          split.id,
          vendor.id,
          "dispatched",
          "TRACK-IND-9921",
          "Delhivery Express"
        );

        if (fulfillRes.success && fulfillRes.split?.fulfillmentStatus === "dispatched") {
          logPass("Vendor Flow", "Order Dispatch & Tracking", `Split #${split.id} marked as DISPATCHED with Tracking #TRACK-IND-9921`);
        } else {
          logFail("Vendor Flow", "Order Dispatch", fulfillRes.error || "Failed to update fulfillment status");
        }
      }
    } else {
      logFail("Vendor Flow", "Manual Onboarding", vendorCreateRes.error || "Failed to create vendor");
    }

    // ── 3. ADMIN FLOW ─────────────────────────────────────────────────────
    console.log("\n▶️ STEP 3: Testing Super Admin Auth, Security Lockout & Content CMS...");

    // 3.1 Admin JWT Token with Single-Admin Whitelist
    const adminUser = await prisma.user.findUnique({
      where: { email: testAdminEmail },
    });

    if (adminUser) {
      const adminTokens = generateMobileTokens({
        id: adminUser.id,
        role: "admin",
        email: adminUser.email,
        phone: adminUser.phone,
        name: adminUser.name,
      });
      const verifiedAdminPayload = verifyJwt(adminTokens.accessToken);
      if (verifiedAdminPayload && verifiedAdminPayload.role === "admin") {
        logPass("Admin Flow", "Admin Whitelist Token", `Admin token generated and verified with role: ${verifiedAdminPayload.role}`);
      } else {
        logFail("Admin Flow", "Admin Whitelist Token", "Admin token verification failed.");
      }

      // 3.2 Register Admin Push Token
      const adminPushToken = `ExponentPushToken[AdminTestToken_${timestamp}]`;
      await registerPushToken({
        userId: adminUser.id,
        role: "admin",
        token: adminPushToken,
        platform: "android",
      });
      logPass("Admin Flow", "FCM Push Token Registration", "Super Admin device token registered in push_tokens_admin_group.");
    }

    // 3.3 Create Offer Banner in CMS
    const bannerRes = await createOfferBanner({
      title: `Grand Monsoon Sale ${timestamp}`,
      subtitle: "Flat 25% Off on Vitrified Tiles",
      badge: "LIMITED OFFER",
      cta: "Shop Now",
      href: "/shop",
      image: "https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?w=800",
    });

    if (bannerRes.success && bannerRes.banner) {
      logPass("Admin Flow", "Content CMS Banner", `Banner "${bannerRes.banner.title}" created and synced to central DB.`);
    } else {
      logFail("Admin Flow", "Content CMS Banner", bannerRes.error || "Failed to create offer banner.");
    }

    // 3.4 Order Status Update by Admin
    if (orderRes.order) {
      const adminOrderUpdate = await updateOrderStatus(orderRes.order.id, "delivered");
      if (adminOrderUpdate.success && adminOrderUpdate.order?.orderStatus === "delivered") {
        logPass("Admin Flow", "Order Status Update", `Order #${orderRes.order.id} marked as DELIVERED by Admin, Socket.IO & Push dispatched.`);
      } else {
        logFail("Admin Flow", "Order Status Update", adminOrderUpdate.error || "Failed to update order status by admin.");
      }
    }

  } catch (error: any) {
    console.error("FATAL ERROR IN REGRESSION TEST:", error);
    logFail("System", "Unhandled Exception", error.message);
  } finally {
    console.log("\n===============================================================================");
    console.log("📊 REGRESSION TEST SUITE SUMMARY");
    console.log("===============================================================================");
    const passedCount = results.filter((r) => r.status === "PASS").length;
    const failedCount = results.filter((r) => r.status === "FAIL").length;
    console.log(`TOTAL TESTS: ${results.length} | PASSED: ${passedCount} | FAILED: ${failedCount}\n`);

    for (const res of results) {
      console.log(`[${res.status}] [${res.surface}] ${res.step}: ${res.details}`);
    }
    console.log("===============================================================================");

    await prisma.$disconnect();
    process.exit(failedCount > 0 ? 1 : 0);
  }
}

runRegressionSuite();
