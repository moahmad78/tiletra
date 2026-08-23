import type { Product, ProductVariant, Material, Finish } from "@/lib/data/products";

export async function safeRevalidate(path: string) {
  try {
    if (typeof window === "undefined") {
      const { revalidatePath } = await import("next/cache");
      revalidatePath(path);
    }
  } catch {
    // Graceful no-op when called outside Next.js request context
  }
}

export function formatPrice(n: number | string): string {
  const num = typeof n === "number" ? n : Number(n) || 0;
  return "₹" + num.toLocaleString("en-IN");
}

export function formatUnitLabel(unitOfSale?: string | null): string {
  if (!unitOfSale) return "/sq.ft";
  const u = unitOfSale.toLowerCase().trim();
  switch (u) {
    case "sqft":
    case "sq.ft":
    case "sq_ft":
      return "/sq.ft";
    case "box":
      return "/box";
    case "piece":
    case "pc":
      return "/piece";
    case "meter":
    case "m":
    case "metre":
      return "/meter";
    case "coil":
      return "/coil";
    case "kg":
      return "/kg";
    case "pack":
      return "/pack";
    case "roll":
      return "/roll";
    case "litre":
    case "liter":
    case "l":
      return "/litre";
    case "can":
      return "/can";
    case "bottle":
      return "/bottle";
    case "set":
      return "/set";
    case "sheet":
      return "/sheet";
    default:
      return `/${unitOfSale}`;
  }
}

export function formatUnitName(unitOfSale?: string | null): string {
  if (!unitOfSale) return "sq.ft";
  const u = unitOfSale.toLowerCase().trim();
  switch (u) {
    case "sqft":
    case "sq.ft":
    case "sq_ft":
      return "sq.ft";
    case "box":
      return "box";
    case "piece":
    case "pc":
      return "piece";
    case "meter":
    case "m":
      return "meter";
    case "coil":
      return "coil";
    case "kg":
      return "kg";
    case "pack":
      return "pack";
    case "roll":
      return "roll";
    case "litre":
    case "liter":
    case "l":
      return "litre";
    case "can":
      return "can";
    case "bottle":
      return "bottle";
    case "set":
      return "set";
    case "sheet":
      return "sheet";
    default:
      return unitOfSale;
  }
}

// Helper to convert Prisma product with variants to UI Product type
export function formatProduct(dbProduct: any): Product {
  const variants: ProductVariant[] = (dbProduct.variants || []).map((v: any) => ({
    id: v.id,
    size: v.size,
    finish: (v.finish as Finish) || "Glossy",
    color: v.color || "Standard",
    image: v.image || null,
    unit: v.unit || null,
    attributeLabel: v.attributeLabel || null,
    attributeValue: v.attributeValue || null,
    pricePerBox: Number(v.pricePerBox),
    pricePerSqft: Number(v.pricePerSqft),
    sqftPerBox: Number(v.sqftPerBox),
    piecesPerBox: v.piecesPerBox ? Number(v.piecesPerBox) : 4,
    stockBoxes: Number(v.stockBoxes ?? 50),
    inStock: v.inStock ?? true,
  }));

  // Fallback variant if none exists
  if (variants.length === 0) {
    const pSqft = Number(dbProduct.pricePerSqft || 45);
    variants.push({
      id: `${dbProduct.id}-var-default`,
      size: dbProduct.size || "Standard",
      finish: (dbProduct.finish as Finish) || "Glossy",
      color: "Standard",
      image: null,
      unit: dbProduct.unitOfSale || "box",
      attributeLabel: null,
      attributeValue: null,
      pricePerBox: Math.round(pSqft * (dbProduct.unitOfSale === "sqft" || dbProduct.unitOfSale === "box" ? 16 : 1)),
      pricePerSqft: pSqft,
      sqftPerBox: dbProduct.unitOfSale === "sqft" || dbProduct.unitOfSale === "box" ? 16 : 1,
      stockBoxes: dbProduct.inStock ? 50 : 0,
      inStock: dbProduct.inStock ?? true,
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
      ? dbProduct.images.map((img: string) => (typeof img === "string" && img.includes("unsplash.com") ? "/placeholders/product.svg" : img))
      : ["/placeholders/product.svg"],
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
    vendorId: dbProduct.vendorId || null,
    vendorName: dbProduct.vendor?.businessName || null,
    vendorCommissionRate: dbProduct.vendor?.commissionRate !== undefined ? Number(dbProduct.vendor.commissionRate) : 15.0,
    status: dbProduct.status || "active",
    approvalStatus: dbProduct.approvalStatus || "approved",
    rejectionReason: dbProduct.rejectionReason || null,
    coverageRate: dbProduct.coverageRate !== undefined && dbProduct.coverageRate !== null ? Number(dbProduct.coverageRate) : null,
    wastageFactor: dbProduct.wastageFactor !== undefined && dbProduct.wastageFactor !== null ? Number(dbProduct.wastageFactor) : 1.1,
    specs,
  };
}
