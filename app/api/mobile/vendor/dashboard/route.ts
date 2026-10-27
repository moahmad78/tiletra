import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedMobileUser, getAuthenticatedVendor, mobileApiResponse, handleMobileCorsOptions } from "@/lib/mobile-auth";
import { getVendorDashboardStats } from "@/lib/actions/vendor";

export async function OPTIONS() {
  return handleMobileCorsOptions();
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
      const allParentItems = parent?.items || [];
      const hasAnyVendorId = allParentItems.some((it: any) => Boolean(it.vendorId));
      const vendorItems = hasAnyVendorId
        ? allParentItems.filter((it: any) => it.vendorId === s.vendorId)
        : allParentItems;

      const rawPhone = parent?.deliveryPhone || parent?.customerPhone || "";
      const cleanDigits = rawPhone.replace(/\D/g, "");
      const maskedPhone = cleanDigits.length >= 10
        ? `+91 ${cleanDigits.slice(-10, -5)} •••••`
        : (rawPhone ? "••••••••••" : "");

      return {
        splitId: s.id,
        orderId: s.orderId,
        customerName: parent?.deliveryName || parent?.customerName || "Customer",
        customerPhone: maskedPhone,
        itemsCount: vendorItems.length,
        subtotal: s.subtotal,
        vendorPayoutAmount:
          s.vendorPayoutAmount > 0
            ? s.vendorPayoutAmount
            : Number((s.subtotal - ((s.subtotal * (s.commissionRate || 15)) / 100)).toFixed(2)),
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
        autoPublishEnabled: Boolean(vendor.autoPublishEnabled),
        isOnline: Boolean(vendor.isOnline),
        autoAcceptOrders: Boolean(vendor.autoAcceptOrders),
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
