import { NextRequest, NextResponse } from "next/server";
import { prisma as rawPrisma } from "@/lib/prisma";
import { dispatchCampaign } from "@/lib/campaign-runner";
import { isKolkataQuietHours } from "@/lib/notification-service";
import { getNextKolkataActiveTime } from "@/lib/cart-reminder-runner";

const prisma = rawPrisma as any;

export async function GET() {
  try {
    const campaigns = await prisma.campaign.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        _count: {
          select: { logs: true },
        },
      },
    });

    const storeSettings = await prisma.storeSettings.findFirst({
      select: {
        offersPaused: true,
        cartRemindersPaused: true,
        maxPushPerDay: true,
        quietHoursStart: true,
        quietHoursEnd: true,
      },
    });

    // Recent stats summary
    const recentLogs = await prisma.notificationLog.groupBy({
      by: ["type", "status", "platform"],
      _count: { id: true },
      where: {
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
    });

    return NextResponse.json({
      success: true,
      campaigns,
      storeSettings: storeSettings || {
        offersPaused: false,
        cartRemindersPaused: false,
        maxPushPerDay: 2,
        quietHoursStart: "21:00",
        quietHoursEnd: "08:00",
      },
      recentLogs,
    });
  } catch (error: any) {
    console.error("[Admin Campaigns] GET error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to load campaigns" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      title,
      body: messageBody,
      imageUrl,
      target = "offers",
      audience = { type: "all" },
      platforms = "all",
      action = "draft", // "draft" | "schedule" | "send_now"
      scheduledAt,
      adminId,
    } = body;

    if (!title || title.trim().length === 0) {
      return NextResponse.json({ success: false, error: "Title is required" }, { status: 400 });
    }
    if (title.length > 40) {
      return NextResponse.json(
        { success: false, error: "Title cannot exceed 40 characters" },
        { status: 400 }
      );
    }
    if (!messageBody || messageBody.trim().length === 0) {
      return NextResponse.json({ success: false, error: "Message body is required" }, { status: 400 });
    }
    if (messageBody.length > 90) {
      return NextResponse.json(
        { success: false, error: "Message body cannot exceed 90 characters" },
        { status: 400 }
      );
    }

    const settings = await prisma.storeSettings.findFirst({
      select: {
        quietHoursStart: true,
        quietHoursEnd: true,
        offersPaused: true,
      },
    });

    const isQuiet = isKolkataQuietHours(
      settings?.quietHoursStart ?? "21:00",
      settings?.quietHoursEnd ?? "08:00"
    );

    let initialStatus = "draft";
    let effectiveScheduledAt: Date | null = null;

    if (action === "schedule") {
      if (!scheduledAt) {
        return NextResponse.json(
          { success: false, error: "Scheduled time is required" },
          { status: 400 }
        );
      }
      effectiveScheduledAt = new Date(scheduledAt);
      initialStatus = "scheduled";
    } else if (action === "send_now") {
      if (isQuiet) {
        // Rule R-4: Inside quiet hours, the only choice is to schedule for 08:00 IST
        effectiveScheduledAt = getNextKolkataActiveTime(settings?.quietHoursEnd ?? "08:00");
        initialStatus = "scheduled";
      } else {
        initialStatus = "sending";
      }
    }

    const campaign = await prisma.campaign.create({
      data: {
        title: title.trim(),
        body: messageBody.trim(),
        imageUrl: imageUrl || null,
        target,
        audience: audience || { type: "all" },
        platforms,
        sendMode: action === "send_now" ? "manual" : "scheduled",
        scheduledAt: effectiveScheduledAt,
        status: initialStatus,
        createdBy: adminId || "admin",
      },
    });

    if (action === "send_now" && !isQuiet) {
      // Execute dispatch asynchronously or synchronously
      const stats = await dispatchCampaign(campaign.id, { sentByAdminId: adminId });
      return NextResponse.json({
        success: true,
        campaign: { ...campaign, status: "sent", stats },
        sentNow: true,
      });
    }

    return NextResponse.json({
      success: true,
      campaign,
      scheduledForQuietHours: action === "send_now" && isQuiet,
      scheduledAt: effectiveScheduledAt,
    });
  } catch (error: any) {
    console.error("[Admin Campaigns] POST error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to create campaign" },
      { status: 500 }
    );
  }
}
