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
    const { trackingNumber, courierName, status } = body;

    if (!trackingNumber && !trackingNumber?.trim()) {
      return mobileApiResponse({ success: false, error: "Tracking number required" }, 400);
    }

    const res = await updatePlatformDeliveryStatus(
      id,
      status || "dispatched",
      trackingNumber,
      courierName
    );

    if (!res.success) {
      return mobileApiResponse({ success: false, error: res.error }, 400);
    }

    return mobileApiResponse({
      success: true,
      message: "Tracking number updated successfully!",
      split: res.split,
    });
  } catch (error: any) {
    console.error("[Mobile Admin Tracking Update Error]", error);
    return mobileApiResponse(
      { success: false, error: error?.message || "Failed to update tracking number" },
      500
    );
  }
}
