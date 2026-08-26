import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateMobileTokens, mobileApiResponse, handleMobileCorsOptions } from "@/lib/mobile-auth";

export async function OPTIONS() {
  return handleMobileCorsOptions();
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { identifier, phone, email, name } = body;

    const input = identifier || phone || email;
    if (!input || typeof input !== "string") {
      return mobileApiResponse(
        { success: false, error: "Please provide a phone number or email address" },
        400
      );
    }

    const isEmail = input.includes("@");
    let user: any = null;

    if (isEmail) {
      const cleanEmail = input.trim().toLowerCase();
      user = await prisma.user.findUnique({
        where: { email: cleanEmail },
        include: {
          addresses: {
            orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
          },
        },
      });

      if (!user) {
        // Create customer account for mobile user
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
