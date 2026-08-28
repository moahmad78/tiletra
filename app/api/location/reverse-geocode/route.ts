import { NextRequest, NextResponse } from "next/server";
import { LocationService } from "@/lib/location/location-service";

export async function POST(req: NextRequest) {
  let body: any = {};
  try {
    body = await req.json();
    const { latitude, longitude, accuracy, source } = body;

    if (latitude === undefined || longitude === undefined) {
      return NextResponse.json(
        { success: false, error: "Latitude and Longitude are required" },
        { status: 400 }
      );
    }

    const lat = Number(latitude);
    const lng = Number(longitude);

    if (isNaN(lat) || isNaN(lng)) {
      return NextResponse.json(
        { success: false, error: "Invalid coordinates provided" },
        { status: 400 }
      );
    }

    const address = await LocationService.reverseGeocode(
      lat,
      lng,
      accuracy ? Number(accuracy) : undefined,
      source || "MAP_PIN"
    );

    return NextResponse.json({ success: true, address });
  } catch (error: any) {
    console.error("Reverse Geocode API error:", error);
    // Never fail hard - return coordinate fallback
    const lat = Number(body?.latitude) || 12.9716;
    const lng = Number(body?.longitude) || 77.5946;
    return NextResponse.json({
      success: true,
      address: {
        formattedAddress: `Coordinates: (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
        street: "Selected Location",
        area: "Map Pin",
        city: "Bangalore",
        state: "Karnataka",
        country: "India",
        postalCode: "560001",
        latitude: lat,
        longitude: lng,
        accuracy: body?.accuracy ? Number(body.accuracy) : undefined,
        source: body?.source || "MAP_PIN",
      },
    });
  }
}
