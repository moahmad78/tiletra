import { prisma } from "@/lib/prisma";

export interface PushNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, any>;
  sound?: "default" | null;
  badge?: number;
  channelId?: string;
}

/**
 * Sends push notification to an Expo Push Token or array of tokens via Expo's HTTP API.
 */
export async function sendExpoPushNotification(
  tokens: string | string[],
  payload: PushNotificationPayload
): Promise<{ success: boolean; results?: any; error?: string }> {
  try {
    const rawTokens = Array.isArray(tokens) ? tokens : [tokens];
    const validTokens = rawTokens.filter(
      (t) => typeof t === "string" && (t.startsWith("ExponentPushToken[") || t.startsWith("ExpoPushToken["))
    );

    if (validTokens.length === 0) {
      return { success: false, error: "No valid Expo push tokens provided" };
    }

    const messages = validTokens.map((to) => ({
      to,
      sound: payload.sound || "default",
      title: payload.title,
      body: payload.body,
      data: payload.data || {},
      badge: payload.badge,
      channelId: payload.channelId || "orders",
      priority: "high",
    }));

    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(messages),
    });

    const data = await response.json();
    return { success: response.ok, results: data };
  } catch (err: any) {
    console.error("sendExpoPushNotification error:", err);
    return { success: false, error: err.message || "Failed to dispatch push notification" };
  }
}

/**
 * Sends a push notification to all active devices registered by a specific user.
 * Wrapped safely so it never throws or blocks caller execution.
 */
export async function sendPushToUser(
  userId: string,
  payload: PushNotificationPayload
): Promise<void> {
  try {
    if (!userId) return;

    const pushTokens = await (prisma as any).mobilePushToken.findMany({
      where: { userId },
      select: { token: true },
    });

    if (!pushTokens || pushTokens.length === 0) return;

    const tokens = pushTokens.map((t: any) => t.token);
    await sendExpoPushNotification(tokens, payload);
  } catch (err) {
    // Non-blocking warning
    console.warn(`[Push Notification] Failed to send push to user ${userId}:`, err);
  }
}
