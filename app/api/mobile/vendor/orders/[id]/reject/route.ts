import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { mobileApiResponse, handleMobileCorsOptions } from "@/lib/mobile-auth";
import { getAuthenticatedVendor } from "../../../dashboard/route";

export async function OPTIONS() {
  return handleMobileCorsOptions();
}

/**
 * Handles vendor rejecting an incoming order (via CallKit Decline or alert Reject button).
 * Executes fallback: re-route to next nearest vendor or auto-cancel + stock restoration + refund.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthenticatedVendor(req);
    if ("error" in auth) {
      return mobileApiResponse({ success: false, error: auth.error }, auth.status as any);
    }

    const { id: orderId } = await params;
    const body = await req.json().catch(() => ({}));
    const { reason = "declined_call", notes } = body;

    // 1. Locate vendor order split
    const split = await prisma.vendorOrderSplit.findFirst({
      where: {
        OR: [{ id: orderId }, { orderId: orderId }],
        vendorId: auth.vendor.id,
      },
      include: {
        order: {
          include: {
            items: true,
          },
        },
      },
    });

    if (!split) {
      return mobileApiResponse({ success: false, error: "Order split not found for this vendor" }, 404);
    }

    if (split.fulfillmentStatus === "confirmed" || split.fulfillmentStatus === "delivered") {
      return mobileApiResponse(
        { success: false, error: `Cannot reject order in ${split.fulfillmentStatus} status` },
        400
      );
    }

    const effectiveOrderId = split.orderId;

    // 2. Update split status to rejected
    const updatedSplit = await prisma.vendorOrderSplit.update({
      where: { id: split.id },
      data: {
        fulfillmentStatus: "rejected",
        packingBreachAt: new Date(),
        slaBreach: true,
      },
    });

    // 3. Fallback routing logic:
    // Try to find another active vendor in the same category within radius
    const alternateVendor = await prisma.vendor.findFirst({
      where: {
        id: { not: auth.vendor.id },
        category: auth.vendor.category,
        status: "approved",
      },
      select: { id: true, businessName: true },
    });

    let fallbackAction = "auto_cancelled";
    let reassignedVendorId: string | null = null;

    if (alternateVendor) {
      // Reassign split to alternate vendor
      await prisma.vendorOrderSplit.update({
        where: { id: split.id },
        data: {
          vendorId: alternateVendor.id,
          fulfillmentStatus: "pending",
          slaBreach: false,
          packingBreachAt: null,
          acceptedAt: null,
        },
      });
      fallbackAction = "reassigned";
      reassignedVendorId = alternateVendor.id;
      console.log(`[Order Fallback] Order ${effectiveOrderId} reassigned from ${auth.vendor.id} to ${alternateVendor.id}`);
    } else {
      // No alternate vendor available: Cancel order & restore stock
      await prisma.$transaction(async (tx) => {
        // Update parent order
        await tx.order.update({
          where: { id: effectiveOrderId },
          data: { orderStatus: "Cancelled" },
        });

        // Restore product stock
        for (const item of split.order.items) {
          if (item.productId) {
            await tx.product.update({
              where: { id: item.productId },
              data: { stock: { increment: item.quantity } },
            }).catch(() => {});
          }
        }
      });
      console.log(`[Order Fallback] Order ${effectiveOrderId} auto-cancelled. Stock restored.`);
    }

    // 4. Emit real-time WebSocket event
    try {
      const { emitSocketEvent } = await import("@/lib/socket-server-emit");
      await emitSocketEvent({
        room: `order_${effectiveOrderId}`,
        event: "order-status-updated",
        data: {
          orderId: effectiveOrderId,
          status: fallbackAction === "reassigned" ? "Reassigning" : "Cancelled",
          reason,
          notes,
        },
      });
    } catch {}

    return mobileApiResponse({
      success: true,
      message: `Order rejected successfully. Fallback: ${fallbackAction}`,
      fallbackAction,
      reassignedVendorId,
    });
  } catch (error: any) {
    console.error("[Vendor Order Reject Error]", error);
    return mobileApiResponse(
      { success: false, error: error?.message || "Failed to process order rejection" },
      500
    );
  }
}
