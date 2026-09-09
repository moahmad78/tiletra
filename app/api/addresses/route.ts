import { NextRequest, NextResponse } from "next/server";
import { getUserAddresses, saveAddress } from "@/lib/actions/addresses";
import { getAuthenticatedUser } from "@/lib/auth-helpers";
import { handleMobileCorsOptions } from "@/lib/mobile-auth";
import { addressInputSchema } from "@/lib/validations/schemas";
import { sanitizeString } from "@/lib/sanitization";

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
    const rawTargetUserId = searchParams.get("userId");
    const targetUserId = rawTargetUserId ? sanitizeString(rawTargetUserId, 100) : user.id;

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

    const rawBody = await req.json().catch(() => null);
    if (!rawBody || typeof rawBody !== "object") {
      return NextResponse.json(
        { success: false, error: "Invalid JSON request payload" },
        { status: 400 }
      );
    }

    const { userId: bodyUserId, ...addressInput } = rawBody;

    // Strict schema validation and XSS sanitization
    const validationResult = addressInputSchema.safeParse(addressInput);
    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0]?.message || "Invalid address data";
      return NextResponse.json(
        { success: false, error: firstError, details: validationResult.error.issues },
        { status: 400 }
      );
    }

    // Strict IDOR enforcement: Always bind address creation to the authenticated user's ID
    const effectiveUserId = user.role === "admin" && bodyUserId ? sanitizeString(bodyUserId, 100) : user.id;

    const result = await saveAddress(effectiveUserId, validationResult.data as any);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, address: result.address });
  } catch (error: any) {
    console.error("POST /api/addresses error:", error);
    return NextResponse.json({ success: false, error: error?.message || "Failed to save address" }, { status: 500 });
  }
}
