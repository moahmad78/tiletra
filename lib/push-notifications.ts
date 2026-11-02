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
  userId?: string;
}

// Queue for asynchronous Expo receipt checks
interface PendingReceipt {
  ticketId: string;
  tokenSuffix: string;
  userId?: string;
  enqueuedAt: number;
}
const pendingReceiptsQueue: PendingReceipt[] = [];
const MAX_RECEIPTS_QUEUE = 500;

/**
 * Checks pending Expo push receipts for delivery failures, invalid credentials,
 * or unregistered devices.
 */
export async function checkPendingExpoReceipts(): Promise<void> {
  if (pendingReceiptsQueue.length === 0) return;

  const now = Date.now();
  // Check receipts that are at least 10 seconds old
  const readyToCheck = pendingReceiptsQueue.filter((item) => now - item.enqueuedAt >= 10000);
  if (readyToCheck.length === 0) return;

  // Process in batches of up to 100
  const batch = readyToCheck.slice(0, 100);
  const ticketIds = batch.map((b) => b.ticketId);

  // Remove batch from queue
  ticketIds.forEach((id) => {
    const idx = pendingReceiptsQueue.findIndex((item) => item.ticketId === id);
    if (idx !== -1) pendingReceiptsQueue.splice(idx, 1);
  });

  try {
    const headers: Record<string, string> = {
      Accept: "application/json",
      "Content-Type": "application/json",
    };
    if (process.env.EXPO_ACCESS_TOKEN) {
      headers["Authorization"] = `Bearer ${process.env.EXPO_ACCESS_TOKEN}`;
    }

    const res = await fetch("https://exp.host/--/api/v2/push/getReceipts", {
      method: "POST",
      headers,
      body: JSON.stringify({ ids: ticketIds }),
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      console.warn("[Expo Push Receipts] Failed to fetch receipts status:", res.status);
      return;
    }

    const json = await res.json();
    const receipts = json.data || {};

    for (const item of batch) {
      const receipt = receipts[item.ticketId];
      if (!receipt) continue;

      if (receipt.status === "error") {
        const errType = receipt.details?.error || receipt.message || "UnknownReceiptError";
        console.error(
          `[Expo Push Receipt Error] ticketId=${item.ticketId} userId=${item.userId || "unknown"} token=...${item.tokenSuffix} error=${errType} message=${receipt.message}`
        );

        if (errType === "InvalidCredentials") {
          console.error(
            "🚨 [Expo Push FATAL] InvalidCredentials: Check FCM V1 Service Account key in expo.dev dashboard!"
          );
        } else if (errType === "MismatchSenderId") {
          console.error(
            "🚨 [Expo Push FATAL] MismatchSenderId: Project FCM credentials do not match google-services.json!"
          );
        } else if (errType === "DeviceNotRegistered") {
          console.warn(`[Expo Push] DeviceNotRegistered for token ending in ...${item.tokenSuffix}. Cleaning up.`);
        }
      } else if (receipt.status === "ok") {
        console.log(`[Expo Push Receipt OK] ticketId=${item.ticketId} token=...${item.tokenSuffix}`);
      }
    }
  } catch (receiptErr) {
    console.warn("[Expo Push Receipts Check Error]", receiptErr);
  }
}

/**
 * Sends a push notification payload directly to Expo's Push API endpoint.
 * Works across foreground, background, locked and killed app states.
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

    // Standardized payload format for every push
    const messages = validTokens.map((to) => ({
      to,
      title: payload.title,
      body: payload.body,
      sound: payload.sound || "default",
      priority: payload.priority || "high",
      channelId: payload.channelId || "orders_high_importance",
      data: {
        ...(payload.data || {}),
        type: payload.data?.type || "GENERAL",
        orderId: payload.data?.orderId,
      },
      ...(payload.image ? { image: payload.image } : {}),
      ...(payload.mutableContent !== undefined
        ? { mutableContent: payload.mutableContent }
        : payload.image
        ? { mutableContent: true }
        : {}),
    }));

    const headers: Record<string, string> = {
      Accept: "application/json",
      "Accept-Encoding": "gzip, deflate",
      "Content-Type": "application/json",
    };

    if (process.env.EXPO_ACCESS_TOKEN) {
      headers["Authorization"] = `Bearer ${process.env.EXPO_ACCESS_TOKEN}`;
    }

    const res = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers,
      body: JSON.stringify(messages),
      signal: AbortSignal.timeout(7000),
    });

    const responseData = await res.json().catch(() => ({}));

    // Process tickets and handle error details
    if (responseData && responseData.data) {
      const tickets = Array.isArray(responseData.data) ? responseData.data : [responseData.data];

      for (let i = 0; i < tickets.length; i++) {
        const ticket = tickets[i];
        const targetToken = validTokens[i] || "";
        const tokenSuffix = targetToken.slice(-6);

        if (ticket.status === "ok") {
          if (ticket.id && pendingReceiptsQueue.length < MAX_RECEIPTS_QUEUE) {
            pendingReceiptsQueue.push({
              ticketId: ticket.id,
              tokenSuffix,
              userId: payload.userId,
              enqueuedAt: Date.now(),
            });
          }
        } else if (ticket.status === "error") {
          const errorCode = ticket.details?.error || "UNKNOWN_ERROR";
          console.error(
            `[Expo Push Error] userId=${payload.userId || "unknown"} token=...${tokenSuffix} message=${ticket.message} details.error=${errorCode}`
          );

          // Clean up unregistered device tokens immediately
          if (errorCode === "DeviceNotRegistered" && targetToken) {
            try {
              await deleteDeadPushToken(targetToken);
              console.log(`[Expo Push] Deleted unregistered token ending in ...${tokenSuffix}`);
            } catch (delErr) {
              console.warn("[Expo Push] Failed to delete dead token:", delErr);
            }
          }
        }
      }
    }

    // Lazy check previous receipts
    checkPendingExpoReceipts().catch(() => {});

    return { success: res.ok, ticket: responseData };
  } catch (error: any) {
    console.error("[Expo Push Notification Error]", error);
    return { success: false, error: error?.message || "Failed to send push notification" };
  }
}

/**
 * Removes a dead / unregistered push token from all database tables.
 */
async function deleteDeadPushToken(token: string): Promise<void> {
  await Promise.allSettled([
    prisma.deviceToken.deleteMany({ where: { token } }),
    (prisma as any).mobilePushToken.deleteMany({ where: { token } }),
    (prisma as any).user.updateMany({
      where: { pushToken: token },
      data: { pushToken: null },
    }),
  ]);
}

/**
 * Registers an Expo push token against a verified user ID and role in PostgreSQL.
 * Upserts DeviceToken and MobilePushToken, and sets User.pushToken.
 */
export async function registerPushToken(params: {
  userId: string;
  role?: string;
  token: string;
  platform?: string;
  appVersion?: string;
  deviceId?: string;
}) {
  try {
    const { userId, role = "customer", token, platform = "android", appVersion, deviceId } = params;
    if (!userId) {
      return { success: false, error: "User ID is required" };
    }

    const cleanToken = String(token || "").trim();
    if (!cleanToken || (!cleanToken.startsWith("ExponentPushToken[") && !cleanToken.startsWith("ExpoPushToken["))) {
      return { success: false, error: "Invalid Expo push token format" };
    }

    // 1. Save directly into User table
    try {
      await (prisma as any).user.update({
        where: { id: userId },
        data: { pushToken: cleanToken },
      });
    } catch (userErr) {
      console.warn("[Register Push Token] Could not update User.pushToken directly:", userErr);
    }

    // 2. Upsert into MobilePushToken table
    try {
      await (prisma as any).mobilePushToken.upsert({
        where: { token: cleanToken },
        update: { userId, platform, deviceId: deviceId || undefined, updatedAt: new Date() },
        create: { userId, token: cleanToken, platform, deviceId: deviceId || undefined },
      });
    } catch (mobileErr) {
      console.warn("[Register Push Token] MobilePushToken upsert warning:", mobileErr);
    }

    // 3. Upsert into dedicated DeviceToken table
    const deviceToken = await prisma.deviceToken.upsert({
      where: { token: cleanToken },
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
        token: cleanToken,
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
 * Unregisters a push token on user logout.
 */
export async function unregisterPushToken(params: { userId: string; token: string }) {
  try {
    const { userId, token } = params;
    const cleanToken = String(token || "").trim();
    if (!cleanToken) return { success: true };

    await Promise.allSettled([
      prisma.deviceToken.deleteMany({
        where: { userId, token: cleanToken },
      }),
      (prisma as any).mobilePushToken.deleteMany({
        where: { userId, token: cleanToken },
      }),
      (prisma as any).user.updateMany({
        where: { id: userId, pushToken: cleanToken },
        data: { pushToken: null },
      }),
    ]);

    return { success: true };
  } catch (error: any) {
    console.warn("[Unregister Push Token Error]", error);
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
      select: { token: true, userId: true },
    });

    const tokens = records.map((r) => r.token);
    if (tokens.length > 0) {
      await sendExpoPushNotification({
        to: tokens,
        title: params.title,
        body: params.body,
        sound: "default",
        priority: "high",
        channelId: "orders_high_importance",
        data: {
          ...params.data,
          type: params.data?.type || "ADMIN_ALERT",
        },
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
      const sound = "default";
      const channelId = "orders_high_importance";

      await sendExpoPushNotification({
        to: tokens,
        userId: targetUserId,
        title: params.title,
        body: params.body,
        sound,
        priority: "high",
        channelId,
        data: {
          ...params.data,
          type: params.isAutoAccepted
            ? "ORDER_AUTO_ACCEPTED"
            : params.requiresManualApproval
            ? "PENDING_VENDOR_APPROVAL"
            : params.data?.type || "NEW_ORDER",
          orderId: params.orderId || params.data?.orderId,
          isNewOrder: params.isNewOrder ?? true,
          isAutoAccepted: params.isAutoAccepted,
          requiresManualApproval: params.requiresManualApproval,
          screen: "/(vendor)/orders",
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
    priority?: "default" | "normal" | "high";
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
        userId,
        title: payload.title,
        body: payload.body,
        data: {
          ...payload.data,
          type: payload.data?.type || "CUSTOMER_ALERT",
          orderId: payload.data?.orderId,
        },
        sound: payload.sound || "default",
        channelId: payload.channelId || "orders_high_importance",
        priority: payload.priority || "high",
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
    priority: "high",
    data: {
      orderId,
      status,
      type: "order_status_update",
      screen: `/order/${orderId}`,
    },
  });
}
