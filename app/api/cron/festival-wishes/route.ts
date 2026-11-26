import { NextRequest, NextResponse } from "next/server";
import { prisma as rawPrisma } from "@/lib/prisma";
import { dispatchCampaign } from "@/lib/campaign-runner";

const prisma = rawPrisma as any;

/**
 * Daily Festival Wishes Automation Cron
 * Hits once daily (e.g. 08:30 IST).
 * Finds active festivals matching today's month and day, creates a WISH campaign,
 * dispatches it, and updates `lastSentYear`.
 */
export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = req.headers.get("authorization");
    if (authHeader && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const now = new Date();
    const currentMonth = now.getUTCMonth();
    const currentDay = now.getUTCDate();
    const currentYear = now.getUTCFullYear();

    const festivals = await prisma.festivalEvent.findMany({
      where: { autoSend: true },
    });

    const matchingFestivals = festivals.filter((f: any) => {
      const d = new Date(f.date);
      const isToday = d.getUTCMonth() === currentMonth && d.getUTCDate() === currentDay;
      const notSentThisYear = f.lastSentYear !== currentYear;
      return isToday && notSentThisYear;
    });

    const results = [];

    for (const fest of matchingFestivals) {
      const template = fest.template || {};
      const campaign = await prisma.campaign.create({
        data: {
          title: template.title || `Happy ${fest.name}! 🎉`,
          body: template.body || `Wishing you prosperity on ${fest.name} from IntriHub!`,
          imageUrl: template.imageUrl || null,
          target: template.deepLink || "offers",
          type: "WISH",
          accentColor: template.accentColor || "#F97316",
          ctaLabel: template.ctaLabel || "View Festival Deals",
          recurrence: "none",
          appTarget: "both",
          sendMode: "manual",
          status: "sending",
          audience: { type: "all" },
          platforms: "all",
          createdBy: "automation:festival",
        },
      });

      const stats = await dispatchCampaign(campaign.id, { sentByAdminId: "automation:festival" });

      await prisma.festivalEvent.update({
        where: { id: fest.id },
        data: { lastSentYear: currentYear },
      });

      results.push({ festivalId: fest.id, name: fest.name, campaignId: campaign.id, stats });
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      festivals: results,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("[Festival Wishes Cron] Error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to process festival wishes" },
      { status: 500 }
    );
  }
}
