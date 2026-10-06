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
  const activeVariants = (product?.variants || []).filter((vr) => vr.active !== false);
  const isMultiVariant = Boolean(product?.hasVariants) || activeVariants.length > 1;
  const variantPrices = activeVariants
    .map((vr) => Number(vr.price || vr.pricePerBox || 0))
    .filter((p) => p > 0);
  const minPrice = variantPrices.length > 0 ? Math.min(...variantPrices) : null;
  const maxPrice = variantPrices.length > 0 ? Math.max(...variantPrices) : null;

  const v = variant || (activeVariants.length > 0 ? activeVariants[0] : null);
  const basePrice =
    (v?.price !== undefined && v?.price !== null && Number(v.price) > 0 ? Number(v.price) : null) ||
    v?.pricePerBox ||
    v?.pricePerSqft ||
    (product as any)?.price ||
    (product as any)?.pricePerSqft ||
    499;

  const price = (!variant && isMultiVariant && minPrice) ? minPrice : basePrice;

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

  const formattedPrice =
    !variant && isMultiVariant && minPrice
      ? `From ${formatPrice(minPrice)}`
      : formatPrice(price);

  return {
    price,
    mrp,
    minPrice,
    maxPrice,
    isMultiVariant,
    discountPercent,
    unitSuffix,
    formattedPrice,
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
    variantName: v.variantName || null,
    size: v.size || "Standard",
    finish: (v.finish as Finish) || "Glossy",
    color: v.color || "Standard",
    colorHex: v.colorHex || null,
    swatchImage: v.swatchImage || null,
    image: v.image || (Array.isArray(v.images) && v.images.length > 0 ? v.images[0] : null),
    images: Array.isArray(v.images) && v.images.length > 0 ? v.images : (v.image ? [v.image] : []),
    unit: v.unit || null,
    attributeLabel: v.attributeLabel || null,
    attributeValue: v.attributeValue || null,
    attributes: v.attributes || null,
    variantSpecs: v.variantSpecs || null,
    weightKg: v.weightKg ? Number(v.weightKg) : null,
    mrp: v.mrp ? Number(v.mrp) : null,
    price: v.price !== null && v.price !== undefined ? Number(v.price) : Number(v.pricePerBox || 0),
    pricePerBox: Number(v.pricePerBox || v.price || 0),
    pricePerSqft: Number(v.pricePerSqft || 0),
    sqftPerBox: Number(v.sqftPerBox || 1),
    piecesPerBox: v.piecesPerBox ? Number(v.piecesPerBox) : 4,
    stockBoxes: Number(v.stockBoxes ?? 50),
    inStock: v.inStock ?? true,
    active: v.active !== undefined ? Boolean(v.active) : true,
    lowStockAlert: v.lowStockAlert !== undefined && v.lowStockAlert !== null ? Number(v.lowStockAlert) : 10,
    minOrderQuantity: v.minOrderQuantity !== undefined && v.minOrderQuantity !== null ? Number(v.minOrderQuantity) : 1,
    maxOrderQuantity: v.maxOrderQuantity !== undefined && v.maxOrderQuantity !== null ? Number(v.maxOrderQuantity) : null,
    isDefault: Boolean(v.isDefault),
    barcode: v.barcode || null,
    priceTiers: v.priceTiers || [],
  }));

  // Fallback variant if none exists
  if (variants.length === 0) {
    const pSqft = Number(dbProduct.pricePerSqft || 45);
    variants.push({
      id: `${dbProduct.id}-var-default`,
      variantName: "Standard",
      size: dbProduct.size || "Standard",
      finish: (dbProduct.finish as Finish) || "Glossy",
      color: "Standard",
      price: pSqft * 40,
      pricePerBox: pSqft * 40,
      pricePerSqft: pSqft,
      sqftPerBox: dbProduct.unitOfSale === "sqft" || dbProduct.unitOfSale === "box" ? 16 : 1,
      stockBoxes: dbProduct.inStock ? 50 : 0,
      inStock: dbProduct.inStock ?? true,
      active: true,
      isDefault: true,
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
    brand: dbProduct.brand || "Intrihub",
    sku: dbProduct.sku || null,
    categorySlug: dbProduct.categorySlug,
    categoryName: dbProduct.categoryName,
    description: dbProduct.description || "",
    material: (dbProduct.material as Material) || "Vitrified",
    unitOfSale: (dbProduct.unitOfSale as any) || "box",
    hasVariants: Boolean(dbProduct.hasVariants),
    gstRate: dbProduct.gstRate !== undefined && dbProduct.gstRate !== null ? Number(dbProduct.gstRate) : (dbProduct.gstPercent ? Number(dbProduct.gstPercent) : 18),
    mrp: dbProduct.mrp ? Number(dbProduct.mrp) : null,
    pricePerSqft: dbProduct.pricePerSqft ? Number(dbProduct.pricePerSqft) : undefined,
    attributes,
    images: Array.isArray(dbProduct.images) && dbProduct.images.length > 0 && dbProduct.images[0] && dbProduct.images[0] !== "/placeholders/product.svg"
      ? dbProduct.images.filter((img: string) => typeof img === "string" && img.trim() !== "")
      : dbProduct.variants?.[0]?.image
      ? [dbProduct.variants[0].image]
      : ["/images/placeholder-product.svg"],
    variants,
    rating: dbProduct.manualRating !== null && dbProduct.manualRating !== undefined
      ? Number(dbProduct.manualRating)
      : Number(dbProduct.avgRating || 0),
    reviewCount: dbProduct.manualReviewCount !== null && dbProduct.manualReviewCount !== undefined
      ? Number(dbProduct.manualReviewCount)
      : Number(dbProduct.reviewCount || 0),
    avgRating: Number(dbProduct.avgRating || dbProduct.manualRating || 0),
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
    createdByAdminId: dbProduct.createdByAdminId || null,
    updatedByAdminId: dbProduct.updatedByAdminId || null,
    createdByCpoId: dbProduct.createdByCpoId || null,
    updatedByCpoId: dbProduct.updatedByCpoId || null,
    actorRole: dbProduct.actorRole || null,
    coverageRate: dbProduct.coverageRate !== undefined && dbProduct.coverageRate !== null ? Number(dbProduct.coverageRate) : null,
    piecesPerBox: dbProduct.piecesPerBox !== undefined && dbProduct.piecesPerBox !== null ? Number(dbProduct.piecesPerBox) : null,
    wastageFactor: dbProduct.wastageFactor !== undefined && dbProduct.wastageFactor !== null ? Number(dbProduct.wastageFactor) : 1.1,
    specs,
    dimensions: dbProduct.dimensions || null,
    inTheBox: dbProduct.inTheBox || null,
    manufactureDate: dbProduct.manufactureDate || null,
    expiryDate: dbProduct.expiryDate || null,
    shippingMode: dbProduct.shippingMode || "standard",
    dispatchTimeDays: dbProduct.dispatchTimeDays ?? 2,
    pincodesServed: Array.isArray(dbProduct.pincodesServed) ? dbProduct.pincodesServed : [],
    freeDeliveryAbove: dbProduct.freeDeliveryAbove !== null && dbProduct.freeDeliveryAbove !== undefined ? Number(dbProduct.freeDeliveryAbove) : null,
    deliveryCharge: dbProduct.deliveryCharge !== null && dbProduct.deliveryCharge !== undefined ? Number(dbProduct.deliveryCharge) : null,
    allowScheduledDelivery: dbProduct.allowScheduledDelivery ?? true,
    allowCod: dbProduct.allowCod ?? true,
    isFragile: Boolean(dbProduct.isFragile),
    isPerishable: Boolean(dbProduct.isPerishable),
    returnPolicyDays: dbProduct.returnPolicyDays ?? 7,
    replacementAllowed: dbProduct.replacementAllowed ?? true,
    warrantyType: dbProduct.warrantyType || "brand",
    warrantyDuration: dbProduct.warrantyDuration || "1 Year",
    returnConditions: dbProduct.returnConditions || null,
    complianceDeclarations: dbProduct.complianceDeclarations || null,
    certificates: Array.isArray(dbProduct.certificates) ? dbProduct.certificates : [],
    vendorDeclaration: dbProduct.vendorDeclaration ?? true,
    countryOfOrigin: dbProduct.countryOfOrigin || "India",
    condition: dbProduct.condition || "New",
    highlights: Array.isArray(dbProduct.highlights) ? dbProduct.highlights : [],
    keywords: Array.isArray(dbProduct.keywords) ? dbProduct.keywords : [],
    metaTitle: dbProduct.metaTitle || null,
    metaDescription: dbProduct.metaDescription || null,
    isFeatured: Boolean(dbProduct.isFeatured),
    scheduledPublishDate: dbProduct.scheduledPublishDate || null,
  };
}
