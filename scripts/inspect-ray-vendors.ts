import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("=== INSPECTING PRODUCTS UNDER VENDOR cmuur1wni0002l2046yft2c96 ===");
  console.log("=== INSPECTING VENDOR GRUTON / RAY ENTERPRISES DETAILS ===");
  const vDetails = await prisma.vendor.findUnique({
    where: { id: "cmuur1wni0002l2046yft2c96" },
    include: {
      owner: true,
    },
  });
  console.log("Vendor gruton details:", JSON.stringify(vDetails, null, 2));
  const products = await prisma.product.findMany({
    include: {
      orderItems: { select: { id: true, orderId: true, vendorId: true } },
      vendor: { select: { id: true, businessName: true, owner: { select: { name: true } } } },
      variants: { select: { id: true, sku: true, image: true, images: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  console.log(`Auditing ${products.length} products...`);
  for (const p of products) {
    const orderItems = p.orderItems || [];
    const history = (p as any).editHistory;
    console.log({
      id: p.id,
      name: p.name,
      slug: p.slug,
      vendorId: p.vendorId,
      vendorName: p.vendor?.businessName,
      vendorOwner: p.vendor?.owner?.name,
      images: p.images,
      orderItems,
      history,
    });
  }

  console.log("\n=== CHECKING ORDER ITEMS ===");
  const orderItems = await prisma.orderItem.findMany({
    take: 20,
    select: {
      id: true,
      productId: true,
      orderId: true,
      vendorId: true,
    },
  });
  console.log(`Found ${orderItems.length} OrderItems:`, orderItems);



}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
