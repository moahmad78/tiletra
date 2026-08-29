import { NextRequest, NextResponse } from "next/server";
import { sendAdminWebOtp } from "@/lib/actions/web-portal-auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

    const result = await sendAdminWebOtp(email);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.message,
          locked: result.locked,
          retryAfterSeconds: result.retryAfterSeconds,
        },
        { status: result.locked ? 423 : 401 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
    });
  } catch (error: any) {
    console.error("Admin Login API error:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
