import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const webhookSecret =
      process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET;

    if (!webhookSecret) {
      console.error("[Razorpay Webhook] Webhook secret not configured");
      return NextResponse.json(
        { error: "Webhook secret not configured" },
        { status: 500 }
      );
    }

    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Missing x-razorpay-signature header" },
        { status: 400 }
      );
    }

    // Verify webhook signature using HMAC-SHA256
    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret.trim())
      .update(rawBody)
      .digest("hex");

    const expectedBuffer = Buffer.from(expectedSignature);
    const signatureBuffer = Buffer.from(signature);

    const isMatch =
      expectedBuffer.length === signatureBuffer.length &&
      crypto.timingSafeEqual(expectedBuffer, signatureBuffer);

    if (!isMatch) {
      console.warn("[Razorpay Webhook] Invalid signature mismatch");
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const event = JSON.parse(rawBody);
    console.log(`[Razorpay Webhook] Received verified event: ${event.event}`);

    // Handle payment.captured or order.paid
    if (event.event === "payment.captured" || event.event === "order.paid") {
      const payment = event.payload?.payment?.entity;
      const razorpayOrderId = payment?.order_id;
      const razorpayPaymentId = payment?.id;

      if (razorpayOrderId) {
        // Idempotently update order in database
        const existingOrder = await prisma.order.findFirst({
          where: {
            OR: [
              { razorpayOrderId: razorpayOrderId },
              { id: payment.notes?.orderId || payment.notes?.receipt },
            ],
          },
        });

        if (existingOrder && existingOrder.paymentStatus !== "Paid") {
          await prisma.order.update({
            where: { id: existingOrder.id },
            data: {
              paymentStatus: "Paid",
              paymentCollected: true,
              razorpayPaymentId: razorpayPaymentId || existingOrder.razorpayPaymentId,
              paymentId: razorpayPaymentId || existingOrder.paymentId,
            },
          });
          console.log(`[Razorpay Webhook] Idempotently marked order ${existingOrder.id} as Paid`);
        }
      }
    }

    return NextResponse.json({ status: "ok" });
  } catch (error: any) {
    console.error("[Razorpay Webhook Error]:", error);
    return NextResponse.json(
      { error: error?.message || "Webhook processing error" },
      { status: 500 }
    );
  }
}
