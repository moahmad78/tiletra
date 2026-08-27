import { NextRequest } from "next/server";
import { mobileApiResponse, handleMobileCorsOptions } from "@/lib/mobile-auth";
import { toggleVendorProductStatus } from "@/lib/actions/vendor";
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
    const { status } = body;

    if (status !== "active" && status !== "paused") {
      return mobileApiResponse({ success: false, error: "Status must be 'active' or 'paused'" }, 400);
    }

    const res = await toggleVendorProductStatus(auth.vendor.id, id, status);

    if (!res.success) {
      return mobileApiResponse({ success: false, error: res.error || "Failed to toggle status" }, 400);
    }

    return mobileApiResponse({
      success: true,
      product: res.product,
      message: res.message,
    });
  } catch (err: any) {
    console.error("Mobile toggle product status error:", err);
    return mobileApiResponse(
      { success: false, error: err.message || "Failed to toggle product status" },
      500
    );
  }
}
