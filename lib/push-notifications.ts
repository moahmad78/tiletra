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
  image?: string | null;
  mutableContent?: boolean;
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
      ...(payload.image ? { image: payload.image } : {}),
      ...(payload.mutableContent !== undefined
        ? { mutableContent: payload.mutableContent }
        : payload.image
        ? { mutableContent: true }
        : {}),
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
 * Registers an Expo push token against a user ID and role in PostgreSQL DeviceToken, MobilePushToken, and User tables.
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

    // 1. Save directly into User table
    try {
      await (prisma as any).user.update({
        where: { id: userId },
        data: { pushToken: token },
      });
    } catch (userErr) {
      console.warn("[Register Push Token] Could not update User.pushToken directly:", userErr);
    }

    // 2. Upsert into MobilePushToken table
    try {
      await (prisma as any).mobilePushToken.upsert({
        where: { token },
        update: { userId, platform, updatedAt: new Date() },
        create: { userId, token, platform },
      });
    } catch (mobileErr) {
      console.warn("[Register Push Token] MobilePushToken upsert warning:", mobileErr);
    }

    // 3. Upsert into dedicated DeviceToken table
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
 * Dispatches a push notification to a specific Vendor's registered devices.
 * Supports loud ringing chime for manual approval and quick success chime for auto-accepted orders.
 */
export async function notifyVendorPush(params: {
  vendorId?: string;
  userId?: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  isNewOrder?: boolean;
  orderId?: string;
  totalAmount?: number;
  customerArea?: string;
  isAutoAccepted?: boolean;
  requiresManualApproval?: boolean;
}) {
  try {
    let targetUserId = params.userId;
    let targetVendorId = params.vendorId;

    if (!targetUserId && targetVendorId) {
      const vendor = await prisma.vendor.findUnique({
        where: { id: targetVendorId },
        select: { ownerId: true },
      });
      targetUserId = vendor?.ownerId || undefined;
    } else if (targetUserId && !targetVendorId) {
      const vendor = await prisma.vendor.findFirst({
        where: { ownerId: targetUserId },
        select: { id: true },
      });
      targetVendorId = vendor?.id || undefined;
    }

    if (!targetUserId) return;

    // 1. If it's a new order alert, dispatch VoIP push for iOS CallKit
    if ((params.isNewOrder || params.requiresManualApproval) && targetVendorId) {
      try {
        const { sendVoipPushToVendor } = await import("@/lib/voip-push-service");
        await sendVoipPushToVendor({
          vendorId: targetVendorId,
          orderId: params.orderId || params.data?.orderId || "new_order",
          splitId: params.data?.splitId,
          totalAmount: params.totalAmount || params.data?.amount || 0,
          customerArea: params.customerArea || params.data?.customerArea || "Customer Area",
        });
      } catch (voipErr) {
        console.error("[notifyVendorPush] VoIP dispatch error:", voipErr);
      }
    }

    // 2. Fetch all registered tokens for vendor
    const [deviceTokens, mobilePushTokens, userRecord] = await Promise.all([
      prisma.deviceToken.findMany({
        where: { userId: targetUserId, platform: { not: "ios_voip" } },
        select: { token: true },
      }),
      (prisma as any).mobilePushToken.findMany({
        where: { userId: targetUserId },
        select: { token: true },
      }),
      (prisma as any).user.findUnique({
        where: { id: targetUserId },
        select: { pushToken: true },
      }),
    ]);

    const rawTokens: string[] = [
      ...(userRecord?.pushToken ? [userRecord.pushToken] : []),
      ...deviceTokens.map((r: { token: string }) => r.token),
      ...mobilePushTokens.map((r: { token: string }) => r.token),
    ];

    const tokens = Array.from(new Set(rawTokens)).filter(
      (t) => typeof t === "string" && (t.startsWith("ExponentPushToken[") || t.startsWith("ExpoPushToken["))
    );

    if (tokens.length > 0) {
      // Determine audio channel and sound behavior
      let channelId = "orders_default";
      let sound = "default";

      if (params.requiresManualApproval) {
        channelId = "orders_high_importance";
        sound = "order_alert"; // Loud alarm chime
      } else if (params.isAutoAccepted) {
        channelId = "orders_high_importance";
        sound = "default"; // Quick success chime
      } else if (params.isNewOrder) {
        channelId = "orders_high_importance";
        sound = "order_alert";
      }

      await sendExpoPushNotification({
        to: tokens,
        title: params.title,
        body: params.body,
        sound,
        priority: "high",
        channelId,
        data: {
          ...params.data,
          isNewOrder: params.isNewOrder,
          orderId: params.orderId || params.data?.orderId,
          isAutoAccepted: params.isAutoAccepted,
          requiresManualApproval: params.requiresManualApproval,
        },
      });
    }
  } catch (e) {
    console.error("notifyVendorPush error:", e);
  }
}

/**
 * Dispatches a push notification to a specific customer / user ID using User, DeviceToken, and MobilePushToken tables.
 */
export async function sendPushToUser(
  userId: string,
  payload: {
    title: string;
    body: string;
    data?: Record<string, any>;
    sound?: string;
    channelId?: string;
  }
) {
  try {
    if (!userId) return;

    const [deviceTokens, mobilePushTokens, userRecord] = await Promise.all([
      prisma.deviceToken.findMany({
        where: { userId },
        select: { token: true },
      }),
      (prisma as any).mobilePushToken.findMany({
        where: { userId },
        select: { token: true },
      }),
      (prisma as any).user.findUnique({
        where: { id: userId },
        select: { pushToken: true },
      }),
    ]);

    const rawTokens: string[] = [
      ...(userRecord?.pushToken ? [userRecord.pushToken] : []),
      ...deviceTokens.map((r: { token: string }) => r.token),
      ...mobilePushTokens.map((r: { token: string }) => r.token),
    ];

    const tokens = Array.from(new Set(rawTokens)).filter(
      (t) => typeof t === "string" && (t.startsWith("ExponentPushToken[") || t.startsWith("ExpoPushToken["))
    );

    if (tokens.length > 0) {
      await sendExpoPushNotification({
        to: tokens,
        title: payload.title,
        body: payload.body,
        data: payload.data,
        sound: payload.sound || "default",
        channelId: payload.channelId || "orders_high_importance",
        priority: "high",
      });
    }
  } catch (e) {
    console.error("sendPushToUser error:", e);
  }
}

/**
 * Flipkart/Zomato style Real-Time Status Push Notifications dispatched to Customer:
 * 1. "Order Auto-Confirmed"
 * 2. "Order Packed"
 * 3. "Out for Delivery"
 * 4. "Delivered"
 */
export async function sendCustomerOrderStatusPush(
  userId: string | null | undefined,
  orderId: string,
  status: "CONFIRMED" | "PACKED" | "DISPATCHED" | "DELIVERED",
  extra?: {
    total?: number;
    courierName?: string;
    trackingNumber?: string;
    itemsCount?: number;
  }
) {
  if (!userId) return;

  const totalFormatted = extra?.total ? ` (₹${extra.total.toLocaleString("en-IN")})` : "";
  let title = "";
  let body = "";

  switch (status) {
    case "CONFIRMED":
      title = "Order Auto-Confirmed ⚡";
      body = `Order #${orderId}${totalFormatted} has been automatically confirmed and sent to fulfillment!`;
      break;

    case "PACKED":
      title = "Order Packed 📦";
      body = `Your order #${orderId} is packed and ready for courier pickup!`;
      break;

    case "DISPATCHED":
      title = "Out for Delivery 🚚";
      const courierInfo = extra?.courierName ? ` via ${extra.courierName}` : "";
      const trackingInfo = extra?.trackingNumber ? ` (LR: ${extra.trackingNumber})` : "";
      body = `Order #${orderId} is on the way to your delivery address${courierInfo}${trackingInfo}.`;
      break;

    case "DELIVERED":
      title = "Order Delivered 🎉";
      body = `Order #${orderId} has been successfully delivered. Thank you for choosing IntriHub!`;
      break;
  }

  await sendPushToUser(userId, {
    title,
    body,
    sound: "default",
    channelId: "orders_high_importance",
    data: {
      orderId,
      status,
      type: "order_status_update",
    },
  });
}
