import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function getGoogleMapsNavUrl(lat: number, lng: number, label?: string): string {
  const query = label ? encodeURIComponent(label) : `${lat},${lng}`;
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=${query}`;
}

function getAppleMapsNavUrl(lat: number, lng: number, label?: string): string {
  const query = label ? encodeURIComponent(label) : `${lat},${lng}`;
  return `https://maps.apple.com/?daddr=${lat},${lng}&q=${query}`;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const order = await prisma.order.findUnique({
      where: { id },
      select: {
        id: true,
        customerName: true,
        customerPhone: true,
        orderStatus: true,
        estimatedDelivery: true,
        deliveryName: true,
        deliveryPhone: true,
        deliveryAddress: true,
        deliveryHouseNumber: true,
        deliveryBuildingName: true,
        deliveryFloor: true,
        deliveryStreet: true,
        deliveryArea: true,
        deliveryLandmark: true,
        deliveryCity: true,
        deliveryDistrict: true,
        deliveryState: true,
        deliveryCountry: true,
        deliveryPostalCode: true,
        deliveryLatitude: true,
        deliveryLongitude: true,
        deliveryAccuracy: true,
        deliveryLocationSource: true,
        deliveryInstructions: true,
        deliveryPartnerId: true,
        deliveryAssignedAt: true,
        deliveryArrivedAt: true,
        deliveredAt: true,
        shippingAddress: true,
      },
    });

    if (!order) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    }

    // Fallback coordinates from shippingAddress Json if legacy order
    const lat = order.deliveryLatitude ?? (order.shippingAddress as any)?.latitude ?? 12.9716;
    const lng = order.deliveryLongitude ?? (order.shippingAddress as any)?.longitude ?? 77.5946;

    const googleMapsUrl = getGoogleMapsNavUrl(lat, lng, order.deliveryLandmark || order.deliveryAddress || "Customer Delivery");
    const appleMapsUrl = getAppleMapsNavUrl(lat, lng, order.deliveryLandmark || order.deliveryAddress || "Customer Delivery");

    // F7: Load assigned vendor's GPS coordinates as pickup point
    // Lookup VendorOrderSplit → Vendor for this order
    let pickupPoint: {
      lat: number | null;
      lng: number | null;
      name: string | null;
      address: string | null;
      phone: string | null;
      thirdPartyProvider: string | null;
    } | null = null;

    try {
      const split = await prisma.vendorOrderSplit.findFirst({
        where: {
          orderId: id,
          fulfillmentStatus: { notIn: ["cancelled", "returned"] },
        },
        orderBy: { createdAt: "desc" },
        select: {
          thirdPartyProvider: true,
          vendor: {
            select: {
              businessName: true,
              businessAddress: true,
              contactPhone: true,
              latitude: true,
              longitude: true,
            },
          },
        },
      });

      if (split?.vendor) {
        pickupPoint = {
          lat: split.vendor.latitude,
          lng: split.vendor.longitude,
          name: split.vendor.businessName,
          address: split.vendor.businessAddress,
          phone: split.vendor.contactPhone,
          thirdPartyProvider: split.thirdPartyProvider,
        };
      }
    } catch (pickupErr) {
      console.warn("[OrderLocation] Could not load vendor pickup point:", pickupErr);
    }

    return NextResponse.json({
      success: true,
      order: {
        ...order,
        latitude: lat,
        longitude: lng,
        googleMapsNavUrl: googleMapsUrl,
        appleMapsNavUrl: appleMapsUrl,
      },
      // F7: Pickup and drop for two-stage tracking (vendor → customer)
      pickupPoint,
      dropPoint: {
        lat,
        lng,
        name: order.deliveryName || order.customerName,
        address: order.deliveryAddress,
        phone: order.deliveryPhone || order.customerPhone,
      },
    });
  } catch (error: any) {
    console.error("Delivery order location GET error:", error);
    return NextResponse.json({ success: false, error: error?.message || "Failed to fetch delivery location" }, { status: 500 });
  }
}

