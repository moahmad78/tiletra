import { NextRequest } from "next/server";
import { getAuthenticatedMobileUser, mobileApiResponse, handleMobileCorsOptions } from "@/lib/mobile-auth";
import { sendExpoPushNotification } from "@/lib/push-notifications";
import { prisma } from "@/lib/prisma";

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
    const { token, title, message, screen = "/(admin)/orders", id } = body;

    const tokenSet = new Set<string>();

    if (token && typeof token === "string" && (token.startsWith("ExponentPushToken[") || token.startsWith("ExpoPushToken["))) {
      tokenSet.add(token.trim());
      // Also register this token in background for future alerts
      try {
        const { registerPushToken } = await import("@/lib/push-notifications");
        await registerPushToken({
          userId: user.id,
          role: user.role,
          token: token.trim(),
          platform: "android",
        });
      } catch (regErr) {
        console.warn("[Push Test] Auto-register token error:", regErr);
      }
    }

    // 1. Check direct user.pushToken
    if (user.pushToken && (user.pushToken.startsWith("ExponentPushToken[") || user.pushToken.startsWith("ExpoPushToken["))) {
      tokenSet.add(user.pushToken.trim());
    }

    // 2. Check DeviceToken table
    try {
      const deviceTokens = await prisma.deviceToken.findMany({
        where: { userId: user.id },
        select: { token: true },
      });
      deviceTokens.forEach((dt) => {
        if (dt.token && (dt.token.startsWith("ExponentPushToken[") || dt.token.startsWith("ExpoPushToken["))) {
          tokenSet.add(dt.token.trim());
        }
      });
    } catch (e) {}

    // 3. Check MobilePushToken table
    try {
      const mobileTokens = await (prisma as any).mobilePushToken.findMany({
        where: { userId: user.id },
        select: { token: true },
      });
      mobileTokens.forEach((mt: any) => {
        if (mt.token && (mt.token.startsWith("ExponentPushToken[") || mt.token.startsWith("ExpoPushToken["))) {
          tokenSet.add(mt.token.trim());
        }
      });
    } catch (e) {}

    // 4. Fallback check in Setting table
    try {
      const key = `push_tokens_${user.id}`;
      const setting = await prisma.setting.findUnique({ where: { key } });
      if (setting && setting.value) {
        const parsed: { token: string }[] = JSON.parse(setting.value);
        parsed.forEach((t) => {
          if (t.token && (t.token.startsWith("ExponentPushToken[") || t.token.startsWith("ExpoPushToken["))) {
            tokenSet.add(t.token.trim());
          }
        });
      }
    } catch (e) {}

    const targetTokens = Array.from(tokenSet);

    if (targetTokens.length === 0) {
      return mobileApiResponse(
        {
          success: false,
          error: "Is device ka push notification token server par registered nahi mila. Kripya app me notification permissions grant karein.",
        },
        400
      );
    }

    const res = await sendExpoPushNotification({
      to: targetTokens,
      title: title || (user.role === "admin" ? "🛡️ Super Admin Alert" : "📦 New Order Received!"),
      body: message || (user.role === "admin"
        ? "New vendor application submitted for verification. Tap to inspect."
        : "Order #84920 for Vitrified Glazed Tiles has been received. Tap to dispatch."),
      data: {
        screen,
        id,
      },
      priority: "high",
    });

    return mobileApiResponse({
      success: res.success,
      message: res.success
        ? "Push notification dispatched! Lock your screen or close app to see it appear."
        : res.error,
      ticket: res.ticket,
    });
  } catch (error: any) {
    console.error("[Push Test Route Error]", error);
    return mobileApiResponse(
      { success: false, error: error?.message || "Failed to dispatch push notification" },
      500
    );
  }
}
