import { NextRequest, NextResponse } from "next/server";
import { saveAddress, deleteAddress, setDefaultAddress } from "@/lib/actions/addresses";
import { getAuthenticatedUser } from "@/lib/auth-helpers";
import { handleMobileCorsOptions } from "@/lib/mobile-auth";

export async function OPTIONS() {
  return handleMobileCorsOptions();
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await req.json();
    const { userId: bodyUserId, action, ...updates } = body;

    const effectiveUserId = user.role === "admin" && bodyUserId ? bodyUserId : user.id;

    if (action === "set_default") {
      const defResult = await setDefaultAddress(effectiveUserId, id);
      return NextResponse.json(defResult);
    }

    const result = await saveAddress(effectiveUserId, { ...updates, id });
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, address: result.address });
  } catch (error: any) {
    console.error("PATCH /api/addresses/[id] error:", error);
    return NextResponse.json({ success: false, error: error?.message || "Failed to update address" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const queryUserId = searchParams.get("userId");

    const effectiveUserId = user.role === "admin" && queryUserId ? queryUserId : user.id;

    const result = await deleteAddress(effectiveUserId, id);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("DELETE /api/addresses/[id] error:", error);
    return NextResponse.json({ success: false, error: error?.message || "Failed to delete address" }, { status: 500 });
  }
}
