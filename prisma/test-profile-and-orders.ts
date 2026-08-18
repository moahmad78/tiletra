import { prisma } from "../lib/prisma";
import { getCustomerOrders } from "../lib/actions/orders";
import { upsertCustomerUser, updateUserProfile } from "../lib/actions/auth";

async function testProfileAndOrders() {
  console.log("=== 1. Testing getCustomerOrders with real DB User and Phone ===");
  const existingOrders = await getCustomerOrders({
    userId: "cmsuer0s900001prs96qxl61v",
    phone: "+91 98765 43210",
  });

  console.log(`Successfully retrieved ${existingOrders.length} orders for customer!`);
  existingOrders.forEach((o) => {
    console.log(`  -> Order #${o.id}: ₹${o.total} (${o.orderStatus})`);
  });

  if (existingOrders.length === 0) {
    throw new Error("Expected existing test orders to be retrieved by getCustomerOrders");
  }

  console.log("\n=== 2. Testing Google Sign-in: First Time Login captures Avatar & Name ===");
  const testGooglePhone = "9199887766";
  const googleAvatarUrl = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80";

  // Clean up any prior test user
  await prisma.user.deleteMany({ where: { phone: testGooglePhone } });

  const firstLoginRes = await upsertCustomerUser({
    phone: testGooglePhone,
    name: "Ahmad Google",
    email: "ahmad.google@example.com",
    avatar: googleAvatarUrl,
  });

  if (!firstLoginRes.success || !firstLoginRes.user) {
    throw new Error(`First Google login failed: ${firstLoginRes.error}`);
  }

  console.log(`Created user via Google Sign-In with DB id: ${firstLoginRes.user.id}`);
  console.log(`Captured Name: "${firstLoginRes.user.name}", Avatar: "${firstLoginRes.user.avatar}"`);

  if (firstLoginRes.user.avatar !== googleAvatarUrl) {
    throw new Error("Google avatar URL was not saved!");
  }

  console.log("\n=== 3. Testing Customer Manual Profile Edit ===");
  const customAvatarUrl = "https://custom-cdn.tiletra.in/photos/my-custom-photo.jpg";
  const editRes = await updateUserProfile(firstLoginRes.user.id, {
    name: "Mohammad Custom Ahmad",
    email: "custom.email@tiletra.in",
    avatar: customAvatarUrl,
  });

  if (!editRes.success || !editRes.user) {
    throw new Error(`Profile edit failed: ${editRes.error}`);
  }

  console.log(`Updated profile: Name="${editRes.user.name}", Avatar="${editRes.user.avatar}"`);

  console.log("\n=== 4. Testing Subsequent Google Login: Must NOT Overwrite Custom Name/Avatar ===");
  const secondLoginRes = await upsertCustomerUser({
    phone: testGooglePhone,
    name: "Overwriting Google Name",
    email: "ahmad.google@example.com",
    avatar: "https://google.com/different-avatar.jpg",
  });

  if (!secondLoginRes.success || !secondLoginRes.user) {
    throw new Error(`Second Google login failed: ${secondLoginRes.error}`);
  }

  console.log(`Second Login Result: Name="${secondLoginRes.user.name}", Avatar="${secondLoginRes.user.avatar}"`);

  if (secondLoginRes.user.name !== "Mohammad Custom Ahmad") {
    throw new Error(`FAIL: Customized name was overwritten! Got "${secondLoginRes.user.name}"`);
  }
  if (secondLoginRes.user.avatar !== customAvatarUrl) {
    throw new Error(`FAIL: Customized avatar was overwritten! Got "${secondLoginRes.user.avatar}"`);
  }

  console.log("✅ Verified: Subsequent Google login preserved user's customized name and avatar!");

  console.log("\n=== 5. Cleanup Test Record ===");
  await prisma.user.deleteMany({ where: { phone: testGooglePhone } });
  console.log("Cleaned up test user.");

  console.log("\n🚀 ALL PROFILE & ORDER QUERY TESTS PASSED 100%! ✅");
}

testProfileAndOrders().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
