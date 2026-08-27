import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedMobileUser, mobileApiResponse, handleMobileCorsOptions } from "@/lib/mobile-auth";

export async function OPTIONS() {
  return handleMobileCorsOptions();
}

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedMobileUser(req);
    if (!user) {
      return mobileApiResponse({ success: false, error: "Unauthorized" }, 401);
    }

    const orderCount = await prisma.order.count({
      where: { userId: user.id },
    });

    return mobileApiResponse({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
        phoneVerified: user.phoneVerified,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
        addresses: user.addresses,
        orderCount,
      },
    });
  } catch (err: any) {
    console.error("Mobile auth/me error:", err);
    return mobileApiResponse(
      { success: false, error: err.message || "Failed to fetch profile" },
      500
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getAuthenticatedMobileUser(req);
    if (!user) {
      return mobileApiResponse({ success: false, error: "Unauthorized" }, 401);
    }

    const body = await req.json().catch(() => ({}));
    const { name, email, avatar, phone } = body;

    let cleanPhone: string | undefined = undefined;
    if (phone !== undefined && phone !== null) {
      const digits = String(phone).replace(/\D/g, "");
      if (digits.length === 10) {
        cleanPhone = digits;
      } else if (digits.length === 12 && digits.startsWith("91")) {
        cleanPhone = digits.slice(2);
      } else if (digits.length > 0) {
        return mobileApiResponse(
          { success: false, error: "Please enter a valid 10-digit phone number" },
          400
        );
      }
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: name !== undefined ? name : undefined,
        email: email !== undefined ? email : undefined,
        phone: cleanPhone !== undefined ? cleanPhone : undefined,
        avatar: avatar !== undefined ? avatar : undefined,
      },
      include: {
        addresses: {
          orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
        },
      },
    });

    return mobileApiResponse({
      success: true,
      user: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        phone: updated.phone,
        role: updated.role,
        avatar: updated.avatar,
        phoneVerified: updated.phoneVerified,
        emailVerified: updated.emailVerified,
        addresses: updated.addresses,
      },
    });
  } catch (err: any) {
    console.error("Mobile profile update error:", err);
    return mobileApiResponse(
      { success: false, error: err.message || "Failed to update profile" },
      500
    );
  }
}
