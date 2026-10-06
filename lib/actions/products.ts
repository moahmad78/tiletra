"use server";

import { prisma } from "@/lib/prisma";
import type { Product } from "@/lib/data/products";
import { formatProduct, safeRevalidate } from "@/lib/formatters";
import { recordHardDeleteRedirect } from "@/lib/redirects";

export type CreateProductInput = {
  name: string;
  slug?: string;
  categoryId?: string | null;
  categorySlug: string;
  categoryName?: string;
  subcategory?: string | null;
  brand?: string | null;
  modelNumber?: string | null;
  sku?: string | null;
  material: string;
  description: string;
  shortDescription?: string | null;
  images: string[];
  videos?: string[];
  unitOfSale?: string;
  sellingUnit?: string;
  baseUnit?: string | null;
  conversionRatio?: number | null;
  piecesPerUnit?: number | null;
  lengthPerUnit?: number | null;
  weightKg?: number | null;
  isBulky?: boolean;
  minOrderQuantity?: number;
  maxOrderQuantity?: number | null;
  incrementQuantity?: number;
  allowDecimals?: boolean;
  decimalPrecision?: number;
  mrp?: number | null;
  grade?: string | null;
  series?: string | null;
  warranty?: string | null;
  countryOfOrigin?: string;
  hsnCode?: string | null;
  gstPercent?: number;
  hasVariants?: boolean;
  gstRate?: number | null;
  attributes?: { key: string; value: string }[];
  priceTiers?: { minQuantity: number; maxQuantity?: number | null; price: number; customerType?: string }[];
  variants: {
    sku?: string | null;
    variantName?: string | null;
    size?: string;
    finish?: any;
    color?: string;
    colorHex?: string | null;
    swatchImage?: string | null;
    image?: string | null;
    images?: string[];
    unit?: string | null;
    attributeLabel?: string | null;
    attributeValue?: string | null;
    attributes?: Record<string, any> | null;
    variantSpecs?: any;
    mrp?: number | null;
    weightKg?: number | null;
    price?: number | null;
    pricePerBox?: number;
    pricePerSqft?: number;
    sqftPerBox?: number;
    piecesPerBox?: number;
    stockBoxes?: number;
    active?: boolean;
    lowStockAlert?: number | null;
    minOrderQuantity?: number | null;
    maxOrderQuantity?: number | null;
    isDefault?: boolean;
    barcode?: string | null;
    salePrice?: number | null;
    saleStartDate?: string | Date | null;
    saleEndDate?: string | Date | null;
    allowBackorders?: boolean;
  }[];
  isBestseller?: boolean;
  isNew?: boolean;
  isTrending?: boolean;
  manualRating?: number | null;
  manualReviewCount?: number | null;
  specs?: any;
  vendorId?: string | null;
  status?: "active" | "paused" | "draft" | "archived";
  approvalStatus?: "pending" | "approved" | "rejected";
  rejectionReason?: string | null;
  coverageRate?: number | null;
  piecesPerBox?: number | null;
  wastageFactor?: number | null;
  createdByAdminId?: string | null;
  updatedByAdminId?: string | null;
  // Phase 2 Fields
  manufacturer?: string | null;
  condition?: "New" | "Refurbished" | "Used" | string | null;
  highlights?: string[];
  keywords?: string[];
  salePrice?: number | null;
  saleStartDate?: string | Date | null;
  saleEndDate?: string | Date | null;
  allowBackorders?: boolean;
  // Phase 4: Dimensions, Shipping, Returns & Compliance
  dimensions?: { lengthCm?: number; widthCm?: number; heightCm?: number; packedWeightKg?: number } | null;
  inTheBox?: string | null;
  manufactureDate?: string | Date | null;
  expiryDate?: string | Date | null;
  shippingMode?: string | null;
  dispatchTimeDays?: number | null;
  pincodesServed?: string[];
  freeDeliveryAbove?: number | null;
  deliveryCharge?: number | null;
  allowScheduledDelivery?: boolean;
  allowCod?: boolean;
  isFragile?: boolean;
  isPerishable?: boolean;
  returnPolicyDays?: number | null;
  replacementAllowed?: boolean;
  warrantyType?: string | null;
  warrantyDuration?: string | null;
  returnConditions?: string | null;
  complianceDeclarations?: Record<string, any> | null;
  certificates?: string[];
  vendorDeclaration?: boolean;
  // Phase 5: SEO, Scheduling & Featured
  metaTitle?: string | null;
  metaDescription?: string | null;
  isFeatured?: boolean;
  scheduledPublishDate?: string | Date | null;
};

import { products as defaultProducts } from "@/lib/data/products";

export async function getProducts(options?: {
  categorySlug?: string;
  isTrending?: boolean;
  isBestseller?: boolean;
  isNewArrival?: boolean;
  search?: string;
  limit?: number;
  skip?: number;
  offset?: number;
  inStockOnly?: boolean;
  vendorId?: string;
  status?: string;
  approvalStatus?: string;
  includeAllStatuses?: boolean;
}): Promise<Product[]> {
  try {
    const where: any = {};

    // For customer storefront, strictly enforce active & approved unless includeAllStatuses is true
    if (!options?.includeAllStatuses) {
      if (options?.status) {
        where.status = options.status;
      } else {
        where.status = "active";
      }

      if (options?.approvalStatus) {
        where.approvalStatus = options.approvalStatus;
      } else {
        where.approvalStatus = "approved";
      }
    } else {
      if (options?.status && options.status !== "all") {
        where.status = options.status;
      }
      if (options?.approvalStatus && options.approvalStatus !== "all") {
        where.approvalStatus = options.approvalStatus;
      }
    }

    if (options?.vendorId) {
      where.vendorId = options.vendorId;
    }

    if (options?.categorySlug && options.categorySlug !== "all") {
      const slug = options.categorySlug;
      // Find category and its nested children if any
      const cat = await prisma.category.findUnique({
        where: { slug },
        include: { children: true },
      });

      const matchingSlugs = cat
        ? [cat.slug, ...cat.children.map((c) => c.slug)]
        : [slug];

      where.OR = [
        { categorySlug: { in: matchingSlugs } },
        { category: { slug: { in: matchingSlugs } } },
        { category: { parent: { slug } } },
      ];
    }
    if (options?.isTrending) {
      where.isTrending = true;
    }
    if (options?.isBestseller) {
      where.isBestseller = true;
    }
    if (options?.isNewArrival) {
      where.isNewArrival = true;
    }
    if (options?.inStockOnly) {
      where.inStock = true;
    }
    if (options?.search) {
      const rawTerm = options.search.trim();
      const words = rawTerm.split(/\s+/).filter(Boolean);

      if (words.length > 0) {
        where.AND = [
          ...(where.AND || []),
          ...words.map((word) => ({
            OR: [
              { name: { contains: word, mode: "insensitive" } },
              { description: { contains: word, mode: "insensitive" } },
              { categoryName: { contains: word, mode: "insensitive" } },
              { categorySlug: { contains: word, mode: "insensitive" } },
              { subcategory: { contains: word, mode: "insensitive" } },
              { material: { contains: word, mode: "insensitive" } },
              { finish: { contains: word, mode: "insensitive" } },
              { size: { contains: word, mode: "insensitive" } },
              { look: { contains: word, mode: "insensitive" } },
              { usage: { contains: word, mode: "insensitive" } },
              {
                variants: {
                  some: {
                    OR: [
                      { finish: { contains: word, mode: "insensitive" } },
                      { size: { contains: word, mode: "insensitive" } },
                      { color: { contains: word, mode: "insensitive" } },
                    ],
                  },
                },
              },
              {
                attributes: {
                  some: {
                    OR: [
                      { key: { contains: word, mode: "insensitive" } },
                      { value: { contains: word, mode: "insensitive" } },
                    ],
                  },
                },
              },
            ],
          })),
        ];
      }
    }

    const dbProducts = await prisma.product.findMany({
      where,
      include: {
        variants: true,
        attributes: true,
        priceTiers: true,
        vendor: {
          select: {
            id: true,
            businessName: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: options?.limit,
      skip: options?.skip ?? options?.offset ?? undefined,
    });

    return dbProducts.map(formatProduct);
  } catch (error) {
    console.error("Error fetching products from DB, falling back to static products:", error);
  }

  // Fallback to static products dataset
  let result = [...defaultProducts];
  if (!options?.includeAllStatuses) {
    result = result.filter(
      (p) => (p.status || "active") === "active" && (p.approvalStatus || "approved") === "approved"
    );
  }
  if (options?.vendorId) {
    result = result.filter((p) => p.vendorId === options.vendorId);
  }
  if (options?.categorySlug && options.categorySlug !== "all") {
    result = result.filter(
      (p) =>
        p.categorySlug === options.categorySlug ||
        (options.categorySlug === "tiles-stone" &&
          ["floor-tiles", "wall-tiles", "bathroom-tiles", "kitchen-tiles", "outdoor-tiles", "designer-tiles", "granite"].includes(p.categorySlug))
    );
  }
  if (options?.isTrending) {
    result = result.filter((p) => p.tags?.includes("Trending") || p.isBestseller);
  }
  if (options?.isBestseller) {
    result = result.filter((p) => p.isBestseller);
  }
  if (options?.isNewArrival) {
    result = result.filter((p) => p.isNew);
  }
  if (options?.search) {
    const rawTerm = options.search.trim().toLowerCase();
    const words = rawTerm.split(/\s+/).filter(Boolean);
    result = result.filter((p) => {
      const searchTarget = [
        p.name,
        p.description,
        p.categoryName,
        p.categorySlug,
        p.material,
        ...(p.tags || []),
        ...(p.variants?.map((v) => `${v.finish} ${v.size} ${v.color}`) || []),
        ...(p.attributes?.map((a) => `${a.key} ${a.value}`) || []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return words.every((word) => searchTarget.includes(word));
    });
  }
  if (options?.skip || options?.offset) {
    const start = options.skip ?? options.offset ?? 0;
    result = result.slice(start);
  }
  if (options?.limit) {
    result = result.slice(0, options.limit);
  }

  return result;
}

export async function getProductBySlug(slug: string, options?: { includeAllStatuses?: boolean }): Promise<Product | null> {
  try {
    const dbProduct = await prisma.product.findUnique({
      where: { slug },
      include: {
        variants: true,
        attributes: true,
        priceTiers: true,
        vendor: {
          select: {
            id: true,
            businessName: true,
            status: true,
          },
        },
      },
    });

    if (dbProduct) {
      if (!options?.includeAllStatuses) {
        // Allow active, discontinued, and out_of_stock on direct URLs to avoid SEO 404s
        const isPubliclyViewable =
          dbProduct.approvalStatus === "approved" &&
          (dbProduct.status === "active" ||
            dbProduct.status === "discontinued" ||
            dbProduct.status === "out_of_stock" ||
            dbProduct.status === "archived");

        if (!isPubliclyViewable) {
          return null;
        }
      }
      return formatProduct(dbProduct);
    }
  } catch (error) {
    console.error(`Error fetching product by slug ${slug} from DB:`, error);
  }

  // Fallback to static catalog
  const staticProduct = defaultProducts.find((p) => p.slug === slug);
  return staticProduct || null;
}

export async function getProductById(id: string, options?: { includeAllStatuses?: boolean }): Promise<Product | null> {
  try {
    const dbProduct = await prisma.product.findUnique({
      where: { id },
      include: {
        variants: true,
        attributes: true,
        priceTiers: true,
        vendor: {
          select: {
            id: true,
            businessName: true,
            status: true,
          },
        },
      },
    });

    if (!dbProduct) return null;
    if (!options?.includeAllStatuses) {
      if (dbProduct.status !== "active" || dbProduct.approvalStatus !== "approved") {
        return null;
      }
    }
    return formatProduct(dbProduct);
  } catch (error) {
    console.error(`Error fetching product by id ${id}:`, error);
    return null;
  }
}

const productSectionCache = new Map<string, { data: Product[]; timestamp: number }>();
const PRODUCT_SECTION_CACHE_TTL = 1000 * 60 * 3; // 3 minutes

export async function invalidateHomepageProductsCache(): Promise<void> {
  productSectionCache.clear();
}

export async function getHomepageSections(): Promise<{
  trending: Product[];
  bestsellers: Product[];
  newArrivals: Product[];
}> {
  const cacheKey = "homepage-sections-v2";
  const cached = productSectionCache.get(cacheKey);
  const now = Date.now();
  if (cached && now - cached.timestamp < PRODUCT_SECTION_CACHE_TTL) {
    return cached.data as any;
  }

  // Fetch candidate products in ONE single optimized database roundtrip
  const allCandidates = await getProducts({ limit: 30 });

  const trending = allCandidates.filter((p) => p.isTrending || p.tags?.includes("Trending")).slice(0, 8);
  const bestsellers = allCandidates.filter((p) => p.isBestseller).slice(0, 8);
  const newArrivals = allCandidates.filter((p) => p.isNew || (p as any).isNewArrival).slice(0, 8);

  const fallback = allCandidates.slice(0, 8);

  const result = {
    trending: trending.length > 0 ? trending : fallback,
    bestsellers: bestsellers.length > 0 ? bestsellers : fallback,
    newArrivals: newArrivals.length > 0 ? newArrivals : fallback,
  };

  productSectionCache.set(cacheKey, { data: result as any, timestamp: now });
  return result;
}

export async function getTrendingProducts(limit = 8): Promise<Product[]> {
  const sections = await getHomepageSections();
  return sections.trending.slice(0, limit);
}

export async function getBestsellers(limit = 8): Promise<Product[]> {
  const sections = await getHomepageSections();
  return sections.bestsellers.slice(0, limit);
}

export const getBestsellerProducts = getBestsellers;

export async function getNewArrivals(limit = 8): Promise<Product[]> {
  const sections = await getHomepageSections();
  return sections.newArrivals.slice(0, limit);
}

export const getNewArrivalProducts = getNewArrivals;

export async function getRelatedProducts(productId: string, categorySlug: string, limit = 4): Promise<Product[]> {
  try {
    const dbProducts = await prisma.product.findMany({
      where: {
        categorySlug,
        id: { not: productId },
      },
      include: {
        variants: true,
        attributes: true,
      },
      take: limit,
    });

    return dbProducts.map(formatProduct);
  } catch (error) {
    console.error("Error fetching related products:", error);
    return [];
  }
}

export async function searchProducts(query: string): Promise<Product[]> {
  if (!query || query.trim() === "") return [];
  return getProducts({ search: query.trim(), limit: 10 });
}

// ---------------- Admin Mutations ----------------

export async function createProduct(input: CreateProductInput) {
  try {
    const { resolveVendorContext } = await import("@/lib/vendor-workspace-auth");
    const workspaceContext = await resolveVendorContext();
    if (!workspaceContext) {
      if (process.env.NODE_ENV === "test" || process.env.ALLOW_SYSTEM_MUTATIONS === "true") {
        input.approvalStatus = input.approvalStatus || "approved";
      } else {
        return { success: false, error: "Unauthorized: Active session required to create products." };
      }
    } else {
      input.vendorId = workspaceContext.vendorId;

      if (workspaceContext.actor.type === "ADMIN") {
        input.createdByAdminId = workspaceContext.actor.adminId;
        input.updatedByAdminId = workspaceContext.actor.adminId;
        input.approvalStatus = "approved";
      } else if (workspaceContext.actor.type === "CPO") {
        (input as any).createdByCpoId = workspaceContext.actor.cpoId;
        (input as any).updatedByCpoId = workspaceContext.actor.cpoId;
        input.approvalStatus = "approved";
      } else if (workspaceContext.actor.type === "VENDOR") {
        const vendorRec = await prisma.vendor.findUnique({
          where: { id: workspaceContext.vendorId },
          select: { autoPublishEnabled: true },
        });
        input.approvalStatus = vendorRec?.autoPublishEnabled ? "approved" : "pending";
      }
    }

    const slug =
      input.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") + `-${Date.now().toString().slice(-4)}`;

    const primaryVariant: any = (input.variants && input.variants.length > 0 ? input.variants[0] : null) || {
      size: "Standard",
      finish: "Standard",
      pricePerBox: 1000,
      pricePerSqft: 50,
      sqftPerBox: 20,
    };

    const cat = await prisma.category.findUnique({ where: { slug: input.categorySlug } });

    // Approval status is already set from the workspace context

    const newProduct = await prisma.product.create({
      data: {
        name: input.name,
        slug,
        category: cat?.id ? { connect: { id: cat.id } } : undefined,
        categorySlug: input.categorySlug,
        categoryName: cat?.name || "General",
        subcategory: input.subcategory || null,
        brand: input.brand || "Intrihub",
        modelNumber: input.modelNumber || null,
        sku: input.sku || null,
        material: input.material,
        unitOfSale: input.sellingUnit || input.unitOfSale || "box",
        baseUnit: input.baseUnit || null,
        conversionRatio: input.conversionRatio !== undefined && input.conversionRatio !== null ? Number(input.conversionRatio) : (primaryVariant.sqftPerBox ? Number(primaryVariant.sqftPerBox) : null),
        piecesPerUnit: input.piecesPerUnit !== undefined && input.piecesPerUnit !== null ? Number(input.piecesPerUnit) : (primaryVariant.piecesPerBox ? Number(primaryVariant.piecesPerBox) : null),
        lengthPerUnit: input.lengthPerUnit !== undefined && input.lengthPerUnit !== null ? Number(input.lengthPerUnit) : null,
        weightKg: input.weightKg !== undefined && input.weightKg !== null ? Number(input.weightKg) : (primaryVariant.weightKg ? Number(primaryVariant.weightKg) : null),
        isBulky: Boolean(input.isBulky),
        minOrderQuantity: input.minOrderQuantity !== undefined && input.minOrderQuantity !== null ? Number(input.minOrderQuantity) : 1,
        maxOrderQuantity: input.maxOrderQuantity !== undefined && input.maxOrderQuantity !== null ? Number(input.maxOrderQuantity) : null,
        incrementQuantity: input.incrementQuantity !== undefined && input.incrementQuantity !== null ? Number(input.incrementQuantity) : 1,
        allowDecimals: Boolean(input.allowDecimals),
        decimalPrecision: Number(input.decimalPrecision || 0),
        finish: primaryVariant.finish || "Standard",
        size: primaryVariant.size || "Standard",
        pricePerSqft: Number(primaryVariant.pricePerSqft || primaryVariant.price || primaryVariant.pricePerBox || 100),
        thickness: "Standard",
        usage: "Interior / Project",
        look: input.name,
        grade: input.grade || null,
        series: input.series || null,
        warranty: input.warranty || null,
        countryOfOrigin: input.countryOfOrigin || "India",
        hsnCode: input.hsnCode || null,
        gstPercent: input.gstPercent !== undefined && input.gstPercent !== null ? Number(input.gstPercent) : 18,
        gstRate: input.gstRate !== undefined && input.gstRate !== null ? Number(input.gstRate) : (input.gstPercent ? Number(input.gstPercent) : 18),
        hasVariants: Boolean(input.hasVariants),
        inStock: true,
        isBestseller: Boolean(input.isBestseller),
        isNewArrival: Boolean(input.isNew),
        isTrending: Boolean(input.isTrending),
        images: Array.isArray(input.images) && input.images.length > 0 ? input.images : ["/placeholders/product.svg"],
        videos: Array.isArray(input.videos) ? input.videos : [],
        description: input.description,
        shortDescription: input.shortDescription || null,
        mrp: input.mrp !== undefined && input.mrp !== null ? Number(input.mrp) : null,
        rating: input.manualRating !== undefined && input.manualRating !== null ? Number(input.manualRating) : 0,
        reviewCount: input.manualReviewCount !== undefined && input.manualReviewCount !== null ? Number(input.manualReviewCount) : 0,
        manualRating: input.manualRating !== undefined && input.manualRating !== null ? Number(input.manualRating) : null,
        manualReviewCount: input.manualReviewCount !== undefined && input.manualReviewCount !== null ? Number(input.manualReviewCount) : null,
        specs: input.specs || null,
        vendor: input.vendorId ? { connect: { id: input.vendorId } } : undefined,
        status: input.status || "active",
        approvalStatus: input.approvalStatus || "pending",
        rejectionReason: input.rejectionReason || null,
        coverageRate: input.coverageRate !== undefined && input.coverageRate !== null ? Number(input.coverageRate) : (primaryVariant.sqftPerBox ? Number(primaryVariant.sqftPerBox) : null),
        piecesPerBox: input.piecesPerBox !== undefined && input.piecesPerBox !== null ? Number(input.piecesPerBox) : (primaryVariant.piecesPerBox ? Number(primaryVariant.piecesPerBox) : null),
        wastageFactor: input.wastageFactor !== undefined && input.wastageFactor !== null ? Number(input.wastageFactor) : 1.1,
        manufacturer: input.manufacturer || null,
        condition: input.condition || "New",
        highlights: Array.isArray(input.highlights) ? input.highlights : [],
        keywords: Array.isArray(input.keywords) ? input.keywords : [],
        salePrice: input.salePrice !== undefined && input.salePrice !== null ? Number(input.salePrice) : null,
        saleStartDate: input.saleStartDate ? new Date(input.saleStartDate) : null,
        saleEndDate: input.saleEndDate ? new Date(input.saleEndDate) : null,
        allowBackorders: Boolean(input.allowBackorders),
        dimensions: input.dimensions || undefined,
        inTheBox: input.inTheBox || null,
        manufactureDate: input.manufactureDate ? new Date(input.manufactureDate) : null,
        expiryDate: input.expiryDate ? new Date(input.expiryDate) : null,
        shippingMode: input.shippingMode || "standard",
        dispatchTimeDays: input.dispatchTimeDays !== undefined && input.dispatchTimeDays !== null ? Number(input.dispatchTimeDays) : 2,
        pincodesServed: Array.isArray(input.pincodesServed) ? input.pincodesServed : [],
        freeDeliveryAbove: input.freeDeliveryAbove !== undefined && input.freeDeliveryAbove !== null ? Number(input.freeDeliveryAbove) : null,
        deliveryCharge: input.deliveryCharge !== undefined && input.deliveryCharge !== null ? Number(input.deliveryCharge) : null,
        allowScheduledDelivery: input.allowScheduledDelivery !== undefined ? Boolean(input.allowScheduledDelivery) : true,
        allowCod: input.allowCod !== undefined ? Boolean(input.allowCod) : true,
        isFragile: Boolean(input.isFragile),
        isPerishable: Boolean(input.isPerishable),
        returnPolicyDays: input.returnPolicyDays !== undefined && input.returnPolicyDays !== null ? Number(input.returnPolicyDays) : 7,
        replacementAllowed: input.replacementAllowed !== undefined ? Boolean(input.replacementAllowed) : true,
        warrantyType: input.warrantyType || "brand",
        warrantyDuration: input.warrantyDuration || "1 Year",
        returnConditions: input.returnConditions || null,
        complianceDeclarations: input.complianceDeclarations || undefined,
        certificates: Array.isArray(input.certificates) ? input.certificates : [],
        vendorDeclaration: input.vendorDeclaration !== undefined ? Boolean(input.vendorDeclaration) : true,
        metaTitle: input.metaTitle || null,
        metaDescription: input.metaDescription || null,
        isFeatured: Boolean(input.isFeatured),
        scheduledPublishDate: input.scheduledPublishDate ? new Date(input.scheduledPublishDate) : null,
        createdByAdminId: input.createdByAdminId || null,
        updatedByAdminId: input.updatedByAdminId || null,
        createdByCpoId: (input as any).createdByCpoId || null,
        updatedByCpoId: (input as any).updatedByCpoId || null,
        actorRole: (input as any).actorRole || (input.createdByAdminId ? "ADMIN" : (input as any).createdByCpoId ? "CPO" : null),
        editHistory: [
          {
            timestamp: new Date().toISOString(),
            role: (input as any).actorRole || (input.createdByAdminId ? "ADMIN" : (input as any).createdByCpoId ? "CPO" : "VENDOR"),
            userId: input.createdByAdminId || (input as any).createdByCpoId || input.vendorId || "SYSTEM",
            action: "CREATED",
          },
        ],
        variants: {
          create: (input.variants && input.variants.length > 0 ? input.variants : [primaryVariant]).map((v: any, vIdx: number) => ({
            sku: v.sku || null,
            variantName: v.variantName || null,
            size: v.size || primaryVariant.size || "Standard",
            finish: v.finish || primaryVariant.finish || "Standard",
            color: v.color || "Standard",
            colorHex: v.colorHex || null,
            swatchImage: v.swatchImage || null,
            image: v.image || (Array.isArray(v.images) && v.images[0] ? v.images[0] : (input.images?.[0] ?? null)),
            images: Array.isArray(v.images) && v.images.length > 0 ? v.images : (v.image ? [v.image] : []),
            unit: v.unit || input.sellingUnit || input.unitOfSale || "box",
            attributeLabel: v.attributeLabel || null,
            attributeValue: v.attributeValue || null,
            attributes: v.attributes || null,
            variantSpecs: v.variantSpecs || null,
            mrp: v.mrp !== undefined && v.mrp !== null ? Number(v.mrp) : null,
            weightKg: v.weightKg !== undefined && v.weightKg !== null ? Number(v.weightKg) : 2.5,
            price: v.price !== undefined && v.price !== null ? Number(v.price) : Number(v.pricePerBox || primaryVariant.pricePerBox || 0),
            pricePerBox: Number(v.pricePerBox || v.price || primaryVariant.pricePerBox || 0),
            pricePerSqft: Number(v.pricePerSqft || primaryVariant.pricePerSqft || 0),
            sqftPerBox: Number(v.sqftPerBox || primaryVariant.sqftPerBox || 1),
            piecesPerBox: v.piecesPerBox ? Number(v.piecesPerBox) : 4,
            stockBoxes: Number(v.stockBoxes ?? 50),
            active: v.active !== undefined ? Boolean(v.active) : true,
            lowStockAlert: v.lowStockAlert !== undefined && v.lowStockAlert !== null ? Number(v.lowStockAlert) : 10,
            minOrderQuantity: v.minOrderQuantity !== undefined && v.minOrderQuantity !== null ? Number(v.minOrderQuantity) : 1,
            maxOrderQuantity: v.maxOrderQuantity !== undefined && v.maxOrderQuantity !== null ? Number(v.maxOrderQuantity) : null,
            isDefault: v.isDefault !== undefined ? Boolean(v.isDefault) : vIdx === 0,
            barcode: v.barcode || null,
            salePrice: v.salePrice !== undefined && v.salePrice !== null ? Number(v.salePrice) : null,
            saleStartDate: v.saleStartDate ? new Date(v.saleStartDate) : null,
            saleEndDate: v.saleEndDate ? new Date(v.saleEndDate) : null,
            allowBackorders: Boolean(v.allowBackorders),
            inStock: true,
          })),
        },
        attributes: input.attributes && input.attributes.length > 0 ? {
          create: input.attributes.map((a) => ({
            key: a.key,
            value: a.value,
          })),
        } : undefined,
        priceTiers: input.priceTiers && input.priceTiers.length > 0 ? {
          create: input.priceTiers.map((t) => ({
            minQuantity: Number(t.minQuantity),
            maxQuantity: t.maxQuantity ? Number(t.maxQuantity) : null,
            price: Number(t.price),
            customerType: t.customerType || "all",
          })),
        } : undefined,
      },
      include: {
        variants: true,
        attributes: true,
        priceTiers: true,
        vendor: {
          select: {
            id: true,
            businessName: true,
            status: true,
          },
        },
      },
    });

    await invalidateHomepageProductsCache();
    safeRevalidate("/shop");
    safeRevalidate(`/shop/${input.categorySlug}`);
    safeRevalidate("/admin/products");
    safeRevalidate("/admin/product-approvals");
    safeRevalidate("/vendor/products");
    safeRevalidate("/");

    if (workspaceContext && (workspaceContext.actor.type === "ADMIN" || workspaceContext.actor.type === "CPO")) {
      try {
        const { logAdminAuditAction } = await import("@/lib/vendor-workspace-auth");
        const { notifyVendorOfAdminChanges } = await import("@/lib/notifications/vendor-workspace-notify");
        await logAdminAuditAction({
          sessionId: workspaceContext.sessionId,
          adminId: workspaceContext.actor.type === "ADMIN" ? workspaceContext.actor.adminId! : workspaceContext.actor.cpoId!,
          vendorId: workspaceContext.vendorId,
          action: "ITEM_CREATED",
          entity: "Product",
          entityId: newProduct.id,
          actorRole: workspaceContext.actor.type,
          after: {
            name: newProduct.name,
            categorySlug: newProduct.categorySlug,
            pricePerBox: primaryVariant.pricePerBox,
          },
        });
        const actorLabel = workspaceContext.actor.type === "CPO" ? "Catalog Processing Officer" : "IntriHub admin";
        await notifyVendorOfAdminChanges(
          workspaceContext.vendorId,
          `${actorLabel} added a new product "${newProduct.name}" to your store.`
        );
      } catch (auditErr) {
        console.error("Workspace audit error:", auditErr);
      }
    }

    return { success: true, product: formatProduct(newProduct) };
  } catch (error: any) {
    console.error("Error creating product:", error);
    return { success: false, error: error?.message || "Failed to create product" };
  }
}

export async function createProductsBulk(inputs: CreateProductInput[]) {
  try {
    if (!inputs || inputs.length === 0) {
      return { success: false, error: "No products provided for bulk creation" };
    }

    const { resolveVendorContext } = await import("@/lib/vendor-workspace-auth");
    const workspaceContext = await resolveVendorContext();
    if (!workspaceContext) {
      if (process.env.NODE_ENV !== "test" && process.env.ALLOW_SYSTEM_MUTATIONS !== "true") {
        return { success: false, error: "Unauthorized: Active session required to bulk create products." };
      }
    }

    const createdList: any[] = [];
    const errors: string[] = [];

    for (let idx = 0; idx < inputs.length; idx++) {
      const input = inputs[idx];
      try {
        const baseSlug = (input.slug || input.name)
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "");

        // Generate unique slug
        let finalSlug = baseSlug;
        const exists = await prisma.product.findUnique({ where: { slug: finalSlug } });
        if (exists) {
          finalSlug = `${baseSlug}-${Date.now().toString().slice(-4)}-${idx + 1}`;
        }

        const primaryVariant = input.variants && input.variants.length > 0 ? input.variants[0] : {
          size: "Standard",
          finish: "Standard",
          color: "Standard",
          pricePerBox: 100,
          pricePerSqft: 100,
          sqftPerBox: 1,
          stockBoxes: 50,
        };

        const newProd = await prisma.product.create({
          data: {
            name: input.name,
            slug: finalSlug,
            category: input.categoryId ? { connect: { id: input.categoryId } } : undefined,
            categorySlug: input.categorySlug,
            categoryName: input.categoryName || input.categorySlug,
            subcategory: input.subcategory || null,
            brand: input.brand || "Intrihub",
            modelNumber: input.modelNumber || null,
            sku: input.sku || null,
            material: input.material || "Standard",
            unitOfSale: input.sellingUnit || input.unitOfSale || "piece",
            baseUnit: input.baseUnit || null,
            conversionRatio: input.conversionRatio ? Number(input.conversionRatio) : null,
            finish: primaryVariant.finish || "Standard",
            size: primaryVariant.size || "Standard",
            pricePerSqft: Number(primaryVariant.pricePerSqft || primaryVariant.pricePerBox || 100),
            thickness: "Standard",
            usage: "Interior / Project",
            look: input.name,
            inStock: true,
            isBestseller: Boolean(input.isBestseller),
            isNewArrival: Boolean(input.isNew),
            isTrending: Boolean(input.isTrending),
            images: input.images && input.images.length > 0 ? input.images : ["/placeholders/product.svg"],
            videos: input.videos || [],
            description: input.description || input.name,
            shortDescription: input.shortDescription || null,
            rating: 0,
            reviewCount: 0,
            specs: input.specs || null,
            vendor: workspaceContext?.vendorId ? { connect: { id: workspaceContext.vendorId } } : (input.vendorId ? { connect: { id: input.vendorId } } : undefined),
            createdByAdminId: workspaceContext?.actor?.type === "ADMIN" ? workspaceContext.actor.adminId : (input.createdByAdminId || null),
            updatedByAdminId: workspaceContext?.actor?.type === "ADMIN" ? workspaceContext.actor.adminId : (input.updatedByAdminId || null),
            createdByCpoId: workspaceContext?.actor?.type === "CPO" ? workspaceContext.actor.cpoId : null,
            updatedByCpoId: workspaceContext?.actor?.type === "CPO" ? workspaceContext.actor.cpoId : null,
            actorRole: workspaceContext?.actor?.type || "SYSTEM",
            status: input.status || "active",
            approvalStatus: input.approvalStatus || ((workspaceContext?.actor?.type === "ADMIN" || workspaceContext?.actor?.type === "CPO") ? "approved" : "pending"),
            variants: {
              create: input.variants && input.variants.length > 0 ? input.variants.map((v) => ({
                sku: v.sku || null,
                size: v.size || "Standard",
                finish: v.finish || "Standard",
                color: v.color || "Standard",
                colorHex: v.colorHex || null,
                swatchImage: v.swatchImage || null,
                image: v.image || null,
                unit: v.unit || null,
                attributeLabel: v.attributeLabel || null,
                attributeValue: v.attributeValue || null,
                variantSpecs: v.variantSpecs || null,
                pricePerBox: Number(v.pricePerBox || 100),
                pricePerSqft: Number(v.pricePerSqft || 100),
                sqftPerBox: Number(v.sqftPerBox || 1),
                piecesPerBox: v.piecesPerBox ? Number(v.piecesPerBox) : 4,
                stockBoxes: Number(v.stockBoxes || 50),
                inStock: true,
              })) : [
                {
                  size: "Standard",
                  finish: "Standard",
                  color: "Standard",
                  image: null,
                  unit: null,
                  attributeLabel: null,
                  attributeValue: null,
                  pricePerBox: 100,
                  pricePerSqft: 100,
                  sqftPerBox: 1,
                  stockBoxes: 50,
                  inStock: true,
                }
              ],
            },
            attributes: input.attributes && input.attributes.length > 0 ? {
              create: input.attributes.map((a) => ({
                key: a.key,
                value: a.value,
              })),
            } : undefined,
          },
        });

        createdList.push(newProd);
      } catch (err: any) {
        console.error(`Error importing row ${idx + 1}:`, err);
        errors.push(`Row ${idx + 1} (${input.name}): ${err?.message || "DB error"}`);
      }
    }

    safeRevalidate("/shop");
    safeRevalidate("/admin/products");
    safeRevalidate("/admin/product-approvals");
    safeRevalidate("/vendor/products");
    safeRevalidate("/");

    if (workspaceContext && workspaceContext.actor.type === "ADMIN" && createdList.length > 0) {
      try {
        const { logAdminAuditAction } = await import("@/lib/vendor-workspace-auth");
        const { notifyVendorOfAdminChanges } = await import("@/lib/notifications/vendor-workspace-notify");
        await logAdminAuditAction({
          sessionId: workspaceContext.sessionId,
          adminId: workspaceContext.actor.adminId!,
          vendorId: workspaceContext.vendorId,
          action: "ITEM_BULK_UPLOAD",
          entity: "Product",
          after: { count: createdList.length, totalRequested: inputs.length },
        });
        await notifyVendorOfAdminChanges(
          workspaceContext.vendorId,
          `IntriHub admin uploaded ${createdList.length} items to your store today.`
        );
      } catch (auditErr) {
        console.error("Workspace bulk audit error:", auditErr);
      }
    }

    return {
      success: createdList.length > 0,
      count: createdList.length,
      totalRequested: inputs.length,
      errors: errors.length > 0 ? errors : undefined,
      message: `Successfully imported ${createdList.length} of ${inputs.length} products to database`,
    };
  } catch (error: any) {
    console.error("Error bulk creating products:", error);
    return { success: false, error: error?.message || "Failed to bulk create products" };
  }
}

export async function bulkCreateProducts(inputs: CreateProductInput[]) {
  return createProductsBulk(inputs);
}

export async function updateProduct(id: string, input: Partial<CreateProductInput>) {
  try {
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) return { success: false, error: "Product not found" };

    const { resolveVendorContext } = await import("@/lib/vendor-workspace-auth");
    let workspaceContext = await resolveVendorContext();
    let isSuperRole = false;
    let actorType = "UNKNOWN";
    let adminOrCpoId: string | null = null;
    if (process.env.ALLOW_SYSTEM_MUTATIONS === "true") {
      isSuperRole = true;
      actorType = "SYSTEM";
    } else if (workspaceContext && (workspaceContext.actor.type === "ADMIN" || workspaceContext.actor.type === "CPO")) {
      isSuperRole = true;
      actorType = workspaceContext.actor.type;
      adminOrCpoId = workspaceContext.actor.type === "ADMIN" ? workspaceContext.actor.adminId! : workspaceContext.actor.cpoId!;
    } else {
      const { checkIsAdmin, getAdminSession } = await import("@/lib/server-auth");
      const isAdmin = await checkIsAdmin();
      if (isAdmin) {
        isSuperRole = true;
        actorType = "ADMIN";
        const adminSess = await getAdminSession();
        adminOrCpoId = adminSess?.adminId || null;
      } else {
        const { getCpoSession } = await import("@/lib/cpo/auth");
        const cpoSession = await getCpoSession();
        if (cpoSession) {
          isSuperRole = true;
          actorType = "CPO";
          adminOrCpoId = cpoSession.userId;
        }
      }
    }

    if (!workspaceContext && !isSuperRole) {
      return { success: false, error: "Unauthorized: Active session required to update products." };
    }

    if (!isSuperRole && existing.vendorId && workspaceContext && existing.vendorId !== workspaceContext.vendorId) {
      return { success: false, error: "Forbidden: You cannot modify products belonging to another vendor." };
    }

    const updateData: any = {};
    if (actorType === "ADMIN" && adminOrCpoId) {
      updateData.updatedByAdminId = adminOrCpoId;
      updateData.actorRole = "ADMIN";
    } else if (actorType === "CPO" && adminOrCpoId) {
      updateData.updatedByCpoId = adminOrCpoId;
      updateData.actorRole = "CPO";
    } else if (input.updatedByAdminId) {
      updateData.updatedByAdminId = input.updatedByAdminId;
    }
    if (input.name) updateData.name = input.name;
    if (input.brand !== undefined) updateData.brand = input.brand;
    if (input.modelNumber !== undefined) updateData.modelNumber = input.modelNumber;
    if (input.sku !== undefined) updateData.sku = input.sku;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.shortDescription !== undefined) updateData.shortDescription = input.shortDescription;
    if (input.sellingUnit || input.unitOfSale) updateData.unitOfSale = input.sellingUnit || input.unitOfSale;
    if (input.baseUnit !== undefined) updateData.baseUnit = input.baseUnit;
    if (input.conversionRatio !== undefined) updateData.conversionRatio = input.conversionRatio !== null ? Number(input.conversionRatio) : null;
    if (input.piecesPerUnit !== undefined) updateData.piecesPerUnit = input.piecesPerUnit !== null ? Number(input.piecesPerUnit) : null;
    if (input.lengthPerUnit !== undefined) updateData.lengthPerUnit = input.lengthPerUnit !== null ? Number(input.lengthPerUnit) : null;
    if (input.weightKg !== undefined) updateData.weightKg = input.weightKg !== null ? Number(input.weightKg) : null;
    if (input.isBulky !== undefined) updateData.isBulky = Boolean(input.isBulky);
    if (input.minOrderQuantity !== undefined) updateData.minOrderQuantity = Number(input.minOrderQuantity);
    if (input.maxOrderQuantity !== undefined) updateData.maxOrderQuantity = input.maxOrderQuantity !== null ? Number(input.maxOrderQuantity) : null;
    if (input.incrementQuantity !== undefined) updateData.incrementQuantity = Number(input.incrementQuantity);
    if (input.allowDecimals !== undefined) updateData.allowDecimals = Boolean(input.allowDecimals);
    if (input.decimalPrecision !== undefined) updateData.decimalPrecision = Number(input.decimalPrecision);
    if (input.grade !== undefined) updateData.grade = input.grade;
    if (input.series !== undefined) updateData.series = input.series;
    if (input.warranty !== undefined) updateData.warranty = input.warranty;
    if (input.countryOfOrigin !== undefined) updateData.countryOfOrigin = input.countryOfOrigin;
    if (input.hsnCode !== undefined) updateData.hsnCode = input.hsnCode;
    if (input.gstPercent !== undefined) updateData.gstPercent = input.gstPercent !== null ? Number(input.gstPercent) : 18;
    if (input.vendorId !== undefined) updateData.vendorId = input.vendorId;
    if (input.status !== undefined) updateData.status = input.status;
    if (input.approvalStatus !== undefined) updateData.approvalStatus = input.approvalStatus;
    if (input.rejectionReason !== undefined) updateData.rejectionReason = input.rejectionReason;
    if (input.categorySlug) {
      updateData.categorySlug = input.categorySlug;
      const cat = await prisma.category.findUnique({ where: { slug: input.categorySlug } });
      if (cat) {
        updateData.categoryId = cat.id;
        updateData.categoryName = cat.name;
      }
    }
    if (input.material) updateData.material = input.material;
    if (input.images) updateData.images = input.images;
    if (input.videos !== undefined) updateData.videos = input.videos;
    if (input.isBestseller !== undefined) updateData.isBestseller = input.isBestseller;
    if (input.isNew !== undefined) updateData.isNewArrival = input.isNew;
    if (input.isTrending !== undefined) updateData.isTrending = input.isTrending;
    if (input.manualRating !== undefined) {
      updateData.manualRating = input.manualRating !== null && input.manualRating !== undefined ? Number(input.manualRating) : null;
      if (input.manualRating !== null && input.manualRating !== undefined) updateData.rating = Number(input.manualRating);
    }
    if (input.manualReviewCount !== undefined) {
      updateData.manualReviewCount = input.manualReviewCount !== null && input.manualReviewCount !== undefined ? Number(input.manualReviewCount) : null;
      if (input.manualReviewCount !== null && input.manualReviewCount !== undefined) updateData.reviewCount = Number(input.manualReviewCount);
    }
    if (input.specs !== undefined) updateData.specs = input.specs;
    if (input.mrp !== undefined) updateData.mrp = input.mrp !== null ? Number(input.mrp) : null;
    if (input.coverageRate !== undefined) updateData.coverageRate = input.coverageRate !== null ? Number(input.coverageRate) : null;
    if (input.piecesPerBox !== undefined) updateData.piecesPerBox = input.piecesPerBox !== null ? Number(input.piecesPerBox) : null;
    if (input.wastageFactor !== undefined) updateData.wastageFactor = input.wastageFactor !== null ? Number(input.wastageFactor) : 1.1;
    if (input.hasVariants !== undefined) updateData.hasVariants = Boolean(input.hasVariants);
    if (input.gstRate !== undefined) updateData.gstRate = Number(input.gstRate);
    if (input.updatedByAdminId !== undefined) updateData.updatedByAdminId = input.updatedByAdminId;
    if (input.manufacturer !== undefined) updateData.manufacturer = input.manufacturer;
    if (input.condition !== undefined) updateData.condition = input.condition;
    if (input.highlights !== undefined) updateData.highlights = input.highlights;
    if (input.keywords !== undefined) updateData.keywords = input.keywords;
    if (input.salePrice !== undefined) updateData.salePrice = input.salePrice !== null ? Number(input.salePrice) : null;
    if (input.saleStartDate !== undefined) updateData.saleStartDate = input.saleStartDate ? new Date(input.saleStartDate) : null;
    if (input.saleEndDate !== undefined) updateData.saleEndDate = input.saleEndDate ? new Date(input.saleEndDate) : null;
    if (input.allowBackorders !== undefined) updateData.allowBackorders = Boolean(input.allowBackorders);
    if (input.dimensions !== undefined) updateData.dimensions = input.dimensions;
    if (input.inTheBox !== undefined) updateData.inTheBox = input.inTheBox;
    if (input.manufactureDate !== undefined) updateData.manufactureDate = input.manufactureDate ? new Date(input.manufactureDate) : null;
    if (input.expiryDate !== undefined) updateData.expiryDate = input.expiryDate ? new Date(input.expiryDate) : null;
    if (input.shippingMode !== undefined) updateData.shippingMode = input.shippingMode;
    if (input.dispatchTimeDays !== undefined) updateData.dispatchTimeDays = input.dispatchTimeDays !== null ? Number(input.dispatchTimeDays) : null;
    if (input.pincodesServed !== undefined) updateData.pincodesServed = input.pincodesServed;
    if (input.freeDeliveryAbove !== undefined) updateData.freeDeliveryAbove = input.freeDeliveryAbove !== null ? Number(input.freeDeliveryAbove) : null;
    if (input.deliveryCharge !== undefined) updateData.deliveryCharge = input.deliveryCharge !== null ? Number(input.deliveryCharge) : null;
    if (input.allowScheduledDelivery !== undefined) updateData.allowScheduledDelivery = Boolean(input.allowScheduledDelivery);
    if (input.allowCod !== undefined) updateData.allowCod = Boolean(input.allowCod);
    if (input.isFragile !== undefined) updateData.isFragile = Boolean(input.isFragile);
    if (input.isPerishable !== undefined) updateData.isPerishable = Boolean(input.isPerishable);
    if (input.returnPolicyDays !== undefined) updateData.returnPolicyDays = input.returnPolicyDays !== null ? Number(input.returnPolicyDays) : null;
    if (input.replacementAllowed !== undefined) updateData.replacementAllowed = Boolean(input.replacementAllowed);
    if (input.warrantyType !== undefined) updateData.warrantyType = input.warrantyType;
    if (input.warrantyDuration !== undefined) updateData.warrantyDuration = input.warrantyDuration;
    if (input.returnConditions !== undefined) updateData.returnConditions = input.returnConditions;
    if (input.complianceDeclarations !== undefined) updateData.complianceDeclarations = input.complianceDeclarations;
    if (input.certificates !== undefined) updateData.certificates = input.certificates;
    if (input.vendorDeclaration !== undefined) updateData.vendorDeclaration = Boolean(input.vendorDeclaration);
    if (input.metaTitle !== undefined) updateData.metaTitle = input.metaTitle;
    if (input.metaDescription !== undefined) updateData.metaDescription = input.metaDescription;
    if (input.isFeatured !== undefined) updateData.isFeatured = Boolean(input.isFeatured);
    if (input.scheduledPublishDate !== undefined) updateData.scheduledPublishDate = input.scheduledPublishDate ? new Date(input.scheduledPublishDate) : null;

    if (input.variants && input.variants.length > 0) {
      await prisma.productVariant.deleteMany({ where: { productId: id } });
      updateData.variants = {
        create: input.variants.map((v, vIdx) => ({
          sku: v.sku || null,
          variantName: v.variantName || null,
          size: v.size || "Standard",
          finish: v.finish || "Standard",
          color: v.color || "Standard",
          colorHex: v.colorHex || null,
          swatchImage: v.swatchImage || null,
          image: v.image || (Array.isArray(v.images) && v.images[0] ? v.images[0] : (input.images?.[0] ?? null)),
          images: Array.isArray(v.images) && v.images.length > 0 ? v.images : (v.image ? [v.image] : []),
          unit: v.unit || input.sellingUnit || input.unitOfSale || "box",
          attributeLabel: v.attributeLabel || null,
          attributeValue: v.attributeValue || null,
          attributes: v.attributes || null,
          variantSpecs: v.variantSpecs || null,
          mrp: v.mrp !== undefined && v.mrp !== null ? Number(v.mrp) : null,
          weightKg: v.weightKg !== undefined && v.weightKg !== null ? Number(v.weightKg) : 2.5,
          price: v.price !== undefined && v.price !== null ? Number(v.price) : Number(v.pricePerBox || 0),
          pricePerBox: Number(v.pricePerBox || v.price || 0),
          pricePerSqft: Number(v.pricePerSqft || 0),
          sqftPerBox: Number(v.sqftPerBox || 1),
          piecesPerBox: v.piecesPerBox ? Number(v.piecesPerBox) : 4,
          stockBoxes: Number(v.stockBoxes ?? 50),
          active: v.active !== undefined ? Boolean(v.active) : true,
          lowStockAlert: v.lowStockAlert !== undefined && v.lowStockAlert !== null ? Number(v.lowStockAlert) : 10,
          minOrderQuantity: v.minOrderQuantity !== undefined && v.minOrderQuantity !== null ? Number(v.minOrderQuantity) : 1,
          maxOrderQuantity: v.maxOrderQuantity !== undefined && v.maxOrderQuantity !== null ? Number(v.maxOrderQuantity) : null,
          isDefault: v.isDefault !== undefined ? Boolean(v.isDefault) : vIdx === 0,
          barcode: v.barcode || null,
          salePrice: v.salePrice !== undefined && v.salePrice !== null ? Number(v.salePrice) : null,
          saleStartDate: v.saleStartDate ? new Date(v.saleStartDate) : null,
          saleEndDate: v.saleEndDate ? new Date(v.saleEndDate) : null,
          allowBackorders: Boolean(v.allowBackorders),
          inStock: true,
        })),
      };
      updateData.finish = input.variants[0].finish || "Standard";
      updateData.size = input.variants[0].size || "Standard";
      updateData.pricePerSqft = input.variants[0].pricePerSqft || 0;
    }

    if (input.attributes) {
      await prisma.productAttribute.deleteMany({ where: { productId: id } });
      if (input.attributes.length > 0) {
        updateData.attributes = {
          create: input.attributes.map((a) => ({
            key: a.key,
            value: a.value,
          })),
        };
      }
    }

    if (input.priceTiers) {
      await prisma.priceTier.deleteMany({ where: { productId: id } });
      if (input.priceTiers.length > 0) {
        updateData.priceTiers = {
          create: input.priceTiers.map((t) => ({
            minQuantity: Number(t.minQuantity),
            maxQuantity: t.maxQuantity ? Number(t.maxQuantity) : null,
            price: Number(t.price),
            customerType: t.customerType || "all",
          })),
        };
      }
    }

    const currentHistory = Array.isArray((existing as any).editHistory)
      ? ((existing as any).editHistory as any[])
      : [];
    const historyEntry = {
      timestamp: new Date().toISOString(),
      role: actorType,
      userId: adminOrCpoId || (workspaceContext?.actor ? workspaceContext.actor.type : "SYSTEM"),
      changes: Object.keys(updateData).filter(
        (k) => k !== "variants" && k !== "attributes" && k !== "priceTiers"
      ),
    };
    updateData.editHistory = [...currentHistory.slice(-20), historyEntry];

    const updated = await prisma.product.update({
      where: { id },
      data: updateData,
      include: {
        variants: true,
        attributes: true,
        priceTiers: true,
        vendor: {
          select: {
            id: true,
            businessName: true,
            status: true,
          },
        },
      },
    });

    await invalidateHomepageProductsCache();
    safeRevalidate("/shop");
    safeRevalidate(`/shop/${updated.categorySlug}`);
    safeRevalidate(`/product/${updated.slug}`);
    safeRevalidate("/admin/products");
    safeRevalidate("/admin/product-approvals");
    safeRevalidate("/vendor/products");
    safeRevalidate("/");

    if (workspaceContext && workspaceContext.actor.type === "ADMIN") {
      try {
        const { logAdminAuditAction } = await import("@/lib/vendor-workspace-auth");
        const { notifyVendorOfAdminChanges } = await import("@/lib/notifications/vendor-workspace-notify");
        await logAdminAuditAction({
          sessionId: workspaceContext.sessionId,
          adminId: workspaceContext.actor.adminId!,
          vendorId: workspaceContext.vendorId,
          action: "ITEM_UPDATED",
          entity: "Product",
          entityId: updated.id,
          before: { name: existing.name, status: existing.status, pricePerBox: (existing as any).variants?.[0]?.pricePerBox },
          after: { name: updated.name, status: updated.status, pricePerBox: (updated as any).variants?.[0]?.pricePerBox },
        });
        await notifyVendorOfAdminChanges(
          workspaceContext.vendorId,
          `IntriHub admin updated product "${updated.name}" in your store.`
        );
      } catch (auditErr) {
        console.error("Workspace update audit error:", auditErr);
      }
    }

    return { success: true, product: formatProduct(updated) };
  } catch (error: any) {
    console.error("Error updating product:", error);
    return { success: false, error: error?.message || "Failed to update product" };
  }
}

export async function deleteProduct(id: string, options?: { hardDelete?: boolean }) {
  try {
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) return { success: false, error: "Product not found" };

    const { resolveVendorContext } = await import("@/lib/vendor-workspace-auth");
    let workspaceContext = await resolveVendorContext();
    let isSuperRole = false;

    if (process.env.ALLOW_SYSTEM_MUTATIONS === "true") {
      isSuperRole = true;
    } else if (workspaceContext && (workspaceContext.actor.type === "ADMIN" || workspaceContext.actor.type === "CPO")) {
      isSuperRole = true;
    } else {
      const { checkIsAdmin } = await import("@/lib/server-auth");
      const isAdmin = await checkIsAdmin();
      if (isAdmin) {
        isSuperRole = true;
      } else {
        const { getCpoSession } = await import("@/lib/cpo/auth");
        const cpoSession = await getCpoSession();
        if (cpoSession) {
          isSuperRole = true;
        }
      }
    }

    if (!workspaceContext && !isSuperRole) {
      return { success: false, error: "Unauthorized: Active session required to delete products." };
    }

    if (!isSuperRole && existing.vendorId && workspaceContext && existing.vendorId !== workspaceContext.vendorId) {
      return { success: false, error: "Forbidden: You cannot delete products belonging to another vendor." };
    }

    if (options?.hardDelete) {
      // 1. Automatically generate 301 redirect from product slug to its category page before purging
      await recordHardDeleteRedirect({
        slug: existing.slug,
        categorySlug: existing.categorySlug,
      });

      // 2. Perform hard delete from DB
      await prisma.product.delete({ where: { id } });
    } else {
      // Default: Soft delete (status: discontinued) to preserve Google indexation and return 200 with alternatives
      await prisma.product.update({
        where: { id },
        data: { status: "discontinued" },
      });
    }

    await invalidateHomepageProductsCache();
    safeRevalidate("/shop");
    safeRevalidate(`/shop/${existing.categorySlug}`);
    safeRevalidate(`/product/${existing.slug}`);
    safeRevalidate("/admin/products");
    safeRevalidate("/vendor/products");
    safeRevalidate("/");

    if (workspaceContext && workspaceContext.actor.type === "ADMIN") {
      try {
        const { logAdminAuditAction } = await import("@/lib/vendor-workspace-auth");
        const { notifyVendorOfAdminChanges } = await import("@/lib/notifications/vendor-workspace-notify");
        await logAdminAuditAction({
          sessionId: workspaceContext.sessionId,
          adminId: workspaceContext.actor.adminId!,
          vendorId: workspaceContext.vendorId,
          action: "ITEM_DELETED",
          entity: "Product",
          entityId: existing.id,
          before: { name: existing.name, slug: existing.slug },
        });
        await notifyVendorOfAdminChanges(
          workspaceContext.vendorId,
          `IntriHub admin removed product "${existing.name}" from your store.`
        );
      } catch (auditErr) {
        console.error("Workspace delete audit error:", auditErr);
      }
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error deleting product:", error);
    return { success: false, error: error?.message || "Failed to delete product" };
  }
}

export async function checkDuplicateProduct(params: {
  vendorId?: string | null;
  name: string;
  brand?: string | null;
  modelNumber?: string | null;
  excludeProductId?: string | null;
}): Promise<{ isDuplicate: boolean; duplicateName?: string; duplicateId?: string }> {
  try {
    if (!params.name || !params.vendorId) {
      return { isDuplicate: false };
    }

    const trimmedName = params.name.trim();
    if (trimmedName.length < 3) {
      return { isDuplicate: false };
    }

    const where: any = {
      vendorId: params.vendorId,
      name: { equals: trimmedName, mode: "insensitive" },
    };

    if (params.brand && params.brand.trim()) {
      where.brand = { equals: params.brand.trim(), mode: "insensitive" };
    }
    if (params.modelNumber && params.modelNumber.trim()) {
      where.modelNumber = { equals: params.modelNumber.trim(), mode: "insensitive" };
    }
    if (params.excludeProductId) {
      where.id = { not: params.excludeProductId };
    }

    const match = await prisma.product.findFirst({
      where,
      select: { id: true, name: true },
    });

    if (match) {
      return {
        isDuplicate: true,
        duplicateName: match.name,
        duplicateId: match.id,
      };
    }
    return { isDuplicate: false };
  } catch (err) {
    console.error("Duplicate check error:", err);
    return { isDuplicate: false };
  }
}

export async function softDeleteProduct(id: string) {
  return deleteProduct(id, { hardDelete: false });
}

export async function hardDeleteProduct(id: string) {
  return deleteProduct(id, { hardDelete: true });
}

// ────────────────────────────────────────────────────────────
// Phase 6: Bulk Operations, Clone Listing & Multi-Variant Conversion
// ────────────────────────────────────────────────────────────

/**
 * Clones an existing product listing as a Draft.
 */
export async function cloneProduct(productId: string, customTitle?: string) {
  try {
    const existing = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        variants: true,
        attributes: true,
        priceTiers: true,
      },
    });

    if (!existing) {
      return { success: false, error: "Source product not found for cloning" };
    }

    const clonedName = customTitle?.trim() || `${existing.name} (Copy)`;

    const input: CreateProductInput = {
      name: clonedName,
      categorySlug: existing.categorySlug,
      categoryName: existing.categoryName,
      categoryId: existing.categoryId,
      subcategory: existing.subcategory,
      brand: existing.brand,
      modelNumber: existing.modelNumber ? `${existing.modelNumber}-COPY` : null,
      sku: existing.sku ? `${existing.sku}-COPY` : null,
      material: existing.material,
      description: existing.description,
      shortDescription: existing.shortDescription,
      images: existing.images,
      videos: existing.videos,
      unitOfSale: existing.unitOfSale,
      hasVariants: existing.hasVariants,
      mrp: existing.mrp,
      vendorId: existing.vendorId,
      manufacturer: existing.manufacturer,
      condition: existing.condition,
      highlights: existing.highlights,
      keywords: existing.keywords,
      countryOfOrigin: existing.countryOfOrigin,
      hsnCode: existing.hsnCode,
      gstPercent: existing.gstPercent,
      gstRate: existing.gstRate,
      salePrice: existing.salePrice,
      saleStartDate: existing.saleStartDate ? existing.saleStartDate.toISOString() : null,
      saleEndDate: existing.saleEndDate ? existing.saleEndDate.toISOString() : null,
      allowBackorders: existing.allowBackorders,
      dimensions: existing.dimensions as any,
      inTheBox: existing.inTheBox,
      manufactureDate: existing.manufactureDate ? existing.manufactureDate.toISOString() : null,
      expiryDate: existing.expiryDate ? existing.expiryDate.toISOString() : null,
      shippingMode: existing.shippingMode,
      dispatchTimeDays: existing.dispatchTimeDays,
      pincodesServed: existing.pincodesServed,
      freeDeliveryAbove: existing.freeDeliveryAbove,
      deliveryCharge: existing.deliveryCharge,
      allowScheduledDelivery: existing.allowScheduledDelivery,
      allowCod: existing.allowCod,
      isFragile: existing.isFragile,
      isPerishable: existing.isPerishable,
      returnPolicyDays: existing.returnPolicyDays,
      replacementAllowed: existing.replacementAllowed,
      warrantyType: existing.warrantyType,
      warrantyDuration: existing.warrantyDuration,
      returnConditions: existing.returnConditions,
      complianceDeclarations: existing.complianceDeclarations as any,
      certificates: existing.certificates,
      vendorDeclaration: existing.vendorDeclaration,
      metaTitle: existing.metaTitle,
      metaDescription: existing.metaDescription,
      isFeatured: false,
      status: "draft",
      approvalStatus: "pending",
      variants: existing.variants.map((v, idx) => ({
        sku: v.sku ? `${v.sku}-COPY` : null,
        variantName: v.variantName || `Variant ${idx + 1}`,
        size: v.size,
        finish: v.finish,
        color: v.color,
        colorHex: v.colorHex,
        swatchImage: v.swatchImage,
        image: v.image,
        images: v.images,
        unit: v.unit,
        attributeLabel: v.attributeLabel,
        attributeValue: v.attributeValue,
        attributes: (v.attributes as any) || null,
        mrp: v.mrp,
        price: v.price || v.pricePerBox,
        pricePerBox: v.pricePerBox,
        pricePerSqft: v.pricePerSqft,
        sqftPerBox: v.sqftPerBox,
        stockBoxes: v.stockBoxes,
        active: v.active,
        lowStockAlert: v.lowStockAlert,
        minOrderQuantity: v.minOrderQuantity,
        maxOrderQuantity: v.maxOrderQuantity,
        isDefault: idx === 0,
        barcode: null,
        salePrice: v.salePrice,
        allowBackorders: v.allowBackorders,
      })),
      attributes: existing.attributes.map((a) => ({
        key: a.key,
        value: a.value,
      })),
      priceTiers: existing.priceTiers.map((t) => ({
        minQuantity: t.minQuantity,
        maxQuantity: t.maxQuantity,
        price: t.price,
        customerType: t.customerType,
      })),
    };

    return createProduct(input);
  } catch (err: any) {
    console.error("Error cloning product:", err);
    return { success: false, error: err?.message || "Failed to clone product listing" };
  }
}

/**
 * Converts an existing single-item listing into a multi-variety product.
 */
export async function convertSingleToMultiVariant(productId: string, variants: any[]) {
  try {
    if (!variants || variants.length === 0) {
      return { success: false, error: "At least 1 variant is required to convert to multi-variety" };
    }

    return updateProduct(productId, {
      hasVariants: true,
      variants,
    });
  } catch (err: any) {
    console.error("Error converting product to multi-variant:", err);
    return { success: false, error: err?.message || "Failed to convert product" };
  }
}

/**
 * Bulk updates common attributes (e.g. status, low stock alert, shipping mode) for multiple products.
 */
export async function bulkUpdateProducts(
  productIds: string[],
  updates: {
    status?: "active" | "paused" | "draft" | "archived";
    shippingMode?: string;
    dispatchTimeDays?: number;
    returnPolicyDays?: number;
    allowCod?: boolean;
    allowBackorders?: boolean;
    freeDeliveryAbove?: number;
  }
) {
  try {
    if (!productIds || productIds.length === 0) {
      return { success: false, error: "No products provided for bulk update" };
    }

    const res = await prisma.product.updateMany({
      where: { id: { in: productIds } },
      data: updates as any,
    });

    safeRevalidate("/vendor/products");
    safeRevalidate("/admin/products");
    safeRevalidate("/cpo/catalog");
    safeRevalidate("/shop");

    return {
      success: true,
      updatedCount: res.count,
      message: `Successfully updated ${res.count} products`,
    };
  } catch (err: any) {
    console.error("Error in bulkUpdateProducts:", err);
    return { success: false, error: err?.message || "Failed to bulk update products" };
  }
}

/**
 * Generates a standard CSV header string for product uploads.
 */
export function generateProductCsvTemplate(): string {
  const headers = [
    "name",
    "categorySlug",
    "brand",
    "sellingPrice",
    "mrp",
    "stockQuantity",
    "unitOfSale",
    "sku",
    "description",
    "highlights",
    "imageUrl",
    "countryOfOrigin",
    "gstRate",
    "hsnCode",
    "dispatchTimeDays",
    "returnPolicyDays",
  ];
  const sampleRow = [
    "Royal Oak Vitrified Floor Tile 600x600mm",
    "tiles-stone",
    "Kajaria",
    "450",
    "550",
    "100",
    "box",
    "KAJ-ROY-600",
    "Premium vitrified digital floor tiles with mirror polish.",
    "Stain resistant|Anti-skid|Water resistant",
    "https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?auto=format&fit=crop&w=800&q=80",
    "India",
    "18",
    "6907",
    "2",
    "7",
  ];
  return `${headers.join(",")}\n${sampleRow.map((v) => `"${v}"`).join(",")}`;
}

/**
 * Parses CSV text and performs bulk creation of products.
 */
export async function parseCsvAndBulkCreate(csvText: string, defaultVendorId?: string) {
  try {
    const lines = csvText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    if (lines.length < 2) {
      return { success: false, error: "CSV file is empty or missing data rows" };
    }

    // Simple robust CSV line splitter handling quotes
    const parseLine = (line: string): string[] => {
      const result: string[] = [];
      let cur = "";
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (c === '"') {
          inQuotes = !inQuotes;
        } else if (c === "," && !inQuotes) {
          result.push(cur.trim());
          cur = "";
        } else {
          cur += c;
        }
      }
      result.push(cur.trim());
      return result.map((s) => s.replace(/^"|"$/g, "").trim());
    };

    const headers = parseLine(lines[0]).map((h) => h.toLowerCase());
    const productsToCreate: CreateProductInput[] = [];

    for (let r = 1; r < lines.length; r++) {
      const values = parseLine(lines[r]);
      if (values.length < 3) continue;

      const row: Record<string, string> = {};
      headers.forEach((h, idx) => {
        row[h] = values[idx] || "";
      });

      if (!row["name"]) continue;

      const price = parseFloat(row["sellingprice"] || row["price"] || "0") || 100;
      const mrp = parseFloat(row["mrp"] || "0") || Math.round(price * 1.3);
      const stock = parseInt(row["stockquantity"] || row["stock"] || "50", 10) || 50;
      const highlights = (row["highlights"] || "").split("|").map((h) => h.trim()).filter(Boolean);
      const images = (row["imageurl"] || row["images"] || "").split("|").map((img) => img.trim()).filter(Boolean);

      productsToCreate.push({
        name: row["name"],
        categorySlug: row["categoryslug"] || "tiles-stone",
        categoryName: row["categoryslug"] || "Tiles & Stone",
        brand: row["brand"] || "Intrihub",
        material: "Standard",
        description: row["description"] || `${row["name"]} - High quality building material supplied by IntriHub.`,
        unitOfSale: row["unitofsale"] || "box",
        sku: row["sku"] || null,
        vendorId: defaultVendorId || null,
        mrp,
        gstRate: parseFloat(row["gstrate"] || "18") || 18,
        gstPercent: parseFloat(row["gstrate"] || "18") || 18,
        hsnCode: row["hsncode"] || null,
        countryOfOrigin: row["countryoforigin"] || "India",
        highlights: highlights.length > 0 ? highlights : ["Durable quality", "Manufactured to standard benchmarks"],
        images: images.length > 0 ? images : ["/placeholders/product.svg"],
        dispatchTimeDays: parseInt(row["dispatchtimedays"] || "2", 10) || 2,
        returnPolicyDays: parseInt(row["returnpolicydays"] || "7", 10) || 7,
        hasVariants: false,
        variants: [
          {
            variantName: "Standard",
            size: "Standard",
            finish: "Standard",
            color: "Standard",
            unit: row["unitofsale"] || "box",
            price,
            pricePerBox: price,
            pricePerSqft: price,
            sqftPerBox: 1,
            stockBoxes: stock,
            mrp,
            active: true,
            isDefault: true,
            sku: row["sku"] || null,
            images: images.length > 0 ? images : [],
          },
        ],
      });
    }

    if (productsToCreate.length === 0) {
      return { success: false, error: "No valid product rows found in CSV" };
    }

    return createProductsBulk(productsToCreate);
  } catch (err: any) {
    console.error("Error parsing CSV:", err);
    return { success: false, error: err?.message || "Failed to parse CSV file" };
  }
}


