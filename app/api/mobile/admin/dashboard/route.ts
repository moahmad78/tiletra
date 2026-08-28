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

    // 1. Overall Aggregates
    const [
      totalOrdersCount,
      totalUsersCount,
      totalVendorsCount,
      activeVendorsCount,
      totalProductsCount,
      allOrders,
    ] = await Promise.all([
      prisma.order.count(),
      prisma.user.count(),
      prisma.vendor.count(),
      prisma.vendor.count({ where: { status: "approved" } }),
      prisma.product.count(),
      prisma.order.findMany({
        select: {
          total: true,
          subtotal: true,
          orderStatus: true,
          paymentStatus: true,
        },
      }),
    ]);

    // Calculate Platform GMV and Revenue
    const totalGmv = allOrders.reduce((acc, o) => acc + (o.total || 0), 0);
    const paidOrders = allOrders.filter(
      (o) => o.paymentStatus === "paid" || o.orderStatus === "delivered"
    );
    const totalRevenue = paidOrders.reduce((acc, o) => acc + (o.total || 0), 0);

    // 2. Recent Orders
    const recentOrders = await prisma.order.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
      include: {
        items: true,
      },
    });

    // 3. Pending Vendor Approvals
    const pendingVendors = await prisma.vendor.findMany({
      where: { status: "pending" },
      take: 5,
      orderBy: { createdAt: "desc" },
    });

    return mobileApiResponse({
      success: true,
      stats: {
        totalGmv,
        totalRevenue,
        totalOrdersCount,
        totalUsersCount,
        totalVendorsCount,
        activeVendorsCount,
        totalProductsCount,
        pendingApprovalsCount: pendingVendors.length,
      },
      recentOrders: recentOrders.map((o) => ({
        id: o.id,
        customerName: o.customerName || "Customer",
        customerPhone: o.customerPhone || "",
        total: o.total,
        orderStatus: o.orderStatus,
        paymentStatus: o.paymentStatus,
        paymentMethod: o.paymentMethod,
        itemsCount: o.items.length,
        createdAt: o.createdAt,
      })),
      pendingVendors: pendingVendors.map((v) => ({
        id: v.id,
        businessName: v.businessName,
        contactEmail: v.contactEmail,
        contactPhone: v.contactPhone,
        category: v.category,
        createdAt: v.createdAt,
      })),
    });
  } catch (err: any) {
    console.error("Mobile admin dashboard error:", err);
    return mobileApiResponse(
      { success: false, error: err.message || "Failed to fetch admin dashboard" },
      500
    );
  }
}
