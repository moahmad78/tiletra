import { prisma } from "../lib/prisma";
import { hashPassword, verifyPassword } from "../lib/password-security";
import { updateVendorLoginMethod } from "../lib/actions/admin-vendor";
import { checkVendorLoginMethod, loginVendorWithPassword } from "../lib/actions/web-portal-auth";

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ Assertion Failed: ${msg}`);
    process.exit(1);
  }
  console.log(`  ✓ ${msg}`);
}

async function runVendorLoginMethodTests() {
  console.log("==========================================================================");
  console.log("TESTING ADMIN-CONFIGURABLE VENDOR LOGIN METHOD (OTP VS EMAIL+PASSWORD)");
  console.log("==========================================================================\n");

  const testEmail = `test.vendor.auth.${Date.now()}@example.com`;
  const testPhone = `98${Math.floor(10000000 + Math.random() * 90000000)}`;
  const testPassword = "SuperSecure#2026";

  // 1. Setup Test Vendor Owner & Vendor Record
  console.log("[TEST 1] Creating Test Vendor Record...");
  const owner = await prisma.user.create({
    data: {
      email: testEmail,
      phone: testPhone,
      name: "Alpha Hardware Owner",
      role: "vendor",
    },
  });

  const vendor = await prisma.vendor.create({
    data: {
      businessName: "Alpha Hardware & Electricals",
      slug: `alpha-hardware-${Date.now()}`,
      contactEmail: testEmail,
      contactPhone: testPhone,
      status: "approved",
      ownerId: owner.id,
      loginMethod: "otp",
      passwordHash: null,
    },
  });

  assert(vendor.loginMethod === "otp", "Vendor initially created with loginMethod='otp'");
  assert(vendor.passwordHash === null, "Vendor initially has passwordHash=null");

  // 2. Check Default OTP Method Lookup
  console.log("\n[TEST 2] Check Method Lookup when loginMethod='otp':");
  const checkOtpRes = await checkVendorLoginMethod(testEmail);
  assert(checkOtpRes.success === true, "checkVendorLoginMethod returned success=true");
  assert(checkOtpRes.loginMethod === "otp", "checkVendorLoginMethod returned loginMethod='otp'");

  // 3. Admin Switches Vendor to Password Method
  console.log("\n[TEST 3] Admin Configures Password Login for Vendor:");
  const updateToPasswordRes = await updateVendorLoginMethod(vendor.id, "password", testPassword);
  assert(updateToPasswordRes.success === true, "Admin updated vendor loginMethod to 'password'");

  const updatedVendor = await prisma.vendor.findUnique({ where: { id: vendor.id } });
  assert(updatedVendor?.loginMethod === "password", "Database reflects loginMethod='password'");
  assert(Boolean(updatedVendor?.passwordHash), "Database has hashed password stored");
  assert(updatedVendor?.passwordHash !== testPassword, "Stored password is encrypted/hashed, not plain text");
  assert(verifyPassword(testPassword, updatedVendor!.passwordHash!), "verifyPassword validates correct plaintext password");

  // 4. Check Method Lookup when loginMethod='password'
  console.log("\n[TEST 4] Check Method Lookup when loginMethod='password':");
  const checkPasswordRes = await checkVendorLoginMethod(testEmail);
  assert(checkPasswordRes.success === true, "checkVendorLoginMethod returned success=true");
  assert(checkPasswordRes.loginMethod === "password", "checkVendorLoginMethod returned loginMethod='password'");

  // 5. Password Authentication - Success Flow
  console.log("\n[TEST 5] Vendor Password Login with Valid Password:");
  const loginSuccessRes = await loginVendorWithPassword(testEmail, testPassword);
  assert(loginSuccessRes.success === true, "loginVendorWithPassword succeeded with correct password");
  assert(loginSuccessRes.vendor?.id === vendor.id, "Returned vendor ID matches database record");
  assert(loginSuccessRes.vendor?.loginMethod === "password", "Returned vendor has loginMethod='password'");

  // 6. Password Authentication - Invalid Password Failure
  console.log("\n[TEST 6] Vendor Password Login with Incorrect Password:");
  const loginFailRes = await loginVendorWithPassword(testEmail, "WrongPassword#123");
  assert(loginFailRes.success === false, "loginVendorWithPassword failed on wrong password");
  assert(loginFailRes.message.includes("Invalid password") || loginFailRes.message.includes("remaining"), "Informative error message returned with remaining attempts");

  // 7. Admin Reverts Vendor Back to OTP
  console.log("\n[TEST 7] Admin Reverts Vendor back to OTP Method:");
  const updateBackToOtpRes = await updateVendorLoginMethod(vendor.id, "otp");
  assert(updateBackToOtpRes.success === true, "Admin updated vendor loginMethod back to 'otp'");

  const revertedVendor = await prisma.vendor.findUnique({ where: { id: vendor.id } });
  assert(revertedVendor?.loginMethod === "otp", "Database reflects loginMethod='otp'");
  assert(revertedVendor?.passwordHash === null, "passwordHash is safely cleared (null) when reverting to OTP");

  const checkRevertedRes = await checkVendorLoginMethod(testEmail);
  assert(checkRevertedRes.loginMethod === "otp", "checkVendorLoginMethod returns 'otp' after revert");

  // 8. Cleanup
  console.log("\n[CLEANUP] Cleaning up test records...");
  await prisma.vendor.delete({ where: { id: vendor.id } });
  await prisma.user.delete({ where: { id: owner.id } });
  console.log("✓ Cleanup complete.\n");

  console.log("==========================================================================");
  console.log("🎉 ALL VENDOR LOGIN METHOD (OTP vs PASSWORD) TESTS PASSED SUCCESSFULLY! ✓");
  console.log("==========================================================================");
}

runVendorLoginMethodTests()
  .catch((e) => {
    console.error("Test execution failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
