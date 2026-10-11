import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { mobileApiResponse, handleMobileCorsOptions } from "@/lib/mobile-auth";
import { getAuthenticatedVendor } from "../dashboard/route";

export async function OPTIONS() {
  return handleMobileCorsOptions();
}

/**
 * Registers an iOS PushKit VoIP push token for the vendor's device.
 * Stored with platform = 'ios_voip' to distinguish from standard Expo push tokens.
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthenticatedVendor(req);
    if ("error" in auth) {
      return mobileApiResponse({ success: false, error: auth.error }, auth.status as any);
    }

    const body = await req.json().catch(() => ({}));
    const { voipToken, appVersion } = body;

    if (!voipToken || typeof voipToken !== "string" || voipToken.trim().length === 0) {
      return mobileApiResponse({ success: false, error: "Valid VoIP token is required" }, 400);
    }

    const cleanToken = voipToken.trim();

    // Upsert into DeviceToken table with platform: 'ios_voip' and role: 'vendor'
    const deviceToken = await prisma.deviceToken.upsert({
      where: { token: cleanToken },
      update: {
        userId: auth.user.id,
        role: "vendor",
        platform: "ios_voip",
        appVersion: appVersion || null,
        lastSeenAt: new Date(),
      },
      create: {
        userId: auth.user.id,
        role: "vendor",
        platform: "ios_voip",
        token: cleanToken,
        appVersion: appVersion || null,
        lastSeenAt: new Date(),
      },
    });

    return mobileApiResponse({
      success: true,
      message: "VoIP push token registered successfully for CallKit alerts",
      deviceTokenId: deviceToken.id,
    });
  } catch (error: any) {
    console.error("[Register VoIP Token Error]", error);
    return mobileApiResponse(
      { success: false, error: error?.message || "Failed to register VoIP token" },
      500
    );
  }
}
