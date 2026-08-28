import { NextRequest } from "next/server";
import { getAuthenticatedAdmin, mobileApiResponse, handleMobileCorsOptions } from "@/lib/mobile-auth";
import { getCategories, createCategory } from "@/lib/actions/categories";

export async function OPTIONS() {
  return handleMobileCorsOptions();
}

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthenticatedAdmin(req);
    if ("error" in auth) {
      return mobileApiResponse({ success: false, error: auth.error }, auth.status);
    }

    const categories = await getCategories();
    return mobileApiResponse({
      success: true,
      categories,
      count: categories.length,
    });
  } catch (err: any) {
    console.error("Mobile admin categories list error:", err);
    return mobileApiResponse(
      { success: false, error: err.message || "Failed to fetch categories" },
      500
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthenticatedAdmin(req);
    if ("error" in auth) {
      return mobileApiResponse({ success: false, error: auth.error }, auth.status);
    }

    const body = await req.json().catch(() => ({}));
    const { name, slug, description, image, parentId, calculatorType } = body;

    if (!name || !name.trim()) {
      return mobileApiResponse({ success: false, error: "Category name is required" }, 400);
    }

    const result = await createCategory({
      name: name.trim(),
      slug: slug ? slug.trim() : undefined,
      description: description ? description.trim() : undefined,
      image: image ? image.trim() : undefined,
      parentId: parentId || null,
      calculatorType: calculatorType || "none",
    });
    if (!result.success) {
      return mobileApiResponse({ success: false, error: result.error }, 400);
    }

    return mobileApiResponse({
      success: true,
      category: result.category,
      message: "Category created successfully!",
    });
  } catch (err: any) {
    console.error("Mobile admin create category error:", err);
    return mobileApiResponse(
      { success: false, error: err.message || "Failed to create category" },
      500
    );
  }
}
