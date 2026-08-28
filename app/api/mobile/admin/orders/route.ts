import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedAdmin, mobileApiResponse, handleMobileCorsOptions } from "@/lib/mobile-auth";

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
    const search = searchParams.get("search")?.trim() || "";
    const status = searchParams.get("status") || "all";
    const limit = Math.min(Number(searchParams.get("limit")) || 40, 100);

    const where: any = {};
    if (status !== "all") {
      where.orderStatus = { equals: status, mode: "insensitive" };
    } else {
      where.orderStatus = { not: "deleted" };
    }
    if (search) {
      where.OR = [
        { id: { contains: search, mode: "insensitive" } },
        { customerName: { contains: search, mode: "insensitive" } },
        { customerPhone: { contains: search, mode: "insensitive" } },
      ];
    }

    const orders = await prisma.order.findMany({
      where,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        items: true,
      },
    });

    const orderIds = orders.map((o) => o.id);
    const splits = await prisma.vendorOrderSplit.findMany({
      where: { orderId: { in: orderIds } },
    });
    const splitsByOrder = new Map<string, number>();
    splits.forEach((s) => {
      splitsByOrder.set(s.orderId, (splitsByOrder.get(s.orderId) || 0) + 1);
    });

    return mobileApiResponse({
      success: true,
      orders: orders.map((o) => ({
        id: o.id,
        customerName: o.customerName || "Customer",
        customerPhone: o.customerPhone || "",
        customerEmail: o.customerEmail || "",
        total: o.total,
        subtotal: o.subtotal,
        deliveryFee: o.deliveryFee,
        orderStatus: o.orderStatus,
        paymentStatus: o.paymentStatus,
        paymentMethod: o.paymentMethod,
        estimatedDelivery: o.estimatedDelivery,
        deliveryCity: o.deliveryCity,
        deliveryLatitude: o.deliveryLatitude,
        deliveryLongitude: o.deliveryLongitude,
        itemsCount: o.items.length,
        splitsCount: splitsByOrder.get(o.id) || 0,
        createdAt: o.createdAt,
      })),
      count: orders.length,
    });
  } catch (err: any) {
    console.error("Mobile admin orders list error:", err);
    return mobileApiResponse(
      { success: false, error: err.message || "Failed to fetch orders" },
      500
    );
  }
}
