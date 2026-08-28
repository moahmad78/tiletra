import { NextRequest, NextResponse } from "next/server";
import { LocationService } from "@/lib/location/location-service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { query, limit, countryCode } = body;

    if (!query || typeof query !== "string" || query.trim().length < 2) {
      return NextResponse.json({ results: [] });
    }

    const results = await LocationService.geocode(query, {
      limit: limit ? Number(limit) : 6,
      countryCode: countryCode || "in",
    });

    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    console.error("Geocode API error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to search location" },
      { status: 500 }
    );
  }
}
