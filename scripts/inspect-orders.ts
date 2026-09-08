import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkOrders() {
  const orderItems = await prisma.orderItem.findMany({
    include: {
      product: { select: { id: true, name: true, slug: true } },
      order: { select: { id: true, orderStatus: true, total: true, createdAt: true, user: { select: { name: true, email: true, phone: true } } } }
    }
  });

  console.log(`Total OrderItems: ${orderItems.length}`);
  for (const oi of orderItems) {
    console.log(JSON.stringify({
      orderId: oi.order.id,
      product: oi.product ? oi.product.name : "NULL (Product already deleted!)",
      slug: oi.product ? oi.product.slug : "NULL",
      pricePerBox: oi.pricePerBox,
      totalPrice: oi.totalPrice,
      boxQuantity: oi.boxQuantity,
      orderStatus: oi.order.orderStatus,
      customer: oi.order.user ? `${oi.order.user.name} (${oi.order.user.phone || oi.order.user.email})` : "Guest",
      createdAt: oi.order.createdAt.toISOString()
    }, null, 2));
  }
}

checkOrders().finally(() => prisma.$disconnect());
