"use server";

import { prisma } from "@/lib/prisma";
import { checkIsAdmin } from "@/lib/server-auth";
import { safeRevalidate } from "@/lib/formatters";
import {
  createShiprocketOrderForSplit,
  generateShiprocketAWB,
  scheduleShiprocketPickup,
  getShiprocketLabelUrl,
  cancelShiprocketShipment,
  trackShiprocketShipment,
  checkShiprocketServiceability,
  mapShiprocketStatusToFulfillment,
} from "@/lib/delivery/shiprocket";

/**
 * 1. Admin Action: Book Shipment on Shiprocket
 */
export async function bookShiprocketShipmentAction(
  splitId: string,
  courierCompanyId?: number
): Promise<{ success: boolean; message?: string; error?: string; data?: any }> {
  try {
    const isAdmin = await checkIsAdmin();
    if (!isAdmin) {
      return { success: false, error: "Unauthorized: Admin privileges required." };
    }

    if (!splitId) {
      return { success: false, error: "Split ID is required." };
    }

    const res = await createShiprocketOrderForSplit({
      splitId,
      courierCompanyId,
      autoAssignAwb: true,
    });

    if (!res.success) {
      return { success: false, error: res.error || "Failed to create shipment on Shiprocket." };
    }

    safeRevalidate("/admin/deliveries");
    safeRevalidate("/admin/orders");

    return {
      success: true,
      message: `Shiprocket order #${res.shipmentId} booked successfully! AWB: ${res.awbCode || "Assigned"}`,
      data: res,
    };
  } catch (error: any) {
    console.error("[bookShiprocketShipmentAction Error]:", error);
    return { success: false, error: error?.message || "Failed to book Shiprocket shipment." };
  }
}

/**
 * 2. Admin Action: Generate AWB for an existing Shiprocket shipment
 */
export async function generateShiprocketAWBAction(
  splitId: string,
  courierCompanyId?: number
): Promise<{ success: boolean; awbCode?: string; courierName?: string; labelUrl?: string; error?: string }> {
  try {
    const isAdmin = await checkIsAdmin();
    if (!isAdmin) {
      return { success: false, error: "Unauthorized" };
    }

    const split = await prisma.vendorOrderSplit.findUnique({
      where: { id: splitId },
    });

    if (!split || !split.thirdPartyRef) {
      return { success: false, error: "Split does not have a valid Shiprocket shipment reference." };
    }

    const res = await generateShiprocketAWB(split.thirdPartyRef, courierCompanyId);

    if (res.success) {
      safeRevalidate("/admin/deliveries");
    }

    return res;
  } catch (error: any) {
    return { success: false, error: error?.message || "Failed to generate AWB" };
  }
}

/**
 * 3. Admin Action: Schedule Pickup from Vendor Location
 */
export async function scheduleShiprocketPickupAction(
  splitId: string,
  pickupDate?: string
): Promise<{ success: boolean; message?: string; scheduledDate?: string; token?: string; error?: string }> {
  try {
    const isAdmin = await checkIsAdmin();
    if (!isAdmin) {
      return { success: false, error: "Unauthorized" };
    }

    const split = await prisma.vendorOrderSplit.findUnique({
      where: { id: splitId },
    });

    if (!split || !split.thirdPartyRef) {
      return { success: false, error: "Split does not have a valid Shiprocket shipment reference." };
    }

    const res = await scheduleShiprocketPickup(split.thirdPartyRef, pickupDate);

    if (!res.success) {
      return { success: false, error: res.error || "Failed to schedule pickup" };
    }

    safeRevalidate("/admin/deliveries");

    return {
      success: true,
      message: `Pickup scheduled successfully! Token: ${res.pickupTokenNumber || "Confirmed"}`,
      scheduledDate: res.pickupScheduledDate,
      token: res.pickupTokenNumber,
    };
  } catch (error: any) {
    return { success: false, error: error?.message || "Failed to schedule pickup" };
  }
}

/**
 * 4. Admin Action: Get Shipping Label URL
 */
export async function getShiprocketLabelAction(
  splitId: string
): Promise<{ success: boolean; labelUrl?: string; error?: string }> {
  try {
    const isAdmin = await checkIsAdmin();
    if (!isAdmin) {
      return { success: false, error: "Unauthorized" };
    }

    const split = await prisma.vendorOrderSplit.findUnique({
      where: { id: splitId },
    });

    if (!split || !split.thirdPartyRef) {
      return { success: false, error: "Split does not have a valid Shiprocket shipment reference." };
    }

    return await getShiprocketLabelUrl(split.thirdPartyRef);
  } catch (error: any) {
    return { success: false, error: error?.message || "Failed to fetch shipping label" };
  }
}

/**
 * 5. Admin Action: Cancel Shipment
 */
export async function cancelShiprocketShipmentAction(
  splitId: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const isAdmin = await checkIsAdmin();
    if (!isAdmin) {
      return { success: false, error: "Unauthorized" };
    }

    const res = await cancelShiprocketShipment({ splitId });

    if (res.success) {
      safeRevalidate("/admin/deliveries");
      safeRevalidate("/admin/orders");
    }

    return res;
  } catch (error: any) {
    return { success: false, error: error?.message || "Failed to cancel shipment" };
  }
}

/**
 * 6. Admin Action: Live Rate Estimator for a Split
 */
export async function getShiprocketRatesForSplitAction(splitId: string) {
  try {
    const split = await prisma.vendorOrderSplit.findUnique({
      where: { id: splitId },
      include: {
        vendor: {
          select: {
            businessAddress: true,
            latitude: true,
            longitude: true,
          },
        },
      },
    });

    if (!split) return { success: false, error: "Split not found" };

    const order = await prisma.order.findUnique({
      where: { id: split.orderId },
      select: {
        deliveryPostalCode: true,
        deliveryCity: true,
        shippingAddress: true,
        paymentMethod: true,
        total: true,
      },
    });

    if (!order) return { success: false, error: "Order not found" };

    const shippingAddress: any =
      typeof order.shippingAddress === "string" ? {} : order.shippingAddress || {};

    const deliveryPincode =
      order.deliveryPostalCode || shippingAddress.pincode || shippingAddress.postalCode || "560001";

    const rates = await checkShiprocketServiceability({
      pickupPincode: "560001", // Bangalore hub / vendor default
      deliveryPincode,
      weightKg: split.totalWeightKg || 2.0,
      cod: order.paymentMethod === "COD",
      declaredValue: split.subtotal,
    });

    return {
      success: rates.serviceable,
      deliveryPincode,
      ...rates,
    };
  } catch (error: any) {
    return { success: false, error: error?.message || "Failed to check rates" };
  }
}

/**
 * 7. Admin Action: Force Synchronize Shipment Status with Shiprocket
 */
export async function syncShiprocketStatusAction(splitId: string) {
  try {
    const isAdmin = await checkIsAdmin();
    if (!isAdmin) return { success: false, error: "Unauthorized" };

    const split = await prisma.vendorOrderSplit.findUnique({
      where: { id: splitId },
    });

    if (!split || (!split.trackingNumber && !split.thirdPartyRef)) {
      return { success: false, error: "Split has no tracking reference or AWB." };
    }

    const tracking = await trackShiprocketShipment(split.trackingNumber || split.thirdPartyRef!);

    if (!tracking.success) {
      return { success: false, error: tracking.error || "Could not fetch tracking data." };
    }

    const mappedStatus = mapShiprocketStatusToFulfillment(
      tracking.statusCode ?? tracking.currentStatus ?? ""
    );

    if (mappedStatus && mappedStatus !== split.fulfillmentStatus) {
      const updateData: any = { fulfillmentStatus: mappedStatus };

      if (mappedStatus === "delivered") {
        const commissionAmount = Number(((split.subtotal * split.commissionRate) / 100).toFixed(2));
        const vendorPayoutAmount = Number((split.subtotal - commissionAmount).toFixed(2));
        updateData.commissionAmount = commissionAmount;
        updateData.vendorPayoutAmount = vendorPayoutAmount;
        updateData.deliveredAt = new Date();
        updateData.paymentCollected = true;
      }

      await prisma.vendorOrderSplit.update({
        where: { id: split.id },
        data: updateData,
      });

      safeRevalidate("/admin/deliveries");
    }

    return {
      success: true,
      currentStatus: tracking.currentStatus,
      fulfillmentStatus: mappedStatus || split.fulfillmentStatus,
      scans: tracking.scans,
      etd: tracking.etd,
    };
  } catch (error: any) {
    return { success: false, error: error?.message || "Failed to synchronize status" };
  }
}
