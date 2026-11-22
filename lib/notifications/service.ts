import { prisma as rawPrisma } from "@/lib/prisma";
import {
  NotificationCatalogType,
  getNotificationMeta,
} from "./catalog";
import { isKolkataQuietHours, getKolkataStartOfDay } from "@/lib/notification-service";
import * as crypto from "crypto";

const prisma = rawPrisma as any;

export interface NotifyParams {
  type: NotificationCatalogType;
  userId?: string;
  vendorId?: string;
  role?: "customer" | "vendor" | "admin" | "all";
  title?: string;
  body?: string;
  data?: Record<string, any>;
  deepLink?: string;
  imageUrl?: string | null;
  ttlSeconds?: number;
  ignoreQuietHours?: boolean;
  ignoreFrequencyCap?: boolean;
  sentByAdminId?: string;
  dedupeKey?: string;
}

export interface NotifyResult {
  success: boolean;
  status: "sent" | "skipped" | "failed" | "no_tokens";
  skipReason?: string;
  logId?: string;
  tokensCount: number;
  ticket?: any;
  error?: string;
}

// Queue for asynchronous Expo receipt checks
interface PendingReceiptItem {
  ticketId: string;
  tokenSuffix: string;
  userId?: string;
  logId?: string;
  enqueuedAt: number;
}
const pendingReceiptsQueue: PendingReceiptItem[] = [];
const MAX_RECEIPTS = 500;

export async function processExpoReceipts(): Promise<void> {
  if (pendingReceiptsQueue.length === 0) return;

  const now = Date.now();
  const ready = pendingReceiptsQueue.filter((item) => now - item.enqueuedAt >= 10000);
  if (ready.length === 0) return;

  const batch = ready.slice(0, 100);
  const ticketIds = batch.map((b) => b.ticketId);

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

    if (!res.ok) return;

    const json = await res.json();
    const receipts = json.data || {};

    for (const item of batch) {
      const receipt = receipts[item.ticketId];
      if (!receipt) continue;

      if (receipt.status === "error") {
        const errType = receipt.details?.error || receipt.message || "UnknownError";
        console.warn(`[Expo Receipt Error] ticket=${item.ticketId} error=${errType}`);

        if (item.logId) {
          await prisma.notificationLog.update({
            where: { id: item.logId },
            data: { status: "failed", receiptStatus: errType, error: receipt.message },
          }).catch(() => {});
        }

        if (errType === "DeviceNotRegistered") {
          // Deactivate or delete dead token
          await prisma.deviceToken.updateMany({
            where: { token: { endsWith: item.tokenSuffix } },
            data: { isActive: false },
          }).catch(() => {});
        }
      } else if (receipt.status === "ok" && item.logId) {
        await prisma.notificationLog.update({
          where: { id: item.logId },
          data: { status: "delivered", receiptStatus: "ok" },
        }).catch(() => {});
      }
    }
  } catch (err) {
    console.warn("[processExpoReceipts] Check warning:", err);
  }
}

/**
 * Central Notification Service Dispatcher
 * The single, unified entry point for all notifications across IntriHub.
 */
export async function notify(params: NotifyParams): Promise<NotifyResult> {
  const meta = getNotificationMeta(params.type);
  const data = params.data || {};
  let targetUserId = params.userId;

  // 1. If vendorId is supplied, resolve owner user ID
  if (!targetUserId && params.vendorId) {
    try {
      const vendor = await prisma.vendor.findUnique({
        where: { id: params.vendorId },
        select: { ownerId: true },
      });
      targetUserId = vendor?.ownerId || undefined;
    } catch (e) {
      console.warn("[notify] Failed to resolve vendor ownerId:", e);
    }
  }

  const title = params.title || meta.defaultTitle;
  const body = params.body || (data.orderId ? `Update on Order #${data.orderId}` : "You have a new update.");
  const deepLink = params.deepLink || meta.defaultDeepLink(data);
  const ttl = params.ttlSeconds ?? meta.ttlSeconds;
  const expiresAt = new Date(Date.now() + ttl * 1000).toISOString();
  const notificationId = params.dedupeKey || `notif_${crypto.randomUUID()}`;

  // 2. Preference & Quiet Hours Check (Orders always bypass; promos strictly checked)
  if (targetUserId && meta.category === "promo") {
    // A. User Preferences
    try {
      const pref = await prisma.notificationPreference.findUnique({
        where: { userId: targetUserId },
      });
      if (pref && (!pref.promotional || !pref.offersEnabled)) {
        return logSkip(targetUserId, params.type, "preferences_disabled");
      }
    } catch {}

    // B. Quiet Hours (21:00 - 08:00 Asia/Kolkata)
    if (!params.ignoreQuietHours && isKolkataQuietHours("21:00", "08:00")) {
      return logSkip(targetUserId, params.type, "quiet_hours");
    }

    // C. Daily Frequency Cap (Max 2 promo pushes per day)
    if (!params.ignoreFrequencyCap) {
      try {
        const startOfDay = getKolkataStartOfDay();
        const promoCount = await prisma.notificationLog.count({
          where: {
            userId: targetUserId,
            status: { in: ["sent", "delivered"] },
            createdAt: { gte: startOfDay },
          },
        });
        if (promoCount >= 2) {
          return logSkip(targetUserId, params.type, "daily_cap_reached");
        }
      } catch {}
    }
  }

  // 3. Collect active device tokens
  let tokens: string[] = [];
  if (targetUserId) {
    try {
      const records = await prisma.deviceToken.findMany({
        where: {
          userId: targetUserId,
          isActive: true,
          platform: { in: ["android", "ios"] },
        },
        select: { token: true, appType: true },
      });

      // Filter by appropriate appType if known
      tokens = records
        .filter((r: any) => {
          if (meta.role === "vendor") return r.appType === "business" || !r.appType;
          if (meta.role === "customer") return r.appType === "user" || !r.appType;
          return true;
        })
        .map((r: any) => r.token);

      // Fallback check User.pushToken if deviceTokens is empty
      if (tokens.length === 0) {
        const u = await prisma.user.findUnique({
          where: { id: targetUserId },
          select: { pushToken: true },
        });
        if (u?.pushToken) tokens.push(u.pushToken);
      }
    } catch (e) {
      console.warn("[notify] Error fetching tokens:", e);
    }
  }

  const validTokens = Array.from(new Set(tokens)).filter(
    (t) => typeof t === "string" && (t.startsWith("ExponentPushToken[") || t.startsWith("ExpoPushToken["))
  );

  if (validTokens.length === 0) {
    return { success: false, status: "no_tokens", tokensCount: 0, error: "No active push tokens found" };
  }

  // 4. Create NotificationLog entry
  let logRecord: any = null;
  if (targetUserId) {
    try {
      logRecord = await prisma.notificationLog.create({
        data: {
          id: notificationId,
          userId: targetUserId,
          recipient: validTokens[0],
          type: params.type,
          platform: validTokens.length > 1 ? "multiple" : "android",
          status: "sent",
          payload: {
            title,
            body,
            channelId: meta.channelId,
            sound: meta.sound,
            priority: meta.priority,
            ttl,
            deepLink,
            data,
          },
          sentByAdminId: params.sentByAdminId || null,
        },
      });
    } catch (err) {
      console.warn("[notify] NotificationLog create error:", err);
    }
  }

  // 5. Construct standardized PRD v1 payload
  const standardPayload = {
    type: params.type,
    notificationId,
    orderId: data.orderId || data.id,
    deepLink,
    expiresAt,
    v: 1,
    ...data,
  };

  const messages = validTokens.map((to) => ({
    to,
    title,
    body,
    sound: meta.sound || "default",
    priority: meta.priority || "high",
    channelId: meta.channelId || "default_v1",
    ttl,
    data: standardPayload,
    ...(params.imageUrl ? { image: params.imageUrl, mutableContent: true } : {}),
  }));

  // 6. Dispatch to Expo Push API in batches of 100
  try {
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
      signal: AbortSignal.timeout(8000),
    });

    const responseData = await res.json().catch(() => ({}));

    // Process tickets and enqueue for receipt verification
    if (responseData && responseData.data) {
      const tickets = Array.isArray(responseData.data) ? responseData.data : [responseData.data];

      for (let i = 0; i < tickets.length; i++) {
        const ticket = tickets[i];
        const targetToken = validTokens[i] || "";
        const tokenSuffix = targetToken.slice(-6);

        if (ticket.status === "ok" && ticket.id) {
          if (pendingReceiptsQueue.length < MAX_RECEIPTS) {
            pendingReceiptsQueue.push({
              ticketId: ticket.id,
              tokenSuffix,
              userId: targetUserId,
              logId: logRecord?.id,
              enqueuedAt: Date.now(),
            });
          }
        } else if (ticket.status === "error") {
          const errCode = ticket.details?.error || "UNKNOWN";
          console.warn(`[notify] Ticket error for ...${tokenSuffix}: ${ticket.message} (${errCode})`);
          if (errCode === "DeviceNotRegistered" && targetToken) {
            await prisma.deviceToken.updateMany({
              where: { token: targetToken },
              data: { isActive: false },
            }).catch(() => {});
          }
        }
      }
    }

    // Lazy process receipts
    processExpoReceipts().catch(() => {});

    return {
      success: res.ok,
      status: res.ok ? "sent" : "failed",
      logId: logRecord?.id,
      tokensCount: validTokens.length,
      ticket: responseData,
    };
  } catch (err: any) {
    console.error("[notify] Expo dispatch error:", err);
    if (logRecord?.id) {
      await prisma.notificationLog.update({
        where: { id: logRecord.id },
        data: { status: "failed", error: err?.message },
      }).catch(() => {});
    }
    return {
      success: false,
      status: "failed",
      tokensCount: validTokens.length,
      error: err?.message || "Failed to dispatch push notification",
    };
  }
}

async function logSkip(
  userId: string,
  type: string,
  skipReason: string
): Promise<NotifyResult> {
  let created: any = null;
  try {
    created = await prisma.notificationLog.create({
      data: {
        userId,
        type,
        status: "skipped",
        skipReason,
      },
    });
  } catch {}
  return {
    success: true,
    status: "skipped",
    skipReason,
    logId: created?.id,
    tokensCount: 0,
  };
}
