import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  generateMobileTokens,
  mobileApiResponse,
  handleMobileCorsOptions,
} from "@/lib/mobile-auth";
import {
  checkVendorLoginLockout,
  recordVendorLoginFailure,
  resetVendorLoginLockout,
} from "@/lib/rate-limit";
import { verifyPassword } from "@/lib/password-security";

export async function OPTIONS() {
  return handleMobileCorsOptions();
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { email, password, purpose = "business" } = body;
    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "127.0.0.1";

    // 1. IP Lockout Check
    const lockoutCheck = checkVendorLoginLockout(clientIp);
    if (lockoutCheck.locked) {
      const mins = Math.floor((lockoutCheck.retryAfterSeconds || 0) / 60);
      const secs = (lockoutCheck.retryAfterSeconds || 0) % 60;
      const timeStr = `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;

      return mobileApiResponse(
        {
          success: false,
          error: `Too many failed attempts. Security lockout active. Try again in ${timeStr}`,
          locked: true,
          lockoutUntil: lockoutCheck.lockoutUntil,
          retryAfterSeconds: lockoutCheck.retryAfterSeconds,
          remainingAttempts: 0,
        },
        429
      );
    }

    const cleanEmail = (email || "").trim().toLowerCase();
    if (!cleanEmail || !password) {
      return mobileApiResponse(
        { success: false, error: "Please enter both email address and password" },
        400
      );
    }

    const allowedAdminEmail = (process.env.ADMIN_ALLOWED_EMAIL || "admin@intrihub.com").toLowerCase().trim();
    const isAdmin = cleanEmail === allowedAdminEmail;

    if (isAdmin) {
      const adminUser = await prisma.user.findFirst({
        where: { email: { equals: cleanEmail, mode: "insensitive" } },
      });

      if (!adminUser || !adminUser.passwordHash) {
        return mobileApiResponse(
          { success: false, error: "Password authentication is not enabled for Super Admin. Please use Email OTP." },
          400
        );
      }

      const isValid = verifyPassword(password, adminUser.passwordHash);
      if (!isValid) {
        const failCheck = recordVendorLoginFailure(clientIp);
        if (failCheck.locked) {
          return mobileApiResponse(
            {
              success: false,
              error: "Too many failed attempts. Login locked for 15 minutes.",
              locked: true,
              lockoutUntil: failCheck.lockoutUntil,
              retryAfterSeconds: failCheck.retryAfterSeconds,
              remainingAttempts: 0,
            },
            429
          );
        }
        return mobileApiResponse(
          {
            success: false,
            error: `Invalid password. (${failCheck.remainingAttempts} attempt${failCheck.remainingAttempts === 1 ? "" : "s"} remaining before lockout)`,
            remainingAttempts: failCheck.remainingAttempts,
          },
          401
        );
      }

      resetVendorLoginLockout(clientIp);
      const tokens = await generateMobileTokens(adminUser);
      return mobileApiResponse({
        success: true,
        message: "Admin authenticated successfully",
        user: adminUser,
        tokens,
      });
    }

    // 2. Lookup Vendor
    const vendor = await prisma.vendor.findFirst({
      where: {
        OR: [
          { contactEmail: { equals: cleanEmail, mode: "insensitive" } },
          { owner: { email: { equals: cleanEmail, mode: "insensitive" } } },
        ],
      },
      include: { owner: true },
    });

    if (!vendor) {
      const failCheck = recordVendorLoginFailure(clientIp);
      if (failCheck.locked) {
        return mobileApiResponse(
          {
            success: false,
            reason: "NOT_FOUND",
            error: "Too many failed attempts. Login locked for 15 minutes.",
            locked: true,
            lockoutUntil: failCheck.lockoutUntil,
            retryAfterSeconds: failCheck.retryAfterSeconds,
            remainingAttempts: 0,
          },
          429
        );
      }
      return mobileApiResponse(
        {
          success: false,
          reason: "NOT_FOUND",
          error: `This email isn't registered as a vendor. (${failCheck.remainingAttempts} attempt${failCheck.remainingAttempts === 1 ? "" : "s"} remaining)`,
          remainingAttempts: failCheck.remainingAttempts,
        },
        403
      );
    }

    // 3. Status Verification
    if (vendor.status !== "approved") {
      return mobileApiResponse(
        {
          success: false,
          reason: vendor.status === "pending" ? "PENDING_APPROVAL" : "UNAPPROVED",
          error: `Vendor account status is '${vendor.status}'. Access denied before approval.`,
          vendorName: vendor.businessName,
        },
        403
      );
    }

    // 4. Verify Password Hash
    const storedHash = vendor.passwordHash || vendor.owner?.passwordHash;
    if (!storedHash) {
      return mobileApiResponse(
        {
          success: false,
          error: "Password login is not set up for this vendor account. Please log in with OTP.",
        },
        400
      );
    }

    const isValid = verifyPassword(password, storedHash);
    if (!isValid) {
      const failCheck = recordVendorLoginFailure(clientIp);
      if (failCheck.locked) {
        return mobileApiResponse(
          {
            success: false,
            error: "Too many failed attempts (3/3). Account locked for 15 minutes.",
            locked: true,
            lockoutUntil: failCheck.lockoutUntil,
            retryAfterSeconds: failCheck.retryAfterSeconds,
            remainingAttempts: 0,
          },
          429
        );
      }
      return mobileApiResponse(
        {
          success: false,
          error: `Invalid email or password. (${failCheck.remainingAttempts} attempt${failCheck.remainingAttempts === 1 ? "" : "s"} remaining before lockout)`,
          remainingAttempts: failCheck.remainingAttempts,
        },
        401
      );
    }

    // 5. Success: Reset lockout & issue tokens
    resetVendorLoginLockout(clientIp);

    const userForToken = vendor.owner || {
      id: vendor.ownerId,
      name: vendor.businessName,
      email: vendor.contactEmail,
      phone: vendor.contactPhone,
      role: "vendor",
    };

    const tokens = await generateMobileTokens(userForToken);

    return mobileApiResponse({
      success: true,
      message: "Vendor login successful",
      user: {
        id: userForToken.id,
        name: userForToken.name || vendor.businessName,
        email: userForToken.email || vendor.contactEmail,
        phone: userForToken.phone || vendor.contactPhone,
        role: "vendor",
      },
      vendor: {
        id: vendor.id,
        businessName: vendor.businessName,
        slug: vendor.slug,
        category: vendor.category,
        status: vendor.status,
        loginMethod: vendor.loginMethod,
      },
      tokens,
    });
  } catch (err: any) {
    console.error("login-password API error:", err);
    return mobileApiResponse(
      { success: false, error: err.message || "Failed to process password login" },
      500
    );
  }
}
