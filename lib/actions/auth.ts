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
    const cleanEmail = data.email?.trim().toLowerCase();
    let userToUpdate = null;

    // 1. Try finding by database ID if it's a real DB ID
    if (userId && !userId.startsWith("usr-")) {
      userToUpdate = await prisma.user.findUnique({ where: { id: userId } });
    }

    // 2. Fallback: find by email if ID lookup missed
    if (!userToUpdate && cleanEmail) {
      userToUpdate = await prisma.user.findUnique({
        where: { email: cleanEmail },
      });
    }

    let updated;
    if (userToUpdate) {
      updated = await prisma.user.update({
        where: { id: userToUpdate.id },
        data: {
          name: data.name !== undefined ? data.name.trim() : undefined,
          email: cleanEmail || undefined,
          avatar: data.avatar !== undefined ? data.avatar : undefined,
        },
      });
    } else if (cleanEmail) {
      // 3. Upsert if record not in DB yet
      const syntheticPhone = `email_${cleanEmail.replace(/[^a-z0-9]/gi, "_")}`;
      updated = await prisma.user.upsert({
        where: { email: cleanEmail },
        update: {
          name: data.name !== undefined ? data.name.trim() : undefined,
          avatar: data.avatar !== undefined ? data.avatar : undefined,
        },
        create: {
          email: cleanEmail,
          phone: syntheticPhone,
          name: data.name?.trim() || cleanEmail.split("@")[0],
          avatar: data.avatar || null,
          role: "customer",
          emailVerified: true,
          authProvider: "email",
        },
      });
    } else {
      return { success: false, error: "User record not found" };
    }

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
    if (!id || id.startsWith("usr-")) return null;
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

export async function getDbUserByEmail(email: string) {
  try {
    if (!email) return null;
    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
      include: { addresses: true },
    });
    return user;
  } catch (error) {
    console.error("Error fetching db user by email:", error);
    return null;
  }
}

export async function saveUserAddress(userId: string, address: any) {
  try {
    if (!userId || userId.startsWith("usr-")) return { success: false, error: "Valid user ID required" };

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

export async function updateUserPhoneInDb(userId: string, phone: string, email?: string) {
  try {
    if (!userId && !email) return { success: false, error: "User ID or email required" };
    const cleanPhone = phone.replace(/\D/g, "").slice(-10);
    if (cleanPhone.length !== 10) return { success: false, error: "Invalid phone number" };

    // Try to find the user by their DB id first (if it's a real DB id)
    let userToUpdate = null;
    if (userId && !userId.startsWith("usr-")) {
      userToUpdate = await prisma.user.findUnique({ where: { id: userId } });
    }

    // Fallback: find by email ONLY
    if (!userToUpdate && email) {
      userToUpdate = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
    }

    if (!userToUpdate) {
      return { success: false, error: "Account not found. Please log in again." };
    }

    // Check if phone is already taken by a DIFFERENT real user
    const takenByOther = await prisma.user.findFirst({
      where: { phone: cleanPhone, NOT: { id: userToUpdate.id } },
      select: { id: true, phone: true },
    });
    // Only block if the other user has this as a real (non-synthetic) phone
    if (takenByOther && !takenByOther.phone.startsWith("google_") && !takenByOther.phone.startsWith("email_")) {
      return { success: false, error: "This mobile number is already linked to another account" };
    }

    await prisma.user.update({
      where: { id: userToUpdate.id },
      data: { phone: cleanPhone, phoneVerified: true },
    });

    safeRevalidate("/account");
    return { success: true, userId: userToUpdate.id };
  } catch (error: any) {
    console.error("Error updating user phone:", error);
    return { success: false, error: error?.message || "Failed to update phone" };
  }
}

