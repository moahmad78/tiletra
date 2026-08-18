"use server";

import { prisma } from "@/lib/prisma";
import { safeRevalidate } from "@/lib/formatters";
import { categories as defaultCategories, getCategoryBySlug as getStaticCategoryBySlug, type Category } from "@/lib/data/categories";

export async function getCategories(): Promise<Category[]> {
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
      return dbCategories.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description || "",
        image: c.image || "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&q=80",
        productCount: c._count.products,
        featured: true,
        parentId: c.parentId || null,
        icon: c.icon || "Grid",
      }));
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
        image: c.image || "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&q=80",
        productCount: c._count.products,
        featured: true,
        parentId: c.parentId || null,
        icon: c.icon || "Grid",
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
}) {
  try {
    const slug = data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    const count = await prisma.category.count();

    const category = await prisma.category.create({
      data: {
        name: data.name,
        slug,
        description: data.description || "",
        image: data.image || "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&q=80",
        order: count,
        parentId: data.parentId || null,
      },
    });

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
}) {
  try {
    const category = await prisma.category.update({
      where: { id },
      data,
    });

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
    await prisma.category.delete({ where: { id } });

    safeRevalidate("/admin/categories");
    safeRevalidate("/shop");
    safeRevalidate("/");

    return { success: true };
  } catch (error: any) {
    console.error("Error deleting category:", error);
    return { success: false, error: error?.message || "Failed to delete category" };
  }
}
