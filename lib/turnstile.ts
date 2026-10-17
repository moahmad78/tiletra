/**
 * Cloudflare Turnstile Verification Helper
 * Validates frontend CAPTCHA tokens against Cloudflare Siteverify API
 * Prevents automated bot submissions on Login & OTP endpoints.
 */

export interface TurnstileVerifyResult {
  success: boolean;
  error?: string;
  challengeTs?: string;
  hostname?: string;
}

export async function verifyTurnstileToken(
  token?: string | null,
  remoteIp?: string
): Promise<TurnstileVerifyResult> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;

  // If Turnstile is not configured in env (e.g. local dev / testing), allow gracefully unless in strict production
  if (!secretKey) {
    if (process.env.NODE_ENV === "production" && process.env.REQUIRE_TURNSTILE === "true") {
      return { success: false, error: "CAPTCHA service configuration missing." };
    }
    return { success: true };
  }

  if (!token || typeof token !== "string" || token.trim().length === 0) {
    return { success: false, error: "CAPTCHA verification is required. Please verify you are human." };
  }

  try {
    const formData = new URLSearchParams();
    formData.append("secret", secretKey);
    formData.append("response", token.trim());
    if (remoteIp) {
      formData.append("remoteip", remoteIp);
    }

    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: formData,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    if (!response.ok) {
      console.warn(`[TURNSTILE_API_ERROR] HTTP status=${response.status}`);
      return { success: false, error: "CAPTCHA verification service unavailable. Please try again." };
    }

    const data = await response.json();

    if (!data.success) {
      const errorCodes = data["error-codes"] || [];
      console.warn(`[TURNSTILE_VERIFY_FAILED] errors=${JSON.stringify(errorCodes)} ip=${remoteIp || "unknown"}`);
      return {
        success: false,
        error: "Bot protection challenge failed. Please refresh and try again.",
      };
    }

    return {
      success: true,
      challengeTs: data.challenge_ts,
      hostname: data.hostname,
    };
  } catch (err: any) {
    console.error("[TURNSTILE_NETWORK_ERROR]", err);
    return {
      success: false,
      error: "Unable to verify CAPTCHA. Please check your network connection.",
    };
  }
}
