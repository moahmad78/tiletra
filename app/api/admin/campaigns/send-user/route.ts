import { NextRequest, NextResponse } from "next/server";
import { prisma as rawPrisma } from "@/lib/prisma";
import { sendNotification } from "@/lib/notification-service";

const prisma = rawPrisma as any;

/**
 * Search users by query for "Send to one user"
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = (searchParams.get("q") || "").trim();

    if (!query || query.length < 2) {
      return NextResponse.json({ success: true, users: [] });
    }

    const cleanDigits = query.replace(/\D/g, "");

    const users = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { email: { contains: query, mode: "insensitive" } },
          ...(cleanDigits ? [{ phone: { contains: cleanDigits } }] : []),
        ],
      },
      take: 10,
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        deviceTokens: {
          select: { platform: true, lastSeenAt: true },
        },
      },
    });

    return NextResponse.json({ success: true, users });
  } catch (error: any) {
    console.error("[Send User Search] GET error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to search users" },
      { status: 500 }
    );
  }
}

/**
 * Send direct support message to one user (Rule R-14)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, title, body: messageBody, adminId, adminName } = body;

    if (!userId) {
      return NextResponse.json({ success: false, error: "User ID is required" }, { status: 400 });
    }
    if (!title || title.trim().length === 0) {
      return NextResponse.json({ success: false, error: "Title is required" }, { status: 400 });
    }
    if (!messageBody || messageBody.trim().length === 0) {
      return NextResponse.json({ success: false, error: "Message body is required" }, { status: 400 });
    }

    // Rule R-14: Support message ignores daily cap and quiet hours
    const result = await sendNotification({
      userId,
      type: "direct_support",
      title: title.trim(),
      body: messageBody.trim(),
      target: "offers",
      sentByAdminId: adminId || adminName || "admin",
      ignoreQuietHours: true,
      ignoreFrequencyCap: true,
    });

    return NextResponse.json({
      success: result.success,
      status: result.status,
      skipReason: result.skipReason,
      logId: result.logId,
      tokensCount: result.tokensCount,
    });
  } catch (error: any) {
    console.error("[Send User] POST error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to send message to user" },
      { status: 500 }
    );
  }
}
