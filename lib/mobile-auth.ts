import { createHmac, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOAuthSecret } from "@/lib/auth-url";

export interface MobileTokenPayload {
  userId: string;
  role: string;
  email?: string | null;
  phone?: string | null;
  name?: string | null;
  type: "access" | "refresh";
  exp: number; // unix timestamp in seconds
  iat: number;
}

const ACCESS_TOKEN_EXPIRY = 30 * 24 * 60 * 60; // 30 days in seconds
const REFRESH_TOKEN_EXPIRY = 90 * 24 * 60 * 60; // 90 days in seconds

function base64UrlEncode(str: string): string {
  return Buffer.from(str)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  return Buffer.from(base64, "base64").toString("utf8");
}

function sign(headerAndPayload: string, secret: string): string {
  const hmac = createHmac("sha256", secret);
  hmac.update(headerAndPayload);
  return hmac
    .digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

export function createJwt(payload: Omit<MobileTokenPayload, "iat" | "exp">, expiresInSeconds: number): string {
  const secret = getOAuthSecret();
  const now = Math.floor(Date.now() / 1000);
  const fullPayload: MobileTokenPayload = {
    ...payload,
    iat: now,
    exp: now + expiresInSeconds,
  };

  const header = { alg: "HS256", typ: "JWT" };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));
  const signature = sign(`${encodedHeader}.${encodedPayload}`, secret);

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

export function verifyJwt(token: string): MobileTokenPayload | null {
  try {
    if (!token || typeof token !== "string") return null;
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const [encodedHeader, encodedPayload, signature] = parts;
    const secret = getOAuthSecret();
    const expectedSignature = sign(`${encodedHeader}.${encodedPayload}`, secret);

    const sigBuf = Buffer.from(signature);
    const expectedBuf = Buffer.from(expectedSignature);

    if (sigBuf.length !== expectedBuf.length || !timingSafeEqual(sigBuf, expectedBuf)) {
      return null;
    }

    const payload: MobileTokenPayload = JSON.parse(base64UrlDecode(encodedPayload));
    const now = Math.floor(Date.now() / 1000);

    if (payload.exp && payload.exp < now) {
      return null; // Expired
    }

    return payload;
  } catch {
    return null;
  }
}

export function generateMobileTokens(user: {
  id: string;
  role?: string;
  email?: string | null;
  phone?: string | null;
  name?: string | null;
}) {
  const allowedAdminEmail = (process.env.ADMIN_ALLOWED_EMAIL || "admin@intrihub.com").toLowerCase().trim();
  let role = user.role || "customer";
  if ((role === "admin" || role === "superadmin") && user.email?.toLowerCase().trim() !== allowedAdminEmail) {
    role = "customer";
  }

  const basePayload = {
    userId: user.id,
    role,
    email: user.email || null,
    phone: user.phone || null,
    name: user.name || null,
  };

  const accessToken = createJwt({ ...basePayload, type: "access" }, ACCESS_TOKEN_EXPIRY);
  const refreshToken = createJwt({ ...basePayload, type: "refresh" }, REFRESH_TOKEN_EXPIRY);

  return {
    accessToken,
    refreshToken,
    expiresIn: ACCESS_TOKEN_EXPIRY,
  };
}

export async function getAuthenticatedMobileUser(req: Request | NextRequest) {
  try {
    const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null;
    }

    const token = authHeader.substring(7).trim();
    const payload = verifyJwt(token);

    if (!payload || payload.type !== "access") {
      return null;
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        addresses: {
          orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
        },
      },
    });

    return user;
  } catch (err) {
    console.error("getAuthenticatedMobileUser error:", err);
    return null;
  }
}

export async function getAuthenticatedAdmin(req: Request | NextRequest) {
  const user = await getAuthenticatedMobileUser(req);
  if (!user) {
    return { error: "Access denied", status: 401 as const };
  }
  const allowedAdminEmail = (process.env.ADMIN_ALLOWED_EMAIL || "admin@intrihub.com").toLowerCase().trim();
  const isAdmin =
    (user.role === "admin" || user.role === "superadmin") &&
    user.email?.toLowerCase().trim() === allowedAdminEmail;

  if (!isAdmin) {
    return { error: "Access denied", status: 403 as const };
  }
  return { user };
}

/**
 * Returns JSON response with standard CORS headers for mobile clients.
 */
export function mobileApiResponse(data: any, status = 200, headersInit?: HeadersInit) {
  const headers = new Headers(headersInit);
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH");
  headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, Accept");
  headers.set("Content-Type", "application/json");

  return NextResponse.json(data, { status, headers });
}

export function handleMobileCorsOptions() {
  const headers = new Headers();
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH");
  headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, Accept");
  headers.set("Access-Control-Max-Age", "86400");
  return new NextResponse(null, { status: 204, headers });
}
