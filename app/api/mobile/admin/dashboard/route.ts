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

    // 4. Low Stock & Out of Stock Products
    const lowStockProducts = await prisma.product.findMany({
      where: {
        OR: [
          { inStock: false },
          { status: "out_of_stock" },
          { variants: { some: { stockBoxes: { lt: 10 } } } },
        ],
      },
      take: 12,
      orderBy: { updatedAt: "desc" },
      include: {
        variants: true,
        vendor: {
          select: {
            id: true,
            businessName: true,
            contactPhone: true,
            contactEmail: true,
            ownerId: true,
          },
        },
      },
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
        lowStockCount: lowStockProducts.length,
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
        createdAt: o.createdAt.toISOString(),
      })),
      pendingVendors: pendingVendors.map((v) => ({
        id: v.id,
        businessName: v.businessName,
        contactEmail: v.contactEmail,
        contactPhone: v.contactPhone,
        category: v.category,
        createdAt: v.createdAt.toISOString(),
      })),
      lowStockProducts: lowStockProducts.map((p) => {
        const firstVariant = p.variants?.[0];
        return {
          id: p.id,
          name: p.name,
          pricePerBox: firstVariant?.pricePerBox || 0,
          pricePerSqft: p.pricePerSqft || firstVariant?.pricePerSqft || 0,
          stockBoxes: firstVariant?.stockBoxes ?? (p.inStock ? 50 : 0),
          unitOfSale: p.unitOfSale || "box",
          images: p.images,
          status: p.status,
          vendor: p.vendor,
        };
      }),
    });
  } catch (err: any) {
    console.error("Mobile admin dashboard error:", err);
    return mobileApiResponse(
      { success: false, error: err.message || "Failed to fetch dashboard data" },
      500
    );
  }
}
