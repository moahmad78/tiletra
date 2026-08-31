"use server";

import { prisma } from "@/lib/prisma";
import { findNearest, filterWithinRadius } from "@/lib/delivery/geo";
import { DELIVERY_CONFIG } from "@/lib/delivery/config";

/**
 * F5 / F8 — Weight-Based Carrier Routing & Rider Auto-Assignment Engine
 *
 * Triggered the moment a VendorOrderSplit's fulfillmentStatus → "ready_for_pickup".
 *
 * Routing Rules:
 *   1. Heavy / Bulky (> 300 kg OR isBulky = true):
 *      -> Routes directly to Porter (Tata Ace / Mini-Truck)
 *   2. Medium (20 - 300 kg, non-bulky):
 *      -> Routes directly to Porter (3-Wheeler Ape)
 *   3. Light (0 - 20 kg, non-bulky):
 *      -> Step 1: Search available in-house 2-wheeler riders within 5km radius.
 *      -> Step 2: If no in-house rider available -> Fallback to Borzo Bike API
 *                 (or Porter Bike fallback).
 *
 * Side effects:
 *   - Updates VendorOrderSplit (carrierName, vehicleType, thirdPartyRef, thirdPartyProvider)
 *   - Dispatches navigation push to in-house rider OR books 3rd-party delivery
 *   - Broadcasts real-time Socket.IO events to admin and customer rooms
 */
export async function autoAssignNearestRider(
  vendorId: string,
  orderId: string,
  splitId: string
): Promise<{
  assigned: boolean;
  carrier?: string;
  vehicleType?: string;
  riderId?: string;
  riderName?: string;
  distanceKm?: number;
  fallbackTriggered?: boolean;
  fallbackBookingId?: string;
  error?: string;
}> {
  try {
    // 1. Load VendorOrderSplit metadata (weight & bulkiness)
    const split = await prisma.vendorOrderSplit.findUnique({
      where: { id: splitId },
      select: {
        id: true,
        totalWeightKg: true,
        isBulky: true,
        vehicleType: true,
      },
    });

    const totalWeightKg = split?.totalWeightKg ?? 2.5;
    const isBulky = split?.isBulky ?? false;

    // 2. Load vendor to get pickup coordinates
    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
      select: {
        id: true,
        businessName: true,
        businessAddress: true,
        contactPhone: true,
        latitude: true,
        longitude: true,
      },
    });

    if (!vendor) {
      return { assigned: false, error: "Vendor not found" };
    }

    if (vendor.latitude == null || vendor.longitude == null) {
      console.warn(
        `[CarrierRouting] Vendor ${vendorId} has no GPS — cannot auto-assign carrier for order ${orderId}`
      );
      return { assigned: false, error: "Vendor GPS coordinates missing" };
    }

    // 3. Load order for customer drop coordinates
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        customerName: true,
        customerPhone: true,
        deliveryLatitude: true,
        deliveryLongitude: true,
        deliveryAddress: true,
        deliveryCity: true,
        deliveryState: true,
        deliveryPostalCode: true,
        deliveryName: true,
        deliveryPhone: true,
      },
    });

    if (!order) {
      return { assigned: false, error: "Order not found" };
    }

    const safeVendor = {
      ...vendor,
      latitude: vendor.latitude!,
      longitude: vendor.longitude!,
    };

    // ── F8: WEIGHT-BASED CARRIER ROUTING ENGINE ─────────────────────────────

    // TIER 3: Heavy / Bulky (> 300kg or isBulky) -> Porter Tata Ace / Mini-Truck
    if (isBulky || totalWeightKg > 300) {
      console.info(
        `[CarrierRouting] Order ${orderId} Split ${splitId}: Weight ${totalWeightKg}kg (Bulky: ${isBulky}) -> Routing to Porter (Tata Ace)`
      );
      const booking = await routeToPorterVehicle(safeVendor, order, splitId, "small-truck", "tata-ace");
      return {
        assigned: false,
        carrier: "porter",
        vehicleType: "tata-ace",
        fallbackTriggered: true,
        fallbackBookingId: booking.bookingId,
        error: booking.error,
      };
    }

    // TIER 2: Medium (20 - 300kg) -> Porter 3-Wheeler (Ape)
    if (totalWeightKg > 20) {
      console.info(
        `[CarrierRouting] Order ${orderId} Split ${splitId}: Weight ${totalWeightKg}kg -> Routing to Porter (3-Wheeler)`
      );
      const booking = await routeToPorterVehicle(safeVendor, order, splitId, "3-wheeler-auto", "3-wheeler");
      return {
        assigned: false,
        carrier: "porter",
        vehicleType: "3-wheeler",
        fallbackTriggered: true,
        fallbackBookingId: booking.bookingId,
        error: booking.error,
      };
    }

    // TIER 1: Light (0 - 20kg, non-bulky) -> In-House Rider with Borzo Bike Fallback
    console.info(
      `[CarrierRouting] Order ${orderId} Split ${splitId}: Weight ${totalWeightKg}kg -> Attempting In-House Rider Search`
    );

    // 4. Find all available in-house riders
    const availableRiders = await prisma.deliveryPartner.findMany({
      where: { status: "available", isActive: true },
      select: {
        id: true,
        name: true,
        phone: true,
        userId: true,
        vehicleType: true,
        currentLatitude: true,
        currentLongitude: true,
        lastLocationAt: true,
      },
    });

    const candidatesWithCoords = availableRiders
      .filter((r) => r.currentLatitude != null && r.currentLongitude != null)
      .map((r) => ({
        ...r,
        latitude: r.currentLatitude,
        longitude: r.currentLongitude,
      }));

    const nearbyRiders = filterWithinRadius(
      safeVendor.latitude,
      safeVendor.longitude,
      candidatesWithCoords,
      DELIVERY_CONFIG.RIDER_SEARCH_RADIUS_KM
    );

    // In-House Rider NOT available -> Fallback to Borzo Bike API
    if (nearbyRiders.length === 0) {
      console.warn(
        `[CarrierRouting] No in-house rider within ${DELIVERY_CONFIG.RIDER_SEARCH_RADIUS_KM}km -> Triggering Borzo Bike fallback`
      );
      const fallbackResult = await routeToBorzoBike(safeVendor, order, splitId, totalWeightKg);
      return {
        assigned: false,
        carrier: fallbackResult.carrier || "borzo",
        vehicleType: "bike",
        fallbackTriggered: true,
        fallbackBookingId: fallbackResult.bookingId,
        error: fallbackResult.error,
      };
    }

    // In-House Rider FOUND -> Assign nearest rider
    const { candidate: nearestRider, distanceKm } = nearbyRiders[0];

    await prisma.$transaction([
      prisma.order.update({
        where: { id: orderId },
        data: {
          deliveryPartnerId: nearestRider.id,
          deliveryAssignedAt: new Date(),
          orderStatus: "Dispatched",
        },
      }),
      prisma.deliveryPartner.update({
        where: { id: nearestRider.id },
        data: { status: "on_delivery" },
      }),
      prisma.vendorOrderSplit.update({
        where: { id: splitId },
        data: {
          thirdPartyProvider: "in_house",
          vehicleType: "bike",
        },
      }),
    ]);

    // Push notification to in-house rider with pickup & drop directions
    try {
      const { sendPushToUser } = await import("@/lib/push-notifications");
      if (nearestRider.userId) {
        const vendorNavUrl = `https://www.google.com/maps/dir/?api=1&destination=${safeVendor.latitude},${safeVendor.longitude}`;

        await sendPushToUser(nearestRider.userId, {
          title: `📦 New Pickup (${totalWeightKg}kg) — ${safeVendor.businessName}`,
          body: `Order #${orderId.slice(-6)}: Pickup from ${safeVendor.businessName}. Deliver to ${order.deliveryName || order.customerName}.`,
          data: {
            type: "rider_assigned",
            orderId,
            splitId,
            vendorId,
            vendorName: safeVendor.businessName,
            vendorAddress: safeVendor.businessAddress,
            vendorLat: safeVendor.latitude,
            vendorLng: safeVendor.longitude,
            vendorNavUrl,
            customerName: order.deliveryName || order.customerName,
            customerAddress: order.deliveryAddress,
            customerLat: order.deliveryLatitude,
            customerLng: order.deliveryLongitude,
          },
        });
      }
    } catch (pushErr) {
      console.warn("[RiderAssign] Push notification to rider failed:", pushErr);
    }

    // Socket broadcasts
    try {
      const { emitSocketEvent } = await import("@/lib/socket-server-emit");
      await emitSocketEvent({
        room: "admin-room",
        event: "rider-assigned",
        data: {
          orderId,
          splitId,
          riderId: nearestRider.id,
          riderName: nearestRider.name,
          carrier: "in_house",
          vehicleType: "bike",
          distanceKm: distanceKm.toFixed(2),
          vendorId,
        },
      });
      await emitSocketEvent({
        room: `order_${orderId}`,
        event: "order-status-updated",
        data: {
          orderId,
          orderStatus: "Dispatched",
          riderAssigned: true,
          carrier: "in_house",
          riderName: nearestRider.name,
          riderPhone: nearestRider.phone,
        },
      });
    } catch (socketErr) {
      console.warn("[RiderAssign] Socket emit failed:", socketErr);
    }

    return {
      assigned: true,
      carrier: "in_house",
      vehicleType: "bike",
      riderId: nearestRider.id,
      riderName: nearestRider.name,
      distanceKm,
    };
  } catch (error: any) {
    console.error("[CarrierRouting] autoAssignNearestRider error:", error);
    return { assigned: false, error: error?.message || "Auto-assignment failed" };
  }
}

/**
 * Routes delivery to Borzo (WeFast) Bike API for light packages (0-20kg).
 * If Borzo fails or is not configured, gracefully falls back to Porter Bike.
 */
async function routeToBorzoBike(
  vendor: {
    id: string;
    businessName: string;
    businessAddress: string | null;
    contactPhone: string;
    latitude: number;
    longitude: number;
  },
  order: {
    id: string;
    customerName: string;
    customerPhone: string;
    deliveryLatitude: number | null;
    deliveryLongitude: number | null;
    deliveryAddress: string | null;
    deliveryCity: string | null;
    deliveryState: string | null;
    deliveryPostalCode: string | null;
    deliveryName: string | null;
    deliveryPhone: string | null;
  },
  splitId: string,
  weightKg: number
): Promise<{ bookingId?: string; carrier?: string; error?: string }> {
  try {
    const { createBorzoDelivery } = await import("@/lib/delivery/borzo");

    const borzoResult = await createBorzoDelivery({
      pickup: {
        address: vendor.businessAddress || vendor.businessName,
        lat: vendor.latitude,
        lng: vendor.longitude,
        contact_name: vendor.businessName,
        contact_phone: vendor.contactPhone,
      },
      drop: {
        address: order.deliveryAddress || order.customerName,
        lat: order.deliveryLatitude || undefined,
        lng: order.deliveryLongitude || undefined,
        contact_name: order.deliveryName || order.customerName,
        contact_phone: order.deliveryPhone || order.customerPhone,
      },
      order_id: order.id,
      total_weight_kg: weightKg,
    });

    if (borzoResult.success && borzoResult.bookingId) {
      await prisma.vendorOrderSplit.update({
        where: { id: splitId },
        data: {
          thirdPartyRef: borzoResult.bookingId,
          thirdPartyProvider: "borzo",
          vehicleType: "bike",
        },
      });

      try {
        const { notifyAdminPush } = await import("@/lib/push-notifications");
        await notifyAdminPush({
          title: `🛵 Borzo Bike Booked — Order #${order.id.slice(-6)}`,
          body: `Light order (${weightKg}kg) sent via Borzo Bike. Booking: ${borzoResult.bookingId}`,
          data: { orderId: order.id, type: "borzo_booked", bookingId: borzoResult.bookingId },
        });
      } catch {}

      return { bookingId: borzoResult.bookingId, carrier: "borzo" };
    }

    // If Borzo returned error, fall back to Porter Bike
    console.warn(`[CarrierRouting] Borzo booking failed (${borzoResult.error}) — falling back to Porter Bike`);
    const porterResult = await routeToPorterVehicle(vendor, order, splitId, "bike", "bike");
    return { ...porterResult, carrier: "porter" };
  } catch (err: any) {
    console.error("[CarrierRouting] routeToBorzoBike error:", err);
    return { error: err?.message };
  }
}

/**
 * Routes delivery to Porter with a specific vehicle type (3-Wheeler or Tata Ace).
 */
async function routeToPorterVehicle(
  vendor: {
    id: string;
    businessName: string;
    businessAddress: string | null;
    contactPhone: string;
    latitude: number;
    longitude: number;
  },
  order: {
    id: string;
    customerName: string;
    customerPhone: string;
    deliveryLatitude: number | null;
    deliveryLongitude: number | null;
    deliveryAddress: string | null;
    deliveryCity: string | null;
    deliveryState: string | null;
    deliveryPostalCode: string | null;
    deliveryName: string | null;
    deliveryPhone: string | null;
  },
  splitId: string,
  porterVehicle: "bike" | "3-wheeler-auto" | "small-truck" | "large-truck",
  vehicleLabel: string
): Promise<{ bookingId?: string; error?: string }> {
  try {
    if (!order.deliveryLatitude || !order.deliveryLongitude) {
      return { error: "Customer GPS coordinates missing — cannot book Porter" };
    }

    const { createPorterDelivery } = await import("@/lib/delivery/porter");

    const result = await createPorterDelivery({
      pickup: {
        address: {
          street_address1: vendor.businessAddress || vendor.businessName,
          city: "Bengaluru",
          state: "Karnataka",
          pincode: "560000",
          country: "India",
          lat: vendor.latitude,
          lng: vendor.longitude,
        },
        contact: {
          name: vendor.businessName,
          mobile: { country_code: "+91", mobile: vendor.contactPhone.replace(/\D/g, "").slice(-10) },
        },
      },
      drop: {
        address: {
          street_address1: order.deliveryAddress || order.customerName,
          city: order.deliveryCity || "Bengaluru",
          state: order.deliveryState || "Karnataka",
          pincode: order.deliveryPostalCode || "560000",
          country: "India",
          lat: order.deliveryLatitude,
          lng: order.deliveryLongitude,
        },
        contact: {
          name: order.deliveryName || order.customerName,
          mobile: {
            country_code: "+91",
            mobile: (order.deliveryPhone || order.customerPhone).replace(/\D/g, "").slice(-10),
          },
        },
      },
      customer: {
        name: order.customerName,
        mobile: { country_code: "+91", mobile: order.customerPhone.replace(/\D/g, "").slice(-10) },
      },
      order_id: order.id,
      vehicle_type: porterVehicle,
      notes: `IntriHub delivery — Vehicle: ${vehicleLabel} — Order #${order.id}`,
    });

    if (result.success && result.bookingId) {
      await prisma.vendorOrderSplit.update({
        where: { id: splitId },
        data: {
          thirdPartyRef: result.bookingId,
          thirdPartyProvider: "porter",
          vehicleType: vehicleLabel,
        },
      });

      try {
        const { notifyAdminPush } = await import("@/lib/push-notifications");
        await notifyAdminPush({
          title: `🚚 Porter (${vehicleLabel}) Booked — Order #${order.id.slice(-6)}`,
          body: `Order booked on Porter (${vehicleLabel}). Booking ID: ${result.bookingId}`,
          data: { orderId: order.id, type: "porter_booked", bookingId: result.bookingId, vehicleLabel },
        });
      } catch {}

      return { bookingId: result.bookingId };
    } else {
      console.error(`[CarrierRouting] Porter (${vehicleLabel}) booking failed:`, result.error);
      return { error: result.error };
    }
  } catch (error: any) {
    console.error(`[CarrierRouting] routeToPorterVehicle error:`, error);
    return { error: error?.message };
  }
}
