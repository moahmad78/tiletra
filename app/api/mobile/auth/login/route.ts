import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateMobileTokens, mobileApiResponse, handleMobileCorsOptions } from "@/lib/mobile-auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { verifyEmailOtp } from "@/lib/actions/email-otp";

export async function OPTIONS() {
  return handleMobileCorsOptions();
}

export async function POST(req: NextRequest) {
  try {
    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "127.0.0.1";

    // 1. IP Rate Limiting (max 10 requests per minute per IP)
    const rateCheck = checkRateLimit(`mobile-login-ip:${clientIp}`, 10, 60 * 1000);
    if (!rateCheck.allowed) {
      return mobileApiResponse(
        { success: false, error: "Too many login attempts. Please wait a minute." },
        429
      );
    }

    const body = await req.json().catch(() => ({}));
    const { identifier, phone, email, name, otp } = body;

    const input = identifier || phone || email;
    if (!input || typeof input !== "string") {
      return mobileApiResponse(
        { success: false, error: "Please provide a phone number or email address" },
        400
      );
    }

    // 2. Prevent Uncredentialed Authentication Bypass
    // Direct token issuance without an OTP or verified credential is strictly disallowed.
    if (!otp || typeof otp !== "string" || otp.trim().length !== 6) {
      return mobileApiResponse(
        {
          success: false,
          error: "Verification code (OTP) required. Direct passwordless login without token verification is disabled.",
        },
        401
      );
    }

    const isEmail = input.includes("@");
    let user: any = null;

    if (isEmail) {
      const cleanEmail = input.trim().toLowerCase();

      // Verify OTP through standard single-use expiring token store
      const otpVerify = await verifyEmailOtp(cleanEmail, otp.trim(), "customer");
      if (!otpVerify.success) {
        return mobileApiResponse(
          { success: false, error: otpVerify.message || "Invalid or expired verification code" },
          401
        );
      }

      user = await prisma.user.findUnique({
        where: { email: cleanEmail },
        include: {
          addresses: {
            orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
          },
        },
      });

      if (!user) {
        user = await prisma.user.create({
          data: {
            email: cleanEmail,
            phone: `email_${cleanEmail.replace(/[^a-z0-9]/gi, "_")}`,
            name: name || cleanEmail.split("@")[0],
            role: "customer",
            emailVerified: true,
          },
          include: { addresses: true },
        });
      }
    } else {
      const cleanPhone = input.replace(/\D/g, "");
      if (cleanPhone.length !== 10) {
        return mobileApiResponse(
          { success: false, error: "Please enter a valid 10-digit phone number" },
          400
        );
      }

      // Verify OTP against EmailOtpToken table or synthetic phone identifier
      const syntheticEmail = `phone_${cleanPhone}@intrihub.local`;
      const token = await prisma.emailOtpToken.findFirst({
        where: {
          email: syntheticEmail,
          otp: otp.trim(),
          used: false,
          expiresAt: { gt: new Date() },
        },
      });

      const isDevOtpAllowed =
        process.env.NODE_ENV !== "production" &&
        (process.env.ALLOW_DEV_MOCK_AUTH === "true" || !process.env.NODE_ENV);

      if (!token && (!isDevOtpAllowed || otp !== "123456")) {
        return mobileApiResponse(
          { success: false, error: "Invalid or expired verification code" },
          401
        );
      }

      if (token) {
        await prisma.emailOtpToken.update({
          where: { id: token.id },
          data: { used: true },
        });
      }

      user = await prisma.user.upsert({
        where: { phone: cleanPhone },
        update: {
          phoneVerified: true,
          name: name || undefined,
        },
        create: {
          phone: cleanPhone,
          name: name || `User ${cleanPhone.slice(-4)}`,
          phoneVerified: true,
          role: "customer",
        },
        include: {
          addresses: {
            orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
          },
        },
      });
    }

    const tokens = generateMobileTokens({
      id: user.id,
      role: user.role,
      email: user.email,
      phone: user.phone,
      name: user.name,
    });

    return mobileApiResponse({
      success: true,
      message: "Login successful",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
        phoneVerified: user.phoneVerified,
        emailVerified: user.emailVerified,
        addresses: user.addresses,
      },
      tokens,
    });
  } catch (err: any) {
    console.error("Mobile login error:", err);
    return mobileApiResponse(
      { success: false, error: err.message || "Failed to process mobile login" },
      500
    );
  }
}
