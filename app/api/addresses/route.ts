import { NextRequest, NextResponse } from "next/server";
import { getUserAddresses, saveAddress } from "@/lib/actions/addresses";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ success: false, error: "userId parameter is required" }, { status: 400 });
    }

    const addresses = await getUserAddresses(userId);
    return NextResponse.json({ success: true, addresses });
  } catch (error: any) {
    console.error("GET /api/addresses error:", error);
    return NextResponse.json({ success: false, error: error?.message || "Failed to fetch addresses" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, ...addressInput } = body;

    if (!userId) {
      return NextResponse.json({ success: false, error: "userId is required" }, { status: 400 });
    }

    const result = await saveAddress(userId, addressInput);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, address: result.address });
  } catch (error: any) {
    console.error("POST /api/addresses error:", error);
    return NextResponse.json({ success: false, error: error?.message || "Failed to save address" }, { status: 500 });
  }
}
