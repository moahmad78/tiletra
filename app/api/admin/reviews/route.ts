import { NextRequest, NextResponse } from "next/server";
import { getAdminReviews } from "@/lib/actions/reviews";
import { checkIsAdmin } from "@/lib/server-auth";
import { getAuthenticatedMobileUser } from "@/lib/mobile-auth";

export async function GET(req: NextRequest) {
  try {
    const isWebAdmin = await checkIsAdmin();
    const mobileUser = await getAuthenticatedMobileUser(req);
    const isMobileAdmin =
      mobileUser && (mobileUser.role === "admin" || mobileUser.role === "superadmin");

    if (!isWebAdmin && !isMobileAdmin) {
      return NextResponse.json({ success: false, error: "Access denied" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "all";
    const productId = searchParams.get("productId") || undefined;
    const search = searchParams.get("search") || undefined;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    const result = await getAdminReviews({ status, productId, search, page, limit });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error("[GET /api/admin/reviews Error]", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to fetch reviews" },
      { status: 500 }
    );
  }
}
