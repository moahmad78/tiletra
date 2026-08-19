import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo";

export async function GET(request: NextRequest) {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.BETTER_AUTH_URL ||
    (process.env.NODE_ENV === "production" ? "https://tiletra.com" : "http://localhost:3000");
  const { searchParams } = new URL(request.url);

  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  // User denied consent
  if (error) {
    return NextResponse.redirect(`${baseUrl}/?auth_error=${encodeURIComponent(error)}`);
  }

  // CSRF check: state must match cookie
  const savedState = request.cookies.get("oauth_state")?.value;
  if (!state || !savedState || state !== savedState) {
    return NextResponse.redirect(`${baseUrl}/?auth_error=state_mismatch`);
  }

  if (!code) {
    return NextResponse.redirect(`${baseUrl}/?auth_error=no_code`);
  }

  // Decode intent from state
  let intent = "";
  try {
    const parsed = JSON.parse(Buffer.from(state, "base64url").toString());
    intent = parsed.intent || "";
  } catch {}

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
    // Google profile fields: sub, email, name, picture, email_verified
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

    // Synthetic phone for email-only Google users (no phone yet)
    const syntheticPhone = `google_${email.replace(/[^a-z0-9]/gi, "_")}`;

    const existingByEmail = await prisma.user.findUnique({ where: { email } });

    let user;
    if (existingByEmail) {
      // Preserve manually customized name and avatar
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
      // Try to find a phone-based user with the same phone placeholder (shouldn't exist normally)
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

    // ─── 4. Set session cookie ────────────────────────────────────────────────

    // Session payload: just the user ID. The client reads this to fetch the profile.
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

    // ─── 5. Redirect back to app with session ─────────────────────────────────

    let redirectTo = "/";
    if (intent === "checkout") redirectTo = "/checkout";

    const response = NextResponse.redirect(`${baseUrl}${redirectTo}?google_session=${encoded}`);

    // Clear the CSRF state cookie
    response.cookies.set("oauth_state", "", { maxAge: 0, path: "/" });

    // Set a persistent (7-day) session cookie for SSR/server reads if needed later
    response.cookies.set("tiletra_session", encoded, {
      httpOnly: false, // needs to be readable by JS to populate Zustand store
      secure: process.env.NODE_ENV === "production",
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
