"use server";

import { prisma } from "@/lib/prisma";
import { safeRevalidate } from "@/lib/formatters";

export async function upsertCustomerUser(data: {
  phone: string;
  name?: string;
  email?: string;
  avatar?: string;
}) {
  try {
    const cleanPhone = data.phone.replace(/\D/g, "");
    if (cleanPhone.length !== 10) {
      return { success: false, error: "Invalid phone number" };
    }

    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { phone: cleanPhone },
      include: { addresses: true },
    });

    let user;

    if (existing) {
      // User exists: preserve manual customizations (name and avatar)
      // Only set name if existing is empty or a default placeholder
      const shouldUpdateName =
        data.name &&
        (!existing.name || existing.name.startsWith("User ") || existing.name === "Customer");

      // Only set avatar if user hasn't uploaded or customized an avatar yet
      const shouldUpdateAvatar = data.avatar && !existing.avatar;

      user = await prisma.user.update({
        where: { id: existing.id },
        data: {
          phoneVerified: true,
          name: shouldUpdateName ? data.name : undefined,
          email: data.email || undefined,
          avatar: shouldUpdateAvatar ? data.avatar : undefined,
        },
        include: { addresses: true },
      });
    } else {
      // New user: pre-fill name, email, avatar from Google / OAuth
      user = await prisma.user.create({
        data: {
          phone: cleanPhone,
          name: data.name || `User ${cleanPhone.slice(-4)}`,
          email: data.email || undefined,
          avatar: data.avatar || undefined,
          phoneVerified: true,
          role: "customer",
        },
        include: { addresses: true },
      });
    }

    return {
      success: true,
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name || `User ${user.phone.slice(-4)}`,
        email: user.email || undefined,
        avatar: user.avatar || undefined,
        phoneVerified: user.phoneVerified,
        createdAt: user.createdAt.toISOString(),
        addresses: user.addresses.map((a) => ({
          id: a.id,
          name: user.name || "Customer",
          phone: user.phone,
          pincode: a.pincode,
          line1: a.street,
          line2: "",
          city: a.city,
          state: a.state,
          landmark: a.landmark || "",
          label: (a.label as any) || "Home",
          latitude: a.latitude || undefined,
          longitude: a.longitude || undefined,
          isDefault: a.isDefault,
        })),
        defaultAddressId: user.addresses.find((a) => a.isDefault)?.id || user.addresses[0]?.id,
      },
    };
  } catch (error: any) {
    console.error("Error upserting customer user in DB:", error);
    return { success: false, error: error?.message || "Failed to authenticate user" };
  }
}

export async function updateUserProfile(
  userId: string,
  data: { name?: string; email?: string; avatar?: string | null }
) {
  try {
    if (!userId) return { success: false, error: "User ID required" };

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        name: data.name !== undefined ? data.name : undefined,
        email: data.email !== undefined ? data.email : undefined,
        avatar: data.avatar !== undefined ? data.avatar : undefined,
      },
    });

    safeRevalidate("/account");
    safeRevalidate("/account/orders");

    return {
      success: true,
      user: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        avatar: updated.avatar,
        phone: updated.phone,
      },
    };
  } catch (error: any) {
    console.error("Error updating user profile:", error);
    return { success: false, error: error?.message || "Failed to update profile" };
  }
}

export async function getDbUser(id: string) {
  try {
    if (!id) return null;
    const user = await prisma.user.findUnique({
      where: { id },
      include: { addresses: true },
    });
    return user;
  } catch (error) {
    console.error("Error fetching db user:", error);
    return null;
  }
}
