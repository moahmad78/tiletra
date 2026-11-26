import { NextRequest, NextResponse } from "next/server";
import { runHourlyAppUpdateReminder } from "@/lib/app-update-notifier";
import { getAuthenticatedAdmin } from "@/lib/mobile-auth";

export const dynamic = "force-dynamic";

/**
 * Hourly recurring app update reminder cron job.
 * Runs via VPS cron (`0 * * * *`) using Authorization: Bearer <CRON_SECRET>,
 * or can be triggered manually by an authenticated admin.
 * Sends Play Store update pushes with IntriHub's official ringtone (`ring.mp3`)
 * only to devices that have not yet updated to the latest version.
 */
async function handleAppUpdateReminder(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");
  const hasValidCronSecret = Boolean(cronSecret && authHeader === `Bearer ${cronSecret}`);

  if (!hasValidCronSecret) {
    const adminCheck = await getAuthenticatedAdmin(req);
    if ("error" in adminCheck) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
  }

  const { searchParams } = new URL(req.url);
  const force = searchParams.get("force") === "true";
  const dryRun = searchParams.get("dryRun") === "true";
  const includeUpdated = searchParams.get("all") === "true";

  try {
    const startTime = Date.now();
    const result = await runHourlyAppUpdateReminder({ force, dryRun, includeUpdated });
    const durationMs = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      durationMs,
      timestamp: new Date().toISOString(),
      ...result,
    });
  } catch (error: any) {
    console.error("[AppUpdateReminder Cron] Fatal error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  return handleAppUpdateReminder(req);
}

export async function POST(req: NextRequest) {
  return handleAppUpdateReminder(req);
}
