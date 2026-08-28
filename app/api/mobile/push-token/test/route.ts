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

    let targetTokens: string[] = [];

    if (token) {
      targetTokens = [token];
    } else {
      const key = `push_tokens_${user.id}`;
      const setting = await prisma.setting.findUnique({ where: { key } });
      if (setting && setting.value) {
        const parsed: { token: string }[] = JSON.parse(setting.value);
        targetTokens = parsed.map((t) => t.token);
      }
    }

    if (targetTokens.length === 0) {
      return mobileApiResponse(
        { success: false, error: "No registered push token found for this device. Please grant notification permission first." },
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
