import { PrismaClient } from "@prisma/client";
import { products } from "../lib/data/products";
import { categories } from "../lib/data/categories";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting Neon PostgreSQL database seeding...");

  // 1. Seed Categories
  console.log("📁 Seeding categories...");
  for (let i = 0; i < categories.length; i++) {
    const cat = categories[i];
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {
        name: cat.name,
        description: cat.description,
        image: cat.image,
        order: i,
        popularFinishes: ["Matte", "Glossy", "Satin", "Polished"],
        popularSizes: ["600x600mm", "300x600mm", "800x800mm"],
      },
      create: {
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        image: cat.image,
        order: i,
        popularFinishes: ["Matte", "Glossy", "Satin", "Polished"],
        popularSizes: ["600x600mm", "300x600mm", "800x800mm"],
      },
    });
  }

  // 2. Seed Products & Variants
  console.log("📦 Seeding products and variants...");
  for (const prod of products) {
    const createdProduct = await prisma.product.upsert({
      where: { slug: prod.slug },
      update: {
        name: prod.name,
        categorySlug: prod.categorySlug,
        categoryName: prod.categoryName,
        description: prod.description,
        material: prod.material,
        finish: prod.variants[0]?.finish || "Glossy",
        size: prod.variants[0]?.size || "600x600mm",
        pricePerSqft: prod.variants[0]?.pricePerSqft || 45,
        thickness: prod.specs?.thickness || "9mm",
        usage: "Indoor / Floor",
        look: "Marble Look",
        isBestseller: prod.isBestseller,
        isNewArrival: prod.isNew,
        isTrending: prod.isBestseller || prod.isNew,
        inStock: true,
        images: prod.images,
        rating: prod.rating || 4.8,
        reviewCount: prod.reviewCount || 15,
        specs: prod.specs,
      },
      create: {
        id: prod.id,
        name: prod.name,
        slug: prod.slug,
        categorySlug: prod.categorySlug,
        categoryName: prod.categoryName,
        description: prod.description,
        material: prod.material,
        finish: prod.variants[0]?.finish || "Glossy",
        size: prod.variants[0]?.size || "600x600mm",
        pricePerSqft: prod.variants[0]?.pricePerSqft || 45,
        thickness: prod.specs?.thickness || "9mm",
        usage: "Indoor / Floor",
        look: "Marble Look",
        isBestseller: prod.isBestseller,
        isNewArrival: prod.isNew,
        isTrending: prod.isBestseller || prod.isNew,
        inStock: true,
        images: prod.images,
        rating: prod.rating || 4.8,
        reviewCount: prod.reviewCount || 15,
        specs: prod.specs,
      },
    });

    // Delete existing variants and re-seed
    await prisma.productVariant.deleteMany({
      where: { productId: createdProduct.id },
    });

    for (const v of prod.variants) {
      await prisma.productVariant.create({
        data: {
          id: v.id,
          productId: createdProduct.id,
          size: v.size,
          finish: v.finish,
          color: v.color,
          pricePerSqft: v.pricePerSqft,
          pricePerBox: v.pricePerBox,
          sqftPerBox: v.sqftPerBox,
          piecesPerBox: 4,
          inStock: true,
          stockBoxes: v.stockBoxes || 50,
        },
      });
    }
  }

  // 3. Seed Sample Offer Banners
  console.log("🎨 Seeding offer banners...");
  const sampleBanners = [
    {
      id: "slide-1",
      badge: "Special Offer",
      title: "Flat 20% Off Vitrified Tiles",
      subtitle: "Premium Italian marble & concrete looks",
      cta: "Shop Now",
      href: "/shop/floor-tiles",
      image: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&q=80",
      bgGradient: "from-[#052a51]/95 via-[#052a51]/80 to-transparent",
      isActive: true,
      order: 0,
    },
    {
      id: "slide-2",
      badge: "Zero Shipping Cost",
      title: "Free Delivery Above ₹15,000",
      subtitle: "Direct from Morbi & Bangalore factory warehouses",
      cta: "Explore Catalog",
      href: "/shop",
      image: "https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=800&q=80",
      bgGradient: "from-[#0c3966]/95 via-[#052a51]/85 to-transparent",
      isActive: true,
      order: 1,
    },
    {
      id: "slide-3",
      badge: "Confidence First",
      title: "Order a Tile Sample Box",
      subtitle: "Check finish & light in your home before buying",
      cta: "Get Samples",
      href: "/shop",
      image: "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=800&q=80",
      bgGradient: "from-[#1a1c29]/95 via-[#052a51]/85 to-transparent",
      isActive: true,
      order: 2,
    },
  ];

  for (const b of sampleBanners) {
    await prisma.offerBanner.upsert({
      where: { id: b.id },
      update: b,
      create: b,
    });
  }

  // 4. Seed Store Settings
  console.log("⚙️ Seeding store settings...");
  await prisma.storeSettings.upsert({
    where: { id: "default-settings" },
    update: {
      storeName: "Tiletra India",
      contactPhone: "+91 78709 35277",
      whatsappNumber: "+91 78709 35277",
      email: "hello@tiletra.in",
      address: "41, 10th A Cross Rd, Janapriya Layout, Begur, Bengaluru, Karnataka 560114",
      freeDeliveryThreshold: 15000,
      standardDeliveryFee: 999,
      autoAcceptOrders: true,
      lowStockThreshold: 10,
      codEnabled: true,
      codMaxLimit: 25000,
      codBlockedPincodes: ["560099"],
    },
    create: {
      id: "default-settings",
      storeName: "Tiletra India",
      contactPhone: "+91 78709 35277",
      whatsappNumber: "+91 78709 35277",
      email: "hello@tiletra.in",
      address: "41, 10th A Cross Rd, Janapriya Layout, Begur, Bengaluru, Karnataka 560114",
      freeDeliveryThreshold: 15000,
      standardDeliveryFee: 999,
      autoAcceptOrders: true,
      lowStockThreshold: 10,
      codEnabled: true,
      codMaxLimit: 25000,
      codBlockedPincodes: ["560099"],
    },
  });

  // 5. Seed Sample Coupons
  console.log("🎟️ Seeding coupons...");
  const coupons = [
    {
      id: "cp-001",
      code: "TILETRA10",
      discountType: "percentage",
      value: 10,
      minOrderValue: 10000,
      maxDiscountCap: 2500,
      usageLimit: 100,
      usedCount: 42,
      validFrom: "2026-01-01",
      validTill: "2026-12-31",
      isActive: true,
    },
    {
      id: "cp-002",
      code: "FLAT1000",
      discountType: "flat",
      value: 1000,
      minOrderValue: 15000,
      usageLimit: 50,
      usedCount: 18,
      validFrom: "2026-06-01",
      validTill: "2026-09-30",
      isActive: true,
    },
  ];

  for (const cp of coupons) {
    await prisma.coupon.upsert({
      where: { code: cp.code },
      update: cp,
      create: cp,
    });
  }

  console.log("✅ Neon PostgreSQL database seeded successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
