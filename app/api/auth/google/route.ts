import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getAuthBaseUrl, getOAuthSecret } from "@/lib/auth-url";

export async function GET(request: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: "Google OAuth not configured" }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const intent = searchParams.get("intent") || "";

  const baseUrl = getAuthBaseUrl(request);
  const redirectUri = `${baseUrl}/api/auth/callback/google`;

  console.log("[Google OAuth Initiation]", {
    hostHeader: request.headers.get("host"),
    xForwardedHost: request.headers.get("x-forwarded-host"),
    xForwardedProto: request.headers.get("x-forwarded-proto"),
    requestUrl: request.url,
    derivedBaseUrl: baseUrl,
    redirectUri,
  });

  // ─── HMAC-Signed Stateless CSRF State Token ──────────────────────────────
  // Encodes nonce, intent, creation timestamp, and 15-minute expiration
  const secret = getOAuthSecret();
  const statePayload = JSON.stringify({
    nonce: crypto.randomBytes(16).toString("hex"),
    intent,
    iat: Date.now(),
    exp: Date.now() + 15 * 60 * 1000, // 15 minutes
  });

  const payloadB64 = Buffer.from(statePayload).toString("base64url");
  const signature = crypto.createHmac("sha256", secret).update(payloadB64).digest("base64url");
  const state = `${payloadB64}.${signature}`;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    prompt: "select_account",
    state,
  });

  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

  const response = NextResponse.redirect(googleAuthUrl);

  // Set cookie for browser session tracking (supporting both root and subdomains)
  const isSecure = baseUrl.startsWith("https://");
  response.cookies.set("oauth_state", state, {
    httpOnly: true,
    secure: isSecure,
    sameSite: "lax",
    maxAge: 900, // 15 minutes
    path: "/",
  });

  return response;
}

