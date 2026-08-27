import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { getAuthBaseUrl, getOAuthSecret } from "@/lib/auth-url";
import { generateMobileTokens } from "@/lib/mobile-auth";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo";

function verifyAndExtractState(state: string | null, savedCookieState: string | undefined): { valid: boolean; intent: string; redirectTo: string } {
  if (!state) return { valid: false, intent: "", redirectTo: "" };

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
            return {
              valid: true,
              intent: payload.intent || "",
              redirectTo: payload.redirectTo || "",
            };
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
      return {
        valid: true,
        intent: payload.intent || "",
        redirectTo: payload.redirectTo || "",
      };
    } catch {}
    return { valid: true, intent: "", redirectTo: "" };
  }

  return { valid: false, intent: "", redirectTo: "" };
}

export async function GET(request: NextRequest) {
  const baseUrl = getAuthBaseUrl(request);
  const { searchParams } = new URL(request.url);

  console.log("[Google OAuth Callback]", {
    hostHeader: request.headers.get("host"),
    xForwardedHost: request.headers.get("x-forwarded-host"),
    xForwardedProto: request.headers.get("x-forwarded-proto"),
    requestUrl: request.url,
    derivedBaseUrl: baseUrl,
  });

  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  // User denied consent
  if (error) {
    return NextResponse.redirect(`${baseUrl}/?auth_error=${encodeURIComponent(error)}`);
  }

  // Dual State Verification (HMAC signature + cookie fallback)
  const savedCookieState = request.cookies.get("oauth_state")?.value;
  const { valid: isStateValid, intent, redirectTo: stateRedirectTo } = verifyAndExtractState(state, savedCookieState);

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

    // ─── 5. Redirect back to mobile app or web app ────────────────────────────
    if (intent === "mobile" || intent.startsWith("mobile") || stateRedirectTo) {
      const mobileTokens = generateMobileTokens(user);
      const mobileUserJson = encodeURIComponent(
        JSON.stringify({
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          avatar: user.avatar,
          phoneVerified: user.phoneVerified,
          emailVerified: user.emailVerified,
        })
      );

      const baseRedirect = stateRedirectTo || "intrihub://oauth";
      const separator = baseRedirect.includes("?") ? "&" : "?";
      const deepLink = `${baseRedirect}${separator}accessToken=${encodeURIComponent(
        mobileTokens.accessToken
      )}&refreshToken=${encodeURIComponent(
        mobileTokens.refreshToken
      )}&user=${mobileUserJson}`;

      const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Signing into IntriHub...</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      background: #052a51;
      color: #ffffff;
      text-align: center;
      padding: 24px;
      box-sizing: border-box;
    }
    .spinner {
      width: 44px;
      height: 44px;
      border: 4px solid rgba(255, 255, 255, 0.2);
      border-top-color: #f97316;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin-bottom: 20px;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    h2 { margin: 0 0 8px; font-size: 20px; font-weight: 700; }
    p { margin: 0 0 24px; font-size: 14px; opacity: 0.8; }
    .btn {
      display: inline-block;
      background: #f97316;
      color: #ffffff;
      padding: 12px 28px;
      border-radius: 9999px;
      text-decoration: none;
      font-weight: 700;
      font-size: 14px;
      box-shadow: 0 4px 12px rgba(249, 115, 22, 0.3);
    }
  </style>
</head>
<body>
  <div class="spinner"></div>
  <h2>Signing into IntriHub...</h2>
  <p>Returning to your app. If not redirected automatically:</p>
  <a id="deepLinkBtn" class="btn" href="${deepLink}">Open IntriHub App</a>
  <script>
    try {
      window.location.replace("${deepLink}");
    } catch(e) {
      window.location.href = "${deepLink}";
    }
    setTimeout(function() {
      var btn = document.getElementById("deepLinkBtn");
      if (btn) btn.click();
    }, 150);
  </script>
</body>
</html>`;

      return new NextResponse(html, {
        status: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      });
    }

    let redirectTo = "/";
    if (intent === "checkout") redirectTo = "/checkout";

    const response = NextResponse.redirect(`${baseUrl}${redirectTo}?google_session=${encoded}`);

    // Clear the CSRF state cookie
    response.cookies.set("oauth_state", "", { maxAge: 0, path: "/" });

    // Set persistent session cookie
    const isSecure = baseUrl.startsWith("https://");
    response.cookies.set("intrihub_session", encoded, {
      httpOnly: false,
      secure: isSecure,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });
    // Clear old legacy cookie
    response.cookies.set("tiletra_session", "", { maxAge: 0, path: "/" });

    return response;
  } catch (err) {
    console.error("Google OAuth callback error:", err);
    return NextResponse.redirect(`${baseUrl}/?auth_error=server_error`);
  }
}
