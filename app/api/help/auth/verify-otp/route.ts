import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const ALLOWED_SUPPORT_EMAIL = "info@intrihub.com";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const cleanEmail = (body.email || "").trim().toLowerCase();
    const cleanOtp = (body.otp || "").trim();

    // STRICT CHECK: Only info@intrihub.com is allowed
    if (cleanEmail !== ALLOWED_SUPPORT_EMAIL) {
      return NextResponse.json(
        { success: false, error: "Access Denied: Only info@intrihub.com is authorized." },
        { status: 403 }
      );
    }

    if (!cleanOtp || cleanOtp.length !== 6) {
      return NextResponse.json(
        { success: false, error: "Please enter a valid 6-digit OTP code." },
        { status: 400 }
      );
    }

    const token = await prisma.emailOtpToken.findFirst({
      where: {
        email: cleanEmail,
        otp: cleanOtp,
        used: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired OTP. Please verify the code or request a new one." },
        { status: 400 }
      );
    }

    // Mark token as used
    await prisma.emailOtpToken.update({
      where: { id: token.id },
      data: { used: true },
    });

    const response = NextResponse.json({
      success: true,
      email: cleanEmail,
      message: "Authentication successful.",
    });

    // Set secure cookie for /help session (7 days validity)
    response.cookies.set("intrihub_help_session", "authenticated_info_intrihub", {
      httpOnly: false, // Accessible to client-side auth state
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (err) {
    console.error("Error verifying Help Desk OTP:", err);
    return NextResponse.json(
      { success: false, error: "Authentication failed. Server error." },
      { status: 500 }
    );
  }
}
