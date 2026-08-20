import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";

export async function POST(request: NextRequest) {
  try {
    const key_id = process.env.RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;

    if (!key_id || !key_secret) {
      return NextResponse.json(
        { error: "Razorpay credentials not configured on server" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { amount, currency = "INR", receipt } = body;

    // Validate amount
    const parsedAmount = typeof amount === "number" ? amount : parseInt(amount, 10);
    if (!parsedAmount || isNaN(parsedAmount) || parsedAmount < 100) {
      return NextResponse.json(
        { error: "Amount is required and must be at least 100 paise (₹1)" },
        { status: 400 }
      );
    }

    const razorpay = new Razorpay({
      key_id,
      key_secret,
    });

    const options = {
      amount: parsedAmount, // in paise
      currency: currency || "INR",
      receipt: receipt || `rcpt_${Date.now().toString().slice(-8)}`,
      payment_capture: true,
    };

    const order = await razorpay.orders.create(options);

    return NextResponse.json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
    });
  } catch (error: any) {
    console.error("Error creating Razorpay order:", error);
    const statusCode = error?.statusCode || error?.status || 500;
    return NextResponse.json(
      { error: error?.error?.description || error?.message || "Failed to create Razorpay order" },
      { status: statusCode }
    );
  }
}
