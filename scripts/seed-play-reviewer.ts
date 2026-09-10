import { prisma } from "../lib/prisma";
import { hashPassword, verifyPassword } from "../lib/password-security";

async function main() {
  console.log("Setting up Google Play Reviewer Customer Account...");

  const reviewerEmail = "playreview@intrihub.com";
  const reviewerPassword = "IntriReview#2026";
  const passwordHash = hashPassword(reviewerPassword);

  // 1. Verify hash logic before writing to DB
  if (!verifyPassword(reviewerPassword, passwordHash)) {
    throw new Error("Self-verification of password hash failed!");
  }

  // 2. Upsert Reviewer Customer Account
  const user = await prisma.user.upsert({
    where: { email: reviewerEmail },
    update: {
      name: "Google Play Reviewer",
      role: "customer",
      emailVerified: true,
      phoneVerified: true,
      authProvider: "credentials",
      passwordHash: passwordHash,
      mustChangePassword: false,
    },
    create: {
      email: reviewerEmail,
      name: "Google Play Reviewer",
      phone: "email_playreview_intrihub_com",
      role: "customer",
      emailVerified: true,
      phoneVerified: true,
      authProvider: "credentials",
      passwordHash: passwordHash,
      mustChangePassword: false,
    },
  });

  console.log(`✓ User created/updated with ID: ${user.id} and role: ${user.role}`);

  // 3. Upsert Default Delivery Address
  await prisma.address.deleteMany({ where: { userId: user.id } });
  const address = await prisma.address.create({
    data: {
      userId: user.id,
      label: "Home",
      fullName: "Google Play Reviewer",
      phone: "9876543210",
      houseNumber: "Flat 402",
      buildingName: "IntriHub Residency",
      street: "80ft Road, 4th Block",
      area: "Koramangala",
      landmark: "Near Sony World Signal",
      city: "Bengaluru",
      district: "Bengaluru Urban",
      state: "Karnataka",
      country: "India",
      pincode: "560034",
      postalCode: "560034",
      latitude: 12.9352,
      longitude: 77.6245,
      accuracy: 10,
      source: "GPS",
      deliveryInstructions: "Leave at security / reception",
      isDefault: true,
    },
  });

  console.log(`✓ Default address created: ${address.street}, ${address.city} - ${address.pincode}`);

  // 4. Sample Order for Order History Screen
  const firstProduct = await prisma.product.findFirst({
    include: { variants: true },
  });

  if (firstProduct) {
    const existingOrder = await prisma.order.findFirst({
      where: { userId: user.id },
    });

    if (!existingOrder) {
      const orderId = `ORD-REV-${Date.now().toString().slice(-6)}`;
      const order = await prisma.order.create({
        data: {
          id: orderId,
          user: { connect: { id: user.id } },
          customerName: "Google Play Reviewer",
          customerEmail: reviewerEmail,
          customerPhone: "9876543210",
          shippingAddress: {
            fullName: "Google Play Reviewer",
            phone: "9876543210",
            addressLine1: "Flat 402, IntriHub Residency, 80ft Road",
            addressLine2: "Koramangala 4th Block",
            city: "Bengaluru",
            state: "Karnataka",
            pincode: "560034",
          },
          subtotal: 12500,
          deliveryFee: 0,
          discount: 500,
          total: 12000,
          paymentMethod: "online",
          paymentStatus: "paid",
          orderStatus: "delivered",
          items: {
            create: [
              {
                productId: firstProduct.id,
                productName: firstProduct.name,
                variantId: firstProduct.variants?.[0]?.id || "default",
                variantDetails: "Standard Finish • 600x600mm",
                boxQuantity: 10,
                pricePerBox: 1200,
                totalPrice: 12000,
                image: firstProduct.images?.[0] || "",
              },
            ],
          },
        },
      });
      console.log(`✓ Sample order created: ${order.orderNumber} (Status: ${order.orderStatus})`);
    } else {
      console.log(`✓ Existing order found: ${existingOrder.orderNumber}`);
    }
  }

  console.log("\n=======================================================");
  console.log("GOOGLE PLAY REVIEWER CREDENTIALS READY IN DATABASE:");
  console.log(`Username/Email: ${reviewerEmail}`);
  console.log(`Password:       ${reviewerPassword}`);
  console.log(`Role:           ${user.role} (Customer Only)`);
  console.log("=======================================================\n");
}

main()
  .catch((e) => {
    console.error("Error setting up reviewer account:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
