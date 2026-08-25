import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const key_secret = (process.env.RAZORPAY_KEY_SECRET || "").trim();
    if (!key_secret) {
      console.error("[Checkout-V2 Verify] Razorpay key secret missing in environment");
      return NextResponse.json(
        { error: "Razorpay credentials not configured on server" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      console.warn("[Checkout-V2 Verify] Missing verification params:", {
        hasOrderId: Boolean(razorpay_order_id),
        hasPaymentId: Boolean(razorpay_payment_id),
        hasSignature: Boolean(razorpay_signature),
      });
      return NextResponse.json(
        { error: "Missing required payment signature parameters" },
        { status: 400 }
      );
    }

    const text = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac("sha256", key_secret)
      .update(text)
      .digest("hex");

    const signatureBuffer = Buffer.from(razorpay_signature);
    const expectedBuffer = Buffer.from(expectedSignature);

    const isMatch =
      signatureBuffer.length === expectedBuffer.length &&
      crypto.timingSafeEqual(signatureBuffer, expectedBuffer);

    if (!isMatch) {
      console.warn("[Checkout-V2 Verify] ❌ Razorpay signature mismatch:", {
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        receivedSigPrefix: razorpay_signature.slice(0, 10),
      });
      return NextResponse.json(
        { error: "Payment verification failed: Signature mismatch" },
        { status: 400 }
      );
    }

    console.log(`[Checkout-V2 Verify] ✔ Payment signature verified successfully for order: ${razorpay_order_id}`);

    return NextResponse.json({
      success: true,
      message: "Payment signature verified successfully",
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
    });
  } catch (error: any) {
    console.error("[Checkout-V2 Verify] Unexpected error verifying payment:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error during verification" },
      { status: 500 }
    );
  }
}
