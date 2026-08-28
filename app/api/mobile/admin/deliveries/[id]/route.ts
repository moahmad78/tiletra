import { NextRequest } from "next/server";
import { getAuthenticatedAdmin, mobileApiResponse, handleMobileCorsOptions } from "@/lib/mobile-auth";
import { updatePlatformDeliveryStatus } from "@/lib/actions/vendor";

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
    const { fulfillmentStatus, trackingNumber, courierName, paymentCollected } = body;

    if (!fulfillmentStatus && trackingNumber === undefined && courierName === undefined && paymentCollected === undefined) {
      return mobileApiResponse({ success: false, error: "No update parameters provided" }, 400);
    }

    const res = await updatePlatformDeliveryStatus(
      id,
      fulfillmentStatus || "picked_up",
      trackingNumber,
      courierName,
      paymentCollected
    );

    if (!res.success) {
      return mobileApiResponse({ success: false, error: res.error }, 400);
    }

    return mobileApiResponse({
      success: true,
      message: res.message || "Platform delivery updated successfully!",
      split: res.split,
    });
  } catch (error: any) {
    console.error("[Mobile Admin Delivery Update Error]", error);
    return mobileApiResponse(
      { success: false, error: error?.message || "Failed to update platform delivery" },
      500
    );
  }
}
