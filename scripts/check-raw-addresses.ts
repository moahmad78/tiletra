import { prisma } from "../lib/prisma";

async function inspectDbAddresses() {
  console.log("=== INSPECTING RAW DB ORDERS & ADDRESSES ===");
  const orders = await prisma.order.findMany({
    select: {
      id: true,
      deliveryAddress: true,
      shippingAddress: true,
      deliveryHouseNumber: true,
      deliveryBuildingName: true,
      deliveryStreet: true,
      deliveryArea: true,
      deliveryLandmark: true,
      deliveryCity: true,
      deliveryState: true,
      deliveryPostalCode: true,
      user: {
        select: {
          addresses: true,
        },
      },
    },
    take: 5,
  });

  for (const o of orders) {
    console.log(`\n--- Order #${o.id.slice(-8).toUpperCase()} ---`);
    console.log("deliveryAddress column:", o.deliveryAddress);
    console.log("shippingAddress column:", o.shippingAddress);
    console.log("User addresses:", JSON.stringify(o.user?.addresses, null, 2));
  }
}

inspectDbAddresses()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
