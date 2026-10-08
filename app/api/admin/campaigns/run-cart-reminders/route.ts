import { NextResponse } from "next/server";
import { runCartRemindersJob } from "@/lib/cart-reminder-runner";

export async function POST() {
  try {
    const startTime = Date.now();
    const result = await runCartRemindersJob({ forceNow: true });
    const durationMs = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      durationMs,
      timestamp: new Date().toISOString(),
      ...result,
    });
  } catch (error: any) {
    console.error("[Run Cart Reminders Now] error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to run cart reminders" },
      { status: 500 }
    );
  }
}
