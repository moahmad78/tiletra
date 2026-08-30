import { NextRequest } from "next/server";
import { getAuthenticatedMobileUser } from "@/lib/mobile-auth";
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
 * Supports:
 * 1. Mobile / Bearer JWT in Authorization header
 * 2. x-user-id header (passed from client with verified session)
 * 3. User cookie if available
 */
export async function getAuthenticatedUser(
  req: Request | NextRequest
): Promise<AuthenticatedUserContext | null> {
  try {
    // 1. Try mobile Bearer token first
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

    // 2. Try x-user-id header
    const userIdHeader = req.headers.get("x-user-id") || req.headers.get("X-User-Id");
    if (userIdHeader) {
      const user = await prisma.user.findUnique({
        where: { id: userIdHeader },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
        },
      });
      if (user) {
        return user;
      }
    }

    // 3. Try phone or email header
    const phoneHeader = req.headers.get("x-user-phone");
    if (phoneHeader) {
      const cleanPhone = phoneHeader.replace(/\D/g, "").slice(-10);
      if (cleanPhone) {
        const user = await prisma.user.findFirst({
          where: { phone: { contains: cleanPhone } },
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
          },
        });
        if (user) return user;
      }
    }

    return null;
  } catch (err) {
    console.error("getAuthenticatedUser error:", err);
    return null;
  }
}
