import { NextRequest } from "next/server";
import { getAuthenticatedAdmin, mobileApiResponse, handleMobileCorsOptions } from "@/lib/mobile-auth";
import { getReviews } from "@/lib/actions/reviews";
import { prisma } from "@/lib/prisma";

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
    const search = searchParams.get("search")?.toLowerCase().trim() || "";
    const status = searchParams.get("status") || "all";

    const allReviews = await prisma.review.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            images: true,
            pricePerSqft: true,
            mrp: true,
            categoryName: true,
          },
        },
      },
    });

    const filtered = allReviews.filter((r: any) => {
      const matchesStatus = status === "all" || r.status === status;
      const matchesSearch =
        !search ||
        r.productName?.toLowerCase().includes(search) ||
        r.product?.name?.toLowerCase().includes(search) ||
        r.author?.toLowerCase().includes(search) ||
        r.comment?.toLowerCase().includes(search) ||
        r.city?.toLowerCase().includes(search);

      return matchesStatus && matchesSearch;
    });

    const pendingCount = allReviews.filter((r: any) => r.status === "pending").length;
    const approvedCount = allReviews.filter((r: any) => r.status === "approved").length;
    const rejectedCount = allReviews.filter((r: any) => r.status === "rejected").length;

    return mobileApiResponse({
      success: true,
      reviews: filtered,
      total: allReviews.length,
      counts: {
        all: allReviews.length,
        pending: pendingCount,
        approved: approvedCount,
        rejected: rejectedCount,
      },
    });
  } catch (error: any) {
    console.error("[Mobile Admin Reviews List Error]", error);
    return mobileApiResponse(
      { success: false, error: error?.message || "Failed to fetch reviews" },
      500
    );
  }
}
