import { NextRequest } from "next/server";
import { getAuthenticatedAdmin, mobileApiResponse, handleMobileCorsOptions } from "@/lib/mobile-auth";
import { updateReviewStatus, deleteReview } from "@/lib/actions/reviews";
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
      include: { product: true, user: true },
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
    const { status = "approved" } = body;

    if (!["approved", "rejected", "pending"].includes(status)) {
      return mobileApiResponse({ success: false, error: "Invalid review status" }, 400);
    }

    const res = await updateReviewStatus(id, status);

    if (!res.success) {
      return mobileApiResponse({ success: false, error: res.error }, 400);
    }

    return mobileApiResponse({
      success: true,
      message: `Review ${status === "approved" ? "approved for storefront" : "marked as " + status}!`,
      review: res.review,
    });
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
    const res = await deleteReview(id);

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
