import { NextRequest } from "next/server";
import { getAuthenticatedMobileUser, mobileApiResponse, handleMobileCorsOptions } from "@/lib/mobile-auth";
import { sendExpoPushNotification, registerPushToken } from "@/lib/push-notifications";
import { prisma } from "@/lib/prisma";

export async function OPTIONS() {
  return handleMobileCorsOptions();
}

// In-memory rate limiting (max 5 diagnostic pushes per minute per user)
const userTestHits = new Map<string, number[]>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const hits = userTestHits.get(userId) || [];
  const recentHits = hits.filter((t) => now - t < 60000);
  if (recentHits.length >= 5) {
    return false;
  }
  recentHits.push(now);
  userTestHits.set(userId, recentHits);
  return true;
}

/**
 * Diagnostic test push endpoint:
 * Sends an immediate real Expo push notification to the CURRENT authenticated user's registered devices.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedMobileUser(req);
    if (!user) {
      return mobileApiResponse({ success: false, error: "Unauthorized" }, 401);
    }

    if (!checkRateLimit(user.id)) {
      return mobileApiResponse(
        { success: false, error: "Too many test requests. Please wait a minute before retrying." },
        429
      );
    }

    const body = await req.json().catch(() => ({}));
    const { token, title, message } = body;

    // If an explicit token is passed, ensure it is registered for future deliveries
    if (token && typeof token === "string" && (token.startsWith("ExponentPushToken[") || token.startsWith("ExpoPushToken["))) {
      await registerPushToken({
        userId: user.id,
        role: user.role,
        token: token.trim(),
        platform: "android",
      }).catch(() => {});
    }

    // Fetch all active tokens for this user
    const [deviceTokens, mobileTokens, userRecord] = await Promise.all([
      prisma.deviceToken.findMany({
        where: { userId: user.id },
        select: { token: true },
      }),
      (prisma as any).mobilePushToken.findMany({
        where: { userId: user.id },
        select: { token: true },
      }),
      (prisma as any).user.findUnique({
        where: { id: user.id },
        select: { pushToken: true },
      }),
    ]);

    const tokenList = Array.from(
      new Set([
        ...(token ? [token.trim()] : []),
        ...(userRecord?.pushToken ? [userRecord.pushToken] : []),
        ...deviceTokens.map((d) => d.token),
        ...mobileTokens.map((m: any) => m.token),
      ])
    ).filter((t) => typeof t === "string" && (t.startsWith("ExponentPushToken[") || t.startsWith("ExpoPushToken[")));

    if (tokenList.length === 0) {
      return mobileApiResponse(
        {
          success: false,
          error: "No active Expo push tokens found for this user account. Open the app and grant notification permission to register.",
        },
        404
      );
    }

    const testPayload = {
      to: tokenList,
      userId: user.id,
      title: title || (user.role === "vendor" ? "📦 IntriHub Vendor Test" : "🔔 IntriHub Notification Test"),
      body: message || "Direct Expo push test. Tap to confirm notification delivery.",
      sound: "default",
      priority: "high" as const,
      channelId: "orders_high_importance",
      data: {
        type: "DIAG_TEST",
        timestamp: Date.now(),
        orderId: "TEST_DIAG_1",
        screen: user.role === "vendor" ? "/(vendor)/orders" : "/notifications",
      },
    };

    const result = await sendExpoPushNotification(testPayload);

    return mobileApiResponse({
      success: result.success,
      message: result.success
        ? `Diagnostic test push dispatched to ${tokenList.length} device token(s).`
        : result.error,
      ticket: result.ticket,
      tokensCount: tokenList.length,
      tokenSuffixes: tokenList.map((t) => `...${t.slice(-6)}`),
    });
  } catch (err: any) {
    console.error("[Test Push Error]", err);
    return mobileApiResponse({ success: false, error: err?.message || "Failed to send test push" }, 500);
  }
}

