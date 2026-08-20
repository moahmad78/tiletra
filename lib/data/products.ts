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
