import { NextRequest } from "next/server";
import { mobileApiResponse, handleMobileCorsOptions } from "@/lib/mobile-auth";
import { getVendorOrders } from "@/lib/actions/vendor";
import { getAuthenticatedVendor } from "@/lib/mobile-auth";

export async function OPTIONS() {
  return handleMobileCorsOptions();
}

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthenticatedVendor(req);
    if ("error" in auth) {
      return mobileApiResponse({ success: false, error: auth.error }, auth.status as any);
    }

    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get("status") || "all";

    const allOrders = await getVendorOrders(auth.vendor.id);

    // Strict chronological descending sort (latest orders first)
    allOrders.sort((a, b) => {
      const timeA = new Date(a.createdAt || 0).getTime();
      const timeB = new Date(b.createdAt || 0).getTime();
      return timeB - timeA;
    });

    const filtered = statusFilter === "all"
      ? allOrders
      : allOrders.filter((o) => o.fulfillmentStatus?.toLowerCase() === statusFilter.toLowerCase());

    return mobileApiResponse({
      success: true,
      orders: filtered,
      count: filtered.length,
    });
  } catch (err: any) {
    console.error("Mobile vendor orders error:", err);
    return mobileApiResponse(
      { success: false, error: err.message || "Failed to fetch vendor orders" },
      500
    );
  }
}
