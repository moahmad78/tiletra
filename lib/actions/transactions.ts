"use server";

import { prisma } from "@/lib/prisma";
import { safeRevalidate } from "@/lib/formatters";

export interface TransactionFilters {
  status?: string;
  method?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export async function getAdminTransactions(filters: TransactionFilters = {}) {
  try {
    const { status, method, search = "", page = 1, limit = 50 } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (status && status !== "all") {
      where.paymentStatus = { equals: status, mode: "insensitive" };
    }

    if (method && method !== "all") {
      if (method === "COD") {
        where.paymentMethod = "COD";
      } else {
        where.paymentMethod = { not: "COD" };
      }
    }

    if (search.trim()) {
      const q = search.trim();
      where.OR = [
        { id: { contains: q, mode: "insensitive" } },
        { customerName: { contains: q, mode: "insensitive" } },
        { customerPhone: { contains: q, mode: "insensitive" } },
        { razorpayPaymentId: { contains: q, mode: "insensitive" } },
        { paymentId: { contains: q, mode: "insensitive" } },
      ];
    }

    const [orders, totalCount, allFinancials, allSplits] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          items: {
            select: {
              id: true,
              productName: true,
              boxQuantity: true,
              totalPrice: true,
            },
          },
        },
      }),
      prisma.order.count({ where }),
      // Global metrics (independent of pagination)
      prisma.order.findMany({
        select: {
          id: true,
          total: true,
          paymentMethod: true,
          paymentStatus: true,
        },
      }),
      prisma.vendorOrderSplit.findMany({
        select: {
          orderId: true,
          commissionAmount: true,
          vendorPayoutAmount: true,
          subtotal: true,
        },
      }),
    ]);

    // Attach splits to current page orders
    const currentOrderIds = orders.map((o) => o.id);
    const pageSplits = await prisma.vendorOrderSplit.findMany({
      where: { orderId: { in: currentOrderIds } },
    });

    const splitsByOrder = new Map<string, any[]>();
    for (const s of pageSplits) {
      const list = splitsByOrder.get(s.orderId) || [];
      list.push(s);
      splitsByOrder.set(s.orderId, list);
    }

    const enrichedOrders = orders.map((o) => ({
      ...o,
      splits: splitsByOrder.get(o.id) || [],
    }));

    // Calculate global metrics
    const splitsCommissionMap = new Map<string, number>();
    for (const s of allSplits) {
      const current = splitsCommissionMap.get(s.orderId) || 0;
      splitsCommissionMap.set(s.orderId, current + (s.commissionAmount || 0));
    }

    let totalGross = 0;
    let onlineGross = 0;
    let codGross = 0;
    let commissionEarned = 0;
    let refundedTotal = 0;
    let pendingTotal = 0;

    for (const o of allFinancials) {
      const amt = o.total || 0;
      totalGross += amt;

      if (o.paymentMethod === "COD") {
        codGross += amt;
      } else {
        onlineGross += amt;
      }

      if (o.paymentStatus === "Paid") {
        commissionEarned += splitsCommissionMap.get(o.id) || 0;
      } else if (o.paymentStatus === "Refunded") {
        refundedTotal += amt;
      } else if (o.paymentStatus === "Pending") {
        pendingTotal += amt;
      }
    }

    return {
      success: true,
      orders: enrichedOrders,
      totalCount,
      page,
      totalPages: Math.ceil(totalCount / limit) || 1,
      stats: {
        totalGross,
        onlineGross,
        codGross,
        commissionEarned,
        refundedTotal,
        pendingTotal,
        transactionsCount: allFinancials.length,
      },
    };
  } catch (error: any) {
    console.error("[getAdminTransactions Error]:", error);
    return {
      success: false,
      error: error?.message || "Failed to fetch transactions",
      orders: [],
      totalCount: 0,
      page: 1,
      totalPages: 1,
      stats: {
        totalGross: 0,
        onlineGross: 0,
        codGross: 0,
        commissionEarned: 0,
        refundedTotal: 0,
        pendingTotal: 0,
        transactionsCount: 0,
      },
    };
  }
}

export async function processAdminRefund(params: {
  orderId: string;
  reason?: string;
  adminName?: string;
}) {
  try {
    const { orderId, reason = "Customer requested refund / Cancelled order", adminName = "Admin" } = params;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return { success: false, error: "Order not found" };
    }

    if (order.paymentStatus === "Refunded") {
      return { success: false, error: "This transaction is already refunded" };
    }

    // 1. Update Order in DB
    const updated = await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: "Refunded",
        orderStatus: "Cancelled",
        internalNotes: `[REFUND PROCESSED]: ₹${order.total} refunded on ${new Date().toLocaleString("en-IN")}. Reason: ${reason}. Authorized by ${adminName}`,
      },
    });

    // 2. Cancel splits so vendor payouts are stopped
    await prisma.vendorOrderSplit.updateMany({
      where: { orderId },
      data: {
        fulfillmentStatus: "cancelled",
        vendorPayoutAmount: 0,
      },
    });

    // 3. Log into Admin Activity table
    try {
      await (prisma as any).adminNotification.create({
        data: {
          title: `Refund Processed: #${order.id}`,
          message: `₹${order.total.toLocaleString("en-IN")} refunded to ${order.customerName} (${reason}). Authorized by ${adminName}`,
          type: "refund",
          link: `/admin/orders/${order.id}`,
        },
      });
    } catch {}

    safeRevalidate("/admin/orders");
    safeRevalidate("/admin/transactions");
    safeRevalidate("/admin");

    return {
      success: true,
      message: `Refund of ₹${order.total.toLocaleString("en-IN")} recorded successfully for Order #${order.id}.`,
      order: updated,
    };
  } catch (error: any) {
    console.error("[processAdminRefund Error]:", error);
    return { success: false, error: error?.message || "Failed to process refund" };
  }
}

export async function markCodPaymentCollected(params: {
  orderId: string;
  adminName?: string;
}) {
  try {
    const { orderId, adminName = "Admin" } = params;

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: "Paid",
        paymentCollected: true,
      },
    });

    await prisma.vendorOrderSplit.updateMany({
      where: { orderId },
      data: {
        paymentCollected: true,
      },
    });

    safeRevalidate("/admin/orders");
    safeRevalidate("/admin/transactions");

    return {
      success: true,
      message: `Cash collection confirmed for Order #${orderId}.`,
      order: updated,
    };
  } catch (error: any) {
    return { success: false, error: error?.message || "Failed to mark COD collected" };
  }
}
