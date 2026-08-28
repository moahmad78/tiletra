import { NextRequest } from "next/server";
import { getAuthenticatedAdmin, mobileApiResponse, handleMobileCorsOptions } from "@/lib/mobile-auth";
import { updateCategory, deleteCategory } from "@/lib/actions/categories";

export async function OPTIONS() {
  return handleMobileCorsOptions();
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthenticatedAdmin(req);
    if ("error" in auth) {
      return mobileApiResponse({ success: false, error: auth.error }, auth.status);
    }

    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const { name, description, image, parentId, calculatorType } = body;

    const result = await updateCategory(id, {
      name: name ? name.trim() : undefined,
      description: description !== undefined ? description.trim() : undefined,
      image: image !== undefined ? image.trim() : undefined,
      parentId: parentId !== undefined ? parentId : undefined,
      calculatorType: calculatorType !== undefined ? calculatorType : undefined,
    });
    if (!result.success) {
      return mobileApiResponse({ success: false, error: result.error }, 400);
    }

    return mobileApiResponse({
      success: true,
      category: result.category,
      message: "Category updated successfully!",
    });
  } catch (err: any) {
    console.error("Mobile admin update category error:", err);
    return mobileApiResponse(
      { success: false, error: err.message || "Failed to update category" },
      500
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthenticatedAdmin(req);
    if ("error" in auth) {
      return mobileApiResponse({ success: false, error: auth.error }, auth.status);
    }

    const { id } = await params;
    const result = await deleteCategory(id);
    if (!result.success) {
      return mobileApiResponse({ success: false, error: result.error }, 400);
    }

    return mobileApiResponse({
      success: true,
      message: "Category deleted successfully!",
    });
  } catch (err: any) {
    console.error("Mobile admin delete category error:", err);
    return mobileApiResponse(
      { success: false, error: err.message || "Failed to delete category" },
      500
    );
  }
}
