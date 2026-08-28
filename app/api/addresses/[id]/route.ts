import { NextRequest, NextResponse } from "next/server";
import { saveAddress, deleteAddress, setDefaultAddress } from "@/lib/actions/addresses";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { userId, action, ...updates } = body;

    if (!userId) {
      return NextResponse.json({ success: false, error: "userId is required" }, { status: 400 });
    }

    if (action === "set_default") {
      const defResult = await setDefaultAddress(userId, id);
      return NextResponse.json(defResult);
    }

    const result = await saveAddress(userId, { ...updates, id });
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
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ success: false, error: "userId parameter is required" }, { status: 400 });
    }

    const result = await deleteAddress(userId, id);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("DELETE /api/addresses/[id] error:", error);
    return NextResponse.json({ success: false, error: error?.message || "Failed to delete address" }, { status: 500 });
  }
}
