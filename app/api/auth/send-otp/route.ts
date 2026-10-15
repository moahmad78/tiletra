import { NextRequest, NextResponse } from "next/server";
import { sendEmailOtp, OtpPurpose } from "@/lib/actions/email-otp";
import { validateEmail } from "@/lib/validators";

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

export async function GET() {
  return NextResponse.json({
    status: "ok",
    endpoint: "/api/auth/send-otp",
    provider: process.env.SMTP_HOST || process.env.EMAIL_SERVER_HOST || "smtp.titan.email",
    port: process.env.SMTP_PORT || process.env.EMAIL_SERVER_PORT || "465",
    secure: true,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { email, purpose = "customer", lang = "en" } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { success: false, error: "Please provide a valid email address." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    if (!validateEmail(cleanEmail)) {
      return NextResponse.json(
        { success: false, error: "Invalid email format." },
        { status: 400 }
      );
    }

    const validPurposes: OtpPurpose[] = ["customer", "admin", "vendor", "business"];
    const resolvedPurpose: OtpPurpose = validPurposes.includes(purpose as OtpPurpose)
      ? (purpose as OtpPurpose)
      : "customer";

    console.log(`[API_SEND_OTP] Request received for email=${cleanEmail} purpose=${resolvedPurpose}`);

    const result = await sendEmailOtp(cleanEmail, resolvedPurpose, lang);

    if (!result.success) {
      console.warn(`[API_SEND_OTP_REJECTED] email=${cleanEmail} reason=${result.message}`);
      return NextResponse.json(
        { success: false, error: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: result.message || "Verification OTP sent successfully.",
        expiresIn: result.expiresIn || 600, // 10 minutes in seconds
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[API_SEND_OTP_ERROR] Internal error dispatching OTP:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Internal server error while dispatching OTP.",
      },
      { status: 500 }
    );
  }
}
