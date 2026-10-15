import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedMobileUser, mobileApiResponse, handleMobileCorsOptions } from "@/lib/mobile-auth";

export async function OPTIONS() {
  return handleMobileCorsOptions();
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedMobileUser(req);
    const body = await req.json().catch(() => ({}));
    const { token, platform = "android", deviceId } = body;

    if (!token || typeof token !== "string") {
      return mobileApiResponse({ success: false, error: "Push token is required" }, 400);
    }

    const userId = user ? user.id : body.userId;
    if (!userId) {
      return mobileApiResponse({ success: false, error: "User ID is required" }, 400);
    }

    // 1. Update User table directly
    try {
      await (prisma as any).user.update({
        where: { id: userId },
        data: { pushToken: token },
      });
    } catch (uErr) {
      console.warn("Could not save pushToken directly to User table:", uErr);
    }

    // 2. Upsert into MobilePushToken
    const record = await (prisma as any).mobilePushToken.upsert({
      where: { token },
      update: {
        userId,
        platform,
        deviceId: deviceId || undefined,
        updatedAt: new Date(),
      },
      create: {
        userId,
        token,
        platform,
        deviceId: deviceId || undefined,
      },
    });

    // 3. Upsert into DeviceToken
    try {
      await prisma.deviceToken.upsert({
        where: { token },
        update: {
          userId,
          role: user?.role || "customer",
          platform,
          lastSeenAt: new Date(),
        },
        create: {
          userId,
          role: user?.role || "customer",
          platform,
          token,
          lastSeenAt: new Date(),
        },
      });
    } catch (dErr) {
      console.warn("DeviceToken upsert warning:", dErr);
    }

    return mobileApiResponse({
      success: true,
      message: "Push token registered successfully",
      id: record.id,
    });
  } catch (err: any) {
    console.error("Mobile push register-token error:", err);
    return mobileApiResponse(
      { success: false, error: err.message || "Failed to register push token" },
      500
    );
  }
}
