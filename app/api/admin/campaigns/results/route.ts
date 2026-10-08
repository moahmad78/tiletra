import { NextResponse } from "next/server";
import { prisma as rawPrisma } from "@/lib/prisma";

const prisma = rawPrisma as any;

export async function GET() {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // 1. Fetch all notification logs for past 30 days
    const logs = await prisma.notificationLog.findMany({
      where: {
        createdAt: { gte: thirtyDaysAgo },
      },
      select: {
        id: true,
        userId: true,
        type: true,
        platform: true,
        status: true,
        skipReason: true,
        createdAt: true,
        openedAt: true,
        campaignId: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // 2. Aggregate stats by date (YYYY-MM-DD), type, and platform
    const dailyMap: Record<
      string,
      {
        date: string;
        sent: number;
        skipped: number;
        opened: number;
        androidSent: number;
        iosSent: number;
        androidOpened: number;
        iosOpened: number;
        cartRemindersSent: number;
        offersSent: number;
      }
    > = {};

    const platformTotals = {
      android: { sent: 0, opened: 0, skipped: 0 },
      ios: { sent: 0, opened: 0, skipped: 0 },
      all: { sent: 0, opened: 0, skipped: 0 },
    };

    const typeTotals: Record<string, { sent: number; skipped: number; opened: number }> = {
      cart_reminder: { sent: 0, skipped: 0, opened: 0 },
      offer_campaign: { sent: 0, skipped: 0, opened: 0 },
      direct_support: { sent: 0, skipped: 0, opened: 0 },
      price_drop: { sent: 0, skipped: 0, opened: 0 },
      back_in_stock: { sent: 0, skipped: 0, opened: 0 },
    };

    for (const log of logs) {
      const dateStr = new Date(log.createdAt).toISOString().split("T")[0];
      if (!dailyMap[dateStr]) {
        dailyMap[dateStr] = {
          date: dateStr,
          sent: 0,
          skipped: 0,
          opened: 0,
          androidSent: 0,
          iosSent: 0,
          androidOpened: 0,
          iosOpened: 0,
          cartRemindersSent: 0,
          offersSent: 0,
        };
      }

      const day = dailyMap[dateStr];
      const isSent = log.status === "sent" || log.status === "delivered" || log.status === "opened";
      const isOpened = Boolean(log.openedAt) || log.status === "opened";
      const isSkipped = log.status === "skipped";

      const p = (log.platform || "android").toLowerCase();
      const isAndroid = p.includes("android");
      const isIos = p.includes("ios");

      if (isSent) {
        day.sent++;
        platformTotals.all.sent++;
        if (isAndroid) {
          day.androidSent++;
          platformTotals.android.sent++;
        }
        if (isIos) {
          day.iosSent++;
          platformTotals.ios.sent++;
        }

        if (log.type === "cart_reminder") day.cartRemindersSent++;
        if (log.type === "offer_campaign") day.offersSent++;

        if (typeTotals[log.type]) typeTotals[log.type].sent++;
      }

      if (isOpened) {
        day.opened++;
        platformTotals.all.opened++;
        if (isAndroid) {
          day.androidOpened++;
          platformTotals.android.opened++;
        }
        if (isIos) {
          day.iosOpened++;
          platformTotals.ios.opened++;
        }
        if (typeTotals[log.type]) typeTotals[log.type].opened++;
      }

      if (isSkipped) {
        day.skipped++;
        platformTotals.all.skipped++;
        if (isAndroid) platformTotals.android.skipped++;
        if (isIos) platformTotals.ios.skipped++;
        if (typeTotals[log.type]) typeTotals[log.type].skipped++;
      }
    }

    // 3. Cart Reminder 24-hour Order Conversion Attribution
    const cartReminderSentLogs = logs.filter(
      (l: any) => l.type === "cart_reminder" && (l.status === "sent" || l.status === "opened")
    );

    let convertedCartReminders = 0;
    const userCartReminderTimes: Record<string, Date[]> = {};
    for (const log of cartReminderSentLogs) {
      if (!userCartReminderTimes[log.userId]) userCartReminderTimes[log.userId] = [];
      userCartReminderTimes[log.userId].push(new Date(log.createdAt));
    }

    // Check each user who received a reminder to see if an order was placed within 24h
    for (const [userId, sentTimes] of Object.entries(userCartReminderTimes)) {
      for (const sentTime of sentTimes) {
        const next24h = new Date(sentTime.getTime() + 24 * 60 * 60 * 1000);
        const order = await prisma.order.findFirst({
          where: {
            userId,
            createdAt: {
              gte: sentTime,
              lte: next24h,
            },
          },
          select: { id: true },
        });

        if (order) {
          convertedCartReminders++;
          break; // Count user conversion once per window
        }
      }
    }

    // 4. Campaign list with individual stats
    const campaigns = await prisma.campaign.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        title: true,
        target: true,
        platforms: true,
        status: true,
        sentAt: true,
        stats: true,
        createdAt: true,
        _count: {
          select: { logs: true },
        },
      },
    });

    const dailyTrend = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json({
      success: true,
      dailyTrend,
      platformTotals,
      typeTotals,
      cartReminders: {
        totalSent: cartReminderSentLogs.length,
        convertedOrders24h: convertedCartReminders,
        conversionRate:
          cartReminderSentLogs.length > 0
            ? Number(((convertedCartReminders / cartReminderSentLogs.length) * 100).toFixed(1))
            : 0,
      },
      campaigns,
    });
  } catch (error: any) {
    console.error("[Campaign Results View] error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to load campaign results" },
      { status: 500 }
    );
  }
}
