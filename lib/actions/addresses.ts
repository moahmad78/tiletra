"use server";

import { prisma } from "@/lib/prisma";
import { safeRevalidate } from "@/lib/formatters";

export interface AddressInput {
  id?: string;
  userId?: string;
  label?: string; // Home | Work | Site | Other
  fullName?: string | null;
  phone?: string | null;
  houseNumber?: string | null;
  buildingName?: string | null;
  floor?: string | null;
  street: string;
  area?: string | null;
  landmark?: string | null;
  city?: string;
  district?: string | null;
  state?: string;
  country?: string;
  pincode?: string;
  postalCode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  accuracy?: number | null;
  source?: string; // GPS | MAP_PIN | SEARCH | MANUAL
  deliveryInstructions?: string | null;
  isDefault?: boolean;
}

export async function getUserAddresses(userId: string) {
  try {
    if (!userId) return [];
    const addresses = await prisma.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });
    return addresses;
  } catch (error) {
    console.error("Error fetching user addresses:", error);
    return [];
  }
}

export async function saveAddress(userId: string, input: AddressInput) {
  try {
    if (!userId) return { success: false, error: "User ID is required" };
    if (!input.street) return { success: false, error: "Street address is required" };

    const pincode = input.postalCode || input.pincode || "560001";

    // If setting as default, unset other defaults
    if (input.isDefault) {
      await prisma.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    if (input.id) {
      // Update existing
      const updated = await prisma.address.update({
        where: { id: input.id },
        data: {
          label: input.label || "Home",
          fullName: input.fullName || null,
          phone: input.phone || null,
          houseNumber: input.houseNumber || null,
          buildingName: input.buildingName || null,
          floor: input.floor || null,
          street: input.street,
          area: input.area || null,
          landmark: input.landmark || null,
          city: input.city || "Bangalore",
          district: input.district || null,
          state: input.state || "Karnataka",
          country: input.country || "India",
          pincode: pincode,
          postalCode: pincode,
          latitude: input.latitude !== undefined && input.latitude !== null ? Number(input.latitude) : null,
          longitude: input.longitude !== undefined && input.longitude !== null ? Number(input.longitude) : null,
          accuracy: input.accuracy !== undefined && input.accuracy !== null ? Number(input.accuracy) : null,
          source: input.source || "MAP_PIN",
          deliveryInstructions: input.deliveryInstructions || null,
          isDefault: Boolean(input.isDefault),
        },
      });

      safeRevalidate("/checkout");
      safeRevalidate("/profile");
      return { success: true, address: updated };
    }

    // Create new
    const created = await prisma.address.create({
      data: {
        userId,
        label: input.label || "Home",
        fullName: input.fullName || null,
        phone: input.phone || null,
        houseNumber: input.houseNumber || null,
        buildingName: input.buildingName || null,
        floor: input.floor || null,
        street: input.street,
        area: input.area || null,
        landmark: input.landmark || null,
        city: input.city || "Bangalore",
        district: input.district || null,
        state: input.state || "Karnataka",
        country: input.country || "India",
        pincode: pincode,
        postalCode: pincode,
        latitude: input.latitude !== undefined && input.latitude !== null ? Number(input.latitude) : null,
        longitude: input.longitude !== undefined && input.longitude !== null ? Number(input.longitude) : null,
        accuracy: input.accuracy !== undefined && input.accuracy !== null ? Number(input.accuracy) : null,
        source: input.source || "GPS",
        deliveryInstructions: input.deliveryInstructions || null,
        isDefault: Boolean(input.isDefault),
      },
    });

    safeRevalidate("/checkout");
    safeRevalidate("/profile");
    return { success: true, address: created };
  } catch (error: any) {
    console.error("Error saving address:", error);
    return { success: false, error: error?.message || "Failed to save address" };
  }
}

export async function deleteAddress(userId: string, addressId: string) {
  try {
    await prisma.address.deleteMany({
      where: { id: addressId, userId },
    });
    safeRevalidate("/checkout");
    safeRevalidate("/profile");
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting address:", error);
    return { success: false, error: error?.message || "Failed to delete address" };
  }
}

export async function setDefaultAddress(userId: string, addressId: string) {
  try {
    await prisma.$transaction([
      prisma.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      }),
      prisma.address.updateMany({
        where: { id: addressId, userId },
        data: { isDefault: true },
      }),
    ]);
    safeRevalidate("/checkout");
    safeRevalidate("/profile");
    return { success: true };
  } catch (error: any) {
    console.error("Error setting default address:", error);
    return { success: false, error: error?.message || "Failed to set default address" };
  }
}
