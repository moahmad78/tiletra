import { NextRequest } from "next/server";
import { cancelOrder, rejectVendorOrderSplit } from "@/lib/actions/orders";
import { mobileApiResponse, handleMobileCorsOptions } from "@/lib/mobile-auth";
import { getAuthenticatedVendor } from "../../../dashboard/route";

export async function OPTIONS() {
  return handleMobileCorsOptions();
}

/**
 * POST /api/mobile/vendor/orders/[id]/cancel
 * Vendor cancels or rejects an order/split with a required reason.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthenticatedVendor(req);
    if ("error" in auth) {
      return mobileApiResponse({ success: false, error: auth.error }, auth.status as any);
    }

    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const { reason, isSplitReject, splitId } = body;

    if (!reason || typeof reason !== "string" || reason.trim().length === 0) {
      return mobileApiResponse({ success: false, error: "Reason is required for vendor cancellation" }, 400);
    }

    // If rejecting a specific split
    if (isSplitReject && splitId) {
      const result = await rejectVendorOrderSplit({
        splitId,
        vendorId: auth.vendor.id,
        reason: reason.trim(),
      });
      if (!result.success) {
        return mobileApiResponse({ success: false, error: result.error }, 400);
      }
      return mobileApiResponse(result);
    }

    // Cancel order
    const result = await cancelOrder({
      orderId: id,
      reason: reason.trim(),
      cancelledBy: "vendor",
      vendorId: auth.vendor.id,
    });

    if (!result.success) {
      return mobileApiResponse({ success: false, error: result.error }, 400);
    }

    return mobileApiResponse({
      success: true,
      message: result.message,
      order: result.order,
      refundStatus: result.refundStatus,
    });
  } catch (err: any) {
    return mobileApiResponse({ success: false, error: err.message || "Failed to cancel order" }, 500);
  }
}
