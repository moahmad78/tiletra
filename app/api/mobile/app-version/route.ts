import { NextRequest } from "next/server";
import {
  handleMobileCorsOptions,
  mobileApiResponse,
} from "@/lib/mobile-auth";
import { resolveAppVersionPolicy } from "@/lib/semver";

export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return handleMobileCorsOptions();
}

/**
 * GET /api/mobile/app-version (Legacy & Backward-Compatible)
 * Delegates to the unified resolveAppVersionPolicy engine.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const platform = (searchParams.get("platform") || "android").toLowerCase().trim() as "android" | "ios";
    const rawApp = (searchParams.get("app") || "customer").toLowerCase().trim();
    const app: "customer" | "business" =
      rawApp.includes("biz") || rawApp.includes("business") || rawApp.includes("vendor")
        ? "business"
        : "customer";

    const installedVersion =
      searchParams.get("installedVersion") || searchParams.get("version") || null;
    const rawCode =
      searchParams.get("installedVersionCode") || searchParams.get("versionCode") || null;
    const installedVersionCode = rawCode ? parseInt(rawCode, 10) : null;

    const result = await resolveAppVersionPolicy({
      app,
      platform,
      installedVersion,
      installedVersionCode: isNaN(Number(installedVersionCode)) ? null : installedVersionCode,
    });

    return mobileApiResponse(result);
  } catch (error: any) {
    console.error("[app-version Error]", error);
    try {
      const globalSentry = (globalThis as any).Sentry;
      if (globalSentry && typeof globalSentry.captureException === "function") {
        globalSentry.captureException(error, { extra: { endpoint: "GET /api/mobile/app-version" } });
      }
    } catch {}
    return mobileApiResponse(
      {
        success: false,
        error: error?.message || "Failed to fetch app version configuration",
      },
      500
    );
  }
}
