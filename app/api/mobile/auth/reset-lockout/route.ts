import { NextRequest } from "next/server";
import { mobileApiResponse, handleMobileCorsOptions } from "@/lib/mobile-auth";
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
 * Manually clears active security lockouts without having to wait out the 15-minute timer
 */
export async function POST(req: NextRequest) {
  try {
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
