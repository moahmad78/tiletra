import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedMobileUser, mobileApiResponse, handleMobileCorsOptions } from "@/lib/mobile-auth";

export async function OPTIONS() {
  return handleMobileCorsOptions();
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getAuthenticatedMobileUser(req);
    if (!user) {
      return mobileApiResponse({ success: false, error: "Unauthorized" }, 401);
    }

    await prisma.notification.updateMany({
      where: { userId: user.id, isRead: false },
      data: { isRead: true },
    });

    return mobileApiResponse({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (err: any) {
    console.error("Mobile mark all notifications read error:", err);
    return mobileApiResponse(
      { success: false, error: err.message || "Failed to update notifications" },
      500
    );
  }
}
