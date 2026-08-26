import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyEmailOtp } from "@/lib/actions/email-otp";
import { generateMobileTokens, mobileApiResponse, handleMobileCorsOptions } from "@/lib/mobile-auth";

export async function OPTIONS() {
  return handleMobileCorsOptions();
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { email, phone, otp, name, purpose = "customer" } = body;

    if (!otp || typeof otp !== "string") {
      return mobileApiResponse({ success: false, error: "Please provide a valid 6-digit OTP" }, 400);
    }

    let user: any = null;

    if (email) {
      const cleanEmail = email.trim().toLowerCase();
      const verifyRes = await verifyEmailOtp(cleanEmail, otp, purpose);

      if (!verifyRes.success) {
        return mobileApiResponse({ success: false, error: verifyRes.message }, 400);
      }

      user = await prisma.user.findUnique({
        where: { id: verifyRes.userId },
        include: {
          addresses: {
            orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
          },
        },
      });
    } else if (phone) {
      const cleanPhone = phone.replace(/\D/g, "");
      if (cleanPhone.length !== 10) {
        return mobileApiResponse({ success: false, error: "Invalid phone number" }, 400);
      }

      // Upsert user by phone
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
    } else {
      return mobileApiResponse({ success: false, error: "Please provide email or phone" }, 400);
    }

    if (!user) {
      return mobileApiResponse({ success: false, error: "User not found" }, 404);
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
      message: "Authentication successful",
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
    console.error("Mobile verify-otp error:", err);
    return mobileApiResponse(
      { success: false, error: err.message || "Failed to verify authentication code" },
      500
    );
  }
}
