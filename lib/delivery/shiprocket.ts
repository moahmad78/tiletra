/**
 * IntriHub — Shiprocket Logistics API Client & Automation Engine
 *
 * Full lifecycle delivery management:
 * 1. Shiprocket Authentication with token caching & auto-refresh
 * 2. Courier Serviceability & Live Rate Calculator
 * 3. Vendor Pickup Address Registration
 * 4. Automatic & On-Demand Shipment Creation (Adhoc Orders)
 * 5. AWB Generation & Label Retrieval
 * 6. Pickup Scheduling
 * 7. Real-Time Tracking & Timeline Parsing
 * 8. Cancellation & Reverse/Return Management
 * 9. Webhook Security Verification & Status Mapping
 */

import { prisma } from "@/lib/prisma";

// Configurable constants & environment variables
const SHIPROCKET_BASE_URL =
  process.env.SHIPROCKET_BASE_URL?.trim() || "https://apiv2.shiprocket.in/v2/console";
const SHIPROCKET_EMAIL = process.env.SHIPROCKET_EMAIL?.trim() || "";
const SHIPROCKET_PASSWORD = process.env.SHIPROCKET_PASSWORD?.trim() || "";
const SHIPROCKET_WEBHOOK_TOKEN = process.env.SHIPROCKET_WEBHOOK_TOKEN?.trim() || "";

// Token cache in memory (Shiprocket tokens are valid for 10 days = 240 hours)
let cachedToken: string | null = null;
let tokenExpiryTimestamp = 0;

/**
 * 1. SHIPROCKET AUTHENTICATION
 * Obtains or returns cached JWT token. Automatically refreshes before expiration.
 */
export async function getShiprocketToken(forceRefresh = false): Promise<string> {
  const now = Date.now();
  // Buffer of 1 hour before expiry
  if (!forceRefresh && cachedToken && now < tokenExpiryTimestamp - 60 * 60 * 1000) {
    return cachedToken;
  }

  if (!SHIPROCKET_EMAIL || !SHIPROCKET_PASSWORD) {
    throw new Error(
      "Shiprocket credentials not configured. Please set SHIPROCKET_EMAIL and SHIPROCKET_PASSWORD in environment."
    );
  }

  try {
    const response = await fetch(`${SHIPROCKET_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: SHIPROCKET_EMAIL,
        password: SHIPROCKET_PASSWORD,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      let parsedErr = "";
      try {
        const json = JSON.parse(errText);
        parsedErr = json.message || JSON.stringify(json);
      } catch {
        parsedErr = errText.slice(0, 100);
      }
      throw new Error(`Shiprocket authentication failed (${response.status}): ${parsedErr}`);
    }

    const data = await response.json();
    if (!data.token) {
      throw new Error("Shiprocket authentication response did not contain an auth token.");
    }

    cachedToken = data.token;
    // Set 9 days expiry (token is valid for 10 days)
    tokenExpiryTimestamp = now + 9 * 24 * 60 * 60 * 1000;
    return cachedToken as string;
  } catch (error: any) {
    console.error("[Shiprocket Auth Error]:", error?.message || error);
    throw error;
  }
}

/**
 * Helper to make authenticated requests to Shiprocket API with automatic 401 retry
 */
async function shiprocketFetch<T = any>(
  endpoint: string,
  options: RequestInit = {},
  retry = true
): Promise<T> {
  const token = await getShiprocketToken();
  const url = `${SHIPROCKET_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  const headers = new Headers(options.headers || {});
  headers.set("Content-Type", "application/json");
  headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401 && retry) {
    console.warn("[Shiprocket] Token expired (401). Refreshing token and retrying...");
    cachedToken = null;
    return shiprocketFetch<T>(endpoint, options, false);
  }

  const responseText = await response.text();
  let json: any;
  try {
    json = JSON.parse(responseText);
  } catch {
    json = { raw: responseText };
  }

  if (!response.ok) {
    const message = json?.message || json?.error || responseText || `HTTP ${response.status}`;
    const err = new Error(
      `Shiprocket API request to ${endpoint} failed (${response.status}): ${
        typeof message === "string" ? message : JSON.stringify(message)
      }`
    );
    (err as any).status = response.status;
    (err as any).details = json;
    throw err;
  }

  return json as T;
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. COURIER SERVICEABILITY & LIVE RATE CALCULATOR
// ─────────────────────────────────────────────────────────────────────────────

export interface ShiprocketCourierRate {
  courier_company_id: number;
  courier_name: string;
  rate: number;
  etd: string;
  estimated_delivery_days: string | number;
  rating: number;
  call_courier_type: string; // "Surface" | "Air"
  is_surface: boolean;
  cod: boolean;
  min_weight: number;
}

export interface ServiceabilityParams {
  pickupPincode: string;
  deliveryPincode: string;
  weightKg: number;
  cod?: boolean;
  declaredValue?: number;
  lengthCm?: number;
  breadthCm?: number;
  heightCm?: number;
  isReturn?: boolean;
}

export interface ServiceabilityResult {
  serviceable: boolean;
  recommendedCourierId?: number;
  recommendedCourierName?: string;
  lowestRate?: number;
  couriers: ShiprocketCourierRate[];
  error?: string;
}

/**
 * Checks serviceability and live rates across all available Shiprocket courier partners.
 */
export async function checkShiprocketServiceability(
  params: ServiceabilityParams
): Promise<ServiceabilityResult> {
  try {
    const query = new URLSearchParams({
      pickup_postcode: params.pickupPincode.replace(/\D/g, "").slice(0, 6),
      delivery_postcode: params.deliveryPincode.replace(/\D/g, "").slice(0, 6),
      weight: String(Math.max(0.5, params.weightKg || 1)),
      cod: params.cod ? "1" : "0",
      is_return: params.isReturn ? "1" : "0",
    });

    if (params.declaredValue) {
      query.append("declared_value", String(Math.round(params.declaredValue)));
    }
    if (params.lengthCm) query.append("length", String(Math.round(params.lengthCm)));
    if (params.breadthCm) query.append("breadth", String(Math.round(params.breadthCm)));
    if (params.heightCm) query.append("height", String(Math.round(params.heightCm)));

    const res = await shiprocketFetch<{
      status: number;
      data?: {
        available_courier_companies?: any[];
        shipping_companies?: any[];
        recommended_courier_company_id?: number;
      };
    }>(`/courier/serviceability/?${query.toString()}`);

    const rawCouriers =
      res.data?.available_courier_companies || res.data?.shipping_companies || [];

    if (!rawCouriers || rawCouriers.length === 0) {
      return {
        serviceable: false,
        couriers: [],
        error: "No courier service available for the specified pin codes and package weight.",
      };
    }

    const couriers: ShiprocketCourierRate[] = rawCouriers.map((c: any) => ({
      courier_company_id: Number(c.courier_company_id || c.id),
      courier_name: String(c.courier_name || c.name || "Standard Courier"),
      rate: Number(c.rate || c.freight_charge || 0),
      etd: String(c.etd || c.estimated_delivery_days || "3-5 days"),
      estimated_delivery_days: c.estimated_delivery_days || 4,
      rating: Number(c.rating || 4.0),
      call_courier_type: String(c.call_courier_type || (c.is_surface ? "Surface" : "Air")),
      is_surface: Boolean(c.is_surface),
      cod: Boolean(c.cod),
      min_weight: Number(c.min_weight || 0.5),
    }));

    // Sort by rate (lowest first)
    couriers.sort((a, b) => a.rate - b.rate);

    const recommendedId = res.data?.recommended_courier_company_id || couriers[0]?.courier_company_id;
    const recommended = couriers.find((c) => c.courier_company_id === recommendedId) || couriers[0];

    return {
      serviceable: true,
      recommendedCourierId: recommended?.courier_company_id,
      recommendedCourierName: recommended?.courier_name,
      lowestRate: couriers[0]?.rate,
      couriers,
    };
  } catch (error: any) {
    console.error("[Shiprocket Serviceability Check Error]:", error?.message || error);
    return {
      serviceable: false,
      couriers: [],
      error: error?.message || "Failed to check courier serviceability",
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. VENDOR PICKUP ADDRESS MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generates a clean alphanumeric nickname for the vendor's pickup location in Shiprocket.
 * Shiprocket requirement: alphanumeric with underscores/hyphens, max 36 chars.
 */
export function getVendorPickupNickname(vendor: { id: string; businessName: string }): string {
  const cleanName = vendor.businessName
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 16)
    .toUpperCase();
  const idSuffix = vendor.id.slice(-6).toUpperCase();
  return `IH_${cleanName || "VENDOR"}_${idSuffix}`;
}

/**
 * Registers or validates a vendor's pickup location in Shiprocket.
 */
export async function registerVendorPickupLocation(vendor: {
  id: string;
  businessName: string;
  contactPhone: string;
  contactEmail?: string;
  businessAddress?: string | null;
  city?: string;
  state?: string;
  pincode?: string;
}): Promise<{ success: boolean; pickupLocation: string; error?: string }> {
  const pickupLocation = getVendorPickupNickname(vendor);

  try {
    // 1. Check existing pickup locations
    const existing = await shiprocketFetch<{
      data?: {
        shipping_address?: Array<{
          id: number;
          pickup_location: string;
          pin_code: string;
        }>;
      };
    }>("/settings/company/pickup");

    const addresses = existing.data?.shipping_address || [];
    const found = addresses.find(
      (a) => a.pickup_location.toLowerCase() === pickupLocation.toLowerCase()
    );

    if (found) {
      return { success: true, pickupLocation: found.pickup_location };
    }

    // 2. Register new pickup location
    const cleanPhone = vendor.contactPhone.replace(/\D/g, "").slice(-10);
    const cleanAddress = vendor.businessAddress || `${vendor.businessName} Warehouse, Industrial Area`;

    const body = {
      pickup_location: pickupLocation,
      name: vendor.businessName.slice(0, 40),
      email: vendor.contactEmail || "logistics@intrihub.com",
      phone: cleanPhone.length === 10 ? cleanPhone : "9876543210",
      address: cleanAddress.slice(0, 80),
      address_2: "",
      city: vendor.city || "Bengaluru",
      state: vendor.state || "Karnataka",
      country: "India",
      pin_code: (vendor.pincode || "560001").replace(/\D/g, "").slice(0, 6),
    };

    const res = await shiprocketFetch<{
      success?: boolean;
      message?: string;
      address?: any;
    }>("/settings/company/addpickup", {
      method: "POST",
      body: JSON.stringify(body),
    });

    return {
      success: true,
      pickupLocation,
    };
  } catch (error: any) {
    // If the location already exists or was registered under another case, accept it
    if (error?.message?.toLowerCase().includes("already exists")) {
      return { success: true, pickupLocation };
    }
    console.error(`[Shiprocket Register Pickup] Failed for vendor ${vendor.id}:`, error);
    return {
      success: false,
      pickupLocation,
      error: error?.message || "Failed to register vendor pickup address",
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. AUTOMATIC SHIPMENT CREATION (Adhoc Custom Order)
// ─────────────────────────────────────────────────────────────────────────────

export interface CreateShiprocketOrderParams {
  splitId: string;
  courierCompanyId?: number;
  autoAssignAwb?: boolean;
  lengthCm?: number;
  breadthCm?: number;
  heightCm?: number;
}

export interface CreateShiprocketOrderResponse {
  success: boolean;
  shiprocketOrderId?: number;
  shipmentId?: number;
  awbCode?: string;
  courierName?: string;
  error?: string;
}

/**
 * Creates an adhoc custom order on Shiprocket for a specific VendorOrderSplit.
 * Automatically resolves vendor pickup location, customer delivery address,
 * item specifications, and weight.
 */
export async function createShiprocketOrderForSplit(
  params: CreateShiprocketOrderParams
): Promise<CreateShiprocketOrderResponse> {
  const { splitId, courierCompanyId, autoAssignAwb = true } = params;

  try {
    // 1. Fetch split with vendor and parent order
    const split = await prisma.vendorOrderSplit.findUnique({
      where: { id: splitId },
      include: {
        vendor: true,
      },
    });

    if (!split) {
      return { success: false, error: `VendorOrderSplit ${splitId} not found` };
    }

    const order = await prisma.order.findUnique({
      where: { id: split.orderId },
      include: {
        items: {
          where: { vendorId: split.vendorId },
        },
      },
    });

    if (!order) {
      return { success: false, error: `Parent Order ${split.orderId} not found` };
    }

    // 2. Register/Verify vendor pickup address in Shiprocket
    const pickupReg = await registerVendorPickupLocation({
      id: split.vendor.id,
      businessName: split.vendor.businessName,
      contactPhone: split.vendor.contactPhone,
      contactEmail: split.vendor.contactEmail,
      businessAddress: split.vendor.businessAddress,
    });

    const pickupLocation = pickupReg.pickupLocation;

    // 3. Resolve customer shipping details
    const shippingAddress: any =
      typeof order.shippingAddress === "string"
        ? { street: order.shippingAddress }
        : order.shippingAddress || {};

    const customerName = (order.deliveryName || order.customerName || "Customer").trim();
    const customerPhone = (order.deliveryPhone || order.customerPhone || "")
      .replace(/\D/g, "")
      .slice(-10);
    const customerEmail = order.customerEmail || "customer@intrihub.com";
    const deliveryAddress = (
      order.deliveryAddress ||
      shippingAddress.street ||
      shippingAddress.line1 ||
      "Delivery Address"
    ).slice(0, 90);
    const deliveryCity = order.deliveryCity || shippingAddress.city || "Bengaluru";
    const deliveryState = order.deliveryState || shippingAddress.state || "Karnataka";
    const deliveryPincode = (
      order.deliveryPostalCode ||
      shippingAddress.pincode ||
      shippingAddress.postalCode ||
      "560001"
    )
      .replace(/\D/g, "")
      .slice(0, 6);

    // 4. Resolve items
    const orderItems = (order.items && order.items.length > 0 ? order.items : []).map(
      (item) => ({
        name: item.productName.slice(0, 50),
        sku: item.variantId || item.productId || `ITEM-${item.id.slice(-6)}`,
        units: item.boxQuantity || 1,
        selling_price: Math.max(1, Math.round(item.pricePerBox)),
        discount: 0,
        tax: 0,
        hsn: 6907, // Standard HSN code for ceramic tiles and building materials
      })
    );

    // Fallback if no specific items linked
    if (orderItems.length === 0) {
      orderItems.push({
        name: `IntriHub Material Split #${split.id.slice(-6)}`,
        sku: `IH-SPLIT-${split.id.slice(-6)}`,
        units: 1,
        selling_price: Math.max(1, Math.round(split.subtotal)),
        discount: 0,
        tax: 0,
        hsn: 6907,
      });
    }

    // 5. Weight and dimensions calculation
    const totalWeight = Math.max(0.5, Number(split.totalWeightKg || 1));
    const isBulky = split.isBulky || totalWeight > 50;

    // Dimensions in cm
    const length = params.lengthCm || (isBulky ? 80 : 30);
    const breadth = params.breadthCm || (isBulky ? 60 : 25);
    const height = params.heightCm || (isBulky ? 40 : 20);

    const isCod = order.paymentMethod === "COD";
    const externalOrderId = `IH-${order.id.slice(-6)}-${split.id.slice(-4)}`;

    const adhocPayload = {
      order_id: externalOrderId,
      order_date: new Date().toISOString().replace("T", " ").substring(0, 19),
      pickup_location: pickupLocation,
      billing_customer_name: customerName,
      billing_last_name: "",
      billing_address: deliveryAddress,
      billing_address_2: order.deliveryLandmark || "",
      billing_city: deliveryCity,
      billing_pincode: deliveryPincode,
      billing_state: deliveryState,
      billing_country: "India",
      billing_email: customerEmail,
      billing_phone: customerPhone.length === 10 ? customerPhone : "9876543210",
      shipping_is_billing: true,
      order_items: orderItems,
      payment_method: isCod ? "COD" : "Prepaid",
      sub_total: Math.round(split.subtotal),
      length,
      breadth,
      height,
      weight: totalWeight,
    };

    const adhocRes = await shiprocketFetch<{
      order_id?: number;
      shipment_id?: number;
      status?: string;
      status_code?: number;
    }>("/orders/create/adhoc", {
      method: "POST",
      body: JSON.stringify(adhocPayload),
    });

    const srOrderId = adhocRes.order_id;
    const shipmentId = adhocRes.shipment_id;

    if (!shipmentId) {
      throw new Error("Shiprocket did not return a shipment ID.");
    }

    // 6. Update database with Shiprocket reference
    await prisma.vendorOrderSplit.update({
      where: { id: splitId },
      data: {
        thirdPartyRef: String(shipmentId),
        thirdPartyProvider: "shiprocket",
        vehicleType: isBulky ? "cargo" : "courier",
        fulfillmentStatus: "ready_for_pickup",
      },
    });

    // 7. Auto-assign AWB if requested
    let awbCode: string | undefined;
    let courierName: string | undefined;

    if (autoAssignAwb) {
      try {
        const awbResult = await generateShiprocketAWB(shipmentId, courierCompanyId);
        if (awbResult.success) {
          awbCode = awbResult.awbCode;
          courierName = awbResult.courierName;

          // Also update parent order tracking if it was missing
          await prisma.order.update({
            where: { id: order.id },
            data: {
              trackingNumber: awbCode,
              courierName: courierName || "Shiprocket Courier Partner",
            },
          });
        }
      } catch (awbErr: any) {
        console.warn(`[Shiprocket] Auto AWB assignment warning for shipment ${shipmentId}:`, awbErr);
      }
    }

    return {
      success: true,
      shiprocketOrderId: srOrderId,
      shipmentId,
      awbCode,
      courierName,
    };
  } catch (error: any) {
    console.error("[Shiprocket Create Order Error]:", error?.message || error);
    return {
      success: false,
      error: error?.message || "Failed to create shipment on Shiprocket",
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. AWB GENERATION & SHIPPING LABEL
// ─────────────────────────────────────────────────────────────────────────────

export interface GenerateAWBResult {
  success: boolean;
  awbCode?: string;
  courierCompanyId?: number;
  courierName?: string;
  labelUrl?: string;
  error?: string;
}

/**
 * Assigns a courier partner and generates an AWB for the given Shiprocket shipment ID.
 */
export async function generateShiprocketAWB(
  shipmentId: number | string,
  courierId?: number
): Promise<GenerateAWBResult> {
  try {
    const payload: any = {
      shipment_id: Number(shipmentId),
    };
    if (courierId) {
      payload.courier_id = courierId;
    }

    const res = await shiprocketFetch<{
      awb_assign_status?: number;
      response?: {
        data?: {
          awb_code?: string;
          courier_company_id?: number;
          courier_name?: string;
          shipment_id?: number;
        };
      };
      message?: string;
    }>("/courier/assign/awb", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    const data = res.response?.data;
    const awbCode = data?.awb_code;
    const courierCompanyId = data?.courier_company_id;
    const courierName = data?.courier_name;

    if (!awbCode) {
      throw new Error(res.message || "Could not generate AWB from Shiprocket");
    }

    // Update Split with AWB and Courier name
    await prisma.vendorOrderSplit.updateMany({
      where: {
        thirdPartyRef: String(shipmentId),
        thirdPartyProvider: "shiprocket",
      },
      data: {
        trackingNumber: awbCode,
        courierName: courierName || "Shiprocket Express",
        fulfillmentStatus: "ready_for_pickup",
      },
    });

    // Optionally fetch label URL
    let labelUrl: string | undefined;
    try {
      const labelRes = await getShiprocketLabelUrl(shipmentId);
      if (labelRes.success) {
        labelUrl = labelRes.labelUrl;
      }
    } catch {}

    return {
      success: true,
      awbCode,
      courierCompanyId,
      courierName,
      labelUrl,
    };
  } catch (error: any) {
    console.error(`[Shiprocket AWB Generation Error for ${shipmentId}]:`, error);
    return {
      success: false,
      error: error?.message || "Failed to generate AWB",
    };
  }
}

/**
 * Retrieves the printable shipping label PDF URL from Shiprocket.
 */
export async function getShiprocketLabelUrl(
  shipmentId: number | string
): Promise<{ success: boolean; labelUrl?: string; error?: string }> {
  try {
    const res = await shiprocketFetch<{
      label_created?: number;
      label_url?: string;
    }>("/courier/generate/label", {
      method: "POST",
      body: JSON.stringify({
        shipment_id: [Number(shipmentId)],
      }),
    });

    if (res.label_url) {
      return { success: true, labelUrl: res.label_url };
    }
    return { success: false, error: "Shipping label URL not available yet." };
  } catch (error: any) {
    return { success: false, error: error?.message || "Failed to generate shipping label" };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. PICKUP SCHEDULING
// ─────────────────────────────────────────────────────────────────────────────

export interface SchedulePickupResult {
  success: boolean;
  pickupScheduledDate?: string;
  pickupTokenNumber?: string;
  error?: string;
}

/**
 * Requests courier pickup for the shipment from the vendor's location.
 */
export async function scheduleShiprocketPickup(
  shipmentId: number | string,
  pickupDate?: string // YYYY-MM-DD format
): Promise<SchedulePickupResult> {
  try {
    const payload: any = {
      shipment_id: [Number(shipmentId)],
    };

    if (pickupDate) {
      payload.pickup_date = [pickupDate];
    }

    const res = await shiprocketFetch<{
      pickup_status?: number;
      response?: {
        pickup_scheduled_date?: string;
        pickup_token_number?: string;
        data?: string;
      };
      message?: string;
    }>("/courier/generate/pickup", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    const scheduledDate = res.response?.pickup_scheduled_date;
    const tokenNumber = res.response?.pickup_token_number;

    return {
      success: true,
      pickupScheduledDate: scheduledDate,
      pickupTokenNumber: tokenNumber,
    };
  } catch (error: any) {
    console.error(`[Shiprocket Schedule Pickup Error for ${shipmentId}]:`, error);
    return {
      success: false,
      error: error?.message || "Failed to schedule courier pickup",
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. SHIPMENT TRACKING & TIMELINE PARSING
// ─────────────────────────────────────────────────────────────────────────────

export interface TrackingScan {
  date: string;
  activity: string;
  location: string;
}

export interface TrackingResult {
  success: boolean;
  awb?: string;
  courierName?: string;
  currentStatus?: string;
  statusCode?: number;
  origin?: string;
  destination?: string;
  etd?: string;
  scans: TrackingScan[];
  raw?: any;
  error?: string;
}

/**
 * Retrieves real-time tracking information from Shiprocket by AWB code or shipment ID.
 */
export async function trackShiprocketShipment(
  awbOrShipmentId: string | number
): Promise<TrackingResult> {
  try {
    const identifier = String(awbOrShipmentId).trim();
    const isAwb = /^[0-9A-Za-z_-]{6,}$/.test(identifier);

    const endpoint = isAwb
      ? `/courier/track/awb/${encodeURIComponent(identifier)}`
      : `/courier/track/shipment/${encodeURIComponent(identifier)}`;

    const res = await shiprocketFetch<any>(endpoint);
    const trackingData = res?.tracking_data;

    if (!trackingData) {
      return {
        success: false,
        scans: [],
        error: "No tracking data found for this shipment",
      };
    }

    const trackItem = trackingData.shipment_track?.[0] || {};
    const activities: any[] =
      trackingData.shipment_track_activities || trackItem.scans || [];

    const scans: TrackingScan[] = activities.map((a: any) => ({
      date: a.date || a["date-time"] || "",
      activity: a.activity || a.status || "",
      location: a.location || "",
    }));

    return {
      success: true,
      awb: trackItem.awb_code || String(awbOrShipmentId),
      courierName: trackItem.courier_name || "",
      currentStatus: trackItem.current_status || "In Transit",
      statusCode: Number(trackingData.shipment_status || 0),
      origin: trackItem.origin || "",
      destination: trackItem.destination || "",
      etd: trackItem.etd || "",
      scans,
      raw: trackingData,
    };
  } catch (error: any) {
    console.error(`[Shiprocket Track Error for ${awbOrShipmentId}]:`, error);
    return {
      success: false,
      scans: [],
      error: error?.message || "Failed to retrieve tracking information",
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. CANCELLATION & RETURN MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Cancels a shipment on Shiprocket before pickup.
 */
export async function cancelShiprocketShipment(params: {
  orderId?: number | string;
  awbCode?: string;
  splitId?: string;
}): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const { orderId, awbCode, splitId } = params;

    let res: any;
    if (awbCode) {
      res = await shiprocketFetch("/orders/cancel/shipment/awbs", {
        method: "POST",
        body: JSON.stringify({ awbs: [awbCode] }),
      });
    } else if (orderId) {
      res = await shiprocketFetch("/orders/cancel", {
        method: "POST",
        body: JSON.stringify({ ids: [Number(orderId)] }),
      });
    } else if (splitId) {
      const split = await prisma.vendorOrderSplit.findUnique({
        where: { id: splitId },
      });
      if (split?.trackingNumber) {
        return cancelShiprocketShipment({ awbCode: split.trackingNumber, splitId });
      } else if (split?.thirdPartyRef) {
        return cancelShiprocketShipment({ orderId: split.thirdPartyRef, splitId });
      }
      throw new Error("No AWB or order reference found on this split");
    } else {
      throw new Error("Must provide orderId, awbCode, or splitId to cancel.");
    }

    if (splitId) {
      await prisma.vendorOrderSplit.update({
        where: { id: splitId },
        data: {
          fulfillmentStatus: "cancelled",
          cancelReason: "Cancelled via Shiprocket Logistics",
          cancelledBy: "admin",
        },
      });
    }

    return {
      success: true,
      message: res?.message || "Shiprocket shipment cancelled successfully.",
    };
  } catch (error: any) {
    console.error("[Shiprocket Cancel Error]:", error);
    return {
      success: false,
      error: error?.message || "Failed to cancel Shiprocket shipment",
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 9. WEBHOOK VERIFICATION & STATUS SYNCHRONIZATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Validates the incoming Shiprocket webhook authentication token.
 */
export function verifyShiprocketWebhook(
  headers: Headers,
  searchParams?: URLSearchParams
): boolean {
  if (!SHIPROCKET_WEBHOOK_TOKEN) {
    // If no webhook token is configured, allow in development mode with a warning
    if (process.env.NODE_ENV !== "production") {
      return true;
    }
    return false;
  }

  const headerKey =
    headers.get("x-api-key") ||
    headers.get("x-webhook-token") ||
    headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  const paramKey = searchParams?.get("token") || searchParams?.get("key");

  return headerKey === SHIPROCKET_WEBHOOK_TOKEN || paramKey === SHIPROCKET_WEBHOOK_TOKEN;
}

/**
 * Maps Shiprocket tracking / webhook status code or status string to IntriHub fulfillmentStatus.
 */
export function mapShiprocketStatusToFulfillment(
  statusCodeOrName: number | string
): string | null {
  const code = Number(statusCodeOrName);
  const name = String(statusCodeOrName).toUpperCase().trim();

  // Status mapping based on official Shiprocket status IDs
  if (code === 7 || name === "DELIVERED") {
    return "delivered";
  }
  if (code === 17 || name === "OUT FOR DELIVERY") {
    return "out_for_delivery";
  }
  if (code === 18 || code === 19 || code === 42 || name === "IN TRANSIT" || name === "SHIPPED") {
    return "dispatched";
  }
  if (code === 6 || name === "PICKED UP" || name === "PICKUP DONE") {
    return "picked_up";
  }
  if (
    code === 2 ||
    code === 3 ||
    code === 4 ||
    code === 5 ||
    code === 20 ||
    code === 43 ||
    name === "AWB ASSIGNED" ||
    name === "LABEL GENERATED" ||
    name === "PICKUP SCHEDULED"
  ) {
    return "ready_for_pickup";
  }
  if (code === 8 || name === "CANCELED" || name === "CANCELLED") {
    return "cancelled";
  }
  if (code === 9 || code === 10 || code === 14 || code === 15 || name.includes("RTO")) {
    return "returned";
  }

  return null;
}
