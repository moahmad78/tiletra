import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import QRCode from "qrcode";

export async function POST(req: Request) {
  try {
    const key_id = (process.env.RAZORPAY_KEY_ID || "").trim();
    const key_secret = (process.env.RAZORPAY_KEY_SECRET || "").trim();

    if (!key_id || !key_secret) {
      console.error("[Create QR] Missing Razorpay credentials");
      return NextResponse.json(
        { error: "Razorpay API credentials not configured on server" },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { amount, receipt, notes, customerName, customerPhone, customerEmail } = body;

    const parsedAmount = Math.round(Number(amount));
    if (!parsedAmount || parsedAmount < 100) {
      return NextResponse.json(
        { error: "Amount must be at least ₹1 (100 paise)" },
        { status: 400 }
      );
    }

    const razorpay = new Razorpay({
      key_id,
      key_secret,
    });

    const expireBy = Math.floor(Date.now() / 1000) + 16 * 60; // 16 minutes buffer

    const payload = {
      amount: parsedAmount,
      currency: "INR",
      accept_partial: false,
      description: `Intrihub Order ${receipt || ""}`,
      customer: {
        name: customerName || "Intrihub Customer",
        email: customerEmail || "customer@intrihub.com",
        contact: (customerPhone || "9876543210").replace(/[^\d+]/g, ""),
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

    console.log("[Create QR] Initiating Razorpay paymentLink.create with key:", key_id);
    const data: any = await razorpay.paymentLink.create(payload as any);
    console.log("[Create QR] Razorpay Success:", { id: data.id, short_url: data.short_url });

    const paymentUrl = data.short_url;

    // Generate high-resolution QR Code image
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
    console.error("[Create QR] Error creating QR payment link:", error?.error || error?.message || error);
    const errDescription =
      error?.error?.description ||
      error?.description ||
      error?.message ||
      "Failed to generate QR Code from Razorpay";
    return NextResponse.json(
      { error: errDescription, details: error?.error || null },
      { status: 500 }
    );
  }
}
