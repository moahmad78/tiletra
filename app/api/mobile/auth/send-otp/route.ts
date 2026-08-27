import { NextRequest } from "next/server";
import { sendEmailOtp } from "@/lib/actions/email-otp";
import { mobileApiResponse, handleMobileCorsOptions } from "@/lib/mobile-auth";

export async function OPTIONS() {
  return handleMobileCorsOptions();
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { email, phone, purpose = "customer" } = body;

    if (!email && !phone) {
      return mobileApiResponse(
        { success: false, error: "Please provide either an email address or phone number" },
        400
      );
    }

    if (email) {
      const result = await sendEmailOtp(email, purpose);
      if (!result.success) {
        return mobileApiResponse({ success: false, error: result.message }, 400);
      }
      return mobileApiResponse({
        success: true,
        message: result.message,
        channel: "email",
        expiresIn: result.expiresIn || 300,
      });
    }

    // Phone OTP support: for dev/testing or standard 6-digit verification
    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length !== 10) {
      return mobileApiResponse(
        { success: false, error: "Please enter a valid 10-digit phone number" },
        400
      );
    }

    // In non-SMS gateway setup, email is primary OTP channel, or fallback dev OTP
    return mobileApiResponse({
      success: true,
      message: "Verification code prepared for phone verification",
      channel: "phone",
    });
  } catch (err: any) {
    console.error("Mobile send-otp error:", err);
    return mobileApiResponse(
      { success: false, error: err.message || "Failed to send verification code" },
      500
    );
  }
}
