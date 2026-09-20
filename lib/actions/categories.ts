"use server";

import { prisma } from "@/lib/prisma";
import { safeRevalidate } from "@/lib/formatters";
import { requireAdminAction } from "@/lib/admin-guard";
import { categories as defaultCategories, getCategoryBySlug as getStaticCategoryBySlug, type Category } from "@/lib/data/categories";

function inferCalculatorType(slug: string, dbType?: string | null): string {
  const s = slug.toLowerCase();
  const isTileStoneOrGranite =
    s.includes("tile") ||
    s.includes("stone") ||
    s.includes("granite") ||
    s.includes("marble");

  if (isTileStoneOrGranite) {
    return dbType && dbType !== "none" ? dbType : "area_to_boxes";
  }

  return "none";
}

let cachedCategories: { data: Category[]; timestamp: number } | null = null;
const CATEGORIES_CACHE_TTL = 1000 * 60 * 5; // 5 minutes in-memory cache

export async function invalidateCategoriesCache(): Promise<void> {
  cachedCategories = null;
}

export async function getCategories(): Promise<Category[]> {
  const now = Date.now();
  if (cachedCategories && now - cachedCategories.timestamp < CATEGORIES_CACHE_TTL) {
    return cachedCategories.data;
  }

  try {
    const dbCategories = await prisma.category.findMany({
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: { order: "asc" },
    });

    if (dbCategories.length > 0) {
      const formatted: Category[] = dbCategories.map((c: any) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description || "",
        image: c.image || "/placeholders/category.svg",
        productCount: c._count.products,
        featured: true,
        parentId: c.parentId || null,
        icon: c.icon || "Grid",
        calculatorType: inferCalculatorType(c.slug, c.calculatorType),
        calculatorInputType: c.calculatorInputType || "area",
      }));

      cachedCategories = { data: formatted, timestamp: now };
      return formatted;
    }
  } catch (error) {
    console.error("Error fetching categories from DB, falling back to static catalog:", error);
  }

  return defaultCategories;
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  try {
    const c = await prisma.category.findUnique({
      where: { slug },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    if (c) {
      return {
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description || "",
        image: c.image || "/placeholders/category.svg",
        productCount: c._count.products,
        featured: true,
        parentId: c.parentId || null,
        icon: c.icon || "Grid",
        calculatorType: inferCalculatorType(c.slug, (c as any).calculatorType),
        calculatorInputType: (c as any).calculatorInputType || "area",
      };
    }
  } catch (error) {
    console.error(`Error fetching category by slug ${slug} from DB:`, error);
  }

  // Fallback to static category helper (resolves aliases like floor-tiles -> tiles-stone)
  const staticCat = getStaticCategoryBySlug(slug);
  return staticCat || null;
}

export async function createCategory(data: {
  name: string;
  slug?: string;
  description?: string;
  image?: string;
  parentId?: string | null;
  calculatorType?: string;
  calculatorInputType?: "area" | "length" | "none";
}) {
  try {
    const auth = await requireAdminAction();
    if (!auth.authorized) return { success: false, error: auth.error || "Unauthorized" };
    const slug = data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    const count = await prisma.category.count();

    const category = await prisma.category.create({
      data: {
        name: data.name,
        slug,
        description: data.description || "",
        image: data.image || "/placeholders/product.svg",
        order: count,
        parentId: data.parentId || null,
        calculatorType: data.calculatorType || "none",
        calculatorInputType: data.calculatorInputType || "area",
      },
    });

    await invalidateCategoriesCache();
    safeRevalidate("/admin/categories");
    safeRevalidate("/shop");
    safeRevalidate("/");

    return { success: true, category };
  } catch (error: any) {
    console.error("Error creating category:", error);
    return { success: false, error: error?.message || "Failed to create category" };
  }
}

export async function updateCategory(id: string, data: {
  name?: string;
  description?: string;
  image?: string;
  parentId?: string | null;
  calculatorType?: string;
  calculatorInputType?: "area" | "length" | "none";
}) {
  try {
    const auth = await requireAdminAction();
    if (!auth.authorized) return { success: false, error: auth.error || "Unauthorized" };
    const category = await prisma.category.update({
      where: { id },
      data,
    });

    await invalidateCategoriesCache();
    safeRevalidate("/admin/categories");
    safeRevalidate("/shop");
    safeRevalidate(`/shop/${category.slug}`);
    safeRevalidate("/");

    return { success: true, category };
  } catch (error: any) {
    console.error("Error updating category:", error);
    return { success: false, error: error?.message || "Failed to update category" };
  }
}

export async function deleteCategory(id: string) {
  try {
    const auth = await requireAdminAction();
    if (!auth.authorized) return { success: false, error: auth.error || "Unauthorized" };
    await prisma.category.delete({ where: { id } });

    await invalidateCategoriesCache();
    safeRevalidate("/admin/categories");
    safeRevalidate("/shop");
    safeRevalidate("/");

    return { success: true };
  } catch (error: any) {
    console.error("Error deleting category:", error);
    return { success: false, error: error?.message || "Failed to delete category" };
  }
}
