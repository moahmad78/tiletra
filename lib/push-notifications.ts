import { prisma } from "@/lib/prisma";

export interface ExpoPushPayload {
  to: string | string[];
  title: string;
  body: string;
  data?: Record<string, any>;
  sound?: "default" | "order_alert" | string | null;
  priority?: "default" | "normal" | "high";
  badge?: number;
  channelId?: string;
}

/**
 * Sends a push notification payload directly to Expo's Push API endpoint.
 * Works even when the app is backgrounded or completely closed.
 */
export async function sendExpoPushNotification(payload: ExpoPushPayload): Promise<{
  success: boolean;
  ticket?: any;
  error?: string;
}> {
  try {
    const pushTokens = Array.isArray(payload.to) ? payload.to : [payload.to];
    const validTokens = pushTokens.filter(
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
      priority: payload.priority || "high",
      channelId: payload.channelId || "orders_high_importance",
    }));

    const res = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-Encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(messages),
      signal: AbortSignal.timeout(6000),
    });

    const data = await res.json();
    return { success: res.ok, ticket: data };
  } catch (error: any) {
    console.error("[Expo Push Notification Error]", error);
    return { success: false, error: error?.message || "Failed to send push notification" };
  }
}

/**
 * Registers an Expo push token against a user ID and role in PostgreSQL DeviceToken table.
 */
export async function registerPushToken(params: {
  userId: string;
  role?: string;
  token: string;
  platform?: string;
  appVersion?: string;
}) {
  try {
    const { userId, role = "customer", token, platform = "android", appVersion } = params;
    if (!token || (!token.startsWith("ExponentPushToken[") && !token.startsWith("ExpoPushToken["))) {
      return { success: false, error: "Invalid Expo push token" };
    }

    // Upsert into dedicated DeviceToken table
    const deviceToken = await prisma.deviceToken.upsert({
      where: { token },
      update: {
        userId,
        role,
        platform,
        appVersion: appVersion || null,
        lastSeenAt: new Date(),
      },
      create: {
        userId,
        role,
        platform,
        token,
        appVersion: appVersion || null,
        lastSeenAt: new Date(),
      },
    });

    return { success: true, deviceToken };
  } catch (error: any) {
    console.error("[Register Push Token Error]", error);
    return { success: false, error: error?.message };
  }
}

/**
 * Dispatches a push notification to all Super Admin devices using DeviceToken table.
 */
export async function notifyAdminPush(params: {
  title: string;
  body: string;
  data?: Record<string, any>;
}) {
  try {
    const records = await prisma.deviceToken.findMany({
      where: { role: { in: ["admin", "superadmin", "cpo"] } },
      select: { token: true },
    });

    const tokens = records.map((r) => r.token);
    if (tokens.length > 0) {
      await sendExpoPushNotification({
        to: tokens,
        title: params.title,
        body: params.body,
        data: params.data,
      });
    }
  } catch (e) {
    console.error("notifyAdminPush error:", e);
  }
}

/**
 * Dispatches a push notification to a specific Vendor's registered devices using DeviceToken table.
 */
export async function notifyVendorPush(params: {
  vendorId?: string;
  userId?: string;
  title: string;
  body: string;
  data?: Record<string, any>;
}) {
  try {
    let targetUserId = params.userId;

    if (!targetUserId && params.vendorId) {
      const vendor = await prisma.vendor.findUnique({
        where: { id: params.vendorId },
        select: { ownerId: true },
      });
      targetUserId = vendor?.ownerId || undefined;
    }

    if (!targetUserId) return;

    const records = await prisma.deviceToken.findMany({
      where: { userId: targetUserId },
      select: { token: true },
    });

    const tokens = records.map((r) => r.token);
    if (tokens.length > 0) {
      await sendExpoPushNotification({
        to: tokens,
        title: params.title,
        body: params.body,
        data: params.data,
      });
    }
  } catch (e) {
    console.error("notifyVendorPush error:", e);
  }
}

/**
 * Dispatches a push notification to a specific customer / user ID using DeviceToken table.
 */
export async function sendPushToUser(
  userId: string,
  payload: {
    title: string;
    body: string;
    data?: Record<string, any>;
  }
) {
  try {
    if (!userId) return;

    const records = await prisma.deviceToken.findMany({
      where: { userId },
      select: { token: true },
    });

    const tokens = records.map((r) => r.token);
    if (tokens.length > 0) {
      await sendExpoPushNotification({
        to: tokens,
        title: payload.title,
        body: payload.body,
        data: payload.data,
      });
    }
  } catch (e) {
    console.error("sendPushToUser error:", e);
  }
}
