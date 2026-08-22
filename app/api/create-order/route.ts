import { NextRequest, NextResponse } from "next/server";
import { createRazorpayOrder } from "@/lib/actions/orders";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "anonymous";
    const rateCheck = checkRateLimit(`create-order:${ip}`, 30, 60 * 1000); // max 30 orders/min per IP
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: "Too many payment initialization requests. Please wait a moment." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { amount, currency = "INR", receipt, items, couponCode } = body;

    const result = await createRazorpayOrder({
      amount,
      currency,
      receipt,
      items,
      couponCode,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to create Razorpay order" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      order_id: result.order_id,
      amount: result.amount,
      currency: result.currency,
      receipt: result.receipt,
      key_id: result.key_id || process.env.RAZORPAY_KEY_ID,
    });
  } catch (error: any) {
    console.error("Error in create-order route:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
