import { NextRequest, NextResponse } from "next/server";
import { checkShiprocketServiceability } from "@/lib/delivery/shiprocket";

/**
 * Live Shipping Rate & Courier Serviceability API
 *
 * GET /api/shipping/calculate?pickup=560001&delivery=110001&weight=2.5&cod=1
 * POST /api/shipping/calculate
 * Body: { pickupPincode, deliveryPincode, weightKg, cod, declaredValue, lengthCm, breadthCm, heightCm }
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const pickupPincode = searchParams.get("pickup") || "560001";
    const deliveryPincode = searchParams.get("delivery") || "";
    const weightKg = parseFloat(searchParams.get("weight") || "1.0");
    const cod = searchParams.get("cod") === "1" || searchParams.get("cod") === "true";
    const declaredValue = searchParams.has("value")
      ? parseFloat(searchParams.get("value")!)
      : undefined;

    if (!deliveryPincode || deliveryPincode.replace(/\D/g, "").length !== 6) {
      return NextResponse.json(
        { success: false, error: "A valid 6-digit delivery pincode is required." },
        { status: 400 }
      );
    }

    const result = await checkShiprocketServiceability({
      pickupPincode,
      deliveryPincode,
      weightKg,
      cod,
      declaredValue,
    });

    return NextResponse.json({
      success: result.serviceable,
      ...result,
    });
  } catch (error: any) {
    console.error("[Shipping Calculate GET Error]:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      pickupPincode = "560001",
      deliveryPincode,
      weightKg = 1.0,
      cod = false,
      declaredValue,
      lengthCm,
      breadthCm,
      heightCm,
    } = body;

    if (!deliveryPincode || String(deliveryPincode).replace(/\D/g, "").length !== 6) {
      return NextResponse.json(
        { success: false, error: "A valid 6-digit delivery pincode is required." },
        { status: 400 }
      );
    }

    const result = await checkShiprocketServiceability({
      pickupPincode: String(pickupPincode),
      deliveryPincode: String(deliveryPincode),
      weightKg: Number(weightKg),
      cod: Boolean(cod),
      declaredValue: declaredValue ? Number(declaredValue) : undefined,
      lengthCm: lengthCm ? Number(lengthCm) : undefined,
      breadthCm: breadthCm ? Number(breadthCm) : undefined,
      heightCm: heightCm ? Number(heightCm) : undefined,
    });

    return NextResponse.json({
      success: result.serviceable,
      ...result,
    });
  } catch (error: any) {
    console.error("[Shipping Calculate POST Error]:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
