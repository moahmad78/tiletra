import { NextRequest, NextResponse } from "next/server";
import { getPublishedReviewsForProduct } from "@/lib/actions/reviews";
import { handleMobileCorsOptions } from "@/lib/mobile-auth";

export async function OPTIONS() {
  return handleMobileCorsOptions();
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const sort = (searchParams.get("sort") || "newest") as "newest" | "highest" | "lowest";

    const result = await getPublishedReviewsForProduct(id, { page, limit, sort });

    // Format author names for customer privacy ("First L.")
    const formattedReviews = result.reviews.map((r: any) => {
      let authorDisplay = "Verified Buyer";
      if (r.user?.name) {
        const parts = r.user.name.trim().split(" ");
        if (parts.length > 1) {
          authorDisplay = `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`;
        } else {
          authorDisplay = parts[0];
        }
      }

      return {
        id: r.id,
        rating: r.rating,
        title: r.title,
        body: r.body,
        status: r.status,
        author: authorDisplay,
        authorAvatar: r.user?.avatar || null,
        verifiedPurchase: true,
        createdAt: r.createdAt,
        media: r.media || [],
      };
    });

    const responseData = {
      success: true,
      reviews: formattedReviews,
      total: result.total,
      page: result.page,
      totalPages: result.totalPages,
      stats: result.stats,
    };

    const res = NextResponse.json(responseData);
    res.headers.set("Access-Control-Allow-Origin", "*");
    res.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    return res;
  } catch (error: any) {
    console.error("[GET /api/products/:id/reviews Error]", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to fetch product reviews" },
      { status: 500 }
    );
  }
}
