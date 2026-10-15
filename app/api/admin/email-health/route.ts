import { NextResponse } from "next/server";
import { checkIsAdmin } from "@/lib/server-auth";
import { getMailTransporter, getFormattedFromEmail } from "@/lib/mail";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const isAdmin = await checkIsAdmin();
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Admin session required." },
        { status: 401 }
      );
    }

    const { host, port, user, configured } = getMailTransporter();
    const emailFrom = getFormattedFromEmail();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development",
      engine: "Titan Mail Direct SMTP (Nodemailer)",
      emailFrom,
      smtp: {
        configured,
        host,
        port,
        user,
      },
    });
  } catch (error: unknown) {
    console.error("[api/admin/email-health Error]:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error querying email health." },
      { status: 500 }
    );
  }
}
