import { NextRequest, NextResponse } from "next/server";
import { processScheduledCampaigns } from "@/lib/campaign-runner";

/**
 * T8: Campaign Sender Cron Endpoint
 *
 * Runs every minute to dispatch due scheduled push campaigns.
 * URLs:
 *   GET  /api/cron/campaign-sender
 *   POST /api/cron/campaign-sender
 *
 * Auth:
 *   Optional CRON_SECRET check via Authorization: Bearer <CRON_SECRET>
 */
export async function GET(req: NextRequest) {
  return handleCampaignSender(req);
}

export async function POST(req: NextRequest) {
  return handleCampaignSender(req);
}

async function handleCampaignSender(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = req.headers.get("authorization");
    if (authHeader && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const startTime = Date.now();
    const result = await processScheduledCampaigns();
    const durationMs = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      durationMs,
      timestamp: new Date().toISOString(),
      ...result,
    });
  } catch (error: any) {
    console.error("[CampaignSender Cron] Fatal error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
