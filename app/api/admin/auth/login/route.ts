import { NextRequest, NextResponse } from "next/server";
import { validateAdminCredentialsAndSendOtp } from "@/lib/actions/admin-auth-2fa";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    const result = await validateAdminCredentialsAndSendOtp({ email, password });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.message },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      step: result.step,
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
