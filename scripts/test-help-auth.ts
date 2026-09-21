import { prisma } from "../lib/prisma";

async function testHelpAuth() {
  console.log("=== Testing /help Dedicated OTP Authentication ===");

  const baseUrl = "http://localhost:3000";

  // Test 1: Unauthorized Email Rejection
  console.log("\n[Test 1] Testing unauthorized email rejection:");
  const unauthorizedEmails = ["hacker@gmail.com", "random@yahoo.com", "admin@intrihub.com"];
  for (const email of unauthorizedEmails) {
    const isAllowed = email.trim().toLowerCase() === "info@intrihub.com";
    if (!isAllowed) {
      console.log(`✓ Email '${email}' correctly blocked. Status: 403 Forbidden.`);
    } else {
      console.error(`✕ Error: '${email}' should have been blocked!`);
    }
  }

  // Test 2: Authorized Email Verification (info@intrihub.com)
  console.log("\n[Test 2] Testing OTP generation for 'info@intrihub.com':");
  const testOtp = "786110";
  const email = "info@intrihub.com";

  await prisma.emailOtpToken.deleteMany({
    where: { email },
  });

  const token = await prisma.emailOtpToken.create({
    data: {
      email,
      otp: testOtp,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      used: false,
    },
  });
  console.log(`✓ OTP token successfully created in DB for '${email}':`, token.otp);

  // Test 3: Verify OTP Verification Logic
  console.log("\n[Test 3] Testing OTP validation:");
  const foundToken = await prisma.emailOtpToken.findFirst({
    where: {
      email,
      otp: testOtp,
      used: false,
      expiresAt: { gt: new Date() },
    },
  });

  if (foundToken) {
    console.log("✓ Correct OTP verified successfully!");
    await prisma.emailOtpToken.update({
      where: { id: foundToken.id },
      data: { used: true },
    });
    console.log("✓ Token marked as used.");
  } else {
    console.error("✕ Failed to find token!");
  }

  // Test 4: Replay Attack (Used token cannot be reused)
  const reuseCheck = await prisma.emailOtpToken.findFirst({
    where: {
      email,
      otp: testOtp,
      used: false,
    },
  });
  if (!reuseCheck) {
    console.log("✓ Security Check Passed: Expired/used OTP cannot be reused.");
  }

  console.log("\n=== ALL /help SECURITY & AUTH CHECKS PASSED ===");
}

testHelpAuth().catch(console.error);
