import { NextRequest } from "next/server";
import { POST } from "../app/api/mobile/auth/send-otp/route";
import { prisma } from "../lib/prisma";

async function testLocalHandler() {
  const randomEmail = `test_random_local_${Date.now()}_${Math.random().toString(36).substring(7)}@gmail.com`;
  console.log("=== Testing Local API Route Handler with Random Email ===");
  console.log("Random Email:", randomEmail);

  const req = new NextRequest("http://localhost:3000/api/mobile/auth/send-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: randomEmail,
      purpose: "business",
    }),
  });

  const res = await POST(req);
  const data = await res.json();
  console.log("LOCAL HANDLER STATUS:", res.status);
  console.log("LOCAL HANDLER RESPONSE:", data);

  console.log("\n=== Testing Local API Route Handler with Approved Vendor ===");
  const vendorReq = new NextRequest("http://localhost:3000/api/mobile/auth/send-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "vishalpoddar393@gmail.com",
      purpose: "business",
    }),
  });

  const vendorRes = await POST(vendorReq);
  const vendorData = await vendorRes.json();
  console.log("LOCAL VENDOR STATUS:", vendorRes.status);
  console.log("LOCAL VENDOR RESPONSE:", vendorData);

  console.log("\n=== Testing Local API Route Handler with Admin Email ===");
  const adminReq = new NextRequest("http://localhost:3000/api/mobile/auth/send-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "admin@intrihub.com",
      purpose: "business",
    }),
  });

  const adminRes = await POST(adminReq);
  const adminData = await adminRes.json();
  console.log("LOCAL ADMIN STATUS:", adminRes.status);
  console.log("LOCAL ADMIN RESPONSE:", adminData);

  // Check if any stray User was created in Prisma DB
  const strayUser = await prisma.user.findFirst({
    where: { email: randomEmail },
  });
  console.log("\nWas any User record created for random email?", strayUser ? "YES (BUG!)" : "NO (CLEAN)");

  // Check if any stray Otp was created in Prisma DB
  const strayOtp = await prisma.emailOtpToken.findFirst({
    where: { email: randomEmail },
  });
  console.log("Was any OTP record created for random email?", strayOtp ? "YES (BUG!)" : "NO (CLEAN)");
}

testLocalHandler()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
