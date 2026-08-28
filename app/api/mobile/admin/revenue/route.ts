import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedAdmin, mobileApiResponse, handleMobileCorsOptions } from "@/lib/mobile-auth";

export async function OPTIONS() {
  return handleMobileCorsOptions();
}

/**
 * GET /api/mobile/admin/revenue
 * Returns platform gross revenue, today's revenue, and vendor-wise revenue & commission breakdown.
 * Supports date-wise filtering: 'today' | 'yesterday' | '7days' | 'this_month' | 'all'
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthenticatedAdmin(req);
    if ("error" in auth) {
      return mobileApiResponse({ success: false, error: auth.error }, auth.status);
    }

    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period") || "today";

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000);
    const startOf7Days = new Date(startOfToday.getTime() - 7 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    let periodStart: Date | null = null;
    let periodEnd: Date | null = null;

    if (period === "today") {
      periodStart = startOfToday;
    } else if (period === "yesterday") {
      periodStart = startOfYesterday;
      periodEnd = startOfToday;
    } else if (period === "7days") {
      periodStart = startOf7Days;
    } else if (period === "this_month") {
      periodStart = startOfMonth;
    }

    // 1. Fetch all vendors
    const vendors = await prisma.vendor.findMany({
      select: {
        id: true,
        businessName: true,
        category: true,
        commissionRate: true,
        status: true,
        contactPhone: true,
        contactEmail: true,
        bankAccountHolder: true,
        bankName: true,
        bankAccountNumber: true,
        bankIfscCode: true,
        bankUpiId: true,
      },
    });

    // 2. Fetch all vendor splits
    const allSplits = await prisma.vendorOrderSplit.findMany({
      select: {
        id: true,
        vendorId: true,
        subtotal: true,
        commissionRate: true,
        commissionAmount: true,
        vendorPayoutAmount: true,
        payoutId: true,
        fulfillmentStatus: true,
        paymentCollected: true,
        createdAt: true,
      },
    });

    // 3. Fetch all orders for platform aggregates
    const allOrders = await prisma.order.findMany({
      where: { orderStatus: { not: "deleted" } },
      select: {
        id: true,
        total: true,
        createdAt: true,
      },
    });

    // Calculate Platform Totals
    const platformTotalGross = allOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const platformTodayGross = allOrders
      .filter((o) => new Date(o.createdAt) >= startOfToday)
      .reduce((sum, o) => sum + (o.total || 0), 0);

    const platformTotalCommission = allSplits.reduce((sum, s) => sum + (s.commissionAmount || 0), 0);
    const platformTodayCommission = allSplits
      .filter((s) => new Date(s.createdAt) >= startOfToday)
      .reduce((sum, s) => sum + (s.commissionAmount || 0), 0);

    // Vendor Breakdown
    const vendorMap: Record<string, any> = {};

    vendors.forEach((v) => {
      vendorMap[v.id] = {
        vendorId: v.id,
        businessName: v.businessName,
        category: v.category || "General",
        commissionRate: v.commissionRate || 10,
        status: v.status,
        contactPhone: v.contactPhone,
        bankUpiId: v.bankUpiId,
        bankAccount: v.bankAccountNumber ? `A/C ending ${v.bankAccountNumber.slice(-4)}` : null,
        todayRevenue: 0,
        periodRevenue: 0,
        totalRevenue: 0,
        ourCommissionCut: 0, // Hmara Kitna Bana
        vendorNetPayout: 0,
        pendingSettlementAmount: 0,
        ordersCount: 0,
        todayOrdersCount: 0,
      };
    });

    allSplits.forEach((s) => {
      if (vendorMap[s.vendorId]) {
        const itemDate = new Date(s.createdAt);
        const isToday = itemDate >= startOfToday;
        let inPeriod = true;

        if (periodStart && itemDate < periodStart) inPeriod = false;
        if (periodEnd && itemDate >= periodEnd) inPeriod = false;

        const subtotal = s.subtotal || 0;
        const commRate = s.commissionRate || vendorMap[s.vendorId].commissionRate || 10;
        const commAmt = s.commissionAmount > 0 ? s.commissionAmount : Math.round((subtotal * commRate) / 100);
        const netPayout = s.vendorPayoutAmount > 0 ? s.vendorPayoutAmount : Math.max(0, subtotal - commAmt);

        vendorMap[s.vendorId].totalRevenue += subtotal;
        vendorMap[s.vendorId].ourCommissionCut += commAmt;
        vendorMap[s.vendorId].vendorNetPayout += netPayout;
        vendorMap[s.vendorId].ordersCount += 1;

        if (isToday) {
          vendorMap[s.vendorId].todayRevenue += subtotal;
          vendorMap[s.vendorId].todayOrdersCount += 1;
        }

        if (inPeriod) {
          vendorMap[s.vendorId].periodRevenue += subtotal;
        }

        // Unsettled splits
        if (!s.payoutId && s.fulfillmentStatus !== "cancelled") {
          vendorMap[s.vendorId].pendingSettlementAmount += netPayout;
        }
      }
    });

    const vendorList = Object.values(vendorMap).sort((a, b) => b.todayRevenue - a.todayRevenue || b.totalRevenue - a.totalRevenue);

    return mobileApiResponse({
      success: true,
      period,
      summary: {
        platformTotalGross,
        platformTodayGross,
        platformTotalCommission,
        platformTodayCommission,
        activeVendorsCount: vendors.length,
        totalOrdersCount: allOrders.length,
      },
      vendors: vendorList,
    });
  } catch (err: any) {
    console.error("Mobile admin revenue analytics error:", err);
    return mobileApiResponse(
      { success: false, error: err.message || "Failed to fetch revenue analytics" },
      500
    );
  }
}
