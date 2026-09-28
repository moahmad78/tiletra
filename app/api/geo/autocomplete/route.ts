import { NextRequest, NextResponse } from "next/server";
import { getGoogleMapsApiKey } from "@/lib/maps";
import { handleMobileCorsOptions } from "@/lib/mobile-auth";

export async function OPTIONS() {
  return handleMobileCorsOptions();
}

// In-memory cache for places search autocomplete (~1 hour TTL)
const autocompleteCache = new Map<string, { data: any[]; timestamp: number }>();
const CACHE_TTL_MS = 60 * 60 * 1000;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const input = searchParams.get("input")?.trim();
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");

    if (!input || input.length < 2) {
      return NextResponse.json(
        { success: true, predictions: [] },
        {
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
          },
        }
      );
    }

    const cacheKey = `${input.toLowerCase()}_${lat || ""}_${lng || ""}`;
    const cached = autocompleteCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return NextResponse.json(
        { success: true, predictions: cached.data, cached: true },
        {
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Cache-Control": "public, max-age=3600, s-maxage=3600",
          },
        }
      );
    }

    const apiKey = getGoogleMapsApiKey();
    let predictions: Array<{
      placeId: string;
      description: string;
      mainText: string;
      secondaryText: string;
    }> = [];

    if (apiKey) {
      try {
        let url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
          input
        )}&key=${apiKey}&components=country:in&language=en`;

        if (lat && lng) {
          // Bias results to customer's current city/area (50km radius)
          url += `&location=${lat},${lng}&radius=50000`;
        }

        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          if (data.status === "OK" && Array.isArray(data.predictions)) {
            predictions = data.predictions.map((p: any) => ({
              placeId: p.place_id,
              description: p.description,
              mainText: p.structured_formatting?.main_text || p.description.split(",")[0] || p.description,
              secondaryText: p.structured_formatting?.secondary_text || p.description.split(",").slice(1).join(", ").trim(),
            }));
          }
        }
      } catch (gErr) {
        console.warn("Google Places Autocomplete error:", gErr);
      }
    }

    // Fallback: If Google returns nothing or fails, use OpenStreetMap Nominatim Search
    if (predictions.length === 0) {
      try {
        const osmRes = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
            input
          )}&format=json&countrycodes=in&addressdetails=1&limit=5`,
          {
            headers: {
              "User-Agent": "Intrihub-App/1.0",
            },
          }
        );
        if (osmRes.ok) {
          const osmData = await osmRes.json();
          if (Array.isArray(osmData)) {
            predictions = osmData.map((item: any) => {
              const parts = (item.display_name || "").split(",");
              const main = parts[0]?.trim() || input;
              const secondary = parts.slice(1, 4).join(",").trim();
              return {
                placeId: `osm_${item.place_id || item.osm_id}`,
                description: item.display_name,
                mainText: main,
                secondaryText: secondary,
                latitude: parseFloat(item.lat),
                longitude: parseFloat(item.lon),
              };
            });
          }
        }
      } catch (osmErr) {
        console.warn("OSM fallback search error:", osmErr);
      }
    }

    // Cache results (max 2000 queries)
    if (autocompleteCache.size > 2000) {
      const firstKey = autocompleteCache.keys().next().value;
      if (firstKey) autocompleteCache.delete(firstKey);
    }
    autocompleteCache.set(cacheKey, { data: predictions, timestamp: Date.now() });

    return NextResponse.json(
      { success: true, predictions },
      {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Cache-Control": "public, max-age=1800, s-maxage=1800, stale-while-revalidate=3600",
        },
      }
    );
  } catch (error: any) {
    console.error("GET /api/geo/autocomplete error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to search places" },
      { status: 500 }
    );
  }
}
