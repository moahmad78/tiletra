import { cookies } from "next/headers";
import crypto from "crypto";

const ADMIN_SECRET =
  process.env.ADMIN_SESSION_SECRET ||
  process.env.JWT_SECRET ||
  process.env.NEXTAUTH_SECRET ||
  "intrihub-admin-secure-key-2026";

const VENDOR_SECRET =
  process.env.VENDOR_SESSION_SECRET ||
  process.env.JWT_SECRET ||
  process.env.NEXTAUTH_SECRET ||
  "intrihub-vendor-secure-key-2026";

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Generate a signed HMAC-SHA256 session token for authenticated admin
 */
export function generateAdminSessionToken(adminId: string, email: string): string {
  const payload = JSON.stringify({
    adminId,
    email: email.toLowerCase().trim(),
    iat: Date.now(),
    exp: Date.now() + SESSION_TTL_MS,
  });
  const base64Payload = Buffer.from(payload).toString("base64url");
  const signature = crypto
    .createHmac("sha256", ADMIN_SECRET)
    .update(base64Payload)
    .digest("base64url");
  return `${base64Payload}.${signature}`;
}

/**
 * Verify admin session token with constant-time signature comparison and expiration check
 */
export function verifyAdminSessionToken(token: string): {
  valid: boolean;
  email?: string;
  adminId?: string;
} {
  if (!token || typeof token !== "string" || !token.includes(".")) {
    return { valid: false };
  }

  const [base64Payload, signature] = token.split(".");
  if (!base64Payload || !signature) return { valid: false };

  const expectedSignature = crypto
    .createHmac("sha256", ADMIN_SECRET)
    .update(base64Payload)
    .digest("base64url");

  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expectedSignature);

  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return { valid: false };
  }

  try {
    const payload = JSON.parse(Buffer.from(base64Payload, "base64url").toString("utf8"));
    if (payload.exp && payload.exp < Date.now()) {
      return { valid: false }; // Expired session
    }
    return { valid: true, email: payload.email, adminId: payload.adminId };
  } catch {
    return { valid: false };
  }
}

/**
 * Generate a signed HMAC-SHA256 session token for authenticated vendor
 */
export function generateVendorSessionToken(
  vendorId: string,
  ownerId: string,
  email: string
): string {
  const payload = JSON.stringify({
    vendorId,
    ownerId,
    email: email.toLowerCase().trim(),
    iat: Date.now(),
    exp: Date.now() + SESSION_TTL_MS,
  });
  const base64Payload = Buffer.from(payload).toString("base64url");
  const signature = crypto
    .createHmac("sha256", VENDOR_SECRET)
    .update(base64Payload)
    .digest("base64url");
  return `${base64Payload}.${signature}`;
}

/**
 * Verify vendor session token with constant-time signature comparison and expiration check
 */
export function verifyVendorSessionToken(token: string): {
  valid: boolean;
  vendorId?: string;
  ownerId?: string;
  email?: string;
} {
  if (!token || typeof token !== "string" || !token.includes(".")) {
    return { valid: false };
  }

  const [base64Payload, signature] = token.split(".");
  if (!base64Payload || !signature) return { valid: false };

  const expectedSignature = crypto
    .createHmac("sha256", VENDOR_SECRET)
    .update(base64Payload)
    .digest("base64url");

  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expectedSignature);

  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return { valid: false };
  }

  try {
    const payload = JSON.parse(Buffer.from(base64Payload, "base64url").toString("utf8"));
    if (payload.exp && payload.exp < Date.now()) {
      return { valid: false }; // Expired session
    }
    return {
      valid: true,
      vendorId: payload.vendorId,
      ownerId: payload.ownerId,
      email: payload.email,
    };
  } catch {
    return { valid: false };
  }
}

/**
 * Helper to check if caller has valid signed admin session
 * Note: Unsigned client-supplied cookies are strictly rejected.
 */
export async function checkIsAdmin(): Promise<boolean> {
  try {
    const allowedAdminEmail = (
      process.env.ADMIN_ALLOWED_EMAIL || "admin@intrihub.com"
    )
      .toLowerCase()
      .trim();
    const cookieStore = await cookies();

    const adminToken = cookieStore.get("intrihub_admin_token")?.value;
    if (adminToken) {
      const verified = verifyAdminSessionToken(adminToken);
      if (
        verified.valid &&
        verified.email?.toLowerCase().trim() === allowedAdminEmail
      ) {
        return true;
      }
    }

    return false;
  } catch {
    return false;
  }
}

/**
 * Helper to retrieve currently authenticated admin details from signed session token
 */
export async function getAdminSession(): Promise<{
  adminId: string;
  email: string;
} | null> {
  try {
    const allowedAdminEmail = (
      process.env.ADMIN_ALLOWED_EMAIL || "admin@intrihub.com"
    )
      .toLowerCase()
      .trim();
    const cookieStore = await cookies();
    const adminToken = cookieStore.get("intrihub_admin_token")?.value;
    if (!adminToken) return null;

    const verified = verifyAdminSessionToken(adminToken);
    if (
      verified.valid &&
      verified.adminId &&
      verified.email?.toLowerCase().trim() === allowedAdminEmail
    ) {
      return { adminId: verified.adminId, email: verified.email };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Helper to retrieve authenticated vendor session from signed HTTP-only cookie
 */
export async function getAuthenticatedVendor(): Promise<{
  vendorId: string;
  ownerId: string;
  email: string;
} | null> {
  try {
    const cookieStore = await cookies();
    const vendorToken = cookieStore.get("intrihub_vendor_token")?.value;
    if (!vendorToken) return null;

    const verified = verifyVendorSessionToken(vendorToken);
    if (verified.valid && verified.vendorId && verified.ownerId && verified.email) {
      return {
        vendorId: verified.vendorId,
        ownerId: verified.ownerId,
        email: verified.email,
      };
    }
    return null;
  } catch {
    return null;
  }
}
