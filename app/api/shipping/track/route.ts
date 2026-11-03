import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { trackShiprocketShipment } from "@/lib/delivery/shiprocket";

/**
 * Real-time Order & Shipment Tracking API
 *
 * GET /api/shipping/track?awb=...
 * GET /api/shipping/track?orderId=...
 * GET /api/shipping/track?splitId=...
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const awb = searchParams.get("awb")?.trim();
    const orderId = searchParams.get("orderId")?.trim();
    const splitId = searchParams.get("splitId")?.trim();

    let targetAwb = awb;
    let targetShipmentId: string | undefined;
    let localSplit: any = null;

    if (!targetAwb && splitId) {
      localSplit = await prisma.vendorOrderSplit.findUnique({
        where: { id: splitId },
      });
      if (localSplit) {
        targetAwb = localSplit.trackingNumber || undefined;
        targetShipmentId = localSplit.thirdPartyRef || undefined;
      }
    } else if (!targetAwb && orderId) {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
      });
      if (order?.trackingNumber) {
        targetAwb = order.trackingNumber;
      } else {
        localSplit = await prisma.vendorOrderSplit.findFirst({
          where: { orderId },
        });
        if (localSplit) {
          targetAwb = localSplit.trackingNumber || undefined;
          targetShipmentId = localSplit.thirdPartyRef || undefined;
        }
      }
    }

    if (!targetAwb && !targetShipmentId) {
      return NextResponse.json(
        {
          success: false,
          error: "No tracking reference or AWB found for this order.",
        },
        { status: 404 }
      );
    }

    const trackingResult = await trackShiprocketShipment(targetAwb || targetShipmentId!);

    return NextResponse.json({
      ...trackingResult,
      split: localSplit
        ? {
            id: localSplit.id,
            fulfillmentStatus: localSplit.fulfillmentStatus,
            courierName: localSplit.courierName,
            trackingNumber: localSplit.trackingNumber,
          }
        : undefined,
    });
  } catch (error: any) {
    console.error("[Shipping Track API Error]:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to retrieve shipment tracking" },
      { status: 500 }
    );
  }
}
