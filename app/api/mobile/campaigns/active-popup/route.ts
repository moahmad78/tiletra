import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/mobile/campaigns/active-popup
 * Returns the currently active promotional in-app popup/banner for the customer mobile app.
 * Checks validity, expiration, and appTarget.
 */
export async function GET(req: NextRequest) {
  try {
    const now = new Date();

    // Find the latest active campaign with an enabled popup targeted at customers
    const campaign = await prisma.campaign.findFirst({
      where: {
        status: { in: ["sent", "scheduled"] },
        appTarget: { in: ["both", "customer"] },
        AND: [
          {
            OR: [
              { expiresAt: null },
              { expiresAt: { gt: now } },
            ],
          },
        ],
      },
      orderBy: { createdAt: "desc" },
    });

    if (!campaign || !campaign.popup) {
      return NextResponse.json({ success: true, popup: null });
    }

    const popupData = campaign.popup as any;
    if (!popupData || !popupData.enabled) {
      return NextResponse.json({ success: true, popup: null });
    }

    return NextResponse.json({
      success: true,
      popup: {
        id: campaign.id,
        title: campaign.title,
        body: campaign.body,
        accentColor: campaign.accentColor || "#052a51",
        layout: popupData.layout || "center_modal",
        bgColor: popupData.bgColor || "#052a51",
        imageUrl: popupData.imageUrl || campaign.imageUrl || null,
        ctaLabel: popupData.ctaLabel || campaign.ctaLabel || "Shop Now",
        deepLink: popupData.deepLink || campaign.target || "offers",
        countdownEndsAt: campaign.countdownEndsAt || null,
      },
    });
  } catch (err: any) {
    console.warn("[ActivePopupAPI] Error fetching active popup:", err?.message || err);
    return NextResponse.json({ success: false, popup: null, error: err?.message || "Internal error" }, { status: 500 });
  }
}
