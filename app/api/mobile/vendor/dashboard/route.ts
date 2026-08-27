import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedMobileUser, mobileApiResponse, handleMobileCorsOptions } from "@/lib/mobile-auth";
import { getVendorDashboardStats } from "@/lib/actions/vendor";

export async function OPTIONS() {
  return handleMobileCorsOptions();
}

export async function getAuthenticatedVendor(req: NextRequest) {
  const user = await getAuthenticatedMobileUser(req);
  if (!user) {
    return { error: "Unauthorized", status: 401 };
  }
  if (user.role !== "vendor" && user.role !== "admin") {
    return { error: "Forbidden: Vendor access required", status: 403 };
  }

  let vendor = await prisma.vendor.findUnique({
    where: { ownerId: user.id },
  });

  if (!vendor) {
    vendor = await prisma.vendor.findFirst({
      where: {
        OR: [{ contactPhone: user.phone }, { contactEmail: user.email || "" }],
      },
    });
  }

  if (!vendor) {
    return { error: "Vendor profile not found for this account", status: 404 };
  }

  return { user, vendor };
}

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthenticatedVendor(req);
    if ("error" in auth) {
      return mobileApiResponse({ success: false, error: auth.error }, auth.status as any);
    }

    const { vendor, user } = auth;
    const stats = await getVendorDashboardStats(vendor.id);

    // Fetch vendor recent orders
    const recentSplits = await prisma.vendorOrderSplit.findMany({
      where: { vendorId: vendor.id },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    const orderIds = recentSplits.map((s) => s.orderId);
    const parentOrders = await prisma.order.findMany({
      where: { id: { in: orderIds } },
      include: {
        items: true,
      },
    });

    const orderMap = new Map(parentOrders.map((o) => [o.id, o]));

    const recentOrders = recentSplits.map((s) => {
      const parent = orderMap.get(s.orderId);
      return {
        splitId: s.id,
        orderId: s.orderId,
        customerName: parent?.customerName || "Customer",
        customerPhone: parent?.customerPhone || "",
        itemsCount: parent?.items?.length || 0,
        subtotal: s.subtotal,
        vendorPayoutAmount: s.vendorPayoutAmount,
        fulfillmentStatus: s.fulfillmentStatus,
        paymentStatus: parent?.paymentStatus || "pending",
        createdAt: s.createdAt,
      };
    });

    return mobileApiResponse({
      success: true,
      vendor: {
        id: vendor.id,
        businessName: vendor.businessName,
        slug: vendor.slug,
        category: vendor.category,
        status: vendor.status,
        logo: vendor.logo,
        ownerName: user.name,
        contactEmail: vendor.contactEmail,
        contactPhone: vendor.contactPhone,
        deliveryMethod: vendor.deliveryMethod,
      },
      stats,
      recentOrders,
    });
  } catch (err: any) {
    console.error("Mobile vendor dashboard error:", err);
    return mobileApiResponse(
      { success: false, error: err.message || "Failed to fetch vendor dashboard" },
      500
    );
  }
}
