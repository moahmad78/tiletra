import { prisma as rawPrisma } from "@/lib/prisma";
import { sendExpoPushNotification } from "@/lib/push-notifications";

const prisma = rawPrisma as any;

export type NotificationType =
  | "cart_reminder"
  | "offer_campaign"
  | "price_drop"
  | "back_in_stock"
  | "direct_support"
  | "order_update";

export type PlatformTarget = "all" | "android" | "ios";

export interface SendNotificationOptions {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  imageUrl?: string | null;
  target?: string; // deep link target: "cart", "item:ID", "category:ID", "offers", "order:ID"
  data?: Record<string, any>;
  cartVersion?: number;
  step?: number;
  campaignId?: string;
  platformFilter?: PlatformTarget;
  sentByAdminId?: string;
  ignoreQuietHours?: boolean;
  ignoreFrequencyCap?: boolean;
}

export interface SendNotificationResult {
  success: boolean;
  status: "sent" | "skipped" | "failed";
  skipReason?: string;
  logId?: string;
  tokensCount?: number;
  error?: string;
}

/**
 * Calculates if current time is within quiet hours in Asia/Kolkata timezone.
 */
export function isKolkataQuietHours(
  startStr: string = "21:00",
  endStr: string = "08:00",
  now: Date = new Date()
): boolean {
  try {
    const kolkataFormatter = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Kolkata",
      hour: "numeric",
      minute: "numeric",
      hour12: false,
    });
    const parts = kolkataFormatter.formatToParts(now);
    const hourPart = parts.find((p) => p.type === "hour");
    const minutePart = parts.find((p) => p.type === "minute");
    const currentMinutes =
      parseInt(hourPart?.value || "0", 10) * 60 + parseInt(minutePart?.value || "0", 10);

    const [startH, startM] = startStr.split(":").map(Number);
    const [endH, endM] = endStr.split(":").map(Number);
    const startMinutes = (startH || 0) * 60 + (startM || 0);
    const endMinutes = (endH || 0) * 60 + (endM || 0);

    if (startMinutes > endMinutes) {
      // Overnight window e.g. 21:00 to 08:00
      return currentMinutes >= startMinutes || currentMinutes < endMinutes;
    } else {
      return currentMinutes >= startMinutes && currentMinutes < endMinutes;
    }
  } catch (err) {
    console.error("[QuietHoursCheck Error]", err);
    return false;
  }
}

/**
 * Returns UTC Date corresponding to midnight (00:00:00) today in Asia/Kolkata.
 */
export function getKolkataStartOfDay(date: Date = new Date()): Date {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const kolkataDateStr = formatter.format(date);
  return new Date(`${kolkataDateStr}T00:00:00+05:30`);
}

/**
 * Primary notification gateway. Every push notification must pass through this function.
 * Enforces R-1 through R-16: preferences, quiet hours, frequency cap, recent app activity,
 * cart version idempotency, admin pause switches, and per-device logging.
 */
export async function sendNotification(
  options: SendNotificationOptions
): Promise<SendNotificationResult> {
  const {
    userId,
    type,
    title,
    body,
    imageUrl,
    target = "offers",
    data = {},
    cartVersion,
    step,
    campaignId,
    platformFilter = "all",
    sentByAdminId,
    ignoreQuietHours = false,
    ignoreFrequencyCap = false,
  } = options;

  if (!userId) {
    return { success: false, status: "failed", error: "userId is required" };
  }

  // 1. Fetch StoreSettings & Global Pause Switches (R-16)
  let settings: any = null;
  try {
    settings = await prisma.storeSettings.findFirst();
  } catch (err) {
    console.warn("[sendNotification] Failed to read store settings, fallback to defaults:", err);
  }

  const offersPaused = Boolean(settings?.offersPaused);
  const cartRemindersPaused = Boolean(settings?.cartRemindersPaused);
  const maxPushPerDay = settings?.maxPushPerDay ?? 2;
  const quietHoursStart = settings?.quietHoursStart || "21:00";
  const quietHoursEnd = settings?.quietHoursEnd || "08:00";

  // Check R-16: Admin Pause Switches
  if (type === "cart_reminder" && cartRemindersPaused) {
    const log = await logSkip(userId, type, "paused", campaignId, cartVersion, sentByAdminId);
    return { success: true, status: "skipped", skipReason: "paused", logId: log?.id };
  }

  if (
    (type === "offer_campaign" || type === "price_drop" || type === "back_in_stock") &&
    offersPaused
  ) {
    const log = await logSkip(userId, type, "paused", campaignId, cartVersion, sentByAdminId);
    return { success: true, status: "skipped", skipReason: "paused", logId: log?.id };
  }

  // 2. Fetch User Notification Preferences (R-1)
  let pref: any = null;
  try {
    pref = await prisma.notificationPreference.findUnique({
      where: { userId },
    });
  } catch {}

  const isOffersType =
    type === "offer_campaign" || type === "price_drop" || type === "back_in_stock";
  const isCartType = type === "cart_reminder";

  if (isOffersType && pref && pref.offersEnabled === false) {
    const log = await logSkip(
      userId,
      type,
      "preferences_disabled",
      campaignId,
      cartVersion,
      sentByAdminId
    );
    return {
      success: true,
      status: "skipped",
      skipReason: "preferences_disabled",
      logId: log?.id,
    };
  }

  if (isCartType && pref && pref.cartRemindersEnabled === false) {
    const log = await logSkip(
      userId,
      type,
      "preferences_disabled",
      campaignId,
      cartVersion,
      sentByAdminId
    );
    return {
      success: true,
      status: "skipped",
      skipReason: "preferences_disabled",
      logId: log?.id,
    };
  }

  // 3. Check R-4: Quiet Hours (Asia/Kolkata 21:00 to 08:00)
  // Exception: Order updates or manual support message to one user (R-14)
  const isSupportOrOrder = type === "order_update" || type === "direct_support";
  if (!isSupportOrOrder && !ignoreQuietHours) {
    if (isKolkataQuietHours(quietHoursStart, quietHoursEnd)) {
      const log = await logSkip(userId, type, "quiet_hours", campaignId, cartVersion, sentByAdminId);
      return { success: true, status: "skipped", skipReason: "quiet_hours", logId: log?.id };
    }
  }

  // 4. Check R-3: Daily Frequency Cap (Offers + Reminders together)
  if (!isSupportOrOrder && !ignoreFrequencyCap) {
    try {
      const startOfDay = getKolkataStartOfDay();
      const sentCount = await prisma.notificationLog.count({
        where: {
          userId,
          status: { in: ["sent", "delivered", "opened"] },
          type: { notIn: ["order_update", "direct_support"] },
          createdAt: { gte: startOfDay },
        },
      });

      if (sentCount >= maxPushPerDay) {
        const log = await logSkip(
          userId,
          type,
          "daily_cap_reached",
          campaignId,
          cartVersion,
          sentByAdminId
        );
        return {
          success: true,
          status: "skipped",
          skipReason: "daily_cap_reached",
          logId: log?.id,
        };
      }
    } catch (err) {
      console.warn("[sendNotification] Frequency cap check error:", err);
    }
  }

  // 5. Check R-8: Idempotency (same user never gets same type for same cart version twice)
  if (isCartType && cartVersion !== undefined) {
    try {
      const existingSent = await prisma.notificationLog.findFirst({
        where: {
          userId,
          type: "cart_reminder",
          cartVersion,
          status: { in: ["sent", "delivered", "opened"] },
          ...(step !== undefined ? { skipReason: `step_${step}` } : {}),
        },
      });

      if (existingSent) {
        const log = await logSkip(userId, type, "already_sent", campaignId, cartVersion, sentByAdminId);
        return {
          success: true,
          status: "skipped",
          skipReason: "already_sent",
          logId: log?.id,
        };
      }
    } catch (err) {
      console.warn("[sendNotification] Idempotency check error:", err);
    }
  }

  // 6. Fetch Device Tokens (Android & iPhone) (R-2, R-12)
  const tokenWhere: any = { userId };
  if (platformFilter && platformFilter !== "all") {
    tokenWhere.platform = platformFilter;
  }

  const deviceTokens = await prisma.deviceToken.findMany({
    where: tokenWhere,
  });

  if (!deviceTokens || deviceTokens.length === 0) {
    const log = await logSkip(userId, type, "no_tokens", campaignId, cartVersion, sentByAdminId);
    return { success: true, status: "skipped", skipReason: "no_tokens", logId: log?.id };
  }

  // 7. Check R-7: User opened app in the last 30 minutes (postpone cart reminder)
  if (isCartType) {
    const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000);
    const hasRecentActivity = deviceTokens.some(
      (dt: any) => dt.lastSeenAt && new Date(dt.lastSeenAt) > thirtyMinsAgo
    );

    if (hasRecentActivity) {
      const log = await logSkip(
        userId,
        type,
        "user_recently_active",
        campaignId,
        cartVersion,
        sentByAdminId
      );
      return {
        success: true,
        status: "skipped",
        skipReason: "user_recently_active",
        logId: log?.id,
      };
    }
  }

  // 8. Create NotificationLog entry before dispatch
  let createdLog: any = null;
  const primaryPlatform = deviceTokens[0]?.platform || "android";
  try {
    createdLog = await prisma.notificationLog.create({
      data: {
        userId,
        type,
        campaignId: campaignId || null,
        cartVersion: cartVersion || null,
        platform: deviceTokens.length > 1 ? "multiple" : primaryPlatform,
        status: "sent",
        skipReason: step !== undefined ? `step_${step}` : null,
        sentByAdminId: sentByAdminId || null,
      },
    });
  } catch (err) {
    console.warn("[sendNotification] Failed to create NotificationLog:", err);
  }

  const logId = createdLog?.id || `log_${Date.now()}`;

  // 9. Dispatch to Expo Push API in batches
  const tokensList = deviceTokens.map((t: any) => t.token);
  let channelId = "offers_default";
  if (type === "cart_reminder") channelId = "reminders_default";
  if (type === "order_update" || type === "direct_support") channelId = "orders_high_importance";

  const payloadData = {
    ...data,
    type,
    target,
    logId,
    campaignId,
    imageUrl: imageUrl || undefined,
  };

  const expoResult = await sendExpoPushNotification({
    to: tokensList,
    title,
    body,
    sound: "default",
    channelId,
    data: payloadData,
  });

  // 10. Check ticket errors for R-9: DeviceNotRegistered
  if (expoResult?.ticket?.data) {
    const ticketData = Array.isArray(expoResult.ticket.data)
      ? expoResult.ticket.data
      : [expoResult.ticket.data];

    for (let i = 0; i < ticketData.length; i++) {
      const item = ticketData[i];
      if (item?.status === "error" && item?.details?.error === "DeviceNotRegistered") {
        const deadToken = tokensList[i];
        if (deadToken) {
          try {
            await prisma.deviceToken.deleteMany({ where: { token: deadToken } });
            console.log(`[sendNotification] Cleaned up unregistered token: ${deadToken.slice(0, 20)}...`);
          } catch {}
        }
      }
    }
  }

  return {
    success: expoResult.success,
    status: expoResult.success ? "sent" : "failed",
    logId,
    tokensCount: tokensList.length,
    error: expoResult.error,
  };
}

/**
 * Helper to record a skipped notification attempt in NotificationLog (R-11).
 */
async function logSkip(
  userId: string,
  type: string,
  skipReason: string,
  campaignId?: string,
  cartVersion?: number,
  sentByAdminId?: string
) {
  try {
    return await prisma.notificationLog.create({
      data: {
        userId,
        type,
        campaignId: campaignId || null,
        cartVersion: cartVersion || null,
        status: "skipped",
        skipReason,
        sentByAdminId: sentByAdminId || null,
      },
    });
  } catch (err) {
    console.warn("[logSkip] Failed to record skipped notification:", err);
    return null;
  }
}
