import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password-security";
import {
  generateCustomerSessionToken,
  generateAdminSessionToken,
  generateVendorSessionToken,
} from "@/lib/server-auth";
import { generateCpoSessionToken } from "@/lib/cpo/auth";
import { CPO_SESSION_COOKIE } from "@/lib/config/cpo-permissions";
import {
  checkRateLimit,
  isLockedOut,
  recordFailedAttempt,
  resetFailedAttempts,
} from "@/lib/rate-limit";

// Helper to get client IP
function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "127.0.0.1"
  );
}

/**
 * NextAuth-Compatible Route Handler
 * Handles standard NextAuth endpoints:
 * - GET /api/auth/session -> Current active session
 * - GET /api/auth/csrf -> CSRF Token
 * - GET /api/auth/providers -> Configured OAuth & Credentials providers
 * - POST /api/auth/signin/credentials or /api/auth/callback/credentials -> Credentials verification
 * - POST /api/auth/signout -> Clear session cookies
 */

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ nextauth: string[] }> }
) {
  try {
    const params = await context.params;
    const pathParts = params?.nextauth || [];
    const action = pathParts[0] || "";

    // 1. Providers endpoint
    if (action === "providers") {
      const providers: Record<string, any> = {
        credentials: {
          id: "credentials",
          name: "Credentials",
          type: "credentials",
          credentials: {
            email: { label: "Email / Phone", type: "text" },
            password: { label: "Password", type: "password" },
          },
        },
      };

      if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
        providers.google = {
          id: "google",
          name: "Google",
          type: "oauth",
          signinUrl: "/api/auth/google",
          callbackUrl: "/api/auth/callback/google",
        };
      }

      return NextResponse.json(providers);
    }

    // 2. CSRF Token endpoint
    if (action === "csrf") {
      const csrfToken = crypto.randomBytes(32).toString("hex");
      const res = NextResponse.json({ csrfToken });
      res.cookies.set("next-auth.csrf-token", `${csrfToken}|${crypto.randomBytes(16).toString("hex")}`, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
      });
      return res;
    }

    // 3. Session endpoint
    if (action === "session") {
      const { getAuthenticatedUser } = await import("@/lib/auth-helpers");
      const authUser = await getAuthenticatedUser(req);
      if (!authUser) {
        return NextResponse.json(null);
      }

      return NextResponse.json({
        user: {
          id: authUser.id,
          name: authUser.name,
          email: authUser.email,
          role: authUser.role,
        },
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      });
    }

    // Fallback for signin page or other NextAuth queries
    if (action === "signin") {
      return NextResponse.redirect(new URL("/account", req.url));
    }

    return NextResponse.json({ ok: true, status: "nextauth-compat-active" });
  } catch (error: any) {
    console.error("[NextAuth GET Error]:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ nextauth: string[] }> }
) {
  try {
    const params = await context.params;
    const pathParts = params?.nextauth || [];
    const action = pathParts[0] || "";
    const subAction = pathParts[1] || "";

    const clientIp = getClientIp(req);

    // Signout handler
    if (action === "signout") {
      const res = NextResponse.json({ success: true, message: "Logged out successfully" });
      const cookiesToClear = [
        "intrihub_token",
        "intrihub_session",
        "next-auth.session-token",
        "__Secure-next-auth.session-token",
        "intrihub_admin_token",
        "intrihub_admin_session",
        "intrihub_vendor_token",
        "intrihub_vendor_session",
        CPO_SESSION_COOKIE,
      ];
      for (const c of cookiesToClear) {
        res.cookies.set(c, "", { maxAge: 0, path: "/" });
      }
      return res;
    }

    // Credentials sign-in handler: /api/auth/callback/credentials or /api/auth/signin/credentials
    const isCredentialsCallback =
      (action === "callback" && subAction === "credentials") ||
      (action === "signin" && subAction === "credentials") ||
      action === "credentials";

    if (!isCredentialsCallback) {
      // Default to credentials processing if posted directly
      // Or forward to NextAuth standard response
    }

    // Rate Limiting (15 attempts per minute per IP)
    const rateCheck = checkRateLimit(`nextauth-login-ip:${clientIp}`, 15, 60 * 1000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: "Too many login attempts. Please wait a minute." },
        { status: 429 }
      );
    }

    const contentType = req.headers.get("content-type") || "";
    let body: any = {};
    if (contentType.includes("application/json")) {
      body = await req.json().catch(() => ({}));
    } else if (contentType.includes("application/x-www-form-urlencoded")) {
      const formData = await req.formData().catch(() => null);
      if (formData) {
        formData.forEach((value, key) => {
          body[key] = value.toString();
        });
      }
    }

    const emailOrPhone = (body.email || body.username || body.phone || "").trim().toLowerCase();
    const password = (body.password || "").trim();

    if (!emailOrPhone) {
      return NextResponse.json({ error: "Email or phone number is required." }, { status: 400 });
    }
    if (!password) {
      return NextResponse.json({ error: "Password is required." }, { status: 400 });
    }

    // Brute-force protection
    const lockoutKey = `user-lockout:${emailOrPhone}`;
    const lockout = isLockedOut(lockoutKey);
    if (lockout.locked) {
      const waitMins = Math.ceil(((lockout.lockoutUntil || Date.now()) - Date.now()) / 60000);
      return NextResponse.json(
        { error: `Account temporarily locked due to repeated failed logins. Retry in ${waitMins} minute(s).` },
        { status: 423 }
      );
    }

    const cleanPhone = emailOrPhone.replace(/\D/g, "");

    // 1. Check local PostgreSQL `User` table
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: emailOrPhone, mode: "insensitive" } },
          cleanPhone.length === 10 ? { phone: cleanPhone } : {},
          cleanPhone.length > 0 ? { phone: { contains: cleanPhone } } : {},
        ],
      },
      include: {
        vendor: true,
      },
    });

    // 2. If not found in User, check PostgreSQL `Vendor` table
    let vendorRecord = user?.vendor || null;
    if (!vendorRecord) {
      const foundVendor = await prisma.vendor.findFirst({
        where: {
          OR: [
            { contactEmail: { equals: emailOrPhone, mode: "insensitive" } },
            cleanPhone.length === 10 ? { contactPhone: cleanPhone } : {},
            { slug: emailOrPhone },
          ],
        },
        include: {
          owner: true,
        },
      });

      if (foundVendor) {
        vendorRecord = foundVendor;
        if (foundVendor.owner && !user) {
          user = foundVendor.owner as any;
        }
      }
    }

    if (!user && !vendorRecord) {
      recordFailedAttempt(lockoutKey, 5, 15 * 60 * 1000);
      return NextResponse.json({ error: "Invalid email/phone or password." }, { status: 401 });
    }

    // Determine stored password hash (User.passwordHash or Vendor.passwordHash)
    const storedHash = user?.passwordHash || vendorRecord?.passwordHash || null;

    if (!storedHash) {
      return NextResponse.json(
        {
          error: "Password authentication is not configured for this account. Please sign in with OTP or reset password.",
        },
        { status: 400 }
      );
    }

    // Verify bcrypt/scrypt/sha256 password hash
    const isValid = verifyPassword(password, storedHash);
    if (!isValid) {
      const attempt = recordFailedAttempt(lockoutKey, 5, 15 * 60 * 1000);
      if (attempt.locked) {
        return NextResponse.json(
          { error: "Too many failed attempts. Account locked for 15 minutes." },
          { status: 423 }
        );
      }
      return NextResponse.json({ error: "Invalid email/phone or password." }, { status: 401 });
    }

    // Reset failed attempts on success
    resetFailedAttempts(lockoutKey);

    // Resolve user role
    const allowedAdminEmail = (process.env.ADMIN_ALLOWED_EMAIL || "admin@intrihub.com").toLowerCase().trim();
    const isAdmin =
      user?.role === "admin" ||
      user?.email?.toLowerCase().trim() === allowedAdminEmail ||
      emailOrPhone === allowedAdminEmail;

    const isCpo = user?.role === "cpo" || emailOrPhone === "cpo@intrihub.com";
    const isVendor = user?.role === "vendor" || Boolean(vendorRecord);

    let effectiveRole = "customer";
    if (isAdmin) effectiveRole = "admin";
    else if (isCpo) effectiveRole = "cpo";
    else if (isVendor) effectiveRole = "vendor";
    else if (user?.role) effectiveRole = user.role;

    const userId = user?.id || vendorRecord?.ownerId || vendorRecord?.id || "user-session";
    const userEmail = user?.email || vendorRecord?.contactEmail || emailOrPhone;
    const userName = user?.name || vendorRecord?.businessName || "User";

    // Generate tokens
    const customerToken = generateCustomerSessionToken(userId, userEmail, effectiveRole);

    let redirectUrl = "/account";
    if (effectiveRole === "admin") redirectUrl = "/admin";
    else if (effectiveRole === "cpo") redirectUrl = "/cpo";
    else if (effectiveRole === "vendor") redirectUrl = "/vendor";

    const isProduction = process.env.NODE_ENV === "production";
    const cookieMaxAge = 7 * 24 * 60 * 60; // 7 days

    const safeUser = {
      id: userId,
      name: userName,
      email: userEmail,
      phone: user?.phone || vendorRecord?.contactPhone,
      role: effectiveRole,
      avatar: user?.avatar,
    };

    const response = NextResponse.json({
      success: true,
      url: redirectUrl,
      redirectTo: redirectUrl,
      user: safeUser,
      token: customerToken,
    });

    // Set standard session cookies
    response.cookies.set("intrihub_token", customerToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      maxAge: cookieMaxAge,
      path: "/",
    });

    response.cookies.set("next-auth.session-token", customerToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      maxAge: cookieMaxAge,
      path: "/",
    });

    const clientSession = Buffer.from(JSON.stringify(safeUser)).toString("base64url");
    response.cookies.set("intrihub_session", clientSession, {
      httpOnly: false,
      secure: isProduction,
      sameSite: "lax",
      maxAge: cookieMaxAge,
      path: "/",
    });

    // Set role-specific authorization tokens
    if (effectiveRole === "admin") {
      const adminToken = generateAdminSessionToken(userId, userEmail);
      response.cookies.set("intrihub_admin_token", adminToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: "lax",
        maxAge: cookieMaxAge,
        path: "/",
      });
      response.cookies.set(
        "intrihub_admin_session",
        JSON.stringify({
          userId,
          email: userEmail,
          role: "admin",
          verifiedAt: new Date().toISOString(),
        }),
        {
          httpOnly: true,
          secure: isProduction,
          sameSite: "lax",
          maxAge: cookieMaxAge,
          path: "/",
        }
      );
    }

    if (effectiveRole === "vendor" && vendorRecord) {
      const vendorToken = generateVendorSessionToken(
        vendorRecord.id,
        vendorRecord.ownerId || userId,
        vendorRecord.contactEmail || userEmail
      );
      response.cookies.set("intrihub_vendor_token", vendorToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: "lax",
        maxAge: cookieMaxAge,
        path: "/",
      });
      response.cookies.set(
        "intrihub_vendor_session",
        JSON.stringify({
          vendorId: vendorRecord.id,
          ownerId: vendorRecord.ownerId || userId,
          businessName: vendorRecord.businessName,
          contactEmail: vendorRecord.contactEmail,
          role: "vendor",
          verifiedAt: new Date().toISOString(),
        }),
        {
          httpOnly: true,
          secure: isProduction,
          sameSite: "lax",
          maxAge: cookieMaxAge,
          path: "/",
        }
      );
    }

    if (effectiveRole === "cpo") {
      const cpoToken = await generateCpoSessionToken(userId, userEmail);
      response.cookies.set(CPO_SESSION_COOKIE, cpoToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: "lax",
        maxAge: cookieMaxAge,
        path: "/",
      });
    }

    return response;
  } catch (error: any) {
    console.error("[NextAuth POST Error]:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error during authentication." },
      { status: 500 }
    );
  }
}
