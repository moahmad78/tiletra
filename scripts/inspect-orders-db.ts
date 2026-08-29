import { prisma } from "../lib/prisma";

async function inspect() {
  const orders = await prisma.order.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
  });

  console.log("=== LATEST 5 ORDERS IN DATABASE ===");
  for (const o of orders) {
    console.log(`\nORDER ID: ${o.id}`);
    console.log(`Customer Name: ${o.customerName}`);
    console.log(`Customer Phone: ${o.customerPhone}`);
    console.log(`Delivery Name: ${o.deliveryName}`);
    console.log(`Delivery Phone: ${o.deliveryPhone}`);
    console.log(`Delivery Address: ${o.deliveryAddress}`);
    console.log(`Delivery City: ${o.deliveryCity}`);
    console.log(`Delivery Street: ${o.deliveryStreet}`);
    console.log(`Shipping Address (Raw):`, JSON.stringify(o.shippingAddress, null, 2));
  }
}

inspect()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
