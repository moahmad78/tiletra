import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { mobileApiResponse, handleMobileCorsOptions } from "@/lib/mobile-auth";
import { getAuthenticatedVendor } from "../../../dashboard/route";

export async function OPTIONS() {
  return handleMobileCorsOptions();
}

/**
 * POST /api/mobile/vendor/orders/[id]/ack
 * Vendor acknowledges the high-alert new order popup ("Received").
 * Sets acknowledgedAt timestamp on OrderAlert, stopping all further escalation steps.
 * Idempotent: safe to repeat without error.
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

    const { id } = await params;
    const now = new Date();

    // Find and update all active unacknowledged alerts for this order and vendor
    const updatedAlerts = await prisma.orderAlert.updateMany({
      where: {
        orderId: id,
        vendorId: auth.vendor.id,
        acknowledgedAt: null,
      },
      data: {
        acknowledgedAt: now,
      },
    });

    // If no unacknowledged alert found, check if already acknowledged (idempotent)
    const existingAlert = await prisma.orderAlert.findFirst({
      where: {
        orderId: id,
        vendorId: auth.vendor.id,
      },
      orderBy: { sentAt: "desc" },
    });

    const acknowledgedTime = existingAlert?.acknowledgedAt || now;

    // Real-Time Socket Broadcast to CPO & Admin rooms that vendor acknowledged
    try {
      const { emitSocketEvent } = await import("@/lib/socket-server-emit");
      await emitSocketEvent({
        room: "admin",
        event: "order-alert-acknowledged",
        data: {
          orderId: id,
          vendorId: auth.vendor.id,
          acknowledgedAt: acknowledgedTime,
          updatedCount: updatedAlerts.count,
        },
      });
    } catch (socketErr) {
      console.warn("Socket broadcast error in order ack:", socketErr);
    }

    return mobileApiResponse({
      success: true,
      message: "Order alert acknowledged successfully. High alert sound stopped.",
      orderId: id,
      acknowledgedAt: acknowledgedTime,
      acknowledgedCount: updatedAlerts.count,
    });
  } catch (err: any) {
    console.error("Order alert acknowledge error:", err);
    return mobileApiResponse({ success: false, error: err.message || "Failed to acknowledge order" }, 500);
  }
}
