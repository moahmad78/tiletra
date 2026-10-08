import { NextRequest, NextResponse } from "next/server";
import { runCartRemindersJob } from "@/lib/cart-reminder-runner";

/**
 * T6: Scheduled Cart Reminders Cron Endpoint
 *
 * Runs every 5 minutes (or shortest cron interval).
 * URLs:
 *   GET  /api/cron/cart-reminders
 *   POST /api/cron/cart-reminders?force=true (for manual admin trigger / testing)
 *
 * Auth:
 *   Optional CRON_SECRET check via Authorization: Bearer <CRON_SECRET>
 */
export async function GET(req: NextRequest) {
  return handleCartReminders(req);
}

export async function POST(req: NextRequest) {
  return handleCartReminders(req);
}

async function handleCartReminders(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = req.headers.get("authorization");
    if (authHeader && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
  }

  const { searchParams } = new URL(req.url);
  const forceNow = searchParams.get("force") === "true";

  try {
    const startTime = Date.now();
    const result = await runCartRemindersJob({ forceNow });
    const durationMs = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      durationMs,
      timestamp: new Date().toISOString(),
      ...result,
    });
  } catch (error: any) {
    console.error("[CartReminders Cron] Fatal error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
