import { NextResponse } from "next/server";
import Razorpay from "razorpay";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const qrId = searchParams.get("qrId");

    if (!qrId) {
      return NextResponse.json({ error: "Missing qrId parameter" }, { status: 400 });
    }

    const key_id = (process.env.RAZORPAY_KEY_ID || "").trim();
    const key_secret = (process.env.RAZORPAY_KEY_SECRET || "").trim();

    if (!key_id || !key_secret) {
      return NextResponse.json(
        { error: "Razorpay API credentials not configured on server" },
        { status: 500 }
      );
    }

    const razorpay = new Razorpay({
      key_id,
      key_secret,
    });

    const data: any = await razorpay.paymentLink.fetch(qrId);

    const isPaid = data.status === "paid" || (data.amount_paid && data.amount_paid >= data.amount);
    const paymentId = data.payments && data.payments.length > 0 ? data.payments[0]?.payment_id : null;

    return NextResponse.json({
      success: true,
      status: data.status,
      isPaid,
      amount: data.amount,
      amountPaid: data.amount_paid,
      paymentId,
      updatedAt: data.updated_at,
    });
  } catch (error: any) {
    console.error("[Check QR Status] Error:", error?.error || error?.message || error);
    return NextResponse.json(
      {
        error:
          error?.error?.description ||
          error?.message ||
          "Internal server error checking QR status",
      },
      { status: 500 }
    );
  }
}
