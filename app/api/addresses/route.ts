import { NextRequest, NextResponse } from "next/server";
import { getUserAddresses, saveAddress } from "@/lib/actions/addresses";
import { getAuthenticatedUser } from "@/lib/auth-helpers";
import { handleMobileCorsOptions } from "@/lib/mobile-auth";

export async function OPTIONS() {
  return handleMobileCorsOptions();
}

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required to view addresses" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const targetUserId = searchParams.get("userId") || user.id;

    // IDOR check: Users can only query their own addresses unless they are super admin
    if (targetUserId !== user.id && user.role !== "admin" && user.role !== "superadmin") {
      return NextResponse.json(
        { success: false, error: "Forbidden: You cannot access addresses of other users" },
        { status: 403 }
      );
    }

    const addresses = await getUserAddresses(targetUserId);
    return NextResponse.json({ success: true, addresses });
  } catch (error: any) {
    console.error("GET /api/addresses error:", error);
    return NextResponse.json({ success: false, error: error?.message || "Failed to fetch addresses" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required to save address" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { userId: bodyUserId, ...addressInput } = body;

    // Strict IDOR enforcement: Always bind address creation to the authenticated user's ID
    const effectiveUserId = user.role === "admin" && bodyUserId ? bodyUserId : user.id;

    const result = await saveAddress(effectiveUserId, addressInput);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, address: result.address });
  } catch (error: any) {
    console.error("POST /api/addresses error:", error);
    return NextResponse.json({ success: false, error: error?.message || "Failed to save address" }, { status: 500 });
  }
}
