import { prisma } from "../lib/prisma";

async function seedVendorDemo() {
  console.log("Seeding Demo Vendors and Vendor Products for Phase 8a...");

  // 1. Create or Find Vendor Users
  const userBalaji = await prisma.user.upsert({
    where: { phone: "9845012345" },
    update: { role: "vendor" },
    create: {
      name: "Ramesh Kumar",
      phone: "9845012345",
      email: "balaji.electricals@intrihub.com",
      role: "vendor",
      phoneVerified: true,
      emailVerified: true,
    },
  });

  const vendorBalaji = await prisma.vendor.upsert({
    where: { slug: "sri-balaji-electricals" },
    update: {
      ownerId: userBalaji.id,
      status: "approved",
      commissionRate: 12.0,
    },
    create: {
      businessName: "Sri Balaji Electricals & Hardware",
      slug: "sri-balaji-electricals",
      contactEmail: "balaji.electricals@intrihub.com",
      contactPhone: "9845012345",
      category: "Electricals & Lighting",
      businessAddress: "42, 10th Cross, Begur Main Rd, Bangalore 560068",
      gstNumber: "29AABCS1429B1Z8",
      status: "approved",
      commissionRate: 12.0,
      ownerId: userBalaji.id,
      description: "Authorized dealer of Havells, Anchor, and Polycab cables & modular switches.",
    },
  });

  console.log("Created/Updated Vendor:", vendorBalaji.businessName);

  // 2. Add sample products for this vendor
  const electricalCategory = await prisma.category.findFirst({
    where: {
      OR: [{ slug: "electricals" }, { slug: "floor-tiles" }],
    },
  });

  const sampleProduct = await prisma.product.upsert({
    where: { slug: "polycab-2-5-sqmm-fr-wire-red" },
    update: {
      vendorId: vendorBalaji.id,
      status: "active",
      approvalStatus: "approved",
    },
    create: {
      name: "Polycab 2.5 sq mm FR Flame Retardant Wire (Red, 90m Coil)",
      slug: "polycab-2-5-sqmm-fr-wire-red",
      categoryId: electricalCategory?.id || null,
      categorySlug: electricalCategory?.slug || "floor-tiles",
      categoryName: electricalCategory?.name || "Electricals",
      material: "100% Pure Electrolytic Copper",
      unitOfSale: "coil",
      pricePerSqft: 2150,
      description: "ISI certified flame retardant single core flexible copper cable for residential and commercial electrification.",
      images: [
        "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&q=80",
      ],
      vendorId: vendorBalaji.id,
      status: "active",
      approvalStatus: "approved",
      variants: {
        create: [
          {
            size: "90m Coil",
            finish: "Red / 2.5 sq mm",
            color: "Red",
            pricePerBox: 2150,
            pricePerSqft: 2150,
            sqftPerBox: 1,
            stockBoxes: 80,
            inStock: true,
          },
        ],
      },
      attributes: {
        create: [
          { key: "gauge", value: "2.5 sq mm" },
          { key: "conductor", value: "Electrolytic Copper" },
          { key: "length", value: "90 meters" },
          { key: "voltageRating", value: "1100V" },
        ],
      },
    },
  });

  console.log("Sample vendor product seeded:", sampleProduct.name);
}

seedVendorDemo()
  .catch((e) => console.error("Error in demo seed:", e))
  .finally(() => prisma.$disconnect());
