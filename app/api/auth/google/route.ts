import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

function getBaseUrl(request: NextRequest): string {
  // 1. Explicit production env var
  const envUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.BETTER_AUTH_URL;
  if (envUrl && !envUrl.includes("localhost")) {
    return envUrl.replace(/\/$/, "");
  }

  // 2. Derive dynamically from request headers
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || "";
  if (host.includes("tiletra.com")) {
    return "https://tiletra.com";
  }

  const proto = request.headers.get("x-forwarded-proto") || (request.url.startsWith("https") ? "https" : "http");
  if (host) {
    return `${proto}://${host}`;
  }

  // 3. Fallback based on NODE_ENV
  return process.env.NODE_ENV === "production" ? "https://tiletra.com" : "http://localhost:3000";
}

function getOAuthSecret(): string {
  return (
    process.env.NEXTAUTH_SECRET ||
    process.env.GOOGLE_CLIENT_SECRET ||
    "tiletra-super-secure-oauth-secret-key-2026"
  );
}

export async function GET(request: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: "Google OAuth not configured" }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const intent = searchParams.get("intent") || "";

  const baseUrl = getBaseUrl(request);
  const redirectUri = `${baseUrl}/api/auth/callback/google`;

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
  const isProd = process.env.NODE_ENV === "production" || baseUrl.includes("tiletra.com");
  response.cookies.set("oauth_state", state, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    maxAge: 900, // 15 minutes
    path: "/",
  });

  return response;
}
