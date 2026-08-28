import { NextRequest, NextResponse } from "next/server";
import { LocationService } from "@/lib/location/location-service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { origin, destination, profile } = body;

    if (!origin || !destination || origin.latitude === undefined || destination.latitude === undefined) {
      return NextResponse.json(
        { success: false, error: "Origin and Destination coordinates are required" },
        { status: 400 }
      );
    }

    const route = await LocationService.calculateRoute(origin, destination, profile || "driving");

    return NextResponse.json({ success: true, route });
  } catch (error: any) {
    console.error("Routing API error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to calculate route" },
      { status: 500 }
    );
  }
}
