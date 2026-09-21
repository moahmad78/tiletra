import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { deliverEmail } from "@/lib/actions/email-otp";
import crypto from "crypto";

const ALLOWED_SUPPORT_EMAIL = "info@intrihub.com";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const cleanEmail = (body.email || "").trim().toLowerCase();

    // STRICT CHECK: Only info@intrihub.com is authorized
    if (cleanEmail !== ALLOWED_SUPPORT_EMAIL) {
      return NextResponse.json(
        {
          success: false,
          error: "Access Denied: This email is not authorized to access the Customer Support Desk.",
        },
        { status: 403 }
      );
    }

    // Generate secure 6-digit numeric OTP
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

    console.log(`[HELP_DESK_OTP_GENERATED] email=${cleanEmail} otp=${otp} expiresIn=300s`);

    // Clean IntriHub branded HTML email template
    const emailHtml = `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;max-width:520px;margin:0 auto;padding:36px 24px;background:#f8fafc;border-radius:16px;">
        <div style="text-align:center;margin-bottom:24px;">
          <a href="https://www.intrihub.com" target="_blank" style="text-decoration:none;display:inline-block;">
            <img src="https://www.intrihub.com/logo/intri-web-logo.png" alt="IntriHub" width="160" height="42" style="display:block;margin:0 auto;height:42px;width:auto;max-width:180px;border:0;outline:none;" />
          </a>
          <p style="color:#64748b;font-size:13px;margin:8px 0 0;font-weight:600;">Build Better, We Deliver Faster</p>
        </div>

        <div style="background:#ffffff;border-radius:14px;padding:32px 24px;text-align:center;border:1px solid #e2e8f0;box-shadow:0 2px 8px rgba(0,0,0,0.04);">
          <h2 style="font-size:18px;font-weight:800;color:#052a51;margin:0 0 8px;">Help Desk Login Verification Code</h2>
          <p style="color:#64748b;font-size:14px;margin:0 0 24px;line-height:1.5;">
            Use the 6-digit verification code below to securely sign into the <strong>IntriHub Customer Support Operating System</strong>.
          </p>

          <div style="background:#f1f5f9;border:2px dashed #052a51;border-radius:12px;padding:18px 24px;display:inline-block;letter-spacing:10px;font-size:34px;font-weight:900;color:#052a51;font-family:monospace;margin:0 auto 20px;">
            ${otp}
          </div>

          <p style="color:#94a3b8;font-size:12px;margin:0;line-height:1.5;">
            ⏱ This code is valid for <strong>5 minutes</strong>. If you did not request this login code, please contact security immediately.
          </p>
        </div>

        <div style="text-align:center;margin-top:24px;color:#94a3b8;font-size:11px;">
          © ${new Date().getFullYear()} IntriHub Supply Network. All rights reserved. • Customer Support Desk
        </div>
      </div>
    `;

    const sendResult = await deliverEmail({
      to: cleanEmail,
      subject: `IntriHub Support Login Verification Code: ${otp}`,
      html: emailHtml,
    });

    if (!sendResult.success) {
      console.error(`[HELP_DESK_EMAIL_ERROR] provider=${sendResult.provider} error=${sendResult.error}`);
      return NextResponse.json(
        {
          success: false,
          error: sendResult.error || "Unable to send verification code. Please check email address or try again.",
        },
        { status: 500 }
      );
    }

    console.log(`[HELP_DESK_EMAIL_DELIVERED] to=${cleanEmail} provider=${sendResult.provider}`);

    return NextResponse.json({
      success: true,
      message: "Verification code has been sent. Please check your email inbox and spam folder.",
    });
  } catch (err) {
    console.error("Error sending Help Desk OTP:", err);
    return NextResponse.json(
      { success: false, error: "Failed to send verification code. Please check email configuration." },
      { status: 500 }
    );
  }
}
