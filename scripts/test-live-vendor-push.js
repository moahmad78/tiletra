const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  console.log("=================================================");
  console.log("🔍 TESTING LIVE VENDOR PUSH NOTIFICATION DELIVERY");
  console.log("=================================================");

  // Find recent vendor device tokens
  const vendorTokens = await prisma.deviceToken.findMany({
    where: {
      role: 'vendor',
      platform: 'android'
    },
    orderBy: { updatedAt: 'desc' },
    take: 5,
    include: {
      user: {
        select: { id: true, name: true, phone: true, email: true }
      }
    }
  });

  if (vendorTokens.length === 0) {
    console.log("❌ No vendor device tokens found in database!");
    return;
  }

  console.log(`Found ${vendorTokens.length} vendor device tokens:`);
  vendorTokens.forEach((vt, i) => {
    console.log(` [${i+1}] ${vt.user?.name || "Unknown"} (${vt.user?.phone}) -> ...${vt.token.slice(-10)} (Updated: ${vt.updatedAt.toISOString()})`);
  });

  // Pick the most recently active vendor (RAY ENTERPRISES or similar)
  const target = vendorTokens[0];
  console.log(`\n🎯 Target Device: ${target.user?.name} (${target.user?.phone})`);
  console.log(`🔑 Token: ${target.token}`);

  const payload = {
    to: target.token,
    title: "🚨 NEW ORDER ALERT! #TEST-9999",
    body: "₹18,500 • Premium Vitrified Tiles - Tap to accept & dispatch immediately!",
    sound: "default",
    priority: "high",
    channelId: "orders_high_importance",
    data: {
      type: "PENDING_VENDOR_APPROVAL",
      orderId: "TEST-9999",
      amount: 18500,
      totalAmount: 18500,
      customerName: "Rahul Sharma (HSR Layout)",
      screen: "/(vendor)/orders",
      isNewOrder: true,
      requiresManualApproval: true,
      warning: "Immediate action needed (15 min auto-cancel)"
    }
  };

  console.log("\n📤 Sending push payload to Expo Push API...");
  const headers = {
    "Accept": "application/json",
    "Accept-Encoding": "gzip, deflate",
    "Content-Type": "application/json",
  };
  if (process.env.EXPO_ACCESS_TOKEN) {
    headers["Authorization"] = `Bearer ${process.env.EXPO_ACCESS_TOKEN}`;
    console.log("🔐 EXPO_ACCESS_TOKEN is configured in environment");
  } else {
    console.log("ℹ️ No EXPO_ACCESS_TOKEN set (using standard rate-limit tier)");
  }

  const res = await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  const responseJson = await res.json();
  console.log("📥 Expo Send Response HTTP Status:", res.status);
  console.log("📦 Expo Send Response Body:", JSON.stringify(responseJson, null, 2));

  const ticketData = responseJson?.data;
  const ticketId = Array.isArray(ticketData) ? ticketData[0]?.id : ticketData?.id;
  const ticketStatus = Array.isArray(ticketData) ? ticketData[0]?.status : ticketData?.status;

  if (ticketStatus === "ok" && ticketId) {
    console.log(`\n✅ Ticket Created: ${ticketId}`);
    console.log("⏳ Waiting 6 seconds for Google FCM / Apple APNs delivery receipt...");
    await new Promise((r) => setTimeout(r, 6000));

    console.log("🔍 Fetching delivery receipt from Expo...");
    const receiptRes = await fetch("https://exp.host/--/api/v2/push/getReceipts", {
      method: "POST",
      headers,
      body: JSON.stringify({ ids: [ticketId] }),
    });

    const receiptJson = await receiptRes.json();
    console.log("📦 Receipt Response Body:", JSON.stringify(receiptJson, null, 2));

    const receipt = receiptJson?.data?.[ticketId];
    if (receipt?.status === "ok") {
      console.log("\n🎉 SUCCESS! Push notification was successfully delivered to Google FCM / device!");
    } else if (receipt?.status === "error") {
      console.log(`\n⚠️ Delivery error reported by FCM/APNs: ${receipt.message} (${receipt.details?.error})`);
    } else {
      console.log("\nℹ️ Receipt still pending or queued at FCM gateway.");
    }
  } else {
    console.log("\n❌ Push ticket was not created successfully:", ticketData);
  }
}

run().catch(console.error).finally(() => prisma.$disconnect());
