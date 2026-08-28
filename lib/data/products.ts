export type Finish = "Matte" | "Glossy" | "Textured" | "Satin" | "Polished" | string;
export type Material = "Ceramic" | "Vitrified" | "Porcelain" | "Natural Stone" | "Mosaic" | "Wood" | "Metal" | "Brass" | "PVC" | "CPVC" | "Vinyl" | "Composite" | "Other" | string;

export type UnitOfSale = "box" | "sqft" | "piece" | "meter" | "coil" | "kg" | "pack" | "roll" | "litre" | "liter" | "can" | "bottle" | "set" | "sheet" | "slab" | "bucket" | "drum" | "tube" | "packet" | "carton" | "dozen" | "ton" | string;

export type PriceTier = {
  id?: string;
  minQuantity: number;
  maxQuantity?: number | null;
  price: number;
  customerType?: string;
};

export type ProductAttribute = {
  id?: string;
  key: string;
  value: string;
};

export type ProductVariant = {
  id: string;
  sku?: string | null;
  size: string; // e.g. "600x600mm", "4L", "19mm x 4x8ft", "Standard"
  finish: Finish | string;
  color: string; // e.g. "Grey", "Alaska White"
  colorHex?: string | null; // e.g. "#808080"
  swatchImage?: string | null;
  image?: string | null;
  unit?: string | null;
  attributeLabel?: string | null; // e.g. "Volume", "Dimension", "Color", "Size"
  attributeValue?: string | null; // e.g. "4L", "19mm x 4x8ft", "Ivory White"
  variantSpecs?: any;
  weightKg?: number | null; // in kg (e.g. 2.5, 18, 4)
  mrp?: number | null; // List price / MRP in INR
  pricePerBox: number; // in INR (price for selling unit / pack / box / can / sheet)
  pricePerSqft: number; // base / equivalent unit price
  sqftPerBox: number; // conversion factor / coverage
  piecesPerBox?: number;
  stockBoxes: number;
  inStock?: boolean;
  priceTiers?: PriceTier[];
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  brand?: string;
  modelNumber?: string | null;
  sku?: string | null;
  categorySlug: string;
  categoryName: string;
  subcategory?: string;
  description: string;
  shortDescription?: string | null;
  material: Material;
  images: string[];
  videos?: string[];
  unitOfSale?: UnitOfSale;
  sellingUnit?: UnitOfSale;
  baseUnit?: string | null;
  conversionRatio?: number | null;
  piecesPerUnit?: number | null;
  lengthPerUnit?: number | null;
  weightKg?: number | null;
  minOrderQuantity?: number;
  maxOrderQuantity?: number | null;
  incrementQuantity?: number;
  allowDecimals?: boolean;
  decimalPrecision?: number;
  mrp?: number | null; // Product level MRP
  pricePerSqft?: number; // Base / equivalent unit price
  grade?: string | null;
  series?: string | null;
  warranty?: string | null;
  hsnCode?: string | null;
  gstPercent?: number;
  attributes?: ProductAttribute[];
  variants: ProductVariant[];
  priceTiers?: PriceTier[];
  rating: number;
  reviewCount: number;
  manualRating?: number | null;
  manualReviewCount?: number | null;
  isBestseller: boolean;
  isNew: boolean;
  isTrending?: boolean;
  inStock?: boolean;
  tags?: string[];
  vendorId?: string | null;
  vendorName?: string | null;
  vendorCommissionRate?: number | null;
  vendor?: {
    id: string;
    businessName: string;
    status: string;
  };
  status?: "active" | "paused" | "draft" | "archived";
  approvalStatus?: "pending" | "approved" | "rejected";
  rejectionReason?: string | null;
  coverageRate?: number | null;
  wastageFactor?: number | null;
  size?: string;
  finish?: string;
  look?: string;
  thickness?: string;
  usage?: string;
  specs?: {
    waterAbsorption?: string;
    slipResistance?: string;
    thickness?: string;
    surfaceFinish?: string;
    breakingStrength?: string;
    frostResistance?: string;
    [key: string]: string | undefined;
  };
};

// Clean platform slate — 0 static mock products
export const products: Product[] = [];

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
  if (!product?.variants || product.variants.length === 0) return (product as any)?.pricePerSqft || 0;
  return Math.min(...product.variants.map((v) => v.pricePerSqft));
}

export function getLowestBoxPrice(product: Product): number {
  if (!product?.variants || product.variants.length === 0) return 0;
  return Math.min(...product.variants.map((v) => v.pricePerBox));
}

export function getDefaultVariant(product: Product): ProductVariant | undefined {
  return product?.variants?.[0];
}
