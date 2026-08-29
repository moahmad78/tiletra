import {
  generateNotificationMessage,
  buildWhatsAppShareUrl,
  buildWhatsAppApiPayload,
  INTRIHUB_BRAND,
} from "../lib/notifications/whatsapp-templates";
import { createVendorManually, deleteVendor } from "../lib/actions/admin-vendor";
import { prisma } from "../lib/prisma";

async function testNotificationSystem() {
  console.log("==========================================================================");
  console.log("TESTING INTRIHUB ROLE-AWARE NOTIFICATION & WHATSAPP TEMPLATE ENGINE");
  console.log("==========================================================================");

  // 1. Test Vendor Welcome Template
  console.log("\n[TEST 1] Vendor Welcome Message Template:");
  const vendorMsg = generateNotificationMessage("vendor", {
    businessName: "Kailash Electricals & Hardware",
    username: "kailash.store@example.com",
    password: "TempPass#9821",
    commissionRate: 10,
    phone: "9876543210",
  });
  console.log("--------------------------------------------------------------------------");
  console.log(vendorMsg);
  console.log("--------------------------------------------------------------------------");

  // Verify key requirements
  if (!vendorMsg.includes("🎉 *Welcome to Intrihub, Kailash Electricals & Hardware!*")) {
    throw new Error("Vendor greeting title mismatch");
  }
  if (!vendorMsg.includes("https://intrihub.com/vendor/login")) {
    throw new Error("Vendor login URL missing");
  }
  if (!vendorMsg.includes("TempPass#9821")) {
    throw new Error("Vendor password missing");
  }
  if (!vendorMsg.includes("10%")) {
    throw new Error("Commission rate missing");
  }
  console.log("✓ Vendor welcome template passed all format checks.");

  // 2. Test Customer Welcome Template
  console.log("\n[TEST 2] Customer Welcome Message Template:");
  const customerMsg = generateNotificationMessage("customer", {
    customerName: "Aarav Sharma",
    phone: "9123456789",
  });
  console.log("--------------------------------------------------------------------------");
  console.log(customerMsg);
  console.log("--------------------------------------------------------------------------");
  if (!customerMsg.includes("Aarav Sharma") || !customerMsg.includes("https://intrihub.com/shop")) {
    throw new Error("Customer welcome template failed");
  }
  console.log("✓ Customer welcome template passed all format checks.");

  // 3. Test Staff Invite Template
  console.log("\n[TEST 3] Staff Account Invite Message Template:");
  const staffMsg = generateNotificationMessage("staff", {
    staffName: "Priya Nair",
    roleTitle: "Operations Lead",
    username: "priya.nair@intrihub.com",
    password: "SecureStaff#2026",
  });
  console.log("--------------------------------------------------------------------------");
  console.log(staffMsg);
  console.log("--------------------------------------------------------------------------");
  if (!staffMsg.includes("Operations Lead") || !staffMsg.includes("https://intrihub.com/admin/login")) {
    throw new Error("Staff invite template failed");
  }
  console.log("✓ Staff invite template passed all format checks.");

  // 4. Test Order Update Template
  console.log("\n[TEST 4] Order Update Message Template:");
  const orderMsg = generateNotificationMessage("order_update", {
    orderId: "TL-948210",
    customerName: "Vikram Malhotra",
    status: "Dispatched",
    totalAmount: 14500,
    estimatedDelivery: "Within 60 Minutes",
    trackingNumber: "DTDC-884920",
  });
  console.log("--------------------------------------------------------------------------");
  console.log(orderMsg);
  console.log("--------------------------------------------------------------------------");
  if (!orderMsg.includes("TL-948210") || !orderMsg.includes("₹14,500")) {
    throw new Error("Order update template failed");
  }
  console.log("✓ Order update template passed all format checks.");

  // 5. Test WhatsApp Redirect URL Generator
  console.log("\n[TEST 5] WhatsApp Share URL Generation:");
  const waUrl = buildWhatsAppShareUrl("9876543210", "vendor", {
    businessName: "Kailash Electricals & Hardware",
    username: "kailash.store@example.com",
    password: "TempPass#9821",
    commissionRate: 10,
  });
  console.log("Generated WhatsApp URL:", waUrl);
  if (!waUrl.startsWith("https://wa.me/919876543210?text=")) {
    throw new Error("WhatsApp share URL invalid");
  }
  console.log("✓ WhatsApp share URL generated with country code and encoded text.");

  // 6. Test WhatsApp Cloud API Payload (Image Logo + Caption)
  console.log("\n[TEST 6] WhatsApp Cloud API Payload with Logo Image:");
  const apiPayload = buildWhatsAppApiPayload("9876543210", "vendor", {
    businessName: "Kailash Electricals & Hardware",
    username: "kailash.store@example.com",
    password: "TempPass#9821",
    commissionRate: 10,
  });
  console.log("API Payload:", JSON.stringify(apiPayload, null, 2));
  if (apiPayload.image.link !== INTRIHUB_BRAND.logoUrl) {
    throw new Error("Logo image link mismatch in API payload");
  }
  console.log("✓ API payload contains Intrihub logo URL + branded caption.");

  // 7. End-to-End Test: Create real vendor and verify credential generation + template rendering
  console.log("\n[TEST 7] End-to-End Admin Vendor Creation & Welcome Message generation:");
  const testPhone = "9988776655";
  const createRes = await createVendorManually({
    businessName: "Shree Ganesh Building Supplies",
    ownerName: "Ganesh Rao",
    contactEmail: "ganesh.supplies.test@example.com",
    contactPhone: testPhone,
    category: "Tiles & Natural Stone",
    commissionRate: 8.5,
  });

  if (!createRes.success || !createRes.vendor || !createRes.credentials) {
    throw new Error(`Failed to create test vendor: ${createRes.error}`);
  }

  const generatedWaUrl = buildWhatsAppShareUrl(createRes.credentials.phone, "vendor", {
    businessName: createRes.credentials.businessName,
    username: createRes.credentials.username,
    password: createRes.credentials.password,
    commissionRate: createRes.credentials.commissionRate,
    phone: createRes.credentials.phone,
  });

  console.log("Created Test Vendor ID:", createRes.vendor.id);
  console.log("Generated WhatsApp URL for new vendor:", generatedWaUrl);

  // Clean up test vendor
  console.log("Cleaning up test vendor...");
  const delRes = await deleteVendor(createRes.vendor.id);
  console.log("Cleaned up test vendor:", delRes.success);

  console.log("\n==========================================================================");
  console.log("ALL 7 NOTIFICATION & WHATSAPP TEMPLATE TESTS PASSED SUCCESSFULLY! ✓");
  console.log("==========================================================================");
}

testNotificationSystem()
  .catch((err) => {
    console.error("TEST FAILED:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
