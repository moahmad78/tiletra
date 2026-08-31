"use server";

import { prisma } from "@/lib/prisma";
import { findNearest, filterWithinRadius } from "@/lib/delivery/geo";
import { DELIVERY_CONFIG } from "@/lib/delivery/config";

/**
 * F5 — Auto-Assign Nearest Rider
 *
 * Triggered the moment a VendorOrderSplit's fulfillmentStatus → "ready_for_pickup".
 * Searches for the nearest available in-house DeliveryPartner within the configured
 * radius. If none found → triggers Porter fallback (F6).
 *
 * Side effects:
 *   - Assigns rider to Order (deliveryPartnerId, deliveryAssignedAt)
 *   - Sets DeliveryPartner.status = "on_delivery"
 *   - Sends push notification to rider with vendor pickup location
 *   - On fallback: books Porter, stores thirdPartyRef on VendorOrderSplit
 */
export async function autoAssignNearestRider(
  vendorId: string,
  orderId: string,
  splitId: string
): Promise<{
  assigned: boolean;
  riderId?: string;
  riderName?: string;
  distanceKm?: number;
  fallbackTriggered?: boolean;
  fallbackBookingId?: string;
  error?: string;
}> {
  try {
    // 1. Load vendor to get pickup coordinates
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
        `[RiderAssign] Vendor ${vendorId} has no GPS — cannot auto-assign rider for order ${orderId}`
      );
      return { assigned: false, error: "Vendor GPS coordinates missing" };
    }

    // 2. Load order for customer drop coordinates
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

    // 3. Find all available in-house riders
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

    // Normalise lat/lng field names to match filterWithinRadius expectations
    const candidatesWithCoords = availableRiders
      .filter((r) => r.currentLatitude != null && r.currentLongitude != null)
      .map((r) => ({
        ...r,
        latitude: r.currentLatitude,
        longitude: r.currentLongitude,
      }));

    // 4. Find riders within RIDER_SEARCH_RADIUS_KM of vendor
    const nearbyRiders = filterWithinRadius(
      vendor.latitude,
      vendor.longitude,
      candidatesWithCoords,
      DELIVERY_CONFIG.RIDER_SEARCH_RADIUS_KM
    );

    if (nearbyRiders.length === 0) {
      console.warn(
        `[RiderAssign] No available rider within ${DELIVERY_CONFIG.RIDER_SEARCH_RADIUS_KM} km of vendor ${vendorId} — triggering Porter fallback`
      );
      // Trigger third-party fallback
      const fallbackResult = await triggerThirdPartyFallback(
        {
          ...vendor,
          latitude: vendor.latitude!,
          longitude: vendor.longitude!,
        },
        order,
        splitId
      );
      return {
        assigned: false,
        fallbackTriggered: true,
        fallbackBookingId: fallbackResult.bookingId,
        error: fallbackResult.error,
      };

    }

    // 5. Assign nearest rider
    const { candidate: nearestRider, distanceKm } = nearbyRiders[0];

    await prisma.$transaction([
      // Assign rider to order
      prisma.order.update({
        where: { id: orderId },
        data: {
          deliveryPartnerId: nearestRider.id,
          deliveryAssignedAt: new Date(),
          orderStatus: "Dispatched",
        },
      }),
      // Mark rider as on_delivery
      prisma.deliveryPartner.update({
        where: { id: nearestRider.id },
        data: { status: "on_delivery" },
      }),
    ]);

    // 6. Push notification to rider with BOTH pickup (vendor) and drop (customer) details
    try {
      const { sendPushToUser } = await import("@/lib/push-notifications");
      if (nearestRider.userId) {
        const vendorNavUrl = vendor.latitude && vendor.longitude
          ? `https://www.google.com/maps/dir/?api=1&destination=${vendor.latitude},${vendor.longitude}`
          : null;

        await sendPushToUser(nearestRider.userId, {
          title: `📦 New Pickup — ${vendor.businessName}`,
          body: `Order #${orderId}: Pickup from ${vendor.businessName}${vendor.businessAddress ? ` — ${vendor.businessAddress}` : ""}. Deliver to ${order.deliveryName || order.customerName}.`,
          data: {
            type: "rider_assigned",
            orderId,
            splitId,
            vendorId,
            vendorName: vendor.businessName,
            vendorAddress: vendor.businessAddress,
            vendorLat: vendor.latitude,
            vendorLng: vendor.longitude,
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

    // 7. Socket broadcast — admin room gets real-time rider assignment update
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
          riderName: nearestRider.name,
          riderPhone: nearestRider.phone,
        },
      });
    } catch (socketErr) {
      console.warn("[RiderAssign] Socket emit failed:", socketErr);
    }

    console.info(
      `[RiderAssign] Rider ${nearestRider.name} (${nearestRider.id}) assigned to order ${orderId} — ${distanceKm.toFixed(2)} km from vendor`
    );

    return {
      assigned: true,
      riderId: nearestRider.id,
      riderName: nearestRider.name,
      distanceKm,
    };
  } catch (error: any) {
    console.error("[RiderAssign] autoAssignNearestRider error:", error);
    return { assigned: false, error: error?.message || "Auto-assignment failed" };
  }
}

/**
 * Triggers Porter (or configured third-party) delivery booking as fallback.
 * Called when no in-house rider is within range.
 */
async function triggerThirdPartyFallback(
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
  splitId: string
): Promise<{ bookingId?: string; error?: string }> {
  try {
    if (!order.deliveryLatitude || !order.deliveryLongitude) {
      return { error: "Customer GPS coordinates missing — cannot book Porter" };
    }

    const { createPorterDelivery } = await import("@/lib/delivery/porter");
    const { DELIVERY_CONFIG } = await import("@/lib/delivery/config");

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
      vehicle_type: "bike",
      notes: `IntriHub building materials delivery — Order #${order.id}`,
    });

    if (result.success && result.bookingId) {
      // Store Porter booking reference on the split
      await prisma.vendorOrderSplit.update({
        where: { id: splitId },
        data: {
          thirdPartyRef: result.bookingId,
          thirdPartyProvider: DELIVERY_CONFIG.THIRD_PARTY_PROVIDER,
        },
      });

      // Notify admin about Porter fallback
      try {
        const { notifyAdminPush } = await import("@/lib/push-notifications");
        await notifyAdminPush({
          title: `🚗 Porter Fallback — Order #${order.id}`,
          body: `No in-house rider found. Porter booked: ${result.bookingId}`,
          data: { orderId: order.id, type: "porter_fallback", bookingId: result.bookingId },
        });
      } catch {}

      return { bookingId: result.bookingId };
    } else {
      console.error("[RiderAssign] Porter fallback failed:", result.error);
      return { error: result.error };
    }
  } catch (error: any) {
    console.error("[RiderAssign] triggerThirdPartyFallback error:", error);
    return { error: error?.message };
  }
}
