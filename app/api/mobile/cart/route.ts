import { NextRequest } from "next/server";
import { getAuthenticatedMobileUser, mobileApiResponse, handleMobileCorsOptions } from "@/lib/mobile-auth";
import { getCartForUser, syncCartToDb } from "@/lib/actions/cart";

export async function OPTIONS() {
  return handleMobileCorsOptions();
}

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedMobileUser(req);
    if (!user) {
      return mobileApiResponse({ success: false, error: "Unauthorized" }, 401);
    }

    const items = await getCartForUser(user.id);
    return mobileApiResponse({
      success: true,
      items,
    });
  } catch (err: any) {
    console.error("Mobile cart GET error:", err);
    return mobileApiResponse(
      { success: false, error: err.message || "Failed to fetch cart" },
      500
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedMobileUser(req);
    if (!user) {
      return mobileApiResponse({ success: false, error: "Unauthorized" }, 401);
    }

    const body = await req.json().catch(() => ({}));
    const { items = [] } = body;

    const result = await syncCartToDb(user.id, items);
    if (!result.success) {
      return mobileApiResponse({ success: false, error: result.error }, 400);
    }

    const updatedItems = await getCartForUser(user.id);
    return mobileApiResponse({
      success: true,
      items: updatedItems,
    });
  } catch (err: any) {
    console.error("Mobile cart POST error:", err);
    return mobileApiResponse(
      { success: false, error: err.message || "Failed to sync cart" },
      500
    );
  }
}
