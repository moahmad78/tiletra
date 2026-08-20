import { NextResponse } from "next/server";
import QRCode from "qrcode";

export async function POST(req: Request) {
  try {
    const { amount, receipt, notes } = await req.json();

    const key_id = process.env.RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;

    if (!key_id || !key_secret) {
      return NextResponse.json(
        { error: "Razorpay API credentials not configured" },
        { status: 500 }
      );
    }

    const parsedAmount = Math.round(Number(amount));
    if (!parsedAmount || parsedAmount < 100) {
      return NextResponse.json(
        { error: "Amount must be at least ₹1 (100 paise)" },
        { status: 400 }
      );
    }

    const authHeader = "Basic " + Buffer.from(`${key_id}:${key_secret}`).toString("base64");
    const expireBy = Math.floor(Date.now() / 1000) + 900; // 15 minutes from now

    // 1. Create Razorpay Payment Link / QR
    const payload = {
      amount: parsedAmount,
      currency: "INR",
      accept_partial: false,
      description: `Intrihub Order ${receipt || ""}`,
      customer: {
        name: "Intrihub Customer",
      },
      notify: {
        sms: false,
        email: false,
        whatsapp: false,
      },
      reminder_enable: false,
      expire_by: expireBy,
      notes: {
        receipt: receipt || `rcpt_${Date.now()}`,
        source: "Intrihub Scan & Pay QR",
        ...notes,
      },
    };

    const res = await fetch("https://api.razorpay.com/v1/payment_links", {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errData = await res.json();
      console.error("Razorpay Payment Link API Error:", errData);
      return NextResponse.json(
        { error: errData?.error?.description || "Failed to generate QR Code from Razorpay" },
        { status: res.status }
      );
    }

    const data = await res.json();
    const paymentUrl = data.short_url;

    // 2. Generate high-resolution QR Code image
    const qrDataUrl = await QRCode.toDataURL(paymentUrl, {
      width: 320,
      margin: 1.5,
      color: {
        dark: "#052a51",
        light: "#ffffff",
      },
    });

    return NextResponse.json({
      success: true,
      qrId: data.id,
      paymentUrl: data.short_url,
      qrDataUrl,
      amount: data.amount,
      currency: data.currency,
      expireBy,
      status: data.status,
    });
  } catch (error: any) {
    console.error("Error creating QR code:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error generating QR code" },
      { status: 500 }
    );
  }
}
