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
    let addresses = await prisma.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });

    // If user has few or no saved addresses, automatically backfill from their past orders
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { phone: true },
    });

    const pastOrders = await prisma.order.findMany({
      where: {
        OR: [
          { userId },
          ...(user?.phone ? [{ customerPhone: user.phone }] : []),
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        shippingAddress: true,
        deliveryName: true,
        deliveryPhone: true,
        deliveryHouseNumber: true,
        deliveryBuildingName: true,
        deliveryFloor: true,
        deliveryStreet: true,
        deliveryArea: true,
        deliveryLandmark: true,
        deliveryCity: true,
        deliveryState: true,
        deliveryPostalCode: true,
        deliveryLatitude: true,
        deliveryLongitude: true,
        deliveryInstructions: true,
        deliveryLocationSource: true,
      },
    });

    // Build fingerprint set of existing addresses to prevent duplicates
    const existingFingerprints = new Set(
      addresses.map((a) =>
        `${a.houseNumber || ""}|${a.street || ""}|${a.area || ""}|${a.pincode || ""}`.toLowerCase()
      )
    );

    for (const order of pastOrders) {
      const rawAddr: any = order.shippingAddress || {};
      const street = order.deliveryStreet || rawAddr.street || rawAddr.line1 || rawAddr.area || "";
      const pincode = order.deliveryPostalCode || rawAddr.postalCode || rawAddr.pincode || "560001";
      const houseNumber = order.deliveryHouseNumber || rawAddr.houseNumber || rawAddr.flatNumber || null;
      const buildingName = order.deliveryBuildingName || rawAddr.buildingName || rawAddr.building || null;
      const area = order.deliveryArea || rawAddr.area || rawAddr.line2 || null;
      const city = order.deliveryCity || rawAddr.city || "Bengaluru";
      const state = order.deliveryState || rawAddr.state || "Karnataka";
      const fullName = order.deliveryName || rawAddr.fullName || rawAddr.name || null;
      const phone = order.deliveryPhone || rawAddr.phone || null;

      if (!street && !houseNumber && !area) continue;

      const fp = `${houseNumber || ""}|${street}|${area || ""}|${pincode}`.toLowerCase();
      if (!existingFingerprints.has(fp)) {
        existingFingerprints.add(fp);
        try {
          const created = await prisma.address.create({
            data: {
              userId,
              label: (rawAddr.label as string) || "Home",
              fullName,
              phone,
              houseNumber,
              buildingName,
              floor: order.deliveryFloor || rawAddr.floor || null,
              street: street || "Main Road",
              area,
              landmark: order.deliveryLandmark || rawAddr.landmark || null,
              city,
              state,
              country: "India",
              pincode,
              postalCode: pincode,
              latitude: order.deliveryLatitude || (rawAddr.latitude ? Number(rawAddr.latitude) : null),
              longitude: order.deliveryLongitude || (rawAddr.longitude ? Number(rawAddr.longitude) : null),
              source: order.deliveryLocationSource || "ORDER",
              deliveryInstructions: order.deliveryInstructions || null,
              isDefault: addresses.length === 0,
            },
          });
          addresses.push(created);
        } catch (e) {
          console.warn("[getUserAddresses] Error saving backfilled order address:", e);
        }
      }
    }

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

    const parsedLat = input.latitude !== undefined && input.latitude !== null && !isNaN(Number(input.latitude)) && Number(input.latitude) >= -90 && Number(input.latitude) <= 90 ? Number(input.latitude) : null;
    const parsedLng = input.longitude !== undefined && input.longitude !== null && !isNaN(Number(input.longitude)) && Number(input.longitude) >= -180 && Number(input.longitude) <= 180 ? Number(input.longitude) : null;
    const parsedAcc = input.accuracy !== undefined && input.accuracy !== null && !isNaN(Number(input.accuracy)) && Number(input.accuracy) >= 0 ? Number(input.accuracy) : null;
    const resolvedSource = input.source || (parsedLat !== null && parsedLng !== null ? "GPS" : "MANUAL");

    if (input.id) {
      // Update existing with strict ownership verification
      const existing = await prisma.address.findFirst({
        where: { id: input.id, userId },
      });
      if (!existing) {
        return { success: false, error: "Address not found or unauthorized" };
      }

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
          latitude: parsedLat !== null ? parsedLat : existing.latitude,
          longitude: parsedLng !== null ? parsedLng : existing.longitude,
          accuracy: parsedAcc !== null ? parsedAcc : existing.accuracy,
          source: input.source || existing.source || "MAP_PIN",
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
        latitude: parsedLat,
        longitude: parsedLng,
        accuracy: parsedAcc,
        source: resolvedSource,
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
    const existing = await prisma.address.findFirst({
      where: { id: addressId, userId },
    });
    if (!existing) {
      return { success: false, error: "Address not found or unauthorized" };
    }

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
