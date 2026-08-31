/**
 * IntriHub — Borzo (WeFast) API Client (F8)
 *
 * Handles hyperlocal 2-wheeler bike delivery booking for light orders (0-20kg, non-bulky)
 * like switches, wires, small paint cans, plumbing parts, and hardware.
 *
 * Borzo API Docs: https://borzodelivery.com/in/business-api/docs
 * Environment vars required:
 *   BORZO_API_KEY          — Borzo Business Auth Token
 *   BORZO_API_URL          — Base URL (default: https://robot.borzodelivery.com/api/business/1.2)
 *   BORZO_WEBHOOK_SECRET   — Secret for verifying Borzo incoming webhooks
 */

const BORZO_BASE_URL =
  process.env.BORZO_API_URL || "https://robot.borzodelivery.com/api/business/1.2";
const BORZO_API_KEY = process.env.BORZO_API_KEY || "";

export interface BorzoAddress {
  address: string;
  lat?: number;
  lng?: number;
  contact_name: string;
  contact_phone: string;
}

export interface BorzoDeliveryParams {
  pickup: BorzoAddress;
  drop: BorzoAddress;
  order_id: string;
  total_weight_kg?: number;
  matter?: string;
  notes?: string;
}

export interface BorzoBookingResponse {
  success: boolean;
  bookingId?: string;
  trackingUrl?: string;
  estimatedDeliveryAt?: string;
  price?: { amount: number; currency: string };
  error?: string;
  rawResponse?: any;
}

/**
 * Creates a Borzo hyperlocal bike delivery booking.
 * Pickup = Vendor shop, Drop = Customer site.
 */
export async function createBorzoDelivery(
  params: BorzoDeliveryParams
): Promise<BorzoBookingResponse> {
  if (!BORZO_API_KEY) {
    console.warn("[Borzo] BORZO_API_KEY not configured — delivery not booked");
    return { success: false, error: "Borzo API key not configured" };
  }

  try {
    const cleanPickupPhone = params.pickup.contact_phone.replace(/\D/g, "").slice(-10);
    const cleanDropPhone = params.drop.contact_phone.replace(/\D/g, "").slice(-10);

    const body = {
      type: "standard",
      matter: params.matter || `IntriHub Order #${params.order_id}`,
      total_weight_kg: Math.min(20, Math.max(1, Math.ceil(params.total_weight_kg || 1))),
      vehicle_type_id: 8, // 8 = Motorbike in Borzo India
      points: [
        {
          address: params.pickup.address,
          contact_person: {
            name: params.pickup.contact_name,
            phone: cleanPickupPhone,
          },
          ...(params.pickup.lat && params.pickup.lng
            ? { latitude: params.pickup.lat, longitude: params.pickup.lng }
            : {}),
          note: params.notes || `Pickup building materials for Order #${params.order_id}`,
        },
        {
          address: params.drop.address,
          contact_person: {
            name: params.drop.contact_name,
            phone: cleanDropPhone,
          },
          ...(params.drop.lat && params.drop.lng
            ? { latitude: params.drop.lat, longitude: params.drop.lng }
            : {}),
          note: `Deliver to customer. Order #${params.order_id}`,
        },
      ],
    };

    const res = await fetch(`${BORZO_BASE_URL}/create-order`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-DV-Auth-Token": BORZO_API_KEY,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok || data?.is_successful === false) {
      console.error("[Borzo] Booking failed:", data);
      return {
        success: false,
        error: data?.errors?.join(", ") || data?.message || `Borzo API error: ${res.status}`,
        rawResponse: data,
      };
    }

    const orderData = data?.order || data;
    const bookingId = String(orderData?.order_id || orderData?.id || "");
    const trackingUrl = orderData?.tracking_url || `https://borzodelivery.com/in/tracking/${bookingId}`;

    console.info(`[Borzo] Bike delivery created: ${bookingId} for Order ${params.order_id}`);

    return {
      success: true,
      bookingId,
      trackingUrl,
      estimatedDeliveryAt: orderData?.delivery_interval?.to,
      price: orderData?.delivery_fee_amount
        ? { amount: Number(orderData.delivery_fee_amount), currency: "INR" }
        : undefined,
      rawResponse: data,
    };
  } catch (error: any) {
    console.error("[Borzo] createBorzoDelivery error:", error);
    return {
      success: false,
      error: error?.message || "Failed to create Borzo delivery",
    };
  }
}

/**
 * Maps Borzo order statuses to IntriHub fulfillmentStatus values.
 */
export function mapBorzoStatusToFulfillment(borzoStatus: string): string | null {
  const statusMap: Record<string, string> = {
    "active": "confirmed",
    "courier_assigned": "confirmed",
    "courier_departed": "ready_for_pickup",
    "courier_arrived": "ready_for_pickup",
    "parcel_picked_up": "picked_up",
    "in_transit": "out_for_delivery",
    "completed": "delivered",
    "canceled": "cancelled",
    "failed": "cancelled",
  };

  const lower = borzoStatus.toLowerCase().trim();
  return statusMap[lower] || null;
}
