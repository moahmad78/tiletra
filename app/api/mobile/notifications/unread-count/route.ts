import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedMobileUser, mobileApiResponse, handleMobileCorsOptions } from "@/lib/mobile-auth";

export async function OPTIONS() {
  return handleMobileCorsOptions();
}

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedMobileUser(req);
    if (!user) {
      return mobileApiResponse({ success: true, unreadCount: 0 });
    }

    const unreadCount = await prisma.notification.count({
      where: { userId: user.id, isRead: false },
    });

    return mobileApiResponse({
      success: true,
      unreadCount,
    });
  } catch (err: any) {
    console.error("Mobile unread notification count error:", err);
    return mobileApiResponse({ success: true, unreadCount: 0 });
  }
}
