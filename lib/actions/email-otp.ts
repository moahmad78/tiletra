"use server";

import { prisma } from "@/lib/prisma";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.EMAIL_FROM || "Intrihub <onboarding@resend.dev>";
const OTP_EXPIRY_MINUTES = 10;

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ─── Send OTP ────────────────────────────────────────────────────────────────

export async function sendEmailOtp(
  email: string
): Promise<{ success: boolean; message: string }> {
  const cleanEmail = email.trim().toLowerCase();

  if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    return { success: false, message: "Please enter a valid email address." };
  }

  // Invalidate any previous unused tokens for this email
  await prisma.emailOtpToken.updateMany({
    where: { email: cleanEmail, used: false },
    data: { used: true },
  });

  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  await prisma.emailOtpToken.create({
    data: { email: cleanEmail, otp, expiresAt },
  });

  // Send email via Resend
  try {
    if (!process.env.RESEND_API_KEY) {
      // Dev fallback: log the OTP to console
      console.log(`[DEV] Email OTP for ${cleanEmail}: ${otp}`);
      return {
        success: true,
        message: `OTP sent to ${cleanEmail}. (Dev mode: check server console)`,
      };
    }

    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: cleanEmail,
      subject: "Your Intrihub Login Code",
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#f9fafb;border-radius:16px;">
          <div style="text-align:center;margin-bottom:24px;">
            <h1 style="font-size:28px;font-weight:900;color:#052a51;margin:0;">Intrihub</h1>
            <p style="color:#6b7280;font-size:13px;margin:4px 0 0;">Everything for Every Space</p>
          </div>

          <div style="background:#fff;border-radius:12px;padding:28px;text-align:center;border:1px solid #e5e7eb;">
            <p style="color:#374151;font-size:15px;margin:0 0 20px;">Your one-time login code is:</p>
            <div style="font-size:40px;font-weight:900;letter-spacing:12px;color:#052a51;margin:0 0 20px;font-family:monospace;">
              ${otp}
            </div>
            <p style="color:#9ca3af;font-size:12px;margin:0;">This code expires in ${OTP_EXPIRY_MINUTES} minutes. Do not share it with anyone.</p>
          </div>

          <p style="color:#d1d5db;font-size:11px;text-align:center;margin-top:20px;">
            If you didn't request this, you can safely ignore this email.
          </p>
        </div>
      `,
    });

    if (error) {
      console.error("Resend error:", error);
      return { success: false, message: "Failed to send OTP email. Please try again." };
    }

    return { success: true, message: `OTP sent to ${cleanEmail}` };
  } catch (err) {
    console.error("sendEmailOtp error:", err);
    return { success: false, message: "Failed to send OTP. Please try again." };
  }
}

// ─── Verify OTP ───────────────────────────────────────────────────────────────

export async function verifyEmailOtp(
  email: string,
  otp: string
): Promise<{ success: boolean; message: string; userId?: string }> {
  const cleanEmail = email.trim().toLowerCase();

  const token = await prisma.emailOtpToken.findFirst({
    where: {
      email: cleanEmail,
      otp,
      used: false,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!token) {
    return {
      success: false,
      message: "Invalid or expired OTP. Please request a new code.",
    };
  }

  // Mark token as used
  await prisma.emailOtpToken.update({
    where: { id: token.id },
    data: { used: true },
  });

  // Upsert user — email-only users get a synthetic phone placeholder
  const syntheticPhone = `email_${cleanEmail.replace(/[^a-z0-9]/gi, "_")}`;

  const user = await prisma.user.upsert({
    where: { email: cleanEmail },
    update: { emailVerified: true, authProvider: "email" },
    create: {
      email: cleanEmail,
      phone: syntheticPhone,
      emailVerified: true,
      phoneVerified: false,
      authProvider: "email",
      name: cleanEmail.split("@")[0], // default name = email prefix
    },
  });

  return {
    success: true,
    message: "Email verified successfully!",
    userId: user.id,
  };
}
