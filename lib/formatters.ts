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

export function getPriceUnitSuffix(
  product?: { unitOfSale?: string | null; categorySlug?: string | null; categoryName?: string | null } | null
): string {
  if (!product) return "";
  const unit = (product.unitOfSale || "").toLowerCase().trim();
  const catSlug = (product.categorySlug || "").toLowerCase().trim();
  const catName = (product.categoryName || "").toLowerCase().trim();

  // 1. Granite products -> "sqft"
  if (
    unit === "sqft" ||
    unit === "sq.ft" ||
    unit === "sq_ft" ||
    catSlug === "granite" ||
    catSlug.includes("granite") ||
    catName.includes("granite")
  ) {
    return "sqft";
  }

  // 2. Tiles & Stone products -> "box"
  if (
    unit === "box" ||
    catSlug === "tiles-stone" ||
    catSlug === "tiles" ||
    catSlug.includes("tile") ||
    catName.includes("tile")
  ) {
    return "box";
  }

  // 3. All other categories -> no unit text appears
  return "";
}

export function getProductPriceInfo(product: Product, variant?: ProductVariant | null) {
  const v = variant || (product?.variants && product.variants.length > 0 ? product.variants[0] : null);
  const price =
    v?.pricePerBox ||
    v?.pricePerSqft ||
    (product as any)?.price ||
    (product as any)?.pricePerSqft ||
    499;

  const existingMrp =
    (v as any)?.mrp ??
    (v as any)?.originalPrice ??
    product?.mrp ??
    (product as any)?.originalPrice ??
    null;

  let mrp: number | null = null;
  if (existingMrp !== null && Number(existingMrp) > price) {
    mrp = Number(existingMrp);
  } else if (existingMrp === null || existingMrp === undefined || Number(existingMrp) <= price) {
    // Default retail benchmark MRP (+30% rounded) so strikethrough price is always present
    mrp = Math.round(price * 1.3);
  }

  const hasDiscount = mrp !== null && mrp > price;
  const discountPercent = hasDiscount && mrp ? Math.round(((mrp - price) / mrp) * 100) : 0;
  const unitSuffix = getPriceUnitSuffix(product);

  return {
    price,
    mrp,
    discountPercent,
    unitSuffix,
    formattedPrice: formatPrice(price),
    formattedMrp: mrp ? formatPrice(mrp) : null,
  };
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

export function formatProduct(dbProduct: any): Product {
  const variants: ProductVariant[] = (dbProduct.variants || []).map((v: any) => ({
    id: v.id,
    sku: v.sku || null,
    size: v.size,
    finish: (v.finish as Finish) || "Glossy",
    color: v.color || "Standard",
    colorHex: v.colorHex || null,
    swatchImage: v.swatchImage || null,
    image: v.image || null,
    unit: v.unit || null,
    attributeLabel: v.attributeLabel || null,
    attributeValue: v.attributeValue || null,
    variantSpecs: v.variantSpecs || null,
    weightKg: v.weightKg ? Number(v.weightKg) : null,
    mrp: v.mrp ? Number(v.mrp) : null,
    pricePerBox: Number(v.pricePerBox),
    pricePerSqft: Number(v.pricePerSqft),
    sqftPerBox: Number(v.sqftPerBox),
    piecesPerBox: v.piecesPerBox ? Number(v.piecesPerBox) : 4,
    stockBoxes: Number(v.stockBoxes ?? 50),
    inStock: v.inStock ?? true,
    priceTiers: v.priceTiers || [],
  }));

  // Fallback variant if none exists
  if (variants.length === 0) {
    const pSqft = Number(dbProduct.pricePerSqft || 45);
    variants.push({
      id: `${dbProduct.id}-var-default`,
      size: dbProduct.size || "Standard",
      finish: (dbProduct.finish as Finish) || "Glossy",
      color: "Standard",
      pricePerBox: pSqft * 40,
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
    mrp: dbProduct.mrp ? Number(dbProduct.mrp) : null,
    pricePerSqft: dbProduct.pricePerSqft ? Number(dbProduct.pricePerSqft) : undefined,
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
