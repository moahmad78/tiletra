import { NextRequest } from "next/server";
import { getAuthenticatedAdmin, mobileApiResponse, handleMobileCorsOptions } from "@/lib/mobile-auth";
import { getAdminReviews } from "@/lib/actions/reviews";

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
    const search = searchParams.get("search")?.toLowerCase().trim() || undefined;
    const status = searchParams.get("status") || "all";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    const result = await getAdminReviews({ status, search, page, limit });

    return mobileApiResponse({
      success: true,
      reviews: result.reviews,
      total: result.total,
      counts: result.counts,
    });
  } catch (error: any) {
    console.error("[Mobile Admin Reviews List Error]", error);
    return mobileApiResponse(
      { success: false, error: error?.message || "Failed to fetch reviews" },
      500
    );
  }
}
