import { NextRequest, NextResponse } from "next/server";
import { sendEmailOtp, OtpPurpose } from "@/lib/actions/email-otp";
import { validateStrictEmail } from "@/lib/validations/schemas";
import { checkRateLimit } from "@/lib/rate-limit";
import { verifyTurnstileToken } from "@/lib/turnstile";

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
    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "127.0.0.1";

    // 1. Per-IP Rate Limiting (Defense against bot email-flooding attacks)
    // Max 5 OTP send requests per hour per IP address
    const ipRateCheck = checkRateLimit(`otp_send_ip:${clientIp}`, 5, 60 * 60 * 1000);
    if (!ipRateCheck.allowed) {
      console.warn(`[API_SEND_OTP_RATE_LIMITED] ip=${clientIp} exceeded 5 OTP requests/hour`);
      return NextResponse.json(
        {
          success: false,
          error: "Too many verification requests from this device/network. Please try again after 1 hour.",
        },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { email, purpose = "customer", lang = "en", turnstileToken } = body;

    // 2. Bot Protection (Cloudflare Turnstile verification)
    const turnstileCheck = await verifyTurnstileToken(turnstileToken, clientIp);
    if (!turnstileCheck.success) {
      return NextResponse.json(
        { success: false, error: turnstileCheck.error || "Bot verification failed." },
        { status: 403 }
      );
    }

    // 3. Strict Zod Email Validation & Disposable Domain Blocking
    const emailValidation = validateStrictEmail(email);
    if (!emailValidation.valid || !emailValidation.email) {
      return NextResponse.json(
        { success: false, error: emailValidation.error || "Please enter a valid email address." },
        { status: 400 }
      );
    }
    const cleanEmail = emailValidation.email;

    const validPurposes: OtpPurpose[] = ["customer", "admin", "vendor", "business"];
    const resolvedPurpose: OtpPurpose = validPurposes.includes(purpose as OtpPurpose)
      ? (purpose as OtpPurpose)
      : "customer";

    console.log(`[API_SEND_OTP] Request received for email=${cleanEmail} purpose=${resolvedPurpose} ip=${clientIp}`);

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
