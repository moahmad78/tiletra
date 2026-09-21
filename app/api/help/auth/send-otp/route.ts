import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { deliverEmail } from "@/lib/actions/email-otp";
import crypto from "crypto";

const ALLOWED_SUPPORT_EMAIL = "info@intrihub.com";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const cleanEmail = (body.email || "").trim().toLowerCase();

    // STRICT CHECK: Only info@intrihub.com is allowed
    if (cleanEmail !== ALLOWED_SUPPORT_EMAIL) {
      return NextResponse.json(
        {
          success: false,
          error: "Access Denied: Only info@intrihub.com is authorized to log into the Customer Support Desk.",
        },
        { status: 403 }
      );
    }

    // Generate secure 6-digit OTP
    const otp = crypto.randomInt(100000, 1000000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes validity

    // Invalidate previous OTP tokens for this email
    await prisma.emailOtpToken.deleteMany({
      where: { email: cleanEmail },
    });

    // Save token in DB
    await prisma.emailOtpToken.create({
      data: {
        email: cleanEmail,
        otp,
        expiresAt,
        used: false,
      },
    });

    // Send email to info@intrihub.com
    const emailHtml = `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:500px;margin:0 auto;padding:32px 20px;background:#071321;color:#f8fafc;border-radius:16px;">
        <div style="text-align:center;margin-bottom:24px;">
          <h1 style="color:#38bdf8;font-size:22px;font-weight:800;margin:0;">IntriHub Connect</h1>
          <p style="color:#94a3b8;font-size:13px;margin:4px 0 0;">Customer Support & Communication Desk</p>
        </div>
        <div style="background:#0a192f;border:1px solid #1e293b;border-radius:12px;padding:24px;text-align:center;">
          <h2 style="font-size:16px;color:#e2e8f0;margin:0 0 8px;">Your One-Time Login Code</h2>
          <p style="color:#94a3b8;font-size:13px;margin:0 0 20px;">Use this 6-digit OTP to access the IntriHub Customer Support Desk at <strong>/help</strong>.</p>
          <div style="background:#051426;border:2px dashed #0284c7;border-radius:10px;padding:16px;display:inline-block;letter-spacing:8px;font-size:32px;font-weight:800;color:#38bdf8;font-family:monospace;">
            ${otp}
          </div>
          <p style="color:#64748b;font-size:12px;margin:20px 0 0;">This code will expire in 5 minutes. If you did not initiate this request, ignore this email.</p>
        </div>
        <div style="text-align:center;margin-top:24px;color:#475569;font-size:11px;">
          IntriHub Customer Support OS • Secure Authentication Portal
        </div>
      </div>
    `;

    const sendResult = await deliverEmail({
      to: cleanEmail,
      subject: `IntriHub Help Desk Login Code: ${otp}`,
      html: emailHtml,
    });

    console.log(`[HELP_DESK_OTP_SENT] to=${cleanEmail} provider=${sendResult.provider}`);

    return NextResponse.json({
      success: true,
      message: "Verification code has been sent to info@intrihub.com. Please check your inbox.",
    });
  } catch (err) {
    console.error("Error sending Help Desk OTP:", err);
    return NextResponse.json(
      { success: false, error: "Failed to send verification email. Please try again." },
      { status: 500 }
    );
  }
}
