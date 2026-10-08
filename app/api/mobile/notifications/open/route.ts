import { NextRequest } from "next/server";
import { mobileApiResponse, handleMobileCorsOptions } from "@/lib/mobile-auth";
import { prisma as rawPrisma } from "@/lib/prisma";

const prisma = rawPrisma as any;

export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return handleMobileCorsOptions();
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { logId } = body;

    if (!logId) {
      return mobileApiResponse({ success: false, error: "logId is required" }, 400);
    }

    const updated = await prisma.notificationLog.updateMany({
      where: { id: logId },
      data: {
        status: "opened",
        openedAt: new Date(),
      },
    });

    return mobileApiResponse({ success: true, count: updated.count });
  } catch (err: any) {
    console.error("[NotificationOpen API Error]", err);
    return mobileApiResponse(
      { success: false, error: err?.message || "Failed to mark opened" },
      500
    );
  }
}
