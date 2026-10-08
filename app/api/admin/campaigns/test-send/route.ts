import { NextRequest, NextResponse } from "next/server";
import { sendNotification } from "@/lib/notification-service";
import { prisma as rawPrisma } from "@/lib/prisma";

const prisma = rawPrisma as any;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      title,
      body: messageBody,
      imageUrl,
      target = "offers",
      platform = "all",
      adminId,
      recipientUserId,
      recipientPhone,
    } = body;

    let targetUserId = recipientUserId;

    if (!targetUserId && recipientPhone) {
      const cleanPhone = recipientPhone.replace(/\D/g, "");
      const foundUser = await prisma.user.findFirst({
        where: { phone: { contains: cleanPhone } },
        select: { id: true },
      });
      if (foundUser) {
        targetUserId = foundUser.id;
      }
    }

    if (!targetUserId && adminId) {
      targetUserId = adminId;
    }

    if (!targetUserId) {
      // Find any user with a device token as fallback for test
      const anyToken = await prisma.deviceToken.findFirst({
        select: { userId: true },
      });
      if (anyToken) {
        targetUserId = anyToken.userId;
      }
    }

    if (!targetUserId) {
      return NextResponse.json(
        { success: false, error: "No target user or device token found for test send." },
        { status: 400 }
      );
    }

    const result = await sendNotification({
      userId: targetUserId,
      type: "offer_campaign",
      title: `[TEST] ${title}`,
      body: messageBody,
      imageUrl,
      target,
      platformFilter: platform,
      sentByAdminId: adminId || "admin",
      ignoreQuietHours: true, // Test sends bypass quiet hours
      ignoreFrequencyCap: true, // Test sends bypass daily frequency cap
    });

    return NextResponse.json({
      success: result.success,
      status: result.status,
      skipReason: result.skipReason,
      targetUserId,
    });
  } catch (error: any) {
    console.error("[Campaign Test Send] error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to dispatch test notification" },
      { status: 500 }
    );
  }
}
