import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  handleMobileCorsOptions,
  mobileApiResponse,
} from "@/lib/mobile-auth";
import {
  DEFAULT_APP_VERSION_SETTINGS,
  type AppVersionSettings,
  compareSemver,
} from "@/lib/semver";

export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return handleMobileCorsOptions();
}

/**
 * GET /api/mobile/app-version
 * Returns version policy per platform and app (customer / business)
 *
 * Query params:
 * - platform: "android" | "ios" (default: "android")
 * - app: "customer" | "business" | "vendor" (default: "customer")
 * - installedVersion?: string (optional, e.g. "1.2.4")
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rawPlatform = (searchParams.get("platform") || "android").toLowerCase().trim();
    const platform = rawPlatform.includes("ios") || rawPlatform.includes("apple") ? "ios" : "android";

    const rawApp = (searchParams.get("app") || "customer").toLowerCase().trim();
    const isBusiness =
      rawApp.includes("biz") ||
      rawApp.includes("business") ||
      rawApp.includes("vendor") ||
      rawApp === "com.intrihub.business";
    const appType: "customer" | "business" = isBusiness ? "business" : "customer";

    const installedVersion = searchParams.get("installedVersion") || searchParams.get("version") || null;

    // Fetch latest configuration from StoreSettings
    let versionConfig: AppVersionSettings = DEFAULT_APP_VERSION_SETTINGS;
    try {
      const settings = await prisma.storeSettings.findFirst({
        select: { appVersionConfig: true },
      });
      if (settings?.appVersionConfig) {
        versionConfig = {
          ...DEFAULT_APP_VERSION_SETTINGS,
          ...(settings.appVersionConfig as any),
        };
      }
    } catch (dbErr) {
      console.warn("[app-version] DB read fallback to defaults:", dbErr);
    }

    const targetConfig = versionConfig[appType]?.[platform] || DEFAULT_APP_VERSION_SETTINGS[appType][platform];

    const latestVersion = targetConfig.latestVersion || (appType === "business" ? "1.0.13" : "1.2.5");
    const minSupportedVersion = targetConfig.minSupportedVersion || (appType === "business" ? "1.0.10" : "1.2.0");
    const storeUrl = targetConfig.storeUrl || (platform === "ios" 
      ? "https://apps.apple.com/app/id6470000000"
      : `https://play.google.com/store/apps/details?id=${appType === "business" ? "com.intrihub.business" : "com.intrihub.app"}`);
    const message = targetConfig.message || "A fresh update is available with speed enhancements and bug fixes.";
    const title = targetConfig.title || "Update Available 🚀";
    const releaseNotes = targetConfig.releaseNotes || [];

    let updateAvailable = false;
    let forceUpdate = false;

    if (installedVersion) {
      updateAvailable = compareSemver(installedVersion, latestVersion) < 0;
      forceUpdate = compareSemver(installedVersion, minSupportedVersion) < 0;
    }

    return mobileApiResponse({
      success: true,
      platform,
      app: appType,
      latestVersion,
      minSupportedVersion,
      storeUrl,
      message,
      title,
      releaseNotes,
      installedVersion,
      updateAvailable,
      forceUpdate,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("[app-version Error]", error);
    return mobileApiResponse(
      {
        success: false,
        error: error?.message || "Failed to fetch app version configuration",
      },
      500
    );
  }
}
