import { NextRequest } from "next/server";
import { cancelOrder } from "@/lib/actions/orders";
import { getAuthenticatedMobileUser, mobileApiResponse, handleMobileCorsOptions } from "@/lib/mobile-auth";

export async function OPTIONS() {
  return handleMobileCorsOptions();
}

/**
 * POST /api/mobile/orders/[id]/cancel
 * Customer cancels order within cancel window.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedMobileUser(req);
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const reason = body.reason || "Cancelled by customer via app";

    const result = await cancelOrder({
      orderId: id,
      reason,
      cancelledBy: "customer",
      userId: user?.id,
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
