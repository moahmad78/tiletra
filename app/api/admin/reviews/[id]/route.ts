import { NextRequest, NextResponse } from "next/server";
import { hideReviewByAdmin, restoreReviewByAdmin, deleteReviewAction } from "@/lib/actions/reviews";
import { checkIsAdmin } from "@/lib/server-auth";
import { getAuthenticatedMobileUser } from "@/lib/mobile-auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isWebAdmin = await checkIsAdmin();
    const mobileUser = await getAuthenticatedMobileUser(req);
    const isMobileAdmin =
      mobileUser && (mobileUser.role === "admin" || mobileUser.role === "superadmin");

    if (!isWebAdmin && !isMobileAdmin) {
      return NextResponse.json({ success: false, error: "Access denied" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { status, hiddenReason } = body;

    const normalizedStatus = (status || "").toUpperCase();

    if (normalizedStatus === "HIDDEN") {
      if (!hiddenReason || !hiddenReason.trim()) {
        return NextResponse.json(
          { success: false, error: "hiddenReason is required when hiding a review." },
          { status: 400 }
        );
      }
      const res = await hideReviewByAdmin(id, hiddenReason);
      return NextResponse.json(res);
    } else if (normalizedStatus === "PUBLISHED") {
      const res = await restoreReviewByAdmin(id);
      return NextResponse.json(res);
    } else {
      return NextResponse.json(
        { success: false, error: "Status must be either 'PUBLISHED' or 'HIDDEN'." },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error("[PATCH /api/admin/reviews/:id Error]", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to update review" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isWebAdmin = await checkIsAdmin();
    const mobileUser = await getAuthenticatedMobileUser(req);
    const isMobileAdmin =
      mobileUser && (mobileUser.role === "admin" || mobileUser.role === "superadmin");

    if (!isWebAdmin && !isMobileAdmin) {
      return NextResponse.json({ success: false, error: "Access denied" }, { status: 403 });
    }

    const { id } = await params;
    const res = await deleteReviewAction(id);
    return NextResponse.json(res);
  } catch (error: any) {
    console.error("[DELETE /api/admin/reviews/:id Error]", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to delete review" },
      { status: 500 }
    );
  }
}
