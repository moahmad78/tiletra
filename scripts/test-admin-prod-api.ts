import { prisma } from "../lib/prisma";

async function main() {
  console.log("1. Initiating official mobile login flow on production for admin@intrihub.com...");
  
  const sendRes = await fetch("https://www.intrihub.com/api/mobile/auth/send-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@intrihub.com", purpose: "business" }),
  });

  const sendData = await sendRes.json();
  console.log("Send OTP Response:", sendData);

  // 2. Fetch latest OTP from DB
  const latestToken = await prisma.emailOtpToken.findFirst({
    where: { email: "admin@intrihub.com" },
    orderBy: { createdAt: "desc" },
  });

  if (!latestToken) {
    console.error("No OTP record found in DB!");
    process.exit(1);
  }

  console.log("Retrieved OTP from DB:", latestToken.otp);

  // 3. Verify OTP against production to get official JWT tokens
  const verifyRes = await fetch("https://www.intrihub.com/api/mobile/auth/verify-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "admin@intrihub.com",
      otp: latestToken.otp,
      purpose: "business",
    }),
  });

  const verifyData = await verifyRes.json();
  console.log("Verify OTP Response (User/Role):", {
    success: verifyData.success,
    user: verifyData.user,
    hasTokens: Boolean(verifyData.tokens?.accessToken),
  });

  if (!verifyData.tokens?.accessToken) {
    console.error("Failed to obtain production access token:", verifyData);
    process.exit(1);
  }

  const accessToken = verifyData.tokens.accessToken;

  // 4. Test all admin endpoints with this official token
  const endpoints = [
    { url: "https://www.intrihub.com/api/mobile/admin/dashboard", name: "Dashboard" },
    { url: "https://www.intrihub.com/api/mobile/admin/products", name: "Products" },
    { url: "https://www.intrihub.com/api/mobile/admin/vendors", name: "Vendors" },
    { url: "https://www.intrihub.com/api/mobile/admin/categories", name: "Categories" },
    { url: "https://www.intrihub.com/api/mobile/admin/orders", name: "Orders" },
    { url: "https://www.intrihub.com/api/mobile/admin/users", name: "Users" },
    { url: "https://www.intrihub.com/api/mobile/admin/vendor-applications", name: "Vendor Applications" },
    { url: "https://www.intrihub.com/api/mobile/admin/product-approvals", name: "Product Approvals" },
    { url: "https://www.intrihub.com/api/mobile/admin/coupons", name: "Coupons" },
    { url: "https://www.intrihub.com/api/mobile/admin/settings", name: "Settings" },
    { url: "https://www.intrihub.com/api/mobile/admin/reviews", name: "Reviews" },
  ];

  console.log("\n4. Testing live production admin endpoints with verified admin token...\n");
  for (const ep of endpoints) {
    try {
      const res = await fetch(ep.url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
        },
      });

      const text = await res.text();
      let parsed: any;
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = null;
      }

      console.log(`✅ [${ep.name}] Status: ${res.status} | Success: ${parsed?.success ?? false} | Details: ${parsed ? JSON.stringify(parsed).slice(0, 120) : text.slice(0, 100)}...`);
    } catch (e: any) {
      console.error(`❌ [${ep.name}] Error:`, e.message);
    }
  }
}

main().finally(() => prisma.$disconnect());
