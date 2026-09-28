import { NextRequest, NextResponse } from "next/server";
import { reverseGeocode } from "@/lib/maps";
import { handleMobileCorsOptions } from "@/lib/mobile-auth";

export async function OPTIONS() {
  return handleMobileCorsOptions();
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const latStr = searchParams.get("lat");
    const lngStr = searchParams.get("lng");

    if (!latStr || !lngStr) {
      return NextResponse.json(
        { success: false, error: "Latitude and longitude query parameters are required" },
        { status: 400 }
      );
    }

    const lat = parseFloat(latStr);
    const lng = parseFloat(lngStr);

    if (isNaN(lat) || isNaN(lng)) {
      return NextResponse.json(
        { success: false, error: "Invalid latitude or longitude numbers" },
        { status: 400 }
      );
    }

    const geocoded = await reverseGeocode(lat, lng);

    if (!geocoded) {
      return NextResponse.json(
        { success: false, error: "Failed to reverse geocode location" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      address: geocoded,
    });
  } catch (error: any) {
    console.error("GET /api/geo/reverse-geocode error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
