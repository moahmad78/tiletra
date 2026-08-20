import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import Razorpay from "razorpay";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get("orderId");
    const razorpayOrderId = searchParams.get("razorpayOrderId");

    if (!orderId && !razorpayOrderId) {
      return NextResponse.json(
        { error: "orderId or razorpayOrderId query parameter is required" },
        { status: 400 }
      );
    }

    // 1. Check Tiletra Database first
    const existingOrder = await prisma.order.findFirst({
      where: {
        OR: [
          ...(orderId ? [{ id: orderId }] : []),
          ...(razorpayOrderId ? [{ razorpayOrderId: razorpayOrderId }] : []),
        ],
      },
      select: {
        id: true,
        paymentStatus: true,
        orderStatus: true,
        total: true,
        razorpayOrderId: true,
        razorpayPaymentId: true,
      },
    });

    if (existingOrder && existingOrder.paymentStatus === "Paid") {
      return NextResponse.json({
        status: "PAID",
        paymentStatus: "Paid",
        orderId: existingOrder.id,
        razorpayOrderId: existingOrder.razorpayOrderId,
        razorpayPaymentId: existingOrder.razorpayPaymentId,
      });
    }

    // 2. Query Razorpay API if razorpayOrderId is available and DB is still pending
    const key_id = process.env.RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;

    if (key_id && key_secret && razorpayOrderId) {
      try {
        const razorpay = new Razorpay({ key_id, key_secret });
        const rzpOrder = await razorpay.orders.fetch(razorpayOrderId);

        if (rzpOrder.status === "paid") {
          // Idempotently update DB if found
          if (existingOrder && existingOrder.paymentStatus !== "Paid") {
            await prisma.order.update({
              where: { id: existingOrder.id },
              data: {
                paymentStatus: "Paid",
                paymentCollected: true,
              },
            });
          }

          return NextResponse.json({
            status: "PAID",
            paymentStatus: "Paid",
            orderId: existingOrder?.id || orderId,
            razorpayOrderId,
          });
        } else if (rzpOrder.status === "attempted") {
          return NextResponse.json({
            status: "PROCESSING",
            paymentStatus: "Pending",
            orderId: existingOrder?.id || orderId,
            razorpayOrderId,
          });
        }
      } catch (err: any) {
        console.warn("[Payment Status API] Could not fetch Razorpay order:", err?.message);
      }
    }

    return NextResponse.json({
      status: existingOrder?.paymentStatus === "Paid" ? "PAID" : "PENDING",
      paymentStatus: existingOrder?.paymentStatus || "Pending",
      orderId: existingOrder?.id || orderId,
      razorpayOrderId: existingOrder?.razorpayOrderId || razorpayOrderId,
    });
  } catch (error: any) {
    console.error("[Payment Status API Error]:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to retrieve payment status" },
      { status: 500 }
    );
  }
}
