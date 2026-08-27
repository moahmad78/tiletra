import { NextRequest } from "next/server";
import { mobileApiResponse, handleMobileCorsOptions } from "@/lib/mobile-auth";
import { updateVendorFulfillmentStatus } from "@/lib/actions/vendor";
import { getAuthenticatedVendor } from "../../../dashboard/route";

export async function OPTIONS() {
  return handleMobileCorsOptions();
}

export async function PATCH(
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
    const { status, trackingNumber, courierName, paymentCollected } = body;

    if (!status || typeof status !== "string") {
      return mobileApiResponse({ success: false, error: "Please specify an order status" }, 400);
    }

    const res = await updateVendorFulfillmentStatus(
      id,
      auth.vendor.id,
      status,
      trackingNumber,
      courierName,
      paymentCollected
    );

    if (!res.success) {
      return mobileApiResponse({ success: false, error: res.error || "Failed to update status" }, 400);
    }

    return mobileApiResponse({
      success: true,
      split: res.split,
      message: res.message,
    });
  } catch (err: any) {
    console.error("Mobile vendor order status update error:", err);
    return mobileApiResponse(
      { success: false, error: err.message || "Failed to update order status" },
      500
    );
  }
}
