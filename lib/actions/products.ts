"use server";

import { prisma } from "@/lib/prisma";
import type { Product } from "@/lib/data/products";
import { formatProduct, safeRevalidate } from "@/lib/formatters";

export type CreateProductInput = {
  name: string;
  slug?: string;
  categorySlug: string;
  categoryName?: string;
  material: string;
  description: string;
  images: string[];
  unitOfSale?: string;
  attributes?: { key: string; value: string }[];
  variants: {
    size: string;
    finish: any;
    color: string;
    pricePerBox: number;
    pricePerSqft: number;
    sqftPerBox: number;
    stockBoxes?: number;
  }[];
  isBestseller?: boolean;
  isNew?: boolean;
  isTrending?: boolean;
  manualRating?: number | null;
  manualReviewCount?: number | null;
  specs?: any;
};

export async function getProducts(options?: {
  categorySlug?: string;
  isTrending?: boolean;
  isBestseller?: boolean;
  isNewArrival?: boolean;
  search?: string;
  limit?: number;
  inStockOnly?: boolean;
}): Promise<Product[]> {
  try {
    const where: any = {};

    if (options?.categorySlug && options.categorySlug !== "all") {
      where.categorySlug = options.categorySlug;
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
      where.OR = [
        { name: { contains: options.search, mode: "insensitive" } },
        { description: { contains: options.search, mode: "insensitive" } },
        { categoryName: { contains: options.search, mode: "insensitive" } },
        { material: { contains: options.search, mode: "insensitive" } },
      ];
    }

    const dbProducts = await prisma.product.findMany({
      where,
      include: {
        variants: true,
        attributes: true,
      },
      orderBy: { createdAt: "desc" },
      take: options?.limit,
    });

    return dbProducts.map(formatProduct);
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  try {
    const dbProduct = await prisma.product.findUnique({
      where: { slug },
      include: {
        variants: true,
        attributes: true,
      },
    });

    if (!dbProduct) return null;
    return formatProduct(dbProduct);
  } catch (error) {
    console.error(`Error fetching product by slug ${slug}:`, error);
    return null;
  }
}

export async function getProductById(id: string): Promise<Product | null> {
  try {
    const dbProduct = await prisma.product.findUnique({
      where: { id },
      include: {
        variants: true,
        attributes: true,
      },
    });

    if (!dbProduct) return null;
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

    const primaryVariant = input.variants[0] || {
      size: "Standard",
      finish: "Standard",
      pricePerBox: 1000,
      pricePerSqft: 50,
      sqftPerBox: 20,
    };

    const cat = await prisma.category.findUnique({ where: { slug: input.categorySlug } });

    const newProduct = await prisma.product.create({
      data: {
        name: input.name,
        slug,
        categoryId: cat?.id || null,
        categorySlug: input.categorySlug,
        categoryName: cat?.name || "General",
        material: input.material,
        unitOfSale: input.unitOfSale || "box",
        finish: primaryVariant.finish,
        size: primaryVariant.size,
        pricePerSqft: Number(primaryVariant.pricePerSqft),
        thickness: "Standard",
        usage: "Interior / Project",
        look: input.name,
        inStock: true,
        isBestseller: Boolean(input.isBestseller),
        isNewArrival: Boolean(input.isNew),
        isTrending: Boolean(input.isTrending),
        images: input.images.length > 0 ? input.images : ["https://images.unsplash.com/photo-1615529182904-14819c35db37?w=800&q=80"],
        description: input.description,
        rating: input.manualRating !== undefined && input.manualRating !== null ? Number(input.manualRating) : 4.8,
        reviewCount: input.manualReviewCount !== undefined && input.manualReviewCount !== null ? Number(input.manualReviewCount) : 0,
        manualRating: input.manualRating !== undefined && input.manualRating !== null ? Number(input.manualRating) : null,
        manualReviewCount: input.manualReviewCount !== undefined && input.manualReviewCount !== null ? Number(input.manualReviewCount) : null,
        specs: input.specs || null,
        variants: {
          create: input.variants.map((v) => ({
            size: v.size,
            finish: v.finish,
            color: v.color,
            pricePerBox: Number(v.pricePerBox),
            pricePerSqft: Number(v.pricePerSqft),
            sqftPerBox: Number(v.sqftPerBox),
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
      },
      include: {
        variants: true,
        attributes: true,
      },
    });

    safeRevalidate("/shop");
    safeRevalidate(`/shop/${input.categorySlug}`);
    safeRevalidate("/admin/products");
    safeRevalidate("/");

    return { success: true, product: formatProduct(newProduct) };
  } catch (error: any) {
    console.error("Error creating product:", error);
    return { success: false, error: error?.message || "Failed to create product" };
  }
}

export async function updateProduct(id: string, input: Partial<CreateProductInput>) {
  try {
    const updateData: any = {};
    if (input.name) updateData.name = input.name;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.unitOfSale) updateData.unitOfSale = input.unitOfSale;
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

    if (input.variants && input.variants.length > 0) {
      await prisma.productVariant.deleteMany({ where: { productId: id } });
      updateData.variants = {
        create: input.variants.map((v) => ({
          size: v.size,
          finish: v.finish,
          color: v.color,
          pricePerBox: Number(v.pricePerBox),
          pricePerSqft: Number(v.pricePerSqft),
          sqftPerBox: Number(v.sqftPerBox),
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

    const updated = await prisma.product.update({
      where: { id },
      data: updateData,
      include: { variants: true, attributes: true },
    });

    safeRevalidate("/shop");
    safeRevalidate(`/shop/${updated.categorySlug}`);
    safeRevalidate(`/product/${updated.slug}`);
    safeRevalidate("/admin/products");
    safeRevalidate("/");

    return { success: true, product: formatProduct(updated) };
  } catch (error: any) {
    console.error("Error updating product:", error);
    return { success: false, error: error?.message || "Failed to update product" };
  }
}

export async function deleteProduct(id: string) {
  try {
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) return { success: false, error: "Product not found" };

    await prisma.product.delete({ where: { id } });

    safeRevalidate("/shop");
    safeRevalidate(`/shop/${existing.categorySlug}`);
    safeRevalidate("/admin/products");
    safeRevalidate("/");

    return { success: true };
  } catch (error: any) {
    console.error("Error deleting product:", error);
    return { success: false, error: error?.message || "Failed to delete product" };
  }
}
