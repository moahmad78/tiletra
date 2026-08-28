import { NextRequest } from "next/server";
import { getAuthenticatedAdmin, mobileApiResponse, handleMobileCorsOptions } from "@/lib/mobile-auth";
import { getPlatformDeliveryOrders } from "@/lib/actions/vendor";

export async function OPTIONS() {
  return handleMobileCorsOptions();
}

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthenticatedAdmin(req);
    if ("error" in auth) {
      return mobileApiResponse({ success: false, error: auth.error }, auth.status);
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.toLowerCase().trim() || "";
    const tab = searchParams.get("status") || "all";

    const allDeliveries = await getPlatformDeliveryOrders();

    const filtered = allDeliveries.filter((item: any) => {
      const status = item.fulfillmentStatus?.toLowerCase();
      const matchesTab =
        tab === "all" ||
        (tab === "ready" && status === "ready_for_pickup") ||
        (tab === "transit" && (status === "picked_up" || status === "dispatched")) ||
        (tab === "out" && status === "out_for_delivery") ||
        (tab === "delivered" && status === "delivered") ||
        (tab === "cod_pending" && item.parentOrder?.paymentMethod === "COD" && !item.paymentCollected);

      const matchesQuery =
        !search ||
        item.orderId?.toLowerCase().includes(search) ||
        item.vendor?.businessName?.toLowerCase().includes(search) ||
        item.parentOrder?.customerName?.toLowerCase().includes(search) ||
        item.parentOrder?.customerPhone?.includes(search) ||
        item.courierName?.toLowerCase().includes(search) ||
        item.trackingNumber?.toLowerCase().includes(search);

      return matchesTab && matchesQuery;
    });

    const readyCount = allDeliveries.filter((d: any) => d.fulfillmentStatus?.toLowerCase() === "ready_for_pickup").length;
    const inTransitCount = allDeliveries.filter((d: any) => ["picked_up", "dispatched", "out_for_delivery"].includes(d.fulfillmentStatus?.toLowerCase())).length;
    const deliveredCount = allDeliveries.filter((d: any) => d.fulfillmentStatus?.toLowerCase() === "delivered").length;
    const codPendingCount = allDeliveries.filter((d: any) => d.parentOrder?.paymentMethod === "COD" && !d.paymentCollected).length;

    return mobileApiResponse({
      success: true,
      deliveries: filtered,
      total: allDeliveries.length,
      counts: {
        all: allDeliveries.length,
        ready: readyCount,
        transit: inTransitCount,
        delivered: deliveredCount,
        codPending: codPendingCount,
      },
    });
  } catch (error: any) {
    console.error("[Mobile Admin Deliveries List Error]", error);
    return mobileApiResponse(
      { success: false, error: error?.message || "Failed to fetch platform delivery orders" },
      500
    );
  }
}
