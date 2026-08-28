"use server";

import { prisma } from "@/lib/prisma";
import { Resend } from "resend";
import { cookies } from "next/headers";
import { STRICT_ADMIN_EMAIL } from "@/lib/admin-constants";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.EMAIL_FROM || "Intrihub Security <noreply@intrihub.com>";
const OTP_EXPIRY_MINUTES = 10;

// Default admin password fallback if not set in environment variable
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Admin@Intrihub#92";

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Step 1: Validate Admin Email + Password, then generate and dispatch 6-digit 2FA OTP
 */
export async function validateAdminCredentialsAndSendOtp(formData: {
  email: string;
  password?: string;
}): Promise<{ success: boolean; message: string; step?: "otp_required" }> {
  const cleanEmail = (formData.email || "").trim().toLowerCase();
  const cleanPassword = (formData.password || "").trim();

  // 1. Strict single email restriction
  if (cleanEmail !== STRICT_ADMIN_EMAIL.toLowerCase()) {
    return {
      success: false,
      message: "Access denied.",
    };
  }

  // 2. Strict Password Verification
  if (!cleanPassword || cleanPassword !== ADMIN_PASSWORD) {
    return {
      success: false,
      message: "Access denied.",
    };
  }

  // 3. Rate limiting (cooldown & hourly limits)
  const { checkRateLimit } = await import("@/lib/rate-limit");
  const cooldown = checkRateLimit(`admin-2fa-cooldown:${cleanEmail}`, 1, 60 * 1000);
  if (!cooldown.allowed) {
    const secondsRemaining = Math.max(1, Math.ceil((cooldown.resetTime - Date.now()) / 1000));
    return {
      success: false,
      message: `Please wait ${secondsRemaining}s before requesting another 2FA code.`,
    };
  }

  const hourly = checkRateLimit(`admin-2fa-hourly:${cleanEmail}`, 6, 60 * 60 * 1000);
  if (!hourly.allowed) {
    return {
      success: false,
      message: "Too many login attempts. Please try again after 1 hour.",
    };
  }

  // 4. Clean expired tokens for this email
  await prisma.emailOtpToken.deleteMany({
    where: {
      email: cleanEmail,
      expiresAt: { lt: new Date() },
    },
  });

  // 5. Generate and store 6-digit OTP
  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  await prisma.emailOtpToken.create({
    data: {
      email: cleanEmail,
      otp,
      expiresAt,
    },
  });

  // 6. Send 2FA email to moahmadmail92@gmail.com
  try {
    if (process.env.RESEND_API_KEY) {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: cleanEmail,
        subject: "🔒 Super Admin 2FA Login Code — Intrihub",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 32px 24px; background: #052a51; color: #ffffff; border-radius: 20px;">
            <div style="text-align: center; margin-bottom: 24px;">
              <h2 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 800;">Intrihub Admin Portal</h2>
              <p style="color: #94a3b8; font-size: 13px; margin: 6px 0 0 0;">Two-Factor Authentication (2FA)</p>
            </div>
            
            <div style="background: #ffffff; color: #052a51; border-radius: 16px; padding: 28px; text-align: center; box-shadow: 0 4px 20px rgba(0,0,0,0.15);">
              <p style="font-size: 14px; font-weight: 600; color: #475569; margin: 0 0 12px 0;">Your 6-Digit Admin Verification Code:</p>
              <div style="font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #F26522; background: #fff7ed; border: 2px dashed #F26522; border-radius: 12px; padding: 14px; margin: 0 auto 16px auto;">
                ${otp}
              </div>
              <p style="font-size: 12px; color: #64748b; margin: 0;">This code is valid for <strong>10 minutes</strong>. Never share this code with anyone.</p>
            </div>
            
            <div style="text-align: center; margin-top: 24px;">
              <p style="font-size: 11px; color: #94a3b8; margin: 0;">If you did not initiate this admin login attempt, please secure your credentials immediately.</p>
            </div>
          </div>
        `,
      });
    } else {
      console.log(`[DEV 2FA OTP for ${cleanEmail}]: ${otp}`);
    }

    return {
      success: true,
      step: "otp_required",
      message: `2FA security code sent to ${cleanEmail}. Please enter the OTP to proceed.`,
    };
  } catch (err: any) {
    console.error("Error sending admin 2FA email:", err);
    return {
      success: false,
      message: "Failed to dispatch 2FA email. Please verify mail service configuration.",
    };
  }
}

/**
 * Step 2: Verify 6-Digit 2FA OTP & grant Admin Session
 */
export async function verifyAdmin2FaOtp(data: {
  email: string;
  otp: string;
}): Promise<{
  success: boolean;
  message: string;
  user?: { id: string; name: string; email: string; role: string };
}> {
  const cleanEmail = (data.email || "").trim().toLowerCase();
  const cleanOtp = (data.otp || "").trim();

  // 1. Strict single email check
  if (cleanEmail !== STRICT_ADMIN_EMAIL.toLowerCase()) {
    return { success: false, message: "Access denied." };
  }

  if (!cleanOtp || cleanOtp.length !== 6) {
    return { success: false, message: "Please enter a valid 6-digit OTP." };
  }

  // 2. Find valid unused token
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
    return {
      success: false,
      message: "Invalid or expired security code. Please request a new OTP.",
    };
  }

  // 3. Mark ALL active tokens for this email as used immediately to prevent replay
  await prisma.emailOtpToken.updateMany({
    where: { email: cleanEmail, used: false },
    data: { used: true },
  });

  // 4. Ensure admin user record in database
  const adminUser = await prisma.user.upsert({
    where: { email: cleanEmail },
    update: {
      role: "admin",
      emailVerified: true,
    },
    create: {
      email: cleanEmail,
      name: "Super Admin",
      role: "admin",
      phone: "admin_moahmad",
      emailVerified: true,
      authProvider: "email",
    },
  });

  // 5. Set secure HTTP-only session cookie
  const cookieStore = await cookies();
  cookieStore.set("intrihub_admin_session", JSON.stringify({
    userId: adminUser.id,
    email: adminUser.email,
    role: "admin",
    verifiedAt: new Date().toISOString(),
  }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  return {
    success: true,
    message: "Admin authentication verified successfully!",
    user: {
      id: adminUser.id,
      name: adminUser.name || "Super Admin",
      email: adminUser.email || cleanEmail,
      role: adminUser.role,
    },
  };
}
