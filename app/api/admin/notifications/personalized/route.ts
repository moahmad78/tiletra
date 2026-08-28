import { NextRequest, NextResponse } from "next/server";
import { PersonalizedNotificationEngine } from "@/lib/notifications/personalized-notification-engine";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { userId, batch, limit } = body;

    if (userId) {
      const result = await PersonalizedNotificationEngine.generateAndSendForUser(userId);
      if (!result) {
        return NextResponse.json(
          { success: false, error: "Could not generate notification for user" },
          { status: 400 }
        );
      }
      return NextResponse.json({ success: true, result });
    }

    if (batch) {
      const results = await PersonalizedNotificationEngine.runBatchPersonalizedCampaign(limit ? Number(limit) : 50);
      return NextResponse.json({ success: true, count: results.length, results });
    }

    return NextResponse.json(
      { success: false, error: "Please specify userId or batch: true" },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("Personalized notification dispatch error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to dispatch personalized notifications" },
      { status: 500 }
    );
  }
}
