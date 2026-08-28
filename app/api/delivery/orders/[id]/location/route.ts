import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { LocationService } from "@/lib/location/location-service";

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

    const googleMapsUrl = LocationService.getGoogleMapsNavUrl(lat, lng, order.deliveryLandmark || order.deliveryAddress || "Customer Delivery");
    const appleMapsUrl = LocationService.getAppleMapsNavUrl(lat, lng, order.deliveryLandmark || order.deliveryAddress || "Customer Delivery");

    return NextResponse.json({
      success: true,
      order: {
        ...order,
        latitude: lat,
        longitude: lng,
        googleMapsNavUrl: googleMapsUrl,
        appleMapsNavUrl: appleMapsUrl,
      },
    });
  } catch (error: any) {
    console.error("Delivery order location GET error:", error);
    return NextResponse.json({ success: false, error: error?.message || "Failed to fetch delivery location" }, { status: 500 });
  }
}
