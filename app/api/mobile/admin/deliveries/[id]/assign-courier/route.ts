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
    const { courierName, trackingNumber, status } = body;

    if (!courierName && !trackingNumber) {
      return mobileApiResponse({ success: false, error: "Courier name or tracking number required" }, 400);
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
      message: `Courier "${courierName || 'Partner'}" assigned successfully!`,
      split: res.split,
    });
  } catch (error: any) {
    console.error("[Mobile Admin Assign Courier Error]", error);
    return mobileApiResponse(
      { success: false, error: error?.message || "Failed to assign courier" },
      500
    );
  }
}
