import { NextRequest } from "next/server";
import { getAuthenticatedAdmin, mobileApiResponse, handleMobileCorsOptions } from "@/lib/mobile-auth";
import { approveProduct, rejectProduct } from "@/lib/actions/admin-vendor";

export async function OPTIONS() {
  return handleMobileCorsOptions();
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
    const { action, reason } = body;

    if (action === "approve") {
      const res = await approveProduct(id);
      if (!res.success) {
        return mobileApiResponse({ success: false, error: res.error }, 400);
      }
      return mobileApiResponse({
        success: true,
        message: res.message || "Product approved and live on storefront!",
        product: res.product,
      });
    }

    if (action === "reject") {
      if (!reason || !reason.trim()) {
        return mobileApiResponse({ success: false, error: "Rejection reason is required" }, 400);
      }
      const res = await rejectProduct(id, reason.trim());
      if (!res.success) {
        return mobileApiResponse({ success: false, error: res.error }, 400);
      }
      return mobileApiResponse({
        success: true,
        message: res.message || "Product rejected with seller feedback.",
        product: res.product,
      });
    }

    return mobileApiResponse({ success: false, error: "Invalid action. Use 'approve' or 'reject'." }, 400);
  } catch (error: any) {
    console.error("[Mobile Admin Product Approval Action Error]", error);
    return mobileApiResponse(
      { success: false, error: error?.message || "Failed to update product approval status" },
      500
    );
  }
}
