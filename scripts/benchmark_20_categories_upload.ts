import { prisma } from "../lib/prisma";
import { safeSlugify } from "../lib/validators";
import { performance } from "perf_hooks";

export interface DemoItemBenchmark {
  index: number;
  categoryName: string;
  categorySlug: string;
  subCategory: string;
  title: string;
  sku: string;
  mrp: number;
  sellingPrice: number;
  costPrice: number;
  profitMarginPercent: number;
  customerDiscountPercent: number;
  unitOfSale: string;
  dimensions: string;
  weightKg: number;
  images: string[];
  stockQuantity: number;
  lowStockThreshold: number;
  tags: string[];
  customBadgeText: string;
  badgeColor: string;
  shippingMode: string;
  returnPolicyDays: number;
  status: "SUCCESS" | "FAIL";
  latencyMs: number;
  error?: string;
}

const DEMO_ITEMS_SPECS = [
  {
    index: 1,
    categoryName: "Cement & Concrete",
    categorySlug: "cement-concrete",
    subCategory: "OPC & PPC Cement",
    title: "UltraTech PPC Cement Bag 50kg",
    sku: "INT-CEM-001",
    mrp: 420,
    sellingPrice: 380,
    costPrice: 340,
    unitOfSale: "bag",
    dimensions: "50kg Woven Polypropylene Bag",
    weightKg: 50,
    images: ["/images/categories/cat-cement-concrete.jpg", "/images/categories/cat-cement-concrete.jpg"],
    stockQuantity: 250,
    lowStockThreshold: 25,
    tags: ["BEST_SELLER", "HEAVY_MATERIAL"],
    customBadgeText: "Site Delivery Ready",
    badgeColor: "BLUE",
    shippingMode: "heavy_bulky",
    returnPolicyDays: 0,
  },
  {
    index: 2,
    categoryName: "Steel & Rebar",
    categorySlug: "steel-rebar",
    subCategory: "TMT Bars & Rebars",
    title: "TATA Tiscon 12mm TMT Bar",
    sku: "INT-STL-012",
    mrp: 65000,
    sellingPrice: 58000,
    costPrice: 52000,
    unitOfSale: "ton",
    dimensions: "12mm Diameter x 12m Standard Length",
    weightKg: 1000,
    images: ["/images/categories/cat-steel-rebar.jpg"],
    stockQuantity: 40,
    lowStockThreshold: 5,
    tags: ["FACTORY_PRICE", "CERTIFIED_STEEL"],
    customBadgeText: "BIS Certified Fe550D",
    badgeColor: "ORANGE",
    shippingMode: "heavy_bulky",
    returnPolicyDays: 0,
  },
  {
    index: 3,
    categoryName: "Bricks & Blocks",
    categorySlug: "bricks-blocks",
    subCategory: "AAC Blocks",
    title: "AAC Lightweight Block 600x200x100mm",
    sku: "INT-BRK-002",
    mrp: 75,
    sellingPrice: 62,
    costPrice: 50,
    unitOfSale: "piece",
    dimensions: "600 x 200 x 100 mm",
    weightKg: 8.5,
    images: ["/images/categories/cat-bricks-blocks.jpg", "/images/categories/cat-bricks-blocks.jpg"],
    stockQuantity: 1200,
    lowStockThreshold: 100,
    tags: ["LIGHTWEIGHT", "THERMAL_INSULATED"],
    customBadgeText: "High Compressive Strength",
    badgeColor: "GREEN",
    shippingMode: "heavy_bulky",
    returnPolicyDays: 7,
  },
  {
    index: 4,
    categoryName: "Sand & Aggregates",
    categorySlug: "sand-aggregates",
    subCategory: "M-Sand",
    title: "Premium M-Sand (Crushed Stone)",
    sku: "INT-SND-001",
    mrp: 1800,
    sellingPrice: 1500,
    costPrice: 1200,
    unitOfSale: "ton",
    dimensions: "Zone II Fine Aggregate Gravel",
    weightKg: 1000,
    images: ["/images/categories/cat-sand-aggregates.jpg"],
    stockQuantity: 150,
    lowStockThreshold: 15,
    tags: ["TRUCKLOAD_AVAILABLE"],
    customBadgeText: "Washed & Silt-Free",
    badgeColor: "BLUE",
    shippingMode: "heavy_bulky",
    returnPolicyDays: 0,
  },
  {
    index: 5,
    categoryName: "Roofing & Sheets",
    categorySlug: "roofing-sheets",
    subCategory: "Metal Sheets",
    title: "Tata Shaktee GC Sheet 0.50mm",
    sku: "INT-ROF-005",
    mrp: 950,
    sellingPrice: 820,
    costPrice: 710,
    unitOfSale: "sheet",
    dimensions: "10 ft x 3 ft x 0.50mm",
    weightKg: 11.2,
    images: ["/images/categories/cat-roofing-sheets.jpg", "/images/categories/cat-roofing-sheets.jpg"],
    stockQuantity: 300,
    lowStockThreshold: 30,
    tags: ["WEATHERPROOF", "CORROSION_RESISTANT"],
    customBadgeText: "Zinc Shielded",
    badgeColor: "PURPLE",
    shippingMode: "heavy_bulky",
    returnPolicyDays: 7,
  },
  {
    index: 6,
    categoryName: "Site Tools & Safety",
    categorySlug: "site-tools-safety",
    subCategory: "Power Tools",
    title: "Bosch GSB 500W Professional Impact Drill",
    sku: "INT-TLS-500",
    mrp: 3800,
    sellingPrice: 2950,
    costPrice: 2300,
    unitOfSale: "piece",
    dimensions: "26 x 24 x 8 cm",
    weightKg: 1.8,
    images: ["/images/categories/cat-tools-consumables.jpg", "/images/categories/cat-tools-consumables.jpg", "/images/categories/cat-tools-consumables.jpg"],
    stockQuantity: 75,
    lowStockThreshold: 8,
    tags: ["BEST_SELLER", "1_YEAR_WARRANTY"],
    customBadgeText: "Original Bosch Kit Included",
    badgeColor: "RED",
    shippingMode: "standard",
    returnPolicyDays: 7,
  },
  {
    index: 7,
    categoryName: "Tiles & Flooring",
    categorySlug: "tiles-flooring",
    subCategory: "Vitrified Tiles",
    title: "Kajaria 600x600mm Eternity White Tile",
    sku: "INT-TL-6060",
    mrp: 800,
    sellingPrice: 550,
    costPrice: 400,
    unitOfSale: "box",
    dimensions: "600 x 600 mm x 9mm",
    weightKg: 28,
    images: ["/images/categories/cat-tiles-stone.jpg", "/images/categories/cat-tiles-stone.jpg", "/images/categories/cat-tiles-stone.jpg"],
    stockQuantity: 450,
    lowStockThreshold: 40,
    tags: ["HIGH_GLOSS", "NANO_POLISHED"],
    customBadgeText: "4 Pcs (15.5 Sqft/Box)",
    badgeColor: "ORANGE",
    shippingMode: "heavy_bulky",
    returnPolicyDays: 7,
  },
  {
    index: 8,
    categoryName: "Plywood, Laminates & Surfaces",
    categorySlug: "plywood-laminates-surfaces",
    subCategory: "Marine Plywood",
    title: "CenturyPly 19mm Club Prime Marine Ply",
    sku: "INT-PLY-019",
    mrp: 3200,
    sellingPrice: 2600,
    costPrice: 2100,
    unitOfSale: "sheet",
    dimensions: "8 ft x 4 ft x 19mm",
    weightKg: 36,
    images: ["/images/categories/cat-plywood.jpg", "/images/categories/cat-plywood.jpg"],
    stockQuantity: 180,
    lowStockThreshold: 20,
    tags: ["BWP_GRADE", "BORER_TERMITE_PROOF"],
    customBadgeText: "25 Year Guarantee",
    badgeColor: "BLUE",
    shippingMode: "heavy_bulky",
    returnPolicyDays: 7,
  },
  {
    index: 9,
    categoryName: "Hardware & Fasteners",
    categorySlug: "hardware-fasteners",
    subCategory: "Door Locks",
    title: "Godrej Mortise Door Handle Set",
    sku: "INT-HWD-009",
    mrp: 2400,
    sellingPrice: 1850,
    costPrice: 1350,
    unitOfSale: "piece",
    dimensions: "24 x 12 x 6 cm",
    weightKg: 1.4,
    images: ["/images/categories/cat-hardware.webp", "/images/categories/cat-hardware.webp", "/images/categories/cat-hardware.webp"],
    stockQuantity: 110,
    lowStockThreshold: 10,
    tags: ["ANTIQUE_BRASS", "DOUBLE_KEY"],
    customBadgeText: "Computerized Dimple Keys",
    badgeColor: "GOLD",
    shippingMode: "standard",
    returnPolicyDays: 7,
  },
  {
    index: 10,
    categoryName: "Lights & Lighting",
    categorySlug: "lights-lighting",
    subCategory: "COB Lights",
    title: "Philips 12W COB Warm White LED Light",
    sku: "INT-LGT-012",
    mrp: 750,
    sellingPrice: 480,
    costPrice: 330,
    unitOfSale: "piece",
    dimensions: "Cutout 75mm, Outer 85mm",
    weightKg: 0.35,
    images: ["/images/categories/cat-lighting.jpg", "/images/categories/cat-lighting.jpg"],
    stockQuantity: 500,
    lowStockThreshold: 50,
    tags: ["ENERGY_SAVER", "WARM_WHITE_3000K"],
    customBadgeText: "Flicker-Free Deep Recessed",
    badgeColor: "GREEN",
    shippingMode: "standard",
    returnPolicyDays: 7,
  },
  {
    index: 11,
    categoryName: "Kitchen & Wardrobe Fittings",
    categorySlug: "kitchen-wardrobe-fittings",
    subCategory: "Drawer Slides",
    title: "Hettich InnoTech Atira Tandem Drawer",
    sku: "INT-KTN-001",
    mrp: 4200,
    sellingPrice: 3100,
    costPrice: 2250,
    unitOfSale: "set",
    dimensions: "500mm Depth, 70mm Height",
    weightKg: 3.8,
    images: ["/images/categories/cat-kitchen-wardrobe.jpg", "/images/categories/cat-kitchen-wardrobe.jpg"],
    stockQuantity: 90,
    lowStockThreshold: 10,
    tags: ["SOFT_CLOSE", "30KG_CAPACITY"],
    customBadgeText: "German Precision Engineered",
    badgeColor: "BLUE",
    shippingMode: "standard",
    returnPolicyDays: 7,
  },
  {
    index: 12,
    categoryName: "Paints & Finishes",
    categorySlug: "paint-finishes",
    subCategory: "Exterior Paint",
    title: "Asian Paints Apex Ultima White 20L",
    sku: "INT-PNT-020",
    mrp: 6800,
    sellingPrice: 5400,
    costPrice: 4500,
    unitOfSale: "bucket",
    dimensions: "20 Litre Heavy Polymer Bucket",
    weightKg: 26,
    images: ["/images/categories/cat-paint-finishes.jpg", "/images/categories/cat-paint-finishes.jpg"],
    stockQuantity: 65,
    lowStockThreshold: 8,
    tags: ["ANTI_ALGAL", "7_YEAR_PERFORMANCE"],
    customBadgeText: "Dirt Pick-Up Resistant",
    badgeColor: "PURPLE",
    shippingMode: "heavy_bulky",
    returnPolicyDays: 0,
  },
  {
    index: 13,
    categoryName: "Glass, Mirrors & Profiles",
    categorySlug: "glass-mirrors-profiles",
    subCategory: "Clear Glass",
    title: "Saint-Gobain 8mm Toughened Glass Sheet",
    sku: "INT-GLS-008",
    mrp: 140,
    sellingPrice: 110,
    costPrice: 85,
    unitOfSale: "sqft",
    dimensions: "Custom Cut to Size x 8mm",
    weightKg: 20,
    images: ["/images/categories/cat-glass-mirror.jpg"],
    stockQuantity: 400,
    lowStockThreshold: 30,
    tags: ["SAFETY_GLAZING", "EDGE_POLISHED"],
    customBadgeText: "High Impact Proof",
    badgeColor: "BLUE",
    shippingMode: "heavy_bulky",
    returnPolicyDays: 0,
  },
  {
    index: 14,
    categoryName: "Ceiling & Drywall",
    categorySlug: "ceiling-drywall",
    subCategory: "Gypsum Board",
    title: "Saint-Gobain Gyproc 12.5mm Board",
    sku: "INT-CLG-012",
    mrp: 410,
    sellingPrice: 320,
    costPrice: 260,
    unitOfSale: "sheet",
    dimensions: "6 ft x 4 ft x 12.5mm",
    weightKg: 19.5,
    images: ["/images/categories/cat-false-ceiling.jpg", "/images/categories/cat-false-ceiling.jpg"],
    stockQuantity: 350,
    lowStockThreshold: 40,
    tags: ["FIRE_RESISTANT", "ACOUSTIC_INSULATION"],
    customBadgeText: "Tapered Edge Sheet",
    badgeColor: "ORANGE",
    shippingMode: "heavy_bulky",
    returnPolicyDays: 7,
  },
  {
    index: 15,
    categoryName: "Electricals & Wires",
    categorySlug: "electricals-wires",
    subCategory: "Wires & Cables",
    title: "Havells 2.5 sq mm FR PVC Copper Wire 90m",
    sku: "INT-ELE-025",
    mrp: 2800,
    sellingPrice: 1950,
    costPrice: 1500,
    unitOfSale: "coil",
    dimensions: "90 Meters Length, 2.5 sq mm Core",
    weightKg: 3.2,
    images: ["/images/categories/cat-electrical.jpg", "/images/categories/cat-electrical.jpg"],
    stockQuantity: 220,
    lowStockThreshold: 25,
    tags: ["FIRE_RETARDANT", "100_PERCENT_COPPER"],
    customBadgeText: "IS:694 Certified",
    badgeColor: "RED",
    shippingMode: "standard",
    returnPolicyDays: 7,
  },
  {
    index: 16,
    categoryName: "Plumbing & Tanks",
    categorySlug: "plumbing-tanks",
    subCategory: "CPVC Pipes",
    title: "Astral CPVC Pro Pipe 1 Inch 3m",
    sku: "INT-PLM-001",
    mrp: 480,
    sellingPrice: 360,
    costPrice: 270,
    unitOfSale: "piece",
    dimensions: "1 Inch Diameter x 3 Meters Length (SDR 11)",
    weightKg: 1.1,
    images: ["/images/categories/cat-plumbing.jpg", "/images/categories/cat-plumbing.jpg"],
    stockQuantity: 280,
    lowStockThreshold: 30,
    tags: ["HOT_COLD_COMPATIBLE", "LEAD_FREE"],
    customBadgeText: "NSF Certified Potable Water",
    badgeColor: "BLUE",
    shippingMode: "heavy_bulky",
    returnPolicyDays: 7,
  },
  {
    index: 17,
    categoryName: "Sanitaryware & Bath",
    categorySlug: "sanitaryware-bath",
    subCategory: "Bath Faucets",
    title: "Jaquar Single Lever Basin Mixer Chrome",
    sku: "INT-SAN-001",
    mrp: 4500,
    sellingPrice: 3200,
    costPrice: 2350,
    unitOfSale: "piece",
    dimensions: "165 x 115 x 50 mm",
    weightKg: 1.6,
    images: ["/images/categories/cat-sanitaryware-bath.jpg", "/images/categories/cat-sanitaryware-bath.jpg", "/images/categories/cat-sanitaryware-bath.jpg"],
    stockQuantity: 85,
    lowStockThreshold: 10,
    tags: ["10_YEAR_WARRANTY", "CHROME_FINISH"],
    customBadgeText: "Aerated Water Saving Flow",
    badgeColor: "ORANGE",
    shippingMode: "standard",
    returnPolicyDays: 7,
  },
  {
    index: 18,
    categoryName: "Doors & Windows",
    categorySlug: "doors-windows-locks",
    subCategory: "UPVC Windows",
    title: "Fenesta UPVC Sliding Window 4x4 ft",
    sku: "INT-DOR-004",
    mrp: 14000,
    sellingPrice: 10500,
    costPrice: 8000,
    unitOfSale: "piece",
    dimensions: "4 ft x 4 ft (1200 x 1200 mm)",
    weightKg: 32,
    images: ["/images/categories/cat-doors-windows.jpg", "/images/categories/cat-doors-windows.jpg"],
    stockQuantity: 30,
    lowStockThreshold: 4,
    tags: ["SOUNDPROOF", "DOUBLE_GLAZED"],
    customBadgeText: "Includes Bug Mesh Screen",
    badgeColor: "GREEN",
    shippingMode: "heavy_bulky",
    returnPolicyDays: 7,
  },
  {
    index: 19,
    categoryName: "Waterproofing & Adhesives",
    categorySlug: "waterproofing-adhesives",
    subCategory: "Waterproofing",
    title: "Dr. Fixit LW+ Waterproofing Liquid 5L",
    sku: "INT-ADH-005",
    mrp: 720,
    sellingPrice: 580,
    costPrice: 440,
    unitOfSale: "can",
    dimensions: "5 Litre Jerry Can",
    weightKg: 5.5,
    images: ["/images/categories/cat-adhesives-sealants-waterproofing.jpg", "/images/categories/cat-adhesives-sealants-waterproofing.jpg"],
    stockQuantity: 160,
    lowStockThreshold: 15,
    tags: ["ANTI_CRACK", "CONCRETE_INTEGRAL"],
    customBadgeText: "Corrosion Resisting Admixture",
    badgeColor: "BLUE",
    shippingMode: "standard",
    returnPolicyDays: 7,
  },
  {
    index: 20,
    categoryName: "Solar & Energy",
    categorySlug: "solar-energy",
    subCategory: "Solar PV Panels",
    title: "Luminous 540W Mono PERC Solar Panel",
    sku: "INT-SLR-540",
    mrp: 18000,
    sellingPrice: 14200,
    costPrice: 11500,
    unitOfSale: "piece",
    dimensions: "2279 x 1134 x 35 mm",
    weightKg: 28.5,
    images: ["/images/categories/cat-solar-energy.jpg", "/images/categories/cat-solar-energy.jpg"],
    stockQuantity: 45,
    lowStockThreshold: 5,
    tags: ["25_YEAR_WARRANTY", "HALF_CUT_CELL"],
    customBadgeText: "21.3% Module Efficiency",
    badgeColor: "ORANGE",
    shippingMode: "heavy_bulky",
    returnPolicyDays: 7,
  },
];

async function runBenchmark() {
  console.log("=== STARTING 20-CATEGORY END-TO-END DEMO ITEM BENCHMARK ===");

  // 1. Get or create a designated benchmark Vendor
  let vendor = await prisma.vendor.findFirst();

  if (!vendor) {
    console.log("No vendor found. Creating benchmark vendor...");
    vendor = await prisma.vendor.create({
      data: {
        businessName: "IntriHub Direct Supply Hub",
        slug: "intrihub-direct-supply-hub",
        contactPerson: "Warehouse Ops",
        phone: "9876543210",
        email: "direct-hub@intrihub.com",
        status: "ACTIVE",
        verificationStatus: "VERIFIED",
        businessType: "MANUFACTURER",
        isOnline: true,
        autoAcceptOrders: true,
      },
    });
  }

  console.log(`Using Benchmark Vendor: ${vendor.businessName} (ID: ${vendor.id})`);

  const results: DemoItemBenchmark[] = [];

  for (const item of DEMO_ITEMS_SPECS) {
    const profitAmount = item.sellingPrice - item.costPrice;
    const profitMarginPercent = Number(((profitAmount / item.sellingPrice) * 100).toFixed(2));
    const customerDiscountPercent = Math.round(((item.mrp - item.sellingPrice) / item.mrp) * 100);

    const t0 = performance.now();
    try {
      // Find category by slug or aliases
      let category = await prisma.category.findUnique({
        where: { slug: item.categorySlug },
      });

      if (!category) {
        // Fallback search by name
        category = await prisma.category.findFirst({
          where: { name: { contains: item.categoryName.split("&")[0].trim(), mode: "insensitive" } },
        });
      }

      // If category missing, create on the fly
      if (!category) {
        category = await prisma.category.create({
          data: {
            name: item.categoryName,
            slug: item.categorySlug,
            description: `Master catalog for ${item.categoryName}`,
            image: item.images[0] || "/placeholders/category.svg",
            order: item.index,
          },
        });
      }

      // Auto-slug collision check
      const baseSlug = safeSlugify(item.title) || `item-${Date.now().toString(36)}`;
      let slug = baseSlug;
      const existingProduct = await prisma.product.findUnique({
        where: { slug },
        select: { id: true },
      });

      if (existingProduct) {
        slug = `${baseSlug}-${item.index}`;
      }

      // Create / Upsert Product
      const createdProduct = await prisma.product.upsert({
        where: { slug },
        update: {
          name: item.title,
          categorySlug: category.slug,
          categoryName: category.name,
          subcategory: item.subCategory,
          brand: item.title.split(" ")[0],
          sku: item.sku,
          unitOfSale: item.unitOfSale,
          weightKg: item.weightKg,
          isBulky: item.shippingMode === "heavy_bulky",
          mrp: item.mrp,
          pricePerSqft: item.sellingPrice,
          inStock: item.stockQuantity > 0,
          images: item.images,
          specs: {
            dimensions: item.dimensions,
            tags: item.tags,
            customBadgeText: item.customBadgeText,
            badgeColor: item.badgeColor,
            showAutoDiscount: true,
            costPrice: item.costPrice,
            profitMarginPercent,
          },
          shippingMode: item.shippingMode,
          returnPolicyDays: item.returnPolicyDays,
          vendorId: vendor.id,
          status: "active",
          approvalStatus: "approved",
        },
        create: {
          name: item.title,
          slug,
          categoryId: category.id,
          categorySlug: category.slug,
          categoryName: category.name,
          subcategory: item.subCategory,
          brand: item.title.split(" ")[0],
          sku: item.sku,
          unitOfSale: item.unitOfSale,
          weightKg: item.weightKg,
          isBulky: item.shippingMode === "heavy_bulky",
          mrp: item.mrp,
          pricePerSqft: item.sellingPrice,
          inStock: item.stockQuantity > 0,
          images: item.images,
          description: `Official ${item.title} manufactured for architectural, structural, and interior standards. High durability, verified quality benchmark.`,
          specs: {
            dimensions: item.dimensions,
            tags: item.tags,
            customBadgeText: item.customBadgeText,
            badgeColor: item.badgeColor,
            showAutoDiscount: true,
            costPrice: item.costPrice,
            profitMarginPercent,
          },
          shippingMode: item.shippingMode,
          returnPolicyDays: item.returnPolicyDays,
          vendorId: vendor.id,
          status: "active",
          approvalStatus: "approved",
          variants: {
            create: [
              {
                sku: item.sku,
                variantName: "Standard",
                size: item.dimensions,
                mrp: item.mrp,
                price: item.sellingPrice,
                pricePerBox: item.sellingPrice,
                stockBoxes: item.stockQuantity,
                lowStockAlert: item.lowStockThreshold,
                images: item.images,
                image: item.images[0],
                variantSpecs: {
                  costPrice: item.costPrice,
                  profitMarginPercent,
                  customBadgeText: item.customBadgeText,
                  badgeColor: item.badgeColor,
                  tags: item.tags,
                  showAutoDiscount: true,
                },
              },
            ],
          },
        },
      });

      const t1 = performance.now();
      const latencyMs = Math.round(t1 - t0);

      results.push({
        ...item,
        profitMarginPercent,
        customerDiscountPercent,
        status: "SUCCESS",
        latencyMs,
      });

      console.log(`[PASS] #${item.index} ${item.categoryName}: "${item.title}" in ${latencyMs}ms`);
    } catch (err: any) {
      const t1 = performance.now();
      results.push({
        ...item,
        profitMarginPercent,
        customerDiscountPercent,
        status: "FAIL",
        latencyMs: Math.round(t1 - t0),
        error: err?.message,
      });
      console.error(`[FAIL] #${item.index} ${item.categoryName}: ${err?.message}`);
    }
  }

  console.log("\n=== 20-CATEGORY EXECUTION SUMMARY ===");
  const successCount = results.filter((r) => r.status === "SUCCESS").length;
  const avgLatency = Math.round(results.reduce((a, b) => a + b.latencyMs, 0) / results.length);
  console.log(`Total Categories Processed: ${results.length}`);
  console.log(`Successful Uploads: ${successCount} / ${results.length}`);
  console.log(`Average Upload Latency: ${avgLatency} ms`);
  console.log(JSON.stringify(results, null, 2));
}

runBenchmark()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
