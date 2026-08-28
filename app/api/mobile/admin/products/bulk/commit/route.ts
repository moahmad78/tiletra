import { NextRequest } from "next/server";
import { getAuthenticatedAdmin, mobileApiResponse, handleMobileCorsOptions } from "@/lib/mobile-auth";
import { createProductsBulk } from "@/lib/actions/products";

export async function OPTIONS() {
  return handleMobileCorsOptions();
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthenticatedAdmin(req);
    if ("error" in auth) {
      return mobileApiResponse({ success: false, error: auth.error }, auth.status);
    }

    const body = await req.json().catch(() => ({}));
    const products = body.products || [];

    if (!Array.isArray(products) || products.length === 0) {
      return mobileApiResponse({ success: false, error: "No products provided for commit" }, 400);
    }

    const res = await createProductsBulk(products);

    if (!res.success) {
      return mobileApiResponse({ success: false, error: res.error, errors: res.errors }, 400);
    }

    return mobileApiResponse({
      success: true,
      count: res.count,
      message: res.message || `Successfully imported ${res.count} products to the catalog!`,
    });
  } catch (error: any) {
    console.error("[Mobile Admin Bulk Commit Error]", error);
    return mobileApiResponse(
      { success: false, error: error?.message || "Failed to commit bulk products" },
      500
    );
  }
}
