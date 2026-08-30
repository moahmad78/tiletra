import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { syncProductRatingAggregate, revalidateReviewPaths } from "@/lib/reviews-server";
import { handleMobileCorsOptions } from "@/lib/mobile-auth";

export async function OPTIONS() {
  return handleMobileCorsOptions();
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getAuthenticatedUser(req);

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required." },
        { status: 401 }
      );
    }

    const review = await prisma.review.findUnique({
      where: { id },
      include: {
        product: { select: { id: true, slug: true } },
      },
    });

    if (!review) {
      return NextResponse.json(
        { success: false, error: "Review not found." },
        { status: 404 }
      );
    }

    if (review.userId !== user.id && user.role !== "admin" && user.role !== "superadmin") {
      return NextResponse.json(
        { success: false, error: "You are not authorized to delete this review." },
        { status: 403 }
      );
    }

    await prisma.review.delete({
      where: { id },
    });

    const updatedStats = await syncProductRatingAggregate(review.productId);
    revalidateReviewPaths(review.productId, review.product?.slug);

    const res = NextResponse.json({
      success: true,
      stats: updatedStats,
      message: "Review deleted successfully.",
    });

    res.headers.set("Access-Control-Allow-Origin", "*");
    res.headers.set("Access-Control-Allow-Methods", "DELETE, OPTIONS");
    res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-User-Id");
    return res;
  } catch (error: any) {
    console.error("[DELETE /api/reviews/:id Error]", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to delete review" },
      { status: 500 }
    );
  }
}
