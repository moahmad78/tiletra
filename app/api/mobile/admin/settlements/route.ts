import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedAdmin, mobileApiResponse, handleMobileCorsOptions } from "@/lib/mobile-auth";

export async function OPTIONS() {
  return handleMobileCorsOptions();
}

/**
 * GET /api/mobile/admin/settlements
 * Lists all vendors with pending payout balances, settlement cycles, commission rates, and payout mode.
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthenticatedAdmin(req);
    if ("error" in auth) {
      return mobileApiResponse({ success: false, error: auth.error }, auth.status);
    }

    const vendors = await prisma.vendor.findMany({
      include: {
        splits: {
          where: { payoutId: null, fulfillmentStatus: { not: "cancelled" } },
        },
        payouts: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
      orderBy: { businessName: "asc" },
    });

    const settingsRecords = await prisma.setting.findMany({
      where: { key: { startsWith: "vendor_settlement_" } },
    });

    const configMap: Record<string, any> = {};
    settingsRecords.forEach((r) => {
      try {
        configMap[r.key] = JSON.parse(r.value);
      } catch {
        configMap[r.key] = r.value;
      }
    });

    const formatted = vendors.map((v) => {
      const customConfig = configMap[`vendor_settlement_${v.id}`] || {
        settlementDays: 3, // default 3 days
        autopay: false,
      };

      const pendingGross = v.splits.reduce((sum, s) => sum + (s.subtotal || 0), 0);
      const commissionRate = v.commissionRate || 10;
      const totalCommission = Math.round((pendingGross * commissionRate) / 100);
      const netPayable = Math.max(0, pendingGross - totalCommission);

      return {
        id: v.id,
        businessName: v.businessName,
        category: v.category || "General",
        contactPhone: v.contactPhone,
        commissionRate: v.commissionRate,
        settlementDays: customConfig.settlementDays ?? 3,
        autopay: customConfig.autopay ?? false,
        pendingSplitsCount: v.splits.length,
        pendingGross,
        platformCommissionCut: totalCommission,
        netPayableToVendor: netPayable,
        bankAccountHolder: v.bankAccountHolder,
        bankName: v.bankName,
        bankAccountNumber: v.bankAccountNumber,
        bankIfscCode: v.bankIfscCode,
        bankUpiId: v.bankUpiId,
        recentPayouts: v.payouts.map((p) => ({
          id: p.id,
          amount: p.amount,
          status: p.status,
          date: p.createdAt,
          notes: p.notes,
        })),
      };
    });

    return mobileApiResponse({
      success: true,
      vendors: formatted,
    });
  } catch (err: any) {
    console.error("Mobile admin settlements error:", err);
    return mobileApiResponse(
      { success: false, error: err.message || "Failed to fetch settlements" },
      500
    );
  }
}

/**
 * PATCH /api/mobile/admin/settlements
 * Updates vendor commission % rate, settlement cycle days, and autopay toggle.
 */
export async function PATCH(req: NextRequest) {
  try {
    const auth = await getAuthenticatedAdmin(req);
    if ("error" in auth) {
      return mobileApiResponse({ success: false, error: auth.error }, auth.status);
    }

    const body = await req.json();
    const { vendorId, commissionRate, settlementDays, autopay } = body;

    if (!vendorId) {
      return mobileApiResponse({ success: false, error: "Vendor ID is required" }, 400);
    }

    if (commissionRate !== undefined) {
      await prisma.vendor.update({
        where: { id: vendorId },
        data: { commissionRate: Number(commissionRate) },
      });
    }

    if (settlementDays !== undefined || autopay !== undefined) {
      const configKey = `vendor_settlement_${vendorId}`;
      const existing = await prisma.setting.findUnique({ where: { key: configKey } });
      let currentData = { settlementDays: 3, autopay: false };
      if (existing) {
        try {
          currentData = JSON.parse(existing.value);
        } catch {}
      }

      const updatedData = {
        ...currentData,
        ...(settlementDays !== undefined ? { settlementDays: Number(settlementDays) } : {}),
        ...(autopay !== undefined ? { autopay: Boolean(autopay) } : {}),
      };

      await prisma.setting.upsert({
        where: { key: configKey },
        update: { value: JSON.stringify(updatedData) },
        create: { key: configKey, value: JSON.stringify(updatedData) },
      });
    }

    return mobileApiResponse({
      success: true,
      message: "Vendor settlement rules and commission rate updated successfully!",
    });
  } catch (err: any) {
    console.error("Mobile admin settlement config update error:", err);
    return mobileApiResponse(
      { success: false, error: err.message || "Failed to update settlement rules" },
      500
    );
  }
}

/**
 * POST /api/mobile/admin/settlements
 * Executes 1-tap payout to vendor today (Commission Deducted).
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthenticatedAdmin(req);
    if ("error" in auth) {
      return mobileApiResponse({ success: false, error: auth.error }, auth.status);
    }

    const body = await req.json();
    const { vendorId, customAmount, notes } = body;

    if (!vendorId) {
      return mobileApiResponse({ success: false, error: "Vendor ID is required" }, 400);
    }

    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
      include: {
        splits: {
          where: { payoutId: null, fulfillmentStatus: { not: "cancelled" } },
        },
      },
    });

    if (!vendor) {
      return mobileApiResponse({ success: false, error: "Vendor not found" }, 404);
    }

    const pendingGross = vendor.splits.reduce((sum, s) => sum + (s.subtotal || 0), 0);
    const commRate = vendor.commissionRate || 10;
    const commCut = Math.round((pendingGross * commRate) / 100);
    const calculatedPayable = Math.max(0, pendingGross - commCut);

    const finalPayoutAmount = customAmount !== undefined ? Number(customAmount) : calculatedPayable;

    if (finalPayoutAmount <= 0) {
      return mobileApiResponse(
        { success: false, error: "No payable balance to settle for this vendor." },
        400
      );
    }

    const payout = await prisma.payout.create({
      data: {
        vendorId,
        amount: finalPayoutAmount,
        status: "completed",
        periodStart: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        periodEnd: new Date(),
        completedAt: new Date(),
        notes: notes || `Direct settlement by Super Admin (Platform Commission of ${commRate}% deducted: ₹${commCut.toLocaleString("en-IN")})`,
      },
    });

    // Mark splits as settled under this payout
    const splitIds = vendor.splits.map((s) => s.id);
    if (splitIds.length > 0) {
      await prisma.vendorOrderSplit.updateMany({
        where: { id: { in: splitIds } },
        data: { payoutId: payout.id },
      });
    }

    return mobileApiResponse({
      success: true,
      message: `₹${finalPayoutAmount.toLocaleString("en-IN")} settled and marked as paid to ${vendor.businessName} (Commission ₹${commCut.toLocaleString("en-IN")} retained).`,
      payout,
    });
  } catch (err: any) {
    console.error("Mobile admin execute settlement error:", err);
    return mobileApiResponse(
      { success: false, error: err.message || "Failed to execute payout settlement" },
      500
    );
  }
}
