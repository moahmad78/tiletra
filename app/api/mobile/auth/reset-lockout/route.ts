import { NextRequest } from "next/server";
import { mobileApiResponse, handleMobileCorsOptions, verifyJwt } from "@/lib/mobile-auth";
import {
  resetVendorLoginLockout,
  resetAdminLoginLockout,
  resetAllLockoutsForIp,
  clearAllLockouts,
  clearLockoutForTarget,
  resetFailedAttempts,
} from "@/lib/rate-limit";

export async function OPTIONS() {
  return handleMobileCorsOptions();
}

/**
 * Admin / Tester Override Endpoint
 * Manually clears active security lockouts without having to wait out the 15-minute timer.
 * Requires admin authentication or secret, and is disabled in production unless ENABLE_RESET_LOCKOUT=true.
 */
export async function POST(req: NextRequest) {
  try {
    const isProd = process.env.NODE_ENV === "production";
    const isExplicitlyEnabled = process.env.ENABLE_RESET_LOCKOUT === "true";

    // 1. Production environment guard
    if (isProd && !isExplicitlyEnabled) {
      return mobileApiResponse(
        { success: false, error: "Reset lockout endpoint is disabled in production." },
        403
      );
    }

    // 2. Authentication / Secret check
    const authHeader = req.headers.get("authorization");
    const adminSecretHeader = req.headers.get("x-admin-secret");
    const configuredSecret = (process.env.RESET_LOCKOUT_SECRET || process.env.ADMIN_SECRET || process.env.CRON_SECRET || "").trim();

    let isAuthorized = false;

    if (configuredSecret) {
      if (adminSecretHeader === configuredSecret || authHeader === `Bearer ${configuredSecret}`) {
        isAuthorized = true;
      }
    } else if (!isProd && adminSecretHeader === "dev-lockout-secret") {
      isAuthorized = true;
    }

    if (!isAuthorized && authHeader?.startsWith("Bearer ")) {
      const token = authHeader.substring(7).trim();
      const payload = verifyJwt(token);
      if (payload && (payload.role === "admin" || payload.role === "superadmin")) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return mobileApiResponse(
        { success: false, error: "Unauthorized. Valid admin credentials or secret required." },
        401
      );
    }

    const body = await req.json().catch(() => ({}));
    const { email, ip, all } = body;

    const clientIp =
      ip ||
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "127.0.0.1";

    if (all === true) {
      clearAllLockouts();
      return mobileApiResponse({
        success: true,
        message: "All security lockouts cleared globally across memory.",
      });
    }

    if (email && typeof email === "string" && email.trim()) {
      const cleanEmail = email.trim().toLowerCase();
      resetVendorLoginLockout(clientIp, cleanEmail);
      clearLockoutForTarget(cleanEmail);
      resetFailedAttempts(`otp-fail:${cleanEmail}`);
      resetFailedAttempts(`otp-cooldown:${cleanEmail}`);
    }

    resetAllLockoutsForIp(clientIp);
    clearLockoutForTarget(clientIp);

    return mobileApiResponse({
      success: true,
      message: `Security lockout successfully cleared for IP ${clientIp}${
        email ? ` and account ${email}` : ""
      }.`,
    });
  } catch (err: any) {
    console.error("[ResetLockout] Error clearing lockout:", err);
    return mobileApiResponse(
      { success: false, error: err?.message || "Failed to clear lockout" },
      500
    );
  }
}
