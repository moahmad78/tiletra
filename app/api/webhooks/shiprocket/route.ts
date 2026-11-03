import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  verifyShiprocketWebhook,
  mapShiprocketStatusToFulfillment,
} from "@/lib/delivery/shiprocket";

/**
 * Shiprocket Tracking Webhook Handler
 *
 * Endpoint: POST /api/webhooks/shiprocket
 * Webhook setup in Shiprocket Dashboard:
 *   URL: https://www.intrihub.com/api/webhooks/shiprocket
 *   Header: x-api-key: <SHIPROCKET_WEBHOOK_TOKEN> (or ?token=<SHIPROCKET_WEBHOOK_TOKEN>)
 *
 * Handled events:
 *   - AWB_ASSIGNED
 *   - PICKED_UP
 *   - IN_TRANSIT
 *   - OUT_FOR_DELIVERY
 *   - DELIVERED
 *   - CANCELED
 *   - RTO_INITIATED / RTO_DELIVERED
 */
export async function POST(req: NextRequest) {
  let rawBody: string;
  try {
    rawBody = await req.text();
  } catch {
    return NextResponse.json(
      { success: false, error: "Could not read request body" },
      { status: 400 }
    );
  }

  const { searchParams } = new URL(req.url);

  // 1. Verify Webhook Authenticity
  if (!verifyShiprocketWebhook(req.headers, searchParams)) {
    console.warn("[Shiprocket Webhook] Unauthorized webhook attempt — token mismatch");
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  let event: any;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }

  const awb = String(event.awb || event.awb_code || "").trim();
  const shipmentId = String(event.shipment_id || "").trim();
  const statusCode = event.current_status_id ?? event.status_id;
  const statusName = String(event.current_status || event.status || "").trim();
  const courierName = event.courier_name || event.courier_company_id;

  if (!awb && !shipmentId) {
    console.warn("[Shiprocket Webhook] Payload missing awb and shipment_id:", event);
    return NextResponse.json({ success: false, error: "Missing AWB and shipment_id" }, { status: 400 });
  }

  try {
    // 2. Find matching VendorOrderSplit
    const split = await prisma.vendorOrderSplit.findFirst({
      where: {
        OR: [
          ...(awb ? [{ trackingNumber: awb }] : []),
          ...(shipmentId ? [{ thirdPartyRef: shipmentId }] : []),
        ],
      },
    });

    if (!split) {
      console.warn(
        `[Shiprocket Webhook] No matching VendorOrderSplit found for AWB: ${awb}, Shipment: ${shipmentId}`
      );
      // Return 200 so Shiprocket does not keep retrying for untracked/test shipments
      return NextResponse.json({
        success: true,
        message: "Shipment acknowledged but not linked to a local split.",
      });
    }

    // 3. Map status to IntriHub fulfillmentStatus
    const mappedStatus = mapShiprocketStatusToFulfillment(statusCode ?? statusName);
    if (!mappedStatus) {
      console.info(
        `[Shiprocket Webhook] Unmapped status: ${statusName} (${statusCode}) for AWB: ${awb}`
      );
      return NextResponse.json({
        success: true,
        message: `Ignored status ${statusName}`,
      });
    }

    const isDelivered = mappedStatus === "delivered";
    const updateData: any = {
      fulfillmentStatus: mappedStatus,
    };

    if (awb && !split.trackingNumber) {
      updateData.trackingNumber = awb;
    }
    if (courierName && !split.courierName) {
      updateData.courierName = String(courierName);
    }

    if (isDelivered) {
      const commissionAmount = Number(((split.subtotal * split.commissionRate) / 100).toFixed(2));
      const vendorPayoutAmount = Number((split.subtotal - commissionAmount).toFixed(2));
      updateData.commissionAmount = commissionAmount;
      updateData.vendorPayoutAmount = vendorPayoutAmount;
      updateData.deliveredAt = new Date();
      updateData.paymentCollected = true;
    }

    const updatedSplit = await prisma.vendorOrderSplit.update({
      where: { id: split.id },
      data: updateData,
    });

    // 4. Synchronize parent order status
    const allOrderSplits = await prisma.vendorOrderSplit.findMany({
      where: { orderId: split.orderId },
    });

    const allDelivered = allOrderSplits.every((s) => s.fulfillmentStatus === "delivered");
    const anyOutForDelivery = allOrderSplits.some((s) => s.fulfillmentStatus === "out_for_delivery");
    const anyDispatched = allOrderSplits.some(
      (s) => s.fulfillmentStatus === "dispatched" || s.fulfillmentStatus === "picked_up"
    );

    let newOrderStatus: string | null = null;
    if (allDelivered) {
      newOrderStatus = "Delivered";
    } else if (anyOutForDelivery) {
      newOrderStatus = "Out for Delivery";
    } else if (anyDispatched) {
      newOrderStatus = "Dispatched";
    }

    if (newOrderStatus) {
      await prisma.order.update({
        where: { id: split.orderId },
        data: {
          orderStatus: newOrderStatus,
          ...(isDelivered && allDelivered ? { deliveredAt: new Date(), paymentCollected: true } : {}),
          ...(awb ? { trackingNumber: awb } : {}),
          ...(courierName ? { courierName: String(courierName) } : {}),
        },
      });
    }

    // 5. Emit Real-time Sockets
    try {
      const { emitSocketEvent } = await import("@/lib/socket-server-emit");
      await emitSocketEvent({
        rooms: [
          "admin-room",
          "admin",
          `order_${split.orderId}`,
          `order:${split.orderId}`,
          `vendor:${split.vendorId}`,
          `vendor_${split.vendorId}`,
          split.vendorId,
        ],
        event: "order-status-updated",
        data: {
          orderId: split.orderId,
          splitId: split.id,
          fulfillmentStatus: mappedStatus,
          orderStatus: newOrderStatus || split.fulfillmentStatus,
          trackingNumber: awb || split.trackingNumber,
          courierName: courierName || split.courierName,
          carrier: "shiprocket",
        },
      });
    } catch (socketErr) {
      console.warn("[Shiprocket Webhook] Socket emit error:", socketErr);
    }

    return NextResponse.json({
      success: true,
      splitId: split.id,
      orderId: split.orderId,
      status: mappedStatus,
    });
  } catch (error: any) {
    console.error("[Shiprocket Webhook Process Error]:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Internal error processing webhook" },
      { status: 500 }
    );
  }
}
