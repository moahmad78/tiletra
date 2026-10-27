import { NextRequest } from "next/server";
import {
  handleMobileCorsOptions,
  mobileApiResponse,
} from "@/lib/mobile-auth";
import { resolveAppVersionPolicy } from "@/lib/semver";
import { checkRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return handleMobileCorsOptions();
}

/**
 * GET /api/mobile/app-config
 * Public, rate-limited, short-cached configuration endpoint per PRD.
 *
 * Query params:
 * - app: "customer" | "business" (default: "customer")
 * - platform: "android" | "ios" (default: "android")
 * - version?: string (installed version, e.g. "1.2.17")
 * - versionCode?: string | number (installed version code, e.g. 36)
 */
export async function GET(req: NextRequest) {
  try {
    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "127.0.0.1";

    // Rate limiting: max 60 calls per minute per IP
    const rateCheck = checkRateLimit(`app_config:${clientIp}`, 60, 60 * 1000);
    if (!rateCheck.allowed) {
      return mobileApiResponse(
        { success: false, error: "Too many configuration requests. Please try again shortly." },
        429
      );
    }

    const { searchParams } = new URL(req.url);
    const platform = (searchParams.get("platform") || "android").toLowerCase().trim() as "android" | "ios";
    const rawApp = (searchParams.get("app") || "customer").toLowerCase().trim();
    const app: "customer" | "business" =
      rawApp.includes("biz") || rawApp.includes("business") || rawApp.includes("vendor")
        ? "business"
        : "customer";

    const installedVersion =
      searchParams.get("version") || searchParams.get("installedVersion") || null;
    const rawCode =
      searchParams.get("versionCode") || searchParams.get("installedVersionCode") || null;
    const installedVersionCode = rawCode ? parseInt(rawCode, 10) : null;

    const result = await resolveAppVersionPolicy({
      app,
      platform,
      installedVersion,
      installedVersionCode: isNaN(Number(installedVersionCode)) ? null : installedVersionCode,
    });

    const response = mobileApiResponse(result);
    // Short cache headers (60s browser, 300s proxy/edge)
    response.headers.set("Cache-Control", "public, max-age=60, s-maxage=300");
    return response;
  } catch (error: any) {
    console.error("[app-config Error]", error);
    try {
      const globalSentry = (globalThis as any).Sentry;
      if (globalSentry && typeof globalSentry.captureException === "function") {
        globalSentry.captureException(error, { extra: { endpoint: "GET /api/mobile/app-config" } });
      }
    } catch {}
    return mobileApiResponse(
      {
        success: false,
        error: error?.message || "Failed to fetch app configuration",
      },
      500
    );
  }
}
