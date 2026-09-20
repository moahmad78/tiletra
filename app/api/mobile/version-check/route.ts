import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { mobileApiResponse, handleMobileCorsOptions, getAuthenticatedAdmin } from "@/lib/mobile-auth";
import { sendExpoPushNotification } from "@/lib/push-notifications";

export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return handleMobileCorsOptions();
}

const DEFAULT_CONFIG = {
  customer: {
    packageName: "com.intrihub.app",
    latestVersion: "1.1.2",
    latestVersionCode: 5,
    minSupportedVersionCode: 3,
    forceUpdate: false,
    title: "New Update Available! 🚀",
    message: "A fresh update of IntriHub is here with faster loading, smooth checkout, and new features.",
    releaseNotes: [
      "Faster catalog & tiles browsing",
      "Instant live order tracking",
      "Performance & stability improvements",
    ],
    storeUrl: "market://details?id=com.intrihub.app",
    webUrl: "https://play.google.com/store/apps/details?id=com.intrihub.app",
  },
  business: {
    packageName: "com.intrihub.business",
    latestVersion: "1.0.4",
    latestVersionCode: 5,
    minSupportedVersionCode: 3,
    forceUpdate: false,
    title: "Business Update Available! 📦",
    message: "Update Intrihub Business for instant order chimes, real-time stock sync, and vendor performance enhancements.",
    releaseNotes: [
      "Instant sound alerts for incoming customer orders",
      "Enhanced catalog & stock management",
      "Android 15 launch crash fix & performance stability",
    ],
    storeUrl: "market://details?id=com.intrihub.business",
    webUrl: "https://play.google.com/store/apps/details?id=com.intrihub.business",
  },
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rawApp = searchParams.get("app") || "customer";
    const currentCodeParam = searchParams.get("currentVersionCode");
    const currentVersionCode = currentCodeParam ? parseInt(currentCodeParam, 10) : null;

    const isBusiness =
      rawApp.toLowerCase().includes("biz") ||
      rawApp.toLowerCase().includes("business") ||
      rawApp.toLowerCase() === "com.intrihub.business";

    const appKey = isBusiness ? "business" : "customer";

    // Attempt to read custom configuration stored in DB
    let activeConfig = { ...DEFAULT_CONFIG[appKey] };
    try {
      const setting = await prisma.setting.findUnique({
        where: { key: `app_version_config_${appKey}` },
      });
      if (setting?.value) {
        const parsed = JSON.parse(setting.value);
        activeConfig = { ...activeConfig, ...parsed };
      }
    } catch (dbErr) {
      console.warn("[VersionCheck DB Error, using default]", dbErr);
    }

    const updateAvailable =
      currentVersionCode !== null
        ? activeConfig.latestVersionCode > currentVersionCode
        : false;

    const forceUpdate =
      activeConfig.forceUpdate ||
      (currentVersionCode !== null &&
        currentVersionCode < activeConfig.minSupportedVersionCode);

    return mobileApiResponse({
      success: true,
      app: appKey,
      packageName: activeConfig.packageName,
      updateAvailable,
      forceUpdate,
      latestVersion: activeConfig.latestVersion,
      latestVersionCode: activeConfig.latestVersionCode,
      minSupportedVersionCode: activeConfig.minSupportedVersionCode,
      title: activeConfig.title,
      message: activeConfig.message,
      releaseNotes: activeConfig.releaseNotes,
      storeUrl: activeConfig.storeUrl,
      webUrl: activeConfig.webUrl,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("[Version Check Error]", error);
    return mobileApiResponse(
      { success: false, error: error?.message || "Failed to check version" },
      500
    );
  }
}

/**
 * Admin POST to update version configuration in real-time without redeploying,
 * and optionally broadcast a push notification to all users/vendors.
 */
export async function POST(req: NextRequest) {
  try {
    const adminCheck = await getAuthenticatedAdmin(req);
    if ("error" in adminCheck) {
      return mobileApiResponse({ success: false, error: adminCheck.error }, adminCheck.status);
    }

    const body = await req.json().catch(() => ({}));
    const {
      app = "customer",
      latestVersion,
      latestVersionCode,
      minSupportedVersionCode,
      forceUpdate,
      title,
      message,
      releaseNotes,
      broadcastPush = false,
    } = body;

    const isBusiness =
      app.toLowerCase().includes("biz") ||
      app.toLowerCase().includes("business") ||
      app.toLowerCase() === "com.intrihub.business";

    const appKey = isBusiness ? "business" : "customer";
    const settingKey = `app_version_config_${appKey}`;

    const existingSetting = await prisma.setting.findUnique({
      where: { key: settingKey },
    });
    let currentData = existingSetting?.value
      ? JSON.parse(existingSetting.value)
      : { ...DEFAULT_CONFIG[appKey] };

    if (latestVersion !== undefined) currentData.latestVersion = String(latestVersion);
    if (latestVersionCode !== undefined) currentData.latestVersionCode = Number(latestVersionCode);
    if (minSupportedVersionCode !== undefined) currentData.minSupportedVersionCode = Number(minSupportedVersionCode);
    if (forceUpdate !== undefined) currentData.forceUpdate = Boolean(forceUpdate);
    if (title !== undefined) currentData.title = String(title);
    if (message !== undefined) currentData.message = String(message);
    if (Array.isArray(releaseNotes)) currentData.releaseNotes = releaseNotes;

    await prisma.setting.upsert({
      where: { key: settingKey },
      update: { value: JSON.stringify(currentData) },
      create: { key: settingKey, value: JSON.stringify(currentData) },
    });

    let broadcastResult = null;
    if (broadcastPush) {
      // Find push token settings
      const tokenSettings = await prisma.setting.findMany({
        where: { key: { startsWith: "push_tokens_" } },
      });

      const allTokens = new Set<string>();
      for (const s of tokenSettings) {
        if (!s.value) continue;
        try {
          const parsed = JSON.parse(s.value);
          if (Array.isArray(parsed)) {
            for (const item of parsed) {
              const tokenStr = typeof item === "string" ? item : item.token;
              if (tokenStr && (tokenStr.startsWith("ExponentPushToken[") || tokenStr.startsWith("ExpoPushToken["))) {
                allTokens.add(tokenStr);
              }
            }
          }
        } catch {}
      }

      if (allTokens.size > 0) {
        broadcastResult = await sendExpoPushNotification({
          to: Array.from(allTokens),
          title: currentData.title || `🚀 Update Available v${currentData.latestVersion}!`,
          body: currentData.message || `A new update is available on Google Play. Tap to update now!`,
          data: {
            type: "app_update",
            storeUrl: currentData.storeUrl,
            webUrl: currentData.webUrl,
            version: currentData.latestVersion,
          },
        });
      }
    }

    return mobileApiResponse({
      success: true,
      message: `Updated version config for ${appKey} successfully!`,
      config: currentData,
      broadcastResult,
    });
  } catch (error: any) {
    console.error("[Version Check Admin Post Error]", error);
    return mobileApiResponse(
      { success: false, error: error?.message || "Failed to update version config" },
      500
    );
  }
}
