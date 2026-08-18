import { revalidatePath } from "next/cache";
import type { Product, ProductVariant, Material, Finish } from "@/lib/data/products";

export function safeRevalidate(path: string) {
  try {
    revalidatePath(path);
  } catch {
    // Graceful no-op when called outside Next.js request/static generation store context (e.g. tests, scripts)
  }
}

// Helper to convert Prisma product with variants to UI Product type
export function formatProduct(dbProduct: any): Product {
  const variants: ProductVariant[] = (dbProduct.variants || []).map((v: any) => ({
    id: v.id,
    size: v.size,
    finish: (v.finish as Finish) || "Glossy",
    color: v.color || "Standard",
    pricePerBox: Number(v.pricePerBox),
    pricePerSqft: Number(v.pricePerSqft),
    sqftPerBox: Number(v.sqftPerBox),
    stockBoxes: Number(v.stockBoxes ?? 50),
  }));

  // Fallback variant if none exists
  if (variants.length === 0) {
    const pSqft = Number(dbProduct.pricePerSqft || 45);
    variants.push({
      id: `${dbProduct.id}-var-default`,
      size: dbProduct.size || "600x600mm",
      finish: (dbProduct.finish as Finish) || "Glossy",
      color: "Standard",
      pricePerBox: Math.round(pSqft * 16),
      pricePerSqft: pSqft,
      sqftPerBox: 16,
      stockBoxes: dbProduct.inStock ? 50 : 0,
    });
  }

  const defaultSpecs = {
    waterAbsorption: "< 0.05% (Impervious)",
    slipResistance: "R10 / Class B",
    thickness: dbProduct.thickness || "9mm",
    surfaceFinish: dbProduct.finish || "Glossy",
    breakingStrength: "≥ 1300 N",
    frostResistance: "Resistant",
  };

  const specs = dbProduct.specs && typeof dbProduct.specs === "object"
    ? { ...defaultSpecs, ...(dbProduct.specs as Record<string, any>) }
    : defaultSpecs;

  const attributes = (dbProduct.attributes || []).map((a: any) => ({
    id: a.id,
    key: a.key,
    value: a.value,
  }));

  return {
    id: dbProduct.id,
    name: dbProduct.name,
    slug: dbProduct.slug,
    categorySlug: dbProduct.categorySlug,
    categoryName: dbProduct.categoryName,
    description: dbProduct.description || "",
    material: (dbProduct.material as Material) || "Vitrified",
    unitOfSale: (dbProduct.unitOfSale as any) || "box",
    attributes,
    images: Array.isArray(dbProduct.images) && dbProduct.images.length > 0
      ? dbProduct.images
      : ["https://images.unsplash.com/photo-1615529182904-14819c35db37?w=800&q=80"],
    variants,
    rating: dbProduct.manualRating !== null && dbProduct.manualRating !== undefined
      ? Number(dbProduct.manualRating)
      : Number(dbProduct.rating || 4.8),
    reviewCount: dbProduct.manualReviewCount !== null && dbProduct.manualReviewCount !== undefined
      ? Number(dbProduct.manualReviewCount)
      : Number(dbProduct.reviewCount || 0),
    manualRating: dbProduct.manualRating !== null && dbProduct.manualRating !== undefined ? Number(dbProduct.manualRating) : null,
    manualReviewCount: dbProduct.manualReviewCount !== null && dbProduct.manualReviewCount !== undefined ? Number(dbProduct.manualReviewCount) : null,
    isBestseller: Boolean(dbProduct.isBestseller),
    isNew: Boolean(dbProduct.isNewArrival),
    tags: Array.isArray(dbProduct.tags) ? dbProduct.tags : [],
    specs,
  };
}
