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

    // Check if user already exists by phone
    const existing = await prisma.user.findUnique({
      where: { phone: cleanPhone },
      include: { addresses: true },
    });

    // Check if email already belongs to a user (e.g. Google user merging phone)
    let existingByEmail = null;
    if (data.email) {
      existingByEmail = await prisma.user.findUnique({
        where: { email: data.email },
        include: { addresses: true },
      });
    }

    let user;

    if (existing) {
      // User exists by phone
      const shouldUpdateName =
        data.name &&
        (!existing.name || existing.name.startsWith("User ") || existing.name === "Customer");

      const shouldUpdateAvatar = data.avatar && !existing.avatar;
      const canSetEmail = data.email && (!existingByEmail || existingByEmail.id === existing.id);

      user = await prisma.user.update({
        where: { id: existing.id },
        data: {
          phoneVerified: true,
          name: shouldUpdateName ? data.name : undefined,
          email: canSetEmail ? data.email : undefined,
          avatar: shouldUpdateAvatar ? data.avatar : undefined,
        },
        include: { addresses: true },
      });
    } else if (existingByEmail) {
      // User exists by email (e.g. Google login with synthetic phone) -> Link real phone
      user = await prisma.user.update({
        where: { id: existingByEmail.id },
        data: {
          phone: cleanPhone,
          phoneVerified: true,
          name: data.name || existingByEmail.name,
          avatar: data.avatar || existingByEmail.avatar,
        },
        include: { addresses: true },
      });
    } else {
      // New user
      user = await prisma.user.create({
        data: {
          phone: cleanPhone,
          name: data.name || `User ${cleanPhone.slice(-4)}`,
          email: data.email || null,
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

export async function saveUserAddress(userId: string, address: any) {
  try {
    if (!userId) return { success: false, error: "User ID required" };

    const userExists = await prisma.user.findUnique({ where: { id: userId } });
    if (!userExists) return { success: false, error: "User not found" };

    const created = await prisma.address.create({
      data: {
        userId,
        street: `${address.line1 || ""}${address.line2 ? `, ${address.line2}` : ""}`,
        city: address.city || "Bangalore",
        state: address.state || "Karnataka",
        pincode: address.pincode || "560001",
        landmark: address.landmark || null,
        label: address.label || "Home",
        latitude: address.latitude ? Number(address.latitude) : null,
        longitude: address.longitude ? Number(address.longitude) : null,
        isDefault: Boolean(address.isDefault),
      },
    });

    safeRevalidate("/account");
    safeRevalidate("/checkout");

    return { success: true, address: created };
  } catch (error: any) {
    console.error("Error saving user address to DB:", error);
    return { success: false, error: error?.message || "Failed to save address" };
  }
}
