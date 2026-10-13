import { prisma } from "../lib/prisma";

async function seed3MultiVariantItems() {
  console.log("=== SEEDING 3 MULTI-VARIANT ITEMS WITH COLORS & DIMENSIONS ===");

  // 1. Get or create active Vendor
  let vendor = await prisma.vendor.findFirst({
    where: { status: "ACTIVE" },
  });

  if (!vendor) {
    vendor = await prisma.vendor.findFirst();
  }

  if (!vendor) {
    vendor = await prisma.vendor.create({
      data: {
        businessName: "IntriHub Official Store",
        slug: "intrihub-official-store",
        contactPerson: "Catalog Manager",
        phone: "9876543210",
        email: "store@intrihub.com",
        status: "ACTIVE",
        verificationStatus: "VERIFIED",
        businessType: "MANUFACTURER",
        isOnline: true,
      },
    });
  }

  console.log(`Using Vendor: ${vendor.businessName} (ID: ${vendor.id})`);

  // Ensure Categories exist
  // Cat 1: Tiles & Flooring
  let catTiles = await prisma.category.findFirst({
    where: { slug: { in: ["tiles-flooring", "tiles-stone"] } },
  });
  if (!catTiles) {
    catTiles = await prisma.category.create({
      data: {
        name: "Tiles & Flooring",
        slug: "tiles-flooring",
        description: "Vitrified, ceramic, glazed, and floor tiles",
        image: "/images/categories/cat-tiles-stone.jpg",
      },
    });
  }

  // Cat 2: Paints & Finishes
  let catPaints = await prisma.category.findFirst({
    where: { slug: { in: ["paint-finishes", "paints-finishes"] } },
  });
  if (!catPaints) {
    catPaints = await prisma.category.create({
      data: {
        name: "Paints & Finishes",
        slug: "paint-finishes",
        description: "Interior emulsions, exterior paints, primers & distempers",
        image: "/images/categories/cat-paint-finishes.jpg",
      },
    });
  }

  // Cat 3: Electricals & Wires
  let catElectrical = await prisma.category.findFirst({
    where: { slug: { in: ["electricals-wires", "electrical"] } },
  });
  if (!catElectrical) {
    catElectrical = await prisma.category.create({
      data: {
        name: "Electricals & Wires",
        slug: "electricals-wires",
        description: "Modular switches, sockets, wires, cables & distribution boards",
        image: "/images/categories/cat-electrical.jpg",
      },
    });
  }

  // =========================================================================
  // ITEM 1: Kajaria Grand Vitrified Floor Tile
  // Sub-Category: Vitrified Tiles
  // Colors: Statuario White (#F8F9FA), Armani Brown (#4A3728), Graphite Grey (#383E42)
  // Sizes: 600x600mm, 600x1200mm, 800x1600mm
  // =========================================================================
  const tileSlug = "kajaria-grand-vitrified-floor-tile";
  await prisma.productVariant.deleteMany({
    where: { product: { slug: tileSlug } },
  });
  await prisma.product.deleteMany({
    where: { slug: tileSlug },
  });

  const tileImages = [
    "/images/categories/cat-tiles-stone.jpg",
    "/images/categories/cat-tiles-stone.jpg",
    "/images/categories/cat-tiles-stone.jpg",
  ];

  const tileVariantsData = [
    // Statuario White
    {
      sku: "INT-TL-STAT-6060",
      variantName: "Statuario White - 600x600mm",
      color: "Statuario White",
      colorHex: "#F8F9FA",
      size: "600x600mm (2x2 ft)",
      attributeValue: "600x600mm (2x2 ft)",
      finish: "High Gloss Polish",
      mrp: 850,
      price: 590,
      pricePerBox: 590,
      sqftPerBox: 15.5,
      piecesPerBox: 4,
      stockBoxes: 120,
      lowStockAlert: 15,
      images: tileImages,
      image: tileImages[0],
      variantSpecs: { costPrice: 440, profitMarginPercent: 25.42 },
    },
    {
      sku: "INT-TL-STAT-60120",
      variantName: "Statuario White - 600x1200mm",
      color: "Statuario White",
      colorHex: "#F8F9FA",
      size: "600x1200mm (2x4 ft)",
      attributeValue: "600x1200mm (2x4 ft)",
      finish: "High Gloss Polish",
      mrp: 1450,
      price: 1050,
      pricePerBox: 1050,
      sqftPerBox: 15.5,
      piecesPerBox: 2,
      stockBoxes: 85,
      lowStockAlert: 10,
      images: tileImages,
      image: tileImages[0],
      variantSpecs: { costPrice: 780, profitMarginPercent: 25.71 },
    },
    {
      sku: "INT-TL-STAT-80160",
      variantName: "Statuario White - 800x1600mm",
      color: "Statuario White",
      colorHex: "#F8F9FA",
      size: "800x1600mm (2.6x5.2 ft)",
      attributeValue: "800x1600mm (2.6x5.2 ft)",
      finish: "High Gloss Polish",
      mrp: 2600,
      price: 1950,
      pricePerBox: 1950,
      sqftPerBox: 27.5,
      piecesPerBox: 2,
      stockBoxes: 50,
      lowStockAlert: 8,
      images: tileImages,
      image: tileImages[0],
      variantSpecs: { costPrice: 1450, profitMarginPercent: 25.64 },
    },
    // Armani Brown
    {
      sku: "INT-TL-ARM-6060",
      variantName: "Armani Brown - 600x600mm",
      color: "Armani Brown",
      colorHex: "#4A3728",
      size: "600x600mm (2x2 ft)",
      attributeValue: "600x600mm (2x2 ft)",
      finish: "Satin Matt",
      mrp: 870,
      price: 610,
      pricePerBox: 610,
      sqftPerBox: 15.5,
      piecesPerBox: 4,
      stockBoxes: 90,
      lowStockAlert: 12,
      images: tileImages,
      image: tileImages[1] || tileImages[0],
      variantSpecs: { costPrice: 450, profitMarginPercent: 26.23 },
    },
    {
      sku: "INT-TL-ARM-60120",
      variantName: "Armani Brown - 600x1200mm",
      color: "Armani Brown",
      colorHex: "#4A3728",
      size: "600x1200mm (2x4 ft)",
      attributeValue: "600x1200mm (2x4 ft)",
      finish: "Satin Matt",
      mrp: 1480,
      price: 1090,
      pricePerBox: 1090,
      sqftPerBox: 15.5,
      piecesPerBox: 2,
      stockBoxes: 70,
      lowStockAlert: 10,
      images: tileImages,
      image: tileImages[1] || tileImages[0],
      variantSpecs: { costPrice: 810, profitMarginPercent: 25.69 },
    },
    {
      sku: "INT-TL-ARM-80160",
      variantName: "Armani Brown - 800x1600mm",
      color: "Armani Brown",
      colorHex: "#4A3728",
      size: "800x1600mm (2.6x5.2 ft)",
      attributeValue: "800x1600mm (2.6x5.2 ft)",
      finish: "Satin Matt",
      mrp: 2650,
      price: 1990,
      pricePerBox: 1990,
      sqftPerBox: 27.5,
      piecesPerBox: 2,
      stockBoxes: 40,
      lowStockAlert: 5,
      images: tileImages,
      image: tileImages[1] || tileImages[0],
      variantSpecs: { costPrice: 1480, profitMarginPercent: 25.63 },
    },
    // Graphite Grey
    {
      sku: "INT-TL-GRP-6060",
      variantName: "Graphite Grey - 600x600mm",
      color: "Graphite Grey",
      colorHex: "#383E42",
      size: "600x600mm (2x2 ft)",
      attributeValue: "600x600mm (2x2 ft)",
      finish: "Sugar Finish Anti-Skid",
      mrp: 890,
      price: 630,
      pricePerBox: 630,
      sqftPerBox: 15.5,
      piecesPerBox: 4,
      stockBoxes: 110,
      lowStockAlert: 15,
      images: tileImages,
      image: tileImages[2] || tileImages[0],
      variantSpecs: { costPrice: 460, profitMarginPercent: 26.98 },
    },
    {
      sku: "INT-TL-GRP-60120",
      variantName: "Graphite Grey - 600x1200mm",
      color: "Graphite Grey",
      colorHex: "#383E42",
      size: "600x1200mm (2x4 ft)",
      attributeValue: "600x1200mm (2x4 ft)",
      finish: "Sugar Finish Anti-Skid",
      mrp: 1520,
      price: 1120,
      pricePerBox: 1120,
      sqftPerBox: 15.5,
      piecesPerBox: 2,
      stockBoxes: 80,
      lowStockAlert: 10,
      images: tileImages,
      image: tileImages[2] || tileImages[0],
      variantSpecs: { costPrice: 830, profitMarginPercent: 25.89 },
    },
    {
      sku: "INT-TL-GRP-80160",
      variantName: "Graphite Grey - 800x1600mm",
      color: "Graphite Grey",
      colorHex: "#383E42",
      size: "800x1600mm (2.6x5.2 ft)",
      attributeValue: "800x1600mm (2.6x5.2 ft)",
      finish: "Sugar Finish Anti-Skid",
      mrp: 2700,
      price: 2050,
      pricePerBox: 2050,
      sqftPerBox: 27.5,
      piecesPerBox: 2,
      stockBoxes: 45,
      lowStockAlert: 6,
      images: tileImages,
      image: tileImages[2] || tileImages[0],
      variantSpecs: { costPrice: 1520, profitMarginPercent: 25.85 },
    },
  ];

  const itemTiles = await prisma.product.create({
    data: {
      name: "Kajaria Grand Vitrified Floor Tile",
      slug: tileSlug,
      categoryId: catTiles.id,
      categorySlug: catTiles.slug,
      categoryName: catTiles.name,
      subcategory: "Vitrified Tiles",
      brand: "Kajaria",
      sku: "INT-TL-6060-GRD",
      unitOfSale: "box",
      weightKg: 28,
      isBulky: true,
      mrp: 850,
      pricePerSqft: 590,
      inStock: true,
      hasVariants: true,
      images: tileImages,
      description: "Premium large-format vitrified floor tiles engineered by Kajaria with nano-polished stain guard, rectified zero-joint edges, and high breaking strength. Suitable for luxury residential living rooms, commercial lobbies, and designer bathrooms.",
      specs: {
        material: "Glazed Vitrified Tile (GVT)",
        finishOptions: ["High Gloss", "Satin Matt", "Anti-Skid Sugar"],
        edgeType: "Rectified Zero-Joint",
        waterAbsorption: "< 0.05%",
        breakingStrength: "2000 N",
        tags: ["BEST_SELLER", "LUXURY_COLLECTION", "STAIN_RESISTANT"],
        costPrice: 440,
        profitMarginPercent: 25.42,
      },
      shippingMode: "heavy_bulky",
      returnPolicyDays: 7,
      vendorId: vendor.id,
      status: "active",
      approvalStatus: "approved",
      variants: {
        create: tileVariantsData,
      },
    },
  });

  console.log(`[CREATED 1/3] ${itemTiles.name} -> /product/${itemTiles.slug}`);

  // =========================================================================
  // ITEM 2: Asian Paints Royale Luxury Interior Emulsion
  // Sub-Category: Interior Luxury Emulsion
  // Colors: Brilliant White (#FFFFFF), Morning Buttercream (#FDF6E2), Nordic Sage Green (#9CAF88)
  // Sizes / Volumes: 1 Litre, 4 Litre, 10 Litre, 20 Litre
  // =========================================================================
  const paintSlug = "asian-paints-royale-luxury-interior-emulsion";
  await prisma.productVariant.deleteMany({
    where: { product: { slug: paintSlug } },
  });
  await prisma.product.deleteMany({
    where: { slug: paintSlug },
  });

  const paintImages = [
    "/images/categories/cat-paint-finishes.jpg",
    "/images/categories/cat-paint-finishes.jpg",
    "/images/categories/cat-paint-finishes.jpg",
  ];

  const paintVariantsData = [
    // Brilliant White
    {
      sku: "INT-PNT-ROY-BW-01L",
      variantName: "Brilliant White - 1 Litre",
      color: "Brilliant White",
      colorHex: "#FFFFFF",
      size: "1 Litre Can",
      attributeValue: "1 Litre Can",
      mrp: 540,
      price: 430,
      pricePerBox: 430,
      sqftPerBox: 140,
      piecesPerBox: 1,
      stockBoxes: 60,
      lowStockAlert: 8,
      images: paintImages,
      image: paintImages[0],
      variantSpecs: { costPrice: 320, profitMarginPercent: 25.58 },
    },
    {
      sku: "INT-PNT-ROY-BW-04L",
      variantName: "Brilliant White - 4 Litre",
      color: "Brilliant White",
      colorHex: "#FFFFFF",
      size: "4 Litre Can",
      attributeValue: "4 Litre Can",
      mrp: 1950,
      price: 1580,
      pricePerBox: 1580,
      sqftPerBox: 560,
      piecesPerBox: 1,
      stockBoxes: 45,
      lowStockAlert: 6,
      images: paintImages,
      image: paintImages[0],
      variantSpecs: { costPrice: 1180, profitMarginPercent: 25.32 },
    },
    {
      sku: "INT-PNT-ROY-BW-10L",
      variantName: "Brilliant White - 10 Litre",
      color: "Brilliant White",
      colorHex: "#FFFFFF",
      size: "10 Litre Bucket",
      attributeValue: "10 Litre Bucket",
      mrp: 4600,
      price: 3750,
      pricePerBox: 3750,
      sqftPerBox: 1400,
      piecesPerBox: 1,
      stockBoxes: 30,
      lowStockAlert: 4,
      images: paintImages,
      image: paintImages[0],
      variantSpecs: { costPrice: 2800, profitMarginPercent: 25.33 },
    },
    {
      sku: "INT-PNT-ROY-BW-20L",
      variantName: "Brilliant White - 20 Litre",
      color: "Brilliant White",
      colorHex: "#FFFFFF",
      size: "20 Litre Drum",
      attributeValue: "20 Litre Drum",
      mrp: 8800,
      price: 7100,
      pricePerBox: 7100,
      sqftPerBox: 2800,
      piecesPerBox: 1,
      stockBoxes: 25,
      lowStockAlert: 3,
      images: paintImages,
      image: paintImages[0],
      variantSpecs: { costPrice: 5300, profitMarginPercent: 25.35 },
    },
    // Morning Buttercream
    {
      sku: "INT-PNT-ROY-MB-01L",
      variantName: "Morning Buttercream - 1 Litre",
      color: "Morning Buttercream",
      colorHex: "#FDF6E2",
      size: "1 Litre Can",
      attributeValue: "1 Litre Can",
      mrp: 560,
      price: 450,
      pricePerBox: 450,
      sqftPerBox: 140,
      piecesPerBox: 1,
      stockBoxes: 50,
      lowStockAlert: 8,
      images: paintImages,
      image: paintImages[1] || paintImages[0],
      variantSpecs: { costPrice: 335, profitMarginPercent: 25.56 },
    },
    {
      sku: "INT-PNT-ROY-MB-04L",
      variantName: "Morning Buttercream - 4 Litre",
      color: "Morning Buttercream",
      colorHex: "#FDF6E2",
      size: "4 Litre Can",
      attributeValue: "4 Litre Can",
      mrp: 2020,
      price: 1640,
      pricePerBox: 1640,
      sqftPerBox: 560,
      piecesPerBox: 1,
      stockBoxes: 40,
      lowStockAlert: 5,
      images: paintImages,
      image: paintImages[1] || paintImages[0],
      variantSpecs: { costPrice: 1220, profitMarginPercent: 25.61 },
    },
    {
      sku: "INT-PNT-ROY-MB-10L",
      variantName: "Morning Buttercream - 10 Litre",
      color: "Morning Buttercream",
      colorHex: "#FDF6E2",
      size: "10 Litre Bucket",
      attributeValue: "10 Litre Bucket",
      mrp: 4750,
      price: 3880,
      pricePerBox: 3880,
      sqftPerBox: 1400,
      piecesPerBox: 1,
      stockBoxes: 28,
      lowStockAlert: 4,
      images: paintImages,
      image: paintImages[1] || paintImages[0],
      variantSpecs: { costPrice: 2890, profitMarginPercent: 25.52 },
    },
    {
      sku: "INT-PNT-ROY-MB-20L",
      variantName: "Morning Buttercream - 20 Litre",
      color: "Morning Buttercream",
      colorHex: "#FDF6E2",
      size: "20 Litre Drum",
      attributeValue: "20 Litre Drum",
      mrp: 9100,
      price: 7350,
      pricePerBox: 7350,
      sqftPerBox: 2800,
      piecesPerBox: 1,
      stockBoxes: 20,
      lowStockAlert: 3,
      images: paintImages,
      image: paintImages[1] || paintImages[0],
      variantSpecs: { costPrice: 5480, profitMarginPercent: 25.44 },
    },
    // Nordic Sage Green
    {
      sku: "INT-PNT-ROY-NS-01L",
      variantName: "Nordic Sage Green - 1 Litre",
      color: "Nordic Sage Green",
      colorHex: "#9CAF88",
      size: "1 Litre Can",
      attributeValue: "1 Litre Can",
      mrp: 580,
      price: 470,
      pricePerBox: 470,
      sqftPerBox: 140,
      piecesPerBox: 1,
      stockBoxes: 45,
      lowStockAlert: 6,
      images: paintImages,
      image: paintImages[2] || paintImages[0],
      variantSpecs: { costPrice: 350, profitMarginPercent: 25.53 },
    },
    {
      sku: "INT-PNT-ROY-NS-04L",
      variantName: "Nordic Sage Green - 4 Litre",
      color: "Nordic Sage Green",
      colorHex: "#9CAF88",
      size: "4 Litre Can",
      attributeValue: "4 Litre Can",
      mrp: 2100,
      price: 1690,
      pricePerBox: 1690,
      sqftPerBox: 560,
      piecesPerBox: 1,
      stockBoxes: 35,
      lowStockAlert: 5,
      images: paintImages,
      image: paintImages[2] || paintImages[0],
      variantSpecs: { costPrice: 1260, profitMarginPercent: 25.44 },
    },
    {
      sku: "INT-PNT-ROY-NS-10L",
      variantName: "Nordic Sage Green - 10 Litre",
      color: "Nordic Sage Green",
      colorHex: "#9CAF88",
      size: "10 Litre Bucket",
      attributeValue: "10 Litre Bucket",
      mrp: 4950,
      price: 3990,
      pricePerBox: 3990,
      sqftPerBox: 1400,
      piecesPerBox: 1,
      stockBoxes: 25,
      lowStockAlert: 3,
      images: paintImages,
      image: paintImages[2] || paintImages[0],
      variantSpecs: { costPrice: 2970, profitMarginPercent: 25.56 },
    },
    {
      sku: "INT-PNT-ROY-NS-20L",
      variantName: "Nordic Sage Green - 20 Litre",
      color: "Nordic Sage Green",
      colorHex: "#9CAF88",
      size: "20 Litre Drum",
      attributeValue: "20 Litre Drum",
      mrp: 9400,
      price: 7600,
      pricePerBox: 7600,
      sqftPerBox: 2800,
      piecesPerBox: 1,
      stockBoxes: 18,
      lowStockAlert: 3,
      images: paintImages,
      image: paintImages[2] || paintImages[0],
      variantSpecs: { costPrice: 5650, profitMarginPercent: 25.66 },
    },
  ];

  const itemPaints = await prisma.product.create({
    data: {
      name: "Asian Paints Royale Luxury Interior Emulsion",
      slug: paintSlug,
      categoryId: catPaints.id,
      categorySlug: catPaints.slug,
      categoryName: catPaints.name,
      subcategory: "Interior Luxury Emulsion",
      brand: "Asian Paints",
      sku: "INT-PNT-ROY-001",
      unitOfSale: "can",
      weightKg: 5.5,
      isBulky: false,
      mrp: 540,
      pricePerSqft: 430,
      inStock: true,
      hasVariants: true,
      images: paintImages,
      description: "Asian Paints Royale Luxury Emulsion gives walls a smooth, silky sheen finish with anti-bacterial shield and Teflon surface protector for effortless stain wipe-off. Zero VOC, odorless formula perfect for living rooms, master bedrooms, and dining halls.",
      specs: {
        coverage: "140 - 160 sq.ft per litre (2 coats)",
        finish: "Soft Silky Sheen",
        dryTime: "30 minutes surface dry",
        recoatInterval: "4 hours",
        washability: "100% Washable (Teflon Protected)",
        tags: ["TEFLON_SURFACE", "ANTI_BACTERIAL", "ODORLESS"],
        costPrice: 320,
        profitMarginPercent: 25.58,
      },
      shippingMode: "standard",
      returnPolicyDays: 7,
      vendorId: vendor.id,
      status: "active",
      approvalStatus: "approved",
      variants: {
        create: paintVariantsData,
      },
    },
  });

  console.log(`[CREATED 2/3] ${itemPaints.name} -> /product/${itemPaints.slug}`);

  // =========================================================================
  // ITEM 3: Schneider Electric AvatarOn Smart Touch Switch Plate
  // Sub-Category: Modular Switches & Sockets
  // Colors: Crystal White (#FFFFFF), Champagne Gold (#D4AF37), Matte Dark Grey (#2B2B2B)
  // Sizes / Gangs: 2-Module Plate (86x86mm), 4-Module Plate (146x86mm), 8-Module Plate (230x86mm)
  // =========================================================================
  const switchSlug = "schneider-electric-avataron-smart-touch-switch";
  await prisma.productVariant.deleteMany({
    where: { product: { slug: switchSlug } },
  });
  await prisma.product.deleteMany({
    where: { slug: switchSlug },
  });

  const switchImages = [
    "/images/categories/cat-electrical.jpg",
    "/images/categories/cat-electrical.jpg",
    "/images/categories/cat-electrical.jpg",
  ];

  const switchVariantsData = [
    // Crystal White
    {
      sku: "INT-ELE-AVT-CW-2M",
      variantName: "Crystal White - 2 Module (86x86mm)",
      color: "Crystal White",
      colorHex: "#FFFFFF",
      size: "2 Module (86x86mm)",
      attributeValue: "2 Module (86x86mm)",
      mrp: 650,
      price: 490,
      pricePerBox: 490,
      sqftPerBox: 1,
      piecesPerBox: 1,
      stockBoxes: 150,
      lowStockAlert: 20,
      images: switchImages,
      image: switchImages[0],
      variantSpecs: { costPrice: 360, profitMarginPercent: 26.53 },
    },
    {
      sku: "INT-ELE-AVT-CW-4M",
      variantName: "Crystal White - 4 Module (146x86mm)",
      color: "Crystal White",
      colorHex: "#FFFFFF",
      size: "4 Module (146x86mm)",
      attributeValue: "4 Module (146x86mm)",
      mrp: 1100,
      price: 840,
      pricePerBox: 840,
      sqftPerBox: 1,
      piecesPerBox: 1,
      stockBoxes: 120,
      lowStockAlert: 15,
      images: switchImages,
      image: switchImages[0],
      variantSpecs: { costPrice: 620, profitMarginPercent: 26.19 },
    },
    {
      sku: "INT-ELE-AVT-CW-8M",
      variantName: "Crystal White - 8 Module (230x86mm)",
      color: "Crystal White",
      colorHex: "#FFFFFF",
      size: "8 Module (230x86mm)",
      attributeValue: "8 Module (230x86mm)",
      mrp: 1850,
      price: 1390,
      pricePerBox: 1390,
      sqftPerBox: 1,
      piecesPerBox: 1,
      stockBoxes: 80,
      lowStockAlert: 10,
      images: switchImages,
      image: switchImages[0],
      variantSpecs: { costPrice: 1020, profitMarginPercent: 26.62 },
    },
    // Champagne Gold
    {
      sku: "INT-ELE-AVT-CG-2M",
      variantName: "Champagne Gold - 2 Module (86x86mm)",
      color: "Champagne Gold",
      colorHex: "#D4AF37",
      size: "2 Module (86x86mm)",
      attributeValue: "2 Module (86x86mm)",
      mrp: 720,
      price: 540,
      pricePerBox: 540,
      sqftPerBox: 1,
      piecesPerBox: 1,
      stockBoxes: 110,
      lowStockAlert: 15,
      images: switchImages,
      image: switchImages[1] || switchImages[0],
      variantSpecs: { costPrice: 395, profitMarginPercent: 26.85 },
    },
    {
      sku: "INT-ELE-AVT-CG-4M",
      variantName: "Champagne Gold - 4 Module (146x86mm)",
      color: "Champagne Gold",
      colorHex: "#D4AF37",
      size: "4 Module (146x86mm)",
      attributeValue: "4 Module (146x86mm)",
      mrp: 1220,
      price: 930,
      pricePerBox: 930,
      sqftPerBox: 1,
      piecesPerBox: 1,
      stockBoxes: 90,
      lowStockAlert: 12,
      images: switchImages,
      image: switchImages[1] || switchImages[0],
      variantSpecs: { costPrice: 680, profitMarginPercent: 26.88 },
    },
    {
      sku: "INT-ELE-AVT-CG-8M",
      variantName: "Champagne Gold - 8 Module (230x86mm)",
      color: "Champagne Gold",
      colorHex: "#D4AF37",
      size: "8 Module (230x86mm)",
      attributeValue: "8 Module (230x86mm)",
      mrp: 1980,
      price: 1490,
      pricePerBox: 1490,
      sqftPerBox: 1,
      piecesPerBox: 1,
      stockBoxes: 65,
      lowStockAlert: 8,
      images: switchImages,
      image: switchImages[1] || switchImages[0],
      variantSpecs: { costPrice: 1090, profitMarginPercent: 26.85 },
    },
    // Matte Dark Grey
    {
      sku: "INT-ELE-AVT-DG-2M",
      variantName: "Matte Dark Grey - 2 Module (86x86mm)",
      color: "Matte Dark Grey",
      colorHex: "#2B2B2B",
      size: "2 Module (86x86mm)",
      attributeValue: "2 Module (86x86mm)",
      mrp: 750,
      price: 560,
      pricePerBox: 560,
      sqftPerBox: 1,
      piecesPerBox: 1,
      stockBoxes: 130,
      lowStockAlert: 15,
      images: switchImages,
      image: switchImages[2] || switchImages[0],
      variantSpecs: { costPrice: 410, profitMarginPercent: 26.79 },
    },
    {
      sku: "INT-ELE-AVT-DG-4M",
      variantName: "Matte Dark Grey - 4 Module (146x86mm)",
      color: "Matte Dark Grey",
      colorHex: "#2B2B2B",
      size: "4 Module (146x86mm)",
      attributeValue: "4 Module (146x86mm)",
      mrp: 1280,
      price: 970,
      pricePerBox: 970,
      sqftPerBox: 1,
      piecesPerBox: 1,
      stockBoxes: 100,
      lowStockAlert: 12,
      images: switchImages,
      image: switchImages[2] || switchImages[0],
      variantSpecs: { costPrice: 710, profitMarginPercent: 26.8 },
    },
    {
      sku: "INT-ELE-AVT-DG-8M",
      variantName: "Matte Dark Grey - 8 Module (230x86mm)",
      color: "Matte Dark Grey",
      colorHex: "#2B2B2B",
      size: "8 Module (230x86mm)",
      attributeValue: "8 Module (230x86mm)",
      mrp: 2050,
      price: 1550,
      pricePerBox: 1550,
      sqftPerBox: 1,
      piecesPerBox: 1,
      stockBoxes: 70,
      lowStockAlert: 8,
      images: switchImages,
      image: switchImages[2] || switchImages[0],
      variantSpecs: { costPrice: 1130, profitMarginPercent: 27.1 },
    },
  ];

  const itemSwitch = await prisma.product.create({
    data: {
      name: "Schneider Electric AvatarOn Smart Touch Switch Plate",
      slug: switchSlug,
      categoryId: catElectrical.id,
      categorySlug: catElectrical.slug,
      categoryName: catElectrical.name,
      subcategory: "Modular Switches & Sockets",
      brand: "Schneider Electric",
      sku: "INT-ELE-AVT-001",
      unitOfSale: "piece",
      weightKg: 0.35,
      isBulky: false,
      mrp: 650,
      pricePerSqft: 490,
      inStock: true,
      hasVariants: true,
      images: switchImages,
      description: "Schneider Electric AvatarOn revolutionary frameless mirror-flat switch plates with interchangeable covers and soft-click touch mechanisms. Flame-retardant polycarbonate construction with copper-silver alloy contacts.",
      specs: {
        plateMechanism: "Frameless Soft-Touch",
        voltageRating: "240V AC ~ 50Hz",
        currentRating: "10AX / 16A",
        material: "Flame-Retardant Polycarbonate",
        certifications: ["IS 3854", "IEC 60669-1"],
        tags: ["FRAMELESS", "SOFT_TOUCH", "INTERCHANGEABLE_COVERS"],
        costPrice: 360,
        profitMarginPercent: 26.53,
      },
      shippingMode: "standard",
      returnPolicyDays: 7,
      vendorId: vendor.id,
      status: "active",
      approvalStatus: "approved",
      variants: {
        create: switchVariantsData,
      },
    },
  });

  console.log(`[CREATED 3/3] ${itemSwitch.name} -> /product/${itemSwitch.slug}`);

  console.log("\n=== ALL 3 ITEMS CREATED SUCCESSFULLY ===");
  console.log("1. Kajaria Grand Vitrified Floor Tile: /product/kajaria-grand-vitrified-floor-tile");
  console.log("2. Asian Paints Royale Luxury Interior Emulsion: /product/asian-paints-royale-luxury-interior-emulsion");
  console.log("3. Schneider Electric AvatarOn Smart Touch Switch: /product/schneider-electric-avataron-smart-touch-switch");
}

seed3MultiVariantItems()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
