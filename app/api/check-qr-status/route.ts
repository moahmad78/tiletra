import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const qrId = searchParams.get("qrId");

    if (!qrId) {
      return NextResponse.json({ error: "Missing qrId parameter" }, { status: 400 });
    }

    const key_id = process.env.RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;

    if (!key_id || !key_secret) {
      return NextResponse.json(
        { error: "Razorpay API credentials not configured" },
        { status: 500 }
      );
    }

    const authHeader = "Basic " + Buffer.from(`${key_id}:${key_secret}`).toString("base64");

    const res = await fetch(`https://api.razorpay.com/v1/payment_links/${qrId}`, {
      headers: {
        Authorization: authHeader,
      },
    });

    if (!res.ok) {
      const errData = await res.json();
      return NextResponse.json(
        { error: errData?.error?.description || "Failed to fetch QR status" },
        { status: res.status }
      );
    }

    const data = await res.json();

    // Check if status is paid
    const isPaid = data.status === "paid" || data.amount_paid >= data.amount;
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
    console.error("Error checking QR status:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error checking QR status" },
      { status: 500 }
    );
  }
}
