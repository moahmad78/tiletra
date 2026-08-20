import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { getAuthBaseUrl, getOAuthSecret } from "@/lib/auth-url";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo";

function verifyAndExtractState(state: string | null, savedCookieState: string | undefined): { valid: boolean; intent: string } {
  if (!state) return { valid: false, intent: "" };

  const secret = getOAuthSecret();

  // 1. Direct HMAC validation of stateless state parameter
  if (state.includes(".")) {
    const [payloadB64, signature] = state.split(".");
    if (payloadB64 && signature) {
      const expectedSignature = crypto
        .createHmac("sha256", secret)
        .update(payloadB64)
        .digest("base64url");

      if (signature === expectedSignature) {
        try {
          const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf-8"));
          if (payload.exp && payload.exp > Date.now()) {
            return { valid: true, intent: payload.intent || "" };
          }
        } catch (e) {
          console.error("Error parsing verified state payload:", e);
        }
      }
    }
  }

  // 2. Cookie fallback validation (for backwards compatibility)
  if (savedCookieState && savedCookieState === state) {
    try {
      const b64 = state.includes(".") ? state.split(".")[0] : state;
      const payload = JSON.parse(Buffer.from(b64, "base64url").toString("utf-8"));
      return { valid: true, intent: payload.intent || "" };
    } catch {}
    return { valid: true, intent: "" };
  }

  return { valid: false, intent: "" };
}

export async function GET(request: NextRequest) {
  const baseUrl = getAuthBaseUrl(request);
  const { searchParams } = new URL(request.url);

  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  // User denied consent
  if (error) {
    return NextResponse.redirect(`${baseUrl}/?auth_error=${encodeURIComponent(error)}`);
  }

  // Dual State Verification (HMAC signature + cookie fallback)
  const savedCookieState = request.cookies.get("oauth_state")?.value;
  const { valid: isStateValid, intent } = verifyAndExtractState(state, savedCookieState);

  if (!isStateValid) {
    console.warn("OAuth state validation failed for state:", state, "cookie:", savedCookieState);
    return NextResponse.redirect(`${baseUrl}/?auth_error=state_mismatch`);
  }

  if (!code) {
    return NextResponse.redirect(`${baseUrl}/?auth_error=no_code`);
  }

  try {
    const clientId = process.env.GOOGLE_CLIENT_ID!;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET!;
    const redirectUri = `${baseUrl}/api/auth/callback/google`;

    // ─── 1. Exchange code for tokens ─────────────────────────────────────────
    const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      const err = await tokenRes.text();
      console.error("Google token exchange failed:", err);
      return NextResponse.redirect(`${baseUrl}/?auth_error=token_exchange_failed`);
    }

    const tokens = await tokenRes.json();
    const accessToken: string = tokens.access_token;

    // ─── 2. Fetch user profile ────────────────────────────────────────────────
    const profileRes = await fetch(GOOGLE_USERINFO_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!profileRes.ok) {
      return NextResponse.redirect(`${baseUrl}/?auth_error=profile_fetch_failed`);
    }

    const profile = await profileRes.json();
    const { email, name, picture: avatar } = profile as {
      sub: string;
      email: string;
      name: string;
      picture: string;
      email_verified: boolean;
    };

    if (!email) {
      return NextResponse.redirect(`${baseUrl}/?auth_error=no_email`);
    }

    // ─── 3. Upsert user in DB ─────────────────────────────────────────────────
    const syntheticPhone = `google_${email.replace(/[^a-z0-9]/gi, "_")}`;
    const existingByEmail = await prisma.user.findUnique({ where: { email } });

    let user;
    if (existingByEmail) {
      const shouldUpdateName =
        name && (!existingByEmail.name || existingByEmail.name.startsWith("User "));
      const shouldUpdateAvatar = avatar && !existingByEmail.avatar;

      user = await prisma.user.update({
        where: { id: existingByEmail.id },
        data: {
          emailVerified: true,
          authProvider: existingByEmail.authProvider || "google",
          name: shouldUpdateName ? name : undefined,
          avatar: shouldUpdateAvatar ? avatar : undefined,
        },
      });
    } else {
      const existingByPhone = await prisma.user.findUnique({ where: { phone: syntheticPhone } });
      if (existingByPhone) {
        user = await prisma.user.update({
          where: { id: existingByPhone.id },
          data: { email, emailVerified: true, authProvider: "google", name, avatar },
        });
      } else {
        user = await prisma.user.create({
          data: {
            email,
            phone: syntheticPhone,
            name,
            avatar,
            emailVerified: true,
            phoneVerified: false,
            authProvider: "google",
            role: "customer",
          },
        });
      }
    }

    // ─── 4. Set session payload ───────────────────────────────────────────────
    const sessionPayload = JSON.stringify({
      userId: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      phone: user.phone,
      phoneVerified: user.phoneVerified,
      createdAt: user.createdAt.toISOString(),
    });

    const encoded = Buffer.from(sessionPayload).toString("base64url");

    // ─── 5. Redirect back to app ─────────────────────────────────────────────
    let redirectTo = "/";
    if (intent === "checkout") redirectTo = "/checkout";

    const response = NextResponse.redirect(`${baseUrl}${redirectTo}?google_session=${encoded}`);

    // Clear the CSRF state cookie
    response.cookies.set("oauth_state", "", { maxAge: 0, path: "/" });

    // Set persistent session cookie
    const isSecure = baseUrl.startsWith("https://");
    response.cookies.set("tiletra_session", encoded, {
      httpOnly: false,
      secure: isSecure,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
  } catch (err) {
    console.error("Google OAuth callback error:", err);
    return NextResponse.redirect(`${baseUrl}/?auth_error=server_error`);
  }
}
