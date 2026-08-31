import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPorterWebhookSignature, mapPorterStatusToFulfillment } from "@/lib/delivery/porter";

/**
 * F6 — Porter Delivery Webhook Handler
 *
 * Receives real-time delivery status updates from Porter Enterprise.
 * Maps Porter status → IntriHub fulfillmentStatus and updates the split + parent order.
 *
 * Porter sends events to this URL. Configure this in your Porter Enterprise dashboard:
 *   Webhook URL: https://intrihub.com/api/webhooks/porter
 *   Events: order_accepted, driver_arrived_pickup, pickup_done, in_transit, delivered, cancelled
 */
export async function POST(req: NextRequest) {
  let rawBody: string;
  try {
    rawBody = await req.text();
  } catch {
    return NextResponse.json({ success: false, error: "Could not read request body" }, { status: 400 });
  }

  // Verify Porter webhook signature (HMAC-SHA256)
  const signature = req.headers.get("x-porter-signature") || req.headers.get("x-webhook-signature") || "";
  if (!verifyPorterWebhookSignature(rawBody, signature)) {
    console.warn("[Porter Webhook] Signature verification failed — rejecting");
    return NextResponse.json({ success: false, error: "Invalid signature" }, { status: 401 });
  }

  let event: any;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }

  const porterStatus = event?.status || event?.order_status || event?.event_type || "";
  const porterBookingId = String(event?.order_id || event?.id || "");

  if (!porterBookingId) {
    return NextResponse.json({ success: false, error: "Missing booking ID" }, { status: 400 });
  }

  try {
    // Find the split this Porter booking is for
    const split = await prisma.vendorOrderSplit.findFirst({
      where: {
        thirdPartyRef: porterBookingId,
        thirdPartyProvider: "porter",
      },
    });

    if (!split) {
      console.warn(`[Porter Webhook] No split found for booking ${porterBookingId}`);
      // Acknowledge anyway so Porter doesn't retry indefinitely
      return NextResponse.json({ success: true, message: "Order not tracked by this system" });
    }

    // Map Porter status → IntriHub fulfillmentStatus
    const newFulfillmentStatus = mapPorterStatusToFulfillment(porterStatus);
    if (!newFulfillmentStatus) {
      console.info(`[Porter Webhook] Unrecognised Porter status "${porterStatus}" — ignoring`);
      return NextResponse.json({ success: true, message: `Ignoring status: ${porterStatus}` });
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

    // Sync parent order status
    if (isDelivered || isCancelled) {
      await prisma.order.update({
        where: { id: split.orderId },
        data: {
          orderStatus: isDelivered ? "delivered" : "Cancelled",
          ...(isDelivered ? { deliveredAt: new Date() } : {}),
        },
      }).catch((e) => console.warn("[Porter Webhook] Parent order sync failed:", e));
    }

    // Socket broadcast — customer tracking UI updates seamlessly (same UX as in-house rider)
    try {
      const { emitSocketEvent } = await import("@/lib/socket-server-emit");
      await emitSocketEvent({
        room: `order_${split.orderId}`,
        event: "order-status-updated",
        data: {
          orderId: split.orderId,
          splitId: split.id,
          fulfillmentStatus: newFulfillmentStatus,
          deliveryProvider: "porter",
          porterBookingId,
          updatedAt: new Date(),
        },
      });
    } catch {}

    console.info(
      `[Porter Webhook] Order ${split.orderId} (booking ${porterBookingId}): ${porterStatus} → ${newFulfillmentStatus}`
    );

    return NextResponse.json({ success: true, status: newFulfillmentStatus });
  } catch (error: any) {
    console.error("[Porter Webhook] Processing error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Webhook processing failed" },
      { status: 500 }
    );
  }
}
