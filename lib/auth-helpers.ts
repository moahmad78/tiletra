import { NextRequest } from "next/server";
import { getAuthenticatedMobileUser } from "@/lib/mobile-auth";
import { verifyAdminSessionToken, verifyVendorSessionToken } from "@/lib/server-auth";
import { prisma } from "@/lib/prisma";

export interface AuthenticatedUserContext {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  role: string;
}

/**
 * Extracts and verifies the authenticated user from a Request/NextRequest.
 * Strictly verifies cryptographic signatures:
 * 1. Mobile Bearer JWT in Authorization header
 * 2. Signed Admin session cookie (intrihub_admin_token)
 * 3. Signed Vendor session cookie (intrihub_vendor_token)
 *
 * NOTE: Blindly trusting unverified client headers (e.g. x-user-id, x-user-phone)
 * is eliminated to prevent authentication spoofing and IDOR attacks.
 */
export async function getAuthenticatedUser(
  req: Request | NextRequest
): Promise<AuthenticatedUserContext | null> {
  try {
    // 1. Mobile / Bearer JWT in Authorization header
    const mobileUser = await getAuthenticatedMobileUser(req);
    if (mobileUser) {
      return {
        id: mobileUser.id,
        name: mobileUser.name,
        email: mobileUser.email,
        phone: mobileUser.phone,
        role: mobileUser.role || "customer",
      };
    }

    // 2. Check cookies if available on request
    const cookieHeader = req.headers.get("cookie") || "";
    if (cookieHeader) {
      const cookiesMap = new Map<string, string>();
      cookieHeader.split(";").forEach((pair) => {
        const [k, v] = pair.trim().split("=");
        if (k && v) cookiesMap.set(k.trim(), decodeURIComponent(v.trim()));
      });

      // 2a. Admin signed session token
      const adminToken = cookiesMap.get("intrihub_admin_token");
      if (adminToken) {
        const verified = verifyAdminSessionToken(adminToken);
        if (verified.valid && verified.adminId) {
          const adminUser = await prisma.user.findUnique({
            where: { id: verified.adminId },
            select: { id: true, name: true, email: true, phone: true, role: true },
          });
          if (adminUser) return adminUser;
        }
      }

      // 2b. Vendor signed session token
      const vendorToken = cookiesMap.get("intrihub_vendor_token");
      if (vendorToken) {
        const verified = verifyVendorSessionToken(vendorToken);
        if (verified.valid && verified.ownerId) {
          const vendorOwner = await prisma.user.findUnique({
            where: { id: verified.ownerId },
            select: { id: true, name: true, email: true, phone: true, role: true },
          });
          if (vendorOwner) return vendorOwner;
        }
      }
    }

    return null;
  } catch (err) {
    console.error("getAuthenticatedUser error:", err);
    return null;
  }
}
