import { NextRequest } from "next/server";
import { getAuthenticatedAdmin, mobileApiResponse, handleMobileCorsOptions } from "@/lib/mobile-auth";
import { getAdminPendingProducts } from "@/lib/actions/admin-vendor";

export async function OPTIONS() {
  return handleMobileCorsOptions();
}

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthenticatedAdmin(req);
    if ("error" in auth) {
      return mobileApiResponse({ success: false, error: auth.error }, auth.status);
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() || "";

    const pendingProducts = await getAdminPendingProducts({ search });

    return mobileApiResponse({
      success: true,
      products: pendingProducts,
      count: pendingProducts.length,
    });
  } catch (error: any) {
    console.error("[Mobile Admin Product Approvals Error]", error);
    return mobileApiResponse(
      { success: false, error: error?.message || "Failed to fetch pending products" },
      500
    );
  }
}
