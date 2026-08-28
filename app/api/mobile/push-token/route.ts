import { NextRequest } from "next/server";
import { getAuthenticatedMobileUser, mobileApiResponse, handleMobileCorsOptions } from "@/lib/mobile-auth";
import { registerPushToken } from "@/lib/push-notifications";

export async function OPTIONS() {
  return handleMobileCorsOptions();
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedMobileUser(req);
    if (!user) {
      return mobileApiResponse({ success: false, error: "Unauthorized" }, 401);
    }

    const body = await req.json().catch(() => ({}));
    const { token, platform = "android" } = body;

    if (!token) {
      return mobileApiResponse({ success: false, error: "Push token is required" }, 400);
    }

    const res = await registerPushToken({
      userId: user.id,
      role: user.role,
      token: String(token).trim(),
      platform,
    });

    if (!res.success) {
      return mobileApiResponse({ success: false, error: res.error }, 400);
    }

    return mobileApiResponse({
      success: true,
      message: "Device push token registered successfully for background notifications!",
    });
  } catch (error: any) {
    console.error("[Push Token Route Error]", error);
    return mobileApiResponse(
      { success: false, error: error?.message || "Failed to register push token" },
      500
    );
  }
}
