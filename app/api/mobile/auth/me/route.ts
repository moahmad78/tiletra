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

    let emailToUpdate: string | undefined = undefined;
    if (email !== undefined && email !== null) {
      const cleanEmail = String(email).trim().toLowerCase();
      if (user.role === "admin" && cleanEmail !== user.email) {
        return mobileApiResponse(
          { success: false, error: "Super Admin email cannot be changed. This account is strictly protected." },
          403
        );
      }
      if (user.role !== "admin") {
        if (cleanEmail !== user.email) {
          const existingByEmail = await prisma.user.findUnique({
            where: { email: cleanEmail },
          });
          if (existingByEmail && existingByEmail.id !== user.id) {
            return mobileApiResponse(
              { success: false, error: "This email address is already linked to another account." },
              400
            );
          }
        }
        emailToUpdate = cleanEmail;
      }
    }

    // Handle phone update & deduplication/merging
    if (cleanPhone && cleanPhone !== user.phone) {
      const existingUserWithPhone = await prisma.user.findUnique({
        where: { phone: cleanPhone },
        include: {
          orders: { select: { id: true } },
          addresses: true,
          vendor: true,
        },
      });

      if (existingUserWithPhone && existingUserWithPhone.id !== user.id) {
        if (existingUserWithPhone.role === "admin" || existingUserWithPhone.vendor) {
          return mobileApiResponse(
            { success: false, error: "This phone number is registered to an admin or vendor partner account." },
            400
          );
        }

        try {
          // Re-link orders and addresses from existing duplicate account to current user
          if (existingUserWithPhone.orders.length > 0) {
            await prisma.order.updateMany({
              where: { userId: existingUserWithPhone.id },
              data: { userId: user.id },
            });
          }
          if (existingUserWithPhone.addresses.length > 0) {
            await prisma.address.updateMany({
              where: { userId: existingUserWithPhone.id },
              data: { userId: user.id },
            });
          }
          await prisma.user.delete({
            where: { id: existingUserWithPhone.id },
          });
        } catch (mergeErr) {
          console.warn("Could not delete duplicate user, modifying phone instead:", mergeErr);
          try {
            await prisma.user.update({
              where: { id: existingUserWithPhone.id },
              data: { phone: `merged_${existingUserWithPhone.id}_${Date.now()}` },
            });
          } catch {
            return mobileApiResponse(
              { success: false, error: "This phone number is already registered with another account." },
              400
            );
          }
        }
      }
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: name !== undefined ? String(name).trim() : undefined,
        email: emailToUpdate,
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
    if (err?.code === "P2002") {
      const target = String(err?.meta?.target || "");
      if (target.includes("phone")) {
        return mobileApiResponse(
          { success: false, error: "This phone number is already linked to another account." },
          400
        );
      }
      if (target.includes("email")) {
        return mobileApiResponse(
          { success: false, error: "This email address is already linked to another account." },
          400
        );
      }
      return mobileApiResponse(
        { success: false, error: "This account detail is already in use by another user." },
        400
      );
    }
    return mobileApiResponse(
      { success: false, error: err?.message || "Failed to update profile" },
      400
    );
  }
}
