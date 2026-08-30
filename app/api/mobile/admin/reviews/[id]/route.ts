import { NextRequest } from "next/server";
import { getAuthenticatedAdmin, mobileApiResponse, handleMobileCorsOptions } from "@/lib/mobile-auth";
import { hideReviewByAdmin, restoreReviewByAdmin, deleteReviewAction } from "@/lib/actions/reviews";
import { prisma } from "@/lib/prisma";

export async function OPTIONS() {
  return handleMobileCorsOptions();
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthenticatedAdmin(req);
    if ("error" in auth) {
      return mobileApiResponse({ success: false, error: auth.error }, auth.status);
    }

    const { id } = await params;
    const review = await prisma.review.findUnique({
      where: { id },
      include: {
        product: true,
        user: { select: { id: true, name: true, phone: true, email: true, avatar: true } },
        order: true,
        media: true,
      },
    });

    if (!review) {
      return mobileApiResponse({ success: false, error: "Review not found" }, 404);
    }

    return mobileApiResponse({ success: true, review });
  } catch (error: any) {
    console.error("[Mobile Admin Review Get Error]", error);
    return mobileApiResponse(
      { success: false, error: error?.message || "Failed to fetch review" },
      500
    );
  }
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
    const { status, hiddenReason } = body;

    const normalizedStatus = (status || "").toUpperCase();

    if (normalizedStatus === "HIDDEN" || status === "rejected") {
      if (!hiddenReason || !hiddenReason.trim()) {
        return mobileApiResponse(
          { success: false, error: "hiddenReason is required when hiding a review." },
          400
        );
      }
      const res = await hideReviewByAdmin(id, hiddenReason);
      return mobileApiResponse(res);
    } else if (normalizedStatus === "PUBLISHED" || status === "approved") {
      const res = await restoreReviewByAdmin(id);
      return mobileApiResponse(res);
    } else {
      return mobileApiResponse(
        { success: false, error: "Invalid review status. Use 'PUBLISHED' or 'HIDDEN'." },
        400
      );
    }
  } catch (error: any) {
    console.error("[Mobile Admin Review Update Error]", error);
    return mobileApiResponse(
      { success: false, error: error?.message || "Failed to update review" },
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
    const res = await deleteReviewAction(id);

    if (!res.success) {
      return mobileApiResponse({ success: false, error: res.error }, 400);
    }

    return mobileApiResponse({
      success: true,
      message: "Review permanently deleted!",
    });
  } catch (error: any) {
    console.error("[Mobile Admin Review Delete Error]", error);
    return mobileApiResponse(
      { success: false, error: error?.message || "Failed to delete review" },
      500
    );
  }
}
