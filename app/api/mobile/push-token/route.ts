import { NextRequest } from "next/server";
import { getAuthenticatedMobileUser, mobileApiResponse, handleMobileCorsOptions } from "@/lib/mobile-auth";
import { registerPushToken, unregisterPushToken } from "@/lib/push-notifications";

export async function OPTIONS() {
  return handleMobileCorsOptions();
}

/**
 * Register mobile device push token.
 * Requires authenticated user.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedMobileUser(req);
    if (!user) {
      return mobileApiResponse({ success: false, error: "Unauthorized" }, 401);
    }

    const body = await req.json().catch(() => ({}));
    const { token, platform = "android", appVersion, deviceId } = body;

    if (!token) {
      return mobileApiResponse({ success: false, error: "Push token is required" }, 400);
    }

    const res = await registerPushToken({
      userId: user.id,
      role: user.role,
      token: String(token).trim(),
      platform,
      appVersion: appVersion ? String(appVersion) : undefined,
      deviceId: deviceId ? String(deviceId) : undefined,
    });

    if (!res.success) {
      return mobileApiResponse({ success: false, error: res.error }, 400);
    }

    return mobileApiResponse({
      success: true,
      message: "Device push token registered successfully for background notifications!",
      deviceToken: res.deviceToken,
    });
  } catch (error: any) {
    console.error("[Push Token Route Error]", error);
    return mobileApiResponse(
      { success: false, error: error?.message || "Failed to register push token" },
      500
    );
  }
}

/**
 * Unregister push token on logout.
 * Requires authenticated user.
 */
export async function DELETE(req: NextRequest) {
  try {
    const user = await getAuthenticatedMobileUser(req);
    if (!user) {
      return mobileApiResponse({ success: false, error: "Unauthorized" }, 401);
    }

    const body = await req.json().catch(() => ({}));
    const token = body?.token;

    if (token) {
      await unregisterPushToken({ userId: user.id, token: String(token).trim() });
    }

    return mobileApiResponse({ success: true, message: "Token unregistered successfully" });
  } catch (error: any) {
    console.error("[Push Token Delete Error]", error);
    return mobileApiResponse(
      { success: false, error: error?.message || "Failed to unregister push token" },
      500
    );
  }
}
