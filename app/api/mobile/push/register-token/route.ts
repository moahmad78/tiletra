import { NextRequest } from "next/server";
import { getAuthenticatedMobileUser, mobileApiResponse, handleMobileCorsOptions } from "@/lib/mobile-auth";
import { registerPushToken, unregisterPushToken } from "@/lib/push-notifications";

export async function OPTIONS() {
  return handleMobileCorsOptions();
}

/**
 * Endpoint used by customer app / legacy clients.
 * STRICT: Requires an authenticated user. Ignores unauthenticated body.userId.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedMobileUser(req);
    if (!user) {
      return mobileApiResponse({ success: false, error: "Unauthorized" }, 401);
    }

    const body = await req.json().catch(() => ({}));
    const { token, platform = "android", deviceId, appVersion } = body;

    if (!token || typeof token !== "string") {
      return mobileApiResponse({ success: false, error: "Push token is required" }, 400);
    }

    const res = await registerPushToken({
      userId: user.id,
      role: user.role,
      token: token.trim(),
      platform,
      appVersion,
      deviceId,
    });

    if (!res.success) {
      return mobileApiResponse({ success: false, error: res.error }, 400);
    }

    return mobileApiResponse({
      success: true,
      message: "Push token registered successfully",
      id: res.deviceToken?.id,
    });
  } catch (err: any) {
    console.error("Mobile push register-token error:", err);
    return mobileApiResponse(
      { success: false, error: err.message || "Failed to register push token" },
      500
    );
  }
}

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
  } catch (err: any) {
    return mobileApiResponse({ success: false, error: err.message }, 500);
  }
}
