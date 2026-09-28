import { NextRequest, NextResponse } from "next/server";
import { getGoogleMapsApiKey } from "@/lib/maps";
import { handleMobileCorsOptions } from "@/lib/mobile-auth";

export async function OPTIONS() {
  return handleMobileCorsOptions();
}

// In-memory cache for place details
const placeDetailsCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const placeId = searchParams.get("placeId")?.trim();

    if (!placeId) {
      return NextResponse.json(
        { success: false, error: "placeId query parameter is required" },
        { status: 400 }
      );
    }

    const cached = placeDetailsCache.get(placeId);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return NextResponse.json(
        { success: true, location: cached.data, cached: true },
        {
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Cache-Control": "public, max-age=86400, s-maxage=86400",
          },
        }
      );
    }

    const apiKey = getGoogleMapsApiKey();
    let location: any = null;

    if (apiKey && !placeId.startsWith("osm_")) {
      try {
        const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(
          placeId
        )}&key=${apiKey}&fields=geometry,formatted_address,address_components,name&region=in`;

        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          if (data.status === "OK" && data.result) {
            const r = data.result;
            const lat = r.geometry?.location?.lat;
            const lng = r.geometry?.location?.lng;

            let houseNumber = "";
            let street = "";
            let area = "";
            let city = "Bengaluru";
            let state = "Karnataka";
            let pincode = "";
            let landmark = "";

            for (const c of r.address_components || []) {
              const types = c.types || [];
              if (types.includes("street_number")) houseNumber = c.long_name;
              if (types.includes("route")) street = c.long_name;
              if (types.includes("sublocality_level_1") || types.includes("neighborhood")) {
                area = c.long_name;
              } else if (types.includes("sublocality_level_2") && !area) {
                area = c.long_name;
              }
              if (types.includes("point_of_interest") || types.includes("establishment")) {
                landmark = c.long_name;
              }
              if (types.includes("postal_code")) pincode = c.long_name;
              if (types.includes("locality")) city = c.long_name;
              else if (!city && (types.includes("administrative_area_level_2") || types.includes("postal_town"))) {
                city = c.long_name;
              }
              if (types.includes("administrative_area_level_1")) state = c.long_name;
            }

            location = {
              latitude: lat,
              longitude: lng,
              street: street || r.name || "",
              area: area || street || "",
              city: city || "Bengaluru",
              state: state || "Karnataka",
              pincode: pincode || "",
              houseNumber: houseNumber || "",
              landmark: landmark || "",
              formattedAddress: r.formatted_address || `${lat}, ${lng}`,
            };
          }
        }
      } catch (gErr) {
        console.warn("Google Place Details fetch error:", gErr);
      }
    }

    if (!location) {
      return NextResponse.json(
        { success: false, error: "Failed to retrieve place details" },
        { status: 404 }
      );
    }

    if (placeDetailsCache.size > 2000) {
      const firstKey = placeDetailsCache.keys().next().value;
      if (firstKey) placeDetailsCache.delete(firstKey);
    }
    placeDetailsCache.set(placeId, { data: location, timestamp: Date.now() });

    return NextResponse.json(
      { success: true, location },
      {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Cache-Control": "public, max-age=86400, s-maxage=86400, stale-while-revalidate=43200",
        },
      }
    );
  } catch (error: any) {
    console.error("GET /api/geo/place-details error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
