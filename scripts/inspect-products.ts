import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function inspect() {
  console.log("=== INSPECTING ALL PRODUCTS IN DATABASE ===");
  const products = await prisma.product.findMany({
    include: {
      vendor: {
        select: {
          id: true,
          businessName: true,
          contactEmail: true,
          status: true,
        },
      },
      _count: {
        select: {
          orderItems: true,
          reviews: true,
          wishlistItems: true,
        },
      },
      variants: {
        select: {
          id: true,
          sku: true,
          size: true,
          pricePerBox: true,
          _count: {
            select: {
              cartItems: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  console.log(`Total Products in DB: ${products.length}\n`);

  const vendors = await prisma.vendor.findMany({
    select: { id: true, businessName: true, contactEmail: true, status: true, _count: { select: { products: true } } }
  });
  console.log("Vendors in DB:", JSON.stringify(vendors, null, 2));

  for (const p of products) {
    const totalCartItems = p.variants.reduce((acc, v) => acc + v._count.cartItems, 0);
    console.log(JSON.stringify({
      id: p.id,
      name: p.name,
      slug: p.slug,
      brand: p.brand,
      sku: p.sku,
      categorySlug: p.categorySlug,
      status: p.status,
      approvalStatus: p.approvalStatus,
      pricePerSqft: p.pricePerSqft,
      vendor: p.vendor ? `${p.vendor.businessName} (${p.vendor.id})` : "NO VENDOR (ORPHAN)",
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
      orderCount: p._count.orderItems,
      reviewCount: p._count.reviews,
      cartCount: totalCartItems,
      variantCount: p.variants.length,
    }));
  }
}

inspect()
  .catch((e) => {
    console.error("Error inspecting products:", e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
