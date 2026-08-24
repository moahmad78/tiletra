"use server";

import { prisma } from "@/lib/prisma";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.EMAIL_FROM || "Intrihub <onboarding@resend.dev>";
const OTP_EXPIRY_MINUTES = 10;

export type OtpPurpose = "customer" | "admin" | "vendor";

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ─── Send OTP ────────────────────────────────────────────────────────────────

export async function sendEmailOtp(
  email: string,
  purpose: OtpPurpose = "customer"
): Promise<{ success: boolean; message: string }> {
  const cleanEmail = email.trim().toLowerCase();

  if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    return { success: false, message: "Please enter a valid email address." };
  }

  // Strict role-based verification before generating or sending any OTP
  if (purpose === "admin") {
    const adminUser = await prisma.user.findFirst({
      where: {
        email: { equals: cleanEmail, mode: "insensitive" },
        role: { in: ["admin", "staff"] },
      },
    });

    const isHardcodedAdmin = [
      "moahmadmail92@gmail.com",
    ].includes(cleanEmail);

    if (!adminUser && !isHardcodedAdmin) {
      // Generic error — do not reveal whether account exists
      return { success: false, message: "Invalid credentials. Please check your email address." };
    }
  } else if (purpose === "vendor") {
    const vendorRecord = await prisma.vendor.findFirst({
      where: {
        OR: [
          { contactEmail: { equals: cleanEmail, mode: "insensitive" } },
          { owner: { email: { equals: cleanEmail, mode: "insensitive" }, role: "vendor" } },
        ],
      },
    });

    const vendorUser = await prisma.user.findFirst({
      where: {
        email: { equals: cleanEmail, mode: "insensitive" },
        role: "vendor",
      },
    });

    if (!vendorRecord && !vendorUser) {
      // Generic error — do not reveal whether account exists
      return { success: false, message: "Invalid credentials. Please check your email address." };
    }
  }

  const { checkRateLimit } = await import("@/lib/rate-limit");

  // 1. Cooldown limit: 1 request every 60 seconds
  const cooldownCheck = checkRateLimit(`otp-cooldown:${cleanEmail}`, 1, 60 * 1000);
  if (!cooldownCheck.allowed) {
    const secondsRemaining = Math.max(1, Math.ceil((cooldownCheck.resetTime - Date.now()) / 1000));
    return {
      success: false,
      message: `Please wait ${secondsRemaining}s before requesting another verification code.`,
    };
  }

  // 2. Hourly rate limit: max 5 OTP requests per hour
  const hourlyCheck = checkRateLimit(`otp-hourly:${cleanEmail}`, 5, 60 * 60 * 1000);
  if (!hourlyCheck.allowed) {
    return {
      success: false,
      message: "Too many verification requests. Please try again after an hour.",
    };
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
      console.log(`[DEV] Email OTP (${purpose}) for ${cleanEmail}: ${otp}`);
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
      console.warn("Resend notification error (sandbox/domain restriction):", error.message || error);
      // Sandbox fallback: if Resend is in free tier sandbox, fallback to console log
      if (process.env.NODE_ENV !== "production" || (error as any).statusCode === 403) {
        console.log(`[SANDBOX FALLBACK] Email OTP for ${cleanEmail}: ${otp}`);
        return {
          success: true,
          message: `OTP sent to ${cleanEmail}. (Sandbox mode: check console for code)`,
        };
      }
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
  otp: string,
  purpose: OtpPurpose = "customer"
): Promise<{ success: boolean; message: string; userId?: string; role?: string; user?: any }> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanOtp = (otp || "").trim();

  const { recordFailedAttempt, resetFailedAttempts } = await import("@/lib/rate-limit");

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
    const attempt = recordFailedAttempt(`otp-fail:${cleanEmail}`, 5, 15 * 60 * 1000);
    if (attempt.locked) {
      // Invalidate all tokens on excessive failed attempts to prevent brute force
      await prisma.emailOtpToken.updateMany({
        where: { email: cleanEmail, used: false },
        data: { used: true },
      });
      return {
        success: false,
        message: "Too many failed attempts. Active verification code invalidated. Please request a new code.",
      };
    }

    return {
      success: false,
      message: `Invalid or expired OTP. ${attempt.remainingAttempts} attempt(s) remaining.`,
    };
  }

  // Reset failed attempt counter on success
  resetFailedAttempts(`otp-fail:${cleanEmail}`);

  // Mark token as used
  await prisma.emailOtpToken.update({
    where: { id: token.id },
    data: { used: true },
  });

  // Role validation on verification
  if (purpose === "admin") {
    let adminUser = await prisma.user.findFirst({
      where: {
        email: { equals: cleanEmail, mode: "insensitive" },
        role: { in: ["admin", "staff"] },
      },
    });

    if (!adminUser) {
      const isHardcodedAdmin = [
        "moahmadmail92@gmail.com",
      ].includes(cleanEmail);

      if (isHardcodedAdmin) {
        adminUser = await prisma.user.upsert({
          where: { email: cleanEmail },
          update: { emailVerified: true, role: "admin", authProvider: "email" },
          create: {
            email: cleanEmail,
            phone: `email_${cleanEmail.replace(/[^a-z0-9]/gi, "_")}`,
            name: "Super Admin",
            role: "admin",
            emailVerified: true,
            authProvider: "email",
          },
        });
      }
    }

    if (!adminUser || !["admin", "staff"].includes(adminUser.role)) {
      return { success: false, message: "Invalid credentials. Access denied." };
    }

    return {
      success: true,
      message: "Admin authenticated successfully!",
      userId: adminUser.id,
      role: adminUser.role,
      user: {
        id: adminUser.id,
        name: adminUser.name || "Admin",
        email: adminUser.email,
        role: adminUser.role,
        lastLogin: new Date().toISOString(),
      },
    };
  }

  if (purpose === "vendor") {
    const vendorRecord = await prisma.vendor.findFirst({
      where: {
        OR: [
          { contactEmail: { equals: cleanEmail, mode: "insensitive" } },
          { owner: { email: { equals: cleanEmail, mode: "insensitive" }, role: "vendor" } },
        ],
      },
      include: { owner: true },
    });

    if (!vendorRecord) {
      return { success: false, message: "Invalid credentials. Access denied." };
    }

    return {
      success: true,
      message: "Vendor authenticated successfully!",
      userId: vendorRecord.ownerId,
      role: "vendor",
      user: vendorRecord,
    };
  }

  // Customer registration / login — upsert with role: "customer"
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
      role: "customer",
      name: cleanEmail.split("@")[0], // default name = email prefix
    },
  });

  return {
    success: true,
    message: "Email verified successfully!",
    userId: user.id,
    role: user.role,
  };
}
