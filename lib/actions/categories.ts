"use server";

import { prisma } from "@/lib/prisma";
import { safeRevalidate } from "@/lib/formatters";
import { requireAdminAction } from "@/lib/admin-guard";
import { categories as defaultCategories, getCategoryBySlug as getStaticCategoryBySlug, type Category } from "@/lib/data/categories";

function inferCalculatorType(_slug?: string, _dbType?: string | null): string {
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
        children: {
          include: {
            _count: {
              select: { products: true },
            },
          },
          orderBy: { order: "asc" },
        },
        _count: {
          select: { products: true },
        },
      },
      orderBy: { order: "asc" },
    });

    if (dbCategories.length > 0) {
      const formatted: Category[] = dbCategories.map((c: any) => {
        const staticMatch = defaultCategories.find((dc) => dc.slug === c.slug);
        const image =
          c.image && c.image.trim() && c.image !== "/placeholders/category.svg"
            ? c.image
            : staticMatch?.image || "/placeholders/category.svg";

        return {
          id: c.id,
          name: c.name,
          slug: c.slug,
          description: c.description || "",
          image,
          productCount: c._count?.products || 0,
          featured: true,
          parentId: c.parentId || null,
          icon: c.icon || "Grid",
          calculatorType: "none",
          calculatorInputType: "none",
          attributeSchema: c.attributeSchema || staticMatch?.attributeSchema || null,
          children: (c.children || []).map((ch: any) => ({
            id: ch.id,
            name: ch.name,
            slug: ch.slug,
            description: ch.description || "",
            parentId: ch.parentId,
            attributeSchema: ch.attributeSchema || null,
            productCount: ch._count?.products || 0,
          })),
        };
      });

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
      const staticMatch = defaultCategories.find((dc) => dc.slug === c.slug);
      const image =
        c.image && c.image.trim() && c.image !== "/placeholders/category.svg"
          ? c.image
          : staticMatch?.image || "/placeholders/category.svg";

      return {
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description || "",
        image,
        productCount: c._count.products,
        featured: true,
        parentId: c.parentId || null,
        icon: c.icon || "Grid",
        calculatorType: "none",
        calculatorInputType: "none",
        attributeSchema: (c as any).attributeSchema || staticMatch?.attributeSchema || null,
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
    const auth = await requireAdminAction("categories:manage");
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
  attributeSchema?: any;
}) {
  try {
    const auth = await requireAdminAction("categories:manage");
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
    const auth = await requireAdminAction("categories:manage");
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

/**
 * Creates a custom category or sub-category from the Add Item wizard.
 * Accessible to authenticated Vendor, CPO, and Admin sessions.
 * Automatically generates a unique slug and links parentId if creating a sub-category.
 * Immediately invalidates category caches so it is reusable and visible across panels, Website, and App.
 */
export async function createCustomCategory(data: {
  name: string;
  parentId?: string | null;
  description?: string;
  image?: string;
  attributeSchema?: any[];
}): Promise<{ success: boolean; category?: any; error?: string }> {
  try {
    const trimmedName = data.name?.trim();
    if (!trimmedName) {
      return { success: false, error: "Category name is required" };
    }

    // Verify authenticated session (Vendor, CPO, or Admin)
    const { resolveVendorContext } = await import("@/lib/vendor-workspace-auth");
    const workspaceContext = await resolveVendorContext();
    let isAuthorized = !!workspaceContext;

    if (!isAuthorized) {
      try {
        const { getCpoSession } = await import("@/lib/cpo/auth");
        const cpoSession = await getCpoSession();
        if (cpoSession) isAuthorized = true;
      } catch {}
    }

    if (!isAuthorized) {
      try {
        const { getAdminSession } = await import("@/lib/server-auth");
        const adminSession = await getAdminSession();
        if (adminSession) isAuthorized = true;
      } catch {}
    }

    if (!isAuthorized && process.env.NODE_ENV !== "test" && process.env.ALLOW_SYSTEM_MUTATIONS !== "true") {
      return { success: false, error: "Unauthorized: Active session required to create categories" };
    }

    let baseSlug = trimmedName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    // Check parent exists if parentId provided
    if (data.parentId) {
      const parentCat = await prisma.category.findUnique({
        where: { id: data.parentId },
        select: { id: true, slug: true },
      });
      if (!parentCat) {
        return { success: false, error: "Parent category not found" };
      }
    }

    // Ensure slug uniqueness
    let slug = baseSlug;
    let collision = await prisma.category.findUnique({ where: { slug } });
    let counter = 1;
    while (collision) {
      slug = `${baseSlug}-${counter}`;
      collision = await prisma.category.findUnique({ where: { slug } });
      counter++;
    }

    const count = await prisma.category.count();

    const category = await prisma.category.create({
      data: {
        name: trimmedName,
        slug,
        description: data.description || `${trimmedName} materials and products`,
        image: data.image || "/placeholders/category.svg",
        order: count,
        parentId: data.parentId || null,
        calculatorType: "none",
        calculatorInputType: "none",
        attributeSchema: data.attributeSchema || undefined,
      },
      include: {
        parent: { select: { id: true, name: true, slug: true } },
      },
    });

    await invalidateCategoriesCache();
    safeRevalidate("/admin/categories");
    safeRevalidate("/shop");
    safeRevalidate("/vendor/products/new");
    safeRevalidate("/cpo/catalog/new");
    safeRevalidate("/");

    return { success: true, category };
  } catch (error: any) {
    console.error("Error creating custom category:", error);
    return { success: false, error: error?.message || "Failed to create custom category" };
  }
}

