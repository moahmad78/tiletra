import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, validatePasswordStrength } from "@/lib/password-security";
import { generateCustomerSessionToken } from "@/lib/server-auth";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "127.0.0.1";

    // 1. IP rate limiting on account registrations
    const rateCheck = checkRateLimit(`signup-ip:${clientIp}`, 10, 60 * 1000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { success: false, error: "Too many registration attempts. Please try again later." },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { name, email, phone, password } = body;

    const cleanEmail = (email || "").toString().trim().toLowerCase();
    const cleanPhone = (phone || "").toString().replace(/\D/g, "");
    const cleanName = (name || "").toString().trim();

    if (!cleanPhone || cleanPhone.length !== 10) {
      return NextResponse.json(
        { success: false, error: "Please provide a valid 10-digit mobile number." },
        { status: 400 }
      );
    }

    if (cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return NextResponse.json(
        { success: false, error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    if (!password || typeof password !== "string") {
      return NextResponse.json(
        { success: false, error: "Password is required." },
        { status: 400 }
      );
    }

    const strength = validatePasswordStrength(password);
    if (!strength.valid) {
      return NextResponse.json(
        { success: false, error: strength.error || "Password does not meet complexity requirements." },
        { status: 400 }
      );
    }

    // 2. Check if user already exists in local PostgreSQL
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          cleanEmail ? { email: { equals: cleanEmail, mode: "insensitive" } } : {},
          { phone: cleanPhone },
        ],
      },
    });

    if (existingUser) {
      if (existingUser.passwordHash) {
        return NextResponse.json(
          {
            success: false,
            error: "An account with this email or phone number already exists. Please log in.",
          },
          { status: 409 }
        );
      }

      // User exists from OTP or OAuth but hasn't set password yet -> update password
      const passwordHash = hashPassword(password);
      const updatedUser = await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          name: cleanName || existingUser.name,
          email: cleanEmail || existingUser.email,
          passwordHash,
          authProvider: existingUser.authProvider || "credentials",
        },
      });

      const token = generateCustomerSessionToken(
        updatedUser.id,
        updatedUser.email || updatedUser.phone,
        updatedUser.role || "customer"
      );

      const safeUser = {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        role: updatedUser.role,
        avatar: updatedUser.avatar,
      };

      const response = NextResponse.json({
        success: true,
        message: "Password configured and account logged in successfully.",
        user: safeUser,
        token,
      });

      const isProduction = process.env.NODE_ENV === "production";
      const cookieMaxAge = 7 * 24 * 60 * 60;

      response.cookies.set("intrihub_token", token, {
        httpOnly: true,
        secure: isProduction,
        sameSite: "lax",
        maxAge: cookieMaxAge,
        path: "/",
      });

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

      return response;
    }

    // 3. Create new user in local DB with bcrypt-hashed password
    const passwordHash = hashPassword(password);

    const newUser = await prisma.user.create({
      data: {
        name: cleanName || `User ${cleanPhone.slice(-4)}`,
        email: cleanEmail || null,
        phone: cleanPhone,
        passwordHash,
        authProvider: "credentials",
        role: "customer",
        phoneVerified: false,
        emailVerified: false,
      },
    });

    // 4. Issue signed JWT session token
    const token = generateCustomerSessionToken(
      newUser.id,
      newUser.email || newUser.phone,
      newUser.role
    );

    const safeUser = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      phone: newUser.phone,
      role: newUser.role,
      avatar: newUser.avatar,
    };

    const response = NextResponse.json(
      {
        success: true,
        message: "Account created successfully.",
        user: safeUser,
        token,
      },
      { status: 201 }
    );

    const isProduction = process.env.NODE_ENV === "production";
    const cookieMaxAge = 7 * 24 * 60 * 60;

    response.cookies.set("intrihub_token", token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      maxAge: cookieMaxAge,
      path: "/",
    });

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

    return response;
  } catch (error: any) {
    console.error("[Auth API] Signup error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Internal server error during registration." },
      { status: 500 }
    );
  }
}
