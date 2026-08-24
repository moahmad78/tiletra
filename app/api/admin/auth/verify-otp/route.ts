import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin2FaOtp } from "@/lib/actions/admin-auth-2fa";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, otp } = body;

    const result = await verifyAdmin2FaOtp({ email, otp });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.message },
        { status: 400 }
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
