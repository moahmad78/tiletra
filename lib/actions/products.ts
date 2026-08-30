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
  attributes?: { key: string; value: string }[];
  priceTiers?: { minQuantity: number; maxQuantity?: number | null; price: number; customerType?: string }[];
  variants: {
    sku?: string | null;
    size: string;
    finish: any;
    color: string;
    colorHex?: string | null;
    swatchImage?: string | null;
    image?: string | null;
    unit?: string | null;
    attributeLabel?: string | null;
    attributeValue?: string | null;
    variantSpecs?: any;
    mrp?: number | null;
    weightKg?: number | null;
    pricePerBox: number;
    pricePerSqft: number;
    sqftPerBox: number;
    piecesPerBox?: number;
    stockBoxes?: number;
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
};

import { products as defaultProducts } from "@/lib/data/products";

export async function getProducts(options?: {
  categorySlug?: string;
  isTrending?: boolean;
  isBestseller?: boolean;
  isNewArrival?: boolean;
  search?: string;
  limit?: number;
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

export async function getTrendingProducts(limit = 8): Promise<Product[]> {
  const products = await getProducts({ isTrending: true, limit });
  if (products.length === 0) {
    return getProducts({ limit });
  }
  return products;
}

export async function getBestsellers(limit = 8): Promise<Product[]> {
  const products = await getProducts({ isBestseller: true, limit });
  if (products.length === 0) {
    return getProducts({ limit });
  }
  return products;
}

export const getBestsellerProducts = getBestsellers;

export async function getNewArrivals(limit = 8): Promise<Product[]> {
  const products = await getProducts({ isNewArrival: true, limit });
  if (products.length === 0) {
    return getProducts({ limit });
  }
  return products;
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
    const slug = input.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "") + `-${Date.now().toString().slice(-4)}`;

    const primaryVariant: any = (input.variants && input.variants.length > 0 ? input.variants[0] : null) || {
      size: "Standard",
      finish: "Standard",
      pricePerBox: 1000,
      pricePerSqft: 50,
      sqftPerBox: 20,
    };

    const cat = await prisma.category.findUnique({ where: { slug: input.categorySlug } });

    let initialApprovalStatus = input.approvalStatus;
    if (!initialApprovalStatus) {
      if (input.vendorId) {
        const vendorRec = await prisma.vendor.findUnique({
          where: { id: input.vendorId },
          select: { autoPublishEnabled: true },
        });
        initialApprovalStatus = vendorRec?.autoPublishEnabled ? "approved" : "pending";
      } else {
        initialApprovalStatus = "approved";
      }
    }

    const newProduct = await prisma.product.create({
      data: {
        name: input.name,
        slug,
        categoryId: cat?.id || null,
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
        minOrderQuantity: input.minOrderQuantity !== undefined && input.minOrderQuantity !== null ? Number(input.minOrderQuantity) : 1,
        maxOrderQuantity: input.maxOrderQuantity !== undefined && input.maxOrderQuantity !== null ? Number(input.maxOrderQuantity) : null,
        incrementQuantity: input.incrementQuantity !== undefined && input.incrementQuantity !== null ? Number(input.incrementQuantity) : 1,
        allowDecimals: Boolean(input.allowDecimals),
        decimalPrecision: Number(input.decimalPrecision || 0),
        finish: primaryVariant.finish,
        size: primaryVariant.size,
        pricePerSqft: Number(primaryVariant.pricePerSqft),
        thickness: "Standard",
        usage: "Interior / Project",
        look: input.name,
        grade: input.grade || null,
        series: input.series || null,
        warranty: input.warranty || null,
        countryOfOrigin: input.countryOfOrigin || "India",
        hsnCode: input.hsnCode || null,
        gstPercent: input.gstPercent !== undefined && input.gstPercent !== null ? Number(input.gstPercent) : 18,
        inStock: true,
        isBestseller: Boolean(input.isBestseller),
        isNewArrival: Boolean(input.isNew),
        isTrending: Boolean(input.isTrending),
        images: Array.isArray(input.images) && input.images.length > 0 ? input.images : ["/placeholders/product.svg"],
        videos: Array.isArray(input.videos) ? input.videos : [],
        description: input.description,
        shortDescription: input.shortDescription || null,
        mrp: input.mrp !== undefined && input.mrp !== null ? Number(input.mrp) : null,
        rating: input.manualRating !== undefined && input.manualRating !== null ? Number(input.manualRating) : 4.8,
        reviewCount: input.manualReviewCount !== undefined && input.manualReviewCount !== null ? Number(input.manualReviewCount) : 0,
        manualRating: input.manualRating !== undefined && input.manualRating !== null ? Number(input.manualRating) : null,
        manualReviewCount: input.manualReviewCount !== undefined && input.manualReviewCount !== null ? Number(input.manualReviewCount) : null,
        specs: input.specs || null,
        vendorId: input.vendorId || null,
        status: input.status || "active",
        approvalStatus: initialApprovalStatus,
        rejectionReason: input.rejectionReason || null,
        coverageRate: input.coverageRate !== undefined && input.coverageRate !== null ? Number(input.coverageRate) : (primaryVariant.sqftPerBox ? Number(primaryVariant.sqftPerBox) : null),
        piecesPerBox: input.piecesPerBox !== undefined && input.piecesPerBox !== null ? Number(input.piecesPerBox) : (primaryVariant.piecesPerBox ? Number(primaryVariant.piecesPerBox) : null),
        wastageFactor: input.wastageFactor !== undefined && input.wastageFactor !== null ? Number(input.wastageFactor) : 1.1,
        variants: {
          create: (input.variants && input.variants.length > 0 ? input.variants : [primaryVariant]).map((v: any) => ({
            sku: v.sku || null,
            size: v.size || primaryVariant.size || "Standard",
            finish: v.finish || primaryVariant.finish || "Standard",
            color: v.color || "Standard",
            colorHex: v.colorHex || null,
            swatchImage: v.swatchImage || null,
            image: v.image || (input.images?.[0] ?? null),
            unit: v.unit || input.sellingUnit || input.unitOfSale || "box",
            attributeLabel: v.attributeLabel || null,
            attributeValue: v.attributeValue || null,
            variantSpecs: v.variantSpecs || null,
            mrp: v.mrp !== undefined && v.mrp !== null ? Number(v.mrp) : null,
            weightKg: v.weightKg !== undefined && v.weightKg !== null ? Number(v.weightKg) : 2.5,
            pricePerBox: Number(v.pricePerBox || primaryVariant.pricePerBox || 0),
            pricePerSqft: Number(v.pricePerSqft || primaryVariant.pricePerSqft || 0),
            sqftPerBox: Number(v.sqftPerBox || primaryVariant.sqftPerBox || 1),
            piecesPerBox: v.piecesPerBox ? Number(v.piecesPerBox) : 4,
            stockBoxes: Number(v.stockBoxes ?? 50),
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

    safeRevalidate("/shop");
    safeRevalidate(`/shop/${input.categorySlug}`);
    safeRevalidate("/admin/products");
    safeRevalidate("/admin/product-approvals");
    safeRevalidate("/vendor/products");
    safeRevalidate("/");

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

    const createdList: any[] = [];
    const errors: string[] = [];

    for (let idx = 0; idx < inputs.length; idx++) {
      const input = inputs[idx];
      try {
        const baseSlug = (input.slug || input.name)
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)+/g, "");

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
            categoryId: input.categoryId || null,
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
            rating: 4.8,
            reviewCount: 0,
            specs: input.specs || null,
            vendorId: input.vendorId || null,
            status: input.status || "active",
            approvalStatus: input.approvalStatus || (input.vendorId ? "pending" : "approved"),
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

export async function updateProduct(id: string, input: Partial<CreateProductInput>) {
  try {
    const updateData: any = {};
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

    if (input.variants && input.variants.length > 0) {
      await prisma.productVariant.deleteMany({ where: { productId: id } });
      updateData.variants = {
        create: input.variants.map((v) => ({
          sku: v.sku || null,
          size: v.size,
          finish: v.finish,
          color: v.color,
          colorHex: v.colorHex || null,
          swatchImage: v.swatchImage || null,
          image: v.image || null,
          unit: v.unit || null,
          attributeLabel: v.attributeLabel || null,
          attributeValue: v.attributeValue || null,
          variantSpecs: v.variantSpecs || null,
          mrp: v.mrp !== undefined && v.mrp !== null ? Number(v.mrp) : null,
          weightKg: v.weightKg !== undefined && v.weightKg !== null ? Number(v.weightKg) : 2.5,
          pricePerBox: Number(v.pricePerBox),
          pricePerSqft: Number(v.pricePerSqft),
          sqftPerBox: Number(v.sqftPerBox),
          piecesPerBox: v.piecesPerBox ? Number(v.piecesPerBox) : 4,
          stockBoxes: Number(v.stockBoxes ?? 50),
          inStock: true,
        })),
      };
      updateData.finish = input.variants[0].finish;
      updateData.size = input.variants[0].size;
      updateData.pricePerSqft = input.variants[0].pricePerSqft;
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

    safeRevalidate("/shop");
    safeRevalidate(`/shop/${updated.categorySlug}`);
    safeRevalidate(`/product/${updated.slug}`);
    safeRevalidate("/admin/products");
    safeRevalidate("/admin/product-approvals");
    safeRevalidate("/vendor/products");
    safeRevalidate("/");

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

    safeRevalidate("/shop");
    safeRevalidate(`/shop/${existing.categorySlug}`);
    safeRevalidate(`/product/${existing.slug}`);
    safeRevalidate("/admin/products");
    safeRevalidate("/vendor/products");
    safeRevalidate("/");

    return { success: true };
  } catch (error: any) {
    console.error("Error deleting product:", error);
    return { success: false, error: error?.message || "Failed to delete product" };
  }
}

export async function softDeleteProduct(id: string) {
  return deleteProduct(id, { hardDelete: false });
}

export async function hardDeleteProduct(id: string) {
  return deleteProduct(id, { hardDelete: true });
}

