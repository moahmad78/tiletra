import { NextRequest, NextResponse } from "next/server";
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

export async function POST(req: NextRequest) {
  try {
    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "127.0.0.1";

    // 1. IP-level rate limiting (max 15 attempts per minute)
    const rateCheck = checkRateLimit(`login-ip:${clientIp}`, 15, 60 * 1000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { success: false, error: "Too many login attempts. Please wait a minute." },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { username, email, phone, password } = body;

    const identifier = (email || phone || username || "").toString().trim().toLowerCase();
    const cleanPhone = identifier.replace(/\D/g, "");

    if (!identifier) {
      return NextResponse.json(
        { success: false, error: "Please enter your email or phone number." },
        { status: 400 }
      );
    }

    if (!password || typeof password !== "string" || !password.trim()) {
      return NextResponse.json(
        { success: false, error: "Please enter your password." },
        { status: 400 }
      );
    }

    // 2. Account-level brute-force lockout check
    const lockoutKey = `user-auth:${identifier}`;
    const lockoutStatus = isLockedOut(lockoutKey);
    if (lockoutStatus.locked) {
      const waitMinutes = Math.ceil(
        ((lockoutStatus.lockoutUntil || Date.now()) - Date.now()) / 60000
      );
      return NextResponse.json(
        {
          success: false,
          error: `Account temporarily locked due to repeated failed logins. Please retry in ${waitMinutes} minute(s).`,
        },
        { status: 423 }
      );
    }

    // 3. Query User directly from local PostgreSQL
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: identifier, mode: "insensitive" } },
          cleanPhone.length === 10 ? { phone: cleanPhone } : {},
          cleanPhone.length > 0 ? { phone: { contains: cleanPhone } } : {},
        ],
      },
      include: {
        vendor: true,
        addresses: {
          orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
          take: 5,
        },
      },
    });

    // Also check Vendor table if not found or if vendor is needed
    let vendor = user?.vendor || null;
    if (!vendor) {
      const foundVendor = await prisma.vendor.findFirst({
        where: {
          OR: [
            { contactEmail: { equals: identifier, mode: "insensitive" } },
            cleanPhone.length === 10 ? { contactPhone: cleanPhone } : {},
            { slug: identifier },
          ],
        },
        include: {
          owner: true,
        },
      });

      if (foundVendor) {
        vendor = foundVendor;
        if (foundVendor.owner && !user) {
          user = foundVendor.owner as any;
        }
      }
    }

    if (!user && !vendor) {
      recordFailedAttempt(lockoutKey, 5, 15 * 60 * 1000);
      return NextResponse.json(
        { success: false, error: "Invalid credentials. Please check your email/phone or password." },
        { status: 401 }
      );
    }

    const storedHash = user?.passwordHash || vendor?.passwordHash;
    if (!storedHash) {
      return NextResponse.json(
        {
          success: false,
          error: "Password login is not set up for this account. Please sign in with OTP or reset your password.",
        },
        { status: 400 }
      );
    }

    // 4. Verify password with bcrypt (and backward-compatible hashes)
    const isValid = verifyPassword(password.trim(), storedHash);
    if (!isValid) {
      const attempt = recordFailedAttempt(lockoutKey, 5, 15 * 60 * 1000);
      if (attempt.locked) {
        return NextResponse.json(
          {
            success: false,
            error: "Too many failed attempts. Account locked for 15 minutes.",
          },
          { status: 423 }
        );
      }
      return NextResponse.json(
        { success: false, error: "Invalid credentials. Please check your password." },
        { status: 401 }
      );
    }

    // Reset failed attempts upon successful authentication
    resetFailedAttempts(lockoutKey);

    // Resolve Role
    const allowedAdminEmail = (process.env.ADMIN_ALLOWED_EMAIL || "admin@intrihub.com").toLowerCase().trim();
    const isAdmin =
      user?.role === "admin" ||
      user?.email?.toLowerCase().trim() === allowedAdminEmail ||
      identifier === allowedAdminEmail;

    const isCpo = user?.role === "cpo" || identifier === "cpo@intrihub.com";
    const isVendor = user?.role === "vendor" || Boolean(vendor);

    let effectiveRole = "customer";
    if (isAdmin) effectiveRole = "admin";
    else if (isCpo) effectiveRole = "cpo";
    else if (isVendor) effectiveRole = "vendor";
    else if (user?.role) effectiveRole = user.role;

    const effectiveUserId = user?.id || vendor?.ownerId || vendor?.id || "user-id";
    const effectiveEmail = user?.email || vendor?.contactEmail || identifier;
    const effectiveName = user?.name || vendor?.businessName || "User";

    // 5. Generate signed JWT session token
    const token = generateCustomerSessionToken(
      effectiveUserId,
      effectiveEmail,
      effectiveRole
    );

    let redirectTo = "/account";
    if (effectiveRole === "admin") redirectTo = "/admin";
    else if (effectiveRole === "cpo") redirectTo = "/cpo";
    else if (effectiveRole === "vendor") redirectTo = "/vendor";

    const safeUser = {
      id: effectiveUserId,
      name: effectiveName,
      email: effectiveEmail,
      phone: user?.phone || vendor?.contactPhone,
      role: effectiveRole,
      avatar: user?.avatar,
      phoneVerified: user?.phoneVerified ?? false,
      emailVerified: user?.emailVerified ?? false,
      addresses: user?.addresses || [],
    };

    const response = NextResponse.json({
      success: true,
      message: "Login successful",
      user: safeUser,
      token,
      redirectTo,
    });

    // 6. Set HTTP-only secure cookie and client hydration cookie
    const isProduction = process.env.NODE_ENV === "production";
    const cookieMaxAge = 7 * 24 * 60 * 60; // 7 days

    response.cookies.set("intrihub_token", token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      maxAge: cookieMaxAge,
      path: "/",
    });

    // Mirror for NextAuth compatibility
    response.cookies.set("next-auth.session-token", token, {
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

    // Role-specific tokens for immediate privileged access
    if (effectiveRole === "admin") {
      const adminToken = generateAdminSessionToken(effectiveUserId, effectiveEmail);
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
          userId: effectiveUserId,
          email: effectiveEmail,
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

    if (effectiveRole === "vendor" && vendor) {
      const vendorToken = generateVendorSessionToken(
        vendor.id,
        vendor.ownerId || effectiveUserId,
        vendor.contactEmail || effectiveEmail
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
          vendorId: vendor.id,
          ownerId: vendor.ownerId || effectiveUserId,
          businessName: vendor.businessName,
          contactEmail: vendor.contactEmail,
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
      const cpoToken = await generateCpoSessionToken(effectiveUserId, effectiveEmail);
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
    console.error("[Auth API] Login error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Internal server error during login." },
      { status: 500 }
    );
  }
}
