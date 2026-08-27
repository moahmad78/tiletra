import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { mobileApiResponse, handleMobileCorsOptions } from "@/lib/mobile-auth";
import { getVendorPayoutSummary } from "@/lib/actions/payouts";
import { getAuthenticatedVendor } from "../dashboard/route";

export async function OPTIONS() {
  return handleMobileCorsOptions();
}

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthenticatedVendor(req);
    if ("error" in auth) {
      return mobileApiResponse({ success: false, error: auth.error }, auth.status as any);
    }

    const { vendor } = auth;
    const summary = await getVendorPayoutSummary(vendor.id);

    if (!summary) {
      return mobileApiResponse({
        success: true,
        earnings: {
          totalEarnings: 0,
          readyForPayoutAmount: 0,
          inProgressEstimatedPayout: 0,
          lifetimePaidOut: 0,
          unsettledSplitsCount: 0,
          payoutHistory: [],
          trend: [],
        },
      });
    }

    // 1. Calculate 30-day daily earnings trend for chart
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const deliveredSplits = await prisma.vendorOrderSplit.findMany({
      where: {
        vendorId: vendor.id,
        fulfillmentStatus: "delivered",
        createdAt: { gte: thirtyDaysAgo },
      },
      select: {
        createdAt: true,
        vendorPayoutAmount: true,
        subtotal: true,
      },
      orderBy: { createdAt: "asc" },
    });

    // Group earnings by last 7 days for the chart
    const daysMap: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayKey = d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric" });
      daysMap[dayKey] = 0;
    }

    deliveredSplits.forEach((s) => {
      const dayKey = new Date(s.createdAt).toLocaleDateString("en-IN", { weekday: "short", day: "numeric" });
      if (daysMap[dayKey] !== undefined) {
        daysMap[dayKey] += s.vendorPayoutAmount || 0;
      }
    });

    const trend = Object.entries(daysMap).map(([label, amount]) => ({
      label,
      amount: Math.round(amount),
    }));

    // Formatted Payout History
    const payoutHistory = (summary.pastPayouts || []).map((p) => ({
      id: p.id,
      amount: p.amount,
      status: p.status, // "completed" | "pending" | "failed"
      periodStart: p.periodStart,
      periodEnd: p.periodEnd,
      paymentReference: p.notes || "Direct Bank Settlement",
      paidAt: p.completedAt || p.createdAt,
      orderCount: p.splits?.length || 0,
    }));

    const totalEarnings = Number((summary.lifetimePaidOut + summary.readyForPayoutAmount).toFixed(2));

    return mobileApiResponse({
      success: true,
      earnings: {
        totalEarnings,
        readyForPayoutAmount: summary.readyForPayoutAmount,
        inProgressEstimatedPayout: summary.inProgressEstimatedPayout,
        lifetimePaidOut: summary.lifetimePaidOut,
        unsettledSplitsCount: summary.unsettledSplitsCount,
        inProgressCount: summary.inProgressCount,
        payoutHistory,
        trend,
      },
    });
  } catch (err: any) {
    console.error("Mobile vendor earnings error:", err);
    return mobileApiResponse(
      { success: false, error: err.message || "Failed to fetch vendor earnings" },
      500
    );
  }
}
