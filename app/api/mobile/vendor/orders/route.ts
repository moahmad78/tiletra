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
      : allOrders.filter((o) => {
          const fs = (o.fulfillmentStatus || "").toLowerCase();
          const target = statusFilter.toLowerCase();
          if (target === "pending") return fs.includes("pending") || fs.includes("awaiting");
          if (target === "ready" || target === "ready_for_pickup") return fs.includes("ready");
          if (target === "confirmed") return fs === "confirmed" || fs === "accepted" || fs === "processing";
          if (target === "dispatched") return fs === "dispatched" || fs.includes("transit") || fs.includes("delivery");
          if (target === "delivered") return fs === "delivered";
          return fs === target;
        });

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
