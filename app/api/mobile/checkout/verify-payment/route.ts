import { NextRequest } from "next/server";
import crypto from "crypto";
import { getAuthenticatedMobileUser, mobileApiResponse, handleMobileCorsOptions } from "@/lib/mobile-auth";
import { createOrder } from "@/lib/actions/orders";

export async function OPTIONS() {
  return handleMobileCorsOptions();
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedMobileUser(req);
    const body = await req.json().catch(() => ({}));
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      items,
      shippingAddress,
      customerName,
      customerPhone,
      customerEmail,
      couponCode,
      subtotal,
      deliveryFee,
      discount,
      total,
    } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return mobileApiResponse(
        { success: false, error: "Missing required Razorpay verification parameters" },
        400
      );
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      return mobileApiResponse(
        { success: false, error: "Razorpay credentials not configured on server" },
        500
      );
    }

    // Verify HMAC SHA-256 signature
    const text = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto.createHmac("sha256", keySecret).update(text).digest("hex");

    const expectedBuffer = Buffer.from(expectedSignature);
    const signatureBuffer = Buffer.from(razorpay_signature);

    const isMatch =
      expectedBuffer.length === signatureBuffer.length &&
      crypto.timingSafeEqual(expectedBuffer, signatureBuffer);

    if (!isMatch) {
      return mobileApiResponse(
        { success: false, error: "Invalid payment signature verification failed" },
        400
      );
    }

    // Payment is valid -> create confirmed order
    const finalUserId = user?.id || body.userId;
    const orderResult = await createOrder({
      userId: finalUserId,
      customerName: customerName || user?.name || "Customer",
      customerPhone: customerPhone || user?.phone || "",
      customerEmail: customerEmail || user?.email || "",
      shippingAddress,
      items,
      subtotal,
      deliveryFee,
      discount,
      couponCode,
      total,
      paymentMethod: "online",
      paymentStatus: "paid",
      paymentId: razorpay_payment_id,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
    });

    if (!orderResult.success) {
      return mobileApiResponse(
        { success: false, error: orderResult.error || "Payment was verified but order creation failed" },
        500
      );
    }

    return mobileApiResponse({
      success: true,
      message: "Payment verified and order created successfully",
      order: orderResult.order,
    });
  } catch (err: any) {
    console.error("Mobile payment verification error:", err);
    return mobileApiResponse(
      { success: false, error: err.message || "Failed to verify mobile payment" },
      500
    );
  }
}
