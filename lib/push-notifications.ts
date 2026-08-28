import { prisma } from "@/lib/prisma";

export interface ExpoPushPayload {
  to: string | string[];
  title: string;
  body: string;
  data?: Record<string, any>;
  sound?: "default" | null;
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
      channelId: "default",
    }));

    const res = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-Encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(messages),
    });

    const data = await res.json();
    return { success: res.ok, ticket: data };
  } catch (error: any) {
    console.error("[Expo Push Notification Error]", error);
    return { success: false, error: error?.message || "Failed to send push notification" };
  }
}

/**
 * Registers an Expo push token against a user ID and role in PostgreSQL.
 */
export async function registerPushToken(params: {
  userId: string;
  role: string;
  token: string;
  platform?: string;
}) {
  try {
    const { userId, role, token, platform = "android" } = params;
    if (!token || (!token.startsWith("ExponentPushToken[") && !token.startsWith("ExpoPushToken["))) {
      return { success: false, error: "Invalid Expo push token" };
    }

    const key = `push_tokens_${userId}`;
    const existing = await prisma.setting.findUnique({ where: { key } });

    let tokens: { token: string; platform: string; updatedAt: string }[] = [];
    if (existing && existing.value) {
      try {
        tokens = JSON.parse(existing.value);
      } catch {}
    }

    // Keep unique tokens
    tokens = tokens.filter((t) => t.token !== token);
    tokens.push({ token, platform, updatedAt: new Date().toISOString() });

    await prisma.setting.upsert({
      where: { key },
      update: { value: JSON.stringify(tokens) },
      create: { key, value: JSON.stringify(tokens) },
    });

    // Also register in role groups (admin vs vendor)
    if (role === "admin") {
      const adminKey = "push_tokens_admin_group";
      const adminExisting = await prisma.setting.findUnique({ where: { key: adminKey } });
      let adminTokens: string[] = [];
      if (adminExisting && adminExisting.value) {
        try { adminTokens = JSON.parse(adminExisting.value); } catch {}
      }
      if (!adminTokens.includes(token)) {
        adminTokens.push(token);
        await prisma.setting.upsert({
          where: { key: adminKey },
          update: { value: JSON.stringify(adminTokens) },
          create: { key: adminKey, value: JSON.stringify(adminTokens) },
        });
      }
    }

    return { success: true };
  } catch (error: any) {
    console.error("[Register Push Token Error]", error);
    return { success: false, error: error?.message };
  }
}

/**
 * Dispatches a push notification to all Super Admin devices.
 */
export async function notifyAdminPush(params: {
  title: string;
  body: string;
  data?: Record<string, any>;
}) {
  try {
    const adminKey = "push_tokens_admin_group";
    const setting = await prisma.setting.findUnique({ where: { key: adminKey } });
    if (!setting || !setting.value) return;

    const tokens: string[] = JSON.parse(setting.value);
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
 * Dispatches a push notification to a specific Vendor's registered devices.
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

    const key = `push_tokens_${targetUserId}`;
    const setting = await prisma.setting.findUnique({ where: { key } });
    if (!setting || !setting.value) return;

    const tokensObj: { token: string }[] = JSON.parse(setting.value);
    const tokens = tokensObj.map((t) => t.token);

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
 * Dispatches a push notification to a specific customer / user ID.
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
    const key = `push_tokens_${userId}`;
    const setting = await prisma.setting.findUnique({ where: { key } });
    if (!setting || !setting.value) return;

    const tokensObj: { token: string }[] = JSON.parse(setting.value);
    const tokens = tokensObj.map((t) => t.token);

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
