"use server";

import { prisma } from "@/lib/prisma";
import { safeRevalidate } from "@/lib/formatters";

// 1. Get Detailed Payout Summary & Ledger for a Vendor
export async function getVendorPayoutSummary(vendorId: string) {
  try {
    if (!vendorId) return null;

    // A. Unsettled Delivered Splits (Ready for next weekly payout)
    const unsettledDeliveredSplits = await prisma.vendorOrderSplit.findMany({
      where: {
        vendorId,
        fulfillmentStatus: "delivered",
        paymentCollected: true,
        payoutId: null,
      },
      orderBy: { deliveredAt: "desc" },
    });

    const readyForPayoutAmount = unsettledDeliveredSplits.reduce(
      (sum, s) => sum + (s.vendorPayoutAmount || 0),
      0
    );

    // B. In-Progress Orders (Pending delivery or COD collection)
    const inProgressSplits = await prisma.vendorOrderSplit.findMany({
      where: {
        vendorId,
        OR: [
          { fulfillmentStatus: { notIn: ["delivered", "cancelled"] } },
          { fulfillmentStatus: "delivered", paymentCollected: false },
        ],
        payoutId: null,
      },
    });

    const inProgressEstimatedPayout = inProgressSplits.reduce((sum, s) => {
      const estimated = s.vendorPayoutAmount > 0
        ? s.vendorPayoutAmount
        : s.subtotal - (s.subtotal * (s.commissionRate || 15)) / 100;
      return sum + estimated;
    }, 0);

    // C. Completed Payout Batches
    const pastPayouts = await prisma.payout.findMany({
      where: { vendorId },
      orderBy: { createdAt: "desc" },
      include: {
        splits: {
          select: {
            id: true,
            orderId: true,
            subtotal: true,
            commissionAmount: true,
            vendorPayoutAmount: true,
            deliveredAt: true,
          },
        },
      },
    });

    const lifetimePaidOut = pastPayouts
      .filter((p) => p.status === "completed")
      .reduce((sum, p) => sum + p.amount, 0);

    return {
      readyForPayoutAmount: Number(readyForPayoutAmount.toFixed(2)),
      unsettledSplitsCount: unsettledDeliveredSplits.length,
      unsettledSplits: unsettledDeliveredSplits,
      inProgressEstimatedPayout: Number(inProgressEstimatedPayout.toFixed(2)),
      inProgressCount: inProgressSplits.length,
      pastPayouts,
      lifetimePaidOut: Number(lifetimePaidOut.toFixed(2)),
    };
  } catch (error) {
    console.error("getVendorPayoutSummary error:", error);
    return null;
  }
}

// 2. Automated Weekly Payout Generator (Aggregates delivered splits into Payout records)
export async function generateWeeklyPayoutBatches() {
  try {
    // Find all delivered & payment collected splits not yet attached to a payout
    const eligibleSplits = await prisma.vendorOrderSplit.findMany({
      where: {
        fulfillmentStatus: "delivered",
        paymentCollected: true,
        payoutId: null,
      },
      include: {
        vendor: true,
      },
    });

    if (eligibleSplits.length === 0) {
      return { success: true, count: 0, message: "No eligible delivered orders for payout cycle." };
    }

    // Group splits by vendor
    const splitsByVendor = new Map<string, typeof eligibleSplits>();
    for (const split of eligibleSplits) {
      const current = splitsByVendor.get(split.vendorId) || [];
      current.push(split);
      splitsByVendor.set(split.vendorId, current);
    }

    const createdPayouts = [];
    const now = new Date();
    const periodStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    for (const [vendorId, splits] of splitsByVendor.entries()) {
      const totalAmount = splits.reduce((sum, s) => sum + (s.vendorPayoutAmount || 0), 0);

      if (totalAmount <= 0) continue;

      const payout = await prisma.payout.create({
        data: {
          vendorId,
          amount: Number(totalAmount.toFixed(2)),
          status: "pending",
          periodStart,
          periodEnd: now,
          notes: `Weekly settlement for ${splits.length} delivered order splits.`,
          splits: {
            connect: splits.map((s) => ({ id: s.id })),
          },
        },
      });

      createdPayouts.push(payout);
    }

    safeRevalidate("/admin/vendors");
    safeRevalidate("/vendor/payouts");

    return {
      success: true,
      count: createdPayouts.length,
      payouts: createdPayouts,
      message: `Generated ${createdPayouts.length} vendor payout batch(es) successfully!`,
    };
  } catch (error: any) {
    console.error("generateWeeklyPayoutBatches error:", error);
    return { success: false, error: error?.message || "Failed to generate payout batches" };
  }
}

// 3. Super Admin Payout Status Update (Transfer Complete, Hold, etc.)
export async function updatePayoutStatus(
  payoutId: string,
  status: "pending" | "processing" | "completed" | "held",
  notes?: string
) {
  try {
    if (!payoutId) return { success: false, error: "Payout ID is required" };

    const updated = await prisma.payout.update({
      where: { id: payoutId },
      data: {
        status,
        completedAt: status === "completed" ? new Date() : undefined,
        notes: notes !== undefined ? notes : undefined,
      },
    });

    safeRevalidate("/vendor/payouts");
    safeRevalidate(`/admin/vendors/${updated.vendorId}`);

    return {
      success: true,
      payout: updated,
      message: `Payout batch marked as ${status}!`,
    };
  } catch (error: any) {
    console.error("updatePayoutStatus error:", error);
    return { success: false, error: error?.message || "Failed to update payout status" };
  }
}
