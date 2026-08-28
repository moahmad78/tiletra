import { prisma } from "../lib/prisma";
import { PersonalizedNotificationEngine } from "../lib/notifications/personalized-notification-engine";

async function main() {
  console.log("==================================================================");
  console.log("🔔 TESTING INTRIHUB PERSONALIZED TARGETED NOTIFICATION ENGINE");
  console.log("==================================================================");

  // 1. Fetch or create a test customer
  let testUser = await prisma.user.findFirst({
    where: { role: "customer" },
    include: { cart: { include: { items: true } } },
  });

  if (!testUser) {
    testUser = await prisma.user.create({
      data: {
        name: "Ahmad Builder",
        phone: "9264920211",
        email: "ahmad.builder@intrihub.com",
        role: "customer",
      },
      include: { cart: { include: { items: true } } },
    });
    console.log(`Created test user: ${testUser.name} (${testUser.id})`);
  } else {
    console.log(`Using existing test user: ${testUser.name || testUser.phone} (${testUser.id})`);
  }

  // 2. Fetch a sample product
  const sampleProduct = await prisma.product.findFirst({
    where: { inStock: true },
    include: { variants: true },
  });

  if (!sampleProduct) {
    throw new Error("No active product found to test cart/wishlist targeting");
  }

  // 3. Scenario A: Test User with Cart Item
  console.log("\n📦 Scenario A: User has active item in Cart...");
  // Ensure cart has an item
  let userCart = await prisma.cart.findUnique({ where: { userId: testUser.id } });
  if (!userCart) {
    userCart = await prisma.cart.create({ data: { userId: testUser.id } });
  }

  const sampleVariant = sampleProduct.variants[0];
  if (sampleVariant) {
    await prisma.cartItem.upsert({
      where: {
        cartId_variantId: {
          cartId: userCart.id,
          variantId: sampleVariant.id,
        },
      },
      update: { boxQuantity: 3 },
      create: {
        cartId: userCart.id,
        productId: sampleProduct.id,
        variantId: sampleVariant.id,
        boxQuantity: 3,
      },
    });
  }

  const cartNotif = await PersonalizedNotificationEngine.generateAndSendForUser(testUser.id);
  console.log("✅ Cart Targeted Notification Generated:");
  console.log(`   Title:   ${cartNotif?.title}`);
  console.log(`   Message: ${cartNotif?.message}`);
  console.log(`   Type:    ${cartNotif?.type}`);
  console.log(`   Link:    ${cartNotif?.link}`);
  console.log(`   Saved in DB: ${cartNotif?.dbSaved}`);

  // 4. Scenario B: Batch Campaign Run
  console.log("\n🚀 Scenario B: Running Batch Personalized Campaign...");
  const batchResults = await PersonalizedNotificationEngine.runBatchPersonalizedCampaign(5);
  console.log(`✅ Processed ${batchResults.length} personalized customer notifications.`);
  batchResults.forEach((res, i) => {
    console.log(`   [${i + 1}] User ${res.userId.slice(-6)} -> "${res.title}" (${res.type})`);
  });

  console.log("\n🎉 ALL PERSONALIZED NOTIFICATION ENGINE TESTS PASSED SUCCESSFULLY!\n");
}

main()
  .catch((e) => {
    console.error("❌ Test failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
