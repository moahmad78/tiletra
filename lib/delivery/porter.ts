/**
 * IntriHub — Porter Enterprise API Client (F6)
 *
 * Handles third-party delivery booking as a fallback when no in-house
 * rider is available within the search radius/timeout.
 *
 * Porter API Docs: https://documentation.porter.in/
 * Environment vars required:
 *   PORTER_API_KEY       — Porter Enterprise API key
 *   PORTER_WEBHOOK_SECRET — HMAC secret for verifying Porter webhooks
 */

const PORTER_BASE_URL =
  process.env.PORTER_API_URL || "https://pfe-apigw-uat.porter.in/v1";
const PORTER_API_KEY = process.env.PORTER_API_KEY || "";

export interface PorterAddress {
  street_address1: string;
  street_address2?: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  lat: number;
  lng: number;
}

export interface PorterContact {
  name: string;
  mobile: { country_code: string; mobile: string };
}

export interface PorterDeliveryParams {
  pickup: {
    address: PorterAddress;
    contact: PorterContact;
  };
  drop: {
    address: PorterAddress;
    contact: PorterContact;
  };
  customer: {
    name: string;
    mobile: { country_code: string; mobile: string };
    email?: string;
  };
  order_id: string; // IntriHub order/split ID for reconciliation
  vehicle_type?: "bike" | "3-wheeler-auto" | "small-truck" | "large-truck";
  notes?: string;
}

export interface PorterBookingResponse {
  success: boolean;
  bookingId?: string;
  trackingUrl?: string;
  estimatedPickupAt?: string;
  estimatedDeliveryAt?: string;
  price?: { amount: number; currency: string };
  error?: string;
  rawResponse?: any;
}

/**
 * Creates a Porter delivery booking.
 * Pickup = vendor shop, Drop = customer site.
 *
 * Returns bookingId and tracking URL for storage in VendorOrderSplit.thirdPartyRef
 */
export async function createPorterDelivery(
  params: PorterDeliveryParams
): Promise<PorterBookingResponse> {
  if (!PORTER_API_KEY) {
    console.warn("[Porter] PORTER_API_KEY not configured — delivery not booked");
    return { success: false, error: "Porter API key not configured" };
  }

  try {
    const body = {
      request_id: `intrihub_${params.order_id}_${Date.now()}`,
      delivery_instructions: {
        instructions_list: params.notes
          ? [{ type: "text", description: params.notes }]
          : [],
      },
      pickup_details: {
        address: {
          apartment_address: params.pickup.address.street_address1,
          street_address1: params.pickup.address.street_address1,
          street_address2: params.pickup.address.street_address2 || "",
          landmark: params.pickup.address.landmark || "",
          city: params.pickup.address.city,
          state: params.pickup.address.state,
          pincode: params.pickup.address.pincode,
          country: params.pickup.address.country || "India",
          lat: params.pickup.address.lat,
          lng: params.pickup.address.lng,
        },
        contact: {
          name: params.pickup.contact.name,
          phone_number: params.pickup.contact.mobile.mobile,
          email: "",
        },
      },
      drop_details: {
        address: {
          apartment_address: params.drop.address.street_address1,
          street_address1: params.drop.address.street_address1,
          street_address2: params.drop.address.street_address2 || "",
          landmark: params.drop.address.landmark || "",
          city: params.drop.address.city,
          state: params.drop.address.state,
          pincode: params.drop.address.pincode,
          country: params.drop.address.country || "India",
          lat: params.drop.address.lat,
          lng: params.drop.address.lng,
        },
        contact: {
          name: params.drop.contact.name,
          phone_number: params.drop.contact.mobile.mobile,
          email: "",
        },
      },
      order_detail: {
        order_number: params.order_id,
        type: "goods",
        item_type: "building_materials",
      },
    };

    const res = await fetch(`${PORTER_BASE_URL}/orders/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": PORTER_API_KEY,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("[Porter] Booking failed:", data);
      return {
        success: false,
        error: data?.message || `Porter API error: ${res.status}`,
        rawResponse: data,
      };
    }

    const orderId = data?.order_id || data?.id;
    const trackingUrl = data?.tracking_url || data?.order?.tracking_url;

    console.info(`[Porter] Booking created: ${orderId} for IntriHub order ${params.order_id}`);

    return {
      success: true,
      bookingId: String(orderId),
      trackingUrl: trackingUrl || null,
      estimatedPickupAt: data?.estimated_pickup_time,
      estimatedDeliveryAt: data?.estimated_delivery_time,
      price: data?.fare
        ? { amount: data.fare.amount, currency: data.fare.currency || "INR" }
        : undefined,
      rawResponse: data,
    };
  } catch (error: any) {
    console.error("[Porter] createPorterDelivery error:", error);
    return {
      success: false,
      error: error?.message || "Failed to create Porter delivery",
    };
  }
}

/**
 * Verifies that a webhook POST from Porter is genuine using HMAC-SHA256.
 * Call this inside the webhook route handler before processing any event.
 */
export function verifyPorterWebhookSignature(
  rawBody: string,
  signature: string
): boolean {
  const secret = process.env.PORTER_WEBHOOK_SECRET;
  if (!secret) {
    console.warn("[Porter] PORTER_WEBHOOK_SECRET not configured — skipping webhook verification");
    return true; // Permissive fallback for dev; in prod, always set this
  }

  try {
    const crypto = require("crypto");
    const expected = crypto
      .createHmac("sha256", secret)
      .update(rawBody)
      .digest("hex");
    return expected === signature;
  } catch {
    return false;
  }
}

/**
 * Maps Porter delivery status codes to IntriHub fulfillmentStatus values.
 */
export function mapPorterStatusToFulfillment(porterStatus: string): string | null {
  const statusMap: Record<string, string> = {
    "order_accepted": "confirmed",
    "driver_arrived_pickup": "ready_for_pickup",
    "pickup_done": "picked_up",
    "in_transit": "out_for_delivery",
    "reached_drop": "out_for_delivery",
    "delivered": "delivered",
    "cancelled": "cancelled",
    "pickup_cancelled": "cancelled",
  };

  const lower = porterStatus.toLowerCase().replace(/\s+/g, "_");
  return statusMap[lower] || null;
}
