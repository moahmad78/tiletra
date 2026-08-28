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

    const { prisma } = await import("@/lib/prisma");

    // 1. Fetch all splits
    const splits = await prisma.vendorOrderSplit.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        vendor: {
          select: {
            id: true,
            businessName: true,
            contactPhone: true,
            contactEmail: true,
            businessAddress: true,
          },
        },
      },
    });

    const orderIds = splits.map((s) => s.orderId);
    const allOrders = await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      include: { items: true },
    });

    const orderMap = new Map(allOrders.map((o) => [o.id, o]));

    let allDeliveries: any[] = splits.map((split) => {
      const parent = orderMap.get(split.orderId);
      return {
        id: split.id,
        orderId: split.orderId,
        vendorId: split.vendorId,
        vendor: split.vendor,
        subtotal: split.subtotal,
        commissionRate: split.commissionRate,
        commissionAmount: split.commissionAmount,
        vendorPayoutAmount: split.vendorPayoutAmount,
        deliveryMethod: split.deliveryMethod || "platform",
        fulfillmentStatus: split.fulfillmentStatus,
        paymentCollected: split.paymentCollected,
        trackingNumber: split.trackingNumber,
        courierName: split.courierName,
        deliveredAt: split.deliveredAt,
        createdAt: split.createdAt,
        updatedAt: split.updatedAt,
        parentOrder: parent
          ? {
              customerName: parent.customerName,
              customerPhone: parent.customerPhone,
              customerEmail: parent.customerEmail,
              shippingAddress: parent.shippingAddress,
              paymentStatus: parent.paymentStatus,
              paymentMethod: parent.paymentMethod,
              orderStatus: parent.orderStatus,
              items: parent.items,
            }
          : null,
      };
    });

    // If no splits exist yet, construct delivery cards directly from platform orders
    if (allDeliveries.length === 0) {
      allDeliveries = allOrders.map((order) => ({
        id: order.id,
        orderId: order.id,
        vendorId: null,
        vendor: { businessName: "Intrihub Central Warehouse", contactPhone: "9264920211" },
        subtotal: order.subtotal || order.total,
        deliveryMethod: "platform",
        fulfillmentStatus: order.orderStatus === "delivered" ? "delivered" : "ready_for_pickup",
        paymentCollected: order.paymentStatus === "paid",
        trackingNumber: null,
        courierName: null,
        deliveredAt: null,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        parentOrder: {
          customerName: order.customerName,
          customerPhone: order.customerPhone,
          customerEmail: order.customerEmail,
          shippingAddress: order.shippingAddress,
          paymentStatus: order.paymentStatus,
          paymentMethod: order.paymentMethod,
          orderStatus: order.orderStatus,
          items: order.items,
        },
      }));
    }

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
