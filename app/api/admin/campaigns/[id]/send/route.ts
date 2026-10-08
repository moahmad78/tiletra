import { NextRequest, NextResponse } from "next/server";
import { prisma as rawPrisma } from "@/lib/prisma";
import { dispatchCampaign } from "@/lib/campaign-runner";
import { isKolkataQuietHours } from "@/lib/notification-service";
import { getNextKolkataActiveTime } from "@/lib/cart-reminder-runner";

const prisma = rawPrisma as any;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const { adminId } = body;

    const campaign = await prisma.campaign.findUnique({ where: { id } });
    if (!campaign) {
      return NextResponse.json({ success: false, error: "Campaign not found" }, { status: 404 });
    }

    if (campaign.status === "sending") {
      return NextResponse.json(
        { success: false, error: "Campaign is currently sending" },
        { status: 400 }
      );
    }

    const settings = await prisma.storeSettings.findFirst({
      select: {
        quietHoursStart: true,
        quietHoursEnd: true,
      },
    });

    const isQuiet = isKolkataQuietHours(
      settings?.quietHoursStart ?? "21:00",
      settings?.quietHoursEnd ?? "08:00"
    );

    if (isQuiet) {
      const nextActive = getNextKolkataActiveTime(settings?.quietHoursEnd ?? "08:00");
      const updated = await prisma.campaign.update({
        where: { id },
        data: {
          status: "scheduled",
          scheduledAt: nextActive,
        },
      });
      return NextResponse.json({
        success: true,
        scheduledForQuietHours: true,
        scheduledAt: nextActive,
        message: "Currently within quiet hours (21:00 - 08:00 IST). Campaign scheduled for 08:00 IST.",
        campaign: updated,
      });
    }

    const stats = await dispatchCampaign(id, { sentByAdminId: adminId });
    return NextResponse.json({
      success: true,
      sentNow: true,
      stats,
      campaign: await prisma.campaign.findUnique({ where: { id } }),
    });
  } catch (error: any) {
    console.error("[Campaign Send Now] error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to dispatch campaign" },
      { status: 500 }
    );
  }
}
