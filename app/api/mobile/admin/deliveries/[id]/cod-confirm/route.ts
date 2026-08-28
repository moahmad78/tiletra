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
    const { paymentCollected = true, status } = body;

    const res = await updatePlatformDeliveryStatus(
      id,
      status || "delivered",
      undefined,
      undefined,
      Boolean(paymentCollected)
    );

    if (!res.success) {
      return mobileApiResponse({ success: false, error: res.error }, 400);
    }

    return mobileApiResponse({
      success: true,
      message: "COD cash collection confirmed successfully!",
      split: res.split,
    });
  } catch (error: any) {
    console.error("[Mobile Admin COD Confirm Error]", error);
    return mobileApiResponse(
      { success: false, error: error?.message || "Failed to confirm COD collection" },
      500
    );
  }
}
