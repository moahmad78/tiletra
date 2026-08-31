import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mapBorzoStatusToFulfillment } from "@/lib/delivery/borzo";

/**
 * F8 — Borzo Delivery Webhook Handler
 *
 * Receives real-time bike delivery status updates from Borzo (WeFast).
 * URL: POST /api/webhooks/borzo
 */
export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const orderData = body?.order || body;
  const borzoBookingId = String(orderData?.order_id || orderData?.id || "");
  const borzoStatus = String(orderData?.status || "");

  if (!borzoBookingId) {
    return NextResponse.json({ success: false, error: "Missing Borzo order_id" }, { status: 400 });
  }

  try {
    const split = await prisma.vendorOrderSplit.findFirst({
      where: {
        thirdPartyRef: borzoBookingId,
        thirdPartyProvider: "borzo",
      },
    });

    if (!split) {
      return NextResponse.json({ success: true, message: "Order not tracked by this system" });
    }

    const newFulfillmentStatus = mapBorzoStatusToFulfillment(borzoStatus);
    if (!newFulfillmentStatus) {
      return NextResponse.json({ success: true, message: `Ignoring status: ${borzoStatus}` });
    }

    const isDelivered = newFulfillmentStatus === "delivered";
    const isCancelled = newFulfillmentStatus === "cancelled";

    const updateData: any = { fulfillmentStatus: newFulfillmentStatus };

    if (isDelivered) {
      const commissionAmount = Number(((split.subtotal * split.commissionRate) / 100).toFixed(2));
      const vendorPayoutAmount = Number((split.subtotal - commissionAmount).toFixed(2));
      updateData.commissionAmount = commissionAmount;
      updateData.vendorPayoutAmount = vendorPayoutAmount;
      updateData.deliveredAt = new Date();
      updateData.paymentCollected = true;
    }

    await prisma.vendorOrderSplit.update({
      where: { id: split.id },
      data: updateData,
    });

    if (isDelivered || isCancelled) {
      await prisma.order.update({
        where: { id: split.orderId },
        data: {
          orderStatus: isDelivered ? "delivered" : "Cancelled",
          ...(isDelivered ? { deliveredAt: new Date() } : {}),
        },
      }).catch((e) => console.warn("[Borzo Webhook] Parent order sync warning:", e));
    }

    // Socket broadcast
    try {
      const { emitSocketEvent } = await import("@/lib/socket-server-emit");
      await emitSocketEvent({
        room: `order_${split.orderId}`,
        event: "order-status-updated",
        data: {
          orderId: split.orderId,
          splitId: split.id,
          fulfillmentStatus: newFulfillmentStatus,
          deliveryProvider: "borzo",
          borzoBookingId,
          updatedAt: new Date(),
        },
      });
    } catch {}

    console.info(
      `[Borzo Webhook] Order ${split.orderId} (booking ${borzoBookingId}): ${borzoStatus} → ${newFulfillmentStatus}`
    );

    return NextResponse.json({ success: true, status: newFulfillmentStatus });
  } catch (error: any) {
    console.error("[Borzo Webhook] Error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Webhook processing failed" },
      { status: 500 }
    );
  }
}
