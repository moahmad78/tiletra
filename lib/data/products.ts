export type Finish = "Matte" | "Glossy" | "Textured" | "Satin" | "Polished";
export type Material = "Ceramic" | "Vitrified" | "Porcelain" | "Natural Stone" | "Mosaic" | "Wood" | "Metal" | "Brass" | "PVC" | "CPVC" | "Vinyl" | "Composite" | "Other";

export type UnitOfSale = "box" | "sqft" | "piece" | "meter" | "coil" | "kg" | "pack" | "roll";

export type ProductAttribute = {
  id?: string;
  key: string;
  value: string;
};

export type ProductVariant = {
  id: string;
  size: string; // e.g. "600x600mm"
  finish: Finish;
  color: string;
  pricePerBox: number; // in INR
  pricePerSqft: number;
  sqftPerBox: number;
  stockBoxes: number;
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  categorySlug: string;
  categoryName: string;
  description: string;
  material: Material;
  images: string[];
  unitOfSale?: UnitOfSale;
  attributes?: ProductAttribute[];
  variants: ProductVariant[];
  rating: number;
  reviewCount: number;
  manualRating?: number | null;
  manualReviewCount?: number | null;
  isBestseller: boolean;
  isNew: boolean;
  tags: string[];
  vendorId?: string | null;
  vendorName?: string | null;
  vendorCommissionRate?: number | null;
  status?: "active" | "paused" | "draft";
  approvalStatus?: "pending" | "approved" | "rejected";
  rejectionReason?: string | null;
  specs: {
    waterAbsorption?: string;
    slipResistance?: string;
    thickness?: string;
    surfaceFinish?: string;
    breakingStrength?: string;
    frostResistance?: string;
    [key: string]: string | undefined;
  };
};

export const products: Product[] = [
  // ── FLOOR TILES ──────────────────────────────────────────────────
  {
    id: "prod-001",
    name: "Calacatta Marble Effect",
    slug: "calacatta-marble-effect-floor",
    categorySlug: "floor-tiles",
    categoryName: "Floor Tiles",
    description:
      "Inspired by the iconic Calacatta marble from Italy, these large-format tiles bring unmatched luxury to living rooms and master bedrooms. The subtle grey veining on a crisp white base creates a timeless, premium aesthetic.",
    material: "Vitrified",
    images: [
      "/placeholders/product.svg",
      "/placeholders/product.svg",
    ],
    variants: [
      { id: "v-001-a", size: "800x800mm", finish: "Polished", color: "White", pricePerBox: 3200, pricePerSqft: 72, sqftPerBox: 44, stockBoxes: 120 },
      { id: "v-001-b", size: "600x600mm", finish: "Matte", color: "White", pricePerBox: 2400, pricePerSqft: 60, sqftPerBox: 40, stockBoxes: 85 },
    ],
    rating: 4.8,
    reviewCount: 124,
    isBestseller: true,
    isNew: false,
    tags: ["marble-look", "living-room", "luxury"],
    specs: {
      waterAbsorption: "< 0.5%",
      slipResistance: "R9",
      thickness: "9mm",
      surfaceFinish: "Polished / Matte",
      breakingStrength: "> 1300N",
      frostResistance: "Yes",
    },
  },
  {
    id: "prod-002",
    name: "Concrete Grey Industrial",
    slug: "concrete-grey-industrial-floor",
    categorySlug: "floor-tiles",
    categoryName: "Floor Tiles",
    description:
      "The raw, urban aesthetic of concrete — without the maintenance. Perfect for modern apartments, open-plan living areas, and studio spaces. Anti-slip textured surface for safe, everyday use.",
    material: "Vitrified",
    images: [
      "/placeholders/product.svg",
      "/placeholders/product.svg",
    ],
    variants: [
      { id: "v-002-a", size: "600x600mm", finish: "Matte", color: "Grey", pricePerBox: 1800, pricePerSqft: 45, sqftPerBox: 40, stockBoxes: 200 },
      { id: "v-002-b", size: "300x300mm", finish: "Textured", color: "Grey", pricePerBox: 1100, pricePerSqft: 38, sqftPerBox: 29, stockBoxes: 150 },
    ],
    rating: 4.6,
    reviewCount: 89,
    isBestseller: true,
    isNew: false,
    tags: ["concrete-look", "industrial", "modern"],
    specs: {
      waterAbsorption: "< 0.5%",
      slipResistance: "R10",
      thickness: "9mm",
      surfaceFinish: "Matte / Textured",
      breakingStrength: "> 1200N",
      frostResistance: "Yes",
    },
  },
  {
    id: "prod-003",
    name: "Sahara Beige Sandstone",
    slug: "sahara-beige-sandstone-floor",
    categorySlug: "floor-tiles",
    categoryName: "Floor Tiles",
    description:
      "Warm beige tones inspired by sandstone deserts. Creates a cozy, earthy atmosphere in bedrooms, living areas, and corridors. Versatile enough to pair with both modern and traditional décor.",
    material: "Ceramic",
    images: [
      "/placeholders/product.svg",
      "/placeholders/product.svg",
    ],
    variants: [
      { id: "v-003-a", size: "600x600mm", finish: "Matte", color: "Beige", pricePerBox: 1400, pricePerSqft: 35, sqftPerBox: 40, stockBoxes: 180 },
      { id: "v-003-b", size: "300x600mm", finish: "Satin", color: "Beige", pricePerBox: 1200, pricePerSqft: 32, sqftPerBox: 37, stockBoxes: 90 },
    ],
    rating: 4.4,
    reviewCount: 67,
    isBestseller: false,
    isNew: false,
    tags: ["beige", "earthy", "bedroom"],
    specs: {
      waterAbsorption: "< 3%",
      slipResistance: "R9",
      thickness: "8mm",
      surfaceFinish: "Matte / Satin",
      breakingStrength: "> 900N",
      frostResistance: "No",
    },
  },

  // ── WALL TILES ────────────────────────────────────────────────────
  {
    id: "prod-004",
    name: "Arctic White Subway",
    slug: "arctic-white-subway-wall",
    categorySlug: "wall-tiles",
    categoryName: "Wall Tiles",
    description:
      "The classic subway tile — reimagined in a crisp arctic white with a high-gloss finish. Timeless in kitchens, bathrooms, and feature walls. Easy to clean and pairs with any grout color.",
    material: "Ceramic",
    images: [
      "/placeholders/product.svg",
      "/placeholders/product.svg",
    ],
    variants: [
      { id: "v-004-a", size: "300x150mm", finish: "Glossy", color: "White", pricePerBox: 950, pricePerSqft: 28, sqftPerBox: 34, stockBoxes: 300 },
      { id: "v-004-b", size: "300x100mm", finish: "Glossy", color: "White", pricePerBox: 750, pricePerSqft: 24, sqftPerBox: 31, stockBoxes: 220 },
    ],
    rating: 4.9,
    reviewCount: 210,
    isBestseller: true,
    isNew: false,
    tags: ["subway", "white", "kitchen-backsplash", "classic"],
    specs: {
      waterAbsorption: "< 6%",
      slipResistance: "R9",
      thickness: "7mm",
      surfaceFinish: "Glossy",
      breakingStrength: "> 600N",
      frostResistance: "No",
    },
  },
  {
    id: "prod-005",
    name: "Sage Green Zellige",
    slug: "sage-green-zellige-wall",
    categorySlug: "wall-tiles",
    categoryName: "Wall Tiles",
    description:
      "Handcrafted zellige-inspired tiles in a soothing sage green. Each tile has subtle variation in tone and texture — making every installation unique. Perfect for bathroom feature walls and kitchen splashbacks.",
    material: "Ceramic",
    images: [
      "/placeholders/product.svg",
      "/placeholders/product.svg",
    ],
    variants: [
      { id: "v-005-a", size: "100x100mm", finish: "Glossy", color: "Sage Green", pricePerBox: 1650, pricePerSqft: 52, sqftPerBox: 31, stockBoxes: 80 },
    ],
    rating: 4.7,
    reviewCount: 45,
    isBestseller: false,
    isNew: true,
    tags: ["zellige", "green", "feature-wall", "artisan"],
    specs: {
      waterAbsorption: "< 6%",
      slipResistance: "R9",
      thickness: "7mm",
      surfaceFinish: "Glossy",
      breakingStrength: "> 600N",
      frostResistance: "No",
    },
  },

  // ── BATHROOM TILES ────────────────────────────────────────────────
  {
    id: "prod-006",
    name: "Onyx Black Marble",
    slug: "onyx-black-marble-bathroom",
    categorySlug: "bathroom-tiles",
    categoryName: "Bathroom Tiles",
    description:
      "Dramatic black with gold veining — for a luxury spa-like bathroom experience. The matte finish prevents water spots and fingerprints. Works beautifully on both floors and walls.",
    material: "Porcelain",
    images: [
      "/placeholders/product.svg",
      "/placeholders/product.svg",
    ],
    variants: [
      { id: "v-006-a", size: "600x600mm", finish: "Matte", color: "Black", pricePerBox: 3800, pricePerSqft: 95, sqftPerBox: 40, stockBoxes: 60 },
      { id: "v-006-b", size: "300x600mm", finish: "Matte", color: "Black", pricePerBox: 2800, pricePerSqft: 76, sqftPerBox: 37, stockBoxes: 45 },
    ],
    rating: 4.9,
    reviewCount: 78,
    isBestseller: true,
    isNew: false,
    tags: ["black", "luxury", "spa", "marble-look"],
    specs: {
      waterAbsorption: "< 0.5%",
      slipResistance: "R10",
      thickness: "10mm",
      surfaceFinish: "Matte",
      breakingStrength: "> 1500N",
      frostResistance: "Yes",
    },
  },
  {
    id: "prod-007",
    name: "Sea Blue Mosaic",
    slug: "sea-blue-mosaic-bathroom",
    categorySlug: "bathroom-tiles",
    categoryName: "Bathroom Tiles",
    description:
      "Bring the ocean into your bathroom with these luminous sea-blue mosaic tiles. Each sheet creates a shimmering, aquatic effect. Perfect for shower niches, feature walls, and pool surrounds.",
    material: "Mosaic",
    images: [
      "/placeholders/product.svg",
      "/placeholders/product.svg",
    ],
    variants: [
      { id: "v-007-a", size: "300x300mm (sheet)", finish: "Glossy", color: "Blue", pricePerBox: 2200, pricePerSqft: 68, sqftPerBox: 32, stockBoxes: 100 },
    ],
    rating: 4.6,
    reviewCount: 52,
    isBestseller: false,
    isNew: true,
    tags: ["mosaic", "blue", "ocean", "shower"],
    specs: {
      waterAbsorption: "< 3%",
      slipResistance: "R10",
      thickness: "4mm + mesh",
      surfaceFinish: "Glossy",
      breakingStrength: "> 400N",
      frostResistance: "No",
    },
  },

  // ── KITCHEN TILES ─────────────────────────────────────────────────
  {
    id: "prod-008",
    name: "Terracotta Hexagon",
    slug: "terracotta-hexagon-kitchen",
    categorySlug: "kitchen-tiles",
    categoryName: "Kitchen Tiles",
    description:
      "Warm, earthy terracotta hexagons for a boho-chic kitchen floor. The geometric shape creates visual interest while the matte finish hides everyday kitchen grime. Pairs beautifully with wood cabinets.",
    material: "Ceramic",
    images: [
      "/placeholders/product.svg",
      "/placeholders/product.svg",
    ],
    variants: [
      { id: "v-008-a", size: "200x175mm (hex)", finish: "Matte", color: "Terracotta", pricePerBox: 1900, pricePerSqft: 58, sqftPerBox: 33, stockBoxes: 120 },
    ],
    rating: 4.5,
    reviewCount: 63,
    isBestseller: false,
    isNew: false,
    tags: ["hexagon", "terracotta", "boho", "geometric"],
    specs: {
      waterAbsorption: "< 3%",
      slipResistance: "R10",
      thickness: "8mm",
      surfaceFinish: "Matte",
      breakingStrength: "> 800N",
      frostResistance: "No",
    },
  },
  {
    id: "prod-009",
    name: "White Metro Splashback",
    slug: "white-metro-splashback-kitchen",
    categorySlug: "kitchen-tiles",
    categoryName: "Kitchen Tiles",
    description:
      "A high-gloss white metro tile that's a kitchen design staple. Reflects light to make small kitchens feel bigger. Heat-resistant, grease-proof, and supremely easy to wipe clean.",
    material: "Ceramic",
    images: [
      "/placeholders/product.svg",
      "/placeholders/product.svg",
    ],
    variants: [
      { id: "v-009-a", size: "300x150mm", finish: "Glossy", color: "White", pricePerBox: 880, pricePerSqft: 26, sqftPerBox: 34, stockBoxes: 250 },
      { id: "v-009-b", size: "300x100mm", finish: "Glossy", color: "White", pricePerBox: 720, pricePerSqft: 23, sqftPerBox: 31, stockBoxes: 180 },
    ],
    rating: 4.8,
    reviewCount: 145,
    isBestseller: true,
    isNew: false,
    tags: ["white", "metro", "kitchen-backsplash", "glossy"],
    specs: {
      waterAbsorption: "< 6%",
      slipResistance: "R9",
      thickness: "7mm",
      surfaceFinish: "Glossy",
      breakingStrength: "> 600N",
      frostResistance: "No",
    },
  },

  // ── OUTDOOR TILES ─────────────────────────────────────────────────
  {
    id: "prod-010",
    name: "Slate Grey Porcelain Patio",
    slug: "slate-grey-porcelain-patio-outdoor",
    categorySlug: "outdoor-tiles",
    categoryName: "Outdoor Tiles",
    description:
      "Heavy-duty porcelain tiles engineered for Indian weather — UV-resistant, frost-proof (for hill homes), and deeply anti-slip. Ideal for terraces, driveways, and garden pathways.",
    material: "Porcelain",
    images: [
      "/placeholders/product.svg",
      "/placeholders/product.svg",
    ],
    variants: [
      { id: "v-010-a", size: "600x600mm", finish: "Textured", color: "Slate Grey", pricePerBox: 2100, pricePerSqft: 52, sqftPerBox: 40, stockBoxes: 160 },
      { id: "v-010-b", size: "400x400mm", finish: "Textured", color: "Slate Grey", pricePerBox: 1500, pricePerSqft: 44, sqftPerBox: 34, stockBoxes: 110 },
    ],
    rating: 4.7,
    reviewCount: 38,
    isBestseller: false,
    isNew: false,
    tags: ["outdoor", "patio", "anti-slip", "durable"],
    specs: {
      waterAbsorption: "< 0.5%",
      slipResistance: "R11",
      thickness: "12mm",
      surfaceFinish: "Textured",
      breakingStrength: "> 2000N",
      frostResistance: "Yes",
    },
  },

  // ── DESIGNER / DECORATIVE ─────────────────────────────────────────
  {
    id: "prod-011",
    name: "Arabesque Pattern Encaustic",
    slug: "arabesque-pattern-encaustic-designer",
    categorySlug: "designer-tiles",
    categoryName: "Designer Tiles",
    description:
      "Handcrafted encaustic cement tiles with intricate arabesque patterns. Each tile is unique — slight color variation adds to the artisanal charm. Makes a stunning entryway, bathroom floor, or feature wall.",
    material: "Mosaic",
    images: [
      "/placeholders/product.svg",
      "/placeholders/product.svg",
    ],
    variants: [
      { id: "v-011-a", size: "200x200mm", finish: "Matte", color: "Multi", pricePerBox: 4500, pricePerSqft: 138, sqftPerBox: 32, stockBoxes: 40 },
    ],
    rating: 4.9,
    reviewCount: 29,
    isBestseller: false,
    isNew: true,
    tags: ["arabesque", "encaustic", "artisan", "pattern"],
    specs: {
      waterAbsorption: "< 6%",
      slipResistance: "R9",
      thickness: "15mm",
      surfaceFinish: "Matte",
      breakingStrength: "> 700N",
      frostResistance: "No",
    },
  },
  {
    id: "prod-012",
    name: "Gold Leaf Art Deco",
    slug: "gold-leaf-art-deco-designer",
    categorySlug: "designer-tiles",
    categoryName: "Designer Tiles",
    description:
      "Opulent art deco tiles with genuine 24k gold leaf inlay. Create a show-stopping feature wall in your living room, hotel lobby, or powder room. Limited production run — every order is made to order.",
    material: "Ceramic",
    images: [
      "/placeholders/product.svg",
      "/placeholders/product.svg",
    ],
    variants: [
      { id: "v-012-a", size: "150x150mm", finish: "Glossy", color: "Gold", pricePerBox: 8500, pricePerSqft: 245, sqftPerBox: 34, stockBoxes: 20 },
    ],
    rating: 5.0,
    reviewCount: 12,
    isBestseller: false,
    isNew: true,
    tags: ["gold", "art-deco", "luxury", "feature-wall"],
    specs: {
      waterAbsorption: "< 6%",
      slipResistance: "R9",
      thickness: "8mm",
      surfaceFinish: "Glossy",
      breakingStrength: "> 600N",
      frostResistance: "No",
    },
  },
];

// ── Helpers ───────────────────────────────────────────────────────────

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}

export function getProductsByCategory(categorySlug: string): Product[] {
  return products.filter((p) => p.categorySlug === categorySlug);
}

export function getBestsellers(limit = 8): Product[] {
  return products.filter((p) => p.isBestseller).slice(0, limit);
}

export function getTrending(limit = 8): Product[] {
  return [...products].sort((a, b) => b.rating * b.reviewCount - a.rating * a.reviewCount).slice(0, limit);
}

export function getNewArrivals(limit = 8): Product[] {
  return products.filter((p) => p.isNew).slice(0, limit);
}

export function getLowestPrice(product: Product): number {
  return Math.min(...product.variants.map((v) => v.pricePerSqft));
}

export function getLowestBoxPrice(product: Product): number {
  return Math.min(...product.variants.map((v) => v.pricePerBox));
}

export function getDefaultVariant(product: Product): ProductVariant {
  return product.variants[0];
}
