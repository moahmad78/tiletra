import { NextRequest, NextResponse } from "next/server";
import { reverseGeocode } from "@/lib/maps";
import { handleMobileCorsOptions } from "@/lib/mobile-auth";

export async function OPTIONS() {
  return handleMobileCorsOptions();
}

// High-speed in-memory cache for reverse geocoding (~11m grid resolution)
const reverseGeoCache = new Map<string, { address: any; timestamp: number }>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

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

    // Check fast cache (rounded to 4 decimal places ≈ 11m precision)
    const cacheKey = `${lat.toFixed(4)},${lng.toFixed(4)}`;
    const cached = reverseGeoCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return NextResponse.json(
        {
          success: true,
          address: cached.address,
          cached: true,
        },
        {
          headers: {
            "Cache-Control": "public, max-age=86400, s-maxage=86400, stale-while-revalidate=43200",
          },
        }
      );
    }

    const geocoded = await reverseGeocode(lat, lng);

    if (!geocoded) {
      return NextResponse.json(
        { success: false, error: "Failed to reverse geocode location" },
        { status: 404 }
      );
    }

    // Store in cache (limit cache size to 5000 entries)
    if (reverseGeoCache.size > 5000) {
      const firstKey = reverseGeoCache.keys().next().value;
      if (firstKey) reverseGeoCache.delete(firstKey);
    }
    reverseGeoCache.set(cacheKey, { address: geocoded, timestamp: Date.now() });

    return NextResponse.json(
      {
        success: true,
        address: geocoded,
      },
      {
        headers: {
          "Cache-Control": "public, max-age=86400, s-maxage=86400, stale-while-revalidate=43200",
        },
      }
    );
  } catch (error: any) {
    console.error("GET /api/geo/reverse-geocode error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
