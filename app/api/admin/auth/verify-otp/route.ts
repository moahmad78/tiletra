import { NextRequest, NextResponse } from "next/server";
import { verifyAdminWebOtp } from "@/lib/actions/web-portal-auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, otp } = body;

    const result = await verifyAdminWebOtp(email, otp);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.message,
          locked: result.locked,
          retryAfterSeconds: result.retryAfterSeconds,
        },
        { status: result.locked ? 423 : 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      user: result.user,
    });
  } catch (error: any) {
    console.error("Admin Verify OTP API error:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
